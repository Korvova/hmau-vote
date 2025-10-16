import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import axios from 'axios';
import { getVoteResults } from '../utils/api.js';
import VoteResultsPDF from './VoteResultsPDF.jsx';

/**
 * Component that shows "Результаты PDF" button for completed meetings
 * This is a separate component to keep the PDF generation logic independent
 * so future changes to the PDF format won't affect other parts of the app
 */
function MeetingResultsPDFButton({ meeting, agenda }) {
  const [showPdfDownload, setShowPdfDownload] = useState(false);
  const [allVoteResults, setAllVoteResults] = useState([]);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Load all vote results and participants when meeting is completed
    if (meeting?.status === 'COMPLETED' && meeting?.id) {
      (async () => {
        try {
          const voteRes = await getVoteResults(meeting.id);
          setAllVoteResults(Array.isArray(voteRes) ? voteRes : []);

          // Load participants
          const partRes = await axios.get(`/api/meetings/${meeting.id}/participants`);
          setParticipants(Array.isArray(partRes.data) ? partRes.data : []);
        } catch (err) {
          console.error('Failed to load vote results or participants:', err);
        }
      })();
    }
  }, [meeting?.id, meeting?.status]);

  // Only show button if meeting is completed
  if (meeting?.status !== 'COMPLETED') {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-add"
        onClick={() => setShowPdfDownload(true)}
        title="Скачать результаты в PDF"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          fontSize: '14px',
          whiteSpace: 'nowrap',
        }}
      >
        <span>Результаты PDF</span>
      </button>

      {/* PDF Download Modal */}
      {showPdfDownload && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPdfDownload(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: 30,
              borderRadius: 8,
              maxWidth: 500,
              width: '90%',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 20 }}>Скачать результаты голосования</h2>
            <p style={{ marginBottom: 20, color: '#666' }}>
              PDF документ будет содержать все результаты голосований по вопросам повестки заседания.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn"
                onClick={() => setShowPdfDownload(false)}
                style={{ backgroundColor: '#757575' }}
              >
                Отмена
              </button>
              <PDFDownloadLink
                document={
                  <VoteResultsPDF
                    meeting={meeting}
                    agendaItems={agenda}
                    voteResults={allVoteResults}
                    participants={participants}
                  />
                }
                fileName={`results_${meeting?.name || 'meeting'}_${new Date().toISOString().split('T')[0]}.pdf`}
                style={{ textDecoration: 'none' }}
              >
                {({ loading }) => (
                  <button
                    className="btn btn-add"
                    disabled={loading}
                    style={{
                      opacity: loading ? 0.6 : 1,
                      cursor: loading ? 'wait' : 'pointer',
                    }}
                  >
                    {loading ? 'Генерация PDF...' : 'Скачать PDF'}
                  </button>
                )}
              </PDFDownloadLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MeetingResultsPDFButton;
