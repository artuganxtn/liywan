import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { Booking } from '../types';

export const useBookings = (enabled: boolean = true) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchBookings = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.bookings.list({ page: 1, pageSize: 100 });
        const transformedBookings: Booking[] = response.data.map((b: any) => ({
          id: b.id,
          eventType: b.eventType,
          date: b.date,
          time: b.time,
          duration: b.duration,
          location: b.location,
          budget: b.budget,
          staff: b.staff as any,
          contact: b.contact as any,
          eventDetails: b.eventDetails as any,
          status: b.status === 'PENDING' ? 'Pending' :
                  b.status === 'UNDER_REVIEW' ? 'Under Review' :
                  b.status === 'APPROVED' ? 'Approved' :
                  b.status === 'REJECTED' ? 'Rejected' : 'Converted',
          submittedDate: new Date(b.submittedAt).toISOString().split('T')[0],
          convertedToEventId: b.convertedToEventId,
        }));
        setBookings(transformedBookings);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings';
        if (errorMessage.includes('Authentication required') || errorMessage.includes('401')) {
          setError(null);
          if (bookings.length === 0) {
            setBookings([]);
          }
        } else {
          console.error('Failed to fetch bookings:', err);
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
    const interval = setInterval(() => {
      if (localStorage.getItem('auth_token')) {
        fetchBookings();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [enabled, bookings.length]);

  const updateBooking = async (id: string, status: string) => {
    try {
      await api.bookings.update(id, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));
    } catch (err) {
      console.error('Failed to update booking:', err);
      throw err;
    }
  };

  const convertToEvent = async (id: string) => {
    try {
      const result = await api.bookings.convertToEvent(id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Converted' as any, convertedToEventId: result.eventId } : b));
      return result;
    } catch (err) {
      console.error('Failed to convert booking:', err);
      throw err;
    }
  };

  return { bookings, isLoading, error, updateBooking, convertToEvent, setBookings };
};

