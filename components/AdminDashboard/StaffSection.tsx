import React, { useMemo } from 'react';
import { UserPlus, Search, Edit, Trash2, Users, Phone, MapPin, Star } from 'lucide-react';
import { Card, Button, Skeleton, SkeletonTable } from '../UI';
import { StaffProfile } from '../../types';
import { useTranslation } from '../../contexts/TranslationContext';

interface StaffSectionProps {
  staff: StaffProfile[];
  isLoadingStaff: boolean;
  staffSearch: string;
  setStaffSearch: (search: string) => void;
  staffRoleFilter: string;
  setStaffRoleFilter: (filter: string) => void;
  debouncedStaffSearch: string;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  handleSort: (key: string) => void;
  sortedStaff: StaffProfile[];
  selectedStaffIds: Set<string>;
  setSelectedStaffIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  openStaffModal: (staff?: StaffProfile) => void;
  handleDeleteStaff: (id: string) => void;
}

export const StaffSection: React.FC<StaffSectionProps> = ({
  staff,
  isLoadingStaff,
  staffSearch,
  setStaffSearch,
  staffRoleFilter,
  setStaffRoleFilter,
  debouncedStaffSearch,
  sortConfig,
  handleSort,
  sortedStaff,
  selectedStaffIds,
  setSelectedStaffIds,
  openStaffModal,
  handleDeleteStaff,
}) => {
  const { t } = useTranslation();
  const filteredStaff = useMemo(() => {
    return sortedStaff.filter((s: any) => {
      const searchLower = debouncedStaffSearch.toLowerCase();
      return (
        (s.name?.toLowerCase().includes(searchLower) || 
         s.email?.toLowerCase().includes(searchLower) ||
         s.phone?.toLowerCase().includes(searchLower)) &&
        (staffRoleFilter === 'All' || s.role === staffRoleFilter)
      );
    });
  }, [sortedStaff, debouncedStaffSearch, staffRoleFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.staffTalent')}</h2>
        <Button 
          onClick={() => openStaffModal()}
          className="w-full sm:w-auto touch-manipulation"
        >
          <UserPlus size={16} className="sm:w-[18px] sm:h-[18px] mr-2" /> {t('admin.addStaff')}
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:w-[18px] sm:h-[18px]" size={16} />
          <input 
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none transition-all text-sm sm:text-base" 
            placeholder={t('admin.searchByNameEmailPhone')} 
            value={staffSearch}
            onChange={(e) => setStaffSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar transition-all text-sm sm:text-base w-full sm:w-auto touch-manipulation"
          value={staffRoleFilter}
          onChange={(e) => setStaffRoleFilter(e.target.value)}
        >
          <option value="All">{t('admin.allRoles')}</option>
          <option value="General Staff">General Staff</option>
          <option value="Hostess">Hostess</option>
          <option value="Protocol">Protocol</option>
          <option value="Logistics">Logistics</option>
          <option value="Event Coordinator">Event Coordinator</option>
        </select>
      </div>
      
      {isLoadingStaff ? (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={32} width="30%" />
          <SkeletonTable rows={8} />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No staff members found.</p>
          <Button onClick={() => openStaffModal()}>Add Your First Staff Member</Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:text-qatar transition-colors group" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      <span className="group-hover:scale-105 transition-transform">Name</span>
                      {sortConfig.key === 'name' && (
                        <span className="text-qatar font-bold">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-qatar transition-colors" onClick={() => handleSort('role')}>
                    <div className="flex items-center gap-2">
                      Role
                      {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-qatar transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-2">
                      Status
                      {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-qatar transition-colors" onClick={() => handleSort('rating')}>
                    <div className="flex items-center gap-2">
                      Rating
                      {sortConfig.key === 'rating' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStaff.map((s: any) => (
                  <tr key={s.id} className={`hover:bg-gray-50 transition-colors cursor-pointer group ${s.status === 'Suspended' ? 'opacity-60 bg-gray-50' : ''}`} onClick={() => openStaffModal(s)}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.has(s.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedStaffIds(prev => {
                            const newSet = new Set(prev);
                            if (e.target.checked) {
                              newSet.add(s.id);
                            } else {
                              newSet.delete(s.id);
                            }
                            return newSet;
                          });
                        }}
                        className="rounded border-gray-300 text-qatar focus:ring-qatar"
                      />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <img 
                          src={s.imageUrl || 'https://i.pravatar.cc/150'} 
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" 
                          alt={s.name || 'Staff'} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-qatar transition-colors truncate" title={s.name || 'Unknown'}>{s.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 truncate" title={s.email || 'No email'}>{s.email || 'No email'}</p>
                          {s.phone && (
                            <p className="text-[10px] text-gray-400 truncate" title={s.phone}>
                              <Phone size={10} className="inline mr-1" /> {s.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{s.role || 'N/A'}</span>
                        {s.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={10} /> {s.location}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          s.status === 'Available' ? 'bg-emerald-500' : 
                          s.status === 'On Shift' ? 'bg-amber-500' : 
                          s.status === 'Suspended' ? 'bg-red-500' : 
                          'bg-gray-400'
                        }`} title={s.status || 'Available'}></div>
                        <span className="text-xs sm:text-sm whitespace-nowrap">{s.status || 'Available'}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                        <Star size={12} className="sm:w-3.5 sm:h-3.5 text-amber-400 fill-amber-400" /> 
                        <span className="text-xs sm:text-sm">{s.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Shifts:</span>
                          <span className="font-bold text-gray-900">{s.completedShifts || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">On-time:</span>
                          <span className={`font-bold ${
                            (s.onTimeRate || 100) >= 95 ? 'text-emerald-600' :
                            (s.onTimeRate || 100) >= 80 ? 'text-amber-600' :
                            'text-red-600'
                          }`}>
                            {(s.onTimeRate || 100).toFixed(0)}%
                          </span>
                        </div>
                        {s.totalEarnings > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Earnings:</span>
                            <span className="font-bold text-emerald-600">QAR {(s.totalEarnings || 0).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right space-x-1 sm:space-x-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openStaffModal(s)} 
                          className="p-2 text-gray-400 hover:text-qatar hover:bg-qatar-50 rounded-lg transition-all duration-200 touch-manipulation hover:scale-110 hover:shadow-md"
                          title="Edit Staff"
                          aria-label="Edit staff"
                        >
                          <Edit size={16} className="sm:w-4 sm:h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(s.id)} 
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 touch-manipulation hover:scale-110 hover:shadow-md"
                          title="Delete Staff"
                          aria-label="Delete staff"
                        >
                          <Trash2 size={16} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-sm sm:text-base text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-12 h-12 text-gray-300" />
                        <p>No staff members match your search criteria.</p>
                        {staffSearch && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setStaffSearch('');
                              setStaffRoleFilter('All');
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredStaff.map((s: any) => (
              <Card 
                key={s.id} 
                className={`p-4 ${s.status === 'Suspended' ? 'opacity-60 bg-gray-50' : ''}`}
                onClick={() => openStaffModal(s)}
              >
                <div className="flex items-start gap-3">
                  <img 
                    src={s.imageUrl || 'https://i.pravatar.cc/150'} 
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0" 
                    alt={s.name || 'Staff'} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate">{s.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate">{s.email || 'No email'}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => openStaffModal(s)} 
                          className="p-1.5 text-gray-400 hover:text-qatar hover:bg-qatar-50 rounded-lg transition-colors touch-manipulation"
                          aria-label="Edit staff"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteStaff(s.id)} 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                          aria-label="Delete staff"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{s.role || 'N/A'}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${s.status === 'Available' ? 'bg-emerald-500' : s.status === 'On Shift' ? 'bg-amber-500' : s.status === 'Suspended' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                        <span className="text-xs text-gray-600">{s.status || 'Available'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" /> 
                        <span className="text-xs font-bold text-gray-700">{s.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filteredStaff.length === 0 && (
              <div className="text-center py-8 bg-white border border-gray-200 rounded-xl">
                <p className="text-sm text-gray-500">No staff members match your search criteria.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
