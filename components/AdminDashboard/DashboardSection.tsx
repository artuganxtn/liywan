import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, Calendar, Users, FileText, TrendingUp, TrendingDown,
  AlertTriangle, Siren, MapPin, Activity, BarChart3, BrainCircuit,
  Sparkles, RefreshCw, CheckCircle
} from 'lucide-react';
import { Card, Button, Select, ProgressBar } from '../UI';
import { useTranslation } from '../../contexts/TranslationContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Event, StaffProfile, JobApplication, Incident, AuditLog } from '../../types';

interface DashboardSectionProps {
  dashboardMetrics: {
    totalRevenue: number;
    revenueChange: number;
    activeEvents: number;
    liveEvents: number;
    upcomingEvents: number;
    completedEvents: number;
    onShiftStaff: number;
    totalStaff: number;
    availableStaff: number;
    pendingApps: number;
    approvedApps: number;
  };
  events: Event[];
  staff: StaffProfile[];
  applications: JobApplication[];
  incidents: Incident[];
  logs: AuditLog[];
  revenueChartData: Array<{ month: string; revenue: number; date: string }>;
  eventsByStatusData: Array<{ name: string; value: number }>;
  staffByRoleData: Array<{ name: string; value: number }>;
  analyticsPeriod: '7d' | '30d' | '90d' | '1y';
  COLORS: string[];
  setAnalyticsPeriod: (period: '7d' | '30d' | '90d' | '1y') => void;
  setActiveTab: (tab: string) => void;
  setIsForecastOpen: (open: boolean) => void;
  handleRefresh: () => void;
  isRefreshing: boolean;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  dashboardMetrics,
  events,
  staff,
  applications,
  incidents,
  logs,
  revenueChartData,
  eventsByStatusData,
  staffByRoleData,
  analyticsPeriod,
  COLORS,
  setAnalyticsPeriod,
  setActiveTab,
  setIsForecastOpen,
  handleRefresh,
  isRefreshing,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="space-y-4 sm:space-y-6 animate-fadeIn">
        {/* Enhanced KPI Cards with Tooltips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              label: t('admin.totalRevenue'),
              value: dashboardMetrics.totalRevenue > 0 ? `QAR ${(dashboardMetrics.totalRevenue / 1000000).toFixed(1)}M` : 'QAR 0',
              trend: dashboardMetrics.totalRevenue > 0 ? `${dashboardMetrics.revenueChange >= 0 ? '+' : ''}${dashboardMetrics.revenueChange.toFixed(1)}% ${t('admin.vsLastPeriod')}` : t('admin.noRevenueYet'),
              color: 'text-qatar',
              icon: DollarSign,
              change: dashboardMetrics.revenueChange >= 0 ? `+${dashboardMetrics.revenueChange.toFixed(1)}%` : `${dashboardMetrics.revenueChange.toFixed(1)}%`,
              changeType: dashboardMetrics.revenueChange >= 0 ? 'positive' as const : 'negative' as const,
              tooltip: t('admin.totalRevenueFromEvents', { count: String(events.length), revenue: dashboardMetrics.totalRevenue.toLocaleString() }),
              detail: t('admin.eventsCompleted', { total: String(events.length), completed: String(dashboardMetrics.completedEvents) })
            },
            {
              label: t('admin.activeEvents'),
              value: dashboardMetrics.activeEvents.toString(),
              trend: dashboardMetrics.liveEvents > 0 ? `${dashboardMetrics.liveEvents} ${t('admin.liveNow')}` : dashboardMetrics.upcomingEvents > 0 ? `${dashboardMetrics.upcomingEvents} ${t('admin.upcoming')}` : t('admin.noActiveEventsShort'),
              color: 'text-blue-600',
              icon: Calendar,
              change: dashboardMetrics.upcomingEvents > 0 ? `+${dashboardMetrics.upcomingEvents}` : '0',
              changeType: dashboardMetrics.upcomingEvents > 0 ? 'positive' as const : 'neutral' as const,
              tooltip: t('admin.eventsTooltip', { live: String(dashboardMetrics.liveEvents), upcoming: String(dashboardMetrics.upcomingEvents), completed: String(dashboardMetrics.completedEvents) }),
              detail: t('admin.liveUpcoming', { live: String(dashboardMetrics.liveEvents), upcoming: String(dashboardMetrics.upcomingEvents) })
            },
            {
              label: t('admin.staffOnShift'),
              value: dashboardMetrics.onShiftStaff.toString(),
              trend: dashboardMetrics.totalStaff > 0 ? `${Math.round((dashboardMetrics.availableStaff / dashboardMetrics.totalStaff) * 100)}% ${t('admin.available')}` : t('admin.noStaffYet'),
              color: 'text-emerald-600',
              icon: Users,
              change: dashboardMetrics.totalStaff > 0 ? `${Math.round((dashboardMetrics.availableStaff / dashboardMetrics.totalStaff) * 100)}%` : '0%',
              changeType: dashboardMetrics.availableStaff > 0 ? 'positive' as const : 'neutral' as const,
              tooltip: t('admin.staffTooltip', { onShift: String(dashboardMetrics.onShiftStaff), available: String(dashboardMetrics.availableStaff), total: String(dashboardMetrics.totalStaff) }),
              detail: t('admin.availableTotal', { available: String(dashboardMetrics.availableStaff), total: String(dashboardMetrics.totalStaff) })
            },
            {
              label: t('admin.pendingApps'),
              value: dashboardMetrics.pendingApps.toString(),
              trend: dashboardMetrics.pendingApps > 0 ? t('admin.actionNeeded') : t('admin.allReviewed'),
              color: 'text-amber-600',
              icon: FileText,
              change: dashboardMetrics.pendingApps > 0 ? '!' : '✓',
              changeType: dashboardMetrics.pendingApps > 0 ? 'warning' as const : 'positive' as const,
              tooltip: t('admin.appsTooltip', { pending: String(dashboardMetrics.pendingApps), approved: String(dashboardMetrics.approvedApps), total: String(applications.length) }),
              detail: t('admin.pendingApproved', { pending: String(dashboardMetrics.pendingApps), approved: String(dashboardMetrics.approvedApps) })
            },
          ].map((kpi, i) => (
            <Card
              key={i}
              className="hover:scale-[1.02] transition-all duration-200 relative overflow-hidden group cursor-pointer"
              title={kpi.tooltip}
            >
              <div className="absolute right-0 top-0 opacity-5 p-2 sm:p-4 transform translate-x-1 sm:translate-x-2 -translate-y-1 sm:-translate-y-2 group-hover:opacity-10 transition-opacity">
                <kpi.icon size={48} className="sm:w-16 sm:h-16" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-wider">{kpi.label}</p>
                {kpi.change && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                    kpi.changeType === 'positive' ? 'bg-emerald-100 text-emerald-700' :
                    kpi.changeType === 'warning' ? 'bg-amber-100 text-amber-700' :
                    kpi.changeType === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {kpi.changeType === 'positive' && <TrendingUp size={10} />}
                    {kpi.changeType === 'warning' && <AlertTriangle size={10} />}
                    {kpi.changeType === 'negative' && <TrendingDown size={10} />}
                    {kpi.change}
                  </span>
                )}
              </div>
              <div className="flex items-end justify-between mt-2 relative z-10">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{kpi.value}</h3>
                <span className={`text-[10px] sm:text-xs font-bold ${kpi.color} bg-white/80 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg shadow-sm border border-gray-100 whitespace-nowrap`}>{kpi.trend}</span>
              </div>
              {kpi.detail && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 font-medium">{kpi.detail}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border-l-4 border-l-red-500">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base sm:text-lg">
                    <Siren className="text-red-500" size={18} /> {t('admin.incidentCommand')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('admin.activeIncidents', { count: String(incidents.length) })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50 text-xs"
                  onClick={() => setActiveTab('incidents')}
                >
                  {t('admin.viewAll')}
                </Button>
              </div>
              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs sm:text-sm">{t('admin.noActiveIncidents')}</p>
                    <p className="text-gray-300 text-[10px] sm:text-xs mt-1">{t('admin.allSystemsOperational')}</p>
                  </div>
                ) : (
                  incidents
                    .sort((a, b) => {
                      const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                      return (severityOrder[a.severity as keyof typeof severityOrder] ?? 99) -
                        (severityOrder[b.severity as keyof typeof severityOrder] ?? 99);
                    })
                    .slice(0, 3)
                    .map(inc => (
                      <div
                        key={inc.id}
                        className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                        onClick={() => setActiveTab('incidents')}
                      >
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-bold text-red-900 truncate">{inc.type}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                              inc.severity === 'Critical' ? 'bg-red-600 text-white' :
                              inc.severity === 'High' ? 'bg-red-500 text-white' :
                              inc.severity === 'Medium' ? 'bg-amber-500 text-white' :
                              'bg-gray-400 text-white'
                            }`}>
                              {inc.severity}
                            </span>
                          </div>
                          <p className="text-xs text-red-700 line-clamp-2">{inc.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin size={12} className="text-red-600" />
                            <p className="text-[10px] text-red-600 font-medium">{inc.location}</p>
                            {inc.timestamp && (
                              <>
                                <span className="text-red-300">•</span>
                                <p className="text-[10px] text-red-600">{new Date(inc.timestamp).toLocaleString()}</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </Card>

            <Card>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg">{t('admin.staffAvailability')}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t('admin.currentAvailabilityByRole')}</p>
                </div>
                <Select
                  className="w-full sm:w-32"
                  options={[
                    { value: 'today', label: t('admin.today') },
                    { value: 'week', label: t('admin.thisWeek') },
                    { value: 'month', label: t('admin.thisMonth') }
                  ]}
                />
              </div>
              <div className="space-y-4">
                {(() => {
                  const roles = ['General Staff', 'Protocol', 'Hostess', 'Logistics', 'Event Coordinator'];
                  const roleData = roles.map(role => {
                    const available = staff.filter(s => s.role === role && s.status === 'Available').length;
                    const total = staff.filter(s => s.role === role).length || 1;
                    const onShift = staff.filter(s => s.role === role && s.status === 'On Shift').length;
                    const percentage = Math.round((available / total) * 100);
                    return { role, available, total, onShift, percentage };
                  }).filter(r => r.total > 0);

                  if (staff.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 text-xs sm:text-sm">{t('admin.noStaffData')}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 text-xs"
                          onClick={() => setActiveTab('staff')}
                        >
                          {t('admin.addStaff')}
                        </Button>
                      </div>
                    );
                  }

                  const colors = {
                    'General Staff': 'bg-gray-500',
                    'Protocol': 'bg-emerald-500',
                    'Hostess': 'bg-amber-500',
                    'Logistics': 'bg-purple-500',
                    'Event Coordinator': 'bg-pink-500'
                  };

                  return (
                    <>
                      {roleData.map(({ role, available, total, onShift, percentage }) => (
                        <div key={role} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{role}</span>
                              <span className="text-[10px] sm:text-xs text-gray-500">
                                ({t('admin.availableOnShift', { available: String(available), onShift: String(onShift) })})
                              </span>
                            </div>
                            <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded ${
                              percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {percentage}%
                            </span>
                          </div>
                          <ProgressBar
                            value={available}
                            max={total}
                            label={t('admin.availableCount', { available: String(available), total: String(total) })}
                            color={colors[role as keyof typeof colors] || 'bg-gray-500'}
                          />
                        </div>
                      ))}
                      <div className="pt-3 border-t border-gray-100 mt-4">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500 text-[10px] sm:text-xs">{t('admin.totalStaff')}</p>
                            <p className="font-bold text-gray-900 text-base sm:text-lg">{staff.length}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-[10px] sm:text-xs">{t('admin.availableNow')}</p>
                            <p className="font-bold text-emerald-600 text-base sm:text-lg">{dashboardMetrics.availableStaff}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Card>

            {/* Revenue Chart - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="hover:shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">{t('admin.revenueTrend')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.trackRevenue')}</p>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 bg-gray-50 p-1 rounded-lg w-full sm:w-auto">
                    {['7d', '30d', '90d', '1y'].map(period => (
                      <button
                        key={period}
                        onClick={() => setAnalyticsPeriod(period as any)}
                        className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-md transition-all duration-200 flex-1 sm:flex-none touch-manipulation ${
                          analyticsPeriod === period
                            ? 'bg-qatar text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                {revenueChartData.length > 0 ? (
                  <>
                    <div className="mb-3 sm:mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-500 text-[10px] sm:text-xs mb-1">{t('admin.total')}</p>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">QAR {revenueChartData.reduce((sum, d) => sum + (d.revenue || 0), 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-500 text-[10px] sm:text-xs mb-1">{t('admin.average')}</p>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">QAR {Math.round(revenueChartData.reduce((sum, d) => sum + (d.revenue || 0), 0) / revenueChartData.length).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-500 text-[10px] sm:text-xs mb-1">{t('admin.peak')}</p>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">QAR {Math.max(...revenueChartData.map(d => d.revenue || 0)).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                        <p className="text-gray-500 text-[10px] sm:text-xs mb-1">{t('admin.lowest')}</p>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm break-words">QAR {Math.min(...revenueChartData.map(d => d.revenue || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8A1538" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8A1538" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          stroke="#6b7280"
                          fontSize={11}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={11}
                          tick={{ fill: '#6b7280' }}
                          tickFormatter={(value) => `QAR ${(value / 1000).toFixed(0)}K`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any, name: string) => [
                            `QAR ${Number(value).toLocaleString()}`,
                            'Revenue'
                          ]}
                          labelFormatter={(label) => `Period: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#8A1538"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          dot={{ fill: '#8A1538', r: 4 }}
                          activeDot={{ r: 6, fill: '#8A1538' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-xs sm:text-sm">{t('admin.noRevenueData')}</p>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Events by Status Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="hover:shadow-xl">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">{t('admin.eventsByStatus')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.distributionOverview')}</p>
                  </div>
                </div>
                {eventsByStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180} className="sm:h-[200px]">
                    <PieChart>
                      <Pie
                        data={eventsByStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {eventsByStatusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-xs sm:text-sm">{t('admin.noEventsData')}</p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-qatar via-qatar-dark to-purple-900 text-white relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <BrainCircuit className="text-white" size={24} />
                    </div>
                    <h3 className="font-bold text-base sm:text-lg">{t('admin.aiForecasting')}</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-white/90 mb-4 leading-relaxed">{t('admin.predictStaffingNeeds')}</p>
                  <Button
                    variant="secondary"
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white font-bold text-xs sm:text-sm"
                    onClick={() => setIsForecastOpen(true)}
                  >
                    <Sparkles size={14} className="sm:w-4 sm:h-4 mr-2" /> {t('admin.launchForecaster')}
                  </Button>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Card className="hover:shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">{t('admin.recentActivity')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.systemAuditTrail')}</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab('logs')}
                      title={t('admin.viewAll')}
                      className="hover:bg-gray-100 flex-1 sm:flex-none text-xs"
                    >
                      {t('admin.viewAll')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      title="Refresh activity"
                      className="hover:bg-gray-100"
                    >
                      <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {logs.length === 0 ? (
                    <div className="text-center py-6">
                      <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-400 text-xs sm:text-sm">{t('admin.noRecentActivity')}</p>
                      <p className="text-gray-300 text-[10px] sm:text-xs mt-1">{t('admin.activityLogsWillAppear')}</p>
                    </div>
                  ) : (
                    logs.slice(0, 5).map(log => {
                      const actionType = log.action?.toLowerCase() || '';
                      const isCreate = actionType.includes('create') || actionType.includes('add');
                      const isUpdate = actionType.includes('update') || actionType.includes('edit') || actionType.includes('modify');
                      const isDelete = actionType.includes('delete') || actionType.includes('remove');
                      const isLogin = actionType.includes('login') || actionType.includes('auth');

                      const iconColor = isCreate ? 'text-emerald-600' :
                        isUpdate ? 'text-blue-600' :
                          isDelete ? 'text-red-600' :
                            isLogin ? 'text-purple-600' : 'text-gray-600';

                      const bgColor = isCreate ? 'bg-emerald-50' :
                        isUpdate ? 'bg-blue-50' :
                          isDelete ? 'bg-red-50' :
                            isLogin ? 'bg-purple-50' : 'bg-gray-50';

                      return (
                        <div
                          key={log.id}
                          className={`flex items-start gap-3 p-2 rounded-lg ${bgColor} hover:opacity-80 transition-opacity cursor-pointer`}
                          onClick={() => setActiveTab('logs')}
                        >
                          <div className={`w-2 h-2 rounded-full ${iconColor.replace('text-', 'bg-')} mt-1.5 shrink-0`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-bold text-gray-900 truncate">{log.action}</p>
                              {log.timestamp && (
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{log.details || 'No details available'}</p>
                            {log.user && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-500">by</span>
                                <span className="text-[10px] font-medium text-gray-700">{log.user}</span>
                                {log.role && (
                                  <span className="text-[10px] text-gray-400">({log.role})</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Staff by Role Chart - Enhanced */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Card className="hover:shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg">{t('admin.staffDistribution')}</h3>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.byRoleAndStatus')}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveTab('staff')}
                    title={t('admin.viewAll')}
                    className="hover:bg-gray-100 text-xs w-full sm:w-auto"
                  >
                    {t('admin.viewAll')}
                  </Button>
                </div>
                {staffByRoleData.length > 0 ? (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
                      {staffByRoleData.slice(0, 4).map((item: any) => (
                        <div key={item.name} className="bg-gray-50 p-2 sm:p-3 rounded-lg">
                          <p className="text-gray-500 truncate text-[10px] sm:text-xs">{item.name}</p>
                          <p className="font-bold text-gray-900 text-xs sm:text-sm">{item.value} {t('admin.staff')}</p>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={180} className="sm:h-[220px]">
                      <BarChart data={staffByRoleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          stroke="#6b7280"
                          fontSize={11}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis
                          stroke="#6b7280"
                          fontSize={11}
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: any) => [`${value} staff members`, 'Count']}
                        />
                        <Bar
                          dataKey="value"
                          fill="#8A1538"
                          radius={[8, 8, 0, 0]}
                          animationDuration={800}
                        >
                          {staffByRoleData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Total Staff</span>
                        <span className="font-bold text-gray-900">{staff.length}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No staff data</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setActiveTab('staff')}
                    >
                      Add Staff
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

