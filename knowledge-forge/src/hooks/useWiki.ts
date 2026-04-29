import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const useWiki = () => {
  const [indexContent, setIndexContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWikiIndex = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await invoke<string>('get_wiki_index');
      setIndexContent(content);
    } catch (err: any) {
      console.error('Failed to load wiki index:', err);
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    indexContent,
    isLoading,
    error,
    loadWikiIndex,
  };
};
