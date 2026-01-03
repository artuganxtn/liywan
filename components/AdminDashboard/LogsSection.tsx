import React, { useState, useEffect, useMemo } from 'react';
import { Search, Activity, Download, ScrollText, X } from 'lucide-react';
import { Card, Button, Badge, Select, Skeleton, SkeletonTable } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { useDebounce } from '../../hooks/useDebounce';
import { logs as apiLogs } from '../../services/api';
import { AuditLog } from '../../types';
import { useToast } from '../ui/Toast';

interface LogsSectionProps {
  exportToCSV?: (data: any[], filename: string) => void;
}

export const LogsSection: React.FC<LogsSectionProps> = ({ exportToCSV }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'All' | 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout'>('All');
  
  const debouncedLogSearch = useDebounce(logSearch, 300);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const response = await apiLogs.list();
      if (response && response.data) {
        setLogs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchLower = debouncedLogSearch.toLowerCase();
      const matchesSearch = !debouncedLogSearch || 
        log.user?.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower);
      const matchesFilter = logFilter === 'All' || 
        (logFilter === 'Create' && log.action?.toLowerCase().includes('create')) ||
        (logFilter === 'Update' && log.action?.toLowerCase().includes('update')) ||
        (logFilter === 'Delete' && log.action?.toLowerCase().includes('delete')) ||
        (logFilter === 'Login' && log.action?.toLowerCase().includes('login')) ||
        (logFilter === 'Logout' && log.action?.toLowerCase().includes('logout')) ||
        (logFilter === 'Other' && !['create', 'update', 'delete', 'login', 'logout'].some(a => log.action?.toLowerCase().includes(a)));
      return matchesSearch && matchesFilter;
    });
  }, [logs, debouncedLogSearch, logFilter]);

  const handleExport = () => {
    if (exportToCSV) {
      exportToCSV(filteredLogs.map(l => ({
        Timestamp: l.timestamp || 'N/A',
        User: l.user || 'Unknown',
        Role: l.role || 'N/A',
        Action: l.action || 'N/A',
        Details: l.details || 'No details'
      })), 'audit_logs');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.logs.title')}</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={fetchLogs} 
            disabled={isLoadingLogs} 
            className="w-full sm:w-auto touch-manipulation"
          >
            <Activity size={18} className="mr-2" /> 
            {isLoadingLogs ? t('common.loading') : t('common.refresh')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="w-full sm:w-auto touch-manipulation" 
            disabled={filteredLogs.length === 0}
          >
            <Download size={18} className="mr-2" /> 
            {t('common.export')}
          </Button>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('admin.logs.searchPlaceholder')}
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all shadow-sm hover:border-gray-300"
            />
            {logSearch && (
              <button
                onClick={() => setLogSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="w-full sm:w-56">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
              {t('admin.logs.filterByAction')}
            </label>
            <Select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value as any)}
              options={[
                { value: 'All', label: t('admin.logs.allActions') },
                { value: 'Create', label: t('admin.logs.create') },
                { value: 'Update', label: t('admin.logs.update') },
                { value: 'Delete', label: t('admin.logs.delete') },
                { value: 'Login', label: t('admin.logs.login') },
                { value: 'Logout', label: t('admin.logs.logout') },
              ]}
              className="w-full"
            />
          </div>
        </div>
        {(logSearch || logFilter !== 'All') && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">{t('admin.logs.activeFilters')}:</span>
            {logSearch && (
              <Badge status="Pending" className="text-xs">
                {t('admin.logs.search')}: "{logSearch}"
                <button onClick={() => setLogSearch('')} className="ml-2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {logFilter !== 'All' && (
              <Badge status="Pending" className="text-xs">
                {t('admin.logs.action')}: {logFilter}
                <button onClick={() => setLogFilter('All')} className="ml-2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setLogSearch('');
                setLogFilter('All');
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {t('admin.logs.clearAll')}
            </button>
          </div>
        )}
      </div>
      
      {isLoadingLogs ? (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={32} width="30%" />
          <SkeletonTable rows={8} />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ScrollText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.logs.noLogsFound')}</h3>
            <p className="text-gray-500 mb-4">
              {logSearch || logFilter !== 'All' 
                ? t('admin.logs.noMatches') 
                : t('admin.logs.noLogsDescription')}
            </p>
            {(logSearch || logFilter !== 'All') && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setLogSearch('');
                  setLogFilter('All');
                }}
              >
                {t('admin.logs.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('admin.logs.timestamp')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('admin.logs.user')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('admin.logs.action')}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">{t('admin.logs.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-xs font-mono text-gray-500">{log.timestamp || 'N/A'}</td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900">
                      {log.user || 'Unknown'}{' '}
                      <span className="text-xs font-normal text-gray-400">({log.role || 'N/A'})</span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <Badge 
                        status={log.action?.includes('Delete') ? 'Rejected' : log.action?.includes('Create') ? 'Approved' : 'Pending'} 
                      />
                      <span className="ml-2">{log.action || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{log.details || t('admin.logs.noDetails')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="md:hidden space-y-3">
            {filteredLogs.map(log => (
              <Card key={log.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        status={log.action?.includes('Delete') ? 'Rejected' : log.action?.includes('Create') ? 'Approved' : 'Pending'} 
                      />
                      <p className="font-bold text-gray-900 truncate">{log.action || 'N/A'}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{log.user || 'Unknown'} ({log.role || 'N/A'})</p>
                  </div>
                  <span className="text-xs font-mono text-gray-400 whitespace-nowrap">
                    {log.timestamp ? log.timestamp.split(' ')[0] : 'N/A'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{log.details || t('admin.logs.noDetails')}</p>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

