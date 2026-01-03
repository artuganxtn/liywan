import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Calendar, Users, Briefcase, Settings, Bell, Search, 
  MoreVertical, Mic, MessageSquare, Plus, CheckCircle, XCircle, Filter, Edit, Trash2,
  FileText, ArrowUpRight, DollarSign, Download, Eye, EyeOff, ChevronRight, MapPin, Phone, Mail, UserPlus, LogOut, Menu, Sparkles, Loader2, X, Star, AlertTriangle, CheckSquare, Coins, Play, CreditCard, Shield, Activity, BarChart3, BrainCircuit, Siren, FileWarning, ArrowLeft, Save, Clock, ScrollText, Lock, ChevronDown, ChevronUp, Upload, Globe, Palette, TrendingUp, TrendingDown, Zap, Target, RefreshCw, FileSpreadsheet, Printer, SlidersHorizontal, BookOpen, FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, Button, Input, Badge, Modal, Select, ProgressBar, IventiaLogo } from '../components/UI';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonList, SkeletonChart } from '../components/ui/Skeleton';
import EnhancedErrorBoundary from '../components/ui/EnhancedErrorBoundary';
import { DashboardSection } from '../components/AdminDashboard/DashboardSection';
import { Sidebar } from '../components/AdminDashboard/Sidebar';
import { Header } from '../components/AdminDashboard/Header';
import { EventsSection } from '../components/AdminDashboard/EventsSection';
import { StaffSection } from '../components/AdminDashboard/StaffSection';
import { ApplicationsSection } from '../components/AdminDashboard/ApplicationsSection';
import { BookingsSection } from '../components/AdminDashboard/BookingsSection';
import { SettingsSection } from '../components/AdminDashboard/SettingsSection';
import { LogsSection } from '../components/AdminDashboard/LogsSection';
import { AIForecastSection } from '../components/AdminDashboard/AIForecastSection';
import { NotificationCenter } from '../components/AdminDashboard/NotificationCenter';
import { ClientsSection } from '../components/AdminDashboard/ClientsSection';
import { SupervisorsSection } from '../components/AdminDashboard/SupervisorsSection';
import { Event, StaffProfile, JobApplication, User, Transaction, Notification, PayrollItem, AuditLog, Incident, EventBudget, ClientProfile, SupervisorProfile, StaffDocument, Booking } from '../types';
import { askAdminAssistant, predictStaffingNeeds, matchStaffToEvent } from '../services/geminiService';
import { events as apiEvents, staff as apiStaff, applications as apiApplications, payroll as apiPayroll, incidents as apiIncidents, ai as apiAI, notifications as apiNotifications, shifts as apiShifts, bookings as apiBookings, logs as apiLogs, clients as apiClients, supervisors as apiSupervisors } from '../services/api';
import axios from 'axios';
import { useToast } from '../components/ui/Toast';
// Removed apiConfig import - using API service directly instead
import { notifyPaymentApproved, notifyEventAccepted, notifyEventRejected, notifyBulkPayments } from '../services/notificationService';
import { getRealtimeService, getPollingService } from '../services/realtimeService';
import { useTranslation } from '../contexts/TranslationContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface AdminDashboardProps {
    onLogout: () => void;
    user: User;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    onLogout, user
}) => {
  const toast = useToast();
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // State Management - Use API data
  const [events, setEvents] = useState<Event[]>([]);
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorProfile[]>([]);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected' | 'Interview'>('All');
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'All' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Converted'>('All');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [supervisorSearch, setSupervisorSearch] = useState('');
  const [supervisorStatusFilter, setSupervisorStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'All' | 'Create' | 'Update' | 'Delete' | 'Login' | 'Logout'>('All');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Loading states
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [isLoadingApplications, setIsLoadingApplications] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingSupervisors, setIsLoadingSupervisors] = useState(false);
  
  // Real-time Metrics
  const [metrics, setMetrics] = useState({ activeStaff: 0, revenue: 0 });

  // Define all fetch functions first (before they're used)
  const fetchLogs = async () => {
    try {
      const response = await apiLogs.list({ page: 1, limit: 100 });
      const logsData = response?.data || [];
      if (Array.isArray(logsData)) {
        setLogs(logsData);
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    }
  };

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      console.log('Fetching events...');
      // Force fresh fetch by adding timestamp to bypass cache
      const response = await apiEvents.list({ page: 1, limit: 100 });
      console.log('Events API response:', response);
      
      // The response structure from events.list is: { success: true, data: [...events], pagination: {...} }
      console.log('Full API response:', response);
      console.log('Response structure:', {
        hasData: 'data' in response,
        hasSuccess: 'success' in response,
        keys: Object.keys(response || {}),
      });
      
      // Type-safe access to response data
      const responseData = (response as any)?.data;
      console.log('Response.data:', responseData);
      
      const eventsData = Array.isArray(responseData) ? responseData : [];
      console.log('Events data extracted:', eventsData);
      console.log('Is array?', Array.isArray(eventsData));
      console.log('Events count:', eventsData.length);
      
      if (Array.isArray(eventsData) && eventsData.length > 0) {
        console.log('Setting events:', eventsData);
        console.log('First event:', eventsData[0]);
        setEvents(eventsData);
        // Calculate metrics
        const totalRevenue = eventsData.reduce((sum: number, e: Event) => sum + (e.revenue || 0), 0);
        setMetrics(prev => ({ ...prev, revenue: totalRevenue }));
        console.log('Events set successfully, count:', eventsData.length);
        // Removed toast notification on events load
      } else if (Array.isArray(eventsData) && eventsData.length === 0) {
        console.log('Events array is empty');
        setEvents([]);
        toast.info('No events found');
      } else {
        console.error('Events data is not an array:', eventsData, typeof eventsData);
        setEvents([]);
        toast.warning('Events data format is incorrect');
      }
    } catch (error: any) {
      console.error('Error fetching events:', error);
      console.error('Error response:', error?.response);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load events';
      toast.error(errorMessage);
      setEvents([]); // Set empty array on error to prevent stale data
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setIsLoadingStaff(true);
      console.log('Fetching staff...');
      const response = await apiStaff.list({ page: 1, limit: 100 });
      console.log('Staff API response:', response);
      
      const staffData = response?.data || [];
      console.log('Staff data extracted:', staffData.length, 'staff members');
      
      if (Array.isArray(staffData)) {
        setStaff(staffData);
      // Calculate active staff
        const activeCount = staffData.filter((s: StaffProfile) => s.status === 'On Shift').length || 0;
      setMetrics(prev => ({ ...prev, activeStaff: activeCount }));
        console.log('Staff set successfully, count:', staffData.length);
      } else {
        console.error('Staff data is not an array:', staffData);
        setStaff([]);
        toast.warning('Staff data format is incorrect');
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load staff';
      toast.error(errorMessage);
      setStaff([]);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setIsLoadingApplications(true);
      console.log('Fetching applications...');
      const response = await apiApplications.list({ page: 1, limit: 100 });
      console.log('Applications API response:', response);
      console.log('Applications data:', response.data);
      setApplications(response.data || []);
      if (response.data && response.data.length > 0) {
        console.log(`Successfully loaded ${response.data.length} applications`);
      } else {
        console.log('No applications found');
      }
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      console.error('Error response:', error?.response);
      console.error('Error status:', error?.response?.status);
      console.error('Error data:', error?.response?.data);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to load applications';
      
      // Don't show error toast if it's just empty results
      if (error?.response?.status !== 404 && error?.response?.status !== 200) {
        toast.error(errorMessage);
      }
      
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true);
      const response = await apiBookings.list({ page: 1, limit: 100 });
      setBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load booking requests');
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  };


  const fetchIncidents = async () => {
    try {
      const response = await apiIncidents.list({ page: 1, limit: 100 });
      setIncidents(response.data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true);
      const response = await apiClients.list({ page: 1, limit: 100 });
      const clientsData = response?.data || [];
      if (Array.isArray(clientsData)) {
        setClients(clientsData);
      } else {
        setClients([]);
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to load clients');
      setClients([]);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      setIsLoadingSupervisors(true);
      const response = await apiSupervisors.list({ page: 1, limit: 100 });
      const supervisorsData = response?.data || [];
      if (Array.isArray(supervisorsData)) {
        setSupervisors(supervisorsData);
      } else {
        setSupervisors([]);
      }
    } catch (error: any) {
      console.error('Error fetching supervisors:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to load supervisors');
      setSupervisors([]);
    } finally {
      setIsLoadingSupervisors(false);
    }
  };

  // Define fetchAllData AFTER all fetch functions are declared
  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchEvents(),
        fetchStaff(),
        fetchApplications(),
        fetchBookings(),
        fetchIncidents(),
        fetchLogs(),
        fetchClients(),
        fetchSupervisors(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch data when switching tabs to ensure fresh data
  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
    } else if (activeTab === 'staff') {
      fetchStaff();
    } else if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'bookings') {
      fetchBookings();
    } else if (activeTab === 'clients') {
      fetchClients();
    } else if (activeTab === 'supervisors') {
      fetchSupervisors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // UI Controls
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventModalOpen, setEventModalOpen] = useState(false);
  const [eventDetailTab, setEventDetailTab] = useState<'overview' | 'roster' | 'schedule'>('overview');
  
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isAppModalOpen, setAppModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewData, setInterviewData] = useState({
    interviewDate: '',
    interviewTime: '',
    interviewLocation: '',
    interviewer: '',
    interviewNotes: '',
    meetingLink: '',
    interviewType: 'local' as 'local' | 'online',
  });
  
  // Staff Assignment Modal
  const [isAssignStaffModalOpen, setIsAssignStaffModalOpen] = useState(false);
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<string>('');
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<string>('');
  
  // Financial/Payment details for staff assignment
  const [assignmentPayment, setAssignmentPayment] = useState({
    hourlyRate: 0,
    totalHours: 8,
    paymentType: 'hourly' as 'hourly' | 'fixed' | 'daily',
    fixedAmount: 0,
    bonus: 0,
    deductions: 0,
    overtimeRate: 0,
    overtimeHours: 0,
    transportationAllowance: 0,
    mealAllowance: 0,
    notes: '',
  });
  
  // Smart Assignment Features
  const [eventRecommendations, setEventRecommendations] = useState<any>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [smartMatches, setSmartMatches] = useState<Record<string, any[]>>({});
  const [isLoadingMatches, setIsLoadingMatches] = useState<Record<string, boolean>>({});
  
  // Shift Management
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<{
      id?: string;
      startTime?: string;
      endTime?: string;
      date?: string;
      role?: string;
      staffId?: string;
      staff?: number;
      instructions?: string;
      wage?: number;
  } | null>(null);

  // Staff CRUD State
  const [isStaffModalOpen, setStaffModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [staffFormData, setStaffFormData] = useState<Partial<StaffProfile & { 
      nationality?: string; 
      dob?: string; 
      gender?: string; 
      height?: string; 
      weight?: string; 
      shirtSize?: string; 
      languages?: string[];
      joinedDate?: string;
      tempPassword?: string;
      qidNumber?: string;
  }>>({
      name: '', 
      role: 'General Staff', 
      email: '', 
      phone: '', 
      status: 'Available', 
      rating: 5, 
      imageUrl: 'https://i.pravatar.cc/150',
      documents: [],
      skills: [],
      location: 'Doha',
      totalEarnings: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      completedShifts: 0,
      onTimeRate: 100,
      certifications: [],
      xpPoints: 0,
      level: 'Bronze',
      feedback: [],
      nationality: '',
      dob: '',
      gender: '',
      height: '',
      weight: '',
      shirtSize: '',
      languages: [],
      qidNumber: '',
  });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('All');
  const [staffModalTab, setStaffModalTab] = useState<'profile' | 'documents' | 'account'>('profile');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  
  // Bulk operations
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [selectedSupervisorIds, setSelectedSupervisorIds] = useState<Set<string>>(new Set());
  
  // Debounced search values using custom hook
  const debouncedStaffSearch = useDebounce(staffSearch, 300);
  const debouncedAppSearch = useDebounce(appSearch, 300);
  const debouncedBookingSearch = useDebounce(bookingSearch, 300);
  const debouncedClientSearch = useDebounce(clientSearch, 300);
  const debouncedSupervisorSearch = useDebounce(supervisorSearch, 300);
  const debouncedLogSearch = useDebounce(logSearch, 300);

  // Client CRUD
  // Removed client, supervisor, and log modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientFormData, setClientFormData] = useState<Partial<ClientProfile & { 
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    website?: string;
    tempPassword?: string;
  }>>({ 
    companyName: '', 
    contactPerson: '', 
    email: '', 
    phone: '', 
    status: 'Active',
    imageUrl: '',
    address: '',
    city: 'Doha',
    country: 'Qatar',
    taxId: '',
    website: '',
  });
  const [clientModalTab, setClientModalTab] = useState<'profile' | 'company' | 'account'>('profile');
  const [isUploadingClientImage, setIsUploadingClientImage] = useState(false);
  const [showClientPassword, setShowClientPassword] = useState(false);

  // Removed supervisor form data
  const [editingSupervisorId, setEditingSupervisorId] = useState<string | null>(null);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [supervisorModalTab, setSupervisorModalTab] = useState<'profile' | 'credentials' | 'details'>('profile');
  const [supervisorFormData, setSupervisorFormData] = useState<Partial<SupervisorProfile & {
    location?: string;
    department?: string;
    specialization?: string;
    yearsOfExperience?: number;
    certifications?: string[];
    languages?: string[];
    notes?: string;
    tempPassword?: string;
  }>>({ 
    name: '', 
    email: '', 
    phone: '', 
    status: 'Active',
    imageUrl: '',
    location: 'Doha',
    department: '',
    specialization: '',
    yearsOfExperience: 0,
    certifications: [],
    languages: [],
    notes: '',
  });
  const [isUploadingSupervisorImage, setIsUploadingSupervisorImage] = useState(false);
  const [showSupervisorPassword, setShowSupervisorPassword] = useState(false);

  // AI FORECAST STATE
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [forecastParams, setForecastParams] = useState({ type: 'Conference', attendees: 500, location: 'Indoor' });
  const [forecastResult, setForecastResult] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  // Notification Center
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'All' | 'Alerts' | 'System' | 'Info'>('All');

  // Settings State
  const [settingsTab, setSettingsTab] = useState<'general' | 'branding' | 'security' | 'billing'>('general');
  const [settingsData, setSettingsData] = useState({
    platformName: 'LIYWAN',
    timezone: 'AST',
    maintenanceMode: false,
    twoFactorAuth: true,
    forcePasswordReset: false,
    primaryColor: '#8A1538',
    taxId: 'QA-12345678',
    billingEmail: 'finance@liywan.qa'
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  
  // Advanced Features State
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filterState, setFilterState] = useState<any>({});
  const [sortBy, setSortBy] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'createdAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgResponseTime: 0,
    systemUptime: 99.9,
    activeUsers: 0,
  });
  
  // Calculate event revenue helper function (must be defined before useMemo that uses it)
  const calculateEventRevenue = (event: Event): number => {
    // First try to get revenue from event.revenue
    const eventAny = event as any;
    if (eventAny.revenue && eventAny.revenue > 0) {
      return eventAny.revenue;
    }
    
    // Calculate from assignments' payment data
    const assignments = (event as any).assignments || [];
    const revenueFromAssignments = assignments.reduce((sum: number, assignment: any) => {
      if (assignment.payment && assignment.payment.totalPayment) {
        return sum + (assignment.payment.totalPayment || 0);
      }
      // Fallback: if payment data not available, use wage from shift or default
      if (assignment.wage) {
        return sum + (assignment.wage || 0);
      }
      return sum;
    }, 0);
    
    return revenueFromAssignments;
  };
  
  // Global search functionality
  const globalSearchResults = useMemo(() => {
    if (!globalSearch || globalSearch.trim().length < 2) return { events: [], staff: [] };
    
    const searchLower = globalSearch.toLowerCase();
    return {
      events: events.filter(e => 
        e.title?.toLowerCase().includes(searchLower) ||
        e.location?.toLowerCase().includes(searchLower) ||
        e.description?.toLowerCase().includes(searchLower)
      ).slice(0, 5),
      staff: staff.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.phone?.toLowerCase().includes(searchLower) ||
        s.role?.toLowerCase().includes(searchLower)
      ).slice(0, 5),
    };
  }, [globalSearch, events, staff]);
  
  const totalSearchResults = globalSearchResults.events.length + 
    globalSearchResults.staff.length;
  
  // Chart data calculations - Enhanced with real data
  const revenueChartData = useMemo(() => {
    if (analyticsPeriod === '7d') {
      // Last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dayEvents = events.filter(e => {
          const eventDate = new Date(e.date || e.startAt || '');
          if (isNaN(eventDate.getTime())) return false;
          return eventDate.toDateString() === date.toDateString();
        });
        const dayRevenue = dayEvents.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
        return {
          month: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          revenue: dayRevenue,
          date: date.toISOString().split('T')[0],
        };
      });
    } else if (analyticsPeriod === '30d') {
      // Last 30 days grouped by week
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (28 - i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEvents = events.filter(e => {
          const eventDate = new Date(e.date || e.startAt || '');
          if (isNaN(eventDate.getTime())) return false;
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        const weekRevenue = weekEvents.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
        return {
          month: `Week ${i + 1}`,
          revenue: weekRevenue,
          date: weekStart.toISOString().split('T')[0],
        };
      });
    } else if (analyticsPeriod === '90d') {
      // Last 90 days grouped by month
      return Array.from({ length: 3 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (2 - i));
        const monthEvents = events.filter(e => {
          const eventDate = new Date(e.date || e.startAt || '');
          if (isNaN(eventDate.getTime())) return false;
          return eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
        });
        const monthRevenue = monthEvents.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthRevenue,
          date: date.toISOString().split('T')[0],
        };
      });
    } else {
      // Last year grouped by quarter
      return Array.from({ length: 4 }, (_, i) => {
        const quarterStart = new Date();
        quarterStart.setMonth(quarterStart.getMonth() - (12 - i * 3));
        const quarterEnd = new Date(quarterStart);
        quarterEnd.setMonth(quarterEnd.getMonth() + 3);
        const quarterEvents = events.filter(e => {
          const eventDate = new Date(e.date || e.startAt || '');
          if (isNaN(eventDate.getTime())) return false;
          return eventDate >= quarterStart && eventDate < quarterEnd;
        });
        const quarterRevenue = quarterEvents.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
        return {
          month: `Q${i + 1}`,
          revenue: quarterRevenue,
          date: quarterStart.toISOString().split('T')[0],
        };
      });
    }
  }, [events, analyticsPeriod]);
  
  const eventsByStatusData = useMemo(() => {
    const statusCounts = events.reduce((acc: any, event) => {
      // Normalize status names for better display
      let status = event.status || 'Unknown';
      if (status === 'APPROVED' || status === 'Pending' || status === 'PENDING') {
        status = 'Upcoming';
      } else if (status === 'LIVE') {
        status = 'Live';
      } else if (status === 'COMPLETED') {
        status = 'Completed';
      } else if (status === 'CANCELLED') {
        status = 'Cancelled';
      }
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value: value as number }));
  }, [events]);
  
  const staffByRoleData = useMemo(() => {
    const roleCounts = staff.reduce((acc: any, s) => {
      acc[s.role] = (acc[s.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
  }, [staff]);
  
  const COLORS = ['#8A1538', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
  
  // Enhanced CSV export with proper formatting and escaping
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Enhanced CSV escape function
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined || value === '') return '';
      const stringValue = String(value);
      // Always wrap in quotes for better Excel compatibility and escape internal quotes
      return `"${stringValue.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`;
    };
    
    // Get headers from first object (maintain order)
    const headers = Object.keys(data[0]);
    
    // Create header row with proper formatting
    const headerRow = headers.map(escapeCSV).join(',');
    
    // Create data rows with proper escaping and formatting
    const rows = data.map((item, index) => {
      const row = headers.map(header => {
        const value = item[header];
        // Handle special formatting
        if (value === null || value === undefined) return '""';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'number') return String(value);
        return escapeCSV(value);
      });
      return row.join(',');
    });
    
    // Create metadata header
    const metadata = [
      `LIYWAN - Job Applications Export`,
      `Generated: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      })}`,
      `Total Records: ${data.length}`,
      ``
    ];
    
    // Combine metadata, headers, and rows with BOM for Excel compatibility
    const csvContent = '\uFEFF' + [
      ...metadata.map(line => `"${line}"`),
      headerRow,
      ...rows
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`✅ Exported ${data.length} record${data.length !== 1 ? 's' : ''} to CSV successfully!`);
  };

  // PDF Export Functions
  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => resolve(''); // Return empty string if image fails to load
      img.src = url;
    });
  };

  const loadLIYWANLogo = (): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      // Try multiple logo paths
      img.src = '/logo.png';
      setTimeout(() => {
        if (!img.complete) {
          img.src = './logo.png';
        }
      }, 100);
    });
  };

  const exportAllApplicationsToPDF = async () => {
    try {
      const filteredApps = applications.filter(app => {
        const searchLower = (debouncedAppSearch || appSearch || '').toLowerCase();
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

      if (filteredApps.length === 0) {
        toast.error('No applications to export');
        return;
      }

      toast.info('Generating PDF... This may take a moment.');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Brand Colors
      const brandColor = [138, 21, 56]; // #8A1538
      const brandLight = [138, 21, 56, 0.1];
      const brandDark = [100, 15, 40];

      // Load and add logo
      const logoData = await loadLIYWANLogo();
      if (logoData) {
        try {
          pdf.addImage(logoData, 'PNG', margin, 8, 25, 10);
        } catch (e) {
          console.log('Could not add logo:', e);
        }
      }

      // Enhanced Header with gradient effect
      pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      // White text on brand color
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('JOB APPLICATIONS REPORT', logoData ? margin + 30 : margin, 18);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`, logoData ? margin + 30 : margin, 25);
      pdf.text(`Total: ${filteredApps.length} Application${filteredApps.length !== 1 ? 's' : ''}`, pageWidth - margin - 50, 25);
      
      // Status filter info
      if (appStatusFilter !== 'All') {
        pdf.setFontSize(8);
        pdf.text(`Filter: ${appStatusFilter}`, pageWidth - margin - 50, 30);
      }

      yPos = 45;

      for (let i = 0; i < filteredApps.length; i++) {
        const app = filteredApps[i];
        
        // Check if we need a new page
        if (yPos > pageHeight - 100) {
          pdf.addPage();
          yPos = 20;
        }

        // Application card background
        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(margin, yPos - 5, contentWidth, 0, 3, 3, 'F');
        
        // Application number badge
        pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
        pdf.circle(margin + 8, yPos + 3, 6, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${i + 1}`, margin + 8, yPos + 5.5, { align: 'center' });

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.text(app.name || 'N/A', margin + 20, yPos + 5);
        
        // Status badge
        const statusColors: { [key: string]: number[] } = {
          'Pending': [251, 191, 36],
          'Interview': [59, 130, 246],
          'Approved': [16, 185, 129],
          'Rejected': [239, 68, 68]
        };
        const statusColor = statusColors[app.status || 'Pending'] || [156, 163, 175];
        pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        pdf.roundedRect(pageWidth - margin - 25, yPos - 2, 20, 7, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text((app.status || 'N/A').toUpperCase(), pageWidth - margin - 15, yPos + 2.5, { align: 'center' });

        yPos += 12;

        // Load and add profile image
        if (app.avatar && app.avatar !== '#' && app.avatar !== '') {
          try {
            const imgData = await loadImage(app.avatar);
            if (imgData) {
              pdf.addImage(imgData, 'JPEG', margin, yPos, 25, 25);
            }
          } catch (e) {
            console.log('Could not load image:', e);
          }
        }

        // Application details in two columns
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        const leftColumn = [
          `Email: ${app.email || 'N/A'}`,
          `Phone: ${app.phone || 'N/A'}`,
          `Role: ${app.roleApplied || 'N/A'}`,
          `Applied: ${app.appliedDate ? (typeof app.appliedDate === 'string' ? app.appliedDate.split('T')[0] : new Date(app.appliedDate).toISOString().split('T')[0]) : 'N/A'}`,
          `Quiz Score: ${app.quizScore || 0}%`,
          `Location: ${app.location || 'N/A'}`,
        ];

        const rightColumn = [
          `Nationality: ${(app as any).nationality || 'N/A'}`,
          `DOB: ${(app as any).dob ? (typeof (app as any).dob === 'string' ? (app as any).dob.split('T')[0] : new Date((app as any).dob).toISOString().split('T')[0]) : 'N/A'}`,
          `Gender: ${(app as any).gender || 'N/A'}`,
          `Height: ${(app as any).height || 'N/A'} cm`,
          `Weight: ${(app as any).weight || 'N/A'} kg`,
          `Size: ${(app as any).shirtSize || 'N/A'}`,
        ];

        let detailY = yPos;
        const maxLines = Math.max(leftColumn.length, rightColumn.length);
        for (let j = 0; j < maxLines; j++) {
          if (detailY > pageHeight - 20) {
            pdf.addPage();
            detailY = 20;
          }
          if (leftColumn[j]) {
            const cleanLeft = String(leftColumn[j]).replace(/[^\x00-\x7F]/g, '');
            pdf.text(cleanLeft, margin + 30, detailY);
          }
          if (rightColumn[j]) {
            const cleanRight = String(rightColumn[j]).replace(/[^\x00-\x7F]/g, '');
            pdf.text(cleanRight, margin + 100, detailY);
          }
          detailY += 4.5;
        }

        // Additional info
        pdf.text(`QID: ${(app as any).qidNumber || 'N/A'}`, margin + 30, detailY);
        detailY += 4.5;
        pdf.text(`Languages: ${Array.isArray(app.languages) ? app.languages.join(', ') : (app.languages || 'N/A')}`, margin + 30, detailY);
        
        yPos = detailY + 8;

        // Add separator line with brand color
        if (i < filteredApps.length - 1) {
          pdf.setDrawColor(brandColor[0], brandColor[1], brandColor[2]);
          pdf.setLineWidth(0.5);
          pdf.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 8;
        }
      }

      // Add footer to last page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'italic');
        pdf.text('LIYWAN - Professional Event Staffing Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      const filename = `job_applications_${appStatusFilter !== 'All' ? appStatusFilter.toLowerCase() : 'all'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      toast.success(`✅ PDF exported successfully with ${filteredApps.length} application(s)!`);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + (error?.message || 'Unknown error'));
    }
  };

  const exportApplicationToPDF = async (app: JobApplication) => {
    try {
      toast.info('Generating PDF...');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 20;

      // Brand Colors
      const brandColor = [138, 21, 56]; // #8A1538
      const brandLight = [138, 21, 56, 0.1];

      // Load and add logo
      const logoData = await loadLIYWANLogo();
      if (logoData) {
        try {
          pdf.addImage(logoData, 'PNG', margin, 8, 25, 10);
        } catch (e) {
          console.log('Could not add logo:', e);
        }
      }

      // Enhanced Header with brand color
      pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('APPLICATION DETAILS', logoData ? margin + 30 : margin, 20);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`, logoData ? margin + 30 : margin, 28);
      
      // Status badge in header
      const statusColors: { [key: string]: number[] } = {
        'Pending': [251, 191, 36],
        'Interview': [59, 130, 246],
        'Approved': [16, 185, 129],
        'Rejected': [239, 68, 68]
      };
      const statusColor = statusColors[app.status || 'Pending'] || [156, 163, 175];
      pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.roundedRect(pageWidth - margin - 30, 15, 25, 8, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text((app.status || 'N/A').toUpperCase(), pageWidth - margin - 17.5, 20, { align: 'center' });

      yPos = 50;

      // Profile Section with Image
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(margin, yPos - 5, pageWidth - (margin * 2), 50, 3, 3, 'F');
      
      // Load and add profile image
      if (app.avatar && app.avatar !== '#' && app.avatar !== '') {
        try {
          const imgData = await loadImage(app.avatar);
          if (imgData) {
            pdf.addImage(imgData, 'JPEG', margin + 5, yPos, 35, 35);
          }
        } catch (e) {
          console.log('Could not load image:', e);
        }
      }

      // Name and basic info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(app.name || 'N/A', margin + 45, yPos + 8);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(app.email || 'N/A', margin + 45, yPos + 14);
      pdf.text(app.phone || 'N/A', margin + 45, yPos + 20);
      pdf.text(`Role: ${app.roleApplied || 'N/A'}`, margin + 45, yPos + 26);

      yPos += 60;

      // Personal Information Section
      pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      pdf.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 6, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Personal Information', margin + 3, yPos + 2);
      yPos += 10;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const personalInfoLeft = [
        `Name: ${app.name || 'N/A'}`,
        `Email: ${app.email || 'N/A'}`,
        `Phone: ${app.phone || 'N/A'}`,
        `Nationality: ${(app as any).nationality || 'N/A'}`,
        `Date of Birth: ${(app as any).dob ? (typeof (app as any).dob === 'string' ? (app as any).dob.split('T')[0] : new Date((app as any).dob).toISOString().split('T')[0]) : 'N/A'}`,
        `Gender: ${(app as any).gender || 'N/A'}`,
      ];

      const personalInfoRight = [
        `Height: ${(app as any).height || 'N/A'} cm`,
        `Weight: ${(app as any).weight || 'N/A'} kg`,
        `Shirt Size: ${(app as any).shirtSize || 'N/A'}`,
        `QID Number: ${(app as any).qidNumber || 'N/A'}`,
        `Languages: ${Array.isArray(app.languages) ? app.languages.join(', ') : (app.languages || 'N/A')}`,
      ];

      personalInfoLeft.forEach((info, idx) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        // Clean text to avoid encoding issues
        const cleanInfo = String(info).replace(/[^\x00-\x7F]/g, '');
        pdf.text(cleanInfo, margin + 5, yPos);
        if (personalInfoRight[idx]) {
          const cleanRight = String(personalInfoRight[idx]).replace(/[^\x00-\x7F]/g, '');
          pdf.text(cleanRight, margin + 100, yPos);
        }
        yPos += 5;
      });

      yPos += 5;

      // Application Details Section
      pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      pdf.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 6, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Application Details', margin + 3, yPos + 2);
      yPos += 10;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const appDetails = [
        `Role Applied: ${app.roleApplied || 'N/A'}`,
        `Status: ${app.status || 'N/A'}`,
        `Applied Date: ${app.appliedDate ? (typeof app.appliedDate === 'string' ? app.appliedDate.split('T')[0] : new Date(app.appliedDate).toISOString().split('T')[0]) : 'N/A'}`,
        `Experience: ${app.experience || 'N/A'}`,
        `Location: ${app.location || 'N/A'}`,
        `Quiz Score: ${app.quizScore || 0}%`,
      ];

      appDetails.forEach(detail => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        // Clean text to avoid encoding issues
        const cleanDetail = String(detail).replace(/[^\x00-\x7F]/g, '');
        pdf.text(cleanDetail, margin + 5, yPos);
        yPos += 5;
      });

      // Quiz Details Section
      if (app.quizDetails && Array.isArray(app.quizDetails) && app.quizDetails.length > 0) {
        yPos += 8;
        pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
        pdf.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 6, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Quiz Results (${app.quizScore || 0}%)`, margin + 3, yPos + 2);
        yPos += 12;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        app.quizDetails.forEach((q: any, idx: number) => {
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = 20;
          }
          
          // Calculate content height first
          const question = String(q.question || 'N/A');
          const questionLines = pdf.splitTextToSize(`${idx + 1}. ${question}`, pageWidth - (margin * 2) - 12);
          const cleanQuestionLines = questionLines.map((line: string) => String(line).replace(/[^\x00-\x7F]/g, ''));
          
          // Calculate box height: question lines + answer lines + padding
          let contentHeight = (cleanQuestionLines.length * 4) + 8; // Question height
          contentHeight += 5; // Answer line
          if (!q.isCorrect) {
            contentHeight += 5; // Correct answer line if incorrect
          }
          contentHeight += 4; // Bottom padding
          
          const boxHeight = Math.max(20, contentHeight);
          
          // Background color for quiz answer box
          const bgColor = q.isCorrect ? [16, 185, 129, 0.1] : [239, 68, 68, 0.1];
          pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
          pdf.roundedRect(margin, yPos - 2, pageWidth - (margin * 2), boxHeight, 3, 3, 'F');
          
          // Border color
          const borderColor = q.isCorrect ? [16, 185, 129] : [239, 68, 68];
          pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin, yPos - 2, pageWidth - (margin * 2), boxHeight, 3, 3, 'S');
          
          // Question text
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text(cleanQuestionLines, margin + 5, yPos + 4);
          
          // Move to answer position
          let answerYPos = yPos + (cleanQuestionLines.length * 4) + 5;
          
          // Answer with proper formatting
          pdf.setFontSize(8);
          if (q.isCorrect) {
            pdf.setTextColor(16, 185, 129);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`✓ Selected: Option ${(q.selectedOption || 0) + 1} [CORRECT]`, margin + 5, answerYPos);
          } else {
            pdf.setTextColor(239, 68, 68);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`✗ Selected: Option ${(q.selectedOption || 0) + 1} [INCORRECT]`, margin + 5, answerYPos);
            answerYPos += 5;
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.text(`Correct Answer: Option ${(q.correctOption || 0) + 1}`, margin + 5, answerYPos);
          }
          
          // Move to next question position
          yPos += boxHeight + 5;
        });
      }

      // Interview Details Section
      if ((app as any).interviewDate || (app as any).interviewTime) {
        yPos += 5;
        pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
        pdf.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 6, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Interview Information', margin + 3, yPos + 2);
        yPos += 10;

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const interviewInfo = [
          `Date: ${(app as any).interviewDate ? (typeof (app as any).interviewDate === 'string' ? (app as any).interviewDate.split('T')[0] : new Date((app as any).interviewDate).toISOString().split('T')[0]) : 'N/A'}`,
          `Time: ${(app as any).interviewTime || 'N/A'}`,
          `Location: ${(app as any).interviewLocation || 'N/A'}`,
          `Type: ${(app as any).interviewType || 'N/A'}`,
          `Interviewer: ${(app as any).interviewer || 'N/A'}`,
          `Meeting Link: ${(app as any).meetingLink || 'N/A'}`,
        ];

        interviewInfo.forEach(info => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 20;
          }
          // Clean text to avoid encoding issues
          const cleanInfo = String(info).replace(/[^\x00-\x7F]/g, '');
          pdf.text(cleanInfo, margin + 5, yPos);
          yPos += 5;
        });

        if ((app as any).interviewNotes) {
          yPos += 2;
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          const cleanNotes = String((app as any).interviewNotes || '').replace(/[^\x00-\x7F]/g, '');
          const notesLines = pdf.splitTextToSize(`Notes: ${cleanNotes}`, pageWidth - (margin * 2) - 10);
          pdf.text(notesLines, margin + 5, yPos);
          yPos += (notesLines.length * 4);
        }
      }

      // Documents Section with Links
      yPos += 5;
      pdf.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
      pdf.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 6, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Documents', margin + 3, yPos + 2);
      yPos += 10;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      
      const cvUrl = (app as any).cvUrl && (app as any).cvUrl !== '#' && (app as any).cvUrl !== '' ? (app as any).cvUrl : null;
      const idDocUrl = (app as any).idDocumentUrl && (app as any).idDocumentUrl !== '#' && (app as any).idDocumentUrl !== '' ? (app as any).idDocumentUrl : null;

      if (cvUrl) {
        pdf.text('CV/Resume:', margin + 5, yPos);
        pdf.setFontSize(8);
        pdf.setTextColor(59, 130, 246);
        // Truncate long URLs for display
        const displayUrl = cvUrl.length > 60 ? cvUrl.substring(0, 57) + '...' : cvUrl;
        pdf.text(displayUrl, margin + 35, yPos);
        // Add clickable link covering the text
        try {
          const linkWidth = pdf.getTextWidth(displayUrl);
          pdf.link(margin + 35, yPos - 3, linkWidth, 4, { url: cvUrl });
          // Add note that it's clickable
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text('(Click to open)', margin + 35 + linkWidth + 2, yPos);
        } catch (e) {
          console.log('Could not add link:', e);
        }
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        yPos += 7;
      } else {
        pdf.text('CV/Resume: Not uploaded', margin + 5, yPos);
        yPos += 7;
      }

      if (idDocUrl) {
        pdf.text('ID Document:', margin + 5, yPos);
        pdf.setFontSize(8);
        pdf.setTextColor(59, 130, 246);
        // Truncate long URLs for display
        const displayUrl = idDocUrl.length > 60 ? idDocUrl.substring(0, 57) + '...' : idDocUrl;
        pdf.text(displayUrl, margin + 40, yPos);
        // Add clickable link covering the text
        try {
          const linkWidth = pdf.getTextWidth(displayUrl);
          pdf.link(margin + 40, yPos - 3, linkWidth, 4, { url: idDocUrl });
          // Add note that it's clickable
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text('(Click to open)', margin + 40 + linkWidth + 2, yPos);
        } catch (e) {
          console.log('Could not add link:', e);
        }
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        yPos += 7;
      } else {
        pdf.text('ID Document: Not uploaded', margin + 5, yPos);
        yPos += 7;
      }

      // Add footer to all pages
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'italic');
        pdf.text('LIYWAN - Professional Event Staffing Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      const filename = `application_${app.name?.replace(/[^a-z0-9]/gi, '_') || 'application'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
      toast.success('✅ Application PDF exported successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + (error?.message || 'Unknown error'));
    }
  };
  
  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAllData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRefresh();
      }
      // Global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
      // Close modals with Escape
      if (e.key === 'Escape') {
        if (showSearchModal) {
          setShowSearchModal(false);
          setGlobalSearch('');
        }
        if (isEventModalOpen) setEventModalOpen(false);
        if (isStaffModalOpen) setStaffModalOpen(false);
        if (isAppModalOpen) setAppModalOpen(false);
        if (isNotificationsOpen) setIsNotificationsOpen(false);
      }
      // Navigate tabs with numbers (1-9)
      if (e.ctrlKey && !e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabs = ['dashboard', 'events', 'staff', 'applications', 'settings'];
        const tabIndex = parseInt(e.key) - 1;
        if (tabs[tabIndex]) {
          setActiveTab(tabs[tabIndex]);
          setIsSidebarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showSearchModal, isEventModalOpen, isStaffModalOpen, isAppModalOpen, isNotificationsOpen]);

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => {
      // Debouncing now handled by useDebounce hook
    }, 300);
    return () => clearTimeout(timer);
  }, [staffSearch]);


  useEffect(() => {
    const timer = setTimeout(() => {
      // Debouncing now handled by useDebounce hook
    }, 300);
    return () => clearTimeout(timer);
  }, [appSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedClientSearch(clientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSupervisorSearch(supervisorSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [supervisorSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLogSearch(logSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [logSearch]);


  // Event Form State
  const [eventFormData, setEventFormData] = useState<Partial<Event & { endDate?: string }>>({
      title: '', location: '', date: '', endDate: '', description: '', status: 'Pending', staffRequired: 10, revenue: 0, 
      budget: { total: 0, staffingAllocated: 0, logisticsAllocated: 0, marketingAllocated: 0, cateringAllocated: 0, technologyAllocated: 0, miscellaneousAllocated: 0, spent: 0 }
  });

  // Ensure all form values are strings (not undefined) for controlled inputs
  const getEventFormValue = (field: keyof Event, fallback: string = '') => {
    return eventFormData[field] || selectedEvent?.[field] || fallback;
  };

  const handleForecast = async () => {
      setIsForecasting(true);
      setForecastResult(null);
      try {
          const response = await apiAI.staffingForecast(forecastParams.type, forecastParams.attendees, forecastParams.location);
          setForecastResult(response.data);
      } catch (e) {
          console.error("Failed to get forecast", e);
          setForecastResult({"Hosts": 10, "Security": 5}); // Fallback
      }
      setIsForecasting(false);
  };

  // --- NOTIFICATION ACTIONS ---
  const markAsRead = (id: string) => {
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  
  const filteredNotifications = notifications.filter(n => {
      if (notifFilter === 'All') return true;
      if (notifFilter === 'Alerts') return n.type === 'warning' || n.type === 'error';
      if (notifFilter === 'System') return n.category === 'System';
      if (notifFilter === 'Info') return n.type === 'info' || n.type === 'success';
      if (notifFilter === 'Payment') return n.category === 'Payment';
      if (notifFilter === 'Application') return n.category === 'Application';
      return true;
  });


  // --- BOOKING ACTIONS ---
  const [bookingRecommendations, setBookingRecommendations] = useState<any>(null);
  const [isLoadingBookingRecommendations, setIsLoadingBookingRecommendations] = useState(false);
  
  const loadBookingRecommendations = async (booking: Booking) => {
      if (!booking || booking.status === 'Approved' || booking.status === 'Converted') return;
      
      setIsLoadingBookingRecommendations(true);
      try {
          // Create a temporary event object for AI matching
          const tempEvent: Partial<Event> = {
              title: `${booking.eventType} - ${booking.contact?.name || 'Event'}`,
              description: booking.eventDetails?.special || `${booking.eventType} event at ${booking.eventDetails?.venue || booking.location}`,
              location: booking.location,
              staffRequired: (booking.staff?.servers || 0) + (booking.staff?.hosts || 0) + (booking.staff?.other || 0),
          };
          
          // Get staff recommendations for each role
          const recommendations: any = {};
          
          if (booking.staff?.servers && booking.staff.servers > 0) {
              try {
                  const serverRecs = await matchStaffToEvent(tempEvent as Event, staff, 'Server');
                  recommendations.servers = JSON.parse(serverRecs);
              } catch (e) {
                  console.log('AI recommendation error:', e);
              }
          }
          
          if (booking.staff?.hosts && booking.staff.hosts > 0) {
              try {
                  const hostRecs = await matchStaffToEvent(tempEvent as Event, staff, 'Hostess');
                  recommendations.hosts = JSON.parse(hostRecs);
              } catch (e) {
                  console.log('AI recommendation error:', e);
              }
          }
          
          if (booking.staff?.other && booking.staff.other > 0) {
              try {
                  const otherRecs = await matchStaffToEvent(tempEvent as Event, staff, 'General Staff');
                  recommendations.other = JSON.parse(otherRecs);
              } catch (e) {
                  console.log('AI recommendation error:', e);
              }
          }
          
          setBookingRecommendations(recommendations);
      } catch (error) {
          console.error('Error loading recommendations:', error);
      } finally {
          setIsLoadingBookingRecommendations(false);
      }
  };
  
  const handleBookingDecision = async (bookingId: string, status: 'Approved' | 'Rejected') => {
      try {
          setIsLoadingBookings(true);
          
          // When approving, the backend will automatically convert to event
          const response = await apiBookings.updateStatus(bookingId, status);
          
          // Refresh bookings and events lists
          await fetchBookings();
          await fetchEvents();
          
          setIsBookingModalOpen(false);
          setSelectedBooking(null);
          setBookingRecommendations(null);
          
          if (status === 'Approved') {
              toast.success('✅ Booking approved! Event created with status "Upcoming".');
          } else {
              toast.success('Booking rejected.');
          }
      } catch (error: any) {
          console.error('Error updating booking status:', error);
          toast.error(error?.response?.data?.error || error?.message || 'Failed to update booking status');
      } finally {
          setIsLoadingBookings(false);
      }
  };

  // --- APPLICATION ACTIONS ---
  const handleAppDecision = async (status: 'Approved' | 'Rejected' | 'Interview', interviewData?: any) => {
      if (!selectedApp) return;
      try {
          setIsLoadingApplications(true);
          await apiApplications.updateStatus(selectedApp.id, status, interviewData || {});
          
          // Refresh applications list to get updated data
          await fetchApplications();
          
          setAppModalOpen(false);
          setSelectedApp(null);
          
          const statusMessages = {
              'Approved': 'Application approved! The applicant has been notified via email.',
              'Rejected': 'Application rejected. The applicant has been notified via email.',
              'Interview': 'Interview scheduled! The applicant has been notified via email.',
          };
          
          toast.success(statusMessages[status] || `Application ${status.toLowerCase()} successfully`);
      } catch (error: any) {
          console.error('Error updating application:', error);
          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update application';
          toast.error(errorMessage);
      } finally {
          setIsLoadingApplications(false);
      }
  };

  // --- EVENT CRUD ---
  const handleCreateEvent = async () => {
      if (!eventFormData.title || !eventFormData.date) {
          toast.warning("Please fill in required fields (Title and Date are required).");
          return;
      }
      try {
          // Ensure roles array exists - if not provided, create default based on staffRequired
          const roles = eventFormData.roles && eventFormData.roles.length > 0 
                  ? eventFormData.roles 
              : [{ roleName: 'General Staff', count: eventFormData.staffRequired || 10, filled: 0 }];
          
          // Calculate total budget if individual allocations are set
          const budgetTotal = eventFormData.budget?.total || 
              ((eventFormData.budget?.staffingAllocated || 0) + 
               (eventFormData.budget?.logisticsAllocated || 0) + 
               (eventFormData.budget?.marketingAllocated || 0) +
               (eventFormData.budget?.cateringAllocated || 0) +
               (eventFormData.budget?.technologyAllocated || 0) +
               (eventFormData.budget?.miscellaneousAllocated || 0));
          
          const eventData: Partial<Event> = {
              ...eventFormData,
              roles: roles,
              budget: {
                  ...eventFormData.budget,
                  total: budgetTotal,
              } as EventBudget,
          };
          
          console.log('Creating event with data:', eventData);
          const response = await apiEvents.create(eventData);
          console.log('Create event response:', response);
          
          if (response && response.data) {
              console.log('Event created successfully, refetching events...');
              // Reset form to default state
              setEventFormData({ 
                  title: '', 
                  location: '', 
                  date: '', 
                  endDate: '', 
                  description: '', 
                  status: 'Pending', 
                  staffRequired: 10, 
                  revenue: 0, 
                  budget: { 
                      total: 0, 
                      staffingAllocated: 0, 
                      logisticsAllocated: 0, 
                      marketingAllocated: 0, 
                      cateringAllocated: 0, 
                      technologyAllocated: 0, 
                      miscellaneousAllocated: 0, 
                      spent: 0 
                  } 
              });
              
              // Close modal
              setEventModalOpen(false);
              
              // Refetch events to ensure we have the latest data from server
              await fetchEvents();
              
              toast.success('Event created successfully');
          } else {
              console.error('Invalid response from server:', response);
              throw new Error('Invalid response from server');
          }
      } catch (error: any) {
          console.error('Error creating event:', error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to create event';
          toast.error(errorMessage);
      }
  };

  const handleUpdateEvent = async () => {
      if (!selectedEvent) {
          toast.warning("No event selected for editing.");
          return;
      }
      
      if (!eventFormData.title || !eventFormData.date) {
          toast.warning("Please fill in required fields (Title and Date are required).");
          return;
      }
      
      try {
          // Calculate total budget if individual allocations are set
          const budgetTotal = eventFormData.budget?.total || 
              ((eventFormData.budget?.staffingAllocated || 0) + 
               (eventFormData.budget?.logisticsAllocated || 0) + 
               (eventFormData.budget?.marketingAllocated || 0) +
               (eventFormData.budget?.cateringAllocated || 0) +
               (eventFormData.budget?.technologyAllocated || 0) +
               (eventFormData.budget?.miscellaneousAllocated || 0));
          
          const updateData: Partial<Event> = {
              ...eventFormData,
              budget: {
                  ...eventFormData.budget,
                  total: budgetTotal,
              } as EventBudget,
          };
          
          console.log('Updating event with data:', updateData);
          const response = await apiEvents.update(selectedEvent.id, updateData);
          console.log('Update event response:', response);
          
          // Refetch events to ensure we have the latest data
          await fetchEvents();
          
          // Update selected event with the response data
          if (response && response.data) {
              setSelectedEvent(response.data);
              setEventFormData(response.data);
              toast.success('Event Details Updated Successfully');
          } else {
              // Fallback: find updated event from the list
          const updatedEvent = events.find(e => e.id === selectedEvent.id);
          if (updatedEvent) {
              setSelectedEvent(updatedEvent);
                  setEventFormData(updatedEvent);
          toast.success('Event Details Updated Successfully');
              } else {
                  throw new Error('Event not found after update');
              }
          }
      } catch (error: any) {
          console.error('Error updating event:', error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to update event';
          toast.error(errorMessage);
      }
  };

  const handleDeleteEvent = async () => {
      if (!selectedEvent) return;
      const eventTitle = selectedEvent.title || 'this event';
      if (confirm(`⚠️ WARNING: Are you sure you want to delete "${eventTitle}"?\n\nThis will permanently delete:\n• Event details\n• All assignments\n• Budget information\n• Related records\n\nThis action CANNOT be undone.`)) {
          try {
              await apiEvents.delete(selectedEvent.id);
              // Refetch events to ensure we have the latest data
              await fetchEvents();
              setSelectedEvent(null);
              setActiveTab('events');
              toast.success('Event deleted successfully');
          } catch (error) {
              console.error('Error deleting event:', error);
              toast.error('Failed to delete event');
          }
      }
  };


  // Staff Assignment Handler
  const handleAssignStaff = async () => {
      if (!selectedEvent || !selectedStaffForAssignment || !selectedRoleForAssignment) {
          toast.warning('Please select both staff member and role');
          return;
      }
      
      // Validate payment information
      if (assignmentPayment.paymentType === 'hourly' && assignmentPayment.hourlyRate <= 0) {
          toast.warning('Please enter a valid hourly rate');
          return;
      }
      if (assignmentPayment.paymentType === 'fixed' && assignmentPayment.fixedAmount <= 0) {
          toast.warning('Please enter a valid fixed amount');
          return;
      }
      if (assignmentPayment.totalHours <= 0) {
          toast.warning('Please enter valid total hours');
          return;
      }
      
      // Calculate total payment
      let totalPayment = 0;
      if (assignmentPayment.paymentType === 'hourly') {
          totalPayment = (assignmentPayment.hourlyRate * assignmentPayment.totalHours) +
                        (assignmentPayment.overtimeRate * assignmentPayment.overtimeHours) +
                        assignmentPayment.bonus +
                        assignmentPayment.transportationAllowance +
                        assignmentPayment.mealAllowance -
                        assignmentPayment.deductions;
      } else if (assignmentPayment.paymentType === 'fixed') {
          totalPayment = assignmentPayment.fixedAmount +
                        assignmentPayment.bonus +
                        assignmentPayment.transportationAllowance +
                        assignmentPayment.mealAllowance -
                        assignmentPayment.deductions;
      } else if (assignmentPayment.paymentType === 'daily') {
          totalPayment = (assignmentPayment.hourlyRate * 8) + // 8 hours base
                        (assignmentPayment.overtimeRate * assignmentPayment.overtimeHours) +
                        assignmentPayment.bonus +
                        assignmentPayment.transportationAllowance +
                        assignmentPayment.mealAllowance -
                        assignmentPayment.deductions;
      }
      
      if (totalPayment <= 0) {
          toast.warning('Total payment must be greater than zero');
          return;
      }
      
      try {
          // Prepare assignment data with payment information
          const assignmentData = {
              staffId: selectedStaffForAssignment,
              role: selectedRoleForAssignment,
              payment: {
                  type: assignmentPayment.paymentType,
                  hourlyRate: assignmentPayment.hourlyRate,
                  totalHours: assignmentPayment.totalHours,
                  fixedAmount: assignmentPayment.fixedAmount,
                  overtimeRate: assignmentPayment.overtimeRate,
                  overtimeHours: assignmentPayment.overtimeHours,
                  bonus: assignmentPayment.bonus,
                  deductions: assignmentPayment.deductions,
                  transportationAllowance: assignmentPayment.transportationAllowance,
                  mealAllowance: assignmentPayment.mealAllowance,
                  totalPayment: totalPayment,
                  notes: assignmentPayment.notes,
              }
          };
          
          const response = await apiEvents.assignStaff(selectedEvent.id, selectedStaffForAssignment, selectedRoleForAssignment, assignmentData);
          toast.success(`Staff assigned successfully. Total payment: QAR ${totalPayment.toFixed(2)}`);
          
          // Use the response data directly to update the selected event
          if (response && response.data) {
              const transformedEvent = response.data;
              setSelectedEvent(transformedEvent);
              // Also update the event in the events list
              setEvents(prevEvents => 
                  prevEvents.map(e => e.id === selectedEvent.id ? transformedEvent : e)
              );
          }
          
          // Reset form
          setIsAssignStaffModalOpen(false);
          setSelectedStaffForAssignment('');
          setSelectedRoleForAssignment('');
          setAssignmentPayment({
              hourlyRate: 0,
              totalHours: 8,
              paymentType: 'hourly',
              fixedAmount: 0,
              bonus: 0,
              deductions: 0,
              overtimeRate: 0,
              overtimeHours: 0,
              transportationAllowance: 0,
              mealAllowance: 0,
              notes: '',
          });
          
          // Refetch events to ensure everything is in sync
          await fetchEvents();
      } catch (error: any) {
          console.error('Error assigning staff:', error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to assign staff';
          toast.error(errorMessage);
      }
  };

  // Shift Management Handlers
  const handleAddShift = () => {
      if (!selectedEvent) return;
      setSelectedShift({
          date: selectedEvent.date,
          startTime: '08:00',
          endTime: '16:00',
          role: '',
          staff: 1,
          instructions: ''
      });
      setIsShiftModalOpen(true);
  };

  const handleSaveShift = async () => {
      if (!selectedEvent || !selectedShift) return;
      
      if (!selectedShift.startTime || !selectedShift.endTime) {
          toast.warning('Please provide start and end times');
          return;
      }
      
      // For new shifts, staffId is required
      if (!selectedShift.id && !selectedShift.staffId) {
          toast.warning('Please select a staff member for this shift');
          return;
      }
      
      try {
          const shiftDate = selectedShift.date || selectedEvent.date;
          
          // Validate date format
          if (!shiftDate || !shiftDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              toast.error('Invalid date format. Please select a valid date.');
              return;
          }
          
          // Validate time format
          if (!selectedShift.startTime || !selectedShift.startTime.match(/^\d{2}:\d{2}$/)) {
              toast.error('Invalid start time format. Please use HH:mm format.');
              return;
          }
          
          if (!selectedShift.endTime || !selectedShift.endTime.match(/^\d{2}:\d{2}$/)) {
              toast.error('Invalid end time format. Please use HH:mm format.');
              return;
          }
          
          const shiftData: any = {
              eventId: selectedEvent.id,
              eventTitle: selectedEvent.title,
              location: selectedEvent.location,
              date: shiftDate,
              startTime: selectedShift.startTime, // Send as "HH:mm" string
              endTime: selectedShift.endTime, // Send as "HH:mm" string
              status: 'Scheduled',
              instructions: selectedShift.instructions || '',
              wage: selectedShift.wage || 0,
              role: selectedShift.role || 'General Staff',
          };
          
          // Add staffId if provided (required for new shifts)
          if (selectedShift.staffId) {
              shiftData.staffId = selectedShift.staffId;
          }
          
          // Construct API URL directly
          const API_BASE_URL = '/api';
          const token = localStorage.getItem('auth_token');
          
          // If updating existing shift
          if (selectedShift.id && !selectedShift.id.startsWith('shift-')) {
              // For updates, convert to ISO strings
              const startDateTime = new Date(`${shiftDate}T${selectedShift.startTime}`);
              const endDateTime = new Date(`${shiftDate}T${selectedShift.endTime}`);
              
              if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                  toast.error('Invalid date/time combination');
                  return;
              }
              
              const updateData = {
                  ...shiftData,
                  startTime: startDateTime.toISOString(),
                  endTime: endDateTime.toISOString(),
              };
              
              const response = await axios.put(`${API_BASE_URL}/shifts/${selectedShift.id}`, updateData, {
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                  }
              });
              
              toast.success('Shift updated successfully');
              await fetchEventShifts();
          } else {
              // Create new shift - API service will handle date/time combination
              const response = await apiShifts.create(shiftData);
              toast.success('Shift created successfully');
              await fetchEventShifts();
          }
          
          setIsShiftModalOpen(false);
          setSelectedShift(null);
      } catch (error: any) {
          console.error('Error saving shift:', error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to save shift';
          toast.error(errorMessage);
      }
  };
  
  // Fetch shifts for the selected event
  const fetchEventShifts = async () => {
      if (!selectedEvent) return;
      
      try {
          const response = await apiShifts.list({ eventId: selectedEvent.id, limit: 100 });
          if (response && response.data) {
              setSelectedEvent(prev => prev ? {
                  ...prev,
                  shifts: response.data
              } : null);
          }
      } catch (error: any) {
          console.error('Error fetching event shifts:', error);
      }
  };
  
  // Fetch shifts when schedule tab is opened
  useEffect(() => {
      if (eventDetailTab === 'schedule' && selectedEvent) {
          fetchEventShifts();
      }
  }, [eventDetailTab, selectedEvent?.id]);
  
  // Smart Assignment Handlers
  const handleGetRecommendations = async () => {
      if (!selectedEvent) return;
      
      setIsLoadingRecommendations(true);
      try {
          const response = await apiEvents.getRecommendations(selectedEvent.id);
          if (response && response.data) {
              setEventRecommendations(response.data);
              toast.success('AI recommendations loaded');
          }
      } catch (error: any) {
          console.error('Error getting recommendations:', error);
          toast.error('Failed to load recommendations');
      } finally {
          setIsLoadingRecommendations(false);
      }
  };
  
  const handleGetSmartMatches = async (roleName: string) => {
      if (!selectedEvent) return;
      
      setIsLoadingMatches(prev => ({...prev, [roleName]: true}));
      try {
          const response = await apiEvents.getSmartMatches(selectedEvent.id, roleName, 5);
          if (response && response.data) {
              setSmartMatches(prev => ({...prev, [roleName]: response.data}));
          }
      } catch (error: any) {
          console.error('Error getting smart matches:', error);
          toast.error('Failed to load smart matches');
      } finally {
          setIsLoadingMatches(prev => ({...prev, [roleName]: false}));
      }
  };
  
  const handleAutoAssign = async () => {
      if (!selectedEvent) return;
      
      if (!confirm('🤖 Auto-Assign will intelligently match and assign staff to all required roles. Continue?')) {
          return;
      }
      
      setIsAutoAssigning(true);
      try {
          const response = await apiEvents.autoAssign(selectedEvent.id, {
              autoCreateShifts: false,
              notifyStaff: true,
          });
          
          if (response && response.success) {
              toast.success(`✅ Auto-assigned ${response.data?.assigned || 0} staff members!`);
              // Refetch events
              await fetchEvents();
              // Update selected event
              const updatedEvent = events.find(e => e.id === selectedEvent.id);
              if (updatedEvent) {
                  setSelectedEvent(updatedEvent);
              }
              // Clear recommendations
              setEventRecommendations(null);
          }
      } catch (error: any) {
          console.error('Error auto-assigning:', error);
          const errorMessage = error?.response?.data?.error || error?.message || 'Failed to auto-assign staff';
          toast.error(errorMessage);
      } finally {
          setIsAutoAssigning(false);
      }
  };
  
  const handleAutoCreateShifts = async () => {
      if (!selectedEvent) return;
      
      if (!confirm('⚡ Auto-create shifts for all assigned staff? This will create shifts based on the event timeline.')) {
          return;
      }
      
      try {
          const response = await apiEvents.autoCreateShifts(selectedEvent.id, null, true);
          
          if (response && response.success) {
              toast.success(`✅ Created ${response.data?.created || 0} shifts!`);
              // Refresh shifts
              await fetchEventShifts();
          }
      } catch (error: any) {
          console.error('Error auto-creating shifts:', error);
          toast.error('Failed to auto-create shifts');
      }
  };
  
  const handleQuickAssign = async (staffId: string, role: string) => {
      if (!selectedEvent) return;
      
      try {
          await apiEvents.assignStaff(selectedEvent.id, staffId, role);
          toast.success('Staff assigned successfully');
          // Clear smart matches for this role
          setSmartMatches(prev => {
              const updated = {...prev};
              delete updated[role];
              return updated;
          });
          // Refetch events
          await fetchEvents();
          // Update selected event
          const updatedEvent = events.find(e => e.id === selectedEvent.id);
          if (updatedEvent) {
              setSelectedEvent(updatedEvent);
          }
      } catch (error: any) {
          console.error('Error assigning staff:', error);
          toast.error('Failed to assign staff');
      }
  };

  // --- VALIDATION UTILITIES ---
  // Password validation utility
  const validatePassword = (password: string): { valid: boolean; strength: 'weak' | 'medium' | 'strong'; message: string } => {
      if (!password || password.length < 6) {
          return { valid: false, strength: 'weak', message: 'Password must be at least 6 characters' };
      }
      if (password.length < 8) {
          return { valid: true, strength: 'weak', message: 'Password is weak' };
      }
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      const strengthCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
      
      if (strengthCount >= 3 && password.length >= 10) {
          return { valid: true, strength: 'strong', message: 'Password is strong' };
      } else if (strengthCount >= 2) {
          return { valid: true, strength: 'medium', message: 'Password is medium strength' };
      } else {
          return { valid: true, strength: 'weak', message: 'Password is weak' };
      }
  };
  
  // Generate secure random password
  const generateSecurePassword = (): string => {
      const length = 12;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      // Ensure at least one of each type
      password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
      password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
      password += '0123456789'[Math.floor(Math.random() * 10)];
      password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
      // Fill the rest
      for (let i = password.length; i < length; i++) {
          password += charset[Math.floor(Math.random() * charset.length)];
      }
      // Shuffle
      return password.split('').sort(() => Math.random() - 0.5).join('');
  };
  
  // Email validation
  const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
  };
  
  // Phone validation (Qatar format: +974 or 974 or local)
  const validatePhone = (phone: string): boolean => {
      if (!phone) return true; // Phone is optional
      const phoneRegex = /^(\+974|974|0)?[0-9]{8}$/;
      const cleaned = phone.replace(/[\s-]/g, '');
      return phoneRegex.test(cleaned);
  };

  // --- STAFF CRUD & SORTING ---
  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedStaff = useMemo(() => [...staff].sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
  }), [staff, sortConfig]);

  const openStaffModal = (existingStaff?: StaffProfile) => {
      setStaffModalTab('profile');
      if (existingStaff) {
          setEditingStaffId(existingStaff.id);
          // Populate form with all staff data, ensuring all fields are set
          setStaffFormData({
              name: existingStaff.name || '',
              role: existingStaff.role || 'Hostess',
              email: existingStaff.email || '',
              phone: existingStaff.phone || '',
              status: existingStaff.status || 'Available',
              rating: existingStaff.rating || 5,
              imageUrl: existingStaff.imageUrl || 'https://i.pravatar.cc/150',
              documents: existingStaff.documents || [],
              skills: existingStaff.skills || [],
              location: existingStaff.location || 'Doha',
              totalEarnings: existingStaff.totalEarnings || 0,
              joinedDate: existingStaff.joinedDate || new Date().toISOString().split('T')[0],
              completedShifts: existingStaff.completedShifts || 0,
              onTimeRate: existingStaff.onTimeRate || 100,
              certifications: existingStaff.certifications || [],
              xpPoints: existingStaff.xpPoints || 0,
              level: existingStaff.level || 'Bronze',
              feedback: existingStaff.feedback || [],
              nationality: (existingStaff as any).nationality || '',
              dob: (existingStaff as any).dob || '',
              gender: (existingStaff as any).gender || '',
              height: (existingStaff as any).height || '',
              weight: (existingStaff as any).weight || '',
              shirtSize: (existingStaff as any).shirtSize || '',
              languages: (existingStaff as any).languages || [],
          });
      } else {
          setEditingStaffId(null);
          setStaffFormData({ 
              name: '', 
              role: 'Hostess', 
              email: '', 
              phone: '', 
              status: 'Available', 
              rating: 5, 
              imageUrl: 'https://i.pravatar.cc/150', 
              documents: [],
              skills: [],
              location: 'Doha',
              totalEarnings: 0,
              joinedDate: new Date().toISOString().split('T')[0],
              completedShifts: 0,
              onTimeRate: 100,
              certifications: [],
              xpPoints: 0,
              level: 'Bronze',
              feedback: [],
              nationality: '',
              dob: '',
              gender: '',
              height: '',
              weight: '',
              shirtSize: '',
              languages: [],
          });
      }
      setStaffModalOpen(true);
  };

  const handleSaveStaff = async () => {
      // Comprehensive validation
      if (!staffFormData.name || !staffFormData.name.trim()) {
          toast.warning("Full name is required");
          return;
      }
      
      if (!staffFormData.email || !staffFormData.email.trim()) {
          toast.warning("Email address is required");
          return;
      }
      
      if (!validateEmail(staffFormData.email)) {
          toast.warning("Please enter a valid email address");
          return;
      }
      
      if (!staffFormData.phone || !staffFormData.phone.trim()) {
          toast.warning("Phone number is required");
          return;
      }
      
      if (!validatePhone(staffFormData.phone)) {
          toast.warning("Please enter a valid phone number (Qatar format: +974XXXXXXXX or 0XXXXXXXX)");
          return;
      }
      
      // Validate password for new staff
      if (!editingStaffId) {
          const tempPassword = (staffFormData as any).tempPassword || 'TempPassword123!';
          const passwordValidation = validatePassword(tempPassword);
          if (!passwordValidation.valid) {
              toast.warning(passwordValidation.message);
              return;
          }
      }

      try {
          if (editingStaffId) {
              // Prepare update data - exclude fields that shouldn't be updated
              // and ensure all required fields are present
              const updateData: any = {
                  name: staffFormData.name?.trim(),
                  email: staffFormData.email?.trim(),
                  phone: staffFormData.phone?.trim(),
                  role: staffFormData.role,
                  status: staffFormData.status,
                  location: staffFormData.location || 'Doha',
                  imageUrl: staffFormData.imageUrl || 'https://i.pravatar.cc/150',
              };
              
              // Add optional fields if they exist
              if (staffFormData.skills && Array.isArray(staffFormData.skills)) {
                  updateData.skills = staffFormData.skills;
              }
              if (staffFormData.documents && Array.isArray(staffFormData.documents)) {
                  updateData.documents = staffFormData.documents;
              }
              if ((staffFormData as any).certifications && Array.isArray((staffFormData as any).certifications)) {
                  updateData.certifications = (staffFormData as any).certifications.filter((cert: string) => cert && cert.trim());
              }
              if ((staffFormData as any).languages && Array.isArray((staffFormData as any).languages)) {
                  updateData.languages = (staffFormData as any).languages.filter((lang: string) => lang && lang.trim());
              }
              if (staffFormData.feedback && Array.isArray(staffFormData.feedback)) {
                  updateData.feedback = staffFormData.feedback;
              }
              
              // Add additional profile fields - include all fields to allow clearing
              if ((staffFormData as any).nationality !== undefined) {
                  updateData.nationality = (staffFormData as any).nationality ? (staffFormData as any).nationality.trim() : '';
              }
              if ((staffFormData as any).height !== undefined) {
                  updateData.height = (staffFormData as any).height ? (staffFormData as any).height.trim() : '';
              }
              if ((staffFormData as any).weight !== undefined) {
                  updateData.weight = (staffFormData as any).weight ? (staffFormData as any).weight.trim() : '';
              }
              if ((staffFormData as any).shirtSize !== undefined) {
                  updateData.shirtSize = (staffFormData as any).shirtSize ? (staffFormData as any).shirtSize.trim() : '';
              }
              
              // Date fields - only include if they have a value
              if ((staffFormData as any).dob !== undefined && (staffFormData as any).dob) {
                  updateData.dob = (staffFormData as any).dob.trim();
              }
              if ((staffFormData as any).joinedDate !== undefined && (staffFormData as any).joinedDate) {
                  updateData.joinedDate = (staffFormData as any).joinedDate.trim();
              }
              
              // Gender must be 'Male' or 'Female' - only include if it's a valid enum value
              if ((staffFormData as any).gender && ((staffFormData as any).gender === 'Male' || (staffFormData as any).gender === 'Female')) {
                  updateData.gender = (staffFormData as any).gender;
              } else if ((staffFormData as any).gender === '' || (staffFormData as any).gender === null) {
                  // Allow clearing gender by setting to null
                  updateData.gender = null;
              }
              
              // Handle image upload if imageUrl is a data URL
              if (staffFormData.imageUrl && staffFormData.imageUrl.startsWith('data:image/')) {
                  try {
                      const imageResponse = await fetch(staffFormData.imageUrl);
                      const blob = await imageResponse.blob();
                      const imageFile = new File([blob], `staff-${editingStaffId}-${Date.now()}.jpg`, { type: 'image/jpeg' });
                      
                      const formData = new FormData();
                      formData.append('image', imageFile);
                      
                      const uploadResponse = await fetch(`/api/staff/${editingStaffId}/avatar`, {
                          method: 'POST',
                          headers: {
                              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                          },
                          body: formData,
                      });
                      
                      if (uploadResponse.ok) {
                          const uploadResult = await uploadResponse.json();
                          if (uploadResult.success && uploadResult.data?.imageUrl) {
                              updateData.imageUrl = uploadResult.data.imageUrl;
                          }
                      }
                  } catch (uploadError) {
                      console.error('Error uploading image during update:', uploadError);
                      // Continue with update even if image upload fails
                  }
              }
              
              console.log('Updating staff with cleaned data:', updateData);
              const response = await apiStaff.update(editingStaffId, updateData);
              console.log('Update staff response:', response);
              
              // Update with server response (this will override optimistic update)
              if (response && response.data) {
                  const updatedStaff = response.data;
                  setStaff(prevStaff => prevStaff.map(s => 
                      s.id === editingStaffId ? updatedStaff : s
                  ));
                  // Update form data with all fields including additional ones
                  setStaffFormData({
                      ...updatedStaff,
                      nationality: (updatedStaff as any).nationality || '',
                      dob: (updatedStaff as any).dob || '',
                      gender: (updatedStaff as any).gender || '',
                      height: (updatedStaff as any).height || '',
                      weight: (updatedStaff as any).weight || '',
                      shirtSize: (updatedStaff as any).shirtSize || '',
                      languages: (updatedStaff as any).languages || [],
                      certifications: (updatedStaff as any).certifications || [],
                  });
              } else {
                  // If update failed, refetch to get correct data
                  await fetchStaff();
              }
              
              toast.success('Staff updated successfully');
              setStaffModalOpen(false);
          } else {
              console.log('Creating staff with data:', staffFormData);
              
              // Handle image upload for new staff if imageUrl is a data URL
              let finalImageUrl = staffFormData.imageUrl;
              let imageFile: File | null = null;
              
              if (staffFormData.imageUrl && staffFormData.imageUrl.startsWith('data:image/')) {
                  // Convert data URL to file for upload
                  try {
                      const imageResponse = await fetch(staffFormData.imageUrl);
                      const blob = await imageResponse.blob();
                      imageFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
                      finalImageUrl = 'https://i.pravatar.cc/150'; // Temporary, will be updated after upload
                  } catch (error) {
                      console.error('Error converting data URL to file:', error);
                      finalImageUrl = 'https://i.pravatar.cc/150';
                  }
              }
              
              // Prepare create data with all fields
              const createData: any = {
                  name: staffFormData.name?.trim(),
                  email: staffFormData.email?.trim(),
                  phone: staffFormData.phone?.trim(),
                  role: staffFormData.role || 'Hostess',
                  status: staffFormData.status || 'Available',
                  location: staffFormData.location || 'Doha',
                  imageUrl: finalImageUrl,
                  password: (staffFormData as any).tempPassword || 'TempPassword123!',
                  skills: staffFormData.skills || [],
                  documents: staffFormData.documents || [],
                  certifications: (staffFormData as any).certifications || [],
                  languages: (staffFormData as any).languages || [],
                  feedback: staffFormData.feedback || [],
              };
              
              // Add additional profile fields - include all fields even if empty
              createData.nationality = (staffFormData as any).nationality ? (staffFormData as any).nationality.trim() : '';
              createData.height = (staffFormData as any).height ? (staffFormData as any).height.trim() : '';
              createData.weight = (staffFormData as any).weight ? (staffFormData as any).weight.trim() : '';
              createData.shirtSize = (staffFormData as any).shirtSize ? (staffFormData as any).shirtSize.trim() : '';
              
              // Date fields - only include if they have a value
              if ((staffFormData as any).dob && (staffFormData as any).dob.trim()) {
                  createData.dob = (staffFormData as any).dob.trim();
              }
              if ((staffFormData as any).joinedDate && (staffFormData as any).joinedDate.trim()) {
                  createData.joinedDate = (staffFormData as any).joinedDate.trim();
              }
              
              // Gender must be 'Male' or 'Female' - only include if it's a valid enum value
              if ((staffFormData as any).gender && ((staffFormData as any).gender === 'Male' || (staffFormData as any).gender === 'Female')) {
                  createData.gender = (staffFormData as any).gender;
              }
              
              // Languages and certifications - ensure they're arrays and filter empty values
              createData.languages = Array.isArray((staffFormData as any).languages) 
                  ? (staffFormData as any).languages.filter((lang: string) => lang && lang.trim())
                  : [];
              createData.certifications = Array.isArray((staffFormData as any).certifications)
                  ? (staffFormData as any).certifications.filter((cert: string) => cert && cert.trim())
                  : [];
              
              console.log('Creating staff with data:', createData);
              const createResponse = await apiStaff.create(createData);
              console.log('Create staff response:', createResponse);
              
              if (createResponse && createResponse.data) {
                  const newStaffId = createResponse.data.id || createResponse.data._id;
                  
                  // Upload image if we have one
                  if (imageFile && newStaffId) {
                      try {
                          const formData = new FormData();
                          formData.append('image', imageFile);
                          
                          const uploadResponse = await fetch(`/api/staff/${newStaffId}/avatar`, {
                              method: 'POST',
                              headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                              },
                              body: formData,
                          });
                          
                          if (uploadResponse.ok) {
                              const uploadResult = await uploadResponse.json();
                              if (uploadResult.success) {
                                  console.log('Profile image uploaded successfully');
                              }
                          }
                      } catch (uploadError) {
                          console.error('Error uploading image after creation:', uploadError);
                          // Don't fail the whole operation if image upload fails
                      }
                  }
                  
                  // Refetch staff to ensure we have the latest data
                  await fetchStaff();
                  
                  // Reset form
                  setStaffFormData({ 
                      name: '', 
                      role: 'Hostess', 
                      email: '', 
                      phone: '', 
                      status: 'Available', 
                      rating: 5, 
                      imageUrl: 'https://i.pravatar.cc/150', 
                      documents: [],
                      skills: [],
                      location: 'Doha',
                      totalEarnings: 0,
                      joinedDate: new Date().toISOString().split('T')[0],
                      completedShifts: 0,
                      onTimeRate: 100,
                      certifications: [],
                      xpPoints: 0,
                      level: 'Bronze',
                      feedback: [],
                      nationality: '',
                      dob: '',
                      gender: '',
                      height: '',
                      weight: '',
                      shirtSize: '',
                      languages: [],
                      tempPassword: 'TempPassword123!',
                  });
                  
                  toast.success('Staff created successfully');
                  setStaffModalOpen(false);
              } else {
                  throw new Error('Invalid response from server');
              }
          }
          setStaffModalOpen(false);
      } catch (error: any) {
          console.error('Error saving staff:', error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to save staff';
          toast.error(errorMessage);
      }
  };

  const handleDeleteStaff = async (id: string) => {
      const staffMember = staff.find(s => s.id === id);
      const staffName = staffMember?.name || 'this staff member';
      
      if (!confirm(`⚠️ WARNING: Are you sure you want to delete ${staffName}?\n\nThis will permanently delete:\n• Staff profile\n• Associated user account\n• All related data\n\nThis action CANNOT be undone.`)) {
          return;
      }
      
      try {
          console.log('Deleting staff:', id);
              await apiStaff.delete(id);
          
          // Refetch staff to ensure we have the latest data
          await fetchStaff();
          
          // Close modal if the deleted staff was being edited
          if (editingStaffId === id) {
              setStaffModalOpen(false);
              setEditingStaffId(null);
          }
          
              toast.success('Staff deleted successfully');
      } catch (error: any) {
              console.error('Error deleting staff:', error);
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to delete staff';
          toast.error(errorMessage);
      }
  };

  const verifyDocument = async (docId: string) => {
      if (!editingStaffId) return;
      
      try {
          await apiStaff.verifyDocument(editingStaffId, docId, 'Verified');
          await fetchStaff();
          const updatedStaff = staff.find(s => s.id === editingStaffId);
          if (updatedStaff) {
              openStaffModal(updatedStaff);
          }
          toast.success('Document verified successfully');
      } catch (error: any) {
          console.error('Error verifying document:', error);
          toast.error(error?.response?.data?.error || error?.message || 'Failed to verify document');
      }
  };

  // Client CRUD functions
  const openClientModal = (existingClient?: ClientProfile) => {
      setClientModalTab('profile');
      if (existingClient) {
          setEditingClientId(existingClient.id);
          setClientFormData({
              ...existingClient,
              address: (existingClient as any).address || '',
              city: (existingClient as any).city || 'Doha',
              country: (existingClient as any).country || 'Qatar',
              taxId: (existingClient as any).taxId || '',
              website: (existingClient as any).website || '',
              imageUrl: existingClient.imageUrl || '',
          });
      } else {
          setEditingClientId(null);
          setClientFormData({ 
              companyName: '', 
              contactPerson: '', 
              email: '', 
              phone: '', 
              status: 'Active',
              imageUrl: '',
              address: '',
              city: 'Doha',
              country: 'Qatar',
              taxId: '',
              website: '',
          });
      }
      setIsClientModalOpen(true);
  };

  const handleSaveClient = async () => {
     // Comprehensive validation
     if (!clientFormData.companyName || !clientFormData.companyName.trim()) {
         toast.error('Company name is required');
         return;
     }
     
     if (!clientFormData.contactPerson || !clientFormData.contactPerson.trim()) {
         toast.error('Contact person name is required');
         return;
     }
     
     if (!clientFormData.email || !clientFormData.email.trim()) {
         toast.error('Email address is required');
         return;
     }
     
     if (!validateEmail(clientFormData.email)) {
         toast.error('Please enter a valid email address');
         return;
     }
     
     if (clientFormData.phone && !validatePhone(clientFormData.phone)) {
         toast.error('Please enter a valid phone number (Qatar format: +974XXXXXXXX or 0XXXXXXXX)');
         return;
     }
     
     // Validate password for new client
     if (!editingClientId) {
         const tempPassword = clientFormData.tempPassword || 'TempPassword123!';
         const passwordValidation = validatePassword(tempPassword);
         if (!passwordValidation.valid) {
             toast.error(passwordValidation.message);
             return;
         }
     }
     
     try {
         // Handle image upload for new client if imageUrl is a data URL
         let finalImageUrl = clientFormData.imageUrl;
         let imageFile: File | null = null;
         
         if (!editingClientId && clientFormData.imageUrl && clientFormData.imageUrl.startsWith('data:image/')) {
             // Convert data URL to File for upload
             const response = await fetch(clientFormData.imageUrl);
             const blob = await response.blob();
             const fileName = `client-${Date.now()}.${blob.type.split('/')[1]}`;
             imageFile = new File([blob], fileName, { type: blob.type });
         }
         
         if (editingClientId) {
             const response = await apiClients.update(editingClientId, clientFormData);
             if (response.success) {
                 // Upload image if editing and image changed
                 if (imageFile && editingClientId) {
                     try {
                         const formData = new FormData();
                         formData.append('image', imageFile);
                         const uploadResponse = await fetch(`/api/clients/${editingClientId}/avatar`, {
                             method: 'POST',
                             headers: {
                                 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                             },
                             body: formData,
                         });
                         if (uploadResponse.ok) {
                             const result = await uploadResponse.json();
                             if (result.success && result.data?.imageUrl) {
                                 setClientFormData({...clientFormData, imageUrl: result.data.imageUrl});
                             }
                         }
                     } catch (error) {
                         console.error('Error uploading client image:', error);
                     }
                 }
                 await fetchClients();
                 toast.success('Client updated successfully');
                 setIsClientModalOpen(false);
                 setEditingClientId(null);
             }
         } else {
             const createData = { ...clientFormData };
             delete (createData as any).tempPassword; // Remove tempPassword from create data
             
             const response = await apiClients.create(createData);
             if (response.success && response.data) {
                 const newClientId = response.data.id || response.data._id;
                 
                 // Upload image if provided
                 if (imageFile && newClientId) {
                     try {
                         const formData = new FormData();
                         formData.append('image', imageFile);
                         const uploadResponse = await fetch(`/api/clients/${newClientId}/avatar`, {
                             method: 'POST',
                             headers: {
                                 'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                             },
                             body: formData,
                         });
                         if (uploadResponse.ok) {
                             const result = await uploadResponse.json();
                             if (result.success && result.data?.imageUrl) {
                                 setClientFormData({...clientFormData, imageUrl: result.data.imageUrl});
                             }
                         }
                     } catch (error) {
                         console.error('Error uploading client image:', error);
                     }
                 }
                 
                 await fetchClients();
                 toast.success('Client created successfully');
                 setIsClientModalOpen(false);
                 setEditingClientId(null);
                 setClientFormData({ 
                     companyName: '', 
                     contactPerson: '', 
                     email: '', 
                     phone: '', 
                     status: 'Active',
                     imageUrl: '',
                     address: '',
                     city: 'Doha',
                     country: 'Qatar',
                     taxId: '',
                     website: '',
                 });
             }
         }
     } catch (error: any) {
         console.error('Error saving client:', error);
         toast.error(error?.response?.data?.error || error?.message || 'Failed to save client');
     }
  };
  
  const handleDeleteClient = async (id: string) => {
      if (!confirm("Are you sure you want to delete this client?")) return;
      
      try {
          await apiClients.delete(id);
          await fetchClients();
          toast.success('Client deleted successfully');
          if (editingClientId === id) {
              setIsClientModalOpen(false);
              setEditingClientId(null);
          }
      } catch (error: any) {
          console.error('Error deleting client:', error);
          toast.error(error?.response?.data?.error || error?.message || 'Failed to delete client');
      }
  };

  // --- SUPERVISOR CRUD ---
  const openSupervisorModal = (existingSupervisor?: SupervisorProfile) => {
      setSupervisorModalTab('profile');
      if (existingSupervisor) {
          setEditingSupervisorId(existingSupervisor.id);
          setSupervisorFormData({
              ...existingSupervisor,
              department: (existingSupervisor as any).department || '',
              location: (existingSupervisor as any).location || 'Doha',
              specialization: (existingSupervisor as any).specialization || '',
              yearsOfExperience: (existingSupervisor as any).yearsOfExperience || 0,
              certifications: (existingSupervisor as any).certifications || [],
              languages: (existingSupervisor as any).languages || [],
              notes: (existingSupervisor as any).notes || '',
              imageUrl: existingSupervisor.imageUrl || '',
          });
      } else {
          setEditingSupervisorId(null);
          setSupervisorFormData({ 
              name: '', 
              email: '', 
              phone: '', 
              status: 'Active',
              imageUrl: '',
              location: 'Doha',
              department: '',
              specialization: '',
              yearsOfExperience: 0,
              certifications: [],
              languages: [],
              notes: '',
          });
      }
      setIsSupervisorModalOpen(true);
  };

  const handleSaveSupervisor = async () => {
      // Comprehensive validation
      if (!supervisorFormData.name || !supervisorFormData.name.trim()) {
          toast.error('Full name is required');
          return;
      }
      
      if (!supervisorFormData.email || !supervisorFormData.email.trim()) {
          toast.error('Email address is required');
          return;
      }
      
      if (!validateEmail(supervisorFormData.email)) {
          toast.error('Please enter a valid email address');
          return;
      }
      
      if (supervisorFormData.phone && !validatePhone(supervisorFormData.phone)) {
          toast.error('Please enter a valid phone number (Qatar format: +974XXXXXXXX or 0XXXXXXXX)');
          return;
      }
      
      // Validate password for new supervisor
      if (!editingSupervisorId) {
          const tempPassword = supervisorFormData.tempPassword || 'TempPassword123!';
          const passwordValidation = validatePassword(tempPassword);
          if (!passwordValidation.valid) {
              toast.error(passwordValidation.message);
              return;
          }
      }
      
      try {
          // Handle image upload for new supervisor if imageUrl is a data URL
          let finalImageUrl = supervisorFormData.imageUrl;
          let imageFile: File | null = null;
          
          if (!editingSupervisorId && supervisorFormData.imageUrl && supervisorFormData.imageUrl.startsWith('data:image/')) {
              // Convert data URL to File for upload
              const response = await fetch(supervisorFormData.imageUrl);
              const blob = await response.blob();
              const fileName = `supervisor-${Date.now()}.${blob.type.split('/')[1]}`;
              imageFile = new File([blob], fileName, { type: blob.type });
          }
          
          if (editingSupervisorId) {
              const response = await apiSupervisors.update(editingSupervisorId, supervisorFormData);
              if (response.success) {
                  // Upload image if editing and image changed
                  if (imageFile && editingSupervisorId) {
                      try {
                          const formData = new FormData();
                          formData.append('image', imageFile);
                          const uploadResponse = await fetch(`/api/supervisors/${editingSupervisorId}/avatar`, {
                              method: 'POST',
                              headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                              },
                              body: formData,
                          });
                          if (uploadResponse.ok) {
                              const result = await uploadResponse.json();
                              if (result.success && result.data?.imageUrl) {
                                  setSupervisorFormData({...supervisorFormData, imageUrl: result.data.imageUrl});
                              }
                          }
                      } catch (error) {
                          console.error('Error uploading supervisor image:', error);
                      }
                  }
                  await fetchSupervisors();
                  toast.success('Supervisor updated successfully');
                  setIsSupervisorModalOpen(false);
                  setEditingSupervisorId(null);
              }
          } else {
              const createData = { ...supervisorFormData };
              delete (createData as any).tempPassword; // Remove tempPassword from create data
              
              const response = await apiSupervisors.create(createData);
              if (response.success && response.data) {
                  const newSupervisorId = response.data.id || response.data._id;
                  
                  // Upload image if provided
                  if (imageFile && newSupervisorId) {
                      try {
                          const formData = new FormData();
                          formData.append('image', imageFile);
                          const uploadResponse = await fetch(`/api/supervisors/${newSupervisorId}/avatar`, {
                              method: 'POST',
                              headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                              },
                              body: formData,
                          });
                          if (uploadResponse.ok) {
                              const result = await uploadResponse.json();
                              if (result.success && result.data?.imageUrl) {
                                  setSupervisorFormData({...supervisorFormData, imageUrl: result.data.imageUrl});
                              }
                          }
                      } catch (error) {
                          console.error('Error uploading supervisor image:', error);
                      }
                  }
                  
                  await fetchSupervisors();
                  toast.success('Supervisor created successfully');
                  setIsSupervisorModalOpen(false);
                  setEditingSupervisorId(null);
                  setSupervisorFormData({ 
                      name: '', 
                      email: '', 
                      phone: '', 
                      status: 'Active',
                      imageUrl: '',
                      location: 'Doha',
                      department: '',
                      specialization: '',
                      yearsOfExperience: 0,
                      certifications: [],
                      languages: [],
                      notes: '',
                  });
              }
          }
      } catch (error: any) {
          console.error('Error saving supervisor:', error);
          toast.error(error?.response?.data?.error || error?.message || 'Failed to save supervisor');
      }
  };

  const handleDeleteSupervisor = async (id: string) => {
      const supervisor = supervisors.find(s => s.id === id);
      const supervisorName = supervisor?.name || 'this supervisor';
      if (!confirm(`⚠️ WARNING: Are you sure you want to delete ${supervisorName}?\n\nThis will permanently delete:\n• Supervisor profile\n• Associated user account\n• All related data\n\nThis action CANNOT be undone.`)) return;
       
       try {
           await apiSupervisors.delete(id);
           await fetchSupervisors();
           toast.success('Supervisor deleted successfully');
           if (editingSupervisorId === id) {
               setIsSupervisorModalOpen(false);
               setEditingSupervisorId(null);
           }
       } catch (error: any) {
           console.error('Error deleting supervisor:', error);
           toast.error(error?.response?.data?.error || error?.message || 'Failed to delete supervisor');
       }
  };


  // Calculate detailed metrics for dashboard
  const dashboardMetrics = useMemo(() => {
    const totalRevenue = events.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
    
    // Map backend statuses correctly: APPROVED -> Upcoming, LIVE -> Live, COMPLETED -> Completed
    const activeEvents = events.filter(e => {
      const status = e.status || '';
      return status === 'Upcoming' || status === 'Live' || status === 'APPROVED' || status === 'LIVE';
    }).length;
    const liveEvents = events.filter(e => {
      const status = e.status || '';
      return status === 'Live' || status === 'LIVE';
    }).length;
    const upcomingEvents = events.filter(e => {
      const status = e.status || '';
      return status === 'Upcoming' || status === 'APPROVED' || status === 'Pending' || status === 'PENDING';
    }).length;
    const completedEvents = events.filter(e => {
      const status = e.status || '';
      return status === 'Completed' || status === 'COMPLETED';
    }).length;
    const totalStaff = staff.length;
    const availableStaff = staff.filter(s => s.status === 'Available').length;
    const onShiftStaff = staff.filter(s => s.status === 'On Shift').length;
    const pendingApps = applications.filter(a => a.status === 'Pending').length;
    const approvedApps = applications.filter(a => a.status === 'Approved').length;
    
    // Calculate revenue trend (compare last period to previous period)
    const recentEvents = events.filter(e => {
      const eventDate = new Date(e.date || e.startAt || '');
      if (isNaN(eventDate.getTime())) return false;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return eventDate >= thirtyDaysAgo;
    });
    const previousEvents = events.filter(e => {
      const eventDate = new Date(e.date || e.startAt || '');
      if (isNaN(eventDate.getTime())) return false;
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return eventDate >= sixtyDaysAgo && eventDate < thirtyDaysAgo;
    });
    const recentRevenue = recentEvents.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
    const previousRevenue = previousEvents.reduce((sum, e) => sum + calculateEventRevenue(e), 0);
    const revenueChange = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100) : (recentRevenue > 0 ? 100 : 0);
    
    return {
      totalRevenue,
      activeEvents,
      liveEvents,
      upcomingEvents,
      completedEvents,
      totalStaff,
      availableStaff,
      onShiftStaff,
      pendingApps,
      approvedApps,
      revenueChange,
    };
  }, [events, staff, applications]);

  // --- DASHBOARD RENDERER ---
  const renderDashboard = () => {
    return (
      <DashboardSection
        dashboardMetrics={dashboardMetrics}
        events={events}
        staff={staff}
        applications={applications}
        incidents={incidents}
        logs={logs}
        revenueChartData={revenueChartData}
        eventsByStatusData={eventsByStatusData}
        staffByRoleData={staffByRoleData}
        analyticsPeriod={analyticsPeriod}
        COLORS={COLORS}
        setAnalyticsPeriod={setAnalyticsPeriod}
        setActiveTab={setActiveTab}
        setIsForecastOpen={setIsForecastOpen}
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    );
  };

  return (
    <EnhancedErrorBoundary>
      <React.Fragment>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col md:flex-row">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        {(isSidebarOpen || isDesktop) && (
          <AnimatePresence>
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              applications={applications}
              bookings={bookings}
              user={user}
              onLogout={onLogout}
            />
          </AnimatePresence>
        )}

        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header
            activeTab={activeTab}
            setIsSidebarOpen={setIsSidebarOpen}
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            setShowSearchModal={setShowSearchModal}
            notifications={notifications}
            setIsNotificationsOpen={setIsNotificationsOpen}
            toast={toast}
          />

          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-50 pb-20 sm:pb-6">
              {selectedEvent ? (
                <div className="animate-fadeIn space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                          <Button variant="ghost" onClick={() => { setSelectedEvent(null); setActiveTab('events'); }}><ArrowLeft size={18} className="mr-2" /> Back</Button>
                          <h1 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h1>
                          <Badge status={selectedEvent.status} className="text-sm px-3 py-1" />
                      </div>

                      <div className="flex gap-2 sm:gap-4 border-b border-gray-200 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-hide">
                          {['Overview', 'Roster', 'Schedule'].map(tab => (
                              <button 
                                key={tab}
                                onClick={() => setEventDetailTab(tab.toLowerCase() as any)}
                                className={`px-3 sm:px-4 py-2 sm:py-3 font-bold text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap touch-manipulation ${eventDetailTab === tab.toLowerCase() ? 'border-qatar text-qatar' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                              >
                                  {tab}
                              </button>
                          ))}
                      </div>

                      {eventDetailTab === 'overview' && (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <Card className="lg:col-span-2 p-6 space-y-4">
                                  <div className="grid grid-cols-2 gap-6">
                                      <Input label="Event Title" value={eventFormData.title || selectedEvent?.title || ''} onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})} />
                                      <Input label="Location" value={eventFormData.location || selectedEvent?.location || ''} onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})} />
                                      <Input label="Date" type="date" value={eventFormData.date || selectedEvent?.date || ''} onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})} />
                                      <Select label="Status" options={[{value: 'Upcoming', label: 'Upcoming'}, {value: 'Live', label: 'Live'}, {value: 'Completed', label: 'Completed'}]} value={eventFormData.status || selectedEvent?.status || 'Upcoming'} onChange={(e) => setEventFormData({...eventFormData, status: e.target.value as any})} />
                                  </div>
                                  <div className="pt-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                      <textarea className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3" rows={4} value={eventFormData.description || selectedEvent?.description || ''} onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})} />
                                  </div>
                                  <div className="flex gap-3 justify-end">
                                      <Button variant="danger" onClick={handleDeleteEvent}><Trash2 size={18} className="mr-2" /> Delete Event</Button>
                                      <Button onClick={handleUpdateEvent}><Save size={18} className="mr-2" /> Save Changes</Button>
                                  </div>
                              </Card>
                              <div className="space-y-6">
                                  <Card className="p-6">
                                      <h4 className="font-bold text-gray-900 mb-4">Staffing Progress</h4>
                                      <div className="space-y-4">
                                          {selectedEvent.roles?.map((role, i) => (
                                              <ProgressBar key={i} value={role.filled} max={role.count} label={role.roleName} />
                                          ))}
                                      </div>
                                  </Card>
                              </div>
                          </div>
                      )}


                      {eventDetailTab === 'roster' && (
                          <div className="space-y-6">
                          {eventRecommendations && (
                              <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                                  <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                          <BrainCircuit className="w-5 h-5 text-indigo-600" />
                                          <h3 className="font-bold text-gray-900">AI Recommendations</h3>
                                      </div>
                                      <button onClick={() => setEventRecommendations(null)} className="text-gray-400 hover:text-gray-600">
                                          <X size={18} />
                                      </button>
                                  </div>
                                  
                                  {eventRecommendations.staffing && eventRecommendations.staffing.length > 0 && (
                                      <div className="mb-4">
                                          <p className="text-sm text-gray-700 mb-2 font-bold">Staffing Suggestions:</p>
                                          <div className="space-y-2">
                                              {eventRecommendations.staffing.map((rec: any, idx: number) => (
                                                  <div key={idx} className="bg-white p-3 rounded-lg border border-indigo-100">
                                                      <div className="flex justify-between items-center mb-2">
                                                          <span className="text-sm font-bold text-gray-900">{rec.role}</span>
                                                          <span className="text-xs text-gray-500">{rec.current} / {rec.current + rec.needed} assigned</span>
                                                      </div>
                                                      {rec.suggested && rec.suggested.length > 0 && (
                                                          <div className="flex flex-wrap gap-2 mt-2">
                                                              {rec.suggested.slice(0, 3).map((suggestion: any, sidx: number) => (
                                                                  <div key={sidx} className="flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded text-xs">
                                                                      <span className="font-bold text-gray-900">{suggestion.name}</span>
                                                                      <Badge status="Verified" className="bg-emerald-100 text-emerald-700 text-[10px] px-1">
                                                                          {suggestion.matchScore}% match
                                                                      </Badge>
                                                                  </div>
                                                              ))}
                                                          </div>
                                                      )}
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  
                                  {eventRecommendations.warnings && eventRecommendations.warnings.length > 0 && (
                                      <div className="mb-4">
                                          {eventRecommendations.warnings.map((warning: any, idx: number) => (
                                              <div key={idx} className="bg-amber-50 border border-amber-200 p-3 rounded-lg mb-2">
                                                  <p className="text-xs text-amber-800">{warning.message}</p>
                                              </div>
                                          ))}
                                      </div>
                                  )}
                                  
                                  <div className="flex gap-2">
                                      <Button 
                                          size="sm" 
                                          onClick={handleAutoAssign}
                                          disabled={isAutoAssigning}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                      >
                                          {isAutoAssigning ? (
                                              <>
                                                  <Loader2 size={14} className="mr-2 animate-spin" /> Auto-Assigning...
                                              </>
                                          ) : (
                                              <>
                                                  <Sparkles size={14} className="mr-2" /> Auto-Assign All
                                              </>
                                          )}
                                      </Button>
                                      {eventRecommendations.scheduling && eventRecommendations.scheduling.length > 0 && (
                                          <Button 
                                              size="sm" 
                                              variant="outline"
                                              onClick={handleAutoCreateShifts}
                                              className="border-indigo-300 text-indigo-700"
                                          >
                                              <Zap size={14} className="mr-2" /> Auto-Create Shifts
                                          </Button>
                                      )}
                                  </div>
                              </Card>
                          )}
                          
                          <Card className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h3 className="font-bold text-gray-900">Event Roster</h3>
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={handleGetRecommendations}
                                        disabled={isLoadingRecommendations}
                                    >
                                        {isLoadingRecommendations ? (
                                            <Loader2 size={14} className="mr-2 animate-spin" />
                                        ) : (
                                            <BrainCircuit size={14} className="mr-2" />
                                        )}
                                        Get AI Recommendations
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        onClick={() => {
                                            if (!selectedEvent) return;
                                            setIsAssignStaffModalOpen(true);
                                        }}
                                    >
                                        <UserPlus size={16} className="mr-2" /> Assign Staff
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {selectedEvent.roles?.map((role, i) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="font-bold text-gray-700">{role.roleName}</span>
                                            <span className="text-sm text-gray-500">{role.filled} / {role.count}</span>
                                        </div>
                                        <ProgressBar value={role.filled} max={role.count} showValue={false} height="h-2" />
                                    </div>
                                ))}
                            </div>
                            <h4 className="font-bold text-gray-900 mb-4">Assigned Team</h4>
                            {(() => {
                                // Get assignments from the event (from API response)
                                const eventAssignments = (selectedEvent as any).assignments || [];
                                const hasAssignments = eventAssignments.length > 0 || (selectedEvent.roles && selectedEvent.roles.some(r => r.filled > 0));
                                
                                if (!hasAssignments) {
                                    return (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                            <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500 mb-2">No staff assigned yet</p>
                                            <p className="text-xs text-gray-400">Click "Assign Staff" to start building your team</p>
                                        </div>
                                    );
                                }
                                
                                // Group assignments by role
                                const assignmentsByRole: Record<string, any[]> = {};
                                eventAssignments.forEach((assignment: any) => {
                                    const role = assignment.role || 'General Staff';
                                    if (!assignmentsByRole[role]) {
                                        assignmentsByRole[role] = [];
                                    }
                                    assignmentsByRole[role].push(assignment);
                                });
                                
                                return (
                                    <div className="space-y-3">
                                        {Object.entries(assignmentsByRole).map(([roleName, roleAssignments]) => {
                                            const roleInfo = selectedEvent.roles?.find(r => r.roleName === roleName);
                                            const filled = roleAssignments.length;
                                            const count = roleInfo?.count || filled;
                                            
                                            return (
                                                <div key={roleName} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                    <p className="text-sm font-bold text-gray-700 mb-2">{roleName} ({filled} / {count})</p>
                                                    <div className="space-y-2">
                                                        {roleAssignments.map((assignment: any) => {
                                                            const staffMember = assignment.staffId;
                                                            const staffData = typeof staffMember === 'object' && staffMember ? staffMember : 
                                                                             staff.find(s => s.id === (typeof staffMember === 'string' ? staffMember : staffMember?._id || staffMember?.id));
                                                            
                                                            if (!staffData) return null;
                                                            
                                                            return (
                                                                <div key={assignment._id || assignment.id || staffData.id} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded-lg">
                                                                    <div className="flex items-center gap-2">
                                                                        <img 
                                                                            src={staffData.imageUrl || (typeof staffMember === 'object' && staffMember?.imageUrl) || 'https://i.pravatar.cc/150'} 
                                                                            className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                                                                            alt="" 
                                                                        />
                                                                        <div>
                                                                            <p className="font-bold text-xs text-gray-900">
                                                                                {staffData.name || (typeof staffMember === 'object' && staffMember?.name) || 'Unknown'}
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-500">
                                                                                {assignment.role || roleName}
                                                                                {assignment.status && assignment.status !== 'APPROVED' && (
                                                                                    <span className="ml-1 text-amber-600">({assignment.status})</span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge 
                                                                        status={assignment.status === 'APPROVED' ? 'Verified' : 'Pending'} 
                                                                        className={`text-[10px] ${
                                                                            assignment.status === 'APPROVED' 
                                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                                                        }`} 
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                          </Card>
                          </div>
                      )}

                      {eventDetailTab === 'schedule' && (
                          <Card className="p-6">
                              <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-900">Shift Schedule</h3>
                                <Button 
                                    size="sm" 
                                    onClick={handleAddShift}
                                >
                                    <Plus size={16} className="mr-2" /> Add Shift
                                </Button>
                            </div>
                            {selectedEvent.shifts && selectedEvent.shifts.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedEvent.shifts.map((shift, i) => (
                                        <div key={shift.id || i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                                <Clock size={20} className="text-qatar" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900">{shift.startTime} - {shift.endTime}</p>
                                                <p className="text-sm text-gray-500">{shift.date}</p>
                                                {shift.instructions && (
                                                    <p className="text-xs text-gray-400 mt-1">{shift.instructions}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <Badge status={shift.status || 'Scheduled'} className="mb-2" />
                                                <button 
                                                    className="text-xs text-qatar font-bold hover:underline"
                                                    onClick={() => {
                                                        setSelectedShift(shift);
                                                        setIsShiftModalOpen(true);
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Shifts Scheduled</h3>
                                    <p className="text-sm text-gray-500 mb-4">Create shifts to organize your event timeline and staff assignments.</p>
                                    <Button onClick={handleAddShift} size="sm">
                                        <Plus size={16} className="mr-2" /> Create First Shift
                                    </Button>
                                </div>
                            )}
                          </Card>
                      )}
                  </div>
              ) : (
                  <React.Fragment>
                      {activeTab === 'dashboard' && renderDashboard()}
                      
                      {activeTab === 'events' && !selectedEvent && (
                        <EventsSection
                          events={events}
                          isLoadingEvents={isLoadingEvents}
                          fetchEvents={fetchEvents}
                          globalSearch={globalSearch}
                          filterState={filterState}
                          setEventFormData={setEventFormData}
                          setSelectedEvent={setSelectedEvent}
                          setEventModalOpen={setEventModalOpen}
                        />
                      )}

                      {activeTab === 'staff' && (
                        <StaffSection
                          staff={staff}
                          isLoadingStaff={isLoadingStaff}
                          staffSearch={staffSearch}
                          setStaffSearch={setStaffSearch}
                          staffRoleFilter={staffRoleFilter}
                          setStaffRoleFilter={setStaffRoleFilter}
                          debouncedStaffSearch={debouncedStaffSearch}
                          sortConfig={sortConfig}
                          handleSort={handleSort}
                          sortedStaff={sortedStaff}
                          selectedStaffIds={selectedStaffIds}
                          setSelectedStaffIds={setSelectedStaffIds}
                          openStaffModal={openStaffModal}
                          handleDeleteStaff={handleDeleteStaff}
                        />
                      )}

                      {activeTab === 'applications' && (
                        <ApplicationsSection
                          applications={applications}
                          isLoadingApplications={isLoadingApplications}
                          appSearch={appSearch}
                          setAppSearch={setAppSearch}
                          appStatusFilter={appStatusFilter}
                          setAppStatusFilter={setAppStatusFilter}
                          debouncedAppSearch={debouncedAppSearch}
                          exportAllApplicationsToPDF={exportAllApplicationsToPDF}
                          exportToCSV={exportToCSV}
                          setSelectedApp={setSelectedApp}
                          setAppModalOpen={setAppModalOpen}
                        />
                      )}

                      {activeTab === 'bookings' && (
                        <BookingsSection
                          bookings={bookings}
                          isLoadingBookings={isLoadingBookings}
                          bookingSearch={bookingSearch}
                          setBookingSearch={setBookingSearch}
                          bookingStatusFilter={bookingStatusFilter}
                          setBookingStatusFilter={setBookingStatusFilter}
                          handleBookingDecision={handleBookingDecision}
                          setSelectedBooking={setSelectedBooking}
                          setIsBookingModalOpen={setIsBookingModalOpen}
                        />
                      )}


                      {activeTab === 'clients' && (
                          <ClientsSection
                            clients={clients}
                            isLoadingClients={isLoadingClients}
                            onRefresh={fetchClients}
                            onAddClient={() => openClientModal()}
                            onEditClient={(client) => openClientModal(client)}
                            onDeleteClient={handleDeleteClient}
                          />
                      )}

                      {false && activeTab === 'clients_old' && (
                          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                                  <div>
                                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Client Management</h2>
                                      <p className="text-sm text-gray-500 mt-1">
                                          {clients.length} total clients • {' '}
                                          {clients.filter(c => c.status === 'Active').length} active • {' '}
                                          {clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0)} total events
                                      </p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                      <Button 
                                          variant="outline" 
                                          onClick={fetchClients} 
                                          disabled={isLoadingClients}
                                          className="w-full sm:w-auto touch-manipulation"
                                      >
                                          <RefreshCw size={18} className={`mr-2 ${isLoadingClients ? 'animate-spin' : ''}`} /> 
                                          Refresh
                                      </Button>
                                      <Button onClick={() => openClientModal()} className="w-full sm:w-auto touch-manipulation">
                                          <Plus size={18} className="mr-2" /> Add Client
                                      </Button>
                                  </div>
                              </div>
                              
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Total Clients</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{clients.length}</p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{clients.filter(c => c.status === 'Active').length} active</p>
                                  </Card>
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">{t('admin.totalEventsMetric')}</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0)}</p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{t('admin.acrossAllClients')}</p>
                                  </Card>
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">{t('admin.totalRevenueMetric')}</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                          QAR {clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">From all clients</p>
                                  </Card>
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Avg. Events</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                          {clients.length > 0 ? (clients.reduce((sum, c) => sum + (c.totalEvents || 0), 0) / clients.length).toFixed(1) : '0'}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Per client</p>
                                  </Card>
                              </div>
                              
                              
                              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                  <div className="relative flex-1">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:w-[18px] sm:h-[18px]" size={16} />
                                      <input 
                                          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none transition-all text-sm sm:text-base" 
                                          placeholder={t('admin.searchByCompanyContact')} 
                                          value={clientSearch || ''}
                                          onChange={(e) => setClientSearch(e.target.value)}
                                      />
                                  </div>
                                  <select 
                                      className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar transition-all text-sm sm:text-base w-full sm:w-auto touch-manipulation"
                                      value={clientStatusFilter || 'All'}
                                      onChange={(e) => setClientStatusFilter(e.target.value)}
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
                              ) : clients.length === 0 ? (
                                  <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                      <p className="text-gray-500 mb-4">{t('admin.noClientsFound')}</p>
                                      <Button onClick={() => openClientModal()}>{t('admin.addFirstClient')}</Button>
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
                                          {clients
                                              .filter((c: any) => {
                                                  const searchLower = (clientSearch || '').toLowerCase();
                                                  return (
                                                      (c.companyName?.toLowerCase().includes(searchLower) || 
                                                       c.contactPerson?.toLowerCase().includes(searchLower) ||
                                                       c.email?.toLowerCase().includes(searchLower) ||
                                                       c.phone?.toLowerCase().includes(searchLower) ||
                                                       c.city?.toLowerCase().includes(searchLower) ||
                                                       c.industry?.toLowerCase().includes(searchLower)) &&
                                                      (clientStatusFilter === 'All' || c.status === clientStatusFilter)
                                                  );
                                              })
                                              .map((c: any) => (
                                              <tr key={c.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => openClientModal(c)}>
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
                                                              <p className="font-bold text-sm text-gray-900 group-hover:text-qatar transition-colors truncate" title={c.companyName || 'Unknown'}>{c.companyName || 'Unknown'}</p>
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
                                                              <span className="text-gray-500">Events:</span>
                                                              <span className="font-bold text-gray-900">{c.totalEvents || 0}</span>
                                                          </div>
                                                          <div className="flex items-center gap-1">
                                                              <span className="text-gray-500">Revenue:</span>
                                                              <span className="font-bold text-emerald-600">QAR {(c.totalSpent || 0).toLocaleString()}</span>
                                                          </div>
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <Badge status={c.status} />
                                                  </td>
                                                  <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                                      <button 
                                                          onClick={() => openClientModal(c)} 
                                                          className="p-2 text-gray-400 hover:text-qatar hover:bg-qatar-50 rounded-lg transition-colors touch-manipulation"
                                                          title="Edit Client"
                                                          aria-label="Edit client"
                                                      >
                                                          <Edit size={16} />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleDeleteClient(c.id)} 
                                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                                                          title="Delete Client"
                                                          aria-label="Delete client"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </td>
                                              </tr>
                                          ))}
                                          {clients.filter((c: any) => {
                                              const searchLower = (clientSearch || '').toLowerCase();
                                              return (
                                                  (c.companyName?.toLowerCase().includes(searchLower) || 
                                                   c.contactPerson?.toLowerCase().includes(searchLower) ||
                                                   c.email?.toLowerCase().includes(searchLower) ||
                                                   c.phone?.toLowerCase().includes(searchLower)) &&
                                                  (clientStatusFilter === 'All' || c.status === clientStatusFilter)
                                              );
                                          }).length === 0 && (
                                              <tr>
                                                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                                      <div className="flex flex-col items-center gap-3">
                                                          <Briefcase className="w-12 h-12 text-gray-300" />
                                                          <p>No clients match your search criteria.</p>
                                                          {clientSearch && (
                                                              <Button 
                                                                  size="sm" 
                                                                  variant="outline"
                                                                  onClick={() => {
                                                                      setClientSearch('');
                                                                      setClientStatusFilter('All');
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
                              
                              
                              <div className="md:hidden space-y-3">
                                  {clients
                                      .filter((c: any) => {
                                          const searchLower = (clientSearch || '').toLowerCase();
                                          return (
                                              (c.companyName?.toLowerCase().includes(searchLower) || 
                                               c.contactPerson?.toLowerCase().includes(searchLower) ||
                                               c.email?.toLowerCase().includes(searchLower) ||
                                               c.phone?.toLowerCase().includes(searchLower)) &&
                                              (clientStatusFilter === 'All' || c.status === clientStatusFilter)
                                          );
                                      })
                                      .map((c: any) => (
                                          <Card 
                                              key={c.id} 
                                              className="p-4"
                                              onClick={() => openClientModal(c)}
                                          >
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
                                                              <p className="text-[10px] text-gray-500">Events</p>
                                                              <p className="text-sm font-bold text-gray-900">{c.totalEvents || 0}</p>
                                                          </div>
                                                          <div className="text-center">
                                                              <p className="text-[10px] text-gray-500">Revenue</p>
                                                              <p className="text-xs font-bold text-emerald-600">QAR {(c.totalSpent || 0).toLocaleString()}</p>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </Card>
                                      ))}
                                  {clients.filter((c: any) => {
                                      const searchLower = (clientSearch || '').toLowerCase();
                                      return (
                                          (c.companyName?.toLowerCase().includes(searchLower) || 
                                           c.contactPerson?.toLowerCase().includes(searchLower) ||
                                           c.email?.toLowerCase().includes(searchLower) ||
                                           c.phone?.toLowerCase().includes(searchLower)) &&
                                          (clientStatusFilter === 'All' || c.status === clientStatusFilter)
                                      );
                                  }).length === 0 && (
                                      <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                                          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                          <p className="text-gray-500 mb-3">No clients match your search criteria.</p>
                                          {clientSearch && (
                                              <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => {
                                                      setClientSearch('');
                                                      setClientStatusFilter('All');
                                                  }}
                                              >
                                                  Clear Filters
                                              </Button>
                                          )}
                                      </div>
                                  )}
                              </div>
                              </>
                              )}
                          </div>
                      )}

                      {activeTab === 'supervisors' && (
                          <SupervisorsSection
                            supervisors={supervisors}
                            isLoadingSupervisors={isLoadingSupervisors}
                            onRefresh={fetchSupervisors}
                            onAddSupervisor={() => openSupervisorModal()}
                            onEditSupervisor={(supervisor) => openSupervisorModal(supervisor)}
                            onDeleteSupervisor={handleDeleteSupervisor}
                          />
                      )}

                      {false && activeTab === 'supervisors_old' && (
                          <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                                  <div>
                                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Supervisor Management</h2>
                                      <p className="text-sm text-gray-500 mt-1">
                                          {supervisors.length} total supervisors • {' '}
                                          {supervisors.filter(s => s.status === 'Active').length} active • {' '}
                                          {supervisors.reduce((sum, s) => sum + (s.assignedEvents || 0), 0)} events assigned
                                      </p>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                                      <Button 
                                          variant="outline" 
                                          onClick={fetchSupervisors} 
                                          disabled={isLoadingSupervisors}
                                          className="w-full sm:w-auto touch-manipulation"
                                      >
                                          <RefreshCw size={18} className={`mr-2 ${isLoadingSupervisors ? 'animate-spin' : ''}`} /> 
                                          Refresh
                                      </Button>
                                      <Button onClick={() => openSupervisorModal()} className="w-full sm:w-auto touch-manipulation">
                                          <Plus size={18} className="mr-2" /> Add Supervisor
                                      </Button>
                                  </div>
                              </div>
                              
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white border-l-4 border-l-blue-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Total Supervisors</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{supervisors.length}</p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{supervisors.filter(s => s.status === 'Active').length} active</p>
                                  </Card>
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-white border-l-4 border-l-emerald-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Avg. Rating</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                          {supervisors.length > 0 ? (supervisors.reduce((sum, s) => sum + (s.rating || 5), 0) / supervisors.length).toFixed(1) : '5.0'}
                                      </p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                                          {supervisors.filter(s => (s.rating || 5) >= 4.5).length} top performers
                                      </p>
                                  </Card>
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white border-l-4 border-l-purple-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Events Assigned</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{supervisors.reduce((sum, s) => sum + (s.assignedEvents || 0), 0)}</p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Across all supervisors</p>
                                  </Card>
                                  <Card className="p-3 sm:p-4 bg-gradient-to-br from-amber-50 to-white border-l-4 border-l-amber-500">
                                      <p className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">On Leave</p>
                                      <p className="text-xl sm:text-2xl font-extrabold text-gray-900">{supervisors.filter(s => s.status === 'On Leave').length}</p>
                                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Currently unavailable</p>
                                  </Card>
                              </div>
                              
                              
                              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                  <div className="relative flex-1">
                                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 sm:w-[18px] sm:h-[18px]" size={16} />
                                      <input 
                                          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none transition-all text-sm sm:text-base" 
                                          placeholder="Search by name, email, phone, location..." 
                                          value={supervisorSearch || ''}
                                          onChange={(e) => setSupervisorSearch(e.target.value)}
                                      />
                                  </div>
                                  <select 
                                      className="px-3 sm:px-4 py-2.5 sm:py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-qatar/20 focus:border-qatar transition-all text-sm sm:text-base w-full sm:w-auto touch-manipulation"
                                      value={supervisorStatusFilter || 'All'}
                                      onChange={(e) => setSupervisorStatusFilter(e.target.value)}
                                  >
                                      <option value="All">All Status</option>
                                      <option value="Active">Active</option>
                                      <option value="On Leave">On Leave</option>
                                  </select>
                              </div>
                              
                              {isLoadingSupervisors ? (
                                  <div className="space-y-4">
                                      <Skeleton variant="rounded" height={32} width="30%" />
                                      <SkeletonTable rows={8} />
                                  </div>
                              ) : supervisors.length === 0 ? (
                                  <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                      <p className="text-gray-500 mb-4">No supervisors found.</p>
                                      <Button onClick={() => openSupervisorModal()}>Add Your First Supervisor</Button>
                                  </div>
                              ) : (
                              <>
                              
                              <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                  <table className="w-full text-left">
                                      <thead className="bg-slate-50 border-b border-gray-200">
                                          <tr>
                                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Supervisor</th>
                                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department / Location</th>
                                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Performance</th>
                                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {supervisors
                                              .filter((s: any) => {
                                                  const searchLower = (supervisorSearch || '').toLowerCase();
                                                  return (
                                                      (s.name?.toLowerCase().includes(searchLower) || 
                                                       s.email?.toLowerCase().includes(searchLower) ||
                                                       s.phone?.toLowerCase().includes(searchLower) ||
                                                       s.location?.toLowerCase().includes(searchLower) ||
                                                       s.department?.toLowerCase().includes(searchLower) ||
                                                       s.specialization?.toLowerCase().includes(searchLower)) &&
                                                      (supervisorStatusFilter === 'All' || s.status === supervisorStatusFilter)
                                                  );
                                              })
                                              .map((s: any) => (
                                              <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => openSupervisorModal(s)}>
                                                  <td className="px-6 py-4">
                                                      <div className="flex items-center gap-3">
                                                          <img 
                                                              src={s.imageUrl || 'https://i.pravatar.cc/150'} 
                                                              className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0" 
                                                              alt={s.name || 'Supervisor'} 
                                                              onError={(e) => {
                                                                  (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150';
                                                              }}
                                                          />
                                                          <div className="min-w-0">
                                                              <p className="font-bold text-sm text-gray-900 group-hover:text-qatar transition-colors truncate" title={s.name || 'Unknown'}>{s.name || 'Unknown'}</p>
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
                                                              <span className="text-gray-500">Events:</span>
                                                              <span className="font-bold text-gray-900">{s.assignedEvents || 0}</span>
                                                          </div>
                                                          {s.yearsOfExperience > 0 && (
                                                              <div className="flex items-center gap-1">
                                                                  <span className="text-gray-500">Exp:</span>
                                                                  <span className="font-bold text-gray-900">{s.yearsOfExperience} years</span>
                                                              </div>
                                                          )}
                                                      </div>
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <Badge status={s.status} />
                                                  </td>
                                                  <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                                                      <button 
                                                          onClick={() => openSupervisorModal(s)} 
                                                          className="p-2 text-gray-400 hover:text-qatar hover:bg-qatar-50 rounded-lg transition-colors touch-manipulation"
                                                          title="Edit Supervisor"
                                                          aria-label="Edit supervisor"
                                                      >
                                                          <Edit size={16} />
                                                      </button>
                                                      <button 
                                                          onClick={() => handleDeleteSupervisor(s.id)} 
                                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                                                          title="Delete Supervisor"
                                                          aria-label="Delete supervisor"
                                                      >
                                                          <Trash2 size={16} />
                                                      </button>
                                                  </td>
                                              </tr>
                                          ))}
                                          {supervisors.filter((s: any) => {
                                              const searchLower = (supervisorSearch || '').toLowerCase();
                                              return (
                                                  (s.name?.toLowerCase().includes(searchLower) || 
                                                   s.email?.toLowerCase().includes(searchLower) ||
                                                   s.phone?.toLowerCase().includes(searchLower)) &&
                                                  (supervisorStatusFilter === 'All' || s.status === supervisorStatusFilter)
                                              );
                                          }).length === 0 && (
                                              <tr>
                                                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                                                      <div className="flex flex-col items-center gap-3">
                                                          <Shield className="w-12 h-12 text-gray-300" />
                                                          <p>No supervisors match your search criteria.</p>
                                                          {supervisorSearch && (
                                                              <Button 
                                                                  size="sm" 
                                                                  variant="outline"
                                                                  onClick={() => {
                                                                      setSupervisorSearch('');
                                                                      setSupervisorStatusFilter('All');
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
                              
                              
                              <div className="md:hidden space-y-3">
                                  {supervisors
                                      .filter((s: any) => {
                                          const searchLower = (supervisorSearch || '').toLowerCase();
                                          return (
                                              (s.name?.toLowerCase().includes(searchLower) || 
                                               s.email?.toLowerCase().includes(searchLower) ||
                                               s.phone?.toLowerCase().includes(searchLower)) &&
                                              (supervisorStatusFilter === 'All' || s.status === supervisorStatusFilter)
                                          );
                                      })
                                      .map((s: any) => (
                                          <Card 
                                              key={s.id} 
                                              className="p-4"
                                              onClick={() => openSupervisorModal(s)}
                                          >
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
                                                              <p className="text-[10px] text-gray-500">Events</p>
                                                              <p className="text-sm font-bold text-gray-900">{s.assignedEvents || 0}</p>
                                                          </div>
                                                          <div className="text-center">
                                                              <p className="text-[10px] text-gray-500">Experience</p>
                                                              <p className="text-xs font-bold text-gray-900">{s.yearsOfExperience || 0} years</p>
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          </Card>
                                      ))}
                                  {supervisors.filter((s: any) => {
                                      const searchLower = (supervisorSearch || '').toLowerCase();
                                      return (
                                          (s.name?.toLowerCase().includes(searchLower) || 
                                           s.email?.toLowerCase().includes(searchLower) ||
                                           s.phone?.toLowerCase().includes(searchLower)) &&
                                          (supervisorStatusFilter === 'All' || s.status === supervisorStatusFilter)
                                      );
                                  }).length === 0 && (
                                      <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
                                          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                          <p className="text-gray-500 mb-3">No supervisors match your search criteria.</p>
                                          {supervisorSearch && (
                                              <Button 
                                                  size="sm" 
                                                  variant="outline"
                                                  onClick={() => {
                                                      setSupervisorSearch('');
                                                      setSupervisorStatusFilter('All');
                                                  }}
                                              >
                                                  Clear Filters
                                              </Button>
                                          )}
                                      </div>
                                  )}
                              </div>
                              </>
                              )}
                          </div>
                      )}

                      {activeTab === 'logs' && (
                          <LogsSection exportToCSV={exportToCSV} />
                      )}

                      {activeTab === 'settings' && (
                        <SettingsSection
                          settingsTab={settingsTab}
                          setSettingsTab={setSettingsTab}
                          settingsData={settingsData}
                          setSettingsData={setSettingsData}
                          toast={toast}
                        />
                  )}
                </React.Fragment>
              )}
          </main>
        </div>
      </div>
      
      <React.Fragment>
      <Modal isOpen={isEventModalOpen} onClose={() => {
          setEventModalOpen(false);
          // Reset form when closing modal (unless editing an existing event)
          if (!selectedEvent) {
              setEventFormData({ 
                  title: '', 
                  location: '', 
                  date: '', 
                  endDate: '', 
                  description: '', 
                  status: 'Pending', 
                  staffRequired: 10, 
                  revenue: 0, 
                  budget: { 
                      total: 0, 
                      staffingAllocated: 0, 
                      logisticsAllocated: 0, 
                      marketingAllocated: 0, 
                      cateringAllocated: 0, 
                      technologyAllocated: 0, 
                      miscellaneousAllocated: 0, 
                      spent: 0 
                  } 
              });
          }
      }} title={selectedEvent ? "Edit Event" : "Create New Event"}>
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
              
          <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Basic Information</h3>
                  <Input 
                      label="Event Title *" 
                      placeholder="e.g. Qatar Economic Forum" 
                      value={eventFormData.title || ''} 
                      onChange={(e) => setEventFormData({...eventFormData, title: e.target.value})} 
                  />
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                      <textarea 
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none resize-none" 
                          rows={3}
                          placeholder="Event description and details..."
                          value={eventFormData.description || ''} 
                          onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})} 
                      />
                  </div>
              </div>

              
              <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Date & Location</h3>
              <div className="grid grid-cols-2 gap-4">
                      <Input 
                          label="Start Date *" 
                          type="date" 
                          value={eventFormData.date || ''} 
                          onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})} 
                      />
                      <Input 
                          label="End Date" 
                          type="date" 
                          value={eventFormData.endDate || ''} 
                          min={eventFormData.date || ''}
                          onChange={(e) => setEventFormData({...eventFormData, endDate: e.target.value})} 
                      />
              </div>
                  <Input 
                      label="Location *" 
                      placeholder="Venue or Address" 
                      value={eventFormData.location || ''} 
                      onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})} 
                  />
              </div>

              
              <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Status & Requirements</h3>
              <div className="grid grid-cols-2 gap-4">
                      <Select 
                          label="Status" 
                          options={[
                              {value: 'Pending', label: 'Pending'},
                              {value: 'Upcoming', label: 'Upcoming'},
                              {value: 'Live', label: 'Live'},
                              {value: 'Completed', label: 'Completed'},
                              {value: 'Cancelled', label: 'Cancelled'}
                          ]} 
                          value={eventFormData.status || 'Pending'} 
                          onChange={(e) => setEventFormData({...eventFormData, status: e.target.value as any})} 
                      />
                      <Input 
                          label="Staff Required" 
                          type="number" 
                          min="0"
                          value={eventFormData.staffRequired || 0} 
                          onChange={(e) => setEventFormData({...eventFormData, staffRequired: Number(e.target.value)})} 
                      />
              </div>
                  <Input 
                      label="Estimated Revenue (QAR)" 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={eventFormData.revenue || 0} 
                      onChange={(e) => setEventFormData({...eventFormData, revenue: Number(e.target.value)})} 
                  />
                  </div>


              
              <div className="border-t border-gray-100 pt-4">
                  <Button className="w-full" onClick={handleCreateEvent}>
                      {selectedEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                      * Required fields must be filled
                  </p>
              </div>
          </div>
      </Modal>

      
      <Modal isOpen={isStaffModalOpen} onClose={() => {
          setStaffModalOpen(false);
          // Reset form when closing modal (unless editing)
          if (!editingStaffId) {
              setStaffFormData({ 
                  name: '', 
                  role: 'Hostess', 
                  email: '', 
                  phone: '', 
                  status: 'Available', 
                  rating: 5, 
                  imageUrl: 'https://i.pravatar.cc/150',
                  documents: [],
                  skills: [],
                  location: 'Doha',
                  totalEarnings: 0,
                  joinedDate: new Date().toISOString().split('T')[0],
                  completedShifts: 0,
                  onTimeRate: 100,
                  certifications: [],
                  xpPoints: 0,
                  level: 'Bronze',
                  feedback: [],
                  nationality: '',
                  dob: '',
                  gender: '',
                  height: '',
                  weight: '',
                  shirtSize: '',
                  languages: [],
              });
          }
      }} title={editingStaffId ? `Edit ${staffFormData.name || 'Staff'}` : "Add New Staff"}>
          <div className="flex gap-4 mb-6 border-b border-gray-100">
              {['Profile', 'Documents', 'Account Management'].map(tab => (
                  <button 
                      key={tab} 
                      onClick={() => setStaffModalTab(tab === 'Account Management' ? 'account' : tab.toLowerCase() as any)}
                      className={`pb-2 text-sm font-bold transition-colors relative ${staffModalTab === (tab === 'Account Management' ? 'account' : tab.toLowerCase()) ? 'text-qatar' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                      {tab}
                      {staffModalTab === (tab === 'Account Management' ? 'account' : tab.toLowerCase()) && <motion.div layoutId="staffTab" className="absolute bottom-0 left-0 w-full h-0.5 bg-qatar" />}
                  </button>
              ))}
          </div>

          {staffModalTab === 'profile' && (
              <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2 animate-fadeIn">
                  
                  <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Basic Information</h3>
                  <div className="flex justify-center mb-4">
                          <div className="relative group">
                              <img 
                                  src={staffFormData.imageUrl || 'https://i.pravatar.cc/150'} 
                                  className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover" 
                                  alt="Profile" 
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150';
                                  }}
                              />
                              {isUploadingImage && (
                                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                              )}
                              <label className="absolute bottom-0 right-0 bg-qatar text-white p-1.5 rounded-full hover:bg-qatar-light transition-colors cursor-pointer shadow-lg">
                                  <input
                                      type="file"
                                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                      className="hidden"
                                      onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          
                                          // Validate file size (max 5MB)
                                          if (file.size > 5 * 1024 * 1024) {
                                              toast.error('Image size must be less than 5MB');
                                              return;
                                          }
                                          
                                          // Validate file type
                                          if (!file.type.startsWith('image/')) {
                                              toast.error('Please select a valid image file');
                                              return;
                                          }
                                          
                                          setIsUploadingImage(true);
                                          
                                          try {
                                              const formData = new FormData();
                                              formData.append('image', file);
                                              
                                              // If editing existing staff, upload to their profile
                                              if (editingStaffId) {
                                                  const response = await fetch(`/api/staff/${editingStaffId}/avatar`, {
                                                      method: 'POST',
                                                      headers: {
                                                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                                                      },
                                                      body: formData,
                                                  });
                                                  
                                                  if (!response.ok) {
                                                      const error = await response.json();
                                                      throw new Error(error.error || 'Failed to upload image');
                                                  }
                                                  
                                                  const result = await response.json();
                                                  if (result.success && result.data?.imageUrl) {
                                                      setStaffFormData({...staffFormData, imageUrl: result.data.imageUrl});
                                                      toast.success('Profile image uploaded successfully');
                                                  } else {
                                                      throw new Error('Invalid response from server');
                                                  }
                                              } else {
                                                  // For new staff, create a preview URL
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      setStaffFormData({...staffFormData, imageUrl: reader.result as string});
                                                      setIsUploadingImage(false);
                                                  };
                                                  reader.onerror = () => {
                                                      toast.error('Failed to read image file');
                                                      setIsUploadingImage(false);
                                                  };
                                                  reader.readAsDataURL(file);
                                                  return; // Early return, setIsUploadingImage will be called in reader callbacks
                                              }
                                          } catch (error: any) {
                                              console.error('Error uploading image:', error);
                                              toast.error(error?.message || 'Failed to upload image');
                                          } finally {
                                              setIsUploadingImage(false);
                                          }
                                          
                                          // Reset input
                                          e.target.value = '';
                                      }}
                                      disabled={isUploadingImage}
                                  />
                                  <Edit size={12} />
                              </label>
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                  <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-2 w-full">Click the edit icon to upload a new profile image</p>
                      </div>
                      <Input 
                          label="Full Name *" 
                          value={staffFormData.name || ''} 
                          onChange={(e) => setStaffFormData({...staffFormData, name: e.target.value})} 
                      />
                      <Input 
                          label="Phone *" 
                          value={staffFormData.phone || ''} 
                          onChange={(e) => setStaffFormData({...staffFormData, phone: e.target.value})} 
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800 font-medium">
                              <Mail className="inline w-3 h-3 mr-1" /> Email address is managed in the Account Management tab.
                          </p>
                      </div>
                      <Input 
                          label="Location" 
                          value={staffFormData.location || 'Doha'} 
                          onChange={(e) => setStaffFormData({...staffFormData, location: e.target.value})} 
                      />
                  </div>

                  
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Role & Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                          <Select 
                              label="Role *" 
                              options={[
                                  {value: 'General Staff', label: 'General Staff'}, 
                                  {value: 'Hostess', label: 'Hostess'}, 
                                  {value: 'Protocol', label: 'Protocol'},
                                  {value: 'Logistics', label: 'Logistics'},
                                  {value: 'Event Coordinator', label: 'Event Coordinator'}
                              ]} 
                              value={staffFormData.role || 'General Staff'} 
                              onChange={(e) => setStaffFormData({...staffFormData, role: e.target.value})} 
                          />
                          <Select 
                              label="Status *" 
                              options={[
                                  {value: 'Available', label: 'Available'}, 
                                  {value: 'On Shift', label: 'On Shift'}, 
                                  {value: 'Leave', label: 'On Leave'}, 
                                  {value: 'Suspended', label: 'Suspended'}
                              ]} 
                              value={staffFormData.status || 'Available'} 
                              onChange={(e) => setStaffFormData({...staffFormData, status: e.target.value as any})} 
                          />
                  </div>
                      <Input 
                          label="Joined Date" 
                          type="date" 
                          value={staffFormData.joinedDate || new Date().toISOString().split('T')[0]} 
                          onChange={(e) => setStaffFormData({...staffFormData, joinedDate: e.target.value})} 
                      />
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800 font-medium">
                              <Star className="inline w-3 h-3 mr-1" /> Performance metrics (rating, completed shifts, on-time rate) are automatically calculated based on event participation and cannot be manually edited.
                          </p>
                      </div>
                  </div>

                  
                  <div className="space-y-4 border-t border-gray-100 pt-4">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                              label="QID Number" 
                              value={(staffFormData as any).qidNumber || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, qidNumber: e.target.value} as any)} 
                              placeholder="Enter Qatar ID number"
                          />
                          <Input 
                              label="Nationality" 
                              value={(staffFormData as any).nationality || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, nationality: e.target.value} as any)} 
                          />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                              label="Date of Birth" 
                              type="date" 
                              value={(staffFormData as any).dob || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, dob: e.target.value} as any)} 
                          />
                          <Select 
                              label="Gender" 
                              options={[
                                  {value: '', label: 'Not Specified'},
                                  {value: 'Male', label: 'Male'}, 
                                  {value: 'Female', label: 'Female'}
                              ]} 
                              value={(staffFormData as any).gender || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, gender: e.target.value} as any)} 
                          />
                  </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                              label="Shirt Size" 
                              value={(staffFormData as any).shirtSize || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, shirtSize: e.target.value} as any)} 
                          />
                          <Input 
                              label="Languages (comma-separated)" 
                              placeholder="e.g. Arabic, English, French" 
                              value={Array.isArray((staffFormData as any).languages) ? (staffFormData as any).languages.join(', ') : ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, languages: e.target.value.split(',').map(l => l.trim()).filter(l => l)} as any)} 
                          />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input 
                              label="Height" 
                              placeholder="e.g. 170cm" 
                              value={(staffFormData as any).height || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, height: e.target.value} as any)} 
                          />
                          <Input 
                              label="Weight" 
                              placeholder="e.g. 70kg" 
                              value={(staffFormData as any).weight || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, weight: e.target.value} as any)} 
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                              {((staffFormData as any).languages || []).map((lang: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {lang}
                                      <button
                                          type="button"
                                          onClick={() => {
                                              const newLangs = [...((staffFormData as any).languages || [])];
                                              newLangs.splice(idx, 1);
                                              setStaffFormData({...staffFormData, languages: newLangs} as any);
                                          }}
                                          className="hover:text-blue-900"
                                      >
                                          <X size={12} />
                                      </button>
                                  </span>
                              ))}
                          </div>
                          <div className="flex gap-2">
                              <input
                                  type="text"
                                  placeholder="Add language (e.g. English, Arabic)"
                                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none"
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const input = e.target as HTMLInputElement;
                                          const lang = input.value.trim();
                                          if (lang && !((staffFormData as any).languages || []).includes(lang)) {
                                              setStaffFormData({
                                                  ...staffFormData,
                                                  languages: [...((staffFormData as any).languages || []), lang]
                                              } as any);
                                              input.value = '';
                                          }
                                      }
                                  }}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                              {((staffFormData as any).certifications || []).map((cert: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {cert}
                                      <button
                                          type="button"
                                          onClick={() => {
                                              const newCerts = [...((staffFormData as any).certifications || [])];
                                              newCerts.splice(idx, 1);
                                              setStaffFormData({...staffFormData, certifications: newCerts} as any);
                                          }}
                                          className="hover:text-emerald-900"
                                      >
                                          <X size={12} />
                                      </button>
                                  </span>
                              ))}
                          </div>
                          <div className="flex gap-2">
                              <input
                                  type="text"
                                  placeholder="Add certification (e.g. First Aid, CPR)"
                                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none"
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const input = e.target as HTMLInputElement;
                                          const cert = input.value.trim();
                                          if (cert && !((staffFormData as any).certifications || []).includes(cert)) {
                                              setStaffFormData({
                                                  ...staffFormData,
                                                  certifications: [...((staffFormData as any).certifications || []), cert]
                                              } as any);
                                              input.value = '';
                                          }
                                      }
                                  }}
                              />
                          </div>
                      </div>
                  </div>

              </div>
          )}

          {staffModalTab === 'documents' && (
              <div className="space-y-4 animate-fadeIn">
                  {staffFormData.documents && staffFormData.documents.length > 0 ? (
                      staffFormData.documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400 border border-gray-200"><FileText size={20} /></div>
                                  <div>
                                      <p className="font-bold text-sm text-gray-900">{doc.title}</p>
                                      <p className="text-xs text-gray-500">Exp: {doc.expiryDate}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Badge status={doc.status} />
                                  {doc.status === 'Pending' && (
                                      <Button size="sm" variant="outline" className="px-2 py-1 h-8" onClick={() => verifyDocument(doc.id)}>Verify</Button>
                                  )}
                              </div>
                          </div>
                      ))
                  ) : (
                      <p className="text-center text-gray-400 py-8">No documents uploaded yet.</p>
                  )}
                  <Button variant="outline" className="w-full border-dashed border-gray-300 text-gray-500 hover:text-qatar hover:border-qatar"><Upload size={16} className="mr-2" /> Upload Document</Button>
              </div>
          )}

          {staffModalTab === 'account' && (
              <div className="space-y-6 animate-fadeIn pt-2">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
                      <Lock className="text-blue-500 mt-1" size={20} />
                      <div>
                          <h4 className="font-bold text-blue-900">Account Management</h4>
                          <p className="text-sm text-blue-700 mt-1">Manage email and password for this staff member's account.</p>
                      </div>
                      </div>
                  
                  <div className="space-y-4">
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account Credentials</h3>
                          
                          <Input 
                              label="Email Address *" 
                              type="email" 
                              value={staffFormData.email || ''} 
                              onChange={(e) => setStaffFormData({...staffFormData, email: e.target.value})} 
                              placeholder="staff@example.com"
                          />
                          
                          {editingStaffId ? (
                              <>
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                      <p className="text-xs text-amber-800 font-medium">
                                          <Lock className="inline w-3 h-3 mr-1" /> To change the password, use the password reset option below. The staff member will receive an email with reset instructions.
                                      </p>
                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                      <div className="flex-1">
                                          <p className="font-bold text-gray-900">Password Reset</p>
                                          <p className="text-xs text-gray-500 mt-1">Send a password reset link to: <span className="font-medium">{staffFormData.email}</span></p>
                                          </div>
                                      <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={async () => {
                                              if (!staffFormData.email) {
                                                  toast.error('Email address is required');
                                                  return;
                                              }
                                              
                                              try {
                                                  const { auth } = await import('../services/api');
                                                  const response = await auth.forgotPassword(staffFormData.email);
                                                  if (response.success) {
                                                      toast.success(`Password reset link sent to ${staffFormData.email}. The link will expire in 10 minutes.`);
                                                  } else {
                                                      toast.error(response.error || 'Failed to send reset link');
                                                  }
                                              } catch (error: any) {
                                                  console.error('Error sending password reset:', error);
                                                  toast.error(error?.response?.data?.error || error?.message || 'Failed to send reset link');
                                              }
                                          }}
                                          className="touch-manipulation whitespace-nowrap"
                                      >
                                          <Mail size={14} className="mr-2" /> Send Reset Link
                                      </Button>
                                      </div>
                              </>
                          ) : (
                              <div className="space-y-4">
                                  <div className="relative">
                                      <Input 
                                          label="Temporary Password *" 
                                          type={showPassword ? "text" : "password"} 
                                          value={(staffFormData as any).tempPassword || 'TempPassword123!'} 
                                          onChange={(e) => {
                                              const newPassword = e.target.value;
                                              setStaffFormData({...staffFormData, tempPassword: newPassword} as any);
                                              
                                              // Validate password strength in real-time
                                              if (newPassword.length > 0) {
                                                  const validation = validatePassword(newPassword);
                                                  // You could show a strength indicator here
                                              }
                                          }} 
                                          placeholder="Enter temporary password (min 6 characters)"
                                      />
                                      <div className="absolute right-3 top-9 flex items-center gap-2">
                                          <button
                                              type="button"
                                              onClick={() => {
                                                  const newPassword = generateSecurePassword();
                                                  setStaffFormData({...staffFormData, tempPassword: newPassword} as any);
                                                  setShowPassword(true);
                                                  toast.info('Secure password generated');
                                              }}
                                              className="text-gray-400 hover:text-qatar transition-colors touch-manipulation"
                                              title="Generate secure password"
                                              aria-label="Generate password"
                                          >
                                              <Zap size={16} className="w-4 h-4" />
                                          </button>
                                          <button
                                              type="button"
                                              onClick={() => setShowPassword(!showPassword)}
                                              className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                                              aria-label={showPassword ? "Hide password" : "Show password"}
                                          >
                                              {showPassword ? <EyeOff size={18} className="w-4 h-4" /> : <Eye size={18} className="w-4 h-4" />}
                                          </button>
                      </div>
                  </div>
                                  
                                  
                                  {(staffFormData as any).tempPassword && (staffFormData as any).tempPassword.length > 0 && (() => {
                                      const validation = validatePassword((staffFormData as any).tempPassword);
                                      const strengthColors = {
                                          weak: 'bg-red-500',
                                          medium: 'bg-amber-500',
                                          strong: 'bg-emerald-500',
                                      };
                                      return (
                                          <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                      <div 
                                                          className={`h-full transition-all ${strengthColors[validation.strength]}`}
                                                          style={{ width: validation.strength === 'weak' ? '33%' : validation.strength === 'medium' ? '66%' : '100%' }}
                                                      />
                      </div>
                                                  <span className={`text-xs font-bold ${
                                                      validation.strength === 'weak' ? 'text-red-600' : 
                                                      validation.strength === 'medium' ? 'text-amber-600' : 
                                                      'text-emerald-600'
                                                  }`}>
                                                      {validation.strength.toUpperCase()}
                                                  </span>
                  </div>
                                              <p className="text-xs text-gray-500">{validation.message}</p>
                                          </div>
                                      );
                                  })()}
                                  
                                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <p className="text-xs text-blue-800 font-medium">
                                          <Lock className="inline w-3 h-3 mr-1" /> Staff will be required to change this password on first login. Use the generate button for a secure password.
                                      </p>
                          </div>
                      </div>
                          )}
                      </div>
                      
                      <div className="border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-center p-4 border border-gray-100 rounded-xl">
                          <div>
                              <p className="font-bold text-gray-900">Account Status</p>
                                  <p className="text-xs text-gray-500">Current: {staffFormData.status || 'Available'}</p>
                          </div>
                          <Button 
                              size="sm" 
                              variant={staffFormData.status === 'Suspended' ? 'primary' : 'danger'}
                              onClick={() => setStaffFormData({...staffFormData, status: staffFormData.status === 'Suspended' ? 'Available' : 'Suspended'})}
                          >
                                  {staffFormData.status === 'Suspended' ? 'Reactivate Account' : 'Suspend Account'}
                          </Button>
                      </div>
                  </div>
                  </div>
                  
              </div>
          )}
          
          
          <div className="border-t border-gray-100 pt-4 mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
              <Button className="w-full" onClick={handleSaveStaff}>
                  {editingStaffId ? 'Save Staff Changes' : 'Create Staff Member'}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                  * Required fields must be filled
              </p>
          </div>
      </Modal>

      
      <Modal isOpen={isClientModalOpen} onClose={() => {
          setIsClientModalOpen(false);
          if (!editingClientId) {
              setClientFormData({ 
                  companyName: '', 
                  contactPerson: '', 
                  email: '', 
                  phone: '', 
                  status: 'Active',
                  imageUrl: '',
                  address: '',
                  city: 'Doha',
                  country: 'Qatar',
                  taxId: '',
                  website: '',
                  industry: '',
                  companySize: '',
                  notes: '',
              });
          }
      }} title={editingClientId ? "Edit Client" : "Add New Client"}>
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
              
              <div className="flex gap-2 border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <button
                      onClick={() => setClientModalTab('profile')}
                      className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                          clientModalTab === 'profile'
                              ? 'border-qatar text-qatar'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Profile
                  </button>
                  <button
                      onClick={() => setClientModalTab('company')}
                      className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                          clientModalTab === 'company'
                              ? 'border-qatar text-qatar'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Company Info
                  </button>
                  <button
                      onClick={() => setClientModalTab('account')}
                      className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                          clientModalTab === 'account'
                              ? 'border-qatar text-qatar'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Account
                  </button>
              </div>

              {clientModalTab === 'profile' && (
                  <div className="space-y-4 animate-fadeIn">
                      
                      <div className="flex flex-col items-center">
                          <div className="relative">
                              <img 
                                  src={clientFormData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientFormData.companyName || 'Client')}&background=8A1538&color=fff&size=128`} 
                                  className="w-24 h-24 rounded-xl object-cover border-4 border-white shadow-lg" 
                                  alt="Client logo"
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientFormData.companyName || 'Client')}&background=8A1538&color=fff&size=128`;
                                  }}
                              />
                              <label className="absolute bottom-0 right-0 bg-qatar text-white rounded-full p-2 cursor-pointer hover:bg-qatar/90 transition-colors shadow-lg touch-manipulation">
                                  <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          
                                          if (!file.type.startsWith('image/')) {
                                              toast.error('Please select an image file');
                                              return;
                                          }
                                          
                                          if (file.size > 5 * 1024 * 1024) {
                                              toast.error('Image size must be less than 5MB');
                                              return;
                                          }
                                          
                                          setIsUploadingClientImage(true);
                                          
                                          try {
                                              if (editingClientId) {
                                                  const formData = new FormData();
                                                  formData.append('image', file);
                                                  const response = await fetch(`/api/clients/${editingClientId}/avatar`, {
                                                      method: 'POST',
                                                      headers: {
                                                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                                                      },
                                                      body: formData,
                                                  });
                                                  
                                                  if (!response.ok) {
                                                      const error = await response.json();
                                                      throw new Error(error.error || 'Failed to upload image');
                                                  }
                                                  
                                                  const result = await response.json();
                                                  if (result.success && result.data?.imageUrl) {
                                                      setClientFormData({...clientFormData, imageUrl: result.data.imageUrl});
                                                      toast.success('Logo uploaded successfully');
                                                  } else {
                                                      throw new Error('Invalid response from server');
                                                  }
                                              } else {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      setClientFormData({...clientFormData, imageUrl: reader.result as string});
                                                      setIsUploadingClientImage(false);
                                                  };
                                                  reader.onerror = () => {
                                                      toast.error('Failed to read image file');
                                                      setIsUploadingClientImage(false);
                                                  };
                                                  reader.readAsDataURL(file);
                                                  return;
                                              }
                                          } catch (error: any) {
                                              console.error('Error uploading image:', error);
                                              toast.error(error?.message || 'Failed to upload image');
                                          } finally {
                                              setIsUploadingClientImage(false);
                                              e.target.value = '';
                                          }
                                      }}
                                      disabled={isUploadingClientImage}
                                  />
                                  <Upload size={14} />
                              </label>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-2">Click to upload company logo</p>
                      </div>
                      
                      <Input 
                          label="Company Name *" 
                          value={clientFormData.companyName || ''} 
                          onChange={(e) => setClientFormData({...clientFormData, companyName: e.target.value})} 
                          placeholder="e.g. Qatar Events LLC"
                      />
                      <Input 
                          label="Contact Person *" 
                          value={clientFormData.contactPerson || ''} 
                          onChange={(e) => setClientFormData({...clientFormData, contactPerson: e.target.value})} 
                          placeholder="Full name of primary contact"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input 
                              label="Email *" 
                              type="email" 
                              value={clientFormData.email || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})} 
                              placeholder="contact@company.com"
                          />
                          <Input 
                              label="Phone" 
                              value={clientFormData.phone || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})} 
                              placeholder="+974 XXXX XXXX"
                          />
                      </div>
                      <Select 
                          label="Status" 
                          options={[
                              {value: 'Active', label: 'Active'}, 
                              {value: 'Inactive', label: 'Inactive'},
                              {value: 'Suspended', label: 'Suspended'}
                          ]} 
                          value={clientFormData.status || 'Active'} 
                          onChange={(e) => setClientFormData({...clientFormData, status: e.target.value as any})} 
                      />
                  </div>
              )}

              {clientModalTab === 'company' && (
                  <div className="space-y-4 animate-fadeIn">
                      <Input 
                          label="Address" 
                          value={clientFormData.address || ''} 
                          onChange={(e) => setClientFormData({...clientFormData, address: e.target.value})} 
                          placeholder="Street address"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input 
                              label="City" 
                              value={clientFormData.city || 'Doha'} 
                              onChange={(e) => setClientFormData({...clientFormData, city: e.target.value})} 
                          />
                          <Input 
                              label="Country" 
                              value={clientFormData.country || 'Qatar'} 
                              onChange={(e) => setClientFormData({...clientFormData, country: e.target.value})} 
                          />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input 
                              label="Tax ID / VAT Number" 
                              value={clientFormData.taxId || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, taxId: e.target.value})} 
                              placeholder="QA-XXXXXXXX"
                          />
                          <Input 
                              label="Website" 
                              type="url"
                              value={clientFormData.website || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, website: e.target.value})} 
                              placeholder="https://www.company.com"
                          />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input 
                              label="Industry" 
                              value={(clientFormData as any).industry || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, industry: e.target.value} as any)} 
                              placeholder="e.g. Technology, Finance, Events"
                          />
                          <Select 
                              label="Company Size" 
                              options={[
                                  {value: '', label: 'Not Specified'},
                                  {value: '1-10', label: '1-10 employees'},
                                  {value: '11-50', label: '11-50 employees'},
                                  {value: '51-200', label: '51-200 employees'},
                                  {value: '201-500', label: '201-500 employees'},
                                  {value: '500+', label: '500+ employees'}
                              ]} 
                              value={(clientFormData as any).companySize || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, companySize: e.target.value} as any)} 
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                          <textarea 
                              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none resize-none" 
                              rows={4}
                              placeholder="Additional notes about the client..."
                              value={(clientFormData as any).notes || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value} as any)} 
                          />
                      </div>
                  </div>
              )}

              {clientModalTab === 'account' && (
                  <div className="space-y-6 animate-fadeIn pt-2">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
                          <Lock className="text-blue-500 mt-1" size={20} />
                          <div>
                              <h4 className="font-bold text-blue-900">Account Management</h4>
                              <p className="text-sm text-blue-700 mt-1">Manage email and password for this client's account.</p>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account Credentials</h3>
                          
                          <Input 
                              label="Email Address *" 
                              type="email" 
                              value={clientFormData.email || ''} 
                              onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})} 
                              placeholder="client@example.com"
                          />
                          
                          {editingClientId ? (
                              <>
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                      <p className="text-xs text-amber-800 font-medium">
                                          <Lock className="inline w-3 h-3 mr-1" /> To change the password, use the password reset option below.
                                      </p>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                      <div className="flex-1">
                                          <p className="font-bold text-gray-900">Password Reset</p>
                                          <p className="text-xs text-gray-500 mt-1">Send a password reset link to: <span className="font-medium">{clientFormData.email}</span></p>
                                      </div>
                                      <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={async () => {
                                              if (!clientFormData.email) {
                                                  toast.error('Email address is required');
                                                  return;
                                              }
                                              
                                              try {
                                                  const { auth } = await import('../services/api');
                                                  const response = await auth.forgotPassword(clientFormData.email);
                                                  if (response.success) {
                                                      toast.success(`Password reset link sent to ${clientFormData.email}`);
                                                  } else {
                                                      toast.error(response.error || 'Failed to send reset link');
                                                  }
                                              } catch (error: any) {
                                                  console.error('Error sending password reset:', error);
                                                  toast.error(error?.response?.data?.error || error?.message || 'Failed to send reset link');
                                              }
                                          }}
                                          className="touch-manipulation whitespace-nowrap"
                                      >
                                          <Mail size={14} className="mr-2" /> Send Reset Link
                                      </Button>
                                  </div>
                              </>
                          ) : (
                              <div className="space-y-4">
                                  <div className="relative">
                                      <Input 
                                          label="Temporary Password *" 
                                          type={showClientPassword ? "text" : "password"} 
                                          value={clientFormData.tempPassword || 'TempPassword123!'} 
                                          onChange={(e) => {
                                              const newPassword = e.target.value;
                                              setClientFormData({...clientFormData, tempPassword: newPassword} as any);
                                          }} 
                                          placeholder="Enter temporary password (min 6 characters)"
                                      />
                                      <div className="absolute right-3 top-9 flex items-center gap-2">
                                          <button
                                              type="button"
                                              onClick={() => {
                                                  const newPassword = generateSecurePassword();
                                                  setClientFormData({...clientFormData, tempPassword: newPassword} as any);
                                                  setShowClientPassword(true);
                                                  toast.info('Secure password generated');
                                              }}
                                              className="text-gray-400 hover:text-qatar transition-colors touch-manipulation"
                                              title="Generate secure password"
                                          >
                                              <Zap size={16} />
                                          </button>
                                          <button
                                              type="button"
                                              onClick={() => setShowClientPassword(!showClientPassword)}
                                              className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                                          >
                                              {showClientPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {clientFormData.tempPassword && (() => {
                                      const validation = validatePassword(clientFormData.tempPassword || '');
                                      const strengthColors = {
                                          weak: 'bg-red-500',
                                          medium: 'bg-amber-500',
                                          strong: 'bg-emerald-500'
                                      };
                                      return (
                                          <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                      <div 
                                                          className={`h-full transition-all ${strengthColors[validation.strength]}`}
                                                          style={{ width: validation.strength === 'weak' ? '33%' : validation.strength === 'medium' ? '66%' : '100%' }}
                                                      />
                                                  </div>
                                                  <span className={`text-xs font-bold ${validation.strength === 'weak' ? 'text-red-600' : validation.strength === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                      {validation.strength.toUpperCase()}
                                                  </span>
                                              </div>
                                              <p className="text-xs text-gray-500">{validation.message}</p>
                                          </div>
                                      );
                                  })()}
                              </div>
                          )}
                      </div>
                  </div>
              )}
              
              
              <div className="border-t border-gray-100 pt-4 mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <Button className="w-full" onClick={handleSaveClient} disabled={!clientFormData.companyName || !clientFormData.email || !clientFormData.contactPerson}>
                      {editingClientId ? 'Save Client Changes' : 'Create Client'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">* Required fields must be filled</p>
              </div>
          </div>
      </Modal>

      
      <Modal isOpen={isSupervisorModalOpen} onClose={() => {
          setIsSupervisorModalOpen(false);
          if (!editingSupervisorId) {
              setSupervisorFormData({ 
                  name: '', 
                  email: '', 
                  phone: '', 
                  status: 'Active',
                  imageUrl: '',
                  location: 'Doha',
                  department: '',
                  specialization: '',
                  yearsOfExperience: 0,
                  certifications: [],
                  languages: [],
                  notes: '',
              });
          }
      }} title={editingSupervisorId ? "Edit Supervisor" : "Add New Supervisor"}>
          <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-2">
              
              <div className="flex gap-2 border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <button
                      onClick={() => setSupervisorModalTab('profile')}
                      className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                          supervisorModalTab === 'profile'
                              ? 'border-qatar text-qatar'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Profile
                  </button>
                  <button
                      onClick={() => setSupervisorModalTab('details')}
                      className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                          supervisorModalTab === 'details'
                              ? 'border-qatar text-qatar'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Details
                  </button>
                  <button
                      onClick={() => setSupervisorModalTab('account')}
                      className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 ${
                          supervisorModalTab === 'account'
                              ? 'border-qatar text-qatar'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      Account
                  </button>
              </div>

              {supervisorModalTab === 'profile' && (
                  <div className="space-y-4 animate-fadeIn">
                      
                      <div className="flex flex-col items-center">
                          <div className="relative">
                              <img 
                                  src={supervisorFormData.imageUrl || `https://i.pravatar.cc/150?u=${supervisorFormData.name || 'supervisor'}`} 
                                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" 
                                  alt="Supervisor"
                                  onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${supervisorFormData.name || 'supervisor'}`;
                                  }}
                              />
                              <label className="absolute bottom-0 right-0 bg-qatar text-white rounded-full p-2 cursor-pointer hover:bg-qatar/90 transition-colors shadow-lg touch-manipulation">
                                  <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          
                                          if (!file.type.startsWith('image/')) {
                                              toast.error('Please select an image file');
                                              return;
                                          }
                                          
                                          if (file.size > 5 * 1024 * 1024) {
                                              toast.error('Image size must be less than 5MB');
                                              return;
                                          }
                                          
                                          setIsUploadingSupervisorImage(true);
                                          
                                          try {
                                              if (editingSupervisorId) {
                                                  const formData = new FormData();
                                                  formData.append('image', file);
                                                  const response = await fetch(`/api/supervisors/${editingSupervisorId}/avatar`, {
                                                      method: 'POST',
                                                      headers: {
                                                          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                                                      },
                                                      body: formData,
                                                  });
                                                  
                                                  if (!response.ok) {
                                                      const error = await response.json();
                                                      throw new Error(error.error || 'Failed to upload image');
                                                  }
                                                  
                                                  const result = await response.json();
                                                  if (result.success && result.data?.imageUrl) {
                                                      setSupervisorFormData({...supervisorFormData, imageUrl: result.data.imageUrl});
                                                      toast.success('Profile image uploaded successfully');
                                                  } else {
                                                      throw new Error('Invalid response from server');
                                                  }
                                              } else {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                      setSupervisorFormData({...supervisorFormData, imageUrl: reader.result as string});
                                                      setIsUploadingSupervisorImage(false);
                                                  };
                                                  reader.onerror = () => {
                                                      toast.error('Failed to read image file');
                                                      setIsUploadingSupervisorImage(false);
                                                  };
                                                  reader.readAsDataURL(file);
                                                  return;
                                              }
                                          } catch (error: any) {
                                              console.error('Error uploading image:', error);
                                              toast.error(error?.message || 'Failed to upload image');
                                          } finally {
                                              setIsUploadingSupervisorImage(false);
                                              e.target.value = '';
                                          }
                                      }}
                                      disabled={isUploadingSupervisorImage}
                                  />
                                  <Upload size={14} />
                              </label>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-2">Click to upload profile image</p>
                      </div>
                      
                      <Input 
                          label="Full Name *" 
                          value={supervisorFormData.name || ''} 
                          onChange={(e) => setSupervisorFormData({...supervisorFormData, name: e.target.value})} 
                          placeholder="Full name"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input 
                              label="Email *" 
                              type="email" 
                              value={supervisorFormData.email || ''} 
                              onChange={(e) => setSupervisorFormData({...supervisorFormData, email: e.target.value})} 
                              placeholder="supervisor@example.com"
                          />
                          <Input 
                              label="Phone" 
                              value={supervisorFormData.phone || ''} 
                              onChange={(e) => setSupervisorFormData({...supervisorFormData, phone: e.target.value})} 
                              placeholder="+974 XXXX XXXX"
                          />
                      </div>
                      <Select 
                          label="Status" 
                          options={[
                              {value: 'Active', label: 'Active'}, 
                              {value: 'On Leave', label: 'On Leave'},
                              {value: 'Suspended', label: 'Suspended'}
                          ]} 
                          value={supervisorFormData.status || 'Active'} 
                          onChange={(e) => setSupervisorFormData({...supervisorFormData, status: e.target.value as any})} 
                      />
                  </div>
              )}

              {supervisorModalTab === 'details' && (
                  <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input 
                              label="Department" 
                              value={supervisorFormData.department || ''} 
                              onChange={(e) => setSupervisorFormData({...supervisorFormData, department: e.target.value})} 
                              placeholder="e.g. Operations, HR, Events"
                          />
                          <Input 
                              label="Location" 
                              value={(supervisorFormData as any).location || 'Doha'} 
                              onChange={(e) => setSupervisorFormData({...supervisorFormData, location: e.target.value} as any)} 
                              placeholder="City or region"
                          />
                      </div>
                      <Input 
                          label="Specialization" 
                          value={(supervisorFormData as any).specialization || ''} 
                          onChange={(e) => setSupervisorFormData({...supervisorFormData, specialization: e.target.value} as any)} 
                          placeholder="e.g. Event Management, Security, Logistics"
                      />
                      <Input 
                          label="Years of Experience" 
                          type="number"
                          min="0"
                          value={(supervisorFormData as any).yearsOfExperience || 0} 
                          onChange={(e) => setSupervisorFormData({...supervisorFormData, yearsOfExperience: parseInt(e.target.value) || 0} as any)} 
                          placeholder="0"
                      />
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                              {((supervisorFormData as any).languages || []).map((lang: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {lang}
                                      <button
                                          type="button"
                                          onClick={() => {
                                              const newLangs = [...((supervisorFormData as any).languages || [])];
                                              newLangs.splice(idx, 1);
                                              setSupervisorFormData({...supervisorFormData, languages: newLangs} as any);
                                          }}
                                          className="hover:text-blue-900"
                                      >
                                          <X size={12} />
                                      </button>
                                  </span>
                              ))}
                          </div>
                          <div className="flex gap-2">
                              <input
                                  type="text"
                                  placeholder="Add language (e.g. English, Arabic)"
                                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none"
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const input = e.target as HTMLInputElement;
                                          const lang = input.value.trim();
                                          if (lang && !((supervisorFormData as any).languages || []).includes(lang)) {
                                              setSupervisorFormData({
                                                  ...supervisorFormData,
                                                  languages: [...((supervisorFormData as any).languages || []), lang]
                                              } as any);
                                              input.value = '';
                                          }
                                      }
                                  }}
                              />
                              <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                      if (input) {
                                          const lang = input.value.trim();
                                          if (lang && !((supervisorFormData as any).languages || []).includes(lang)) {
                                              setSupervisorFormData({
                                                  ...supervisorFormData,
                                                  languages: [...((supervisorFormData as any).languages || []), lang]
                                              } as any);
                                              input.value = '';
                                          }
                                      }
                                  }}
                              >
                                  Add
                              </Button>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                              {((supervisorFormData as any).certifications || []).map((cert: string, idx: number) => (
                                  <span key={idx} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                                      {cert}
                                      <button
                                          type="button"
                                          onClick={() => {
                                              const newCerts = [...((supervisorFormData as any).certifications || [])];
                                              newCerts.splice(idx, 1);
                                              setSupervisorFormData({...supervisorFormData, certifications: newCerts} as any);
                                          }}
                                          className="hover:text-emerald-900"
                                      >
                                          <X size={12} />
                                      </button>
                                  </span>
                              ))}
                          </div>
                          <div className="flex gap-2">
                              <input
                                  type="text"
                                  placeholder="Add certification (e.g. PMP, Event Management)"
                                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none"
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          e.preventDefault();
                                          const input = e.target as HTMLInputElement;
                                          const cert = input.value.trim();
                                          if (cert && !((supervisorFormData as any).certifications || []).includes(cert)) {
                                              setSupervisorFormData({
                                                  ...supervisorFormData,
                                                  certifications: [...((supervisorFormData as any).certifications || []), cert]
                                              } as any);
                                              input.value = '';
                                          }
                                      }
                                  }}
                              />
                              <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                      e.preventDefault();
                                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                                      if (input) {
                                          const cert = input.value.trim();
                                          if (cert && !((supervisorFormData as any).certifications || []).includes(cert)) {
                                              setSupervisorFormData({
                                                  ...supervisorFormData,
                                                  certifications: [...((supervisorFormData as any).certifications || []), cert]
                                              } as any);
                                              input.value = '';
                                          }
                                      }
                                  }}
                              >
                                  Add
                              </Button>
                          </div>
                      </div>
                      
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                          <textarea 
                              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none resize-none" 
                              rows={4}
                              placeholder="Additional notes about the supervisor..."
                              value={(supervisorFormData as any).notes || ''} 
                              onChange={(e) => setSupervisorFormData({...supervisorFormData, notes: e.target.value} as any)} 
                          />
                      </div>
                  </div>
              )}

              {supervisorModalTab === 'account' && (
                  <div className="space-y-6 animate-fadeIn pt-2">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-4 items-start">
                          <Lock className="text-blue-500 mt-1" size={20} />
                          <div>
                              <h4 className="font-bold text-blue-900">Account Management</h4>
                              <p className="text-sm text-blue-700 mt-1">Manage email and password for this supervisor's account.</p>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Account Credentials</h3>
                          
                          <Input 
                              label="Email Address *" 
                              type="email" 
                              value={supervisorFormData.email || ''} 
                              onChange={(e) => setSupervisorFormData({...supervisorFormData, email: e.target.value})} 
                              placeholder="supervisor@example.com"
                          />
                          
                          {editingSupervisorId ? (
                              <>
                                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                      <p className="text-xs text-amber-800 font-medium">
                                          <Lock className="inline w-3 h-3 mr-1" /> To change the password, use the password reset option below.
                                      </p>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                      <div className="flex-1">
                                          <p className="font-bold text-gray-900">Password Reset</p>
                                          <p className="text-xs text-gray-500 mt-1">Send a password reset link to: <span className="font-medium">{supervisorFormData.email}</span></p>
                                      </div>
                                      <Button 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={async () => {
                                              if (!supervisorFormData.email) {
                                                  toast.error('Email address is required');
                                                  return;
                                              }
                                              
                                              try {
                                                  const { auth } = await import('../services/api');
                                                  const response = await auth.forgotPassword(supervisorFormData.email);
                                                  if (response.success) {
                                                      toast.success(`Password reset link sent to ${supervisorFormData.email}`);
                                                  } else {
                                                      toast.error(response.error || 'Failed to send reset link');
                                                  }
                                              } catch (error: any) {
                                                  console.error('Error sending password reset:', error);
                                                  toast.error(error?.response?.data?.error || error?.message || 'Failed to send reset link');
                                              }
                                          }}
                                          className="touch-manipulation whitespace-nowrap"
                                      >
                                          <Mail size={14} className="mr-2" /> Send Reset Link
                                      </Button>
                                  </div>
                              </>
                          ) : (
                              <div className="space-y-4">
                                  <div className="relative">
                                      <Input 
                                          label="Temporary Password *" 
                                          type={showSupervisorPassword ? "text" : "password"} 
                                          value={supervisorFormData.tempPassword || 'TempPassword123!'} 
                                          onChange={(e) => {
                                              const newPassword = e.target.value;
                                              setSupervisorFormData({...supervisorFormData, tempPassword: newPassword} as any);
                                          }} 
                                          placeholder="Enter temporary password (min 6 characters)"
                                      />
                                      <div className="absolute right-3 top-9 flex items-center gap-2">
                                          <button
                                              type="button"
                                              onClick={() => {
                                                  const newPassword = generateSecurePassword();
                                                  setSupervisorFormData({...supervisorFormData, tempPassword: newPassword} as any);
                                                  setShowSupervisorPassword(true);
                                                  toast.info('Secure password generated');
                                              }}
                                              className="text-gray-400 hover:text-qatar transition-colors touch-manipulation"
                                              title="Generate secure password"
                                          >
                                              <Zap size={16} />
                                          </button>
                                          <button
                                              type="button"
                                              onClick={() => setShowSupervisorPassword(!showSupervisorPassword)}
                                              className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                                          >
                                              {showSupervisorPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                          </button>
                                      </div>
                                  </div>
                                  
                                  {supervisorFormData.tempPassword && (() => {
                                      const validation = validatePassword(supervisorFormData.tempPassword || '');
                                      const strengthColors = {
                                          weak: 'bg-red-500',
                                          medium: 'bg-amber-500',
                                          strong: 'bg-emerald-500'
                                      };
                                      return (
                                          <div className="space-y-2">
                                              <div className="flex items-center gap-2">
                                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                      <div 
                                                          className={`h-full transition-all ${strengthColors[validation.strength]}`}
                                                          style={{ width: validation.strength === 'weak' ? '33%' : validation.strength === 'medium' ? '66%' : '100%' }}
                                                      />
                                                  </div>
                                                  <span className={`text-xs font-bold ${validation.strength === 'weak' ? 'text-red-600' : validation.strength === 'medium' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                      {validation.strength.toUpperCase()}
                                                  </span>
                                              </div>
                                              <p className="text-xs text-gray-500">{validation.message}</p>
                                          </div>
                                      );
                                  })()}
                              </div>
                          )}
                      </div>
                  </div>
              )}
              
              
              <div className="border-t border-gray-100 pt-4 mt-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
                  <Button className="w-full" onClick={handleSaveSupervisor} disabled={!supervisorFormData.name || !supervisorFormData.email}>
                      {editingSupervisorId ? 'Save Supervisor Changes' : 'Create Supervisor'}
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">* Required fields must be filled</p>
              </div>
          </div>
      </Modal>

      
      
      <Modal isOpen={isBookingModalOpen} onClose={() => { setIsBookingModalOpen(false); setSelectedBooking(null); setBookingRecommendations(null); }} title="Booking Request Details">
          {selectedBooking && (
              <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Event Type</p>
                          <p className="text-lg font-bold text-gray-900">{selectedBooking.eventType || 'N/A'}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                          <Badge status={selectedBooking.status === 'Approved' || selectedBooking.status === 'Converted' ? 'Approved' : selectedBooking.status === 'Rejected' ? 'Rejected' : 'Pending'} />
                      </div>
                  </div>

                  <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Calendar size={18} /> Event Details
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Event Date</p>
                              <p className="text-sm text-gray-900">{selectedBooking.date ? new Date(selectedBooking.date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Time</p>
                              <p className="text-sm text-gray-900">{selectedBooking.time || 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Duration</p>
                              <p className="text-sm text-gray-900">{selectedBooking.duration || 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</p>
                              <p className="text-sm text-gray-900">{selectedBooking.location || 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Venue</p>
                              <p className="text-sm text-gray-900">{selectedBooking.eventDetails?.venue || 'N/A'}</p>
                          </div>
                          <div className="col-span-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Budget</p>
                              <p className="text-sm text-gray-900">{selectedBooking.budget || 'N/A'}</p>
                          </div>
                      </div>
                  </div>

                  <div>
                      <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-gray-900 flex items-center gap-2">
                              <Users size={18} /> Staff Requirements
                          </h4>
                          {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Under Review') && (
                              <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadBookingRecommendations(selectedBooking)}
                                  disabled={isLoadingBookingRecommendations}
                                  className="text-xs"
                              >
                                  {isLoadingBookingRecommendations ? (
                                      <>
                                          <Loader2 size={12} className="mr-1 animate-spin" /> Loading...
                                      </>
                                  ) : (
                                      <>
                                          <Sparkles size={12} className="mr-1" /> Get AI Recommendations
                                      </>
                                  )}
                              </Button>
                          )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Servers</p>
                              <p className="text-xl font-bold text-blue-900">{selectedBooking.staff?.servers || 0}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Hosts</p>
                              <p className="text-xl font-bold text-purple-900">{selectedBooking.staff?.hosts || 0}</p>
                          </div>
                          <div className="bg-emerald-50 p-3 rounded-lg">
                              <p className="text-xs font-semibold text-emerald-700 uppercase mb-1">Other</p>
                              <p className="text-xl font-bold text-emerald-900">{selectedBooking.staff?.other || 0}</p>
                          </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                          Total: {((selectedBooking.staff?.servers || 0) + (selectedBooking.staff?.hosts || 0) + (selectedBooking.staff?.other || 0)) || 0} staff members
                      </p>
                      
                      
                      {bookingRecommendations && Object.keys(bookingRecommendations).length > 0 && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                  <Sparkles size={16} className="text-purple-600" />
                                  <h5 className="font-bold text-purple-900 text-sm">AI-Powered Staff Recommendations</h5>
                              </div>
                              <div className="space-y-3">
                                  {bookingRecommendations.servers && bookingRecommendations.servers.length > 0 && (
                                      <div>
                                          <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Recommended Servers</p>
                                          <div className="space-y-2">
                                              {bookingRecommendations.servers.slice(0, 3).map((rec: any, idx: number) => (
                                                  <div key={idx} className="bg-white p-2 rounded border border-blue-100">
                                                      <p className="text-sm font-medium text-gray-900">{rec.staffName}</p>
                                                      <p className="text-xs text-gray-600">{rec.reason}</p>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  {bookingRecommendations.hosts && bookingRecommendations.hosts.length > 0 && (
                                      <div>
                                          <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Recommended Hosts</p>
                                          <div className="space-y-2">
                                              {bookingRecommendations.hosts.slice(0, 3).map((rec: any, idx: number) => (
                                                  <div key={idx} className="bg-white p-2 rounded border border-purple-100">
                                                      <p className="text-sm font-medium text-gray-900">{rec.staffName}</p>
                                                      <p className="text-xs text-gray-600">{rec.reason}</p>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  {bookingRecommendations.other && bookingRecommendations.other.length > 0 && (
                                      <div>
                                          <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">Recommended Support Staff</p>
                                          <div className="space-y-2">
                                              {bookingRecommendations.other.slice(0, 3).map((rec: any, idx: number) => (
                                                  <div key={idx} className="bg-white p-2 rounded border border-emerald-100">
                                                      <p className="text-sm font-medium text-gray-900">{rec.staffName}</p>
                                                      <p className="text-xs text-gray-600">{rec.reason}</p>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>
                              <p className="text-xs text-purple-600 mt-3 italic">
                                  💡 These recommendations are based on event type, location, and staff expertise. Review and assign manually when creating the event.
                              </p>
                          </div>
                      )}
                  </div>

                  <div>
                      <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Phone size={18} /> Contact Information
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Name</p>
                              <p className="text-sm text-gray-900">{selectedBooking.contact?.name || 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Company</p>
                              <p className="text-sm text-gray-900">{selectedBooking.contact?.company || 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Email</p>
                              <p className="text-sm text-gray-900">{selectedBooking.contact?.email || 'N/A'}</p>
                          </div>
                          <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Phone</p>
                              <p className="text-sm text-gray-900">{selectedBooking.contact?.phone || 'N/A'}</p>
                          </div>
                      </div>
                  </div>

                  {selectedBooking.eventDetails?.special && (
                      <div>
                          <h4 className="font-bold text-gray-900 mb-3">Special Requirements</h4>
                          <p className="text-sm text-gray-700 bg-slate-50 p-4 rounded-lg">{selectedBooking.eventDetails.special}</p>
                      </div>
                  )}

                  {selectedBooking.convertedToEventId && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                          <p className="text-sm text-emerald-800">
                              <CheckCircle size={16} className="inline mr-2" />
                              This booking has been converted to an event.
                          </p>
                      </div>
                  )}

                  {(selectedBooking.status === 'Pending' || selectedBooking.status === 'Under Review') && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                          <Button 
                              variant="outline" 
                              onClick={() => { setIsBookingModalOpen(false); setSelectedBooking(null); }}
                              className="flex-1"
                          >
                              Close
                          </Button>
                          <Button 
                              onClick={() => handleBookingDecision(selectedBooking.id, 'Rejected')}
                              disabled={isLoadingBookings}
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
                          >
                              <XCircle size={16} className="mr-2" /> Reject
                          </Button>
                          <Button 
                              onClick={() => handleBookingDecision(selectedBooking.id, 'Approved')}
                              disabled={isLoadingBookings}
                              className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                          >
                              <CheckCircle size={16} className="mr-2" /> Approve & Create Event
                          </Button>
                      </div>
                  )}
              </div>
          )}
      </Modal>

      <Modal isOpen={isAppModalOpen} onClose={() => setAppModalOpen(false)} title="Review Application">
          {selectedApp && (
              <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 rounded-xl border border-gray-200">
                      <img 
                          src={(() => {
                              const avatar = (selectedApp as any).avatar || selectedApp.avatar;
                              if (avatar && avatar !== '' && avatar !== 'null' && avatar !== 'undefined' && avatar !== '#') {
                                  return avatar;
                              }
                              return `https://i.pravatar.cc/150?u=${encodeURIComponent(selectedApp.name || 'user')}`;
                          })()}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white shadow-lg object-cover" 
                          alt={selectedApp.name || 'Applicant'}
                          onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?u=${encodeURIComponent(selectedApp.name || 'user')}`;
                          }}
                      />
                      <div className="flex-1 text-center sm:text-left">
                          <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-1">{selectedApp.name || 'N/A'}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                              {selectedApp.roleApplied || 'N/A'} • {selectedApp.experience || 'N/A'}
                          </p>
                          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                              {selectedApp.email && (
                                  <p className="text-xs text-gray-500"><Mail size={12} className="inline mr-1" />{selectedApp.email}</p>
                              )}
                              {selectedApp.phone && (
                                  <p className="text-xs text-gray-500"><Phone size={12} className="inline mr-1" />{selectedApp.phone}</p>
                              )}
                          </div>
                          {(selectedApp as any).qidNumber && (
                              <p className="text-xs text-gray-500 font-medium mt-1">QID: {(selectedApp as any).qidNumber}</p>
                          )}
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl text-center border border-blue-200 shadow-sm">
                          <p className="text-xs text-blue-600 font-bold uppercase mb-1">Quiz Score</p>
                          <p className="text-2xl sm:text-3xl font-bold text-blue-900">{selectedApp.quizScore || 0}%</p>
                          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${selectedApp.quizScore || 0}%` }}></div>
                          </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl text-center border border-purple-200 shadow-sm">
                          <p className="text-xs text-purple-600 font-bold uppercase mb-1">Height</p>
                          <p className="text-xl sm:text-2xl font-bold text-purple-900">{selectedApp.height || 'N/A'}</p>
                          {selectedApp.height && <p className="text-xs text-purple-600 mt-1">cm</p>}
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl text-center border border-emerald-200 shadow-sm">
                          <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Weight</p>
                          <p className="text-xl sm:text-2xl font-bold text-emerald-900">{selectedApp.weight || 'N/A'}</p>
                          {selectedApp.weight && <p className="text-xs text-emerald-600 mt-1">kg</p>}
                      </div>
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl text-center border border-amber-200 shadow-sm">
                          <p className="text-xs text-amber-600 font-bold uppercase mb-1">Languages</p>
                          <p className="text-xs sm:text-sm font-bold text-amber-900">
                              {(() => {
                                  const langs = selectedApp.languages;
                                  if (Array.isArray(langs) && langs.length > 0) {
                                      return langs.join(', ');
                                  } else if (typeof langs === 'string' && langs.trim()) {
                                      return langs;
                                  }
                                  return 'N/A';
                              })()}
                          </p>
                      </div>
                  </div>

                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                          <h4 className="font-bold text-gray-900 text-sm uppercase">Personal Information</h4>
                          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Nationality:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.nationality || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Date of Birth:</span>
                                  <span className="font-medium text-gray-900">
                                      {selectedApp.dob ? (() => {
                                          try {
                                              const dobStr = selectedApp.dob.toString();
                                              // If it's an ISO string, extract just the date part
                                              if (dobStr.includes('T')) {
                                                  return dobStr.split('T')[0];
                                              }
                                              // If it's already in YYYY-MM-DD format, use it
                                              if (dobStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                                  return dobStr;
                                              }
                                              // Try to parse and format
                                              const dateObj = new Date(dobStr);
                                              if (!isNaN(dateObj.getTime())) {
                                                  return dateObj.toISOString().split('T')[0];
                                              }
                                              return dobStr;
                                          } catch (e) {
                                              return selectedApp.dob || 'N/A';
                                          }
                                      })() : 'N/A'}
                                  </span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Gender:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.gender || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Height:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.height ? `${selectedApp.height}cm` : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Weight:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.weight ? `${selectedApp.weight}kg` : 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Shirt Size:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.shirtSize || 'N/A'}</span>
                              </div>
                              {(selectedApp as any).qidNumber && (
                                  <div className="flex justify-between">
                                      <span className="text-gray-600">QID Number:</span>
                                      <span className="font-medium text-gray-900">{(selectedApp as any).qidNumber}</span>
                                  </div>
                              )}
                          </div>
                      </div>
                      <div className="space-y-3">
                          <h4 className="font-bold text-gray-900 text-sm uppercase">Contact & Location</h4>
                          <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="font-medium text-gray-900 break-all">{selectedApp.email || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.phone || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Location:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.location || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Experience:</span>
                                  <span className="font-medium text-gray-900">{selectedApp.experience || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                  <div className="flex justify-between">
                                      <span className="text-gray-600">Applied Date:</span>
                                      <span className="font-medium text-gray-900">
                                          {selectedApp.appliedDate ? (() => {
                                              try {
                                                  const dateStr = selectedApp.appliedDate.toString();
                                                  // If it's an ISO string, extract just the date part
                                                  if (dateStr.includes('T')) {
                                                      return dateStr.split('T')[0];
                                                  }
                                                  // If it's already in YYYY-MM-DD format, use it
                                                  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                                      return dateStr;
                                                  }
                                                  // Try to parse and format
                                                  const dateObj = new Date(dateStr);
                                                  if (!isNaN(dateObj.getTime())) {
                                                      return dateObj.toISOString().split('T')[0];
                                                  }
                                                  return dateStr;
                                              } catch (e) {
                                                  return selectedApp.appliedDate || 'N/A';
                                              }
                                          })() : 'N/A'}
                                      </span>
                                  </div>
                              </div>
                              <div className="flex justify-between">
                                  <span className="text-gray-600">Languages:</span>
                                  <span className="font-medium text-gray-900">
                                      {(() => {
                                          const langs = selectedApp.languages;
                                          if (Array.isArray(langs) && langs.length > 0) {
                                              return langs.join(', ');
                                          } else if (typeof langs === 'string' && langs.trim()) {
                                              return langs;
                                          }
                                          return 'N/A';
                                      })()}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>

                  
                  <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-bold text-gray-900 text-sm uppercase mb-3">Documents</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(() => {
                              const cvUrl = (selectedApp as any).cvUrl;
                              const hasCv = cvUrl && cvUrl !== '' && cvUrl !== '#' && cvUrl !== 'null' && cvUrl !== 'undefined';
                              return hasCv ? (
                                  <a 
                                      href={cvUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                                  >
                                      <FileText className="text-blue-600" size={20} />
                                      <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">CV/Resume</p>
                                          <p className="text-xs text-gray-500">Click to view</p>
                                      </div>
                                      <Eye size={16} className="text-blue-600" />
                                  </a>
                              ) : (
                                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                      <FileText className="text-gray-400" size={20} />
                                      <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-500">CV/Resume</p>
                                          <p className="text-xs text-gray-400">Not uploaded</p>
                                      </div>
                                  </div>
                              );
                          })()}
                          {(() => {
                              const idDocUrl = (selectedApp as any).idDocumentUrl;
                              const hasIdDoc = idDocUrl && idDocUrl !== '' && idDocUrl !== '#' && idDocUrl !== 'null' && idDocUrl !== 'undefined';
                              return hasIdDoc ? (
                                  <a 
                                      href={idDocUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                  >
                                      <FileText className="text-emerald-600" size={20} />
                                      <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-900">ID Document</p>
                                          <p className="text-xs text-gray-500">Click to view</p>
                                      </div>
                                      <Eye size={16} className="text-emerald-600" />
                                  </a>
                              ) : (
                                  <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                      <FileText className="text-gray-400" size={20} />
                                      <div className="flex-1">
                                          <p className="text-sm font-medium text-gray-500">ID Document</p>
                                          <p className="text-xs text-gray-400">Not uploaded</p>
                                      </div>
                                  </div>
                              );
                          })()}
                      </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                              <BookOpen size={20} className="text-blue-600" />
                              Quiz Results
                          </h4>
                          <span className="text-xs font-bold text-gray-500">
                              {selectedApp.quizDetails?.filter((q: any) => q.isCorrect).length || 0} / {selectedApp.quizDetails?.length || 0} Correct
                          </span>
                      </div>
                      <div className="space-y-3 max-h-60 sm:max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                          {selectedApp.quizDetails?.map((q: any, i: number) => (
                              <motion.div 
                                  key={i} 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className={`p-4 rounded-xl text-sm border-2 shadow-sm ${
                                      q.isCorrect 
                                          ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' 
                                          : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                                  }`}
                              >
                                  <div className="flex items-start gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${
                                          q.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                      }`}>
                                          {q.isCorrect ? '✓' : '✗'}
                                      </div>
                                      <div className="flex-1">
                                          <p className="font-bold mb-2 text-gray-900">{i + 1}. {q.question}</p>
                                          <div className="space-y-1">
                                              <p className={`text-xs font-medium ${q.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                                                  Selected: Option {q.selectedOption + 1} {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                              </p>
                                              {!q.isCorrect && (
                                                  <p className="text-xs text-gray-600">Correct answer: Option {q.correctOption + 1}</p>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </motion.div>
                          ))}
                      </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                      <Button 
                          onClick={() => exportApplicationToPDF(selectedApp)} 
                          variant="outline"
                          className="w-full mb-3 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-semibold"
                      >
                          <FileDown size={18} className="mr-2" /> Download Application PDF
                      </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                      <Button onClick={() => handleAppDecision('Approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">Approve</Button>
                      <Button onClick={() => {
                          setInterviewData({
                              interviewDate: '',
                              interviewTime: '',
                              interviewLocation: '',
                              interviewer: user.name || '',
                              interviewNotes: '',
                              meetingLink: '',
                              interviewType: 'local',
                          });
                          setIsInterviewModalOpen(true);
                      }} className="bg-blue-600 hover:bg-blue-700 text-white border-none">Interview</Button>
                      <Button onClick={() => handleAppDecision('Rejected')} variant="danger">Reject</Button>
                  </div>
              </div>
          )}
      </Modal>

      
      <Modal isOpen={isInterviewModalOpen} onClose={() => setIsInterviewModalOpen(false)} title="Schedule Interview">
          <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                      <UserPlus className="text-blue-600 mt-1" size={20} />
                      <div>
                          <p className="font-semibold text-blue-900 mb-1">Applicant Information</p>
                          <p className="text-sm text-blue-700">{selectedApp?.name || 'N/A'}</p>
                          <p className="text-sm text-blue-700">{selectedApp?.email || 'N/A'}</p>
                          <p className="text-sm text-blue-700">Position: {selectedApp?.roleApplied || 'N/A'}</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="inline mr-2" size={16} />
                          Interview Date *
                      </label>
                      <Input
                          type="date"
                          value={interviewData.interviewDate}
                          onChange={(e) => setInterviewData({ ...interviewData, interviewDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          required
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="inline mr-2" size={16} />
                          Interview Time *
                      </label>
                      <Input
                          type="time"
                          value={interviewData.interviewTime}
                          onChange={(e) => setInterviewData({ ...interviewData, interviewTime: e.target.value })}
                          required
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      Interview Type *
                  </label>
                  <Select
                      value={interviewData.interviewType}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewType: e.target.value as 'local' | 'online' })}
                      options={[
                          { value: 'local', label: 'In-Person Interview' },
                          { value: 'online', label: 'Online Interview' },
                      ]}
                  />
              </div>

              {interviewData.interviewType === 'local' ? (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="inline mr-2" size={16} />
                          Interview Location *
                      </label>
                      <Input
                          type="text"
                          value={interviewData.interviewLocation}
                          onChange={(e) => setInterviewData({ ...interviewData, interviewLocation: e.target.value })}
                          placeholder="e.g., LIYWAN Office, Building 123, Doha"
                          required
                      />
                  </div>
              ) : (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MessageSquare className="inline mr-2" size={16} />
                          Meeting Link *
                      </label>
                      <Input
                          type="url"
                          value={interviewData.meetingLink}
                          onChange={(e) => setInterviewData({ ...interviewData, meetingLink: e.target.value })}
                          placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom link"
                          required
                      />
                      <p className="text-xs text-gray-500 mt-1">Provide the video call link (Google Meet, Zoom, etc.)</p>
                  </div>
              )}

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserPlus className="inline mr-2" size={16} />
                      Interviewer Name
                  </label>
                  <Input
                      type="text"
                      value={interviewData.interviewer}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewer: e.target.value })}
                      placeholder="e.g., John Doe, HR Manager"
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline mr-2" size={16} />
                      Additional Notes / Instructions
                  </label>
                  <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      value={interviewData.interviewNotes}
                      onChange={(e) => setInterviewData({ ...interviewData, interviewNotes: e.target.value })}
                      placeholder="Add any special instructions, what to bring, dress code, etc."
                  />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> The applicant will receive a detailed email with all interview information, including date, time, location/meeting link, and any special instructions.
                  </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                      onClick={() => setIsInterviewModalOpen(false)}
                      variant="outline"
                      className="flex-1"
                  >
                      Cancel
                  </Button>
                  <Button
                      onClick={async () => {
                          if (!interviewData.interviewDate || !interviewData.interviewTime) {
                              toast.error('Please fill in all required fields (Date and Time)');
                              return;
                          }
                          if (interviewData.interviewType === 'local' && !interviewData.interviewLocation) {
                              toast.error('Please provide the interview location');
                              return;
                          }
                          if (interviewData.interviewType === 'online' && !interviewData.meetingLink) {
                              toast.error('Please provide the meeting link');
                              return;
                          }
                          
                          try {
                              setIsLoadingApplications(true);
                              await handleAppDecision('Interview', {
                                  interviewDate: new Date(interviewData.interviewDate).toISOString(),
                                  interviewTime: interviewData.interviewTime,
                                  interviewLocation: interviewData.interviewLocation || '',
                                  interviewer: interviewData.interviewer || user.name || '',
                                  interviewNotes: interviewData.interviewNotes || '',
                                  meetingLink: interviewData.meetingLink || '',
                                  interviewType: interviewData.interviewType,
                              });
                              setIsInterviewModalOpen(false);
                              setInterviewData({
                                  interviewDate: '',
                                  interviewTime: '',
                                  interviewLocation: '',
                                  interviewer: user.name || '',
                                  interviewNotes: '',
                                  meetingLink: '',
                                  interviewType: 'local',
                              });
                          } catch (error) {
                              console.error('Error scheduling interview:', error);
                          } finally {
                              setIsLoadingApplications(false);
                          }
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-none"
                      disabled={isLoadingApplications}
                  >
                      {isLoadingApplications ? 'Scheduling...' : 'Schedule Interview'}
                  </Button>
              </div>
          </div>
      </Modal>

      
      <Modal isOpen={isAssignStaffModalOpen} onClose={() => {
          setIsAssignStaffModalOpen(false);
          setSelectedStaffForAssignment('');
          setSelectedRoleForAssignment('');
          setAssignmentPayment({
              hourlyRate: 0,
              totalHours: 8,
              paymentType: 'hourly',
              fixedAmount: 0,
              bonus: 0,
              deductions: 0,
              overtimeRate: 0,
              overtimeHours: 0,
              transportationAllowance: 0,
              mealAllowance: 0,
              notes: '',
          });
      }} title="Assign Staff to Event">
          {selectedEvent && (() => {
              // Calculate total payment in real-time
              let calculatedTotal = 0;
              if (assignmentPayment.paymentType === 'hourly') {
                  calculatedTotal = (assignmentPayment.hourlyRate * assignmentPayment.totalHours) +
                                  (assignmentPayment.overtimeRate * assignmentPayment.overtimeHours) +
                                  assignmentPayment.bonus +
                                  assignmentPayment.transportationAllowance +
                                  assignmentPayment.mealAllowance -
                                  assignmentPayment.deductions;
              } else if (assignmentPayment.paymentType === 'fixed') {
                  calculatedTotal = assignmentPayment.fixedAmount +
                                  assignmentPayment.bonus +
                                  assignmentPayment.transportationAllowance +
                                  assignmentPayment.mealAllowance -
                                  assignmentPayment.deductions;
              } else if (assignmentPayment.paymentType === 'daily') {
                  calculatedTotal = (assignmentPayment.hourlyRate * 8) +
                                  (assignmentPayment.overtimeRate * assignmentPayment.overtimeHours) +
                                  assignmentPayment.bonus +
                                  assignmentPayment.transportationAllowance +
                                  assignmentPayment.mealAllowance -
                                  assignmentPayment.deductions;
              }
              
              return (
                  <div className="space-y-6 max-h-[85vh] overflow-y-auto">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-1">{selectedEvent.title}</h4>
                      <p className="text-sm text-blue-700">{selectedEvent.location} • {selectedEvent.date}</p>
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Role *</label>
                      <Select
                          value={selectedRoleForAssignment || ''}
                          onChange={(e) => setSelectedRoleForAssignment(e.target.value)}
                          options={[
                              { value: '', label: 'Choose a role...' },
                              ...(selectedEvent.roles?.map(r => ({
                                  value: r.roleName,
                                  label: `${r.roleName} (${r.filled}/${r.count} filled)`
                              })) || [])
                          ]}
                      />
                  </div>
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Member *</label>
                      <Select
                          value={selectedStaffForAssignment || ''}
                              onChange={(e) => {
                                  setSelectedStaffForAssignment(e.target.value);
                                  // Auto-fill hourly rate based on staff's role if available
                                  const selectedStaff = staff.find(s => s.id === e.target.value);
                                  if (selectedStaff && assignmentPayment.hourlyRate === 0) {
                                      // Default rates based on role (can be customized)
                                      const defaultRates: Record<string, number> = {
                                          'Supervisor': 150,
                                          'Hostess': 100,
                                          'Security': 120,
                                          'General Staff': 80,
                                      };
                                      setAssignmentPayment(prev => ({
                                          ...prev,
                                          hourlyRate: defaultRates[selectedStaff.role] || 100,
                                      }));
                                  }
                              }}
                          options={[
                              { value: '', label: 'Choose a staff member...' },
                              ...staff
                                  .filter(s => s.status === 'Available' || s.status === 'On Shift')
                                  .map(s => ({
                                      value: s.id,
                                      label: `${s.name} - ${s.role} (${s.rating}★)`
                                  }))
                          ]}
                      />
                  </div>
                  
                  {selectedStaffForAssignment && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          {(() => {
                              const selectedStaff = staff.find(s => s.id === selectedStaffForAssignment);
                              if (!selectedStaff) return null;
                              return (
                                  <div className="flex items-center gap-3">
                                      <img src={selectedStaff.imageUrl} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt="" />
                                      <div>
                                          <p className="font-bold text-gray-900">{selectedStaff.name}</p>
                                          <p className="text-xs text-gray-500">{selectedStaff.role} • {selectedStaff.location}</p>
                                          <div className="flex items-center gap-2 mt-1">
                                              <Star size={12} className="text-amber-500 fill-amber-500" />
                                              <span className="text-xs text-gray-600">{selectedStaff.rating}</span>
                                              <span className="text-xs text-gray-400">•</span>
                                              <span className="text-xs text-gray-600">{selectedStaff.completedShifts || 0} shifts</span>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })()}
                      </div>
                  )}
                  
                      {/* Financial Details Section */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                          <div className="flex items-center gap-2 mb-4">
                              <DollarSign size={18} className="text-emerald-600" />
                              <h3 className="font-bold text-gray-900">Payment & Financial Details</h3>
                          </div>
                          
                          <div className="space-y-4">
                              {/* Payment Type */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type *</label>
                                  <Select
                                      value={assignmentPayment.paymentType}
                                      onChange={(e) => setAssignmentPayment(prev => ({ ...prev, paymentType: e.target.value as any }))}
                                      options={[
                                          { value: 'hourly', label: 'Hourly Rate' },
                                          { value: 'fixed', label: 'Fixed Amount' },
                                          { value: 'daily', label: 'Daily Rate' },
                                      ]}
                                  />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                  {/* Hourly Rate or Base Rate */}
                                  {assignmentPayment.paymentType !== 'fixed' && (
                                      <div>
                                          <Input
                                              label="Hourly Rate (QAR) *"
                                              type="number"
                                              value={assignmentPayment.hourlyRate || ''}
                                              onChange={(e) => setAssignmentPayment(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                                              placeholder="0.00"
                                              min="0"
                                              step="0.01"
                                          />
                                      </div>
                                  )}
                                  
                                  {/* Fixed Amount */}
                                  {assignmentPayment.paymentType === 'fixed' && (
                                      <div>
                                          <Input
                                              label="Fixed Amount (QAR) *"
                                              type="number"
                                              value={assignmentPayment.fixedAmount || ''}
                                              onChange={(e) => setAssignmentPayment(prev => ({ ...prev, fixedAmount: parseFloat(e.target.value) || 0 }))}
                                              placeholder="0.00"
                                              min="0"
                                              step="0.01"
                                          />
                                      </div>
                                  )}
                                  
                                  {/* Total Hours */}
                                  {assignmentPayment.paymentType !== 'fixed' && (
                                      <div>
                                          <Input
                                              label="Total Hours *"
                                              type="number"
                                              value={assignmentPayment.totalHours || ''}
                                              onChange={(e) => setAssignmentPayment(prev => ({ ...prev, totalHours: parseFloat(e.target.value) || 0 }))}
                                              placeholder="8"
                                              min="0.5"
                                              step="0.5"
                                          />
                                      </div>
                                  )}
                              </div>
                              
                              {/* Overtime Section */}
                              {assignmentPayment.paymentType !== 'fixed' && (
                                  <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                      <div>
                                          <Input
                                              label="Overtime Rate (QAR/hour)"
                                              type="number"
                                              value={assignmentPayment.overtimeRate || ''}
                                              onChange={(e) => setAssignmentPayment(prev => ({ ...prev, overtimeRate: parseFloat(e.target.value) || 0 }))}
                                              placeholder="0.00"
                                              min="0"
                                              step="0.01"
                                          />
                                      </div>
                                      <div>
                                          <Input
                                              label="Overtime Hours"
                                              type="number"
                                              value={assignmentPayment.overtimeHours || ''}
                                              onChange={(e) => setAssignmentPayment(prev => ({ ...prev, overtimeHours: parseFloat(e.target.value) || 0 }))}
                                              placeholder="0"
                                              min="0"
                                              step="0.5"
                                          />
                                      </div>
                                  </div>
                              )}
                              
                              {/* Allowances */}
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <Input
                                          label="Transportation Allowance (QAR)"
                                          type="number"
                                          value={assignmentPayment.transportationAllowance || ''}
                                          onChange={(e) => setAssignmentPayment(prev => ({ ...prev, transportationAllowance: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                      />
                                  </div>
                                  <div>
                                      <Input
                                          label="Meal Allowance (QAR)"
                                          type="number"
                                          value={assignmentPayment.mealAllowance || ''}
                                          onChange={(e) => setAssignmentPayment(prev => ({ ...prev, mealAllowance: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                      />
                                  </div>
                              </div>
                              
                              {/* Bonus and Deductions */}
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <Input
                                          label="Bonus (QAR)"
                                          type="number"
                                          value={assignmentPayment.bonus || ''}
                                          onChange={(e) => setAssignmentPayment(prev => ({ ...prev, bonus: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                      />
                                  </div>
                                  <div>
                                      <Input
                                          label="Deductions (QAR)"
                                          type="number"
                                          value={assignmentPayment.deductions || ''}
                                          onChange={(e) => setAssignmentPayment(prev => ({ ...prev, deductions: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          min="0"
                                          step="0.01"
                                      />
                                  </div>
                              </div>
                              
                              {/* Notes */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Notes</label>
                                  <textarea
                                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm"
                                      rows={3}
                                      value={assignmentPayment.notes}
                                      onChange={(e) => setAssignmentPayment(prev => ({ ...prev, notes: e.target.value }))}
                                      placeholder="Additional notes about payment terms, conditions, etc."
                                  />
                              </div>
                              
                              {/* Financial Summary */}
                              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-xl border-2 border-emerald-200">
                                  <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm font-medium text-gray-700">Total Payment:</span>
                                      <span className="text-2xl font-bold text-emerald-700">
                                          QAR {calculatedTotal.toFixed(2)}
                                      </span>
                                  </div>
                                  <div className="text-xs text-gray-600 space-y-1 mt-2">
                                      {assignmentPayment.paymentType === 'hourly' && (
                                          <>
                                              <div className="flex justify-between">
                                                  <span>Base ({assignmentPayment.totalHours}h × QAR {assignmentPayment.hourlyRate.toFixed(2)}):</span>
                                                  <span>QAR {(assignmentPayment.hourlyRate * assignmentPayment.totalHours).toFixed(2)}</span>
                                              </div>
                                              {assignmentPayment.overtimeHours > 0 && (
                                                  <div className="flex justify-between">
                                                      <span>Overtime ({assignmentPayment.overtimeHours}h × QAR {assignmentPayment.overtimeRate.toFixed(2)}):</span>
                                                      <span>QAR {(assignmentPayment.overtimeRate * assignmentPayment.overtimeHours).toFixed(2)}</span>
                                                  </div>
                                              )}
                                          </>
                                      )}
                                      {assignmentPayment.paymentType === 'fixed' && (
                                          <div className="flex justify-between">
                                              <span>Fixed Amount:</span>
                                              <span>QAR {assignmentPayment.fixedAmount.toFixed(2)}</span>
                                          </div>
                                      )}
                                      {assignmentPayment.paymentType === 'daily' && (
                                          <>
                                              <div className="flex justify-between">
                                                  <span>Daily Base (8h × QAR {assignmentPayment.hourlyRate.toFixed(2)}):</span>
                                                  <span>QAR {(assignmentPayment.hourlyRate * 8).toFixed(2)}</span>
                                              </div>
                                              {assignmentPayment.overtimeHours > 0 && (
                                                  <div className="flex justify-between">
                                                      <span>Overtime ({assignmentPayment.overtimeHours}h × QAR {assignmentPayment.overtimeRate.toFixed(2)}):</span>
                                                      <span>QAR {(assignmentPayment.overtimeRate * assignmentPayment.overtimeHours).toFixed(2)}</span>
                                                  </div>
                                              )}
                                          </>
                                      )}
                                      {assignmentPayment.bonus > 0 && (
                                          <div className="flex justify-between text-emerald-600">
                                              <span>+ Bonus:</span>
                                              <span>QAR {assignmentPayment.bonus.toFixed(2)}</span>
                                          </div>
                                      )}
                                      {assignmentPayment.transportationAllowance > 0 && (
                                          <div className="flex justify-between text-blue-600">
                                              <span>+ Transportation:</span>
                                              <span>QAR {assignmentPayment.transportationAllowance.toFixed(2)}</span>
                                          </div>
                                      )}
                                      {assignmentPayment.mealAllowance > 0 && (
                                          <div className="flex justify-between text-blue-600">
                                              <span>+ Meal Allowance:</span>
                                              <span>QAR {assignmentPayment.mealAllowance.toFixed(2)}</span>
                                          </div>
                                      )}
                                      {assignmentPayment.deductions > 0 && (
                                          <div className="flex justify-between text-red-600">
                                              <span>- Deductions:</span>
                                              <span>QAR {assignmentPayment.deductions.toFixed(2)}</span>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2 border-t border-gray-200">
                      <Button 
                          variant="outline" 
                          onClick={() => {
                              setIsAssignStaffModalOpen(false);
                              setSelectedStaffForAssignment('');
                              setSelectedRoleForAssignment('');
                                  setAssignmentPayment({
                                      hourlyRate: 0,
                                      totalHours: 8,
                                      paymentType: 'hourly',
                                      fixedAmount: 0,
                                      bonus: 0,
                                      deductions: 0,
                                      overtimeRate: 0,
                                      overtimeHours: 0,
                                      transportationAllowance: 0,
                                      mealAllowance: 0,
                                      notes: '',
                                  });
                          }}
                          className="flex-1"
                      >
                          Cancel
                      </Button>
                      <Button 
                          onClick={handleAssignStaff}
                              disabled={!selectedStaffForAssignment || selectedStaffForAssignment === '' || !selectedRoleForAssignment || selectedRoleForAssignment === '' || calculatedTotal <= 0}
                          className="flex-1"
                      >
                              <UserPlus size={16} className="mr-2" /> Assign Staff (QAR {calculatedTotal.toFixed(2)})
                      </Button>
                  </div>
              </div>
              );
          })()}
      </Modal>

      
      <Modal isOpen={isShiftModalOpen} onClose={() => {
          setIsShiftModalOpen(false);
          setSelectedShift(null);
      }} title={selectedShift ? "Edit Shift" : "Add New Shift"}>
          {selectedEvent && (
              <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-900 mb-1">{selectedEvent.title}</h4>
                      <p className="text-sm text-blue-700">{selectedEvent.location} • {selectedEvent.date}</p>
                  </div>
                  
                  
                  {!selectedShift?.id && (() => {
                      const eventAssignments = (selectedEvent as any).assignments || [];
                      const assignedStaffIds = eventAssignments
                          .filter((a: any) => a.status === 'APPROVED' || a.status === 'PENDING')
                          .map((a: any) => {
                              const staffId = a.staffId?._id || a.staffId?.id || a.staffId;
                              return staffId ? staffId.toString() : null;
                          })
                          .filter(Boolean);
                      
                      const assignedStaffList = staff.filter(s => assignedStaffIds.includes(s.id));
                      
                      if (assignedStaffList.length === 0) {
                          return (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                  <p className="text-sm text-amber-800 font-bold mb-2">No staff assigned yet</p>
                                  <p className="text-xs text-amber-700 mb-3">Please assign staff to this event first before creating shifts.</p>
                                  <Button 
                                      size="sm" 
                                      onClick={() => {
                                          setIsShiftModalOpen(false);
                                          setEventDetailTab('roster');
                                          setTimeout(() => {
                                              setIsAssignStaffModalOpen(true);
                                          }, 100);
                                      }}
                                  >
                                      <UserPlus size={14} className="mr-2" /> Assign Staff Now
                                  </Button>
                              </div>
                          );
                      }
                      
                      return (
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select Staff Member *</label>
                              <Select
                                  value={selectedShift?.staffId || ''}
                                  onChange={(e) => setSelectedShift(prev => ({...prev, staffId: e.target.value}))}
                                  options={[
                                      { value: '', label: 'Choose a staff member...' },
                                      ...assignedStaffList.map(s => {
                                          const assignment = eventAssignments.find((a: any) => {
                                              const staffId = a.staffId?._id || a.staffId?.id || a.staffId;
                                              return staffId && staffId.toString() === s.id;
                                          });
                                          return {
                                              value: s.id,
                                              label: `${s.name} - ${assignment?.role || s.role} (${s.rating}★)`
                                          };
                                      })
                                  ]}
                              />
                              {selectedShift?.staffId && (() => {
                                  const selectedStaffMember = assignedStaffList.find(s => s.id === selectedShift.staffId);
                                  if (!selectedStaffMember) return null;
                                  return (
                                      <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                          <div className="flex items-center gap-2">
                                              <img src={selectedStaffMember.imageUrl} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="" />
                                              <div>
                                                  <p className="font-bold text-sm text-gray-900">{selectedStaffMember.name}</p>
                                                  <p className="text-xs text-gray-500">{selectedStaffMember.role} • {selectedStaffMember.location}</p>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })()}
                          </div>
                      );
                  })()}
                  
                  <div className="grid grid-cols-2 gap-4">
                      <Input
                          label="Start Time *"
                          type="time"
                          value={selectedShift?.startTime || ''}
                          onChange={(e) => setSelectedShift(prev => ({...prev, startTime: e.target.value}))}
                      />
                      <Input
                          label="End Time *"
                          type="time"
                          value={selectedShift?.endTime || ''}
                          onChange={(e) => setSelectedShift(prev => ({...prev, endTime: e.target.value}))}
                      />
                  </div>
                  
                  <Input
                      label="Shift Date *"
                      type="date"
                      value={selectedShift?.date || selectedEvent.date}
                      onChange={(e) => setSelectedShift(prev => ({...prev, date: e.target.value}))}
                  />
                  
                  <Input
                      label="Role/Department"
                      value={selectedShift?.role || ''}
                      onChange={(e) => setSelectedShift(prev => ({...prev, role: e.target.value}))}
                      placeholder="e.g., Logistics Setup, Guest Arrival"
                  />
                  
                  <Input
                      label="Wage (QAR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={selectedShift?.wage || ''}
                      onChange={(e) => setSelectedShift(prev => ({...prev, wage: Number(e.target.value)}))}
                      placeholder="0.00"
                  />
                  
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instructions/Notes</label>
                      <textarea
                          className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none resize-none"
                          rows={3}
                          value={selectedShift?.instructions || ''}
                          onChange={(e) => setSelectedShift(prev => ({...prev, instructions: e.target.value}))}
                          placeholder="Special instructions for this shift..."
                      />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                      <Button 
                          variant="outline" 
                          onClick={() => {
                              setIsShiftModalOpen(false);
                              setSelectedShift(null);
                          }}
                          className="flex-1"
                      >
                          Cancel
                      </Button>
                      <Button 
                          onClick={handleSaveShift}
                          disabled={!selectedShift?.startTime || !selectedShift?.endTime || (!selectedShift?.id && !selectedShift?.staffId)}
                          className="flex-1"
                      >
                          <Save size={16} className="mr-2" /> {selectedShift?.id ? 'Update Shift' : 'Create Shift'}
                      </Button>
                  </div>
              </div>
          )}
      </Modal>

      
      <AIForecastSection 
        isOpen={isForecastOpen} 
        onClose={() => setIsForecastOpen(false)} 
      />

      
      <AnimatePresence>
          {showSearchModal && (
              <>
                  <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                      onClick={() => setShowSearchModal(false)}
                  />
                  <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                      className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-[101] max-h-[80vh] overflow-hidden flex flex-col"
                  >
                      <div className="p-4 border-b border-gray-100 bg-slate-50">
                          <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                              <input
                                  type="text"
                                  className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-qatar/20 focus:border-qatar outline-none text-sm"
                                  placeholder="Search events, staff, clients, supervisors... (Press Esc to close)"
                                  value={globalSearch}
                                  onChange={(e) => setGlobalSearch(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                          setGlobalSearch('');
                                          setShowSearchModal(false);
                                      }
                                  }}
                              />
                              {globalSearch && (
                                  <button
                                      onClick={() => {
                                          setGlobalSearch('');
                                          setShowSearchModal(false);
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      aria-label="Clear search"
                                  >
                                      <X size={18} />
                                  </button>
                              )}
                          </div>
                          {globalSearch && (
                              <p className="text-xs text-gray-500 mt-2">
                                  Found {totalSearchResults} result{totalSearchResults !== 1 ? 's' : ''}
                              </p>
                          )}
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {!globalSearch || globalSearch.trim().length < 2 ? (
                              <div className="text-center py-12">
                                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                  <p className="text-gray-500 mb-2">Start typing to search...</p>
                                  <p className="text-xs text-gray-400">Search across events, staff, clients, and supervisors</p>
                              </div>
                          ) : totalSearchResults === 0 ? (
                              <div className="text-center py-12">
                                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                  <p className="text-gray-500">No results found for "{globalSearch}"</p>
                              </div>
                          ) : (
                              <>
                                  {globalSearchResults.events.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                              <Calendar size={14} /> Events ({globalSearchResults.events.length})
                                          </h4>
                                          <div className="space-y-2">
                                              {globalSearchResults.events.map(event => (
                                                  <button
                                                      key={event.id}
                                                      onClick={() => {
                                                          setSelectedEvent(event);
                                                          setActiveTab('events');
                                                          setShowSearchModal(false);
                                                          setGlobalSearch('');
                                                      }}
                                                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                  >
                                                      <p className="font-bold text-gray-900">{event.title}</p>
                                                      <p className="text-xs text-gray-500">{event.location} • {event.date}</p>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  
                                  {globalSearchResults.staff.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                              <Users size={14} /> Staff ({globalSearchResults.staff.length})
                                          </h4>
                                          <div className="space-y-2">
                                              {globalSearchResults.staff.map(s => (
                                                  <button
                                                      key={s.id}
                                                      onClick={() => {
                                                          openStaffModal(s);
                                                          setShowSearchModal(false);
                                                          setGlobalSearch('');
                                                      }}
                                                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                                                  >
                                                      <img src={s.imageUrl || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full" alt="" />
                                                      <div>
                                                          <p className="font-bold text-gray-900">{s.name}</p>
                                                          <p className="text-xs text-gray-500">{s.role} • {s.email}</p>
                                                      </div>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  
                                  {globalSearchResults.clients.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                              <Briefcase size={14} /> Clients ({globalSearchResults.clients.length})
                                          </h4>
                                          <div className="space-y-2">
                                              {globalSearchResults.clients.map(client => (
                                                  <button
                                                      key={client.id}
                                                      onClick={() => {
                                                          openClientModal(client);
                                                          setShowSearchModal(false);
                                                          setGlobalSearch('');
                                                      }}
                                                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                  >
                                                      <p className="font-bold text-gray-900">{client.companyName}</p>
                                                      <p className="text-xs text-gray-500">{client.contactPerson} • {client.email}</p>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                                  
                                  {globalSearchResults.supervisors.length > 0 && (
                                      <div>
                                          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                              <Shield size={14} /> Supervisors ({globalSearchResults.supervisors.length})
                                          </h4>
                                          <div className="space-y-2">
                                              {globalSearchResults.supervisors.map(sup => (
                                                  <button
                                                      key={sup.id}
                                                      onClick={() => {
                                                          openSupervisorModal(sup);
                                                          setShowSearchModal(false);
                                                          setGlobalSearch('');
                                                      }}
                                                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                  >
                                                      <p className="font-bold text-gray-900">{sup.name}</p>
                                                      <p className="text-xs text-gray-500">{sup.email}</p>
                                                  </button>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </>
                          )}
                      </div>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      
      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNotificationsUpdate={setNotifications}
      />
      </React.Fragment>
      </React.Fragment>
    </EnhancedErrorBoundary>
  );
};

export default AdminDashboard;
