import React, { useState } from 'react';
import {
  LayoutDashboard, Calendar, Users, Briefcase, Settings, Bell,
  FileText, ArrowUpRight, DollarSign, Shield, Menu, X
} from 'lucide-react';
import { DashboardLayout } from '../shared/layouts/DashboardLayout';
import { DashboardSidebar } from '../shared/layouts/DashboardSidebar';
import { DashboardHeader } from '../shared/layouts/DashboardHeader';
import { DashboardOverview } from '../components/AdminDashboard/DashboardOverview';
import { EventsSection } from '../components/AdminDashboard/EventsSection';
import { StaffSection } from '../components/AdminDashboard/StaffSection';
import { BookingsSection } from '../components/AdminDashboard/BookingsSection';
import { UsersSection } from '../components/AdminDashboard/UsersSection';
import { useTranslation } from '../contexts/TranslationContext';
import { User, Event, StaffProfile, Booking } from '../types';
import { useEvents } from '../hooks/useEvents';
import { useStaff } from '../hooks/useStaff';
import { useBookings } from '../hooks/useBookings';

interface AdminDashboardProps {
  onLogout: () => void;
  user: User;
  staffList?: StaffProfile[];
  setStaffList?: React.Dispatch<React.SetStateAction<StaffProfile[]>>;
  appList?: any[];
  setAppList?: React.Dispatch<React.SetStateAction<any[]>>;
  incidents?: any[];
  setIncidents?: React.Dispatch<React.SetStateAction<any[]>>;
  eventsList?: Event[];
  setEventsList?: React.Dispatch<React.SetStateAction<Event[]>>;
  bookings?: Booking[];
  setBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  user,
  bookings = [],
  setBookings,
}) => {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [isStaffModalOpen, setStaffModalOpen] = useState(false);

  // Use custom hooks for data fetching
  const { events, isLoading: isLoadingEvents } = useEvents();
  const { staff, isLoading: isLoadingStaff } = useStaff();
  const { bookings: fetchedBookings, isLoading: isLoadingBookings } = useBookings();

  // Combine props bookings with fetched bookings
  const allBookings = setBookings ? fetchedBookings : bookings;

  // Real-time metrics (simplified)
  const [metrics, setMetrics] = useState({ activeStaff: staff.length, revenue: 1200000 });

  // Sidebar items
  const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { id: 'events', icon: Calendar, label: t('nav.events') },
    { id: 'staff', icon: Users, label: t('nav.staff') },
    { id: 'users', icon: Shield, label: t('admin.users') },
    { id: 'bookings', icon: Briefcase, label: t('nav.bookings'), badge: allBookings.filter(b => b.status === 'Pending' || b.status === 'Under Review').length },
    { id: 'applications', icon: FileText, label: t('nav.applications') },
    { id: 'settings', icon: Settings, label: t('nav.settings') },
  ];

  // Get current tab title
  const getTabTitle = () => {
    const item = sidebarItems.find(i => i.id === activeTab);
    return item?.label || activeTab;
  };

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview
            metrics={metrics}
            events={events}
            staff={staff}
            bookings={allBookings}
          />
        );
      case 'events':
        return (
          <EventsSection
            onEventClick={(event) => {
              setSelectedEvent(event);
              setEventModalOpen(true);
            }}
            onCreateEvent={() => {
              setSelectedEvent(null);
              setEventModalOpen(true);
            }}
          />
        );
      case 'staff':
        return (
          <StaffSection
            onStaffClick={(staff) => {
              setSelectedStaff(staff);
              setStaffModalOpen(true);
            }}
            onCreateStaff={() => {
              setSelectedStaff(null);
              setStaffModalOpen(true);
            }}
          />
        );
      case 'bookings':
        return (
          <BookingsSection
            onBookingAction={(bookingId, action) => {
              console.log('Booking action:', bookingId, action);
            }}
          />
        );
      case 'users':
        return (
          <UsersSection
            onUserAction={(userId, action) => {
              console.log('User action:', userId, action);
            }}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('admin.comingSoon')}</p>
          </div>
        );
    }
  };

  return (
    <DashboardLayout
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      isRTL={isRTL}
      sidebar={
        <DashboardSidebar
          items={sidebarItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
      }
      header={
        <DashboardHeader
          title={getTabTitle()}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          userInfo={
            <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
              <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt="" />
            </div>
          }
        />
      }
    >
      <React.Fragment>
        {renderTabContent()}
        {/* Modals and other UI elements would go here */}
      </React.Fragment>
    </DashboardLayout>
  );
};

export default AdminDashboard;

