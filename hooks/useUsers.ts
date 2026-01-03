import { useState, useEffect } from 'react';
// Backend API removed - using mock data only

export const useUsers = (enabled: boolean = true, filters?: { role?: string; search?: string }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchUsers = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.users.list({
          page: 1,
          pageSize: 100,
          role: filters?.role !== 'All' ? filters?.role : undefined,
          search: filters?.search || undefined,
        });
        setUsers(response.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 60000);
    return () => clearInterval(interval);
  }, [enabled, filters?.role, filters?.search]);

  const activateUser = async (userId: string) => {
    try {
      await api.users.activate(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: true } : u));
    } catch (err) {
      console.error('Failed to activate user:', err);
      throw err;
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      await api.users.deactivate(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u));
    } catch (err) {
      console.error('Failed to deactivate user:', err);
      throw err;
    }
  };

  return { users, isLoading, error, activateUser, deactivateUser, setUsers };
};

