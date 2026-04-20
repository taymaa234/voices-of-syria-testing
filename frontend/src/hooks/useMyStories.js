import { useState, useCallback } from 'react';
import * as storyService from '../api/storyService';
import useAuth from './useAuth';

export default function useMyStories() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    console.log('🔍 useMyStories: Starting fetch...');
    console.log('useMyStories: Current user object:', user);
    console.log('useMyStories: User ID:', user?.id, 'Type:', typeof user?.id);
    if (!user?.id) {
      console.log('❌ useMyStories: No user ID found', user);
      return null;
    }
    // Convert to number if it's a string
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    console.log('✅ useMyStories: Converted user ID:', userId, 'Type:', typeof userId);
    console.log('🚀 useMyStories: Fetching stories for user ID:', userId);
    setLoading(true); setError(null);
    try {
      const res = await storyService.getMyStories(userId);
      console.log('✅ useMyStories: Raw API response:', res);
      console.log('useMyStories: Response type:', typeof res, 'Is array:', Array.isArray(res));
      console.log('useMyStories: Response length:', Array.isArray(res) ? res.length : 'N/A');
      if (Array.isArray(res) && res.length > 0) {
        console.log('✅ useMyStories: First story sample:', res[0]);
      } else {
        console.log('⚠️ useMyStories: Response is empty or not an array');
      }
      setData(res);
      return res;
    } catch (err) {
      console.error('❌ useMyStories: Error fetching stories:', err);
      console.error('useMyStories: Error details:', err.message);
      console.error('useMyStories: Error response:', err.response?.data);
      console.error('useMyStories: Error status:', err.response?.status);
      setError(err); throw err;
    } finally { setLoading(false); }
  }, [user]);

  const remove = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      await storyService.deleteStory(id);
      await fetch();
    } catch (err) { setError(err); throw err; } finally { setLoading(false); }
  }, [fetch]);

  return { data, loading, error, fetch, remove };
}
