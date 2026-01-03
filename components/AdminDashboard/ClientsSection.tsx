import React, { useState, useMemo } from 'react';
import { Search, Briefcase, Mail, Phone, MapPin, Edit, Trash2, Plus, RefreshCw } from 'lucide-react';
import { Card, Button, Badge, Skeleton, SkeletonTable } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { useDebounce } from '../../hooks/useDebounce';
import { ClientProfile } from '../../types';

interface ClientsSectionProps {
  clients: ClientProfile[];
  isLoadingClients: boolean;
  onRefresh: () => void;
  onAddClient: () => void;
  onEditClient: (client: ClientProfile) => void;
  onDeleteClient: (clientId: string) => void;
}

export const ClientsSection: React.FC<ClientsSectionProps> = ({
  clients,
  isLoadingClients,
  onRefresh,
  onAddClient,
  onEditClient,
  onDeleteClient,
}) => {
  const { t } = useTranslation();
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      const searchLower = debouncedClientSearch.toLowerCase();
      return (
        (c.companyName?.toLowerCase().includes(searchLower) || 
         c.contactPerson?.toLowerCase().includes(searchLower) ||
         c.email?.toLowerCase().includes(searchLower) ||
         c.phone?.toLowerCase().includes(searchLower) ||
         c.city?.toLowerCase().includes(searchLower) ||
         c.industry?.toLowerCase().includes(searchLower)) &&
        (clientStatusFilter === 'All' || c.status === clientStatusFilter)
      );
    });
  }, [clients, debouncedClientSearch, clientStatusFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.clients.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {clients.length} {t('admin.clients.totalClients')} • {' '}
            {clients.filter(c => c.status === 'Active').length} {t('admin.active')} • {' '}
            {clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0)} {t('admin.clients.totalEvents')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={onRefresh} 
            disabled={isLoadingClients}
            className="w-full sm:w-auto touch-manipulation"
          >
            <RefreshCw size={18} className={`mr-2 ${isLoadingClients ? 'animate-spin' : ''}`} /> 
            {t('common.refresh')}
          </Button>
          <Button onClick={onAddClient} className="w-full sm:w-auto touch-manipulation">
            <Plus size={18} className="mr-2" /> {t('admin.clients.addClient')}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
          <p className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">
            {t('admin.clients.totalClients')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{clients.length}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
            {clients.filter(c => c.status === 'Active').length} {t('admin.active')}
          </p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
          <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            {t('admin.totalEventsMetric')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0)}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('admin.acrossAllClients')}</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500">
          <p className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">
            {t('admin.totalRevenueMetric')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            QAR {clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('admin.clients.fromAllClients')}</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
          <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            {t('admin.clients.avgEvents')}
          </p>
          <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
            {clients.length > 0 ? (clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0) / clients.length).toFixed(1) : '0'}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('admin.clients.perClient')}</p>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none transition-all text-sm sm:text-base" 
            placeholder={t('admin.searchByCompanyContact')} 
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
        </div>
        <select 
          className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar transition-all text-sm sm:text-base w-full sm:w-auto touch-manipulation"
          value={clientStatusFilter}
          onChange={(e) => setClientStatusFilter(e.target.value as any)}
        >
          <option value="All">{t('admin.allStatus')}</option>
          <option value="Active">{t('admin.active')}</option>
          <option value="Inactive">{t('admin.inactive')}</option>
        </select>
      </div>
      
      {isLoadingClients ? (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={32} width="30%" />
          <SkeletonTable rows={8} />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">{t('admin.noClientsFound')}</p>
          <Button onClick={onAddClient}>{t('admin.addFirstClient')}</Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.company')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.contact')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.location')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.eventsRevenue')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{t('admin.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => onEditClient(c)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={c.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.companyName || 'Company')}&background=8A1538&color=fff&size=40`} 
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" 
                          alt={c.companyName || 'Client'} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.companyName || 'Company')}&background=8A1538&color=fff&size=40`;
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 group-hover:text-qatar transition-colors truncate" title={c.companyName || 'Unknown'}>
                            {c.companyName || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate" title={c.email || 'No email'}>
                            <Mail size={10} className="inline mr-1" /> {c.email || 'No email'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{c.contactPerson || 'N/A'}</span>
                        {c.phone && (
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        {c.city && (
                          <span className="text-gray-900 flex items-center gap-1">
                            <MapPin size={12} /> {c.city}
                          </span>
                        )}
                        {c.country && (
                          <span className="text-xs text-gray-500">{c.country}</span>
                        )}
                        {c.industry && (
                          <span className="text-xs text-gray-400 mt-0.5">{c.industry}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{t('admin.events')}:</span>
                          <span className="font-bold text-gray-900">{c.totalEvents || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{t('admin.revenue')}:</span>
                          <span className="font-bold text-emerald-600">QAR {(c.totalSpent || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={c.status} />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => onEditClient(c)} 
                        className="p-2 text-gray-400 hover:text-qatar hover:bg-qatar-50 rounded-lg transition-colors touch-manipulation"
                        title={t('admin.editClient')}
                        aria-label={t('admin.editClient')}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => onDeleteClient(c.id)} 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                        title={t('admin.deleteClient')}
                        aria-label={t('admin.deleteClient')}
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
            {filteredClients.map((c: any) => (
              <Card key={c.id} className="p-4" onClick={() => onEditClient(c)}>
                <div className="flex items-start gap-3">
                  <img 
                    src={c.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.companyName || 'Company')}&background=8A1538&color=fff&size=128`} 
                    className="w-14 h-14 rounded-lg object-cover border-2 border-gray-200 flex-shrink-0" 
                    alt={c.companyName || 'Client'}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.companyName || 'Company')}&background=8A1538&color=fff&size=128`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate">{c.companyName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail size={10} /> {c.email || 'No email'}
                        </p>
                        {c.phone && (
                          <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                            <Phone size={10} /> {c.phone}
                          </p>
                        )}
                      </div>
                      <Badge status={c.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{c.contactPerson || 'N/A'}</span>
                      {c.city && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin size={10} /> {c.city}
                        </span>
                      )}
                      {c.industry && (
                        <span className="text-xs text-gray-400">{c.industry}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">{t('admin.events')}</p>
                        <p className="text-sm font-bold text-gray-900">{c.totalEvents || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-gray-500">{t('admin.revenue')}</p>
                        <p className="text-xs font-bold text-emerald-600">QAR {(c.totalSpent || 0).toLocaleString()}</p>
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

