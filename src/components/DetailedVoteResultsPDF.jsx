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
  ],
});

// Styles for detailed PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  meetingName: {
    fontSize: 11,
    marginBottom: 5,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  voteSection: {
    marginBottom: 30,
    pageBreakBefore: 'auto',
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
    width: '40%',
    fontFamily: 'Roboto',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 10,
    width: '60%',
  },
  summaryTable: {
    marginTop: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#000',
  },
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 5,
  },
  summaryRowLast: {
    flexDirection: 'row',
    padding: 5,
  },
  summaryLabel: {
    fontSize: 10,
    width: '60%',
  },
  summaryValue: {
    fontSize: 10,
    width: '40%',
    textAlign: 'right',
  },
  votersTable: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
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

// Helper to check if user belongs to system/invited group
const isInvitedUser = (user) => {
  // Check if user has divisions array (from API)
  if (Array.isArray(user.divisions) && user.divisions.length > 0) {
    return user.divisions.some(d => {
      if (!d || !d.name) return false;
      const name = d.name.replace(/👥/g, '').trim().toLowerCase();
      return name === 'приглашенные';
    });
  }
  // Fallback: check single division object
  if (user.division && user.division.name) {
    const name = user.division.name.replace(/👥/g, '').trim().toLowerCase();
    return name === 'приглашенные';
  }
  return false;
};

const DetailedVoteResultsPDF = ({ agendaItem, meeting, voteResults, participants = [] }) => {
  // Filter out invited guests from participants
  const regularParticipants = participants.filter(p => !isInvitedUser(p));
  // Group voters by choice for each vote result
  const getVotersByChoice = (votes, allParticipants) => {
    const grouped = {
      FOR: [],
      AGAINST: [],
      ABSTAIN: [],
      ABSENT: [],
    };

    // First, add all who voted (with full vote object including proxies)
    votes.forEach((vote) => {
      if (vote.choice && grouped[vote.choice]) {
        grouped[vote.choice].push(vote); // Push full vote object, not just user
      }
    });

    // Find who didn't vote - add to ABSENT
    const votedUserIds = new Set(votes.map(v => v.user?.id).filter(Boolean));
    const didNotVote = allParticipants.filter(p => !votedUserIds.has(p.id));
    // For ABSENT, we just push user objects (no votes, no proxies)
    grouped.ABSENT = [...grouped.ABSENT, ...didNotVote.map(user => ({ user }))];

    return grouped;
  };

  return (
    <Document>
      {voteResults.map((voteResult, voteIndex) => {
        // Процедура «от присутствующих»: в списках только те, кто был зарегистрирован на момент голосования
        const presentSet = Array.isArray(voteResult.presentUserIds) ? new Set(voteResult.presentUserIds) : null;
        const baseParticipants = presentSet ? regularParticipants.filter(p => presentSet.has(p.id)) : regularParticipants;
        const voters = getVotersByChoice(voteResult.votes || [], baseParticipants);
        const isClosedVote = voteResult.voteType === 'CLOSED';
        const endTime = voteResult.createdAt
          ? new Date(new Date(voteResult.createdAt).getTime() + (voteResult.duration || 0) * 1000)
          : null;

        return (
          <Page key={voteIndex} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                РЕЗУЛЬТАТЫ ГОЛОСОВАНИЯ ПО ВОПРОСУ №{agendaItem?.number || voteIndex + 1}
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
                <Text style={styles.infoLabel}>Вопрос:</Text>
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
                  voters.FOR.map((vote, idx) => {
                    const user = vote.user || vote;
                    const proxies = vote.proxies || [];
                    const proxyText = proxies.length > 0
                      ? ` (с доверенностями от: ${proxies.map(p => p.fromUserName).join(', ')})`
                      : '';
                    return (
                      <View key={`for-${idx}`} style={styles.votersRow}>
                        <Text style={styles.voterName}>
                          {user?.name || 'Неизвестно'}{proxyText}
                        </Text>
                      </View>
                    );
                  })
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
                  voters.AGAINST.map((vote, idx) => {
                    const user = vote.user || vote;
                    const proxies = vote.proxies || [];
                    const proxyText = proxies.length > 0
                      ? ` (с доверенностями от: ${proxies.map(p => p.fromUserName).join(', ')})`
                      : '';
                    return (
                      <View key={`against-${idx}`} style={styles.votersRow}>
                        <Text style={styles.voterName}>
                          {user?.name || 'Неизвестно'}{proxyText}
                        </Text>
                      </View>
                    );
                  })
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
                  voters.ABSTAIN.map((vote, idx) => {
                    const user = vote.user || vote;
                    const proxies = vote.proxies || [];
                    const proxyText = proxies.length > 0
                      ? ` (с доверенностями от: ${proxies.map(p => p.fromUserName).join(', ')})`
                      : '';
                    return (
                      <View key={`abstain-${idx}`} style={styles.votersRow}>
                        <Text style={styles.voterName}>
                          {user?.name || 'Неизвестно'}{proxyText}
                        </Text>
                      </View>
                    );
                  })
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
                  voters.ABSENT.map((vote, idx) => {
                    const user = vote.user || vote;
                    return (
                      <View key={`absent-${idx}`} style={idx === voters.ABSENT.length - 1 ? styles.votersRowLast : styles.votersRow}>
                        <Text style={styles.voterName}>{user?.name || 'Неизвестно'}</Text>
                      </View>
                    );
                  })
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
      })}
    </Document>
  );
};

export default DetailedVoteResultsPDF;
