import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { Event } from '../types';

export const useEvents = (enabled: boolean = true) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchEvents = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await api.events.list({ page: 1, pageSize: 100 });
        const transformedEvents: Event[] = response.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          location: typeof e.location === 'object' ? e.location.address : e.location,
          date: new Date(e.startAt).toISOString().split('T')[0],
          description: e.description || '',
          status: e.status === 'PENDING' ? 'Pending' :
                  e.status === 'APPROVED' ? 'Upcoming' :
                  e.status === 'LIVE' ? 'Live' :
                  e.status === 'COMPLETED' ? 'Completed' : 'Pending',
          staffRequired: Object.values(e.requiredRoles || {}).reduce((sum: number, count: any) =>
            sum + (typeof count === 'number' ? count : 0), 0),
          staffAssigned: e.assignments?.length || 0,
          revenue: 0,
          roles: Object.entries(e.requiredRoles || {}).map(([roleName, count]) => ({
            roleName,
            count: typeof count === 'number' ? count : 0,
            filled: 0
          })),
        }));
        setEvents(transformedEvents);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  const createEvent = async (eventData: any) => {
    try {
      const result = await api.events.create(eventData);
      const newEvent: Event = {
        id: result.id,
        title: result.title,
        location: typeof result.location === 'object' ? result.location.address : result.location,
        date: new Date(result.startAt).toISOString().split('T')[0],
        description: result.description || '',
        status: result.status === 'PENDING' ? 'Pending' :
                result.status === 'APPROVED' ? 'Upcoming' :
                result.status === 'LIVE' ? 'Live' :
                result.status === 'COMPLETED' ? 'Completed' : 'Pending',
        staffRequired: Object.values(result.requiredRoles || {}).reduce((sum: number, count: any) =>
          sum + (typeof count === 'number' ? count : 0), 0),
        staffAssigned: result.assignments?.length || 0,
        revenue: 0,
        roles: Object.entries(result.requiredRoles || {}).map(([roleName, count]) => ({
          roleName,
          count: typeof count === 'number' ? count : 0,
          filled: 0
        })),
      };
      setEvents(prev => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
      throw err;
    }
  };

  const updateEvent = async (id: string, eventData: any) => {
    try {
      const result = await api.events.update(id, eventData);
      setEvents(prev => prev.map(e => e.id === id ? {
        ...e,
        title: result.title || e.title,
        location: typeof result.location === 'object' ? result.location.address : result.location || e.location,
        description: result.description || e.description,
        status: result.status === 'PENDING' ? 'Pending' :
                result.status === 'APPROVED' ? 'Upcoming' :
                result.status === 'LIVE' ? 'Live' :
                result.status === 'COMPLETED' ? 'Completed' : e.status,
      } : e));
      return result;
    } catch (err) {
      console.error('Failed to update event:', err);
      throw err;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.events.delete(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event:', err);
      throw err;
    }
  };

  return { events, isLoading, error, createEvent, updateEvent, deleteEvent, setEvents };
};

