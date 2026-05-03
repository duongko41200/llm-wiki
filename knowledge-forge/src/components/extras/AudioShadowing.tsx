import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { ArrowLeft, Play, Square, Mic, CheckCircle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export const AudioShadowing: React.FC<Props> = ({ onBack }) => {
  const { llmConfig } = useAppStore();
  const [originalText, setOriginalText] = useState('I believe that learning English is a lifelong journey. It requires patience and daily practice.');
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
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

  const playTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(originalText);
      utterance.lang = 'en-US';
      utterance.rate = speed;
      utterance.onend = () => setIsPlaying(false);
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setResult(null);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const gradeShadowing = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    try {
      const res = await invoke<string>('grade_shadowing', {
        transcript,
        originalText,
        llmConfig
      });
      setResult(res);
    } catch (err) {
      alert('Lỗi chấm điểm: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', alignSelf: 'flex-start' }}>
        <ArrowLeft size={18} /> Quay lại
      </button>

      <h2 style={{ margin: '0 0 1.5rem 0', color: '#8b5cf6' }}>Audio Shadowing</h2>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Đoạn văn bản mẫu</label>
            <textarea 
              value={originalText}
              onChange={e => setOriginalText(e.target.value)}
              style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={isPlaying ? stopTTS : playTTS}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '8px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}
            >
              {isPlaying ? <><Square size={18} /> Dừng đọc mẫu</> : <><Play size={18} /> Nghe đọc mẫu</>}
            </button>
            <select 
              value={speed} 
              onChange={e => setSpeed(Number(e.target.value))}
              style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
            >
              <option value={0.75}>Tốc độ chậm (0.75x)</option>
              <option value={1.0}>Tốc độ bình thường (1.0x)</option>
              <option value={1.2}>Tốc độ nhanh (1.2x)</option>
            </select>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Đọc đuổi theo (Bấm ghi âm)</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={toggleRecording}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: isRecording ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)', color: isRecording ? '#ef4444' : 'var(--text-main)', border: `1px solid ${isRecording ? '#ef4444' : 'var(--border-color)'}`, cursor: 'pointer', fontWeight: 600 }}
              >
                {isRecording ? <><Square size={18} fill="#ef4444" /> Dừng ghi âm</> : <><Mic size={18} /> Bắt đầu ghi âm</>}
              </button>
              <button 
                onClick={gradeShadowing}
                disabled={loading || !transcript.trim()}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem', borderRadius: '8px', backgroundColor: loading || !transcript.trim() ? 'var(--border-color)' : '#10b981', color: loading || !transcript.trim() ? 'var(--text-muted)' : 'white', border: 'none', cursor: loading || !transcript.trim() ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {loading ? 'Đang chấm điểm...' : <><CheckCircle size={18} /> Xem kết quả</>}
              </button>
            </div>
            {transcript && (
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '80px', color: 'var(--text-main)' }}>
                {transcript}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Result */}
        <div style={{ flex: 1, backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Kết quả đánh giá</h3>
          {result ? (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)' }}>
              {result}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
              Hãy ghi âm giọng đọc của bạn và chấm điểm để xem AI nhận xét độ chính xác nhé!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
