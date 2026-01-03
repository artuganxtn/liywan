import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, DollarSign, TrendingUp, Briefcase, CheckCircle } from 'lucide-react';
import { Card, ProgressBar } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { Event, StaffProfile, Booking } from '../../types';

interface DashboardOverviewProps {
  metrics: {
    activeStaff: number;
    revenue: number;
  };
  events: Event[];
  staff: StaffProfile[];
  bookings: Booking[];
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  metrics,
  events,
  staff,
  bookings,
}) => {
  const { t } = useTranslation();

  const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;
  const liveEvents = events.filter(e => e.status === 'Live').length;
  const pendingBookings = bookings.filter(b => b.status === 'Pending' || b.status === 'Under Review').length;
  const availableStaff = staff.filter(s => s.status === 'Available').length;

  const stats = [
    {
      label: t('admin.activeStaff'),
      value: metrics.activeStaff,
      icon: Users,
      color: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
    },
    {
      label: t('admin.upcomingEvents'),
      value: upcomingEvents,
      icon: Calendar,
      color: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      iconColor: 'text-purple-600',
    },
    {
      label: t('admin.totalRevenue'),
      value: `QAR ${(metrics.revenue / 1000).toFixed(0)}k`,
      icon: DollarSign,
      color: 'from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      label: t('admin.pendingBookings'),
      value: pendingBookings,
      icon: Briefcase,
      color: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-gradient-to-br ${stat.color} ${stat.borderColor} border-2`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-white/50 ${stat.iconColor}`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.recentEvents')}</h3>
          <div className="space-y-3">
            {events.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">{event.date}</p>
                </div>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.staffOverview')}</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{t('admin.available')}</span>
                <span className="font-bold text-gray-900">{availableStaff}/{staff.length}</span>
              </div>
              <ProgressBar value={availableStaff} max={staff.length} height="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{t('admin.onShift')}</span>
                <span className="font-bold text-gray-900">{liveEvents * 5}</span>
              </div>
              <ProgressBar value={liveEvents * 5} max={staff.length} height="h-2" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

