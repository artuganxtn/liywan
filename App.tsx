import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicHome from './pages/PublicHome';
// Lazy load portal pages for code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffPortal = lazy(() => import('./pages/StaffPortal'));
const SupervisorPortal = lazy(() => import('./pages/SupervisorPortal'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));
import { UserRole, User, JobApplication, StaffProfile, QuizAnswer, Incident, Message, Event, ClientProfile, SupervisorProfile } from './types';
import { auth, upload, applications } from './services/api';
import { Button, Input, Select, IventiaLogo, OptionCard, FileUpload } from './components/UI';
import { AutoSaveIndicator, ProgressIndicator } from './components/ProgressComponents';
import { ToastProvider } from './components/ui/Toast';
import { useTranslation } from './contexts/TranslationContext';
import {
  Loader2, Lock, ArrowRight, Mail, Upload, Phone, MapPin,
  CheckCircle, ChevronLeft, User as UserIcon, Globe, Ruler, AlertCircle,
  Briefcase, Shield, Smile, Truck, Camera, FileText, Scale, Check, Users, Calendar,
  Eye, EyeOff
} from 'lucide-react';

// --- SHARED MOCK DATA (LIFTED STATE) ---
const INITIAL_STAFF: StaffProfile[] = [
  {
    id: 's1',
    name: 'Fatima Al-Thani',
    role: 'Protocol Manager',
    rating: 4.9,
    status: 'Available',
    skills: [{ name: 'Leadership', status: 'Verified' }, { name: 'Arabic', status: 'Verified' }, { name: 'VIP', status: 'Verified' }],
    imageUrl: 'https://i.pravatar.cc/150?u=fatima',
    totalEarnings: 12000,
    email: 'fatima@liywan.qa',
    phone: '+974 5500 1111',
    location: 'Doha',
    joinedDate: '2022-01-15',
    completedShifts: 45,
    onTimeRate: 98,
    xpPoints: 4500,
    level: 'Elite',
    feedback: [
      { id: 'f1', eventId: 'e1', eventName: 'Doha Forum', rating: 5, comment: 'Exceptional handling of VIP guests.', date: '2024-01-15' },
      { id: 'f2', eventId: 'e2', eventName: 'Royal Wedding', rating: 5, comment: 'Perfect protocol adherence.', date: '2023-12-10' }
    ]
  },
  {
    id: 's2',
    name: 'John Doe',
    role: 'Security Lead',
    rating: 4.7,
    status: 'On Shift',
    skills: [{ name: 'Security', status: 'Verified' }, { name: 'Crowd Control', status: 'Pending' }],
    imageUrl: 'https://i.pravatar.cc/150?u=john',
    totalEarnings: 8000,
    email: 'john@liywan.qa',
    phone: '+974 6600 2222',
    location: 'Lusail',
    joinedDate: '2023-03-10',
    completedShifts: 32,
    onTimeRate: 95,
    xpPoints: 2800,
    level: 'Gold',
    feedback: [
      { id: 'f3', eventId: 'e3', eventName: 'F1 Grand Prix', rating: 4, comment: 'Good crowd control, slightly late to post.', date: '2023-11-29' }
    ]
  },
  {
    id: 's3',
    name: 'Aisha Malik',
    role: 'Hostess',
    rating: 4.8,
    status: 'Available',
    skills: [{ name: 'Hospitality', status: 'Verified' }, { name: 'English', status: 'Verified' }, { name: 'French', status: 'Verified' }],
    imageUrl: 'https://i.pravatar.cc/150?u=aisha',
    totalEarnings: 5400,
    email: 'aisha@liywan.qa',
    phone: '+974 3300 3333',
    location: 'West Bay',
    joinedDate: '2023-06-20',
    completedShifts: 28,
    onTimeRate: 100,
    xpPoints: 1200,
    level: 'Silver',
    feedback: []
  },
];

const INITIAL_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Doha Jewellery & Watch Exhibition',
    date: '2024-05-20',
    location: 'DECC',
    description: 'Luxury exhibition requiring high-end protocol staff.',
    status: 'Upcoming',
    staffRequired: 50,
    staffAssigned: 12,
    revenue: 150000,
    budget: {
      total: 100000,
      staffingAllocated: 50000,
      logisticsAllocated: 30000,
      marketingAllocated: 20000,
      spent: 45000
    },
    roles: [
      { roleName: 'Protocol', count: 10, filled: 5 },
      { roleName: 'Security', count: 15, filled: 2 },
      { roleName: 'Hostess', count: 25, filled: 5 }
    ]
  },
  {
    id: '2',
    title: 'Qatar National Day Parade',
    date: '2024-12-18',
    location: 'Corniche',
    description: 'National event requiring crowd control.',
    status: 'Upcoming',
    staffRequired: 200,
    staffAssigned: 180,
    revenue: 500000,
    budget: {
      total: 300000,
      staffingAllocated: 150000,
      logisticsAllocated: 100000,
      marketingAllocated: 50000,
      spent: 280000
    },
    roles: [
      { roleName: 'Crowd Control', count: 100, filled: 95 },
      { roleName: 'Logistics', count: 50, filled: 45 },
      { roleName: 'Ushers', count: 50, filled: 40 }
    ]
  },
];

