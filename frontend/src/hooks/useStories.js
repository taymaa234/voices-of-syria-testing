import { useState, useCallback } from 'react';
import * as storyService from '../api/storyService';

export default function useStories() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (params) => {
    setLoading(true); setError(null);
    try {
      const res = await storyService.fetchStories(params);
      setData(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submit = useCallback(async (payload, contentType, options) => {
    setLoading(true); setError(null);
    try {
      const res = await storyService.submitNewStory(payload, contentType, options);
      return res;
    } catch (err) { setError(err); throw err; } finally { setLoading(false); }
  }, []);

  return { data, loading, error, fetchAll, submit };
}
