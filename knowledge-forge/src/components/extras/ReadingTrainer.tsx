import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore, DocumentRecord } from '../../stores/appStore';
import { ArrowLeft, Play, Square, Loader2 } from 'lucide-react';
import Database from '@tauri-apps/plugin-sql';

interface Props {
  onBack: () => void;
}

export const ReadingTrainer: React.FC<Props> = ({ onBack }) => {
  const { llmConfig } = useAppStore();
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [readingText, setReadingText] = useState('');
  
  const [isReading, setIsReading] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [wpm, setWpm] = useState<number | null>(null);

  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any[] | null>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      const db = await Database.load('sqlite:knowledge_forge.db');
      const d: DocumentRecord[] = await db.select('SELECT * FROM documents ORDER BY created_at DESC');
      setDocs(d);
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isReading && startTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReading, startTime]);

  const handleStartRead = async () => {
    if (!selectedDocId) return;
    try {
      const chunks: any[] = await invoke('get_document_chunks', { documentId: selectedDocId });
      if (chunks.length === 0) {
        alert("Tài liệu trống");
        return;
      }
      const text = chunks.map(c => c.content).join('\n\n');
      setReadingText(text);
      setIsReading(true);
      setStartTime(Date.now());
      setTimeElapsed(0);
      setWpm(null);
      setQuizResult(null);
    } catch (e) {
      alert("Lỗi tải tài liệu: " + e);
    }
  };

  const handleFinishRead = async () => {
    setIsReading(false);
    if (!startTime) return;
    const totalTimeSecs = Math.floor((Date.now() - startTime) / 1000);
    const wordCount = readingText.split(/\s+/).length;
    const speed = Math.round((wordCount / totalTimeSecs) * 60);
    setWpm(speed);

    // Generate Quiz
    setLoadingQuiz(true);
    try {
      const res: string = await invoke('generate_reading_quiz', {
        text: readingText,
        llmConfig
      });
      // Try parse JSON
      const cleaned = res.trim().replace(/```json/g, '').replace(/```/g, '').trim();
      setQuizResult(JSON.parse(cleaned));
    } catch (e) {
      console.error(e);
      alert("AI không tạo được bài quiz: " + e);
    } finally {
      setLoadingQuiz(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} /> Quay lại
      </button>

      <h2 style={{ margin: '0 0 1.5rem 0', color: '#f59e0b' }}>Reading Speed Trainer</h2>

      {!isReading && !readingText && (
        <div style={{ maxWidth: '500px', backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Bắt đầu luyện tập</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Chọn một tài liệu của bạn để luyện tốc độ đọc hiểu. Hệ thống sẽ tính giờ và đưa ra bài trắc nghiệm sau khi bạn đọc xong.</p>
          <select 
            value={selectedDocId} 
            onChange={e => setSelectedDocId(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', marginBottom: '1rem' }}
          >
            <option value="">-- Chọn tài liệu --</option>
            {docs.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
          </select>
          <button 
            onClick={handleStartRead}
            disabled={!selectedDocId}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: !selectedDocId ? 'var(--border-color)' : '#f59e0b', color: 'white', border: 'none', fontWeight: 600, cursor: !selectedDocId ? 'not-allowed' : 'pointer' }}
          >
            <Play size={18} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }}/> Bắt đầu đọc
          </button>
        </div>
      )}

      {(isReading || readingText) && (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'monospace' }}>
                ⏱️ {formatTime(timeElapsed)}
              </div>
              {isReading ? (
                <button 
                  onClick={handleFinishRead}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Square size={18} /> Đã đọc xong!
                </button>
              ) : (
                <div style={{ color: '#10b981', fontWeight: 600 }}>Tốc độ của bạn: {wpm} WPM</div>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: '1.1rem' }}>
              {readingText}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Bài kiểm tra đọc hiểu</h3>
            {isReading && <p style={{ color: 'var(--text-muted)' }}>Hãy hoàn thành bài đọc trước để xem câu hỏi.</p>}
            {!isReading && loadingQuiz && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                <Loader2 className="animate-spin" size={18} /> Đang tạo bài trắc nghiệm...
              </div>
            )}
            {!isReading && !loadingQuiz && quizResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {quizResult.map((q: any, i: number) => (
                  <div key={i}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{i+1}. {q.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {q.options.map((opt: string, j: number) => (
                        <div key={j} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.9rem', backgroundColor: j === q.correct_index ? 'rgba(16,185,129,0.1)' : 'transparent', color: j === q.correct_index ? '#10b981' : 'var(--text-main)', fontWeight: j === q.correct_index ? 600 : 400 }}>
                          {j === q.correct_index && <CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}/>}
                          {opt}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      💡 {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
