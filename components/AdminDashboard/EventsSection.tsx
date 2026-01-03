import React, { useState } from 'react';
import { Plus, Calendar, MapPin, ArrowUpRight, Users } from 'lucide-react';
import { Card, Button, Badge, ProgressBar, Skeleton, SkeletonCard } from '../UI';
import { Event } from '../../types';
import { EventJobApplications } from './EventJobApplications';
import { useTranslation } from '../../contexts/TranslationContext';

interface EventsSectionProps {
  events: Event[];
  isLoadingEvents: boolean;
  fetchEvents: () => void;
  globalSearch: string;
  filterState: {
    eventStatus?: string;
  };
  setEventFormData: (data: Partial<Event & { endDate?: string }>) => void;
  setSelectedEvent: (event: Event | null) => void;
  setEventModalOpen: (open: boolean) => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  isLoadingEvents,
  fetchEvents,
  globalSearch,
  filterState,
  setEventFormData,
  setSelectedEvent,
  setEventModalOpen,
}) => {
  const [selectedEventForApplications, setSelectedEventForApplications] = useState<Event | null>(null);
  const { t } = useTranslation();
  const defaultEventFormData = {
    title: '', 
    location: '', 
    date: '', 
    endDate: '', 
    description: '', 
    status: 'Pending' as const, 
    staffRequired: 10, 
    revenue: 0, 
    budget: { 
      total: 0, 
      staffingAllocated: 0, 
      logisticsAllocated: 0, 
      marketingAllocated: 0, 
      cateringAllocated: 0, 
      technologyAllocated: 0, 
      miscellaneousAllocated: 0, 
      spent: 0 
    }
  };

  const handleCreateEvent = () => {
    setEventFormData(defaultEventFormData);
    setSelectedEvent(null);
    setEventModalOpen(true);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setEventFormData({
      title: event.title || '',
      location: event.location || '',
      date: event.date || '',
      endDate: (event as any).endDate || '',
      description: event.description || '',
      status: event.status || 'Pending',
      staffRequired: event.staffRequired || 0,
      revenue: event.revenue || 0,
      budget: event.budget || defaultEventFormData.budget,
      roles: event.roles || [],
    });
  };

  const filteredEvents = events.filter(event => {
    const searchLower = globalSearch.toLowerCase();
    return !globalSearch || 
      event.title?.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower);
  }).filter(event => 
    !filterState.eventStatus || 
    filterState.eventStatus === 'All' || 
    event.status === filterState.eventStatus
  );

  return (
    <>
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.eventsManagement')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {t(events.length === 1 ? 'admin.totalEvent' : 'admin.totalEvents', { count: String(events.length) })} • {' '}
            {t('admin.liveUpcomingCount', { 
              live: String(events.filter(e => e.status === 'Live' || e.status === 'LIVE').length),
              upcoming: String(events.filter(e => e.status === 'Upcoming' || e.status === 'APPROVED' || e.status === 'Pending' || e.status === 'PENDING').length)
            })}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={handleCreateEvent}
            className="w-full sm:w-auto touch-manipulation"
          >
            <Plus size={18} className="mr-2" /> {t('admin.createEvent')}
          </Button>
        </div>
      </div>
      
      {/* Events Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
          <p className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">{t('admin.totalEventsLabel')}</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{events.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {t('admin.liveUpcomingCount', { 
              live: String(events.filter(e => e.status === 'Live' || e.status === 'LIVE').length),
              upcoming: String(events.filter(e => e.status === 'Upcoming' || e.status === 'APPROVED' || e.status === 'Pending' || e.status === 'PENDING').length)
            })}
          </p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
          <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">{t('admin.staffRequired')}</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {events.reduce((sum, e) => sum + (e.staffRequired || 0), 0)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {events.reduce((sum, e) => sum + (e.staffAssigned || 0), 0)} {t('admin.assigned')}
          </p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500">
          <p className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">{t('admin.completedEvents')}</p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {events.filter(e => e.status === 'Completed' || e.status === 'COMPLETED').length}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {t('admin.percentOfTotal', { percent: String(events.length > 0 ? Math.round((events.filter(e => e.status === 'Completed' || e.status === 'COMPLETED').length / events.length) * 100) : 0) })}
          </p>
        </Card>
      </div>

      {isLoadingEvents ? (
        <div className="space-y-6">
          <Skeleton variant="rounded" height={32} width="40%" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.noEventsYet')}</h3>
            <p className="text-gray-500 mb-6">
              {t('admin.getStarted')}
            </p>
            <Button onClick={handleCreateEvent}>
              <Plus size={18} className="mr-2" /> {t('admin.createYourFirstEvent')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => {
            const eventDate = event.date ? new Date(event.date) : null;
            const daysUntil = eventDate ? Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
            
            return (
              <Card 
                key={event.id} 
                className="hover:shadow-xl transition-all duration-200 cursor-pointer group border-2 hover:border-qatar/30" 
                onClick={() => handleEventClick(event)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Badge status={event.status} />
                    {daysUntil !== null && daysUntil > 0 && daysUntil <= 7 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                        {t(daysUntil === 1 ? 'admin.inDays' : 'admin.inDaysPlural', { days: String(daysUntil) })}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-qatar group-hover:text-white transition-colors">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                  {event.title || 'Untitled Event'}
                </h3>
                <div className="space-y-2 mb-4">
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400 shrink-0" /> 
                    <span className="truncate">{event.location || 'Location TBD'}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" /> 
                    {event.date ? (() => {
                      try {
                        const date = new Date(event.date);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        }
                      } catch (e) {
                        console.warn('Invalid date:', event.date);
                      }
                      return 'Date TBD';
                    })() : 'Date TBD'}
                  </p>
                </div>
                {event.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2 bg-gray-50 p-2 rounded-lg">
                    {event.description}
                  </p>
                )}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-700">{t('admin.staffingProgress')}</span>
                      <span className={`font-bold ${
                        (event.staffAssigned || 0) >= (event.staffRequired || 0) ? 'text-emerald-600' :
                        (event.staffAssigned || 0) / (event.staffRequired || 1) >= 0.7 ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(((event.staffAssigned || 0) / (event.staffRequired || 1)) * 100)}%
                      </span>
                    </div>
                    <ProgressBar 
                      value={event.staffAssigned || 0} 
                      max={Math.max(event.staffRequired || 1, event.staffAssigned || 0)} 
                      label={`${event.staffAssigned || 0}/${event.staffRequired || 0} staff`} 
                      height="h-2"
                      color={
                        (event.staffAssigned || 0) >= (event.staffRequired || 0) ? 'bg-emerald-500' :
                        (event.staffAssigned || 0) / (event.staffRequired || 1) >= 0.7 ? 'bg-amber-500' :
                        'bg-red-500'
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">{t('admin.revenue')}</p>
                      <p className="text-sm font-bold text-gray-900">
                        QAR {(() => {
                          const rev = event.revenue || 0;
                          if (rev >= 1000000) {
                            return (rev / 1000000).toFixed(1) + 'M';
                          } else if (rev >= 1000) {
                            return (rev / 1000).toFixed(1) + 'K';
                          }
                          return rev.toLocaleString();
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">{t('admin.roles')}</p>
                      <p className="text-sm font-bold text-gray-900">
                        {t((event.roles?.length || 0) === 1 ? 'admin.roleCount' : 'admin.rolesCount', { count: String(event.roles?.length || 0) })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Job Applications Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEventForApplications(event);
                      }}
                      className="w-full border-qatar/30 text-qatar hover:bg-qatar/10 hover:border-qatar/50"
                    >
                      <Users size={16} className="mr-2" />
                      {t('admin.viewJobApplications')}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
    
    {/* Job Applications Modal */}
    {selectedEventForApplications && (
      <EventJobApplications
        event={selectedEventForApplications}
        onClose={() => setSelectedEventForApplications(null)}
        onApplicationUpdate={fetchEvents}
      />
    )}
    </>
  );
};
