import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { CheckCircle, AlertTriangle, MessageCircle, Star } from 'lucide-react';

export const SpeakingResult: React.FC = () => {
  const { speakingResult } = useAppStore();

  if (!speakingResult) return null;

  const renderScoreBar = (label: string, score: number, max: number = 5) => {
    const percent = Math.round((score / max) * 100);
    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>{score}/{max}</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#10b981', transition: 'width 0.5s ease' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingRight: '0.5rem' }}>
      
      {/* Overview Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div style={{
          width: '80px', height: '80px',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          color: 'white',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(16,185,129,0.3)'
        }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>Band</span>
          <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{speakingResult.overall_band}</span>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={18} color="#f59e0b" />
            Nhận xét chung
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {speakingResult.overall_feedback}
          </p>
        </div>
      </div>

      {/* Detailed Scores */}
      <div style={{
        backgroundColor: 'var(--bg-sidebar)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Điểm thành phần (Aptis)</h3>
        {renderScoreBar('Grammar (Ngữ pháp)', speakingResult.grammar_score)}
        {renderScoreBar('Vocabulary (Từ vựng)', speakingResult.vocabulary_score)}
        {renderScoreBar('Pronunciation (Phát âm)', speakingResult.pronunciation_score)}
        {renderScoreBar('Fluency (Trôi chảy)', speakingResult.fluency_score)}
      </div>

      {/* Errors List */}
      {speakingResult.errors.length > 0 && (
        <div style={{
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#ef4444" />
            Lỗi cần khắc phục
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            💡 Ghi chú: Hệ thống đã tự động tạo Sticky Notes cho các lỗi này ở màn hình Ghi chú.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {speakingResult.errors.map((err, i) => (
              <div key={i} style={{ borderLeft: '3px solid #ef4444', paddingLeft: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase',
                    padding: '0.15rem 0.4rem', borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'
                  }}>
                    {err.error_type}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  <del style={{ color: '#ef4444', marginRight: '0.5rem' }}>{err.original_text}</del>
                  <span style={{ color: '#10b981', fontWeight: 500 }}>{err.corrected_text}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {err.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improved Answer */}
      {speakingResult.improved_answer && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px',
          padding: '1.5rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageCircle size={18} />
            Câu trả lời gợi ý
          </h3>
          <div style={{
            fontSize: '0.9rem',
            lineHeight: 1.6,
            color: 'var(--text-main)',
            whiteSpace: 'pre-wrap'
          }}>
            {speakingResult.improved_answer}
          </div>
        </div>
      )}

    </div>
  );
};
