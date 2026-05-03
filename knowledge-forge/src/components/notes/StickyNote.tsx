import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Trash2, Repeat } from 'lucide-react';
import { ErrorNote, useAppStore } from '../../stores/appStore';
import { invoke } from '@tauri-apps/api/core';

interface StickyNoteProps {
  note: ErrorNote;
  onDragStart: (id: number) => void;
  onDragEnd: (id: number, x: number, y: number) => void;
  isDragging: boolean;
}

export const StickyNote: React.FC<StickyNoteProps> = ({ note, onDragStart, onDragEnd, isDragging }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: note.position_x, y: note.position_y });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const { updateNoteResolved, removeErrorNote } = useAppStore();

  useEffect(() => {
    setPosition({ x: note.position_x, y: note.position_y });
  }, [note.position_x, note.position_y]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'grammar': return '#fee2e2'; // Light red
      case 'vocabulary': return '#fef3c7'; // Light yellow
      case 'pronunciation': return '#e0f2fe'; // Light blue
      default: return '#f3f4f6'; // Gray
    }
  };

  const getCategoryBorder = (category: string) => {
    switch (category.toLowerCase()) {
      case 'grammar': return '#f87171';
      case 'vocabulary': return '#fbbf24';
      case 'pronunciation': return '#38bdf8';
      default: return '#9ca3af';
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'button' || (e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      onDragStart(note.id);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      // Calculate position relative to the board
      // Assuming board is the parent relative container
      const board = nodeRef.current?.parentElement;
      if (board) {
        const boardRect = board.getBoundingClientRect();
        let newX = e.clientX - boardRect.left - offset.x;
        let newY = e.clientY - boardRect.top - offset.y;

        // Boundary checks
        newX = Math.max(0, Math.min(newX, boardRect.width - (nodeRef.current?.offsetWidth || 200)));
        newY = Math.max(0, Math.min(newY, boardRect.height - (nodeRef.current?.offsetHeight || 150)));

        setPosition({ x: newX, y: newY });
      }
    }
  };

  const handlePointerUp = () => {
    if (isDragging) {
      onDragEnd(note.id, position.x, position.y);
    }
  };

  const toggleResolved = async () => {
    try {
      await invoke('toggle_note_resolved', { id: note.id, isResolved: !note.is_resolved });
      updateNoteResolved(note.id, !note.is_resolved);
    } catch (err) {
      console.error("Failed to toggle note", err);
    }
  };

  const deleteNote = async () => {
    try {
      await invoke('delete_error_note', { id: note.id });
      removeErrorNote(note.id);
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  return (
    <div
      ref={nodeRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '240px',
        minHeight: '140px',
        backgroundColor: getCategoryColor(note.category),
        borderTop: `4px solid ${getCategoryBorder(note.category)}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 100 : 1,
        touchAction: 'none',
        opacity: note.is_resolved ? 0.6 : 1,
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease, opacity 0.3s ease',
        color: '#1f2937',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: getCategoryBorder(note.category) }}>
          {note.category}
        </span>
        
        {isHovered && !isDragging && (
          <button 
            onClick={(e) => { e.stopPropagation(); deleteNote(); }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 0 }}
            title="Xóa ghi chú"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px', lineHeight: 1.3 }}>
        {note.title}
      </div>
      
      <div style={{ fontSize: '0.85rem', flex: 1, marginBottom: '12px', opacity: 0.8, wordBreak: 'break-word' }}>
        {note.description}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
          <Repeat size={12} />
          Lặp: {note.repeat_count} lần
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toggleResolved(); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: note.is_resolved ? '#10b981' : 'rgba(0,0,0,0.05)',
            color: note.is_resolved ? '#fff' : '#374151',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {note.is_resolved ? (
            <><CheckCircle size={14} /> Đã sửa</>
          ) : (
            <><XCircle size={14} /> Chưa sửa</>
          )}
        </button>
      </div>
    </div>
  );
};
