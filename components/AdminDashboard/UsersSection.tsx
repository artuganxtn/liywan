import React, { useState, useMemo } from 'react';
import { Search, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Card, Input, Badge, Button, Select } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import { useUsers } from '../../hooks/useUsers';

interface UsersSectionProps {
  onUserAction?: (userId: string, action: string) => void;
}

export const UsersSection: React.FC<UsersSectionProps> = ({ onUserAction }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const { users, isLoading, activateUser, deactivateUser } = useUsers(true, {
    role: roleFilter,
    search: searchQuery,
  });

  const handleActivate = async (userId: string) => {
    try {
      await activateUser(userId);
      onUserAction?.(userId, 'activate');
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      await deactivateUser(userId);
      onUserAction?.(userId, 'deactivate');
    } catch (error) {
      console.error('Failed to deactivate user:', error);
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{t('admin.usersManagement')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('admin.manageUsers')}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={t('admin.searchUsers')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search />}
            name="userSearch"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={[
              { value: 'All', label: t('admin.allRoles') },
              { value: 'STAFF', label: 'Staff' },
              { value: 'CLIENT', label: 'Client' },
              { value: 'SUPERVISOR', label: 'Supervisor' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            name="userRoleFilter"
          />
        </div>
      </div>

      {users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">{t('admin.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">{t('admin.email')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">{t('admin.role')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">{t('admin.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Shield size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.displayName || u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {u.roles?.join(', ') || 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={u.isActive ? 'Available' : 'Suspended'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {u.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeactivate(u.id)}
                        >
                          <XCircle size={14} className="mr-1" /> {t('admin.deactivate')}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleActivate(u.id)}
                        >
                          <CheckCircle size={14} className="mr-1" /> {t('admin.activate')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card className="text-center py-12">
          <Shield className="mx-auto mb-4 text-gray-300" size={48} />
          <p className="text-gray-500 font-bold">{t('admin.noUsersFound')}</p>
        </Card>
      )}
    </div>
  );
};

