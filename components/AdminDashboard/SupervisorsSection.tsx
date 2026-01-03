import React, { useState, useMemo } from 'react';
import { Search, Shield, Mail, Phone, MapPin, Edit, Trash2, Plus, RefreshCw, Star } from 'lucide-react';
import { Card, Button, Badge, Skeleton, SkeletonTable } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { useDebounce } from '../../hooks/useDebounce';
import { SupervisorProfile } from '../../types';

interface SupervisorsSectionProps {
  supervisors: SupervisorProfile[];
  isLoadingSupervisors: boolean;
  onRefresh: () => void;
  onAddSupervisor: () => void;
  onEditSupervisor: (supervisor: SupervisorProfile) => void;
  onDeleteSupervisor: (supervisorId: string) => void;
}

export const SupervisorsSection: React.FC<SupervisorsSectionProps> = ({
  supervisors,
  isLoadingSupervisors,
  onRefresh,
  onAddSupervisor,
  onEditSupervisor,
  onDeleteSupervisor,
}) => {
  const { t } = useTranslation();
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [supervisorStatusFilter, setSupervisorStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  const debouncedSupervisorSearch = useDebounce(supervisorSearch, 300);

  const filteredSupervisors = useMemo(() => {
    return supervisors.filter((s: any) => {
      const searchLower = debouncedSupervisorSearch.toLowerCase();
      return (
        (s.name?.toLowerCase().includes(searchLower) || 
         s.email?.toLowerCase().includes(searchLower) ||
         s.phone?.toLowerCase().includes(searchLower) ||
         s.location?.toLowerCase().includes(searchLower) ||
         s.department?.toLowerCase().includes(searchLower)) &&
        (supervisorStatusFilter === 'All' || s.status === supervisorStatusFilter)
      );
    });
  }, [supervisors, debouncedSupervisorSearch, supervisorStatusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.supervisors.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {supervisors.length} {t('admin.supervisors.totalSupervisors')} • {' '}
            {supervisors.filter(s => s.status === 'Active').length} {t('admin.active')} • {' '}
            {supervisors.reduce((sum, s) => sum + (s.assignedEvents || 0), 0)} {t('admin.supervisors.eventsAssigned')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            disabled={isLoadingSupervisors}
            className="w-full sm:w-auto touch-manipulation"
          >
            <RefreshCw size={18} className={`mr-2 ${isLoadingSupervisors ? 'animate-spin' : ''}`} /> 
            {t('common.refresh')}
          </Button>
          <Button onClick={onAddSupervisor} className="w-full sm:w-auto touch-manipulation">
            <Plus size={18} className="mr-2" /> {t('admin.supervisors.addSupervisor')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
          <p className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            {t('admin.supervisors.totalSupervisors')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{supervisors.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {supervisors.filter(s => s.status === 'Active').length} {t('admin.active')}
          </p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
          <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            {t('admin.supervisors.avgRating')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {supervisors.length > 0 ? (supervisors.reduce((sum, s) => sum + (s.rating || 5), 0) / supervisors.length).toFixed(1) : '5.0'}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {supervisors.filter(s => (s.rating || 5) >= 4.5).length} {t('admin.supervisors.topPerformers')}
          </p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500">
          <p className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
            {t('admin.supervisors.eventsAssigned')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {supervisors.reduce((sum, s) => sum + (s.assignedEvents || 0), 0)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('admin.supervisors.acrossAllSupervisors')}</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
          <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            {t('admin.supervisors.onLeave')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {supervisors.filter(s => s.status === 'On Leave').length}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('admin.supervisors.currentlyUnavailable')}</p>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none transition-all text-sm sm:text-base" 
            placeholder={t('admin.supervisors.searchPlaceholder')} 
            value={supervisorSearch}
            onChange={(e) => setSupervisorSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar transition-all text-sm sm:text-base w-full sm:w-auto touch-manipulation"
          value={supervisorStatusFilter}
          onChange={(e) => setSupervisorStatusFilter(e.target.value as any)}
        >
          <option value="All">{t('admin.allStatus')}</option>
          <option value="Active">{t('admin.active')}</option>
          <option value="Inactive">{t('admin.inactive')}</option>
        </select>
      </div>
      
      {isLoadingSupervisors ? (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={32} width="30%" />
          <SkeletonTable rows={8} />
        </div>
      ) : filteredSupervisors.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('admin.supervisors.noSupervisorsFound')}</p>
          <Button onClick={onAddSupervisor}>{t('admin.supervisors.addFirstSupervisor')}</Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.name')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.contact')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.department')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.rating')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSupervisors.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => onEditSupervisor(s)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={s.imageUrl || 'https://i.pravatar.cc/150'} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" 
                          alt={s.name || 'Supervisor'}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 group-hover:text-qatar transition-colors truncate" title={s.name || 'Unknown'}>
                            {s.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={s.email || 'No email'}>
                            <Mail size={10} className="inline mr-1" /> {s.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone size={12} /> {s.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        {s.department && (
                          <span className="text-gray-900 font-medium">{s.department}</span>
                        )}
                        {s.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {s.location}
                          </span>
                        )}
                        {s.specialization && (
                          <span className="text-xs text-gray-400 mt-0.5">{s.specialization}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="font-bold text-gray-900">{s.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{t('admin.events')}:</span>
                          <span className="font-bold text-gray-900">{s.assignedEvents || 0}</span>
                        </div>
                        {s.yearsOfExperience > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{t('admin.experience')}:</span>
                            <span className="font-bold text-gray-900">{s.yearsOfExperience} {t('admin.years')}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={s.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onEditSupervisor(s)} 
                        className="p-2 text-gray-400 hover:text-qatar hover:bg-qatar-50 rounded-lg transition-colors touch-manipulation"
                        title={t('admin.editSupervisor')}
                        aria-label={t('admin.editSupervisor')}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteSupervisor(s.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                        title={t('admin.deleteSupervisor')}
                        aria-label={t('admin.deleteSupervisor')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="md:hidden space-y-3">
            {filteredSupervisors.map((s: any) => (
              <Card key={s.id} className="p-4" onClick={() => onEditSupervisor(s)}>
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <img 
                      src={s.imageUrl || 'https://i.pravatar.cc/150'} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0" 
                      alt={s.name || 'Supervisor'}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150';
                      }}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                      s.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate">{s.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {s.email || 'No email'}
                        </p>
                        {s.phone && (
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {s.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge status={s.status} />
                        <div className="flex items-center gap-1">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold">{s.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {s.department && (
                        <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{s.department}</span>
                      )}
                      {s.location && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={10} /> {s.location}
                        </span>
                      )}
                      {s.specialization && (
                        <span className="text-xs text-gray-400">{s.specialization}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">{t('admin.events')}</p>
                        <p className="text-sm font-bold text-gray-900">{s.assignedEvents || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">{t('admin.experience')}</p>
                        <p className="text-xs font-bold text-gray-900">{s.yearsOfExperience || 0} {t('admin.years')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

