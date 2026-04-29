import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

type OllamaState = 'checking' | 'not_installed' | 'installed_not_running' | 'running_no_models' | 'ready';

interface PullProgress {
  status: string;
  completed?: number;
  total?: number;
}

const MODELS = [
  {
    id: 'qwen2.5:3b',
    label: 'Qwen 2.5 (3B)',
    desc: 'Nhẹ, nhanh — phù hợp với 8GB RAM, tốt cho tiếng Việt',
    size: '~2.0 GB',
    recommended: true,
  },
  {
    id: 'qwen2.5:7b',
    label: 'Qwen 2.5 (7B)',
    desc: 'Chất lượng cao hơn — cần ≥ 12GB RAM khả dụng',
    size: '~4.4 GB',
    recommended: false,
  },
  {
    id: 'llama3.1:8b',
    label: 'Llama 3.1 (8B)',
    desc: 'Model mạnh của Meta, giỏi suy luận — cần RAM ≥ 16GB',
    size: '~4.7 GB',
    recommended: false,
  },
];

interface Props {
  onReady: () => void;
}

export const OllamaSetup = ({ onReady }: Props) => {
  const [state, setState] = useState<OllamaState>('checking');
  const [starting, setStarting] = useState(false);
  const [pulling, setPulling] = useState<string | null>(null);
  const [pullProgress, setPullProgress] = useState<PullProgress | null>(null);
  const [pullPercent, setPullPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);
  const [installPercent, setInstallPercent] = useState(0);
  const [installDone, setInstallDone] = useState(false);

  const detectState = useCallback(async () => {
    setState('checking');
    setError(null);
    try {
      const isRunning = await invoke<boolean>('check_ollama');
      if (isRunning) {
        // Check models
        const res = await fetch('http://127.0.0.1:11434/api/tags').then(r => r.json()).catch(() => ({ models: [] }));
        const models: string[] = (res.models ?? []).map((m: any) => m.name as string);
        setInstalledModels(models);
        if (models.length > 0) {
          setState('ready');
          onReady();
        } else {
          setState('running_no_models');
        }
        return;
      }
      const isInstalled = await invoke<boolean>('check_ollama_installed');
      setState(isInstalled ? 'installed_not_running' : 'not_installed');
    } catch {
      setState('not_installed');
    }
  }, [onReady]);

  useEffect(() => {
    detectState();
  }, [detectState]);

  // Listen for pull progress events
  useEffect(() => {
    const unlisten = listen<string>('ollama_pull_progress', event => {
      try {
        const data = JSON.parse(event.payload) as PullProgress;
        setPullProgress(data);
        if (data.total && data.completed) {
          setPullPercent(Math.round((data.completed / data.total) * 100));
        }
      } catch { /* ignore */ }
    });
    const unlistenDone = listen<string>('ollama_pull_done', () => {
      setPulling(null);
      setPullProgress(null);
      setPullPercent(0);
      detectState();
    });
    // Listen for install events
    const unlistenInstall = listen<{status: string; percent: number}>('ollama_install_progress', event => {
      setInstallStatus(event.payload.status);
      setInstallPercent(event.payload.percent);
    });
    const unlistenInstallDone = listen('ollama_install_launched', () => {
      setInstallDone(true);
      setInstalling(false);
    });
    return () => {
      unlisten.then(fn => fn());
      unlistenDone.then(fn => fn());
      unlistenInstall.then(fn => fn());
      unlistenInstallDone.then(fn => fn());
    };
  }, [detectState]);

  const handleInstallOllama = async () => {
    setInstalling(true);
    setInstallStatus('Đang chuẩn bị tải xuống...');
    setInstallPercent(0);
    setInstallDone(false);
    setError(null);
    try {
      await invoke('install_ollama');
    } catch (e: any) {
      setError(e.toString());
      setInstalling(false);
    }
  };

  const handleStartOllama = async () => {
    setStarting(true);
    setError(null);
    try {
      await invoke('start_ollama_serve');
      await detectState();
    } catch (e: any) {
      setError(e.toString());
    } finally {
      setStarting(false);
    }
  };

  const handlePullModel = async (modelId: string) => {
    setPulling(modelId);
    setPullPercent(0);
    setError(null);
    try {
      await invoke('pull_ollama_model', { model: modelId });
    } catch (e: any) {
      setError(e.toString());
      setPulling(null);
    }
  };

  // ---- Render helpers ----

  const Step = ({ n, label, active }: { n: number; label: string; active: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: active ? 1 : 0.4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        backgroundColor: active ? '#3b82f6' : 'var(--border-color)',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
      }}>{n}</div>
      <span style={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }}>{label}</span>
    </div>
  );

  if (state === 'checking') {
    return (
      <div style={containerStyle}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚙️</div>
        <p style={{ color: 'var(--text-muted)' }}>Đang kiểm tra Ollama...</p>
      </div>
    );
  }

  if (state === 'ready') {
    return (
      <div style={{ ...containerStyle, borderColor: '#22c55e' }}>
        <div style={{ fontSize: '2.5rem' }}>✅</div>
        <h3 style={{ color: '#22c55e', marginTop: '0.5rem' }}>Ollama đã sẵn sàng!</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Models: {installedModels.join(', ')}
        </p>
        <button onClick={detectState} style={ghostBtn}>🔄 Kiểm tra lại</button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤖</div>
      <h2 style={{ margin: 0 }}>Thiết lập Ollama AI</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
        KnowledgeForge cần Ollama để phân tích tài liệu và trả lời câu hỏi.
      </p>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1.5rem 0', alignSelf: 'stretch' }}>
        <Step n={1} label="Cài Ollama" active={state === 'not_installed'} />
        <Step n={2} label="Khởi động Ollama" active={state === 'installed_not_running'} />
        <Step n={3} label="Tải model AI" active={state === 'running_no_models'} />
      </div>

      {/* Action panel per state */}
      {state === 'not_installed' && (
        <div style={{ ...panelStyle, gap: '0.75rem' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ollama chưa được cài. Bấm để tải về và cài đặt tự động (~100MB):
          </p>

          {!installing && !installDone && (
            <button onClick={handleInstallOllama} style={primaryBtn}>
              ⬇️ Tải & Cài Ollama tự động
            </button>
          )}

          {(installing || installStatus) && !installDone && (
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {installStatus}
              </div>
              <div style={{ height: 8, backgroundColor: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${installPercent}%`,
                  backgroundColor: '#3b82f6',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                  backgroundImage: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.3rem', textAlign: 'right' }}>
                {installPercent}%
              </div>
            </div>
          )}

          {installDone && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#4ade80', fontWeight: 600, marginBottom: '0.5rem' }}>
                ✅ Trình cài đặt đã mở! Hoàn tất cài đặt rồi bấm kiểm tra lại.
              </div>
              <button onClick={detectState} style={ghostBtn}>🔄 Kiểm tra lại</button>
            </div>
          )}

          {error && <p style={{ color: 'coral', fontSize: '0.85rem', margin: 0 }}>❌ {error}</p>}
        </div>
      )}


      {state === 'installed_not_running' && (
        <div style={panelStyle}>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ollama đã cài nhưng chưa chạy. Bấm để khởi động ngay:
          </p>
          <button onClick={handleStartOllama} disabled={starting} style={primaryBtn}>
            {starting ? '⏳ Đang khởi động...' : '🚀 Khởi động Ollama'}
          </button>
          {error && <p style={{ color: 'coral', fontSize: '0.85rem', marginTop: '0.5rem' }}>❌ {error}</p>}
        </div>
      )}

      {state === 'running_no_models' && (
        <div style={{ ...panelStyle, alignItems: 'stretch' }}>
          <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Chọn model AI để tải về máy (máy 8GB RAM → dùng Qwen 2.5 3B):
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MODELS.map(m => (
              <div key={m.id} style={modelCardStyle(pulling === m.id, m.recommended)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{m.label}</span>
                    {m.recommended && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700,
                        backgroundColor: '#3b82f6', color: '#fff',
                        padding: '1px 7px', borderRadius: 10
                      }}>⭐ Khuyến nghị</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '0.2rem' }}>{m.size}</div>

                  {pulling === m.id && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        {pullProgress?.status ?? 'Đang kết nối...'} {pullPercent > 0 ? `— ${pullPercent}%` : ''}
                      </div>
                      <div style={{ height: 6, backgroundColor: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', backgroundColor: '#3b82f6',
                          width: `${pullPercent}%`, transition: 'width 0.3s ease',
                          borderRadius: 3,
                        }} />
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handlePullModel(m.id)}
                  disabled={pulling !== null}
                  style={pulling === m.id ? pullingBtn : smallBtn}
                >
                  {pulling === m.id ? '⏳' : '⬇️ Tải'}
                </button>
              </div>
            ))}
          </div>
          {error && <p style={{ color: 'coral', fontSize: '0.85rem', marginTop: '0.75rem' }}>❌ {error}</p>}
        </div>
      )}
    </div>
  );
};

// ---- Styles ----
const containerStyle: React.CSSProperties = {
  border: '1.5px solid var(--border-color)',
  borderRadius: 16,
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: '0.25rem',
  background: 'rgba(59,130,246,0.04)',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-card)',
  borderRadius: 10,
  padding: '1.25rem',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.75rem',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '0.95rem',
  transition: 'background 0.2s',
};

const ghostBtn: React.CSSProperties = {
  padding: '0.45rem 1rem',
  backgroundColor: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--border-color)',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: '0.85rem',
  marginTop: '0.5rem',
};

const smallBtn: React.CSSProperties = {
  padding: '0.4rem 0.85rem',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
  flexShrink: 0,
  alignSelf: 'flex-start',
};

const pullingBtn: React.CSSProperties = {
  ...smallBtn,
  backgroundColor: '#475569',
  cursor: 'not-allowed',
};

const modelCardStyle = (active: boolean, recommended = false): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1rem',
  padding: '0.85rem 1rem',
  backgroundColor: active
    ? 'rgba(59,130,246,0.1)'
    : recommended
    ? 'rgba(59,130,246,0.05)'
    : 'var(--bg-main)',
  border: `1.5px solid ${
    active ? '#3b82f6' : recommended ? '#3b82f6' : 'var(--border-color)'
  }`,
  borderRadius: 8,
  transition: 'all 0.2s',
});
