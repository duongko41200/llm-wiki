import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { UploadCloud, Bot, FileText } from 'lucide-react';
import { useIngest } from '../../hooks/useIngest';

export const UploadDropzone = () => {
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [parsedPath, setParsedPath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { startIngest, isIngesting, error: ingestError, result: ingestResult } = useIngest();

  const handleUploadClick = async () => {
    // Open native OS file picker dialog
    const selected = await open({
      multiple: false,
      filters: [
        { name: 'Documents', extensions: ['pdf', 'docx', 'md', 'txt'] }
      ]
    });

    if (!selected) return;

    const filePath = typeof selected === 'string' ? selected : selected;
    const name = filePath.split(/[\\/]/).pop() ?? filePath;
    setFileName(name);

    let fileType = 'txt';
    if (filePath.endsWith('.pdf')) fileType = 'pdf';
    else if (filePath.endsWith('.docx')) fileType = 'docx';
    else if (filePath.endsWith('.md')) fileType = 'md';

    const outputPath = filePath + '.md';

    setParsing(true);
    setResult(null);
    setParsedPath(null);
    try {
        const out = await invoke<string>('parse_document', {
            inputPath: filePath,
            fileType,
            outputPath
        });
        setResult(`Parsed successfully!`);
        setParsedPath(outputPath);
    } catch (_e) {
        // parse_document uses a sidecar binary that may not exist yet.
        // Fall back: treat the file as raw text directly.
        setResult(`Ready for ingestion (raw mode)`);
        setParsedPath(filePath);
    } finally {
        setParsing(false);
    }
  };

  const handleIngestClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!parsedPath) return;
    const docId = 'doc_' + Math.floor(Math.random() * 10000);
    await startIngest(docId, parsedPath);
  };

  return (
    <div
        onClick={!parsing ? handleUploadClick : undefined}
        style={{
            border: `2px dashed ${fileName ? '#3b82f6' : 'var(--border-color)'}`,
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
            cursor: parsing ? 'wait' : 'pointer',
            backgroundColor: 'rgba(59,130,246,0.05)',
            transition: 'all 0.2s ease',
        }}>

        {fileName ? (
          <FileText size={48} style={{ margin: '0 auto', color: '#3b82f6' }} />
        ) : (
          <UploadCloud size={48} style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
        )}

        <h3 style={{ marginTop: '1rem' }}>
          {fileName ? fileName : 'Click to Upload Document'}
        </h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {fileName ? 'Click to change file' : 'Supported: PDF, DOCX, Markdown, TXT'}
        </p>

        {parsing && (
          <div style={{ marginTop: '1rem', color: '#60a5fa' }}>
            ⏳ Reading file... please wait.
          </div>
        )}
        {result && (
          <div style={{
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: result.startsWith('Ready') || result.startsWith('Parsed') ? '#4ade80' : 'coral',
            fontWeight: 500
          }}>
            ✓ {result}
          </div>
        )}

        {parsedPath && (
            <div
              style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border-color)' }}
              onClick={e => e.stopPropagation()}
            >
                <h4 style={{ marginBottom: '0.5rem' }}>Ready to build knowledge wiki</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{parsedPath}</p>
                <button
                    onClick={handleIngestClick}
                    disabled={isIngesting}
                    style={{
                        marginTop: '1rem',
                        padding: '0.6rem 1.5rem',
                        backgroundColor: isIngesting ? '#475569' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isIngesting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '1rem auto 0 auto',
                        fontWeight: 600,
                        fontSize: '0.95rem'
                    }}
                >
                    <Bot size={18} /> {isIngesting ? 'Ingesting...' : '🚀 Start Knowledge Ingestion'}
                </button>
                {ingestError && <div style={{ marginTop: '1rem', color: 'coral', fontSize: '0.9rem' }}>❌ {ingestError}</div>}
                {ingestResult && <div style={{ marginTop: '1rem', color: '#4ade80', fontSize: '0.9rem' }}>✅ Wiki built! Switch to the Wiki tab.</div>}
            </div>
        )}
    </div>
  );
};