const INITIAL_APPLICATIONS: JobApplication[] = [
  {
    id: 'a1',
    name: 'Omar Hassan',
    email: 'omar.h@gmail.com',
    phone: '+974 3322 1100',
    roleApplied: 'Event Coordinator',
    experience: '3 Years',
    location: 'Doha',
    status: 'Pending',
    appliedDate: '2024-10-01',
    avatar: 'https://i.pravatar.cc/150?u=omar',
    languages: ['Arabic', 'English'],
    quizScore: 66,
    nationality: 'Jordanian',
    gender: 'Male',
    height: '180',
    weight: '75',
    shirtSize: 'L',
    quizDetails: [
      { questionId: 1, question: "A VIP guest arrives...", selectedOption: 2, correctOption: 2, isCorrect: true },
      { questionId: 2, question: "Your shift starts...", selectedOption: 0, correctOption: 1, isCorrect: false },
      { questionId: 3, question: "High-profile guest...", selectedOption: 0, correctOption: 0, isCorrect: true },
    ]
  },
];

const INITIAL_INCIDENTS: Incident[] = [
  { id: 'i1', type: 'Medical', severity: 'High', description: 'Guest fainted near VIP entrance.', reportedBy: 'John Doe', reportedAt: '10:30 AM', status: 'Open', eventId: 'e1', location: 'Gate 4' }
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'm1', senderId: 'admin1', senderName: 'Admin', content: 'All staff: Please report to Gate 4 for briefing.', timestamp: '08:00 AM', isRead: false, type: 'Broadcast' }
];

// --- ENHANCED QUIZ DATA ---
const ENHANCED_PROTOCOL_QUIZ = [
  {
    id: 1,
    question: "A VIP guest arrives at a restricted gate without their badge. What do you do?",
    options: ["Immediately deny entry and call security.", "Allow them in because they look important.", "Politely pause them, apologize, and call your supervisor."],
    correctAnswer: 2
  },
  {
    id: 2,
    question: "Your shift starts at 4:00 PM. What time do you arrive at the venue?",
    options: ["4:00 PM exactly.", "3:30 PM to allow for check-in and briefing.", "4:15 PM is acceptable in traffic."],
    correctAnswer: 1
  },
  {
    id: 3,
    question: "A colleague is struggling with their tasks during a busy period. What is your priority?",
    options: ["Focus on your own tasks exclusively.", "Quickly help them if it doesn't compromise your duty.", "Inform the supervisor immediately."],
    correctAnswer: 2
  },
  {
    id: 4,
    question: "You notice a small, visible stain on your uniform just before your shift. What is your immediate action?",
    options: ["Try to hide it and hope nobody notices.", "Immediately find your supervisor for a replacement.", "Ask a colleague for a spare item."],
    correctAnswer: 1
  },
  {
    id: 5,
    question: "You overhear a confidential conversation between two high-profile guests. What do you do?",
    options: ["Listen carefully to gather information.", "Pretend you heard nothing and maintain distance.", "Report the conversation to your supervisor."],
    correctAnswer: 1
  }
];


