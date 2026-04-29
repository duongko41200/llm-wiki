import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Database from '@tauri-apps/plugin-sql';

export interface IngestResult {
  document_id: string;
  status: string;
  wiki_source_path: string | null;
  error_message: string | null;
}

export const useIngest = () => {
  const [isIngesting, setIsIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResult | null>(null);

  const startIngest = async (documentId: string, rawPath: string) => {
    setIsIngesting(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Starting ingest for ${documentId} with path ${rawPath}`);
      const res = await invoke<IngestResult>('ingest_document', {
        documentId,
        rawPath,
      });
      
      console.log('Ingest result:', res);
      setResult(res);

      // Update the DB if successful
      if (res.status === 'ready') {
        try {
          const db = await Database.load('sqlite:knowledge_forge.db');
          await db.execute(
            `UPDATE documents SET status = $1, wiki_source_path = $2, updated_at = datetime('now') WHERE id = $3`,
            ['ready', res.wiki_source_path, documentId]
          );
          console.log('Database updated successfully for document:', documentId);
        } catch (dbError) {
          console.error('Failed to update DB:', dbError);
        }
      }

      return res;
    } catch (err: any) {
      console.error('Ingest error:', err);

      // Provide user-friendly error messages
      const errStr = err.toString();
      let friendlyError = errStr;

      if (errStr.includes('10061') || errStr.includes('refused') || errStr.includes('connect')) {
        friendlyError = 'Ollama chưa chạy! Hãy mở terminal và chạy lệnh: ollama serve — sau đó thử lại.';
      } else if (errStr.includes('Ollama API returned status')) {
        friendlyError = 'Ollama báo lỗi. Kiểm tra model đã được pull chưa: ollama pull qwen2.5:3b';
      } else if (errStr.includes('parse JSON')) {
        friendlyError = 'Model AI trả về định dạng không đúng. Thử lại lần nữa.';
      }

      setError(friendlyError);

      try {
        const db = await Database.load('sqlite:knowledge_forge.db');
        await db.execute(
          `UPDATE documents SET status = $1, error_message = $2, updated_at = datetime('now') WHERE id = $3`,
          ['error', errStr, documentId]
        );
      } catch (dbError) {
        console.error('Failed to update DB with error state:', dbError);
      }

      throw new Error(friendlyError);
    } finally {
      setIsIngesting(false);
    }
  };

  return {
    startIngest,
    isIngesting,
    error,
    result,
  };
};
