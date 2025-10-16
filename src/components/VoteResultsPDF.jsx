import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Cyrillic font from Google Fonts
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf',
      fontWeight: 'bold',
    },
    {
      src: 'https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu52xPKTM1K9nz.ttf',
      fontStyle: 'italic',
    },
  ],
});

// Styles for PDF matching the screenshot
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  meetingName: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dateText: {
    fontSize: 10,
    marginBottom: 15,
  },
  table: {
    display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    minHeight: 25,
  },
  tableRowLast: {
    flexDirection: 'row',
    minHeight: 25,
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableColNum: {
    width: '5%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableColQuestion: {
    width: '25%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 5,
    justifyContent: 'center',
  },
  tableColVoteName: {
    width: '20%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableColDecision: {
    width: '15%',
    borderRightWidth: 1,
    borderRightColor: '#000',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableColResults: {
    width: '35%',
    padding: 5,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 8,
    textAlign: 'center',
  },
  decisionText: {
    fontSize: 8,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  decisionAccepted: {
    color: '#006400',
  },
  decisionRejected: {
    color: '#b22222',
  },
  resultText: {
    fontSize: 8,
  },
  // Detailed report styles
  detailedHeader: {
    marginTop: 30,
    marginBottom: 20,
    borderTopWidth: 2,
    borderTopColor: '#000',
    paddingTop: 20,
  },
  detailedTitle: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  voteSection: {
    marginBottom: 30,
  },
  voteHeader: {
    fontSize: 12,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    width: '35%',
  },
  infoValue: {
    fontSize: 10,
    width: '65%',
  },
  summaryTable: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 8,
  },
  summaryRowLast: {
    flexDirection: 'row',
    padding: 8,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    width: '60%',
  },
  summaryValue: {
    fontSize: 10,
    width: '40%',
  },
  votersTable: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
  },
  votersRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 8,
  },
  votersRowLast: {
    flexDirection: 'row',
    padding: 8,
  },
  votersHeader: {
    fontSize: 11,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    backgroundColor: '#e0e0e0',
  },
  voterName: {
    fontSize: 10,
  },
  closedVoteMessage: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  noVotingMessage: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
    color: '#666',
  },
});

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day} ${month} ${year} года ${hours}:${minutes}:${seconds}`;
};

// Format date as "03 июля 2025 года"
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year} года`;
};