const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginPage, setIsLoginPage] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgotPassword' | 'resetPassword'>('signin');
  const [isLoading, setIsLoading] = useState(false);

  // --- LIFTED STATE FOR SHARED DATA ---
  const [globalStaff, setGlobalStaff] = useState<StaffProfile[]>(INITIAL_STAFF);
  const [globalEvents, setGlobalEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [globalApplications, setGlobalApplications] = useState<JobApplication[]>(INITIAL_APPLICATIONS);
  const [globalIncidents, setGlobalIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [globalMessages, setGlobalMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [globalClients, setGlobalClients] = useState<ClientProfile[]>([]);
  const [globalSupervisors, setGlobalSupervisors] = useState<SupervisorProfile[]>([]);


  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Forgot Password State
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'email' | 'code' | 'reset'>('email');

  // --- NEW APPLICATION WIZARD STATE ---
  const [appStep, setAppStep] = useState(1);
  const [appErrors, setAppErrors] = useState<Record<string, string>>({});
  const [quizAnswers, setQuizAnswers] = useState<number[]>(new Array(ENHANCED_PROTOCOL_QUIZ.length).fill(-1));
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | undefined>();

  const [appData, setAppData] = useState({
    // Step 1: Personal
    name: '', email: '', password: '', phone: '', nationality: '', dob: '', gender: '', qidNumber: '',
    // Step 2: Professional
    role: 'General Staff', experience: '0-1 Years', location: 'Doha',
    height: '', weight: '', shirtSize: 'M',
    languages: [] as string[],
    // Step 4: Files (Mock)
    idFile: null as File | null,
    cvFile: null as File | null,
    photoFile: null as File | null
  });

  // Restore session from cookies on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const userData = await auth.getMe();
        if (userData.success && userData.data.user) {
          setCurrentUser({
            id: userData.data.user.id,
            name: userData.data.user.name,
            email: userData.data.user.email,
            role: userData.data.user.role as UserRole,
            avatar: userData.data.user.avatar || 'https://i.pravatar.cc/150',
          });
        }
      } catch (error) {
        // Session expired or invalid, clear cookies
        console.log('No valid session found');
      }
    };
    restoreSession();
  }, []);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: 'Password strength', level: 0, color: 'bg-gray-200' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Weak', level: 1, color: 'bg-red-400' };
    if (score === 2) return { label: 'Good', level: 2, color: 'bg-amber-400' };
    return { label: 'Strong', level: 3, color: 'bg-emerald-500' };
  };

  const handleAppChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAppData({ ...appData, [e.target.name]: e.target.value });
    if (appErrors[e.target.name]) {
      setAppErrors({ ...appErrors, [e.target.name]: '' });
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (appStep > 1 && appStep < 5) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        localStorage.setItem('liywan_app_data', JSON.stringify(appData));
        localStorage.setItem('liywan_app_step', appStep.toString());
        setIsSaving(false);
        setLastSaved(new Date());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [appData, appStep]);

  // --- VALIDATION ENGINE ---
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    if (step === 1) {
      if (!appData.name.trim()) errors.name = "Full Name is required";
      if (!appData.email.includes('@')) errors.email = "Valid email is required";
      if (appData.password.length < 6) errors.password = "Password must be 6+ chars";
      if (!appData.phone) errors.phone = "Phone number is required";
      if (!appData.nationality) errors.nationality = "Nationality is required";
      if (!appData.dob) errors.dob = "Date of Birth is required";
      if (!appData.gender) errors.gender = "Gender is required";
    }

    if (step === 2) {
      if (!appData.role) errors.role = "A role must be selected";
      if (!appData.height) errors.height = "Height is required";
      if (!appData.weight) errors.weight = "Weight is required";
    }

    if (step === 3) {
      if (quizAnswers.includes(-1)) errors.quiz = "Please answer all questions to proceed";
    }

    if (step === 4) {
      if (!appData.photoFile) errors.photo = "Headshot photo is required";
      if (!appData.cvFile) errors.cv = "CV/Resume is required";
      if (!appData.idFile) errors.id = "ID Document is required";
    }

    if (Object.keys(errors).length > 0) {
      setAppErrors(errors);
      isValid = false;
    } else {
      setAppErrors({});
    }
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep(appStep)) {
      setAppStep(prev => prev + 1);
    }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsLoading(true);
    setError('');

    try {
      // Calculate Quiz Score & Details
      let score = 0;
      const quizDetails: QuizAnswer[] = [];

      quizAnswers.forEach((ans, idx) => {
        const isCorrect = ans === ENHANCED_PROTOCOL_QUIZ[idx].correctAnswer;
        if (isCorrect) score += 1;
        quizDetails.push({
          questionId: ENHANCED_PROTOCOL_QUIZ[idx].id,
          question: ENHANCED_PROTOCOL_QUIZ[idx].question,
          selectedOption: ans,
          correctOption: ENHANCED_PROTOCOL_QUIZ[idx].correctAnswer,
          isCorrect: isCorrect
        });
      });
      const finalScore = Math.round((score / ENHANCED_PROTOCOL_QUIZ.length) * 100);

      // Prepare application data for backend
      const applicationData: any = {
        name: appData.name,
        email: appData.email,
        password: appData.password, // Include password for account creation
        phone: appData.phone,
        roleApplied: appData.role,
        experience: appData.experience,
        location: appData.location,
        nationality: appData.nationality,
        dob: appData.dob ? new Date(appData.dob).toISOString() : undefined,
        gender: appData.gender as 'Male' | 'Female',
        height: appData.height,
        weight: appData.weight,
        shirtSize: appData.shirtSize,
        qidNumber: appData.qidNumber || '', // Add QID
        quizScore: finalScore,
        quizDetails: quizDetails,
        languages: appData.languages || [],
        avatar: `https://i.pravatar.cc/150?u=${appData.name}`,
      };

      // Upload files if provided (with progress tracking)
      const uploadPromises: Promise<void>[] = [];
      
      if (appData.photoFile) {
        uploadPromises.push(
          upload.single(appData.photoFile, {
            onUploadProgress: (progress) => {
              // Update UI with upload progress if needed
              console.log(`Photo upload: ${progress}%`);
            },
          })
            .then((uploadResponse) => {
              if (uploadResponse.success && uploadResponse.data?.url) {
                applicationData.avatar = uploadResponse.data.url;
              }
            })
            .catch((error) => {
              console.error('Error uploading photo:', error);
              // Keep default avatar
            })
        );
      }
      
      if (appData.cvFile) {
        uploadPromises.push(
          upload.single(appData.cvFile, {
            onUploadProgress: (progress) => {
              console.log(`CV upload: ${progress}%`);
            },
          })
            .then((uploadResponse) => {
              if (uploadResponse.success && uploadResponse.data?.url) {
                applicationData.cvUrl = uploadResponse.data.url;
              }
            })
            .catch((error) => {
              console.error('Error uploading CV:', error);
            })
        );
      }
      
      if (appData.idFile) {
        uploadPromises.push(
          upload.single(appData.idFile, {
            onUploadProgress: (progress) => {
              console.log(`ID upload: ${progress}%`);
            },
          })
            .then((uploadResponse) => {
              if (uploadResponse.success && uploadResponse.data?.url) {
                applicationData.idDocumentUrl = uploadResponse.data.url;
              }
            })
            .catch((error) => {
              console.error('Error uploading ID document:', error);
            })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Submit to backend API
      const response = await applications.create(applicationData);

      console.log('Application submission response:', response);

      // Handle different response structures
      let responseAppData = null;
      if (response && response.success && response.data) {
        responseAppData = response.data;
      } else if (response && response._id) {
        // Response is the application object directly
        responseAppData = response;
      } else if (response && response.data && response.data._id) {
        // Nested structure
        responseAppData = response.data;
      }

      if (responseAppData || (response && response.success)) {
        // Update global state - use responseAppData if available, otherwise fall back to applicationData
        const responseApp = responseAppData || {};
        const newApp: JobApplication = {
          id: responseApp._id || responseApp.id || `app-${Date.now()}`,
          name: responseApp.name || applicationData.name,
          email: responseApp.email || applicationData.email,
          phone: responseApp.phone || applicationData.phone,
          roleApplied: responseApp.roleApplied || responseApp.role || applicationData.roleApplied,
          experience: responseApp.experience || applicationData.experience,
          location: responseApp.location || applicationData.location,
          status: responseApp.status || 'Pending',
          appliedDate: responseApp.appliedDate ? (typeof responseApp.appliedDate === 'string' ? responseApp.appliedDate : new Date(responseApp.appliedDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
          avatar: responseApp.avatar || applicationData.avatar,
          nationality: responseApp.nationality || applicationData.nationality,
          dob: responseApp.dob ? (typeof responseApp.dob === 'string' ? responseApp.dob : new Date(responseApp.dob).toISOString().split('T')[0]) : applicationData.dob,
          gender: (responseApp.gender || applicationData.gender) as 'Male' | 'Female',
          height: responseApp.height || applicationData.height,
          weight: responseApp.weight || applicationData.weight,
          shirtSize: responseApp.shirtSize || applicationData.shirtSize,
          qidNumber: responseApp.qidNumber || applicationData.qidNumber,
          quizScore: responseApp.quizScore || finalScore,
          quizDetails: responseApp.quizDetails || quizDetails,
          cvUrl: responseApp.cvUrl || applicationData.cvUrl || '#',
          idDocumentUrl: responseApp.idDocumentUrl || applicationData.idDocumentUrl || '#'
        };

        setGlobalApplications([newApp, ...globalApplications]);
        setIsLoading(false);

        // Show success message with account details
        setSuccessMsg(`Application submitted successfully! Your account has been created. You can now login with your email (${appData.email}) and password.`);

        // Trigger success screen
        setAppStep(5);

        // Store email for auto-fill on login
        const savedEmail = appData.email;
        const savedPassword = appData.password;

        setTimeout(() => {
          setAuthMode('signin');
          setAppStep(1);
          // Auto-fill email for easy login
          setEmail(savedEmail);
          // Reset Form
          setAppData({
            name: '', email: '', password: '', phone: '', nationality: '', dob: '', gender: '', qidNumber: '',
            role: 'General Staff', experience: '0-1 Years', location: 'Doha',
            height: '', weight: '', shirtSize: 'M',
            idFile: null, cvFile: null, photoFile: null, languages: []
          });
          setQuizAnswers(new Array(ENHANCED_PROTOCOL_QUIZ.length).fill(-1));
          setSuccessMsg('');
        }, 5000);
      } else {
        // Handle case where response doesn't have expected structure
        const errorMsg = response?.error || response?.message || 'Failed to submit application. Invalid response from server.';
        console.error('Invalid response structure:', response);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Application submission error:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.response?.error ||
                          error?.message || 
                          'Failed to submit application. Please try again.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await auth.login(email, password);
      if (response.success && response.data.user) {
        setCurrentUser({
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          role: response.data.user.role as UserRole,
          avatar: response.data.user.avatar || 'https://i.pravatar.cc/150',
        });
        setIsLoginPage(false);
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    auth.logout();
    setCurrentUser(null);
    setIsLoginPage(false);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await auth.forgotPassword(forgotPasswordEmail);
      // Backend returns resetToken in development mode for testing
      // In production, token is sent via email link
      if (response.resetToken) {
        // Development mode: auto-fill token and go to reset step
        setResetCode(response.resetToken);
        setForgotPasswordStep('reset');
        setSuccessMsg('Reset token received. You can now set your new password.');
      } else {
        // Production mode: show instructions to enter token from email
        setSuccessMsg('If an account exists with that email, a password reset link has been sent. Please check your email and enter the reset token below.');
        setForgotPasswordStep('code');
      }
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Backend uses a 64-character hex token (32 bytes = 64 hex chars)
    // But we'll accept any reasonable length for flexibility
    if (!resetCode || resetCode.length < 10) {
      setError('Please enter a valid reset token from your email. The token should be at least 10 characters long.');
      return;
    }

    // Token is valid, proceed to reset password step
    setForgotPasswordStep('reset');
    setError('');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    if (!resetCode) {
      setError('Reset token is required.');
      return;
    }

    setIsLoading(true);

    try {
      await auth.resetPassword(resetCode, newPassword);
      setSuccessMsg(t('auth.passwordResetSuccessMessage'));
      setTimeout(() => {
        setAuthMode('signin');
        setForgotPasswordStep('email');
        setForgotPasswordEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccessMsg('');
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading fallback component for lazy-loaded portals
  const PortalLoader = React.memo(() => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-qatar animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading portal...</p>
      </div>
    </div>
  ));
  PortalLoader.displayName = 'PortalLoader';

  const renderPortal = () => {
    if (!currentUser) return null;

    return (
      <Suspense fallback={<PortalLoader />}>
        {currentUser.role === UserRole.ADMIN && (
          <AdminDashboard
            onLogout={handleLogout}
            user={currentUser}
          />
        )}
        {currentUser.role === UserRole.STAFF && (
          <StaffPortal
            onLogout={handleLogout}
            user={currentUser}
            incidents={globalIncidents}
            setIncidents={setGlobalIncidents}
            messages={globalMessages}
            setMessages={setGlobalMessages}
          />
        )}
        {currentUser.role === UserRole.SUPERVISOR && (
          <SupervisorPortal
            onLogout={handleLogout}
            user={currentUser}
            staffList={globalStaff}
            setStaffList={setGlobalStaff}
            incidents={globalIncidents}
            setIncidents={setGlobalIncidents}
            messages={globalMessages}
            setMessages={setGlobalMessages}
          />
        )}
        {currentUser.role === UserRole.CLIENT && (
          <ClientPortal onLogout={handleLogout} user={currentUser} />
        )}
      </Suspense>
    );
  };

  const openClientLogin = () => {
    setAuthMode('signin');
    setIsLoginPage(true);
  };

  const openStaffApply = () => {
    setAuthMode('signup');
    setAppStep(1);
    setIsLoginPage(true);
    setError('');
  };

  if (currentUser) {
    return (
      <ToastProvider>
        <AnimatePresence mode="wait">{renderPortal()}</AnimatePresence>
      </ToastProvider>
    );
  }

  if (!isLoginPage) {
    return (
      <ToastProvider>
        <PublicHome onClientLogin={openClientLogin} onStaffApply={openStaffApply} />
      </ToastProvider>
    );
  }

  const Confetti = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(150)].map((_, i) => (
        <div key={i} className="confetti" style={{
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 4}s`,
          animationDuration: `${2 + Math.random() * 3}s`,
          '--bg-color': ['#8A1538', '#A6264A', '#FDF2F4'][Math.floor(Math.random() * 3)]
        } as React.CSSProperties}></div>
      ))}
      <style>{`
        .confetti {
          position: absolute;
          width: 8px;
          height: 16px;
          background: var(--bg-color);
          top: -20px;
          opacity: 0;
          animation: confetti-fall 5s linear infinite;
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(${Math.random() * 720}deg); opacity: 0; }
        }
      `}</style>
    </div>
  );

  const Stepper = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center text-center">
              <motion.div
                animate={isActive || isCompleted ? "active" : "inactive"}
                variants={{
                  active: { scale: 1.05, backgroundColor: '#8A1538', color: '#FFFFFF' },
                  inactive: { scale: 1, backgroundColor: '#E5E7EB', color: '#6B7280' }
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shadow-sm"
              >
                {isCompleted ? <Check size={24} /> : stepNumber}
              </motion.div>
              <p className={`mt-1 text-[11px] font-semibold ${isActive ? 'text-qatar' : 'text-gray-400'}`}>{step}</p>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-gray-200/70 mx-2 relative">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-qatar"
                  initial={{ width: 0 }}
                  animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8F9FA] relative flex items-center justify-center font-sans p-3 sm:p-4 md:p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-24 w-80 h-80 bg-qatar/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-6rem] left-[-4rem] w-96 h-96 bg-slate-300/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_60%)]" />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={authMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="relative w-full max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_minmax(0,1.3fr)] rounded-2xl sm:rounded-3xl shadow-glass overflow-hidden bg-white/95 backdrop-blur border border-gray-100"
        >
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-white via-slate-50 to-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/80 to-slate-100/80" />
            <div className="relative z-10 space-y-6">
              <IventiaLogo className="w-20 h-20" />
              <div>
                <p className="uppercase tracking-[0.25em] text-xs text-gray-400 font-semibold mb-2">
                  <span className="text-black">LIY</span>
                  <span className="text-[#8A1538]">W</span>
                  <span className="text-black">AN</span>
                </p>
                <h1 className="text-3xl font-extrabold text-slate-900 leading-snug">
                  Where Innovation<br />Meets Service
                </h1>
                <p className="mt-3 text-sm text-slate-600 max-w-sm">
                  AI-powered event staffing built for Qatar&apos;s most demanding international events.
                  Precision assignments, real-time oversight, and world‑class hospitality.
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-8 pt-4 border-t border-white/60">
              <p className="text-xs font-semibold text-slate-500 mb-1">
                Trusted by over <span className="text-slate-900">500+ professionals</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/80?img=${i + 20}`}
                      className="w-8 h-8 rounded-full border border-white object-cover"
                      alt=""
                    />
                  ))}
                </div>
                <span className="text-[11px] text-slate-500">
                  95% satisfaction target · Enterprise-grade security
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center overflow-y-auto bg-gradient-to-b from-white/80 to-slate-50/80">
            <button
              onClick={() => setIsLoginPage(false)}
              className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 flex items-center gap-1 px-2.5 py-2 sm:py-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-600 hover:text-qatar hover:border-qatar transition-all shadow-sm hover:shadow-md z-10 text-xs font-medium touch-manipulation min-h-[36px] sm:min-h-[32px]"
            >
              <ChevronLeft size={14} />
              <span>{t('common.back')}</span>
            </button>
            <AnimatePresence mode="wait">
              {authMode === 'signin' ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="w-full max-w-md mx-auto"
                >
                  <IventiaLogo className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-3 sm:mb-4 mx-auto lg:hidden" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">{t('auth.welcomeBack')}</h2>
                  <p className="text-sm sm:text-base text-gray-500 text-center mb-4 sm:mb-6">{t('auth.signInToAccess')}</p>

                  {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{error}</p>}

                  <form onSubmit={handleLogin} className="space-y-6">
                    <Input label={t('auth.emailAddress')} type="email" icon={<Mail size={16} />} placeholder="you@liywan.qa" value={email} onChange={e => setEmail(e.target.value)} required />
                    <div className="w-full group">
                      <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-qatar transition-colors">
                        {t('auth.password')}
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-qatar transition-colors">
                          <Lock size={16} />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pl-10 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-qatar/10 focus:border-qatar transition-all shadow-sm"
                          placeholder={t('auth.passwordPlaceholder')}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgotPassword'); setError(''); setForgotPasswordStep('email'); }}
                        className="text-sm text-qatar hover:underline font-medium"
                      >
                        {t('auth.forgotPassword')}
                      </button>
                    </div>
                    <Button type="submit" className="w-full" isLoading={isLoading}>
                      {t('auth.signIn')} <ArrowRight className="ml-2" size={16} />
                    </Button>
                  </form>
                  <p className="text-center text-sm text-gray-500 mt-8">
                    {t('auth.dontHaveAccount')}{' '}
                    <button onClick={() => { setAuthMode('signup'); setError(''); }} className="font-bold text-qatar hover:underline">
                      {t('auth.applyNow')}
                    </button>
                  </p>
                </motion.div>
              ) : authMode === 'forgotPassword' ? (
                <motion.div
                  key="forgotPassword"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="w-full max-w-md mx-auto"
                >
                  <IventiaLogo className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-3 sm:mb-4 mx-auto lg:hidden" />
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">{t('auth.resetPassword')}</h2>
                  <p className="text-sm sm:text-base text-gray-500 text-center mb-4 sm:mb-6">{t('auth.forgotPasswordDescription')}</p>

                  {error && <p className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">{error}</p>}
                  {successMsg && <p className="bg-emerald-50 text-emerald-600 p-3 rounded-lg text-sm mb-4 text-center">{successMsg}</p>}

                  {forgotPasswordStep === 'email' && (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                      <Input 
                        label={t('auth.emailAddress')} 
                        type="email" 
                        icon={<Mail size={16} />} 
                        placeholder="you@liywan.qa" 
                        value={forgotPasswordEmail} 
                        onChange={e => setForgotPasswordEmail(e.target.value)} 
                        required 
                      />
                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => { setAuthMode('signin'); setError(''); setForgotPasswordEmail(''); }}
                        >
                          {t('common.back')}
                        </Button>
                        <Button type="submit" className="flex-1" isLoading={isLoading}>
                          {t('auth.sendCode')} <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>
                    </form>
                  )}

                  {forgotPasswordStep === 'code' && (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                          Please check your email for the password reset link. Copy the reset token from the link and paste it below.
                        </p>
                      </div>
                      <Input 
                        label="Reset Token" 
                        type="text" 
                        icon={<Lock size={16} />} 
                        placeholder="Paste token from email" 
                        value={resetCode} 
                        onChange={e => setResetCode(e.target.value.trim())} 
                        required 
                      />
                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => { setForgotPasswordStep('email'); setResetCode(''); setError(''); }}
                        >
                          {t('common.back')}
                        </Button>
                        <Button type="submit" className="flex-1">
                          {t('auth.submitCode')} <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>
                    </form>
                  )}

                  {forgotPasswordStep === 'reset' && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                      <div className="w-full group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-qatar transition-colors">
                          {t('auth.newPassword')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-qatar transition-colors">
                            <Lock size={16} />
                          </div>
                          <input
                            type={showNewPassword ? "text" : "password"}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pl-10 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-qatar/10 focus:border-qatar transition-all shadow-sm"
                            placeholder={t('auth.passwordPlaceholder')}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <div className="w-full group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-qatar transition-colors">
                          {t('auth.confirmPassword')}
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-qatar transition-colors">
                            <Lock size={16} />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pl-10 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-qatar/10 focus:border-qatar transition-all shadow-sm"
                            placeholder={t('auth.passwordPlaceholder')}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" className="w-full" isLoading={isLoading}>
                        {t('auth.setNewPassword')} <ArrowRight className="ml-2" size={16} />
                      </Button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                >
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 text-center">
                      Apply to join <span className="text-black">LIY</span><span className="text-[#8A1538]">W</span><span className="text-black">AN</span>
                    </h2>
                    <p className="text-gray-500 text-center text-sm mt-1">
                      4-step application: personal details, professional profile, protocol quiz, and documents.
                    </p>
                    <p className="text-[11px] text-gray-400 text-center mt-1">Estimated time to complete: ~3 minutes.</p>
                  </div>

                  {/* Wizard Steps */}
                  <form onSubmit={submitApplication} className="bg-white/80 rounded-2xl border border-gray-100 p-4 md:p-6 shadow-sm">
                    {appStep < 5 && (
                      <>
                        <ProgressIndicator
                          currentStep={appStep}
                          totalSteps={4}
                          completionPercentage={Math.round((appStep / 4) * 100)}
                        />
                        <div className="flex justify-end mb-4">
                          <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                        </div>
                        <Stepper currentStep={appStep} steps={['Personal', 'Professional', 'Quiz', 'Documents']} />
                      </>
                    )}

                    {appStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
                        <Input label="Full Name" name="name" value={appData.name} onChange={handleAppChange} error={appErrors.name} icon={<UserIcon size={16} />} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Email" name="email" type="email" value={appData.email} onChange={handleAppChange} error={appErrors.email} icon={<Mail size={16} />} />
                          <div className="space-y-1">
                            <div className="w-full group">
                              <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-qatar transition-colors">
                                Password
                              </label>
                              <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-qatar transition-colors">
                                  <Lock size={16} />
                                </div>
                                <input
                                  name="password"
                                  type={showAppPassword ? "text" : "password"}
                                  className={`w-full bg-white border ${
                                    appErrors.password ? 'border-red-500' : 'border-gray-200'
                                  } rounded-xl px-4 py-3.5 pl-10 pr-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${
                                    appErrors.password ? 'focus:ring-red-500/10 focus:border-red-500' : 'focus:ring-qatar/10 focus:border-qatar'
                                  } transition-all shadow-sm`}
                                  value={appData.password}
                                  onChange={handleAppChange}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowAppPassword(!showAppPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                  aria-label={showAppPassword ? "Hide password" : "Show password"}
                                >
                                  {showAppPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                              {appErrors.password && <p className="text-xs text-red-600 mt-1">{appErrors.password}</p>}
                            </div>
                            {(() => {
                              const strength = getPasswordStrength(appData.password);
                              const segments = [1, 2, 3];
                              return (
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex-1 flex gap-1 mr-2">
                                    {segments.map((seg) => (
                                      <div
                                        key={seg}
                                        className={`h-1.5 flex-1 rounded-full ${strength.level >= seg ? strength.color : 'bg-gray-200'
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-semibold text-gray-500">
                                    {strength.label}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        <Input label="Phone Number" name="phone" value={appData.phone} onChange={handleAppChange} error={appErrors.phone} icon={<Phone size={16} />} />
                        <Input label="QID Number" name="qidNumber" value={appData.qidNumber} onChange={handleAppChange} error={appErrors.qidNumber} placeholder="Enter your Qatar ID number" icon={<UserIcon size={16} />} />
                        <div className="grid grid-cols-2 gap-4">
                          <Input label="Nationality" name="nationality" value={appData.nationality} onChange={handleAppChange} error={appErrors.nationality} icon={<Globe size={16} />} />
                          <Input label="Date of Birth" name="dob" type="date" value={appData.dob} onChange={handleAppChange} error={appErrors.dob} />
                        </div>
                        <Select label="Gender" name="gender" value={appData.gender} onChange={handleAppChange} error={appErrors.gender} options={[{ value: '', label: 'Select...' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                        <Button type="button" onClick={handleNextStep} className="w-full">Next: Professional Details</Button>
                      </div>
                    )}

                    {appStep === 2 && (
                      <div className="space-y-6 animate-fadeIn">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">What role are you applying for?</label>
                          {appErrors.role && <p className="text-red-500 text-xs mb-2">{appErrors.role}</p>}
                          <div className="grid grid-cols-2 gap-3">
                            {['General Staff', 'Protocol', 'Hostess', 'Logistics', 'Event Coordinator'].map(role => (
                              <OptionCard key={role} title={role} icon={{ 'General Staff': <Users />, 'Protocol': <Briefcase />, 'Hostess': <Smile />, 'Logistics': <Truck />, 'Event Coordinator': <Calendar /> }[role] || <Briefcase />} selected={appData.role === role} onClick={() => setAppData({ ...appData, role })} />
                            ))}
                          </div>
                        </div>
                        <Select label="Years of Experience" name="experience" value={appData.experience} onChange={handleAppChange} options={[{ value: '0-1 Years', label: '0-1 Years' }, { value: '1-3 Years', label: '1-3 Years' }, { value: '3+ Years', label: '3+ Years' }]} />
                        <Input label="Current City" name="location" value={appData.location} onChange={handleAppChange} error={appErrors.location} icon={<MapPin size={16} />} />
                        <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                          <h4 className="font-bold text-gray-700 mb-2 text-sm">Uniform Sizing</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="Height (cm)" name="height" type="number" value={appData.height} onChange={handleAppChange} error={appErrors.height} icon={<Ruler size={16} />} />
                            <Input label="Weight (kg)" name="weight" type="number" value={appData.weight} onChange={handleAppChange} error={appErrors.weight} icon={<Scale size={16} />} />
                          </div>
                          <Select label="T-Shirt Size" name="shirtSize" value={appData.shirtSize} onChange={handleAppChange} options={[{ value: 'S', label: 'Small' }, { value: 'M', label: 'Medium' }, { value: 'L', label: 'Large' }, { value: 'XL', label: 'XL' }]} />
                        </div>
                        <Input 
                          label="Languages (comma-separated)" 
                          name="languages" 
                          value={Array.isArray(appData.languages) ? appData.languages.join(', ') : (appData.languages || '')} 
                          onChange={(e) => {
                            const langs = e.target.value.split(',').map(l => l.trim()).filter(l => l);
                            setAppData({ ...appData, languages: langs });
                          }} 
                          placeholder="e.g. Arabic, English, French" 
                          icon={<Globe size={16} />} 
                        />
                        <Button type="button" onClick={handleNextStep} className="w-full">Next: Protocol Quiz</Button>
                      </div>
                    )}

                    {appStep === 3 && (
                      <div className="space-y-6 animate-fadeIn">
                        {appErrors.quiz && <p className="text-red-500 text-xs text-center font-bold">{appErrors.quiz}</p>}
                        {ENHANCED_PROTOCOL_QUIZ.map((q, qIndex) => (
                          <div key={q.id}>
                            <p className="font-bold text-gray-900 mb-3">{q.id}. {q.question}</p>
                            <div className="space-y-3">
                              {q.options.map((opt, oIndex) => (
                                <div
                                  key={oIndex}
                                  onClick={() => {
                                    const newAns = [...quizAnswers];
                                    newAns[qIndex] = oIndex;
                                    setQuizAnswers(newAns);
                                  }}
                                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center gap-4
                                            ${quizAnswers[qIndex] === oIndex
                                      ? 'border-qatar bg-qatar-50'
                                      : 'border-gray-200 bg-white hover:bg-gray-50'}`
                                  }
                                >
                                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                                            ${quizAnswers[qIndex] === oIndex ? 'border-qatar' : 'border-gray-300'}`
                                  }>
                                    {quizAnswers[qIndex] === oIndex && <div className="w-2.5 h-2.5 bg-qatar rounded-full" />}
                                  </div>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <Button type="button" onClick={handleNextStep} className="w-full">Next: Upload Documents</Button>
                      </div>
                    )}

                    {appStep === 4 && (
                      <div className="space-y-4 animate-fadeIn">
                        <>
                          <FileUpload label="Your Headshot Photo" description="Clear, professional headshot" icon={<Camera />} isAttached={!!appData.photoFile} onFileSelect={(file) => setAppData({ ...appData, photoFile: file })} accept="image/*" />
                          {appErrors.photo && <p className="text-red-500 text-xs -mt-2 ml-2">{appErrors.photo}</p>}
                          <FileUpload label="Your CV / Resume" description="PDF or DOCX format" icon={<FileText />} isAttached={!!appData.cvFile} onFileSelect={(file) => setAppData({ ...appData, cvFile: file })} accept=".pdf,.doc,.docx" />
                          {appErrors.cv && <p className="text-red-500 text-xs -mt-2 ml-2">{appErrors.cv}</p>}
                          <FileUpload label="QID / Passport Copy" description="Must be valid" icon={<UserIcon />} isAttached={!!appData.idFile} onFileSelect={(file) => setAppData({ ...appData, idFile: file })} accept="image/*,.pdf" />
                          {appErrors.id && <p className="text-red-500 text-xs -mt-2 ml-2">{appErrors.id}</p>}
                          <Button type="submit" className="w-full" isLoading={isLoading}>Submit Application</Button>
                        </>
                      </div>
                    )}

                    {appStep === 5 && (
                      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 relative">
                        <Confetti />
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring', stiffness: 300 } }}>
                          <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto" />
                        </motion.div>
                        <h3 className="text-4xl font-extrabold text-gray-900 mt-6">
                          Welcome to <span className="text-black">LIY</span><span className="text-[#8A1538]">W</span><span className="text-black">AN</span>!
                        </h3>
                        <div className="mt-6 max-w-md mx-auto space-y-4">
                          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 p-6 rounded-xl border-2 border-emerald-200">
                            <p className="text-gray-700 font-medium mb-3">
                              {successMsg || 'Your application has been submitted successfully!'}
                            </p>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 text-left">
                              <p className="text-sm font-bold text-gray-600 mb-2">Your Account Details:</p>
                              <p className="text-xs text-gray-500 mb-1"><strong>Email:</strong> {appData.email}</p>
                              <p className="text-xs text-gray-500"><strong>Status:</strong> <span className="text-blue-600 font-bold">Account Created & Active</span></p>
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800 font-medium mb-2">📧 Check your email!</p>
                            <p className="text-xs text-blue-600">
                              We've sent you a welcome email with your account details and next steps.
                            </p>
                          </div>
                          <p className="text-sm text-gray-500">
                            You'll be redirected to the login page in a few seconds. Your email is already filled in for your convenience.
                          </p>
                        </div>
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            onClick={async () => {
                              // Auto-login attempt
                              try {
                                setIsLoading(true);
                                const response = await auth.login(appData.email, appData.password);
                                if (response.success && response.data.user) {
                                  setCurrentUser({
                                    id: response.data.user.id,
                                    name: response.data.user.name,
                                    email: response.data.user.email,
                                    role: response.data.user.role as UserRole,
                                    avatar: response.data.user.avatar || 'https://i.pravatar.cc/150',
                                  });
                                  setIsLoginPage(false);
                                  setSuccessMsg('');
                                } else {
                                  // If auto-login fails, go to login page
                                  setAuthMode('signin');
                                  setAppStep(1);
                                  setEmail(appData.email);
                                  setError('');
                                  setSuccessMsg('');
                                }
                              } catch (error: any) {
                                // If auto-login fails, go to login page
                                setAuthMode('signin');
                                setAppStep(1);
                                setEmail(appData.email);
                                setError('');
                                setSuccessMsg('');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                            className="bg-qatar hover:bg-qatar-dark text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Login Now
                          </Button>
                          <Button 
                            onClick={() => {
                              setAuthMode('signin');
                              setAppStep(1);
                              setEmail(appData.email);
                              setError('');
                              setSuccessMsg('');
                            }}
                            variant="outline"
                            className="border-qatar text-qatar"
                          >
                            Login Later
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </form>
                  {appStep < 5 && (
                    <p className="text-center text-sm text-gray-500 mt-8">
                      Already have an account?{' '}
                      <button onClick={() => { setAuthMode('signin'); setError(''); }} className="font-bold text-qatar hover:underline">
                        Sign In
                      </button>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
      </div>
    </ToastProvider>
  );
};

export default App;