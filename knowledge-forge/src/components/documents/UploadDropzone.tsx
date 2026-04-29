import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { UploadCloud, Bot } from 'lucide-react';
import { useIngest } from '../../hooks/useIngest';

export const UploadDropzone = () => {
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [parsedPath, setParsedPath] = useState<string | null>(null);
  const { startIngest, isIngesting, error: ingestError, result: ingestResult } = useIngest();

  const handleUploadClick = async () => {
    // In a real app, use @tauri-apps/plugin-dialog to open a file dialog
    // For now, we will just use a hardcoded path or prompt
    const filePath = prompt("Enter full path to a PDF or DOCX file:");
    if (!filePath) return;
    
    let fileType = "pdf";
    if (filePath.endsWith(".docx")) fileType = "docx";

    // hardcoded output path for now
    const outputPath = filePath + ".md";

    setParsing(true);
    setResult(null);
    setParsedPath(null);
    try {
        const out = await invoke<string>("parse_document", { 
            inputPath: filePath, 
            fileType, 
            outputPath 
        });
        setResult(`Success: ${out}`);
        setParsedPath(outputPath);
    } catch (e) {
        setResult(`Error: ${e}`);
    } finally {
        setParsing(false);
    }
  };

  const handleIngestClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering upload again
    if (!parsedPath) return;
    
    // Using a placeholder document ID for testing
    const docId = "doc_" + Math.floor(Math.random() * 10000);
    await startIngest(docId, parsedPath);
  };

  return (
    <div 
        onClick={handleUploadClick}
        style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '8px',
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: 'rgba(255,255,255,0.05)'
        }}>
        <UploadCloud size={48} style={{ margin: '0 auto', color: 'var(--text-muted)' }} />
        <h3>Click to Upload Document</h3>
        <p style={{ color: 'var(--text-muted)' }}>Supported formats: PDF, DOCX</p>
        
        {parsing && <div style={{ marginTop: '1rem', color: 'lightblue' }}>Parsing document... Please wait.</div>}
        {result && <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: result.startsWith("Error") ? 'coral' : 'lightgreen' }}>{result}</div>}
        
        {parsedPath && (
            <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <h4>Document ready for ingestion</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{parsedPath}</p>
                <button 
                    onClick={handleIngestClick}
                    disabled={isIngesting}
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: isIngesting ? 'gray' : 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isIngesting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        margin: '1rem auto 0 auto'
                    }}
                >
                    <Bot size={18} /> {isIngesting ? 'Ingesting...' : 'Start Knowledge Ingestion'}
                </button>
                {ingestError && <div style={{ marginTop: '1rem', color: 'coral', fontSize: '0.9rem' }}>Ingest Error: {ingestError}</div>}
                {ingestResult && <div style={{ marginTop: '1rem', color: 'lightgreen', fontSize: '0.9rem' }}>Ingest Success! View Wiki tab.</div>}
            </div>
        )}
    </div>
  );
};
