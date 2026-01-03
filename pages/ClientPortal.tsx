import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Plus, LogOut, MapPin, Users,
  Clock, CheckCircle, AlertCircle, FileText, ChevronRight, Briefcase, XCircle, Check, Loader2
} from 'lucide-react';
import { Card, Button, Input, Badge, Select, Modal, IventiaLogo, BottomNavigation } from '../components/UI';
import { User, Event, EventRole } from '../types';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../contexts/TranslationContext';
// Backend API removed - using mock data only

interface ClientPortalProps {
  onLogout: () => void;
  user: User;
}

// Mock Data for Client
const MY_EVENTS: Event[] = [
  {
      id: 'e101',
      title: 'Corporate Gala Dinner',
      date: '2024-06-15',
      location: 'St. Regis Doha',
      description: 'Annual gala for VIP partners.',
      status: 'Pending',
      staffRequired: 15,
      staffAssigned: 12,
      revenue: 0,
      roles: [
          { roleName: 'Hostess', count: 10, filled: 8 },
          { roleName: 'Supervisor', count: 1, filled: 1 }
      ]
  }
] as Event[];

// Mock assigned staff for approval
const PROPOSED_STAFF = [
    { id: 's1', name: 'Fatima Al-Thani', role: 'Hostess', rating: 4.9, imageUrl: 'https://i.pravatar.cc/150?u=fatima', status: 'Pending' },
    { id: 's2', name: 'Aisha Malik', role: 'Hostess', rating: 4.8, imageUrl: 'https://i.pravatar.cc/150?u=aisha', status: 'Approved' },
];

