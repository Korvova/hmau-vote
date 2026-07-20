/**
 * VotingPoller - Real-time polling of voting results during active voting
 * Similar to badge polling, but for vote results
 *
 * Polls CoCon API every 1-2 seconds during active voting to get:
 * - Individual votes (GetIndividualVotingResults)
 * - Aggregated counters (GetAmountOfVotes)
 *
 * Sends incremental updates to server via socket events
 */

const axios = require('axios');

class VotingPoller {
  constructor(socketClient, coconClient) {
    this.socket = socketClient;
    this.cocon = coconClient;

    // Polling state
    this.isPolling = false;
    this.pollInterval = null;
    this.currentVoting = null; // { idInDb, options, agendaSequence }

    // Track seen votes to avoid duplicates
    this.seenVotes = new Map(); // delegateId -> { optionId, choice, timestamp }

    // Track last aggregated state to detect changes
    this.lastAggregated = { votesFor: 0, votesAgainst: 0, votesAbstain: 0 };

    // Config
    this.pollIntervalMs = 2000; // Poll every 2 seconds
    this.requestTimeout = 5000; // 5 second timeout per request
  }

  /**
   * Start polling for an active voting
   * @param {Object} votingInfo - { idInDb, options, agendaSequence }
   */
  start(votingInfo) {
    if (this.isPolling) {
      console.log('[VotingPoller] Already polling, stopping previous...');
      this.stop();
    }

    this.currentVoting = votingInfo;
    this.seenVotes.clear();
    this.lastAggregated = { votesFor: 0, votesAgainst: 0, votesAbstain: 0 };

    console.log(`[VotingPoller] 🚀 Starting real-time polling for voting IdInDb=${votingInfo.idInDb}, agenda=${votingInfo.agendaSequence}`);
    console.log(`[VotingPoller] VotingOptions:`, JSON.stringify(votingInfo.options, null, 2));

    this.isPolling = true;

    // Start polling loop
    this.pollInterval = setInterval(() => {
      this._pollResults();
    }, this.pollIntervalMs);

    // Immediate first poll
    this._pollResults();
  }

  /**
   * Stop polling
   */
  stop() {
    if (!this.isPolling) {
      console.log('[VotingPoller] Not polling, nothing to stop');
      return;
    }

    console.log('[VotingPoller] 🛑 Stopping real-time polling');

    this.isPolling = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Final poll to get last results
    console.log('[VotingPoller] 📊 Final poll before stopping...');
    this._pollResults();

    this.currentVoting = null;
    this.seenVotes.clear();
  }

  /**
   * Poll for results (called by interval)
   */
  async _pollResults() {
    if (!this.isPolling || !this.currentVoting) {
      return;
    }

    const { idInDb, options, agendaSequence } = this.currentVoting;
    const coConBase = (this.cocon.cfg.coConBase || '').replace(/\/$/, '');

    try {
      // Poll individual votes
      await this._pollIndividualVotes(coConBase, idInDb, options, agendaSequence);

      // Poll aggregated counters (optional, can be calculated from individual votes)
      // await this._pollAggregatedVotes(coConBase, idInDb, agendaSequence);

    } catch (err) {
      console.error(`[VotingPoller] ❌ Poll error: ${err.message}`);
    }
  }

  /**
   * Poll individual votes and send delta to server
   */
  async _pollIndividualVotes(coConBase, idInDb, options, agendaSequence) {
    try {
      const url = `${coConBase}/Voting/GetIndividualVotingResults/?Id=${idInDb}`;
      const resp = await axios.get(url, { timeout: this.requestTimeout });

      // Parse response (can be string or object)
      let results = resp.data;
      if (typeof results === 'string') {
        results = results === '-1' ? [] : JSON.parse(results);
      }

      if (!Array.isArray(results)) {
        results = [];
      }

      if (results.length === 0) {
        // No votes yet, this is normal at start
        return;
      }

      console.log(`[VotingPoller] 📊 Polled ${results.length} individual votes from CoCon`);

      // Build mapping from VotingOptions
      const mapping = this._buildMapping(options);
      console.log(`[VotingPoller] Mapping:`, mapping);

      // Find new/changed votes
      const newVotes = [];
      for (const vote of results) {
        const { DelegateId, VotingOptionId, SeatNumber } = vote;
        const choice = mapping[VotingOptionId] || 'UNKNOWN';

        const seen = this.seenVotes.get(DelegateId);

        // Check if this is new or changed
        if (!seen || seen.optionId !== VotingOptionId) {
          console.log(`[VotingPoller] 🆕 ${seen ? 'Changed' : 'New'} vote: DelegateId=${DelegateId}, Option=${VotingOptionId} (${choice}), Seat=${SeatNumber}`);

          newVotes.push({
            delegateId: DelegateId,
            choice: choice,
            seatNumber: SeatNumber,
            votingOptionId: VotingOptionId
          });

          // Mark as seen
          this.seenVotes.set(DelegateId, {
            optionId: VotingOptionId,
            choice: choice,
            timestamp: Date.now()
          });
        }
      }

      // Send delta to server if there are new votes
      if (newVotes.length > 0) {
        console.log(`[VotingPoller] 📤 Sending ${newVotes.length} new/changed votes to server`);

        // Calculate aggregated from all seen votes
        const aggregated = this._calculateAggregated();

        const payload = {
          agendaSequence: agendaSequence,
          votes: newVotes,
          aggregated: aggregated,
          timestamp: new Date().toISOString()
        };

        console.log(`[VotingPoller] Payload:`, JSON.stringify(payload, null, 2));

        // Emit to server (same event as stopVoting uses)
        this.socket.emit('connector:voting:results', payload);

        console.log(`[VotingPoller] ✅ Sent to server: ${newVotes.length} votes, aggregated: FOR=${aggregated.votesFor}, AGAINST=${aggregated.votesAgainst}, ABSTAIN=${aggregated.votesAbstain}`);
      }

    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.log(`[VotingPoller] ⏱️ Timeout polling individual votes (normal if CoCon slow)`);
      } else {
        console.error(`[VotingPoller] ❌ Error polling individual votes: ${err.message}`);
      }
    }
  }

  /**
   * Build VotingOptionId -> choice mapping from VotingOptions
   */
  _buildMapping(options) {
    const mapping = {};

    if (!options || !Array.isArray(options)) {
      console.warn('[VotingPoller] ⚠️ No VotingOptions provided, cannot map choices!');
      return mapping;
    }

    for (const opt of options) {
      if (opt.Name === 'За') mapping[opt.Id] = 'FOR';
      else if (opt.Name === 'Против') mapping[opt.Id] = 'AGAINST';
      else if (opt.Name === 'Воздержался') mapping[opt.Id] = 'ABSTAIN';
    }

    return mapping;
  }

  /**
   * Calculate aggregated counters from seen votes
   */
  _calculateAggregated() {
    let votesFor = 0;
    let votesAgainst = 0;
    let votesAbstain = 0;

    for (const [delegateId, vote] of this.seenVotes) {
      if (vote.choice === 'FOR') votesFor++;
      else if (vote.choice === 'AGAINST') votesAgainst++;
      else if (vote.choice === 'ABSTAIN') votesAbstain++;
    }

    return {
      votesFor,
      votesAgainst,
      votesAbstain,
      totalVotes: votesFor + votesAgainst + votesAbstain
    };
  }
}

module.exports = VotingPoller;
