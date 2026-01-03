import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Clock, MapPin, DollarSign, Briefcase, Crown } from 'lucide-react';
import { Card, Button, Input } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { JobOpportunity } from '../../types';
import { useJobOpportunities } from '../../hooks/useJobOpportunities';

interface JobsTabProps {
  onApply?: (jobId: string) => void;
}

export const JobsTab: React.FC<JobsTabProps> = ({ onApply }) => {
  const { t } = useTranslation();
  const { jobs, isLoading, applyForJob } = useJobOpportunities();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' ||
                           (filter === 'vip' && job.isVIP) ||
                           (filter === 'regular' && !job.isVIP);
      return matchesSearch && matchesFilter;
    });
  }, [jobs, searchQuery, filter]);

  const handleApply = async (jobId: string) => {
    try {
      await applyForJob(jobId);
      onApply?.(jobId);
    } catch (error) {
      console.error('Failed to apply for job:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t('ui.loading')}...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('jobs.marketplace')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('jobs.browseOpportunities')}</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('jobs.searchJobs')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search />}
            name="jobSearch"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'all' ? 'bg-qatar text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('jobs.allJobs')}
          </button>
          <button
            onClick={() => setFilter('vip')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              filter === 'vip' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Crown size={14} /> {t('jobs.vipOnly')}
          </button>
          <button
            onClick={() => setFilter('regular')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'regular' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('jobs.regular')}
          </button>
        </div>
      </div>

      {filteredJobs.length > 0 ? (
        <div className="grid gap-4">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden group hover:shadow-xl transition-all border-2 hover:border-qatar/30">
                {job.isVIP && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-300 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1 shadow-lg">
                    <Crown size={12} /> VIP EVENT
                  </div>
                )}
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 pr-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-2xl text-gray-900 mb-1">{job.title}</h3>
                    <p className="text-base font-bold text-qatar mb-4">{job.role}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="font-medium">{job.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={16} className="text-gray-400" />
                        <span className="font-medium">{job.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-gray-400" />
                        <span className="font-medium">{job.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-4 min-w-[140px]">
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">QAR {job.rate.toLocaleString()}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('admin.totalPay')}</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        size="sm"
                        onClick={() => handleApply(job.id)}
                        className="w-full bg-qatar hover:bg-qatar-light"
                      >
                        <Briefcase size={16} className="mr-2" /> {t('jobs.applyNow')}
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        {job.spotsOpen} {t('jobs.spotsLeft')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <Briefcase className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold text-lg">{t('jobs.noJobsFound')}</p>
          <p className="text-sm text-gray-400 mt-2">{t('jobs.tryAdjusting')}</p>
        </Card>
      )}
    </div>
  );
};

