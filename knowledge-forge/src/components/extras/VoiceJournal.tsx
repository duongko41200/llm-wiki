import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { ArrowLeft, Mic, Square, Save, Loader2, Calendar } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface JournalEntry {
  id: number;
  date: string;
  transcript: string;
  sentiment: string | null;
  feedback: string | null;
  created_at: string;
}

export const VoiceJournal: React.FC<Props> = ({ onBack }) => {
  const { llmConfig } = useAppStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    fetchEntries();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const fetchEntries = async () => {
    try {
      const data: JournalEntry[] = await invoke('get_journal_entries');
      setEntries(data);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      await invoke('save_journal_entry', {
        date: selectedDate,
        transcript,
        llmConfig
      });
      setTranscript('');
      await fetchEntries();
      alert("Đã lưu nhật ký thành công!");
    } catch (err) {
      alert('Lỗi lưu nhật ký: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const entryForSelectedDate = entries.find(e => e.date === selectedDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} /> Quay lại
      </button>

      <h2 style={{ margin: '0 0 1.5rem 0', color: '#10b981' }}>Voice Journal</h2>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        {/* Left Column: Calendar & History */}
        <div style={{ flex: '0 0 300px', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>
            <Calendar size={18} /> Lịch Nhật Ký
          </div>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', marginBottom: '1.5rem' }}
          />
          <h4 style={{ margin: '0 0 0.5rem 0' }}>Gần đây</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1 }}>
            {entries.map(e => (
              <div 
                key={e.id}
                onClick={() => setSelectedDate(e.date)}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: e.date === selectedDate ? 'rgba(16,185,129,0.1)' : 'var(--bg-main)',
                  border: `1px solid ${e.date === selectedDate ? '#10b981' : 'var(--border-color)'}`,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ fontWeight: 600, color: e.date === selectedDate ? '#10b981' : 'inherit' }}>{e.date}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {e.sentiment ? `Cảm xúc: ${e.sentiment}` : 'Đã ghi âm'}
                </div>
              </div>
            ))}
            {entries.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>Chưa có nhật ký nào</div>}
          </div>
        </div>

        {/* Right Column: Record & View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {entryForSelectedDate ? (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Nhật ký ngày {entryForSelectedDate.date}</div>
              {entryForSelectedDate.sentiment && (
                <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '999px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'flex-start' }}>
                  Cảm xúc: {entryForSelectedDate.sentiment}
                </div>
              )}
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {entryForSelectedDate.transcript}
              </div>
              {entryForSelectedDate.feedback && (
                <div style={{ backgroundColor: 'rgba(59,130,246,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong style={{ color: '#3b82f6' }}>AI Nhận xét:</strong> {entryForSelectedDate.feedback}
                </div>
              )}
            </div>
          ) : (
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Thêm nhật ký ngày {selectedDate}</div>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Hãy bấm ghi âm và chia sẻ ngày hôm nay của bạn bằng tiếng Anh.</p>
              
              <textarea 
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                placeholder="Nội dung ghi âm sẽ hiển thị ở đây. Bạn cũng có thể tự gõ..."
                style={{ width: '100%', height: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', resize: 'none', fontFamily: 'inherit' }}
              />

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={toggleRecording}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: isRecording ? 'rgba(239,68,68,0.1)' : 'var(--bg-main)', color: isRecording ? '#ef4444' : 'var(--text-main)', border: `1px solid ${isRecording ? '#ef4444' : 'var(--border-color)'}`, cursor: 'pointer', fontWeight: 600 }}
                >
                  {isRecording ? <><Square size={18} fill="#ef4444" /> Dừng ghi âm</> : <><Mic size={18} /> Bắt đầu ghi âm</>}
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading || !transcript.trim()}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: loading || !transcript.trim() ? 'var(--border-color)' : '#10b981', color: loading || !transcript.trim() ? 'var(--text-muted)' : 'white', border: 'none', cursor: loading || !transcript.trim() ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  {loading ? <><Loader2 className="animate-spin" size={18}/> Đang phân tích...</> : <><Save size={18} /> Lưu & Phân tích bằng AI</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
