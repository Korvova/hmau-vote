import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getMeeting, getVoteResults, getAgendaItems } from '../utils/api.js';

function MeetingScreenPage() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [vote, setVote] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, agenda] = await Promise.all([
          getMeeting(id),
          getAgendaItems(id).catch(() => []),
        ]);
        setMeeting(
          m
            ? { ...m, agendaItems: Array.isArray(agenda) && agenda.length ? agenda : m.agendaItems || [] }
            : null,
        );
        try {
          const results = await getVoteResults(id);
          if (Array.isArray(results)) {
            const pending = results.find((r) => r.voteStatus === 'PENDING');
            if (pending) {
              setVote(pending);
              setMeeting((prev) => {
                if (!prev) return prev;
                const items = Array.isArray(prev.agendaItems)
                  ? prev.agendaItems.map((item) =>
                      item.id === pending.agendaItemId
                        ? { ...item, activeIssue: true }
                        : { ...item, activeIssue: false }
                    )
                  : [];
                return { ...prev, agendaItems: items };
              });
            }
          }
        } catch {}
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    const socket = io();
    const strId = String(id);

    const handleNewVote = (data) => {
      if (String(data.meetingId) !== strId) return;
      setVote(data);
      setMeeting((prev) => {
        if (!prev) return prev;
        const items = Array.isArray(prev.agendaItems)
          ? prev.agendaItems.map((item) =>
              item.id === data.agendaItemId
                ? { ...item, activeIssue: true }
                : { ...item, activeIssue: false }
            )
          : [];
        return { ...prev, agendaItems: items };
      });
    };

    const handleVoteEnded = (data) => {
      if (String(data.meetingId) !== strId) return;
      setVote(data);
    };

    const clearVote = (data) => {
      if (String(data.meetingId) !== strId) return;
      setVote(null);
      setMeeting((prev) => {
        if (!prev) return prev;
        const items = Array.isArray(prev.agendaItems)
          ? prev.agendaItems.map((item) => ({ ...item, activeIssue: false }))
          : [];
        return { ...prev, agendaItems: items };
      });
    };

    const handleAgendaUpdate = (data) => {
      if (String(data.meetingId) !== strId) return;
      setMeeting((prev) => {
        const items = Array.isArray(prev?.agendaItems) ? prev.agendaItems.map((item) =>
          item.id === data.id
            ? { ...item, activeIssue: data.activeIssue, completed: data.completed }
            : { ...item, activeIssue: false }
        ) : [];
        return { ...(prev || {}), agendaItems: items };
      });
    };

    const handleMeetingStatus = (data) => {
      if (String(data.id) !== strId) return;
      setMeeting((prev) => (prev ? { ...prev, status: data.status } : prev));
      if (data.status === 'COMPLETED') setVote(null);
    };

    socket.on('new-vote-result', handleNewVote);
    socket.on('vote-ended', handleVoteEnded);
    socket.on('vote-applied', clearVote);
    socket.on('vote-cancelled', clearVote);
    socket.on('agenda-item-updated', handleAgendaUpdate);
    socket.on('meeting-status-changed', handleMeetingStatus);

    return () => {
      socket.off('new-vote-result', handleNewVote);
      socket.off('vote-ended', handleVoteEnded);
      socket.off('vote-applied', clearVote);
      socket.off('vote-cancelled', clearVote);
      socket.off('agenda-item-updated', handleAgendaUpdate);
      socket.off('meeting-status-changed', handleMeetingStatus);
      socket.disconnect();
    };
  }, [id]);

  const activeItem = meeting?.agendaItems?.find((a) => a.activeIssue);

  return (
    <main style={{ padding: 20 }}>
      <h1>{meeting?.name || 'Заседание'}</h1>
      <p>
        Статус: {
          meeting?.status === 'IN_PROGRESS'
            ? 'идёт'
            : meeting?.status === 'COMPLETED'
            ? 'завершено'
            : 'не начато'
        }
      </p>
      {vote ? (
        <div>
          <h2>{activeItem?.title || vote.question}</h2>
          <ul>
            <li>За: {vote.votesFor}</li>
            <li>Против: {vote.votesAgainst}</li>
            <li>Воздержались: {vote.votesAbstain}</li>
            <li>Не голосовали: {vote.votesAbsent}</li>
          </ul>
        </div>
      ) : (
        <p>Голосование не активно</p>
      )}
    </main>
  );
}

export default MeetingScreenPage;