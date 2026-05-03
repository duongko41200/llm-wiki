import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { SpeakingResult } from './SpeakingResult';
import { Mic, Square, RefreshCw, Send, Loader2, Play } from 'lucide-react';

export const SpeakingPartner: React.FC = () => {
  const { 
    llmConfig, 
    speakingQuestion, setSpeakingQuestion,
    speakingResult, setSpeakingResult,
    speakingLoading, setSpeakingLoading 
  } = useAppStore();
  
  const [part, setPart] = useState<number>(1);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioError, setAudioError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition if supported
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
        setTranscript(prev => {
          // If interim, just replace the last part, but for simplicity we'll just append
          // In a real app we'd handle interim vs final results better.
          // For now, let's just use final results or accumulate properly.
          return currentTranscript;
        });
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setAudioError('Lỗi thu âm: ' + event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
      setAudioError("Trình duyệt/Hệ thống của bạn không hỗ trợ Web Speech API. Vui lòng gõ tay câu trả lời.");
    }
    
    // Generate initial question if none exists
    if (!speakingQuestion) {
      handleGenerateQuestion(1);
    }
  }, []);

  const handleGenerateQuestion = async (partNum: number) => {
    setSpeakingLoading(true);
    setSpeakingResult(null);
    setTranscript('');
    try {
      const q: any = await invoke('generate_speaking_question', {
        partNumber: partNum,
        llmConfig,
      });
      setSpeakingQuestion(q);
    } catch (err) {
      console.error(err);
      alert('Lỗi tạo câu hỏi: ' + String(err));
    } finally {
      setSpeakingLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setAudioError(null);
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleGrade = async () => {
    if (!transcript.trim() || !speakingQuestion) return;
    
    if (isRecording) {
      toggleRecording(); // stop recording first
    }

    setSpeakingLoading(true);
    setSpeakingResult(null);
    
    try {
      const questionText = `${speakingQuestion.scenario}\n${speakingQuestion.questions.join('\n')}`;
      
      const result: any = await invoke('grade_speaking', {
        transcript,
        question: questionText,
        llmConfig,
      });
      
      setSpeakingResult(result);
      
      // Reload error notes
      const notes: any = await invoke('get_error_notes');
      useAppStore.getState().setErrorNotes(notes);
      
    } catch (err) {
      console.error("Failed to grade speaking:", err);
      alert("Đã xảy ra lỗi khi chấm điểm: " + String(err));
    } finally {
      setSpeakingLoading(false);
    }
  };

  const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%', alignItems: 'stretch' }}>
      
      {/* Left Column: Practice Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.5rem',
        backgroundColor: 'var(--bg-sidebar)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '1.5rem',
        minWidth: '400px'
      }}>
        
        {/* Part Selection */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map(p => (
            <button
              key={p}
              onClick={() => { setPart(p); handleGenerateQuestion(p); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: part === p ? '#10b981' : 'var(--border-color)',
                backgroundColor: part === p ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: part === p ? '#10b981' : 'var(--text-muted)',
                fontWeight: part === p ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              Part {p}
            </button>
          ))}
        </div>

        {/* Question Area */}
        <div style={{ 
          backgroundColor: 'var(--bg-main)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          minHeight: '150px'
        }}>
          {speakingLoading && !speakingQuestion ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Loader2 className="animate-spin" size={24} color="#10b981" />
            </div>
          ) : speakingQuestion ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>
                  Scenario
                </span>
                <button 
                  onClick={() => playTTS(speakingQuestion.scenario + ". " + speakingQuestion.questions.join(". "))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  title="Đọc câu hỏi"
                >
                  <Play size={18} />
                </button>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>{speakingQuestion.scenario}</p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                {speakingQuestion.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Không tải được câu hỏi.</div>
          )}
        </div>

        <button
          onClick={() => handleGenerateQuestion(part)}
          disabled={speakingLoading}
          style={{
            alignSelf: 'flex-start',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={14} /> Đổi câu hỏi khác
        </button>

        {/* Recording Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Câu trả lời của bạn
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={isRecording ? "Đang lắng nghe..." : "Nhấn nút Record để thu âm hoặc gõ trực tiếp vào đây..."}
            style={{
              flex: 1,
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: isRecording ? '#ef4444' : 'var(--border-color)',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-main)',
              fontSize: '1rem',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.6
            }}
          />
          {audioError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{audioError}</div>}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={toggleRecording}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', borderRadius: '8px',
              backgroundColor: isRecording ? 'rgba(239,68,68,0.1)' : 'var(--bg-main)',
              color: isRecording ? '#ef4444' : 'var(--text-main)',
              border: `1px solid ${isRecording ? '#ef4444' : 'var(--border-color)'}`,
              fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isRecording ? <><Square size={18} fill="#ef4444" /> Dừng thu âm</> : <><Mic size={18} /> Bắt đầu thu âm</>}
          </button>

          <button
            onClick={handleGrade}
            disabled={speakingLoading || transcript.trim().length === 0}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '1rem', borderRadius: '8px',
              backgroundColor: speakingLoading || transcript.trim().length === 0 ? 'var(--border-color)' : '#10b981',
              color: speakingLoading || transcript.trim().length === 0 ? 'var(--text-muted)' : 'white',
              border: 'none', fontSize: '1rem', fontWeight: 600,
              cursor: speakingLoading || transcript.trim().length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {speakingLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Đang phân tích...</>
            ) : (
              <><Send size={18} /> Chấm điểm</>
            )}
          </button>
        </div>

      </div>

      {/* Right Column: Result */}
      <div style={{ 
        flex: 1, 
        minWidth: '400px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: '12px',
      }}>
        {speakingResult ? (
          <SpeakingResult />
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: '1px dashed var(--border-color)', borderRadius: '12px',
            color: 'var(--text-muted)', textAlign: 'center', padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🎙️</div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>Chưa có kết quả</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.5 }}>
              Hãy thu âm câu trả lời của bạn, hệ thống sẽ phân tích lỗi phát âm và ngữ pháp.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
