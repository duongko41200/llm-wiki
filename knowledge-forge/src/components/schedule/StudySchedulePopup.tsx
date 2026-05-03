import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore, StudyTask, ScheduleStats } from '../../stores/appStore';
import { X, PlayCircle, Flame, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

export const StudySchedulePopup: React.FC = () => {
  const { 
    llmConfig, 
    studyTasks, setStudyTasks, 
    scheduleStats, setScheduleStats, 
    hasSeenSchedulePopup, setHasSeenSchedulePopup 
  } = useAppStore();
  
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasSeenSchedulePopup) {
      loadSchedule();
    }
  }, [hasSeenSchedulePopup]);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      // Create or get today's schedule
      const tasks: StudyTask[] = await invoke('generate_study_schedule', { llmConfig });
      const stats: ScheduleStats = await invoke('get_schedule_stats');
      
      setStudyTasks(tasks);
      setScheduleStats(stats);
      
      // Small delay for smooth animation
      setTimeout(() => setVisible(true), 500);
    } catch (err) {
      console.error("Failed to load schedule", err);
      // Even on error, don't block the user forever
      setHasSeenSchedulePopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => setHasSeenSchedulePopup(true), 300); // wait for fade out
  };

  const handleStartTask = () => {
    // In a full implementation, this would navigate to the specific task view (e.g. Speaking Tab)
    // For now, we just close the popup
    handleClose();
  };

  if (hasSeenSchedulePopup) return null;
  if (!visible && !loading) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{
        width: '90%',
        maxWidth: '500px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          padding: '24px',
          color: 'white',
          position: 'relative'
        }}>
          <button 
            onClick={handleClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            <X size={18} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CalendarIcon size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>
              KnowledgeForge
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Xin chào! Lịch học hôm nay</h2>
          
          {scheduleStats && scheduleStats.current_streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '20px', marginTop: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
              <Flame size={16} color="#fbbf24" />
              Streak: {scheduleStats.current_streak} ngày liên tục!
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ marginBottom: '16px' }}></div>
              Đang phân tích dữ liệu và tạo lịch học...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {studyTasks.map((task, index) => (
                <div key={task.id} style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: task.is_completed ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-sidebar)',
                  border: `1px solid ${task.is_completed ? '#10b981' : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  transition: 'transform 0.2s ease',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ 
                    width: '40px', height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: task.is_completed ? '#10b981' : 'rgba(59,130,246,0.1)',
                    color: task.is_completed ? 'white' : '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 'bold'
                  }}>
                    {task.is_completed ? <CheckCircle2 size={24} /> : index + 1}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                      {task.task_title}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      {task.task_description}
                    </p>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3b82f6', marginTop: '8px' }}>
                      ⏱️ {task.duration_minutes} phút
                    </div>
                  </div>

                  {!task.is_completed && (
                    <button 
                      onClick={() => handleStartTask()}
                      style={{
                        alignSelf: 'center',
                        background: 'transparent',
                        color: '#3b82f6',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <PlayCircle size={28} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                border: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Bỏ qua hôm nay, tôi muốn học tự do
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(59,130,246,0.2);
          border-left-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
