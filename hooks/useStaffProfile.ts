import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { StaffProfile } from '../types';

export const useStaffProfile = (userId: string) => {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const staffProfile = await api.staff.getProfile(userId);
        const userProfile = await api.users.getMe();
        const profileData: StaffProfile = {
          id: staffProfile.id,
          name: userProfile.displayName || userProfile.email,
          email: userProfile.email,
          phone: userProfile.phone || '',
          role: staffProfile.role || 'General Staff',
          skills: staffProfile.skills?.map((s: string) => ({ name: s, status: 'Verified' })) || [],
          certifications: staffProfile.certifications || [],
          imageUrl: userProfile.avatarUrl || `https://i.pravatar.cc/150?u=${userProfile.email}`,
          xpPoints: staffProfile.xpPoints || 0,
          level: staffProfile.level || 'Bronze',
          location: staffProfile.location || 'Doha',
          completedShifts: staffProfile.completedShifts || 0,
          onTimeRate: staffProfile.onTimeRate || 100,
          rating: staffProfile.rating || 5,
          status: 'Available',
          totalEarnings: 0,
          joinedDate: '',
          feedback: [],
        };
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to fetch staff profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    const interval = setInterval(fetchProfile, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const updateProfile = async (data: Partial<StaffProfile>) => {
    try {
      // Update user profile
      await api.users.updateMe({
        displayName: data.name,
        phone: data.phone,
      });

      // Update staff profile
      await api.staff.updateProfile(userId, {
        bio: data.bio,
        skills: data.skills?.map(s => s.name) || [],
        role: data.role,
        location: data.location,
      });

      setProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  return { profile, isLoading, error, updateProfile };
};

