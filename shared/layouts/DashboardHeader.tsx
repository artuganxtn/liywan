import React, { ReactNode } from 'react';
import { Menu, Bell, MessageSquare } from 'lucide-react';
import { IventiaLogo, IventiaText } from '../../components/UI';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useTranslation } from '../../contexts/TranslationContext';

interface DashboardHeaderProps {
  title: string;
  onMenuClick: () => void;
  notifications?: ReactNode;
  messages?: ReactNode;
  userInfo?: ReactNode;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  onMenuClick,
  notifications,
  messages,
  userInfo,
}) => {
  const { t } = useTranslation();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
        <div className="lg:hidden flex items-center gap-2.5">
          <IventiaLogo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 text-qatar" />
          <IventiaText size="sm" className="hidden sm:block" />
          <h1 className="font-bold text-base sm:text-lg capitalize sm:hidden">
            {title}
          </h1>
        </div>
      </div>
      <h1 className="hidden lg:block text-2xl font-bold capitalize text-gray-800">
        {title}
      </h1>
      <div className="flex items-center gap-4 relative">
        <LanguageSwitcher />
        {messages && (
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <MessageSquare size={20} className="text-gray-600" />
          </button>
        )}
        {notifications && (
          <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Bell size={20} className="text-gray-600" />
          </button>
        )}
        {userInfo}
      </div>
    </header>
  );
};