const ClientPortal: React.FC<ClientPortalProps> = ({ onLogout, user }) => {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [events, setEvents] = useState<Event[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  
  // Staff Review
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isStaffReviewOpen, setIsStaffReviewOpen] = useState(false);
  const [staffList, setStaffList] = useState(PROPOSED_STAFF);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
      title: '', date: '', location: '', description: '',
      roles: [{ roleName: 'Hostess', count: 5 }]
  });

  const addRoleRow = () => {
      setNewEvent({ ...newEvent, roles: [...newEvent.roles, { roleName: 'General Staff', count: 1 }] });
  };

  const updateRole = (index: number, field: string, value: string | number) => {
      const updatedRoles = [...newEvent.roles];
      updatedRoles[index] = { ...updatedRoles[index], [field]: value };
      setNewEvent({ ...newEvent, roles: updatedRoles });
  };

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      setIsLoadingEvents(true);
      setEventsError(null);

      try {
        const response = await api.events.list({ page: 1, pageSize: 100 });
        
        // Transform API events to frontend Event type
        const transformedEvents: Event[] = response.data.map((e: any) => ({
          id: e.id,
          title: e.title,
          location: typeof e.location === 'object' ? e.location.address : e.location,
          date: new Date(e.startAt).toISOString().split('T')[0],
          description: e.description || '',
          status: e.status === 'PENDING' ? 'Pending' :
                  e.status === 'APPROVED' ? 'Upcoming' :
                  e.status === 'LIVE' ? 'Live' :
                  e.status === 'COMPLETED' ? 'Completed' : 'Cancelled',
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
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEventsError(error instanceof Error ? error.message : 'Failed to load events');
        // Fallback to mock data
        setEvents(MY_EVENTS);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const submitRequest = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
          alert('Please log in to create events');
          return;
      }

      try {
          // Get user's client ID from profile
          const userProfile = await api.users.getMe();
          const clientId = userProfile.profile?.clientId || userProfile.clientProfile?.id;
          
          if (!clientId) {
              alert('Client account not found. Please contact admin.');
              return;
          }

          // Parse date and time
          const startDate = new Date(`${newEvent.date}T${newEvent.date.split('T')[1] || '10:00'}`);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 4); // Default 4 hours

          // Convert roles to requiredRoles format
          const requiredRoles: Record<string, number> = {};
          newEvent.roles.forEach(role => {
              requiredRoles[role.roleName] = role.count;
          });

          const eventData = {
              title: newEvent.title,
              description: newEvent.description,
              clientId: clientId,
              location: {
                  address: newEvent.location,
                  city: 'Doha',
                  country: 'Qatar',
              },
              startAt: startDate.toISOString(),
              endAt: endDate.toISOString(),
              requiredRoles: requiredRoles,
          };

          const result = await api.events.create(eventData);

          // Transform and add to local state
          const newEventTransformed: Event = {
              id: result.id,
              title: result.title,
              location: typeof result.location === 'object' ? result.location.address : result.location,
              date: new Date(result.startAt).toISOString().split('T')[0],
              description: result.description || '',
              status: result.status === 'PENDING' ? 'Pending' : 'Upcoming',
              staffRequired: newEvent.roles.reduce((acc, r) => acc + Number(r.count), 0),
              staffAssigned: 0,
              revenue: 0,
              roles: newEvent.roles.map(r => ({ ...r, filled: 0 }))
          };

          setEvents([newEventTransformed, ...events]);
          setIsRequestModalOpen(false);
          setNewEvent({ title: '', date: '', location: '', description: '', roles: [{ roleName: 'Hostess', count: 5 }] });
      } catch (error) {
          console.error('Failed to create event:', error);
          alert(error instanceof Error ? error.message : 'Failed to create event');
      }
  };

  const handleStaffAction = (id: string, action: 'Approved' | 'Rejected') => {
      setStaffList(staffList.map(s => s.id === id ? { ...s, status: action } : s));
  };

  return (
    <div className={`min-h-screen bg-slate-50 font-sans flex flex-col ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2.5">
             <IventiaLogo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 text-qatar" />
             <div className="flex items-center gap-2">
                 <IventiaText size="sm" className="hidden sm:block" />
                 <h1 className="font-bold text-base sm:text-lg text-gray-900 sm:hidden">{t('client.clientPortal')}</h1>
             </div>
        </div>
        <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">{t('client.eventOrganizer')}</p>
            </div>
            <button onClick={onLogout} className="text-red-600 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8 flex-1 pb-20 sm:pb-8">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Card className="p-4 sm:p-5 md:p-6 border-l-4 border-l-qatar">
                  <p className="text-gray-500 text-xs sm:text-sm font-bold uppercase">{t('client.activeRequests')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{events.length}</p>
              </Card>
              <Card className="p-4 sm:p-5 md:p-6 border-l-4 border-l-blue-500">
                  <p className="text-gray-500 text-xs sm:text-sm font-bold uppercase">{t('client.totalStaffHired')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{events.reduce((acc, e) => acc + (e.staffRequired || 0), 0)}</p>
              </Card>
               <Card className="p-4 sm:p-5 md:p-6 border-l-4 border-l-emerald-500 sm:col-span-2 md:col-span-1">
                  <p className="text-gray-500 text-xs sm:text-sm font-bold uppercase">{t('client.completedEvents')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">12</p>
              </Card>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('client.yourEvents')}</h2>
              <Button 
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Plus size={18} className="mr-2" /> {t('client.newRequest')}
              </Button>
          </div>

          <div className="grid gap-4 sm:gap-6">
              {events.map(event => (
                  <Card key={event.id} className="p-4 sm:p-5 md:p-6 relative group">
                      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{event.title}</h3>
                                  <Badge status={event.status} />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                  <span className="flex items-center gap-1"><Calendar size={14} /> {event.date}</span>
                                  <span className="flex items-center gap-1"><MapPin size={14} /> <span className="truncate">{event.location}</span></span>
                              </div>
                          </div>
                          <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 sm:border-0">
                              <p className="text-xs sm:text-sm text-gray-500">{t('client.staffingProgress')}</p>
                              <p className="text-xl sm:text-2xl font-bold text-qatar">{event.staffAssigned} <span className="text-gray-400 text-sm sm:text-base">/ {event.staffRequired}</span></p>
                              <button 
                                onClick={() => { setSelectedEventId(event.id); setIsStaffReviewOpen(true); }} 
                                className="text-xs sm:text-sm text-qatar font-bold hover:underline mt-1 touch-manipulation"
                              >
                                {t('client.reviewApproveTeam')}
                              </button>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100">
                          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 sm:mb-3">{t('client.roleBreakdown')}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                              {event.roles?.map((role, idx) => (
                                  <div key={idx} className="bg-white p-2 sm:p-3 rounded-lg border border-gray-200 shadow-sm">
                                      <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{role.roleName}</p>
                                      <div className="flex justify-between items-end mt-1 sm:mt-2">
                                          <span className="text-[10px] sm:text-xs text-gray-500">{t('client.req')}: {role.count}</span>
                                          <span className="text-[10px] sm:text-xs font-bold text-emerald-600">{role.filled} {t('client.filled')}</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </Card>
              ))}
          </div>
      </main>

      {/* NEW REQUEST MODAL */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title={t('client.newStaffingRequest')}>
          <div className="space-y-3 sm:space-y-4">
              <Input label={t('client.eventTitle')} placeholder={t('client.eventTitlePlaceholder')} value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input label={t('client.date')} type="date" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} />
                  <Input label={t('client.location')} placeholder={t('client.venueName')} value={newEvent.location} onChange={(e) => setNewEvent({...newEvent, location: e.target.value})} />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('client.description')}</label>
                  <textarea className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-qatar" rows={3} value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}></textarea>
              </div>

              <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-bold text-gray-900">{t('client.staffingRoles')}</label>
                      <button onClick={addRoleRow} className="text-xs text-qatar font-bold hover:underline">+ {t('client.addRole')}</button>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                      {newEvent.roles.map((role, idx) => (
                          <div key={idx} className="flex gap-2">
                              <Input placeholder={t('client.roleName')} value={role.roleName} onChange={(e) => updateRole(idx, 'roleName', e.target.value)} className="flex-1" />
                              <Input type="number" placeholder={t('client.qty')} value={role.count} onChange={(e) => updateRole(idx, 'count', e.target.value)} className="w-20" />
                          </div>
                      ))}
                  </div>
              </div>

              <Button onClick={submitRequest} className="w-full mt-2">{t('client.submitRequest')}</Button>
          </div>
      </Modal>

      {/* STAFF REVIEW MODAL */}
      <Modal isOpen={isStaffReviewOpen} onClose={() => setIsStaffReviewOpen(false)} title={t('client.reviewProposedTeam')}>
          <div className="space-y-3 sm:space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-3 sm:p-4 rounded-xl mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-blue-800">{t('client.reviewProposedStaff')}</p>
              </div>
              <div className="space-y-2 sm:space-y-3 max-h-[60vh] overflow-y-auto pr-1 sm:pr-2">
                  {staffList.map(staff => (
                      <div key={staff.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                              <img src={staff.imageUrl} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0" alt="" />
                              <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">{staff.name}</h4>
                                  <p className="text-xs text-gray-500">{staff.role} • {staff.rating} ★</p>
                              </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                              {staff.status === 'Approved' ? (
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1"><Check size={14} /> {t('client.approved')}</span>
                              ) : staff.status === 'Rejected' ? (
                                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center gap-1"><XCircle size={14} /> {t('client.rejected')}</span>
                              ) : (
                                  <>
                                      <button 
                                        onClick={() => handleStaffAction(staff.id, 'Approved')} 
                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 touch-manipulation active:scale-95 transition-transform"
                                        aria-label="Approve"
                                      >
                                        <Check size={18} />
                                      </button>
                                      <button 
                                        onClick={() => handleStaffAction(staff.id, 'Rejected')} 
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 touch-manipulation active:scale-95 transition-transform"
                                        aria-label="Reject"
                                      >
                                        <XCircle size={18} />
                                      </button>
                                  </>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
              <Button onClick={() => setIsStaffReviewOpen(false)} className="w-full touch-manipulation">{t('client.confirmSelections')}</Button>
          </div>
      </Modal>
    </div>
  );
};

export default ClientPortal;