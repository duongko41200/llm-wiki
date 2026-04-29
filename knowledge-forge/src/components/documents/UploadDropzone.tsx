import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { UploadCloud } from 'lucide-react';

export const UploadDropzone = () => {
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
    try {
        const out = await invoke<string>("parse_document", { 
            inputPath: filePath, 
            fileType, 
            outputPath 
        });
        setResult(`Success: ${out}`);
    } catch (e) {
        setResult(`Error: ${e}`);
    } finally {
        setParsing(false);
    }
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
    </div>
  );
};
