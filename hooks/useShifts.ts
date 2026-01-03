import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { Shift } from '../types';

export const useShifts = (enabled: boolean = true) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchShifts = async () => {
      setIsLoading(true);
      try {
        // Assuming shifts are assignments linked to events
        const response = await api.events.list({ status: 'APPROVED' });
        const fetchedShifts: Shift[] = response.data.flatMap((event: any) => {
          return [{
            id: `shift-${event.id}`,
            eventId: event.id,
            eventTitle: event.title,
            location: event.location?.address || event.location || 'N/A',
            startTime: new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            endTime: new Date(event.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(event.startAt).toISOString().split('T')[0],
            status: 'Scheduled',
            confirmationStatus: 'Confirmed',
            wage: event.pay || 0,
            attire: 'Formal',
            contactPerson: 'Event Manager',
            contactPhone: '+974 12345678',
            instructions: event.description || 'No specific instructions.',
            attendanceStatus: 'On Time'
          }];
        });
        setShifts(fetchedShifts);
      } catch (err) {
        console.error('Failed to fetch shifts:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shifts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchShifts();
    const interval = setInterval(fetchShifts, 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  const confirmShift = async (shiftId: string, status: 'Confirmed' | 'Declined') => {
    try {
      const shift = shifts.find(s => s.id === shiftId);
      if (!shift) return;

      // Note: Assignment update endpoint doesn't exist yet
      // In a real implementation, we'd call: PUT /events/{eventId}/assignments/{assignmentId}
      setShifts(prev => prev.map(s => s.id === shiftId ? {
        ...s,
        confirmationStatus: status === 'Confirmed' ? 'Confirmed' : 'Declined',
        status: status === 'Confirmed' ? 'Scheduled' : 'Cancelled'
      } : s));
    } catch (err) {
      console.error('Failed to confirm shift:', err);
      throw err;
    }
  };

  return { shifts, isLoading, error, confirmShift, setShifts };
};

