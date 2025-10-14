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
  },
  cellText: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  headerText: {
    fontSize: 9,
    lineHeight: 1.3,
  },
  decisionText: {
    fontSize: 9,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  decisionAccepted: {
    color: '#2e7d32',
  },
  decisionRejected: {
    color: '#c62828',
  },
  resultsBlock: {
    marginBottom: 3,
  },
  resultLabel: {
    fontSize: 8,
    marginBottom: 2,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  resultText: {
    fontSize: 8,
  },
});

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

const VoteResultsPDF = ({ meeting, agendaItems, voteResults }) => {
  // Group vote results by agenda item
  const votesByAgenda = {};
  voteResults.forEach(vote => {
    if (!votesByAgenda[vote.agendaItemId]) {
      votesByAgenda[vote.agendaItemId] = [];
    }
    votesByAgenda[vote.agendaItemId].push(vote);
  });

  return (
    <Document>
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
    </Document>
  );
};

export default VoteResultsPDF;
