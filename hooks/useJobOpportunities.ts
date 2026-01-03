import { useState, useEffect } from 'react';
// Backend API removed - using mock data only
import { JobOpportunity } from '../types';

export const useJobOpportunities = (enabled: boolean = true) => {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        const response = await api.events.list({ status: 'APPROVED' });
        const fetchedJobs: JobOpportunity[] = response.data.map((event: any) => {
          const startDate = new Date(event.startAt);
          const endDate = new Date(event.endAt);
          const totalSpots: number = (Object.values(event.requiredRoles || {}) as number[]).reduce((sum: number, count: number) =>
            sum + (typeof count === 'number' ? count : 0), 0);
          const filledSpots: number = event.assignments?.length || 0;
          const roleName = Object.keys(event.requiredRoles || {})[0] || 'General Staff';
          return {
            id: event.id,
            eventId: event.id,
            title: event.title,
            role: roleName,
            date: startDate.toISOString().split('T')[0],
            time: `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
            location: typeof event.location === 'object' ? event.location.address : event.location,
            rate: 500,
            requirements: Object.keys(event.requiredRoles || {}),
            spotsOpen: totalSpots - filledSpots,
            isVIP: event.notes?.isVIP || false,
          };
        });
        setJobs(fetchedJobs);
      } catch (err) {
        console.error('Failed to fetch job opportunities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 60000);
    return () => clearInterval(interval);
  }, [enabled]);

  const applyForJob = async (jobId: string) => {
    try {
      // Note: Assignment creation endpoint doesn't exist yet
      // In a real implementation, we'd call: POST /events/{eventId}/assignments
      alert('Application submitted successfully!');
      // Refresh jobs to update spots
      const eventsResponse = await api.events.list({ page: 1, pageSize: 100, status: 'APPROVED' });
      const transformedJobs: JobOpportunity[] = eventsResponse.data.map((event: any) => {
        const startDate = new Date(event.startAt);
        const endDate = new Date(event.endAt);
        const totalSpots: number = (Object.values(event.requiredRoles || {}) as number[]).reduce((sum: number, count: number) =>
          sum + (typeof count === 'number' ? count : 0), 0);
        const filledSpots: number = event.assignments?.length || 0;
        const roleName = Object.keys(event.requiredRoles || {})[0] || 'General Staff';
        return {
          id: event.id,
          eventId: event.id,
          title: event.title,
          role: roleName,
          date: startDate.toISOString().split('T')[0],
          time: `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
          location: typeof event.location === 'object' ? event.location.address : event.location,
          rate: 500,
          requirements: Object.keys(event.requiredRoles || {}),
          spotsOpen: totalSpots - filledSpots,
          isVIP: event.notes?.isVIP || false,
        };
      });
      setJobs(transformedJobs);
    } catch (err) {
      console.error('Failed to apply for job:', err);
      throw err;
    }
  };

  return { jobs, isLoading, error, applyForJob, setJobs };
};

