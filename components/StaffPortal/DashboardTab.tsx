import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Briefcase, Award, TrendingUp } from 'lucide-react';
import { Card, ProgressBar } from '../UI';
import { QuickActionCards, QuickAction } from '../QuickActionCards';
import { ProfileStrengthMeter, AchievementBadge, XPProgress } from '../GamificationComponents';
import { useTranslation } from '../../contexts/TranslationContext';
import { StaffProfile, Shift, JobOpportunity } from '../../types';

interface DashboardTabProps {
  profile: StaffProfile;
  shifts: Shift[];
  jobs: JobOpportunity[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ profile, shifts, jobs }) => {
  const { t } = useTranslation();

  const upcomingShifts = shifts.filter(s => s.status === 'Scheduled').length;
  const availableJobs = jobs.filter(j => j.spotsOpen > 0).length;

  const quickActions: QuickAction[] = [
    {
      id: 'shifts',
      label: t('shifts.myShifts'),
      icon: Calendar,
      color: 'blue',
      count: upcomingShifts,
    },
    {
      id: 'jobs',
      label: t('jobs.marketplace'),
      icon: Briefcase,
      color: 'purple',
      count: availableJobs,
    },
    {
      id: 'training',
      label: t('training.academy'),
      icon: Award,
      color: 'emerald',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('dashboard.completedShifts')}</p>
                <p className="text-2xl font-bold text-gray-900">{profile.completedShifts}</p>
              </div>
              <Calendar className="text-blue-600" size={32} />
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('ui.onTimeRate')}</p>
                <p className="text-2xl font-bold text-gray-900">{profile.onTimeRate}%</p>
              </div>
              <TrendingUp className="text-emerald-600" size={32} />
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('profile.xpPoints')}</p>
                <p className="text-2xl font-bold text-gray-900">{profile.xpPoints}</p>
              </div>
              <Award className="text-purple-600" size={32} />
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t('dashboard.rating')}</p>
                <p className="text-2xl font-bold text-gray-900">{profile.rating}</p>
              </div>
              <Award className="text-amber-600" size={32} />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <QuickActionCards actions={quickActions} />

      {/* Profile Strength */}
      <Card>
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('profile.profileStrength')}</h3>
        <ProfileStrengthMeter profile={profile} />
      </Card>

      {/* XP Progress */}
      <Card>
        <XPProgress currentXP={profile.xpPoints} level={profile.level} />
      </Card>
    </div>
  );
};

