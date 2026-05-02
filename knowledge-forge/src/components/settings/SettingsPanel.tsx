import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Bot, Key, CheckCircle, XCircle, Loader, ChevronDown } from 'lucide-react';
import { useAppStore, LlmProviderType, OLLAMA_MODELS, GEMINI_MODELS } from '../../stores/appStore';

export const SettingsPanel: React.FC = () => {
  const { llmConfig, setLlmConfig } = useAppStore();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Auto-correct invalid models from old persisted state
  useEffect(() => {
    if (llmConfig.provider === 'gemini' && !GEMINI_MODELS.includes(llmConfig.model)) {
      setLlmConfig({ model: GEMINI_MODELS[0] });
    } else if (llmConfig.provider === 'ollama' && !OLLAMA_MODELS.includes(llmConfig.model)) {
      setLlmConfig({ model: OLLAMA_MODELS[0] });
    }
  }, [llmConfig.provider, llmConfig.model, setLlmConfig]);

  const handleProviderChange = (provider: LlmProviderType) => {
    const defaultModel = provider === 'ollama' ? OLLAMA_MODELS[0] : GEMINI_MODELS[0];
    setLlmConfig({ provider, model: defaultModel, api_key: undefined });
    setTestStatus('idle');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      if (llmConfig.provider === 'ollama') {
        const ok = await invoke<boolean>('check_ollama');
        if (ok) {
          setTestStatus('ok');
          setTestMessage(`Kết nối Ollama thành công! Model: ${llmConfig.model}`);
        } else {
          setTestStatus('fail');
          setTestMessage('Ollama đang offline. Hãy chạy lệnh: ollama serve');
        }
      } else if (llmConfig.provider === 'gemini') {
        if (!llmConfig.api_key) {
          setTestStatus('fail');
          setTestMessage('Chưa nhập Gemini API Key.');
          return;
        }
        // Test via generateContent (non-streaming, simpler)
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${llmConfig.model}:generateContent?key=${llmConfig.api_key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: 'Reply with exactly one word: OK' }] }]
            })
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'OK';
          setTestStatus('ok');
          setTestMessage(`✅ Kết nối Gemini thành công! Model: ${llmConfig.model} — Phản hồi: "${text.trim().slice(0, 50)}"`);
        } else {
          const err = await res.json().catch(() => ({}));
          setTestStatus('fail');
          setTestMessage(`❌ Lỗi Gemini: ${err?.error?.message || res.statusText}`);
        }
      }
    } catch (e) {
      setTestStatus('fail');
      setTestMessage(`Lỗi kết nối: ${e}`);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
    fontWeight: 500,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    fontSize: '0.95rem',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    cursor: 'pointer',
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Bot size={24} /> Cài đặt LLM Provider
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Chọn mô hình AI để xử lý câu hỏi và sinh nội dung. Mọi cài đặt được lưu tự động.
      </p>

      {/* Provider Selection */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🤖 Chọn nhà cung cấp</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(['ollama', 'gemini'] as LlmProviderType[]).map((p) => (
            <button
              key={p}
              onClick={() => handleProviderChange(p)}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '10px',
                border: `2px solid ${llmConfig.provider === p ? '#3b82f6' : 'var(--border-color)'}`,
                backgroundColor: llmConfig.provider === p ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                transition: 'all 0.15s ease',
              }}
            >
              {p === 'ollama' ? '🖥️ Ollama Local' : '✨ Google Gemini'}
              <div style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {p === 'ollama' ? 'Chạy trên máy, miễn phí' : 'Nhanh hơn, cần API Key'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Model Config */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem 0' }}>⚙️ Cấu hình mô hình</h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Model</label>
          <div style={{ position: 'relative' }}>
            <select
              value={llmConfig.model}
              onChange={(e) => setLlmConfig({ model: e.target.value })}
              style={selectStyle}
            >
              {(llmConfig.provider === 'ollama' ? OLLAMA_MODELS : GEMINI_MODELS).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {llmConfig.provider === 'gemini' && (
          <div>
            <label style={labelStyle}>
              <Key size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIza..."
              value={llmConfig.api_key || ''}
              onChange={(e) => setLlmConfig({ api_key: e.target.value || undefined })}
              style={inputStyle}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Lấy API Key miễn phí tại{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60a5fa' }}
              >
                Google AI Studio
              </a>
              {' '}(15 req/phút miễn phí với gemini-2.5-flash)
            </p>
          </div>
        )}

        {llmConfig.provider === 'ollama' && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Đảm bảo Ollama đang chạy (<code style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1px 4px', borderRadius: '3px' }}>ollama serve</code>) và model đã được pull về.
          </p>
        )}
      </div>

      {/* Test Connection */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 1rem 0' }}>🔌 Kiểm tra kết nối</h3>
        <button
          onClick={handleTest}
          disabled={testStatus === 'testing'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.2rem',
            backgroundColor: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: '8px', cursor: testStatus === 'testing' ? 'not-allowed' : 'pointer',
            fontWeight: 600, fontSize: '0.9rem',
            opacity: testStatus === 'testing' ? 0.7 : 1,
          }}
        >
          {testStatus === 'testing' ? <Loader size={16} className="spin" /> : null}
          {testStatus === 'testing' ? 'Đang kiểm tra...' : 'Kiểm tra kết nối'}
        </button>

        {testStatus !== 'idle' && testStatus !== 'testing' && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: testStatus === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${testStatus === 'ok' ? '#22c55e' : '#ef4444'}`,
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            {testStatus === 'ok' ? <CheckCircle size={18} color="#22c55e" /> : <XCircle size={18} color="#ef4444" />}
            <span style={{ fontSize: '0.9rem' }}>{testMessage}</span>
          </div>
        )}
      </div>

      {/* Current config summary */}
      <div style={{ ...cardStyle, backgroundColor: 'rgba(59,130,246,0.05)' }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem' }}>📋 Cấu hình hiện tại</h3>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <div>Provider: <strong style={{ color: 'var(--text-main)' }}>{llmConfig.provider === 'ollama' ? 'Ollama Local' : 'Google Gemini'}</strong></div>
          <div>Model: <strong style={{ color: 'var(--text-main)' }}>{llmConfig.model}</strong></div>
          {llmConfig.provider === 'gemini' && (
            <div>API Key: <strong style={{ color: 'var(--text-main)' }}>{llmConfig.api_key ? `${llmConfig.api_key.slice(0, 8)}...` : '❌ Chưa nhập'}</strong></div>
          )}
        </div>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
