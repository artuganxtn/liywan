import React, { useMemo } from 'react';
import { Search, FileDown, Download, UserPlus, X } from 'lucide-react';
import { Card, Button, Badge, Skeleton, SkeletonList } from '../UI';
import { JobApplication } from '../../types';
import { useTranslation } from '../../contexts/TranslationContext';

interface ApplicationsSectionProps {
  applications: JobApplication[];
  isLoadingApplications: boolean;
  appSearch: string;
  setAppSearch: (search: string) => void;
  appStatusFilter: 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Interview';
  setAppStatusFilter: (filter: 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Interview') => void;
  debouncedAppSearch: string;
  exportAllApplicationsToPDF: () => void;
  exportToCSV: (data: any[], filename: string) => void;
  setSelectedApp: (app: JobApplication | null) => void;
  setAppModalOpen: (open: boolean) => void;
}

export const ApplicationsSection: React.FC<ApplicationsSectionProps> = ({
  applications,
  isLoadingApplications,
  appSearch,
  setAppSearch,
  appStatusFilter,
  setAppStatusFilter,
  debouncedAppSearch,
  exportAllApplicationsToPDF,
  exportToCSV,
  setSelectedApp,
  setAppModalOpen,
}) => {
  const { t } = useTranslation();
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const searchLower = debouncedAppSearch.toLowerCase();
      const matchesSearch = !appSearch || 
        app.name?.toLowerCase().includes(searchLower) ||
        app.email?.toLowerCase().includes(searchLower) ||
        app.roleApplied?.toLowerCase().includes(searchLower) ||
        app.phone?.toLowerCase().includes(searchLower) ||
        app.experience?.toLowerCase().includes(searchLower) ||
        app.location?.toLowerCase().includes(searchLower) ||
        app.nationality?.toLowerCase().includes(searchLower) ||
        (app as any).qidNumber?.toLowerCase().includes(searchLower) ||
        app.languages?.join(', ').toLowerCase().includes(searchLower);
      const matchesFilter = appStatusFilter === 'All' || app.status === appStatusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [applications, debouncedAppSearch, appSearch, appStatusFilter]);

