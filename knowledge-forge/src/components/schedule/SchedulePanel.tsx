import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { CheckCircle2, PlayCircle, Clock } from 'lucide-react';

export const SchedulePanel: React.FC = () => {
  const { studyTasks, setStudyTasks, markTaskCompleted, scheduleStats } = useAppStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (studyTasks.length === 0) {
      loadTodaySchedule();
    }
  }, []);

  const loadTodaySchedule = async () => {
    setLoading(true);
    try {
      const tasks: any = await invoke('get_today_schedule');
      setStudyTasks(tasks);
    } catch (err) {
      console.error("Failed to load today schedule", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (id: number) => {
    try {
      await invoke('complete_study_task', { id });
      markTaskCompleted(id);
    } catch (err) {
      console.error("Failed to complete task", err);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Đang tải lịch học...</div>;
  }

  const completedCount = studyTasks.filter(t => t.is_completed).length;
  const totalCount = studyTasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      {/* Overview Card */}
      <div style={{
        background: 'linear-gradient(to right, rgba(59,130,246,0.1), rgba(16,185,129,0.1))',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>Tiến độ hôm nay</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Đã hoàn thành {completedCount}/{totalCount} nhiệm vụ
          </div>
          {scheduleStats && scheduleStats.current_streak > 0 && (
            <div style={{ marginTop: '8px', color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem' }}>
              🔥 Đang giữ chuỗi {scheduleStats.current_streak} ngày liên tục!
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '64px', height: '64px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={progressPercent === 100 ? '#10b981' : '#3b82f6'}
                strokeWidth="3"
                strokeDasharray={`${progressPercent}, 100`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 'bold'
            }}>
              {progressPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {studyTasks.map((task) => (
          <div key={task.id} style={{
            display: 'flex',
            backgroundColor: 'var(--bg-sidebar)',
            border: `1px solid ${task.is_completed ? '#10b981' : 'var(--border-color)'}`,
            borderRadius: '12px',
            overflow: 'hidden',
            opacity: task.is_completed ? 0.7 : 1,
            transition: 'all 0.2s ease',
          }}>
            {/* Status Line */}
            <div style={{
              width: '6px',
              backgroundColor: task.is_completed ? '#10b981' : '#3b82f6',
            }} />
            
            <div style={{ padding: '1.2rem', display: 'flex', width: '100%', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.5px' }}>
                    {task.task_type}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6b7280' }}>
                    <Clock size={12} /> {task.duration_minutes} phút
                  </span>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: task.is_completed ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: task.is_completed ? 'line-through' : 'none' }}>
                  {task.task_title}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {task.task_description}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!task.is_completed ? (
                  <>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '0.5rem 1rem', borderRadius: '6px',
                      background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
                    }}>
                      <PlayCircle size={16} /> Bắt đầu
                    </button>
                    <button 
                      onClick={() => handleCompleteTask(task.id)}
                      style={{
                        background: 'transparent', color: '#10b981', border: '1px solid #10b981', 
                        padding: '0.4rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500
                      }}>
                      Đánh dấu xong
                    </button>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600, fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                    <CheckCircle2 size={18} /> Đã hoàn thành
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {studyTasks.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            Hôm nay bạn chưa có lịch học nào.
          </div>
        )}
      </div>

    </div>
  );
};
