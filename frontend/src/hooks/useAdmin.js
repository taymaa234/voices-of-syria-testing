import { useState, useCallback } from 'react';
import * as adminService from '../api/adminService';

export default function useAdmin() {
  const [pending, setPending] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.getPendingStories();
      setPending(res);
      return res;
    } catch (err) { setError(err); throw err; } finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await adminService.getAllUsers();
      setUsers(res);
      return res;
    } catch (err) { setError(err); throw err; } finally { setLoading(false); }
  }, []);

  const approve = useCallback(async (id) => {
    await adminService.approveStory(id);
  }, []);

  const reject = useCallback(async (id) => {
    await adminService.rejectStory(id);
  }, []);

  const requestModification = useCallback(async (id, note) => {
    await adminService.requestModification(id, note);
  }, []);

  return { pending, users, loading, error, fetchPending, fetchUsers, approve, reject, requestModification };
}
