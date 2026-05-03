import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore, ErrorNote } from '../../stores/appStore';
import { StickyNote } from './StickyNote';
import { Plus } from 'lucide-react';

export const StickyNotesBoard: React.FC = () => {
  const { errorNotes, setErrorNotes, updateNotePosition } = useAppStore();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<'All' | 'Grammar' | 'Vocabulary' | 'Pronunciation'>('All');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const notes: ErrorNote[] = await invoke('get_error_notes');
      setErrorNotes(notes);
    } catch (err) {
      console.error("Failed to load error notes", err);
    }
  };

  const handleDragStart = (id: number) => {
    setDraggingId(id);
  };

  const handleDragEnd = async (id: number, x: number, y: number) => {
    setDraggingId(null);
    updateNotePosition(id, x, y);
    try {
      await invoke('update_note_position', { id, x, y });
    } catch (err) {
      console.error("Failed to update position on backend", err);
    }
  };

  const handleAddManualNote = async () => {
    try {
      await invoke('create_error_note', {
        category: "Other",
        title: "Ghi chú mới",
        description: "Bấm đúp để sửa (Tính năng đang phát triển)",
        source: "manual"
      });
      // Refresh notes
      loadNotes();
    } catch (err) {
      console.error("Failed to create note", err);
    }
  };

  const filteredNotes = errorNotes.filter(note => {
    if (filter === 'All') return true;
    return note.category.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['All', 'Grammar', 'Vocabulary', 'Pronunciation'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                border: '1px solid var(--border-color)',
                background: filter === cat ? 'var(--text-main)' : 'transparent',
                color: filter === cat ? 'var(--bg-main)' : 'var(--text-main)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={handleAddManualNote}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Thêm ghi chú
        </button>
      </div>

      {/* Board Area */}
      <div 
        style={{ 
          flex: 1, 
          position: 'relative', 
          backgroundColor: 'var(--bg-sidebar)', // Slightly different from main bg
          borderRadius: '12px',
          border: '1px dashed var(--border-color)',
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {filteredNotes.length === 0 && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)', textAlign: 'center' }}>
            <p>Không có ghi chú nào.</p>
            <p style={{ fontSize: '0.85rem' }}>AI sẽ tự động tạo ghi chú khi phát hiện lỗi trong bài làm của bạn.</p>
          </div>
        )}

        {filteredNotes.map(note => (
          <StickyNote
            key={note.id}
            note={note}
            isDragging={draggingId === note.id}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>
    </div>
  );
};
