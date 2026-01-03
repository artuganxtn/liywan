import React, { useState } from 'react';
import { Grid, Calendar, Briefcase, FileText, GraduationCap, User, Menu } from 'lucide-react';
import { DashboardLayout } from '../shared/layouts/DashboardLayout';
import { DashboardSidebar } from '../shared/layouts/DashboardSidebar';
import { DashboardHeader } from '../shared/layouts/DashboardHeader';
import { DashboardTab } from '../components/StaffPortal/DashboardTab';
import { ShiftsTab } from '../components/StaffPortal/ShiftsTab';
import { JobsTab } from '../components/StaffPortal/JobsTab';
import { useTranslation } from '../contexts/TranslationContext';
import { User as AppUser, Shift, JobOpportunity, JobApplication } from '../types';
import { useStaffProfile } from '../hooks/useStaffProfile';
import { useShifts } from '../hooks/useShifts';
import { useJobOpportunities } from '../hooks/useJobOpportunities';

interface StaffPortalProps {
  onLogout: () => void;
  user: AppUser;
}

const StaffPortal: React.FC<StaffPortalProps> = ({ onLogout, user }) => {
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use custom hooks for data fetching
  const { profile, isLoading: isLoadingProfile } = useStaffProfile(user.id);
  const { shifts, isLoading: isLoadingShifts } = useShifts();
  const { jobs, isLoading: isLoadingJobs } = useJobOpportunities();

  // Sidebar items
  const sidebarItems = [
    { id: 'dashboard', icon: Grid, label: t('nav.dashboard') },
    { id: 'shifts', icon: Calendar, label: t('nav.shifts') },
    { id: 'jobs', icon: Briefcase, label: t('nav.jobs') },
    { id: 'application', icon: FileText, label: t('nav.application'), badge: null },
    { id: 'training', icon: GraduationCap, label: t('nav.training') },
    { id: 'documents', icon: FileText, label: t('nav.documents') },
    { id: 'profile', icon: User, label: t('nav.profile') },
  ];

  // Get current tab title
  const getTabTitle = () => {
    if (activeTab === 'jobs') return t('jobs.marketplace');
    if (activeTab === 'application') return t('application.myApplication');
    return t(`nav.${activeTab}` as any) || activeTab;
  };

  // Render active tab content
  const renderTabContent = () => {
    if (isLoadingProfile && activeTab === 'dashboard') {
      return <div className="text-center py-12">{t('ui.loading')}...</div>;
    }

    if (!profile) {
      return <div className="text-center py-12">{t('profile.notFound')}</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardTab
            profile={profile}
            shifts={shifts}
            jobs={jobs}
          />
        );
      case 'shifts':
        return (
          <ShiftsTab
            onShiftAction={(shiftId, action) => {
              console.log('Shift action:', shiftId, action);
            }}
          />
        );
      case 'jobs':
        return (
          <JobsTab
            onApply={(jobId) => {
              console.log('Applied for job:', jobId);
            }}
          />
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('ui.comingSoon')}</p>
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
                <p className="text-xs text-gray-500">{profile?.role || 'Staff'}</p>
              </div>
              <img
                src={profile?.imageUrl || user.avatar}
                className="w-10 h-10 rounded-full border border-gray-200"
                alt=""
              />
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

export default StaffPortal;

