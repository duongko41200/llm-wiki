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
      setError(err.toString());
      
      // Update DB with error
      try {
        const db = await Database.load('sqlite:knowledge_forge.db');
        await db.execute(
          `UPDATE documents SET status = $1, error_message = $2, updated_at = datetime('now') WHERE id = $3`,
          ['error', err.toString(), documentId]
        );
      } catch (dbError) {
        console.error('Failed to update DB with error state:', dbError);
      }
      
      throw err;
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
