import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { StaffProfile, Incident } from '../types';

export const useSupervisorData = (enabled: boolean = true) => {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch staff for supervisor's events
        const staffResponse = await api.staff.list({ page: 1, pageSize: 100 });
        const transformedStaff: StaffProfile[] = staffResponse.data.map((s: any) => ({
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

        // Fetch incidents (if endpoint exists, otherwise use empty array)
        // Note: Incidents endpoint may need to be created in backend
        setIncidents([]);
      } catch (err) {
        console.error('Failed to fetch supervisor data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [enabled]);

  const checkInStaff = async (staffId: string, eventId: string) => {
    try {
      // Try to use backend API if available
      try {
        await api.checkins.create({
          staffId,
          eventId,
          method: 'MANUAL',
        });
      } catch (apiError) {
        // If endpoint doesn't exist, just update local state
        console.warn('Check-in API not available, using local state');
      }
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, status: 'On Shift' as any } : s));
    } catch (err) {
      console.error('Failed to check in staff:', err);
      throw err;
    }
  };

  const reportIncident = async (incidentData: Partial<Incident>) => {
    try {
      let newIncident: Incident;
      
      // Try to use backend API if available
      try {
        const result = await api.incidents.create({
          type: incidentData.type || 'Other',
          severity: incidentData.severity || 'Medium',
          description: incidentData.description || '',
          location: incidentData.location || '',
          eventId: incidentData.eventId,
        });
        newIncident = {
          id: result.id || `inc-${Date.now()}`,
          type: result.type || incidentData.type || 'Other',
          severity: result.severity || incidentData.severity || 'Medium',
          description: result.description || incidentData.description || '',
          location: result.location || incidentData.location || '',
          reportedBy: result.reportedBy || incidentData.reportedBy || 'Supervisor',
          reportedAt: result.reportedAt ? new Date(result.reportedAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
          status: result.status || 'Open',
          eventId: result.eventId || incidentData.eventId || '',
        };
      } catch (apiError) {
        // If endpoint doesn't exist, use local state
        console.warn('Incidents API not available, using local state');
        newIncident = {
          id: `inc-${Date.now()}`,
          type: incidentData.type || 'Other',
          severity: incidentData.severity || 'Medium',
          description: incidentData.description || '',
          location: incidentData.location || '',
          reportedBy: incidentData.reportedBy || 'Supervisor',
          reportedAt: new Date().toLocaleTimeString(),
          status: 'Open',
          eventId: incidentData.eventId || '',
        };
      }
      
      setIncidents(prev => [newIncident, ...prev]);
      return newIncident;
    } catch (err) {
      console.error('Failed to report incident:', err);
      throw err;
    }
  };

  return { staff, incidents, isLoading, error, checkInStaff, reportIncident, setStaff, setIncidents };
};

