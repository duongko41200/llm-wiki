import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import Database from '@tauri-apps/plugin-sql';
import { useAppStore } from '../stores/appStore';

interface IngestProgressPayload {
  status: string;
  percent: number;
}

export const useIngest = () => {
  const {
    ingestStatus, ingestError, ingestResult, ingestProgress,
    setIngestStatus, setIngestError, setIngestResult, setIngestProgress,
  } = useAppStore();

  const startIngest = useCallback(async (documentId: string, rawPath: string) => {
    setIngestStatus('ingesting');
    setIngestError(null);
    setIngestResult(null);
    setIngestProgress(null);

    // Set up progress listener for model pulling if needed
    const unlistenProgress = await listen<IngestProgressPayload>('ingest_progress', (event) => {
      const { status, percent } = event.payload;
      setIngestProgress({ current: percent, total: 100, status });
    });

    try {
      const res = await invoke<typeof ingestResult>('ingest_document', {
        documentId,
        rawPath,
      });

      setIngestResult(res);
      setIngestStatus('done');

      // Update DB record
      if (res?.status === 'ready') {
        try {
          const db = await Database.load('sqlite:knowledge_forge.db');
          await db.execute(
            `UPDATE documents SET status = $1, updated_at = datetime('now') WHERE id = $2`,
            ['ready', documentId]
          );
        } catch (dbErr) {
          console.error('DB update error:', dbErr);
        }
      }
      return res;
    } catch (err: any) {
      const errStr = err?.toString() ?? 'Unknown error';
      let friendly = errStr;
      if (errStr.includes('10061') || errStr.includes('refused') || errStr.includes('chưa chạy')) {
        friendly = '❌ Ollama chưa chạy! Mở terminal và chạy: ollama serve';
      } else if (errStr.includes('timed out') || errStr.includes('timeout')) {
        friendly = '⏱ Lỗi mạng khi nhúng dữ liệu.';
      } else if (errStr.includes('PDF')) {
        friendly = '📄 Không đọc được PDF. Hãy convert sang .txt hoặc .md trước.';
      }
      setIngestError(friendly);
      setIngestStatus('error');

      try {
        const db = await Database.load('sqlite:knowledge_forge.db');
        await db.execute(
          `UPDATE documents SET status = $1, error_message = $2, updated_at = datetime('now') WHERE id = $3`,
          ['error', errStr, documentId]
        );
      } catch (_) {}
    } finally {
      unlistenProgress();
      setIngestProgress(null);
    }
  }, [setIngestStatus, setIngestError, setIngestResult, setIngestProgress]);

  return { startIngest, ingestStatus, ingestError, ingestResult, ingestProgress };
};
