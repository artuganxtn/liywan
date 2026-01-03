import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Calendar, Users, UserPlus, Settings, X, LogOut } from 'lucide-react';
import { Button, IventiaLogo } from '../UI';
import { JobApplication, Booking } from '../../types';
import { useTranslation } from '../../contexts/TranslationContext';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  applications: JobApplication[];
  bookings: Booking[];
  user: {
    name: string;
    avatar: string;
  };
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  applications,
  bookings,
  user,
  onLogout,
}) => {
  const { t } = useTranslation();
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('admin.overview'), shortcut: '1' },
    { id: 'events', icon: Calendar, label: t('admin.eventsManagement'), shortcut: '2' },
    { id: 'staff', icon: Users, label: t('admin.staffTalent'), shortcut: '3' },
    { 
      id: 'applications', 
      icon: UserPlus, 
      label: t('admin.applications'), 
      count: applications.filter(a => a.status === 'Pending').length, 
      shortcut: '4' 
    },
    { 
      id: 'bookings', 
      icon: Calendar, 
      label: t('admin.bookings'), 
      count: bookings.filter(b => b.status === 'Pending' || b.status === 'Under Review').length, 
      shortcut: '5' 
    },
    { id: 'settings', icon: Settings, label: t('admin.settings'), shortcut: '0' },
  ];

  return (
    <motion.aside 
      initial={{ x: -280 }} 
      animate={{ x: 0 }} 
      exit={{ x: -280 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed md:static inset-y-0 left-0 w-72 max-w-[90vw] sm:max-w-[85vw] bg-white border-r border-gray-200 z-30 shadow-2xl md:shadow-none flex flex-col"
    >
      <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <IventiaLogo className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" />
        <div className="min-w-0">
          <span className="font-extrabold text-lg sm:text-xl tracking-tight block leading-none truncate">
            <span className="text-black">LIY</span>
            <span className="text-[#8A1538]">W</span>
            <span className="text-black">AN</span>
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-qatar uppercase tracking-widest">{t('admin.adminConsole')}</span>
        </div>
        <button 
          className="ml-auto md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" 
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {navItems.map(item => (
          <button 
            key={item.id}
            title={`${item.label} (Ctrl+${item.shortcut})`}
            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
            className={`flex items-center justify-between w-full px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm group touch-manipulation ${
              activeTab === item.id 
                ? 'bg-qatar text-white shadow-lg shadow-qatar/30' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <item.icon 
                size={18} 
                className={`sm:w-5 sm:h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-qatar'
                }`} 
              />
              <span className="truncate">{item.label}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {item.count !== undefined && item.count > 0 && (
                <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
              {item.shortcut && (
                <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  activeTab === item.id 
                    ? 'bg-white/20 text-white/80' 
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                  {item.shortcut}
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>

      <div className="p-3 sm:p-4 border-t border-gray-100 flex-shrink-0">
        <div className="bg-slate-50 p-3 sm:p-4 rounded-xl mb-4 border border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-3">
            <img src={user.avatar} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" alt="" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{t('admin.superAdmin')}</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full justify-center text-xs sm:text-sm touch-manipulation" 
            onClick={onLogout}
          >
            <LogOut size={12} className="sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" /> {t('nav.logout')}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
};

