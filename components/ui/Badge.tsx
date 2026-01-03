import React from 'react';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const styles: Record<string, string> = {
    Upcoming: 'bg-blue-50 text-blue-700 border-blue-100',
    Live: 'bg-red-50 text-red-700 border-red-100 animate-pulse',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Available: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'On Shift': 'bg-amber-50 text-amber-700 border-amber-100',
    Leave: 'bg-gray-100 text-gray-600 border-gray-200',
    Verified: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Interview: 'bg-purple-50 text-purple-700 border-purple-100',
    Approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Expired: 'bg-red-50 text-red-700 border-red-100',
    Rejected: 'bg-red-50 text-red-700 border-red-100',
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Processing: 'bg-blue-50 text-blue-700 border-blue-100',
    'Not Started': 'bg-gray-100 text-gray-500 border-gray-200',
    'In Progress': 'bg-blue-50 text-blue-600 border-blue-100',
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Suspended: 'bg-red-50 text-red-700 border-red-100',
  };

  const defaultStyle = 'bg-gray-50 text-gray-700 border-gray-100';

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
        styles[status] || defaultStyle
      } ${className}`}
    >
      {status}
    </span>
  );
};