  const handleExportCSV = () => {
    exportToCSV(filteredApplications.map(a => ({
      'Application ID': a.id || a._id || 'N/A',
      'Name': a.name || 'N/A',
      'Email': a.email || 'N/A',
      'Phone': a.phone || 'N/A',
      'Role Applied': a.roleApplied || 'N/A',
      'Status': a.status || 'N/A',
      'Applied Date': a.appliedDate ? (typeof a.appliedDate === 'string' ? a.appliedDate.split('T')[0] : new Date(a.appliedDate).toISOString().split('T')[0]) : 'N/A',
      'Quiz Score (%)': a.quizScore || 0,
      'Quiz Details': Array.isArray(a.quizDetails) ? a.quizDetails.map((q: any) => `${q.question}: ${q.isCorrect ? 'Correct' : 'Incorrect'}`).join('; ') : 'N/A',
      'Experience': a.experience || 'N/A',
      'Location': a.location || 'N/A',
      'Nationality': a.nationality || 'N/A',
      'Date of Birth': (a as any).dob ? (typeof (a as any).dob === 'string' ? (a as any).dob.split('T')[0] : new Date((a as any).dob).toISOString().split('T')[0]) : 'N/A',
      'Gender': (a as any).gender || 'N/A',
      'Height (cm)': (a as any).height || 'N/A',
      'Weight (kg)': (a as any).weight || 'N/A',
      'Shirt Size': (a as any).shirtSize || 'N/A',
      'QID Number': (a as any).qidNumber || 'N/A',
      'Languages': Array.isArray(a.languages) ? a.languages.join(', ') : (a.languages || 'N/A'),
      'CV URL': (a as any).cvUrl && (a as any).cvUrl !== '#' && (a as any).cvUrl !== '' ? (a as any).cvUrl : 'Not uploaded',
      'ID Document URL': (a as any).idDocumentUrl && (a as any).idDocumentUrl !== '#' && (a as any).idDocumentUrl !== '' ? (a as any).idDocumentUrl : 'Not uploaded',
      'Interview Date': (a as any).interviewDate ? (typeof (a as any).interviewDate === 'string' ? (a as any).interviewDate.split('T')[0] : new Date((a as any).interviewDate).toISOString().split('T')[0]) : 'N/A',
      'Interview Time': (a as any).interviewTime || 'N/A',
      'Interview Location': (a as any).interviewLocation || 'N/A',
      'Interview Type': (a as any).interviewType || 'N/A',
      'Interviewer': (a as any).interviewer || 'N/A',
      'Interview Notes': (a as any).interviewNotes || 'N/A',
      'Meeting Link': (a as any).meetingLink || 'N/A',
      'Staff Profile ID': (a as any).staffId || 'N/A',
      'Avatar URL': a.avatar || 'N/A'
    })), `job_applications_${appStatusFilter !== 'All' ? appStatusFilter.toLowerCase() : 'all'}_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('admin.jobApplications')}</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={exportAllApplicationsToPDF} 
            className="w-full sm:w-auto touch-manipulation bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold"
            disabled={applications.length === 0}
          >
            <FileDown size={18} className="mr-2" /> {t('admin.downloadPDF')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="w-full sm:w-auto touch-manipulation bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700 font-semibold" 
            disabled={applications.length === 0}
          >
            <Download size={18} className="mr-2" /> 
            {t('admin.exportCSV')} {appSearch || appStatusFilter !== 'All' ? `(${filteredApplications.length})` : ''}
          </Button>
        </div>
      </div>
      
      {/* Simple Filter Section */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={t('admin.searchApplications')}
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          {appSearch && (
            <button
              onClick={() => setAppSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { value: 'All', label: t('admin.all'), count: applications.length },
            { value: 'Pending', label: t('admin.pending'), count: applications.filter(a => a.status === 'Pending').length },
            { value: 'Interview', label: t('admin.interview'), count: applications.filter(a => a.status === 'Interview').length },
            { value: 'Approved', label: t('admin.approved'), count: applications.filter(a => a.status === 'Approved').length },
            { value: 'Rejected', label: t('admin.rejected'), count: applications.filter(a => a.status === 'Rejected').length }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setAppStatusFilter(option.value as any)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                appStatusFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
              {appStatusFilter === option.value && (
                <span className="ml-1.5 text-xs opacity-90">({option.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {isLoadingApplications ? (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={32} width="30%" />
          <SkeletonList items={5} />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('admin.noApplicationsFound')}</h3>
            <p className="text-gray-500">
              {appSearch || appStatusFilter !== 'All' 
                ? t('admin.tryAdjustingSearch')
                : t('admin.noApplicationsToReview')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map(app => (
            <Card key={app.id} className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
              <img 
                src={(() => {
                  // Priority: avatar > imageUrl > staff profile imageUrl > fallback
                  const avatar = (app as any).avatar || app.avatar;
                  const imageUrl = (app as any).imageUrl;
                  const staffImageUrl = (app as any).staffIdObject?.imageUrl || (app as any).staffProfile?.imageUrl;
                  
                  if (avatar && avatar !== '' && avatar !== 'null' && avatar !== 'undefined' && avatar !== '#') {
                    return avatar;
                  }
                  if (imageUrl && imageUrl !== '' && imageUrl !== 'null' && imageUrl !== 'undefined' && imageUrl !== '#') {
                    return imageUrl;
                  }
                  if (staffImageUrl && staffImageUrl !== '' && staffImageUrl !== 'null' && staffImageUrl !== 'undefined' && staffImageUrl !== '#') {
                    return staffImageUrl;
                  }
                  // Only use random avatar as last resort
                  return `https://i.pravatar.cc/150?u=${encodeURIComponent(app.name || 'user')}`;
                })()}
                className="w-16 h-16 rounded-full border-2 border-gray-100 flex-shrink-0 object-cover" 
                alt={app.name || 'Applicant'}
                onError={(e) => {
                  // On error, try to get from staff profile or use fallback
                  const target = e.target as HTMLImageElement;
                  const appData = app as any;
                  const staffImageUrl = appData.staffIdObject?.imageUrl || appData.staffProfile?.imageUrl;
                  
                  if (staffImageUrl && staffImageUrl !== '' && staffImageUrl !== 'null' && staffImageUrl !== 'undefined' && staffImageUrl !== '#') {
                    target.src = staffImageUrl;
                  } else {
                    target.src = `https://i.pravatar.cc/150?u=${encodeURIComponent(app.name || 'user')}`;
                  }
                }} 
              />
              <div className="flex-1 text-center md:text-left min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{app.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{t('admin.applyingFor')} <span className="text-qatar font-bold">{app.roleApplied}</span></p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2">
                  {app.languages?.map((l: string) => <span key={l} className="text-xs bg-gray-100 px-2 py-1 rounded">{l}</span>)}
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-bold">{t('admin.quizPercent', { percent: String(app.quizScore || 0) })}</span>
                  <Badge status={app.status} className="text-xs" />
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); setAppModalOpen(true); }} className="touch-manipulation">{t('admin.reviewProfile')}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