const VoteResultsPDF = ({ meeting, agendaItems, voteResults, participants = [] }) => {
  // Group vote results by agenda item
  const votesByAgenda = {};
  voteResults.forEach(vote => {
    if (!votesByAgenda[vote.agendaItemId]) {
      votesByAgenda[vote.agendaItemId] = [];
    }
    votesByAgenda[vote.agendaItemId].push(vote);
  });

  // Group voters by choice for each vote result
  const getVotersByChoice = (votes, allParticipants) => {
    const grouped = {
      FOR: [],
      AGAINST: [],
      ABSTAIN: [],
      ABSENT: [],
    };

    // First, add all who voted
    votes.forEach((vote) => {
      if (vote.choice && grouped[vote.choice]) {
        grouped[vote.choice].push(vote.user);
      }
    });

    // Find who didn't vote - add to ABSENT
    const votedUserIds = new Set(votes.map(v => v.user?.id).filter(Boolean));
    const didNotVote = allParticipants.filter(p => !votedUserIds.has(p.id));
    grouped.ABSENT = [...grouped.ABSENT, ...didNotVote];

    return grouped;
  };

  return (
    <Document>
      {/* First page: Summary table */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            ИНФОРМАЦИЯ О РЕЗУЛЬТАТАХ РАССМОТРЕНИЯ ВОПРОСОВ
          </Text>
          <Text style={styles.meetingName}>
            {meeting?.name || 'Заседание'}
          </Text>
          <Text style={[styles.dateText, { marginTop: 5, marginBottom: 15 }]}>
            {formatDate(meeting?.startTime || meeting?.startedAt)}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColNum}>
              <Text style={styles.headerText}>№</Text>
            </View>
            <View style={styles.tableColQuestion}>
              <Text style={styles.headerText}>Название вопроса</Text>
            </View>
            <View style={styles.tableColVoteName}>
              <Text style={styles.headerText}>Наименование{'\n'}голосования</Text>
            </View>
            <View style={styles.tableColDecision}>
              <Text style={styles.headerText}>Результат{'\n'}рассмотрения</Text>
            </View>
            <View style={styles.tableColResults}>
              <Text style={styles.headerText}>Результаты голосования</Text>
              <View style={{ flexDirection: 'row', marginTop: 3 }}>
                <View style={{ width: '25%', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 2 }}>
                  <Text style={[styles.headerText, { textAlign: 'center' }]}>за</Text>
                </View>
                <View style={{ width: '25%', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 2 }}>
                  <Text style={[styles.headerText, { textAlign: 'center' }]}>против</Text>
                </View>
                <View style={{ width: '25%', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 2 }}>
                  <Text style={[styles.headerText, { textAlign: 'center' }]}>воздер-{'\n'}жались</Text>
                </View>
                <View style={{ width: '25%' }}>
                  <Text style={[styles.headerText, { textAlign: 'center' }]}>не{'\n'}голосо-{'\n'}вали</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Table Rows - One row per agenda item */}
          {agendaItems.map((item, itemIndex) => {
            const votes = votesByAgenda[item.id] || [];
            const isLastItem = itemIndex === agendaItems.length - 1;

            return (
              <View key={itemIndex} style={isLastItem ? styles.tableRowLast : styles.tableRow} wrap={false}>
                {/* Number Column */}
                <View style={styles.tableColNum}>
                  <Text style={styles.cellText}>{item.number}</Text>
                </View>

                {/* Question Column */}
                <View style={styles.tableColQuestion}>
                  <Text style={styles.cellText}>{item.title}</Text>
                </View>

                {/* Vote Name, Decision, Results - nested rows */}
                <View style={{ width: '70%', flexDirection: 'column' }}>
                  {votes.length === 0 ? (
                    // No votes
                    <View style={{ flexDirection: 'row', minHeight: 25 }}>
                      <View style={[styles.tableColVoteName, { width: '28.57%', borderRightWidth: 1, borderRightColor: '#000' }]}>
                        <Text style={styles.cellText}>-</Text>
                      </View>
                      <View style={[styles.tableColDecision, { width: '21.43%', borderRightWidth: 1, borderRightColor: '#000' }]}>
                        <Text style={styles.cellText}>-</Text>
                      </View>
                      <View style={[styles.tableColResults, { width: '50%' }]}>
                        <Text style={styles.cellText}>-</Text>
                      </View>
                    </View>
                  ) : (
                    // Multiple votes
                    votes.map((vote, voteIndex) => (
                      <View
                        key={voteIndex}
                        style={{
                          flexDirection: 'row',
                          minHeight: 25,
                          borderTopWidth: voteIndex > 0 ? 1 : 0,
                          borderTopColor: '#000'
                        }}
                      >
                        {/* Vote Name */}
                        <View style={{ width: '28.57%', padding: 5, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#000' }}>
                          <Text style={styles.cellText}>{vote.question || '-'}</Text>
                        </View>

                        {/* Decision */}
                        <View style={{ width: '21.43%', padding: 5, justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000' }}>
                          <Text style={[
                            styles.decisionText,
                            vote.decision === 'Принято' || vote.decision === 'Решение ПРИНЯТО' ? styles.decisionAccepted :
                            vote.decision === 'Не принято' || vote.decision === 'Решение НЕ ПРИНЯТО' ? styles.decisionRejected : {}
                          ]}>
                            {vote.decision === 'Принято' || vote.decision === 'Решение ПРИНЯТО' ? 'Решение\nПРИНЯТО' :
                             vote.decision === 'Не принято' || vote.decision === 'Решение НЕ ПРИНЯТО' ? 'Решение\nНЕ ПРИНЯТО' :
                             vote.decision || '-'}
                          </Text>
                        </View>

                        {/* Results */}
                        <View style={{ width: '50%', padding: 5 }}>
                          <View style={{ flexDirection: 'row' }}>
                            <View style={{ width: '25%', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 3 }}>
                              <Text style={styles.resultText}>{vote.votesFor || 0}</Text>
                            </View>
                            <View style={{ width: '25%', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 3 }}>
                              <Text style={styles.resultText}>{vote.votesAgainst || 0}</Text>
                            </View>
                            <View style={{ width: '25%', alignItems: 'center', borderRightWidth: 1, borderRightColor: '#000', paddingRight: 3 }}>
                              <Text style={styles.resultText}>{vote.votesAbstain || 0}</Text>
                            </View>
                            <View style={{ width: '25%', alignItems: 'center' }}>
                              <Text style={styles.resultText}>{vote.votesAbsent || 0}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </Page>

      {/* Detailed reports for each agenda item */}
      {agendaItems.map((agendaItem, agendaIndex) => {
        const votes = votesByAgenda[agendaItem.id] || [];

        if (votes.length === 0) {
          // Agenda item without voting
          return (
            <Page key={`detail-${agendaIndex}`} size="A4" style={styles.page}>
              <View style={styles.header}>
                <Text style={styles.detailedTitle}>
                  РЕЗУЛЬТАТЫ ГОЛОСОВАНИЯ ПО ВОПРОСУ №{agendaItem.number}
                </Text>
                <Text style={styles.meetingName}>
                  {meeting?.name || 'Заседание'}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(meeting?.startTime)}
                </Text>
              </View>

              <View style={styles.voteSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Вопрос повестки:</Text>
                  <Text style={styles.infoValue}>{agendaItem?.title || '-'}</Text>
                </View>
                <Text style={styles.noVotingMessage}>
                  Голосование не проводилось
                </Text>
              </View>
            </Page>
          );
        }

        // Detailed pages for each vote in this agenda item
        return votes.map((voteResult, voteIndex) => {
          const voters = getVotersByChoice(voteResult.votes || [], participants);
          const isClosedVote = voteResult.voteType === 'CLOSED';
          const endTime = voteResult.createdAt
            ? new Date(new Date(voteResult.createdAt).getTime() + (voteResult.duration || 0) * 1000)
            : null;

          return (
            <Page key={`detail-${agendaIndex}-${voteIndex}`} size="A4" style={styles.page}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.detailedTitle}>
                  РЕЗУЛЬТАТЫ ГОЛОСОВАНИЯ ПО ВОПРОСУ №{agendaItem?.number || agendaIndex + 1}
                </Text>
                <Text style={styles.meetingName}>
                  {meeting?.name || 'Заседание'}
                </Text>
                <Text style={styles.dateText}>
                  {formatDate(meeting?.startTime)}
                </Text>
              </View>

              {/* Vote Information */}
              <View style={styles.voteSection}>
                <Text style={styles.voteHeader}>
                  Голосование №{voteIndex + 1}
                </Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Вопрос повестки:</Text>
                  <Text style={styles.infoValue}>{agendaItem?.title || '-'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Наименование голосования:</Text>
                  <Text style={styles.infoValue}>{voteResult.question || '-'}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Голосование началось:</Text>
                  <Text style={styles.infoValue}>{formatDateTime(voteResult.createdAt)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Голосование завершено:</Text>
                  <Text style={styles.infoValue}>{endTime ? formatDateTime(endTime) : '-'}</Text>
                </View>
              </View>

              {/* Summary Table */}
              <Text style={{ fontSize: 11, fontFamily: 'Roboto', fontWeight: 'bold', marginBottom: 10 }}>
                Общие результаты
              </Text>
              <View style={styles.summaryTable}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Количество проголосовавших:</Text>
                  <Text style={styles.summaryValue}>
                    {voteResult.votesFor + voteResult.votesAgainst + voteResult.votesAbstain}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Результат голосования:</Text>
                  <Text style={styles.summaryValue}></Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>За:</Text>
                  <Text style={styles.summaryValue}>{voteResult.votesFor || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Против:</Text>
                  <Text style={styles.summaryValue}>{voteResult.votesAgainst || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Воздержались:</Text>
                  <Text style={styles.summaryValue}>{voteResult.votesAbstain || 0}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Не голосовали:</Text>
                  <Text style={styles.summaryValue}>{voteResult.votesAbsent || 0}</Text>
                </View>
                <View style={styles.summaryRowLast}>
                  <Text style={styles.summaryLabel}>Решение:</Text>
                  <Text style={styles.summaryValue}>{voteResult.decision || '-'}</Text>
                </View>
              </View>

              {/* Voters Table - only for OPEN votes */}
              {!isClosedVote ? (
                <View style={styles.votersTable}>
                  {/* "За" voters */}
                  <View style={[styles.votersRow, styles.votersHeader]}>
                    <Text>За</Text>
                  </View>
                  {voters.FOR.length > 0 ? (
                    voters.FOR.map((user, idx) => (
                      <View key={`for-${idx}`} style={styles.votersRow}>
                        <Text style={styles.voterName}>{user?.name || 'Неизвестно'}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.votersRow}>
                      <Text style={styles.voterName}>—</Text>
                    </View>
                  )}

                  {/* "Против" voters */}
                  <View style={[styles.votersRow, styles.votersHeader]}>
                    <Text>Против</Text>
                  </View>
                  {voters.AGAINST.length > 0 ? (
                    voters.AGAINST.map((user, idx) => (
                      <View key={`against-${idx}`} style={styles.votersRow}>
                        <Text style={styles.voterName}>{user?.name || 'Неизвестно'}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.votersRow}>
                      <Text style={styles.voterName}>—</Text>
                    </View>
                  )}

                  {/* "Воздержались" voters */}
                  <View style={[styles.votersRow, styles.votersHeader]}>
                    <Text>Воздержались</Text>
                  </View>
                  {voters.ABSTAIN.length > 0 ? (
                    voters.ABSTAIN.map((user, idx) => (
                      <View key={`abstain-${idx}`} style={styles.votersRow}>
                        <Text style={styles.voterName}>{user?.name || 'Неизвестно'}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.votersRow}>
                      <Text style={styles.voterName}>—</Text>
                    </View>
                  )}

                  {/* "Не голосовали" voters */}
                  <View style={[styles.votersRow, styles.votersHeader]}>
                    <Text>Не голосовали</Text>
                  </View>
                  {voters.ABSENT.length > 0 ? (
                    voters.ABSENT.map((user, idx) => (
                      <View key={`absent-${idx}`} style={idx === voters.ABSENT.length - 1 ? styles.votersRowLast : styles.votersRow}>
                        <Text style={styles.voterName}>{user?.name || 'Неизвестно'}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.votersRowLast}>
                      <Text style={styles.voterName}>—</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.closedVoteMessage}>
                  Голосование было закрытым. Детальная информация о голосах не отображается.
                </Text>
              )}
            </Page>
          );
        });
      })}
    </Document>
  );
};

export default VoteResultsPDF;
