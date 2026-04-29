import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(true),
}));

describe('App Component', () => {
  it('renders the sidebar and check status', () => {
    render(<App />);
    expect(screen.getByText('KnowledgeForge')).toBeInTheDocument();
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });
});
