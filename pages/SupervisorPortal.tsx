import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, AlertTriangle, MessageSquare, ClipboardCheck, 
  MapPin, Phone, Shield, Search, CheckCircle, XCircle, LogOut, Siren, Clock, ScanLine, Loader2
} from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Select, IventiaLogo, IventiaText } from '../components/UI';
import { StaffProfile, Incident, Message, User } from '../types';
import { useSupervisorData } from '../hooks/useSupervisorData';
import { useTranslation } from '../contexts/TranslationContext';

interface SupervisorPortalProps {
  onLogout: () => void;
  user: User;
  staffList: StaffProfile[];
  setStaffList: (staff: StaffProfile[]) => void;
  incidents: Incident[];
  setIncidents: (incidents: Incident[]) => void;
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
}

const SupervisorPortal: React.FC<SupervisorPortalProps> = ({ 
  onLogout, user, staffList: propStaffList, setStaffList: propSetStaffList, incidents: propIncidents, setIncidents: propSetIncidents, messages, setMessages 
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'attendance' | 'scanner' | 'incidents' | 'team'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Use backend data hook
  const { staff: backendStaff, incidents: backendIncidents, isLoading, checkInStaff, reportIncident } = useSupervisorData();
  
  // Use backend data if available, otherwise fall back to props
  const staffList = backendStaff.length > 0 ? backendStaff : propStaffList;
  const setStaffList = backendStaff.length > 0 ? (() => {}) : propSetStaffList;
  const incidents = backendIncidents.length > 0 ? backendIncidents : propIncidents;
  const setIncidents = backendIncidents.length > 0 ? (() => {}) : propSetIncidents;
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  // Incident Form State
  const [isIncidentModalOpen, setIncidentModalOpen] = useState(false);
  const [incidentData, setIncidentData] = useState<Partial<Incident>>({
      type: 'Medical', severity: 'Medium', description: '', location: ''
  });

  // Actions
  const handleCheckIn = async (id: string) => {
      try {
          await checkInStaff(id, ''); // eventId would come from context
          if (setStaffList) {
              setStaffList(staffList.map(s => s.id === id ? { ...s, status: 'On Shift' } : s));
          }
      } catch (error) {
          console.error('Failed to check in staff:', error);
          alert('Failed to check in staff. Please try again.');
      }
  };

  const handleVerifyUniform = (id: string) => {
      alert(`Uniform Verified for Staff ID: ${id}`);
  };

  const simulateScan = () => {
      setIsScanning(true);
      setTimeout(() => {
          setIsScanning(false);
          setScannedResult("Verified: Sarah Ahmed - Hostess");
          setTimeout(() => setScannedResult(null), 3000);
      }, 2000);
  };

  const submitIncident = async () => {
      try {
          const newIncident = await reportIncident({
              ...incidentData,
              reportedBy: user.name,
          });
          if (setIncidents) {
              setIncidents([newIncident, ...incidents]);
          }
          setIncidentModalOpen(false);
          setIncidentData({ type: 'Medical', severity: 'Medium', description: '', location: '' });
      } catch (error) {
          console.error('Failed to submit incident:', error);
          alert('Failed to submit incident. Please try again.');
      }
  };

  const filteredStaff = staffList.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-qatar text-white p-3 sm:p-4 shadow-lg sticky top-0 z-20">
          <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
              <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0"><IventiaLogo className="w-10 h-10 sm:w-12 sm:h-12 text-white" /></div>
                  <div className="min-w-0">
                      <h1 className="font-bold text-base sm:text-lg leading-tight">{t('supervisor.command')}</h1>
                      <p className="text-[10px] sm:text-xs opacity-80">{t('supervisor.liveOps')}</p>
                  </div>
              </div>
              <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors flex-shrink-0"><LogOut size={18} /></button>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 sm:gap-2 mt-4 sm:mt-6 overflow-x-auto pb-1 max-w-7xl mx-auto w-full px-2 sm:px-0 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {[
                  { id: 'attendance', label: 'Live Attendance', icon: ClipboardCheck },
                  { id: 'scanner', label: 'QR Scanner', icon: ScanLine },
                  { id: 'incidents', label: 'Incident Log', icon: Siren },
                  { id: 'team', label: 'Team Contact', icon: Users },
              ].map(tab => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-t-lg font-bold text-xs sm:text-sm transition-colors whitespace-nowrap touch-manipulation active:scale-95 ${
                        activeTab === tab.id 
                          ? 'bg-slate-50 text-qatar shadow-sm' 
                          : 'text-white/70 hover:bg-white/10'
                      }`}
                  >
                      <tab.icon size={14} className="sm:w-4 sm:h-4" /> 
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
              ))}
          </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
          {isLoading && activeTab === 'attendance' && (
              <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-qatar animate-spin" />
                  <span className="ml-3 text-gray-600">{t('ui.loading')}...</span>
              </div>
          )}
          
          {activeTab === 'attendance' && !isLoading && (
              <div className="space-y-4 animate-fadeIn">
                  <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                          <Input
                              type="text"
                              placeholder={t('supervisor.searchStaff') || 'Search staff...'}
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              icon={<Search />}
                              name="staffSearch"
                              className="rounded-xl"
                          />
                      </div>
                      <div className="flex gap-2 text-sm font-bold">
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg flex flex-col items-center leading-none">
                              <span className="text-lg">45</span>
                              <span className="text-[10px] uppercase">Present</span>
                          </div>
                          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg flex flex-col items-center leading-none">
                              <span className="text-lg">3</span>
                              <span className="text-[10px] uppercase">Late</span>
                          </div>
                      </div>
                  </div>

                  <div className="grid gap-4">
                      {filteredStaff.map(staff => (
                          <Card key={staff.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 border-l-4 border-l-qatar">
                              <img src={staff.imageUrl} className="w-12 h-12 rounded-full border border-gray-200" alt="" />
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-gray-900">{staff.name}</h3>
                                      <Badge status={staff.status} />
                                  </div>
                                  <p className="text-sm text-gray-500">{staff.role}</p>
                              </div>
                              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                  {staff.status !== 'On Shift' ? (
                                      <Button size="sm" onClick={() => handleCheckIn(staff.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Manual Check-In</Button>
                                  ) : (
                                      <Button size="sm" variant="outline" onClick={() => handleVerifyUniform(staff.id)} className="flex-1">Verify Uniform</Button>
                                  )}
                              </div>
                          </Card>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'scanner' && (
              <div className="flex flex-col items-center justify-center h-full py-10 animate-fadeIn space-y-8">
                   <div className="relative w-72 h-72 border-4 border-qatar rounded-3xl overflow-hidden shadow-2xl bg-black">
                        {isScanning ? (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-qatar/50 to-transparent animate-[float_2s_infinite]"></div>
                                <div className="absolute top-4 left-0 w-full text-center text-white font-bold text-xs">Scanning...</div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">Camera Off</div>
                        )}
                        {scannedResult && (
                             <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-white animate-fadeIn">
                                  <CheckCircle size={48} className="mb-2" />
                                  <p className="font-bold text-center px-4">{scannedResult}</p>
                             </div>
                        )}
                   </div>
                   <Button onClick={simulateScan} className="px-10 py-4 text-lg">
                       {isScanning ? 'Scanning...' : 'Start Scanner'}
                   </Button>
                   <p className="text-gray-500 text-sm max-w-md text-center">Point the camera at a staff member's digital badge to verify access and log attendance automatically.</p>
              </div>
          )}

          {activeTab === 'incidents' && (
              <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-900">Incident Command</h2>
                      <Button onClick={() => setIncidentModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white border-none shadow-red-200"><AlertTriangle size={18} className="mr-2" /> Report Issue</Button>
                  </div>

                  <div className="space-y-4">
                      {incidents.length === 0 ? <p className="text-center text-gray-400 py-10">No active incidents reported.</p> : incidents.map(inc => (
                          <div key={inc.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex gap-4">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100 text-red-600">
                                  <Siren size={24} />
                              </div>
                              <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                      <h3 className="font-bold text-gray-900">{inc.type} Incident</h3>
                                      <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{inc.reportedAt}</span>
                                  </div>
                                  <p className="text-gray-600 text-sm mt-1">{inc.description}</p>
                                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                                      <span className="flex items-center gap-1"><MapPin size={12} /> {inc.location}</span>
                                      <span className="flex items-center gap-1"><Users size={12} /> Reported by {inc.reportedBy}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'team' && (
              <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Team Directory</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staffList.map(staff => (
                          <div key={staff.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                              <img src={staff.imageUrl} className="w-12 h-12 rounded-full" alt="" />
                              <div className="flex-1 overflow-hidden">
                                  <h3 className="font-bold text-gray-900 truncate">{staff.name}</h3>
                                  <p className="text-xs text-gray-500">{staff.role}</p>
                                  <div className="flex gap-3 mt-2">
                                      <a href={`tel:${staff.phone}`} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Phone size={14} /></a>
                                      <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><MessageSquare size={14} /></button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </main>

      {/* Incident Modal */}
      <Modal isOpen={isIncidentModalOpen} onClose={() => setIncidentModalOpen(false)} title="Report Incident">
          <div className="space-y-4">
              <Select 
                  label="Incident Type" 
                  options={[{value: 'Medical', label: 'Medical Emergency'}, {value: 'Security', label: 'Security Issue'}, {value: 'Logistics', label: 'Logistics/Transport'}, {value: 'Behavioral', label: 'Staff Behavioral'}, {value: 'Other', label: 'Other'}]}
                  value={incidentData.type}
                  onChange={(e) => setIncidentData({...incidentData, type: e.target.value as any})}
              />
              <Select 
                  label="Severity Level" 
                  options={[{value: 'Low', label: 'Low - Informational'}, {value: 'Medium', label: 'Medium - Action Required'}, {value: 'High', label: 'High - Urgent'}, {value: 'Critical', label: 'Critical - Emergency'}]}
                  value={incidentData.severity}
                  onChange={(e) => setIncidentData({...incidentData, severity: e.target.value as any})}
              />
              <Input 
                  label="Location" 
                  placeholder="e.g. VIP Entrance, Zone B" 
                  value={incidentData.location}
                  onChange={(e) => setIncidentData({...incidentData, location: e.target.value})}
              />
              <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea 
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar"
                      rows={4}
                      placeholder="Describe the incident in detail..."
                      value={incidentData.description}
                      onChange={(e) => setIncidentData({...incidentData, description: e.target.value})}
                  />
              </div>
              <Button onClick={submitIncident} className="w-full bg-red-600 hover:bg-red-700 border-none text-white">Submit Incident Report</Button>
          </div>
      </Modal>
    </div>
  );
};

export default SupervisorPortal;