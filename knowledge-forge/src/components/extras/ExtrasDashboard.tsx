import React, { useState } from 'react';
import { PlayCircle, Clock, Mic, Activity, BookOpen } from 'lucide-react';
import { AudioShadowing } from './AudioShadowing';
import { ReadingTrainer } from './ReadingTrainer';
import { VoiceJournal } from './VoiceJournal';

export const ExtrasDashboard: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<'menu' | 'shadowing' | 'reading' | 'journal'>('menu');

  if (activeFeature === 'shadowing') return <AudioShadowing onBack={() => setActiveFeature('menu')} />;
  if (activeFeature === 'reading') return <ReadingTrainer onBack={() => setActiveFeature('menu')} />;
  if (activeFeature === 'journal') return <VoiceJournal onBack={() => setActiveFeature('menu')} />;

  const features = [
    {
      id: 'shadowing' as const,
      title: 'Audio Shadowing',
      desc: 'Luyện nghe và đọc đuổi theo giọng chuẩn gốc để cải thiện ngữ điệu.',
      icon: <PlayCircle size={32} color="#8b5cf6" />,
      color: 'rgba(139, 92, 246, 0.1)',
      border: '#8b5cf6'
    },
    {
      id: 'reading' as const,
      title: 'Reading Speed Trainer',
      desc: 'Luyện tốc độ đọc bấm giờ kết hợp làm bài trắc nghiệm đọc hiểu (Quiz).',
      icon: <Clock size={32} color="#f59e0b" />,
      color: 'rgba(245, 158, 11, 0.1)',
      border: '#f59e0b'
    },
    {
      id: 'journal' as const,
      title: 'Voice Journal',
      desc: 'Ghi nhật ký hàng ngày bằng tiếng Anh, AI phân tích cảm xúc và từ vựng.',
      icon: <Mic size={32} color="#10b981" />,
      color: 'rgba(16, 185, 129, 0.1)',
      border: '#10b981'
    }
  ];

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity color="#3b82f6" /> Luyện Tập Bổ Sung (Extras)
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Tập trung vào từng kỹ năng chuyên sâu để tối ưu hoá điểm số Aptis của bạn.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {features.map(f => (
          <div 
            key={f.id}
            onClick={() => setActiveFeature(f.id)}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: `1px solid var(--border-color)`,
              borderRadius: '12px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = f.border)}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
          >
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '12px', 
              backgroundColor: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              {f.icon}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{f.title}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
