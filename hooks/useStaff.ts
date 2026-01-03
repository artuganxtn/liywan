import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { StaffProfile } from '../types';

export const useStaff = (enabled: boolean = true) => {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchStaff = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await api.staff.list({ page: 1, pageSize: 100 });
        const transformedStaff: StaffProfile[] = response.data.map((s: any) => ({
          id: s.id,
          name: s.user?.displayName || s.user?.email || 'Unknown',
          role: s.role || 'General Staff',
          rating: s.rating || 5,
          status: s.availability?.status || 'Available',
          skills: s.skills?.map((skill: string) => ({ name: skill, status: 'Verified' })) || [],
          imageUrl: s.user?.avatarUrl || `https://i.pravatar.cc/150?u=${s.user?.email}`,
          totalEarnings: s.totalEarnings || 0,
          email: s.user?.email || '',
          phone: s.user?.phone || '',
          location: s.location || 'Doha',
          joinedDate: s.user?.createdAt ? new Date(s.user.createdAt).toISOString().split('T')[0] : '',
          completedShifts: s.completedShifts || 0,
          onTimeRate: s.onTimeRate || 100,
          xpPoints: s.xpPoints || 0,
          level: s.level || 'Bronze',
          feedback: [],
        }));
        setStaff(transformedStaff);
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        setError(err instanceof Error ? err.message : 'Failed to load staff');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
    const interval = setInterval(fetchStaff, 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  const updateStaff = async (id: string, data: Partial<StaffProfile>) => {
    try {
      await api.staff.updateProfile(id, {
        bio: data.bio,
        skills: data.skills?.map(s => s.name) || [],
        role: data.role,
        location: data.location,
      });
      setStaff(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    } catch (err) {
      console.error('Failed to update staff:', err);
      throw err;
    }
  };

  return { staff, isLoading, error, updateStaff, setStaff };
};

