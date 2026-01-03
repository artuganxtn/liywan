import React from 'react';
import { Upload } from 'lucide-react';
import { Card, Button, Input, Select } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';

interface SettingsSectionProps {
  settingsTab: 'general' | 'branding' | 'security' | 'billing';
  setSettingsTab: (tab: 'general' | 'branding' | 'security' | 'billing') => void;
  settingsData: {
    platformName: string;
    timezone: string;
    maintenanceMode: boolean;
    twoFactorAuth: boolean;
    forcePasswordReset: boolean;
    primaryColor: string;
    taxId: string;
    billingEmail: string;
  };
  setSettingsData: (data: any) => void;
  toast: {
    success: (message: string) => void;
  };
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settingsTab,
  setSettingsTab,
  settingsData,
  setSettingsData,
  toast,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{t('admin.platformSettings')}</h2>
        <Button onClick={() => toast.success(t('admin.settingsSaved'))}>{t('admin.saveChanges')}</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 p-2 space-y-1">
          {[
            { key: 'general', label: t('admin.general') },
            { key: 'branding', label: t('admin.branding') },
            { key: 'security', label: t('admin.security') },
            { key: 'billing', label: t('admin.billing') }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSettingsTab(tab.key as any)}
              className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                settingsTab === tab.key 
                  ? 'bg-qatar text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </Card>

        <Card className="col-span-1 md:col-span-3 p-6">
          {settingsTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.generalConfiguration')}</h3>
                <div className="space-y-4">
                  <Input 
                    label={t('admin.platformName')} 
                    value={settingsData.platformName}
                    onChange={(e) => setSettingsData({...settingsData, platformName: e.target.value})}
                  />
                  <Select 
                    label={t('admin.defaultTimezone')} 
                    options={[
                      {value: 'AST', label: t('admin.arabiaStandardTime')}, 
                      {value: 'UTC', label: 'UTC'},
                      {value: 'GMT', label: 'GMT'},
                      {value: 'EST', label: 'Eastern Standard Time'}
                    ]}
                    value={settingsData.timezone}
                    onChange={(e) => setSettingsData({...settingsData, timezone: e.target.value})}
                  />
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">{t('admin.maintenanceMode')}</p>
                      <p className="text-xs text-gray-500">{t('admin.preventNewLogins')}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="toggle accent-qatar" 
                      checked={settingsData.maintenanceMode}
                      onChange={(e) => setSettingsData({...settingsData, maintenanceMode: e.target.checked})}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'branding' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Appearance & Branding</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-qatar hover:bg-gray-50 transition-colors">
                  <Upload className="text-gray-400 mb-2" />
                  <p className="font-medium text-gray-900">Upload Logo</p>
                  <p className="text-xs text-gray-500">Recommended: 512x512px PNG</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg border border-gray-200" style={{ backgroundColor: settingsData.primaryColor }}></div>
                    <Input 
                      value={settingsData.primaryColor}
                      onChange={(e) => setSettingsData({...settingsData, primaryColor: e.target.value})}
                      className="flex-1"
                      placeholder="#8A1538"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Require 2FA for all Admin accounts</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle accent-qatar" 
                    checked={settingsData.twoFactorAuth}
                    onChange={(e) => setSettingsData({...settingsData, twoFactorAuth: e.target.checked})}
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Force Password Reset</p>
                    <p className="text-xs text-gray-500">Require staff to change passwords every 90 days</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle accent-qatar" 
                    checked={settingsData.forcePasswordReset}
                    onChange={(e) => setSettingsData({...settingsData, forcePasswordReset: e.target.checked})}
                  />
                </div>
              </div>
            </div>
          )}

          {settingsTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Billing & Invoicing</h3>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <p className="text-sm text-blue-800 font-bold">Current Plan: Enterprise</p>
                <p className="text-xs text-blue-600">Next billing date: Nov 1, 2024</p>
              </div>
              <Input 
                label="Tax ID / VAT Number" 
                value={settingsData.taxId}
                onChange={(e) => setSettingsData({...settingsData, taxId: e.target.value})}
              />
              <Input 
                label="Billing Email" 
                type="email"
                value={settingsData.billingEmail}
                onChange={(e) => setSettingsData({...settingsData, billingEmail: e.target.value})}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

