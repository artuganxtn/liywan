import React, { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { IventiaLogo, IventiaText } from '../../components/UI';
import { useTranslation } from '../../contexts/TranslationContext';

interface SidebarItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: string | number | null;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  footer?: ReactNode;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  items,
  activeTab,
  onTabChange,
  onLogout,
  footer,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5">
        <IventiaLogo className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0 text-qatar" />
        <IventiaText size="sm" className="flex-1 min-w-0" />
      </div>
      <nav className="p-3 sm:p-4 space-y-1.5 flex-1">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all font-medium text-sm group ${
              activeTab === item.id
                ? 'bg-qatar text-white shadow-lg shadow-qatar/30'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={`transition-transform group-hover:scale-110 ${
                activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-qatar'
              }`} />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                item.badge === 'Interview' ? 'bg-blue-500 text-white' :
                item.badge === 'Pending' ? 'bg-amber-500 text-white' :
                typeof item.badge === 'number' ? 'bg-red-500 text-white' :
                'bg-gray-200 text-gray-700'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 sm:p-4 border-t border-gray-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 text-red-600 px-3 py-2 hover:bg-red-50 rounded-lg w-full transition-colors text-sm"
        >
          <LogOut size={16} /> {t('nav.logout')}
        </button>
        {footer}
      </div>
    </>
  );
};

