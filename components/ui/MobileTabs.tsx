import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
}

interface MobileTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'default',
}) => {
  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  if (variant === 'pills') {
    return (
      <div className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide ${className}`} style={{ WebkitOverflowScrolling: 'touch' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap touch-manipulation active:scale-95 transition-all ${
                isActive
                  ? 'bg-qatar text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
              {tab.badge && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`border-b border-gray-200 ${className}`}>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap touch-manipulation transition-colors ${
                  isActive ? 'text-qatar' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {Icon && <Icon size={16} />}
                {tab.label}
                {tab.badge && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-qatar/10 text-qatar' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="mobileTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-qatar"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex gap-1 overflow-x-auto pb-2 scrollbar-hide ${className}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap touch-manipulation active:scale-95 transition-all ${
              isActive
                ? 'bg-qatar text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {Icon && <Icon size={14} className="sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {tab.badge && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

