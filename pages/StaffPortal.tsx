import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, MapPin, DollarSign, Calendar, User, FileText,
    ChevronRight, Bell, Upload, Download, CheckCircle, AlertCircle,
    LogOut, Briefcase, Star, Settings, Shield, PauseCircle, CreditCard, ChevronDown, Phone, Info,
    Navigation, AlertTriangle, Plus, X, Menu, Grid, List, GraduationCap, PlayCircle, Award, BookOpen, Crown, MessageSquare, Send, QrCode,
    TrendingUp, TrendingDown, BarChart3, Zap, Target, Search, Filter, Eye, Edit, Trash2, Share2, Copy, Image, Camera, Loader2, Mail
} from 'lucide-react';
import { Card, Button, Badge, Modal, Input, IventiaLogo, IventiaText, BottomNavigation } from '../components/UI';
import { ProfileStrengthMeter, XPProgress } from '../components/GamificationComponents';
import { QuickActionCards, QuickAction } from '../components/QuickActionCards';
import { Skeleton, SkeletonCard, SkeletonList, SkeletonChart } from '../components/ui/Skeleton';
import { Shift, StaffDocument, Transaction, User as AppUser, Notification, TrainingModule, Incident, Message, JobOpportunity, JobApplication } from '../types';
import { useTranslation } from '../contexts/TranslationContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { shifts as apiShifts, staff as apiStaff, incidents as apiIncidents, events as apiEvents, notifications as apiNotifications, payroll as apiPayroll, auth as apiAuth, applications as apiApplications } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { getRealtimeService, getPollingService } from '../services/realtimeService';

// --- QUIZ DATA ---
const PROTOCOL_QUIZ = [
    {
        id: 1,
        question: "A VIP guest arrives at a restricted gate without their badge. What do you do?",
        options: ["Immediately deny entry and call management.", "Allow them in because they look important.", "Politely pause them, apologize, and call your supervisor."],
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
    },
    {
        id: 6,
        question: "A guest requests a photo with a VIP. What should you do?",
        options: ["Take the photo immediately.", "Politely decline and explain photography restrictions.", "Ask the VIP for permission first."],
        correctAnswer: 2
    },
    {
        id: 7,
        question: "During an event, you notice a safety concern. What is your first action?",
        options: ["Handle it yourself.", "Immediately report to your supervisor or event management.", "Wait and see if it escalates."],
        correctAnswer: 1
    },
    {
        id: 8,
        question: "A guest complains about service quality. How do you handle it?",
        options: ["Defend the service.", "Listen actively, apologize, and escalate to supervisor.", "Ignore the complaint."],
        correctAnswer: 1
    },
    {
        id: 9,
        question: "You are assigned to a VIP area. What is the most important rule?",
        options: ["Be friendly and chatty.", "Maintain professionalism and discretion at all times.", "Take photos for social media."],
        correctAnswer: 1
    },
    {
        id: 10,
        question: "A colleague is running late for their shift. What should you do?",
        options: ["Cover for them without telling anyone.", "Inform your supervisor immediately.", "Wait and see if they show up."],
        correctAnswer: 1
    }
];


interface StaffPortalProps {
    onLogout: () => void;
    user: AppUser;
    incidents?: Incident[];
    setIncidents?: (incidents: Incident[]) => void;
    messages?: Message[];
    setMessages?: (msgs: Message[]) => void;
}

const StaffPortal: React.FC<StaffPortalProps> = ({
    onLogout, user, incidents = [], setIncidents = (_: Incident[]) => { }, messages = [], setMessages = (_: Message[]) => { }
}) => {
    const { t, isRTL } = useTranslation();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoadingShifts, setIsLoadingShifts] = useState(true);
    const [activeShiftId, setActiveShiftId] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<JobOpportunity[]>([]);
    const [eventsData, setEventsData] = useState<any[]>([]); // Store events data for job card display
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [myEventApplications, setMyEventApplications] = useState<JobApplication[]>([]); // Event applications (separate from general job applications)
    const [isLoadingEventApplications, setIsLoadingEventApplications] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [staffProfile, setStaffProfile] = useState<any>(null);

    // Documents
    const [documents, setDocuments] = useState<StaffDocument[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Note: Profile and shifts fetching moved to separate useEffect hooks below with proper auth handling
    
    // Photo Gallery
    const [galleryPhotos, setGalleryPhotos] = useState<Array<{ id: string; url: string; thumbnail: string; uploadedAt: string; caption?: string; isProfilePicture?: boolean }>>([]);
    const [isLoadingGallery, setIsLoadingGallery] = useState(false);
    const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
    const [photoUploadFile, setPhotoUploadFile] = useState<File | null>(null);
    const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
    const [isPhotoUploading, setIsPhotoUploading] = useState(false);
    const [photoCaption, setPhotoCaption] = useState('');
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const [galleryViewMode, setGalleryViewMode] = useState<'grid' | 'list'>('grid');
    
    // Profile Management
    const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
    const [isSkillsEditOpen, setIsSkillsEditOpen] = useState(false);


    // Notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const authFailedRef = useRef(false);
    const fetchingRef = useRef({ profile: false, notifications: false, shifts: false, realtime: false });
    
    // Earnings/Payroll
    const [earnings, setEarnings] = useState<any[]>([]);
    const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
    const [earningsPeriod, setEarningsPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
    
    // Event Assignments
    const [eventAssignments, setEventAssignments] = useState<any[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    // Realtime Connection Status

    // QR Check-in
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    // Profile
    const [profile, setProfile] = useState({
        ...user,
        role: 'Protocol Specialist',
        skills: [] as Array<{ name: string; status: string }>,
        certifications: [] as string[],
        avatar: user.avatar || 'https://i.pravatar.cc/150?u=staff',
        xpPoints: 0,
        level: 'Bronze',
        location: 'Doha',
        completedShifts: 0,
        onTimeRate: 100,
        rating: 5,
        profileStrength: {
            overall: 0,
            sections: {
                personal: 0,
                professional: 0,
                documents: 0,
                training: 0
            }
        },
    });

    // Fetch staff profile from API
    useEffect(() => {
        // Reset stuck flags after timeout
        const resetTimer = setTimeout(() => {
            if (fetchingRef.current.profile) {
                fetchingRef.current.profile = false;
            }
            if (authFailedRef.current) {
                authFailedRef.current = false;
            }
        }, 10000); // Reset after 10 seconds
        
        // Don't fetch if already fetching
        if (fetchingRef.current.profile) {
            return () => clearTimeout(resetTimer);
        }
        
        // Allow retry even if auth failed (might be transient)
        // if (authFailedRef.current) {
        //     return () => clearTimeout(resetTimer);
        // }

        const fetchProfile = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setIsLoadingProfile(false);
                authFailedRef.current = true;
                return;
            }

            fetchingRef.current.profile = true;
            setIsLoadingProfile(true);
            try {
                const { auth } = await import('../services/api');
                const userResponse = await auth.getMe();
                
                // Check for authentication errors
                if (!userResponse || userResponse.success === false || !userResponse.data) {
                    authFailedRef.current = true;
                    setIsLoadingProfile(false);
                    fetchingRef.current.profile = false;
                    return;
                }
                
                const userData = userResponse.data;
                
                // Get staff profile using the new /staff/me endpoint
                // Get userId from userData
                const userId = userData._id || userData.id;
                
                let staffProfile;
                try {
                    // Pass userId to getProfile to avoid 400 error
                    const staffResponse = await apiStaff.getProfile(userId);
                    staffProfile = staffResponse.data || staffResponse;
                } catch (staffError: any) {
                    // If staff profile doesn't exist (404) or user ID required (400), use user data only
                    if (staffError?.response?.status === 404 || staffError?.response?.status === 400) {
                        const errorMsg = staffError?.response?.data?.error || '';
                        if (errorMsg.includes('Staff profile not found') || errorMsg.includes('User ID is required')) {
                        staffProfile = null;
                        } else {
                            throw staffError;
                        }
                    } else if (staffError?.response?.status === 401) {
                        authFailedRef.current = true;
                        setIsLoadingProfile(false);
                        fetchingRef.current.profile = false;
                        return;
                    } else {
                        throw staffError;
                    }
                }
                
                // Get current profile state to merge with new data
                setProfile((prev) => {
                // Transform staff profile data to match frontend structure
                const transformedProfile = {
                    ...prev,
                    name: staffProfile?.name || userData.name || prev.name,
                    email: userData.email || staffProfile?.email || prev.email,
                    role: staffProfile?.role || 'General Staff',
                    skills: Array.isArray(staffProfile?.skills) 
                        ? staffProfile.skills.map((skill: any) => 
                            typeof skill === 'string' 
                                ? { name: skill, status: 'Verified' }
                                : { name: skill.name || skill, status: skill.status || 'Verified' }
                          )
                        : prev.skills,
                    certifications: Array.isArray(staffProfile?.certifications) ? staffProfile.certifications : [],
                    avatar: staffProfile?.imageUrl || userData.avatar || prev.avatar,
                    location: staffProfile?.location || 'Doha',
                    completedShifts: typeof staffProfile?.completedShifts === 'number' ? staffProfile.completedShifts : 0,
                    onTimeRate: typeof staffProfile?.onTimeRate === 'number' ? staffProfile.onTimeRate : 100,
                    rating: typeof staffProfile?.rating === 'number' ? staffProfile.rating : 5,
                    xpPoints: typeof staffProfile?.xpPoints === 'number' ? staffProfile.xpPoints : 0,
                    level: staffProfile?.level || 'Bronze',
                    // Additional fields from backend
                    nationality: staffProfile?.nationality || '',
                    dob: staffProfile?.dob || '',
                    gender: staffProfile?.gender || '',
                    height: staffProfile?.height || '',
                    weight: staffProfile?.weight || '',
                    shirtSize: staffProfile?.shirtSize || '',
                    languages: Array.isArray(staffProfile?.languages) ? staffProfile.languages : [],
                };
                
                    return transformedProfile;
                });
                
                if (staffProfile) {
                    setStaffProfile(staffProfile);
                    
                    // Transform and set documents from staff profile
                    const allDocuments: StaffDocument[] = [];
                    
                    // Add documents from staff profile
                    if (Array.isArray(staffProfile.documents)) {
                        staffProfile.documents.forEach((doc: any) => {
                            allDocuments.push({
                                id: doc._id?.toString() || doc.id || `doc-${Date.now()}-${Math.random()}`,
                            title: doc.title || 'Document',
                            type: doc.type || 'Certificate',
                            uploadDate: doc.uploadDate ? (typeof doc.uploadDate === 'string' ? doc.uploadDate : new Date(doc.uploadDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                            expiryDate: doc.expiryDate ? (typeof doc.expiryDate === 'string' ? doc.expiryDate : new Date(doc.expiryDate).toISOString().split('T')[0]) : undefined,
                            status: doc.status || 'Pending',
                            url: doc.url || '',
                            });
                        });
                    }
                    
                    setDocuments(allDocuments);
                        setIsLoadingDocuments(false);
                    
                    // Set gallery photos from staff profile
                    if (Array.isArray(staffProfile.galleryPhotos)) {
                        const transformedPhotos = staffProfile.galleryPhotos.map((photo: any) => ({
                            id: photo._id?.toString() || photo.id || `photo-${Date.now()}-${Math.random()}`,
                            url: photo.url || '',
                            thumbnail: photo.thumbnail || photo.url || '',
                            uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                            caption: photo.caption || '',
                            isProfilePicture: photo.isProfilePicture || false,
                        }));
                        setGalleryPhotos(transformedPhotos);
                    } else {
                        setGalleryPhotos([]);
                    }
                } else {
                    setDocuments([]);
                    setIsLoadingDocuments(false);
                }
                authFailedRef.current = false; // Reset on success
            } catch (error: any) {
                // Mark auth as failed to prevent retries
                if (error?.response?.status === 401) {
                    authFailedRef.current = true;
                }
                // Handle 400 errors gracefully - user might not have staff profile yet
                if (error?.response?.status === 400) {
                    const errorMessage = error?.response?.data?.error || '';
                    if (errorMessage.includes('User ID is required') || errorMessage.includes('Staff profile not found')) {
                        // User doesn't have a staff profile yet - this is okay, don't show error
                        // Keep profile with user data, just don't set staffProfile
                        setStaffProfile(null);
                        setDocuments([]);
                        setIsLoadingProfile(false);
                        setIsLoadingDocuments(false);
                        fetchingRef.current.profile = false;
                        return;
                    }
                }
                // Don't show error toast for 401 or 400 - might cause refresh loops
                if (error?.response?.status !== 401 && error?.response?.status !== 400) {
                    toast.error(error?.response?.data?.error || 'Failed to load profile');
                }
            } finally {
                setIsLoadingProfile(false);
                fetchingRef.current.profile = false;
            }
        };

        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper function to fetch and transform shifts
    const fetchAndTransformShifts = async () => {
                const shiftsResponse = await apiShifts.list({ 
                    page: 1, 
            limit: 100
                });
                
        const shiftsData = shiftsResponse.data || [];
        
        // Also fetch events to get additional event details
                const eventsResponse = await apiEvents.list({ page: 1, limit: 100 });
        const eventsData = eventsResponse.data || [];
        const eventsMap = new Map(eventsData.map((e: any) => [e.id || e._id, e]));
                
        // Transform and enhance shifts with complete event details
        const transformedShifts: Shift[] = shiftsData.map((shift: any) => {
            const event = eventsMap.get(shift.eventId?._id || shift.eventId);
            
            // Extract location from event if available
            let location = shift.location || '';
            if (!location && event?.location) {
                if (typeof event.location === 'object') {
                    location = event.location.address || event.location.city || '';
                } else {
                    location = event.location;
                }
            }
            
            // Format times properly
            const startTime = shift.startTime 
                ? (typeof shift.startTime === 'string' 
                    ? new Date(shift.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : shift.startTime)
                : '';
            const endTime = shift.endTime 
                ? (typeof shift.endTime === 'string' 
                    ? new Date(shift.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : shift.endTime)
                : '';
            
            // Format date
            const date = shift.date 
                ? (typeof shift.date === 'string' && shift.date.includes('T')
                    ? shift.date.split('T')[0]
                    : shift.date)
                : (shift.startTime 
                    ? new Date(shift.startTime).toISOString().split('T')[0]
                    : new Date().toISOString().split('T')[0]);
                    
                    return {
                        id: shift._id || shift.id,
                        eventId: shift.eventId?._id || shift.eventId || '',
                eventTitle: shift.eventTitle || shift.eventId?.title || event?.title || 'Event',
                location: location || 'TBA',
                startTime: startTime,
                endTime: endTime,
                date: date,
                status: shift.status || 'Scheduled',
                        confirmationStatus: shift.confirmationStatus || 'Confirmed',
                wage: shift.wage || 0,
                        attire: shift.attire || 'Formal Attire',
                        contactPerson: shift.contactPerson || 'Event Coordinator',
                        contactPhone: shift.contactPhone || '+974 4400 0000',
                        instructions: shift.instructions || event?.description || 'Please report 30 minutes prior for briefing.',
                        role: shift.role || 'General Staff',
                attendanceStatus: shift.attendanceStatus,
                checkInTime: shift.checkInTime 
                    ? (typeof shift.checkInTime === 'string' 
                        ? new Date(shift.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : shift.checkInTime)
                    : undefined,
                checkOutTime: shift.checkOutTime 
                    ? (typeof shift.checkOutTime === 'string' 
                        ? new Date(shift.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                        : shift.checkOutTime)
                    : undefined,
                        uniformVerified: shift.uniformVerified || false,
                    };
                });

        // Sort by date (upcoming first), then by start time
                transformedShifts.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) {
                    return dateA - dateB;
            }
            // If same date, sort by start time
            const timeA = a.startTime || '';
            const timeB = b.startTime || '';
            return timeA.localeCompare(timeB);
        });
        
        return transformedShifts;
    };

    // Fetch shifts from shifts API
    useEffect(() => {
        // Don't fetch if auth already failed or already fetching
        if (authFailedRef.current || fetchingRef.current.shifts) {
            setIsLoadingShifts(false);
            return;
        }

        const fetchShifts = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                authFailedRef.current = true;
                setIsLoadingShifts(false);
                return;
            }

            fetchingRef.current.shifts = true;
            setIsLoadingShifts(true);
            try {
                // Fetch and transform shifts
                const transformedShifts = await fetchAndTransformShifts();
                setShifts(transformedShifts);
                
                // Set active shift if any shift is Live (in progress)
                const activeShift = transformedShifts.find(s => s.status === 'Live');
                if (activeShift) {
                    setActiveShiftId(activeShift.id);
                }
            } catch (error: any) {
                if (error?.response?.status === 401) {
                    authFailedRef.current = true;
                }
                // Handle 400/404 errors gracefully - user might not have shifts or staff profile yet
                if (error?.response?.status === 400 || error?.response?.status === 404) {
                    const errorMessage = error?.response?.data?.error || '';
                    if (errorMessage.includes('User ID is required') || 
                        errorMessage.includes('Staff profile not found') ||
                        errorMessage.includes('not found')) {
                        // User doesn't have a staff profile yet - set empty shifts
                        setShifts([]);
                        setIsLoadingShifts(false);
                        fetchingRef.current.shifts = false;
                        return;
                    }
                }
                // For other errors, set empty shifts array to prevent UI errors
                setShifts([]);
            } finally {
                setIsLoadingShifts(false);
                fetchingRef.current.shifts = false;
            }
        };

        fetchShifts();
        
        // Only set up interval if auth hasn't failed - and use a longer interval
        let interval: NodeJS.Timeout | null = null;
        if (!authFailedRef.current && !fetchingRef.current.shifts) {
            interval = setInterval(() => {
                if (!authFailedRef.current && !fetchingRef.current.shifts) {
                    fetchShifts();
                } else {
                    if (interval) {
                        clearInterval(interval);
                    }
                }
            }, 300000); // Refresh every 5 minutes (increased significantly to prevent loops)
        }
        
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch notifications from API
    useEffect(() => {
        // Don't fetch if auth failed or already fetching
        if (authFailedRef.current || fetchingRef.current.notifications) {
            return;
        }

        const fetchNotifications = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                authFailedRef.current = true;
                return;
            }

            fetchingRef.current.notifications = true;
            setIsLoadingNotifications(true);
            try {
                const response = await apiNotifications.list({ page: 1, limit: 50 });
                const notificationsData = response.data?.data || response.data || [];
                
                const transformedNotifications: Notification[] = notificationsData.map((n: any) => ({
                    id: n._id || n.id || `notif-${Date.now()}-${Math.random()}`,
                    title: n.title || 'Notification',
                    message: n.message || n.body || '',
                    type: n.type || (n.priority === 'high' ? 'error' : n.priority === 'medium' ? 'warning' : 'info'),
                    timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : (n.timestamp ? new Date(n.timestamp).toLocaleString() : new Date().toLocaleString()),
                    isRead: n.isRead || n.read || false,
                    category: n.category || n.type || 'General',
                }));
                
                setNotifications(transformedNotifications);
            } catch (error: any) {
                if (error?.response?.status === 401) {
                    authFailedRef.current = true;
                } else {
                    toast.error(error?.response?.data?.error || 'Failed to load notifications');
                }
            } finally {
                setIsLoadingNotifications(false);
                fetchingRef.current.notifications = false;
            }
        };

        fetchNotifications();
        
        // Set up real-time notifications (only if authenticated) - DISABLED to prevent loops
        // const setupRealtimeNotifications = async () => {
        //     // Don't set up if auth already failed or already setting up
        //     if (authFailedRef.current || fetchingRef.current.realtime) {
        //         return;
        //     }

        //     const token = localStorage.getItem('auth_token');
        //     if (!token) {
        //         authFailedRef.current = true;
        //         return; // No token, skip real-time setup
        //     }
            
        //     fetchingRef.current.realtime = true;
        //     try {
        //         const { auth } = await import('../services/api');
        //         const userResponse = await auth.getMe();
                
        //         // Check if response indicates authentication failure
        //         if (!userResponse || !userResponse.data || userResponse.success === false) {
        //             console.warn('Authentication failed, skipping real-time notifications setup');
        //             authFailedRef.current = true;
        //             fetchingRef.current.realtime = false;
        //             return;
        //         }
                
        //         const userId = userResponse.data?._id || userResponse.data?.id;
                
        //         if (userId) {
        //             const realtimeService = getRealtimeService();
        //             const pollingService = getPollingService();
                    
        //             // Try WebSocket first, fallback to polling
        //             if (realtimeService) {
        //                 try {
        //                     realtimeService.connect();
        //                     realtimeService.onNotification((notification: any) => {
        //                         const newNotification: Notification = {
        //                             id: notification.id || `notif-${Date.now()}`,
        //                             title: notification.title || 'Notification',
        //                             message: notification.message || '',
        //                             type: notification.type || 'info',
        //                             timestamp: notification.timestamp || new Date().toLocaleString(),
        //                             isRead: notification.isRead || false,
        //                             category: notification.category || 'General',
        //                         };
        //                         setNotifications(prev => [newNotification, ...prev]);
        //                         toast.info(newNotification.title);
        //                     });
        //                 } catch (wsError) {
        //                     console.error('WebSocket connection failed:', wsError);
        //                 }
        //             } else if (pollingService) {
        //                 try {
        //                     pollingService.startPolling(() => fetchNotifications(), 30000);
        //                 } catch (pollError) {
        //                     console.error('Polling service failed:', pollError);
        //                 }
        //             }
        //         }
        //     } catch (error: any) {
        //         // Silently handle auth errors - don't spam console or cause refreshes
        //         if (error?.response?.status === 401) {
        //             console.warn('Unauthorized - skipping real-time notifications setup');
        //             authFailedRef.current = true;
        //         } else {
        //             console.error('Failed to set up real-time notifications:', error);
        //         }
        //     } finally {
        //         fetchingRef.current.realtime = false;
        //     }
        // };
        
        // DISABLED real-time setup to prevent loops
        // const token = localStorage.getItem('auth_token');
        // if (token && !authFailedRef.current && !fetchingRef.current.realtime) {
        //     setupRealtimeNotifications();
        // }
        
        // DISABLED polling to prevent loops
        // let interval: NodeJS.Timeout | null = null;
        // if (!authFailedRef.current && !fetchingRef.current.notifications) {
        //     interval = setInterval(() => {
        //         if (!authFailedRef.current && !fetchingRef.current.notifications) {
        //             fetchNotifications();
        //         } else {
        //             if (interval) {
        //                 clearInterval(interval);
        //             }
        //         }
        //     }, 60000); // Refresh every 60 seconds
        // }
        
        return () => {
            // Cleanup disabled
            try {
                const realtimeService = getRealtimeService();
                if (realtimeService) {
                    realtimeService.disconnect();
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    // Fetch earnings/payroll
    useEffect(() => {
        // Don't fetch if auth failed
        if (authFailedRef.current || activeTab !== 'earnings') {
            return;
        }

        const fetchEarnings = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                authFailedRef.current = true;
                return;
            }

            setIsLoadingEarnings(true);
            try {
                // Fetch earnings using the /me endpoint - backend handles staff profile lookup
                const response = await apiPayroll.getEarnings({ 
                    page: 1, 
                    limit: 100
                });
                
                const earningsData = response.data || [];
                // Data is already transformed by transformPayroll in api.ts
                // Sort by date (most recent first), then by status
                const sortedEarnings = earningsData.sort((a: any, b: any) => {
                    const dateA = new Date(a.shiftDate || a.eventDate || '').getTime();
                    const dateB = new Date(b.shiftDate || b.eventDate || '').getTime();
                    if (dateA !== dateB) {
                        return dateB - dateA; // Most recent first
                    }
                    // If same date, sort by status (PAID first, then PENDING)
                    const statusOrder = { 'PAID': 1, 'PENDING': 2, 'Unpaid': 2, 'Processing': 2 };
                    return (statusOrder[a.status as keyof typeof statusOrder] || 3) - (statusOrder[b.status as keyof typeof statusOrder] || 3);
                });
                setEarnings(sortedEarnings);
            } catch (error: any) {
                if (error?.response?.status === 401) {
                    authFailedRef.current = true;
                } else if (error?.response?.status === 404 || error?.response?.status === 400) {
                    // Staff profile not found or no earnings yet - set empty array
                    const errorMessage = error?.response?.data?.error || '';
                    if (errorMessage.includes('Staff profile not found') || errorMessage.includes('not found')) {
                        setEarnings([]);
                        setIsLoadingEarnings(false);
                        return;
                    }
                }
                // Don't show error toast for expected cases
                if (error?.response?.status !== 401 && error?.response?.status !== 404 && error?.response?.status !== 400) {
                    toast.error(error?.response?.data?.error || 'Failed to load earnings');
                }
            } finally {
                setIsLoadingEarnings(false);
            }
        };

        fetchEarnings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Fetch event assignments
    useEffect(() => {
        // Don't fetch if auth failed
        if (authFailedRef.current || activeTab !== 'assignments') {
            return;
        }

        const fetchAssignments = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                authFailedRef.current = true;
                return;
            }

            setIsLoadingAssignments(true);
            try {
                // First get user info to get userId
                const userResponse = await apiAuth.getMe();
                if (!userResponse || !userResponse.success || !userResponse.data) {
                    // No user data available - set empty assignments
                    setEventAssignments([]);
                    setIsLoadingAssignments(false);
                    return;
                }
                
                const userData = userResponse.data;
                const userId = userData._id || userData.id || userData.userId;
                
                if (!userId) {
                    // User ID not found - set empty assignments gracefully
                    setEventAssignments([]);
                    setIsLoadingAssignments(false);
                    return;
                }
                
                // Get staff profile to get staffId
                let staffId: string | null = null;
                try {
                    const staffResponse = await apiStaff.getProfile(userId);
                    const staffProfile = staffResponse.data || staffResponse;
                    staffId = staffProfile?.id || staffProfile?._id || null;
                } catch (staffError: any) {
                    // Staff profile might not exist yet - that's okay
                }
                
                if (!staffId) {
                    // User doesn't have a staff profile yet - set empty assignments
                    setEventAssignments([]);
                    setIsLoadingAssignments(false);
                    return;
                }
                
                // Fetch all events - backend will include assignments
                const eventsResponse = await apiEvents.list({ page: 1, limit: 100 });
                const eventsData = eventsResponse.data || [];
                const assignments: any[] = [];
                
                // Find assignments for this staff member and enhance with complete event details
                eventsData.forEach((event: any) => {
                    const eventAssignments = event.assignments || [];
                    const myAssignment = eventAssignments.find((a: any) => {
                        // Handle different assignment structures
                        const assignmentStaffId = a.staffId?._id || a.staffId?.id || a.staffId || a.staff;
                        return assignmentStaffId?.toString() === staffId.toString();
                    });
                    
                    if (myAssignment) {
                        // Extract payment information
                        const payment = myAssignment.payment || {};
                        // Normalize payment type to lowercase (backend uses lowercase)
                        const paymentType = (payment.type || 'hourly').toLowerCase();
                        const totalPayment = payment.totalPayment || 0;
                        
                        // Extract and format location
                        let location = '';
                        if (event.location) {
                            if (typeof event.location === 'object') {
                                location = event.location.address || event.location.city || event.location.name || '';
                            } else {
                                location = event.location;
                            }
                        }
                        
                        // Format dates and times
                        const startDate = event.startAt ? new Date(event.startAt) : null;
                        const endDate = event.endAt ? new Date(event.endAt) : null;
                        const eventDate = startDate ? startDate.toISOString().split('T')[0] : '';
                        const startTime = startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                        const endTime = endDate ? endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
                        
                        // Format assigned date
                        const assignedDate = myAssignment.assignedAt 
                            ? (typeof myAssignment.assignedAt === 'string' 
                                ? new Date(myAssignment.assignedAt).toISOString()
                                : new Date(myAssignment.assignedAt).toISOString())
                            : new Date().toISOString();
                        
                        assignments.push({
                            id: myAssignment._id || myAssignment.id || `assignment-${Date.now()}-${Math.random()}`,
                            role: myAssignment.role || 'General Staff',
                            status: myAssignment.status || 'PENDING',
                            assignedAt: assignedDate,
                            payment: {
                                type: paymentType,
                                hourlyRate: payment.hourlyRate || 0,
                                totalHours: payment.totalHours || 0,
                                fixedAmount: payment.fixedAmount || 0,
                                dailyRate: payment.dailyRate || 0,
                                totalDays: payment.totalDays || 0,
                                overtimeRate: payment.overtimeRate || 0,
                                overtimeHours: payment.overtimeHours || 0,
                                bonus: payment.bonus || 0,
                                deductions: payment.deductions || 0,
                                transportationAllowance: payment.transportationAllowance || 0,
                                mealAllowance: payment.mealAllowance || 0,
                                totalPayment: totalPayment,
                                notes: payment.notes || '',
                            },
                            event: {
                                id: event._id || event.id,
                                title: event.title || 'Event',
                                location: location || 'TBA',
                                startAt: event.startAt,
                                endAt: event.endAt,
                                date: eventDate,
                                startTime: startTime,
                                endTime: endTime,
                                description: event.description || '',
                                status: event.status || 'PENDING',
                                imageUrl: event.imageUrl,
                                staffRequired: event.staffRequired || 0,
                                staffAssigned: event.staffAssigned || 0,
                            },
                            ...myAssignment, // Include any additional fields
                        });
                    }
                });
                
                // Sort by event date (upcoming first), then by assigned date (most recent first)
                assignments.sort((a, b) => {
                    // First sort by event date
                    const eventDateA = a.event?.date || a.event?.startAt || '';
                    const eventDateB = b.event?.date || b.event?.startAt || '';
                    if (eventDateA && eventDateB) {
                        const dateA = new Date(eventDateA).getTime();
                        const dateB = new Date(eventDateB).getTime();
                        if (dateA !== dateB) {
                            return dateA - dateB; // Upcoming events first
                        }
                    }
                    // If same event date, sort by assigned date (most recent first)
                    const dateA = new Date(a.assignedAt).getTime();
                    const dateB = new Date(b.assignedAt).getTime();
                    return dateB - dateA;
                });
                
                setEventAssignments(assignments);
            } catch (error: any) {
                
                // Handle different error cases gracefully
                if (error?.response?.status === 401) {
                    authFailedRef.current = true;
                } else if (error?.response?.status === 404 || error?.response?.status === 400) {
                    // Staff profile not found or no assignments - set empty array
                    const errorMessage = error?.response?.data?.error || error?.message || '';
                    if (errorMessage.includes('Staff profile not found') || 
                        errorMessage.includes('not found') || 
                        errorMessage.includes('User ID not found')) {
                        setEventAssignments([]);
                        setIsLoadingAssignments(false);
                        return;
                    }
                } else if (error?.message?.includes('User ID not found')) {
                    // User ID not found - set empty assignments gracefully
                    setEventAssignments([]);
                    setIsLoadingAssignments(false);
                    return;
                }
                
                // Don't show error toast for expected cases
                if (error?.response?.status !== 401 && 
                    error?.response?.status !== 404 && 
                    error?.response?.status !== 400 &&
                    !error?.message?.includes('User ID not found')) {
                    toast.error(error?.response?.data?.error || error?.message || 'Failed to load event assignments');
                } else {
                    // For expected errors, just set empty assignments
                    setEventAssignments([]);
                }
            } finally {
                setIsLoadingAssignments(false);
            }
        };

        fetchAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Fetch job opportunities from events API
    useEffect(() => {
        const fetchJobs = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setIsLoadingJobs(false);
                return;
            }

            setIsLoadingJobs(true);
            try {
                // Get user and staff profile to filter out already assigned events
                const userResponse = await apiAuth.getMe();
                if (!userResponse.success || !userResponse.data) {
                    throw new Error('Failed to get user information');
                }
                const userData = userResponse.data;
                const userId = userData._id || userData.id;
                
                let staffId: string | null = null;
                if (userId) {
                    try {
                        const staffResponse = await apiStaff.getProfile(userId);
                        const staffProfile = staffResponse.data || staffResponse;
                        staffId = staffProfile?.id || staffProfile?._id || null;
                    } catch (error) {
                        // Staff profile might not exist yet, that's okay
                    }
                }
                
                // Fetch events with status APPROVED only - no other conditions
                const eventsResponse = await apiEvents.list({ 
                    page: 1, 
                    limit: 100,
                    status: 'APPROVED'
                });
                
                // Transform events to job opportunities
                // Check response structure - it might be response.data.data or response.data
                const eventsData = (eventsResponse.success && eventsResponse.data) 
                    ? (Array.isArray(eventsResponse.data) ? eventsResponse.data : [])
                    : [];
                
                setEventsData(eventsData); // Store events data for job card display
                const transformedJobs: JobOpportunity[] = [];
                
                // Initialize tracking variables for logging
                let eventsProcessed = 0;
                let eventsSkipped = 0;
                const eventsSkippedReasons: { [key: string]: number } = {};
                
                // Get applied event IDs to filter them out
                // Backend returns eventId as string and eventIdObject with populated event data
                const appliedEventIds = new Set(
                    myEventApplications
                        .map((app: any) => {
                            // Try multiple ways to get eventId (backend may return it in different formats)
                            const eventId = app.eventId?.toString() || 
                                          app.eventId || 
                                          app.eventIdObject?._id?.toString() || 
                                          app.eventIdObject?.id?.toString() || 
                                          app.eventIdObject?.id ||
                                          null;
                            return eventId;
                        })
                        .filter((id: any) => id)
                );
                
                // Process all APPROVED events - no date or assignment filtering
                eventsData.forEach((event: any) => {
                    eventsProcessed++;
                    
                    // Skip events that staff has already applied to
                    // Normalize event ID for comparison (handle both string and ObjectId formats)
                    const eventId = (event.id || event._id)?.toString();
                    const normalizedEventId = eventId ? eventId.toString() : null;
                    
                    if (normalizedEventId && appliedEventIds.has(normalizedEventId)) {
                        eventsSkipped++;
                        eventsSkippedReasons['already_applied'] = (eventsSkippedReasons['already_applied'] || 0) + 1;
                        return;
                    }
                    
                    // Get dates - use date field if startAt/endAt not available
                    const startDate = event.startAt ? new Date(event.startAt) : (event.date ? new Date(event.date) : new Date());
                    const endDate = event.endAt ? new Date(event.endAt) : (event.date ? new Date(event.date) : new Date());
                    
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const durationHours = Math.round(durationMs / (1000 * 60 * 60));
                    
                    // Extract location - handle both object and string formats
                    let location = '';
                    const eventLocation = (event as any).location;
                    if (eventLocation) {
                        if (typeof eventLocation === 'object') {
                            location = eventLocation.address || eventLocation.city || eventLocation || '';
                        } else {
                            location = eventLocation;
                        }
                    }
                    
                    // Calculate spots for each role
                    let requiredRoles = event.requiredRoles || {};
                    
                    // Handle Map conversion if needed
                    if (requiredRoles instanceof Map) {
                        requiredRoles = Object.fromEntries(requiredRoles);
                    } else if (typeof requiredRoles === 'object' && !Array.isArray(requiredRoles)) {
                        requiredRoles = { ...requiredRoles };
                    } else {
                        requiredRoles = {};
                    }
                    
                    const assignments = event.assignments || [];
                    
                    // If no requiredRoles but has staffRequired, create default role
                    if (!requiredRoles || Object.keys(requiredRoles).length === 0) {
                        const staffRequired = (event as any).staffRequired || 0;
                        if (staffRequired > 0) {
                            requiredRoles = {
                                'General Staff': staffRequired
                            };
                        } else {
                            eventsSkipped++;
                            eventsSkippedReasons['no_required_roles'] = (eventsSkippedReasons['no_required_roles'] || 0) + 1;
                            return; // Skip events without required roles
                        }
                    }
                    
                    // Count filled spots per role (only count APPROVED assignments)
                    const filledByRole: { [key: string]: number } = {};
                    assignments.forEach((a: any) => {
                        if (a.status === 'APPROVED' || a.status === 'CONFIRMED') {
                            const role = a.role || 'General Staff';
                            filledByRole[role] = (filledByRole[role] || 0) + 1;
                        }
                    });
                    
                    // Create job opportunities for each role that has available spots
                    let jobsCreatedForEvent = 0;
                    Object.keys(requiredRoles).forEach((roleName) => {
                        const requiredCount = requiredRoles[roleName] || 0;
                        const filledCount = filledByRole[roleName] || 0;
                        const spotsLeft = requiredCount - filledCount;
                        
                        if (spotsLeft > 0) {
                            // Calculate average payment rate from assignments for this role
                            const roleAssignments = assignments.filter((a: any) => 
                                (a.role || 'General Staff') === roleName && a.status === 'APPROVED'
                            );
                            
                            let avgRate = 500; // Default rate
                            if (roleAssignments.length > 0) {
                                const totalPayment = roleAssignments.reduce((sum: number, a: any) => 
                                    sum + (a.payment?.totalPayment || 0), 0
                                );
                                avgRate = Math.round(totalPayment / roleAssignments.length);
                            } else if (assignments.length > 0) {
                                // Fallback: use average from all assignments
                                const totalPayment = assignments.reduce((sum: number, a: any) => 
                                    sum + (a.payment?.totalPayment || 0), 0
                                );
                                avgRate = Math.round(totalPayment / assignments.length);
                            }
                            
                            // Format date and time - handle both date and startAt/endAt formats
                            let eventDate = '';
                            if ((event as any).date) {
                                eventDate = (event as any).date;
                            } else if (startDate) {
                                eventDate = startDate.toISOString().split('T')[0];
                            }
                            
                            const startTime = startDate ? startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBA';
                            const endTime = endDate ? endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBA';
                            
                            const job = {
                                id: `${event.id || event._id}-${roleName}`,
                                eventId: event.id || event._id,
                                title: event.title || 'Event',
                        role: roleName,
                                date: eventDate,
                                time: `${startTime} - ${endTime}`,
                                location: location || 'TBA',
                                rate: avgRate,
                                requirements: Object.keys(requiredRoles),
                        spotsOpen: spotsLeft,
                                isVIP: event.isVIP || event.notes?.isVIP || false,
                    };
                            
                            transformedJobs.push(job);
                            jobsCreatedForEvent++;
                        } else {
                            // All spots filled for this role
                        }
                    });
                    
                    if (jobsCreatedForEvent === 0) {
                        eventsSkipped++;
                        eventsSkippedReasons['all_spots_filled'] = (eventsSkippedReasons['all_spots_filled'] || 0) + 1;
                    }
                });

                // Sort by date (upcoming first)
                transformedJobs.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    return dateA - dateB;
                });

                setJobs(transformedJobs);
            } catch (error) {
                setJobs([]);
            } finally {
                setIsLoadingJobs(false);
            }
        };

        fetchJobs();
        const interval = setInterval(fetchJobs, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [myEventApplications]); // Re-fetch when event applications change

    // Fetch my event applications (for job board) - properly integrated with backend
    useEffect(() => {
        const fetchMyEventApplications = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setIsLoadingEventApplications(false);
                return;
            }

            setIsLoadingEventApplications(true);
            try {
                // Fetch applications from backend - backend filters by staffId
                const applicationsResponse = await apiApplications.getMyApplications({ 
                    page: 1, 
                    limit: 100 
                });
                
                const allApplications = applicationsResponse.data || [];
                
                // Filter only applications with eventId (event job applications)
                // Backend returns eventId as string and eventIdObject as populated object
                const eventApplications = allApplications.filter((app: any) => {
                    const hasEventId = app.eventId || app.eventIdObject;
                    if (hasEventId) {
                        console.log('✅ Found event application:', {
                            id: app.id,
                            eventId: app.eventId,
                            eventIdObject: app.eventIdObject,
                            eventTitle: app.eventIdObject?.title,
                            status: app.status,
                            roleApplied: app.roleApplied
                        });
                    }
                    return hasEventId;
                });
                
                console.log('📋 Event applications filtered:', eventApplications.length);
                setMyEventApplications(eventApplications);
            } catch (error) {
                console.error('❌ Failed to fetch event applications:', error);
                setMyEventApplications([]);
            } finally {
                setIsLoadingEventApplications(false);
            }
        };

        fetchMyEventApplications();
        const interval = setInterval(fetchMyEventApplications, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []); // Run on mount and refresh
    
    // Also refresh event applications when switching to jobs tab
    useEffect(() => {
        if (activeTab === 'jobs') {
            const refreshEventApplications = async () => {
                const token = localStorage.getItem('auth_token');
                if (!token) return;
                
                try {
                    console.log('🔄 Refreshing event applications for jobs tab...');
                    const applicationsResponse = await apiApplications.getMyApplications({ 
                        page: 1, 
                        limit: 100 
                    });
                    
                    const allApplications = applicationsResponse.data || [];
                    const eventApplications = allApplications.filter((app: any) => {
                        return app.eventId || app.eventIdObject;
                    });
                    
                    setMyEventApplications(eventApplications);
                } catch (error) {
                    // Error refreshing event applications
                }
            };
            
            refreshEventApplications();
        }
    }, [activeTab]); // Refresh when switching to jobs tab

    // Fetch my applications
    useEffect(() => {
        const fetchMyApplications = async () => {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setIsLoadingApplication(false);
                return;
            }

            setIsLoadingApplication(true);
            try {
                console.log('🔍 Fetching my applications...');
                
                // Fetch applications using the /me endpoint - backend handles filtering
                const applicationsResponse = await apiApplications.getMyApplications({ 
                    page: 1, 
                    limit: 100 
                });
                
                console.log('📋 Applications response:', applicationsResponse);
                console.log('📋 Applications data:', applicationsResponse.data);
                
                const myApplications = applicationsResponse.data || [];
                console.log('📋 My applications count:', myApplications.length);
                console.log('📋 My applications:', myApplications);
                
                // Get the most recent application (or the one with highest priority status)
                if (myApplications.length > 0) {
                    console.log('✅ Found applications, processing...');
                    
                    // Sort by status priority and date
                    const statusPriority: { [key: string]: number } = {
                        'Pending': 1,
                        'Interview': 2,
                        'Approved': 3,
                        'Rejected': 0
                    };
                    
                    myApplications.sort((a: any, b: any) => {
                        const aPriority = statusPriority[a.status] || 0;
                        const bPriority = statusPriority[b.status] || 0;
                        if (aPriority !== bPriority) {
                            return bPriority - aPriority; // Higher priority first
                        }
                        // If same priority, most recent first
                        const aDate = new Date(a.appliedDate || a.createdAt || 0).getTime();
                        const bDate = new Date(b.appliedDate || b.createdAt || 0).getTime();
                        return bDate - aDate;
                    });
                    
                    const latestApp = myApplications[0];
                    console.log('📝 Latest application (full object):', JSON.stringify(latestApp, null, 2));
                    console.log('📝 Event ID:', latestApp.eventId);
                    console.log('📝 Event ID Object:', latestApp.eventIdObject);
                    console.log('📝 All keys in latestApp:', Object.keys(latestApp));
                    
                    // Fetch event details if eventId is available
                    let event: any = {};
                    
                    // Check multiple possible eventId locations - be more thorough
                    let eventId: string | null = null;
                    
                    // First check eventIdObject (populated event from backend)
                    if (latestApp.eventIdObject) {
                        eventId = latestApp.eventIdObject._id || latestApp.eventIdObject.id || null;
                        if (eventId) {
                            event = latestApp.eventIdObject;
                            console.log('✅ Using eventIdObject:', event);
                        }
                    }
                    
                    // If not found, check eventId field (could be string, object, or populated)
                    if (!eventId && latestApp.eventId) {
                        if (typeof latestApp.eventId === 'string') {
                            eventId = latestApp.eventId;
                        } else if (typeof latestApp.eventId === 'object') {
                            eventId = latestApp.eventId._id || latestApp.eventId.id || null;
                            if (latestApp.eventId.title) {
                                // It's a populated object, use it directly
                                event = latestApp.eventId;
                                console.log('✅ Using populated eventId object:', event);
                            }
                        }
                    }
                    
                    console.log('🔍 Final Event ID extracted:', eventId);
                    console.log('🔍 Event object so far:', event);
                    
                    if (eventId) {
                        try {
                            const eventResponse = await apiEvents.get(eventId);
                            event = eventResponse.data || {};
                            console.log('📅 Event object fetched:', event);
                        } catch (error) {
                            console.warn('Could not fetch event details:', error);
                            // Try to use the populated event object if available
                            if (latestApp.eventIdObject) {
                                event = latestApp.eventIdObject;
                                console.log('📅 Using populated event object:', event);
                            } else {
                                event = {};
                            }
                        }
                    } else if (latestApp.eventIdObject) {
                        // Use the populated event object directly
                        event = latestApp.eventIdObject;
                        console.log('📅 Using populated event object (no ID):', event);
                    }
                    
                    const eventLocation = typeof event.location === 'object' 
                        ? (event.location?.address || event.location?.city || '')
                        : (event.location || '');
                    const eventDate = event.startAt ? new Date(event.startAt).toISOString().split('T')[0] : '';
                    const eventStartTime = event.startAt ? new Date(event.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
                    const eventEndTime = event.endAt ? new Date(event.endAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
                    
                    // Get user data for fallbacks
                    let userData: any = {};
                    try {
                        const userResponse = await apiAuth.getMe();
                        userData = userResponse.data || {};
                    } catch (error) {
                        console.warn('Could not get user data for application:', error);
                    }
                    
                    // Transform to match JobApplication interface
                    const transformedApp: JobApplication = {
                        id: latestApp._id || latestApp.id,
                        name: latestApp.name || userData.name || '',
                        email: latestApp.email || userData.email || '',
                        phone: latestApp.phone || '',
                        roleApplied: latestApp.roleApplied || '',
                        experience: latestApp.experience || '',
                        location: latestApp.location || 'Doha',
                        status: latestApp.status || 'Pending',
                        appliedDate: latestApp.appliedDate || (latestApp.createdAt ? new Date(latestApp.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                        avatar: latestApp.avatar || latestApp.imageUrl || userData.avatar || profile?.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(latestApp.name || 'user')}`,
                        languages: Array.isArray(latestApp.languages) ? latestApp.languages : (typeof latestApp.languages === 'string' ? latestApp.languages.split(',').map(l => l.trim()) : []),
                        quizScore: latestApp.quizScore || 0,
                        quizDetails: Array.isArray(latestApp.quizDetails) ? latestApp.quizDetails : [],
                        interviewDate: latestApp.interviewDate ? (typeof latestApp.interviewDate === 'string' ? latestApp.interviewDate : new Date(latestApp.interviewDate).toISOString().split('T')[0]) : undefined,
                        interviewTime: latestApp.interviewTime || undefined,
                        interviewLocation: latestApp.interviewLocation || undefined,
                        interviewer: latestApp.interviewer || undefined,
                        meetingLink: latestApp.meetingLink || undefined,
                        interviewNotes: latestApp.interviewNotes || undefined,
                        interviewType: latestApp.interviewType || undefined,
                        nationality: latestApp.nationality || undefined,
                        dob: latestApp.dob || undefined,
                        gender: latestApp.gender || undefined,
                        height: latestApp.height || undefined,
                        weight: latestApp.weight || undefined,
                        shirtSize: latestApp.shirtSize || undefined,
                        cvUrl: latestApp.cvUrl || undefined,
                        idDocumentUrl: latestApp.idDocumentUrl || undefined,
                        // Add event details
                        eventId: latestApp.eventId?._id || latestApp.eventId?.id || latestApp.eventId || undefined,
                        eventTitle: event.title || undefined,
                        eventDate: eventDate || undefined,
                        eventStartTime: eventStartTime || undefined,
                        eventEndTime: eventEndTime || undefined,
                        eventLocation: eventLocation || undefined,
                        eventDescription: event.description || undefined,
                        eventStatus: event.status || undefined,
                        eventImageUrl: event.imageUrl || undefined,
                    };
                    
                    console.log('✅ Transformed application:', transformedApp);
                    setMyApplication(transformedApp);
                    
                    // Add application documents (CV and ID) to documents list
                    const appDocuments: StaffDocument[] = [];
                    if (transformedApp.cvUrl && transformedApp.cvUrl !== 'null' && transformedApp.cvUrl !== 'undefined' && transformedApp.cvUrl !== '' && transformedApp.cvUrl !== '#') {
                        appDocuments.push({
                            id: `cv-${transformedApp.id}`,
                            title: 'Curriculum Vitae (CV)',
                            type: 'Certificate',
                            uploadDate: transformedApp.appliedDate,
                            expiryDate: undefined,
                            status: 'Verified',
                            url: transformedApp.cvUrl,
                        });
                    }
                    if (transformedApp.idDocumentUrl && transformedApp.idDocumentUrl !== 'null' && transformedApp.idDocumentUrl !== 'undefined' && transformedApp.idDocumentUrl !== '' && transformedApp.idDocumentUrl !== '#') {
                        appDocuments.push({
                            id: `id-${transformedApp.id}`,
                            title: 'ID Document',
                            type: 'ID',
                            uploadDate: transformedApp.appliedDate,
                            expiryDate: undefined,
                            status: 'Verified',
                            url: transformedApp.idDocumentUrl,
                        });
                    }
                    
                    // Merge with existing documents (avoid duplicates)
                    if (appDocuments.length > 0) {
                        setDocuments((prevDocs) => {
                            const existingIds = new Set(prevDocs.map(d => d.id));
                            const newDocs = appDocuments.filter(d => !existingIds.has(d.id));
                            return [...prevDocs, ...newDocs];
                        });
                    }
                } else {
                    console.log('⚠️ No applications found');
                    setMyApplication(null);
                }
            } catch (error: any) {
                console.error('❌ Failed to fetch applications:', error);
                console.error('❌ Error details:', error?.response?.data || error?.message);
                toast.error(error?.response?.data?.error || 'Failed to load your application');
                setMyApplication(null);
            } finally {
                setIsLoadingApplication(false);
            }
        };

        fetchMyApplications();
        
        // Refresh when activeTab changes to 'application'
        if (activeTab === 'application') {
            fetchMyApplications();
        }
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Profile Edit Data (initialized after profile)
    const [profileEditData, setProfileEditData] = useState({
        name: profile?.name || user?.name || 'Staff Member',
        role: profile?.role || 'General Staff',
        location: profile?.location || 'Doha',
        bio: '',
        phone: '+974 5500 1234',
        email: user.email || 'staff@liywan.qa',
        languages: profile.skills.map(s => s.name),
    });

    // Update profileEditData when profile changes
    useEffect(() => {
        setProfileEditData({
            name: profile.name,
            role: profile.role,
            location: profile.location,
            bio: '',
            phone: '+974 5500 1234',
            email: user.email || 'staff@liywan.qa',
            languages: profile.skills.map(s => s.name),
        });
    }, [profile.name, profile.role, profile.location, profile.skills, user.email]);

    // Messaging & Incidents
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportText, setReportText] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Job Board
    const [jobSearch, setJobSearch] = useState('');
    const [jobFilter, setJobFilter] = useState<'all' | 'vip' | 'regular'>('all');
    
    // Documents
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    
    // Training
    const [selectedModule, setSelectedModule] = useState<string | null>(null);
    
    // Application & Interview
    const [myApplication, setMyApplication] = useState<JobApplication | null>(null);
    const [isLoadingApplication, setIsLoadingApplication] = useState(true);
    const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    
    // Quiz Test
    const [isQuizTestOpen, setIsQuizTestOpen] = useState(false);
    const [quizTestAnswers, setQuizTestAnswers] = useState<number[]>(new Array(PROTOCOL_QUIZ.length).fill(-1));
    const [quizTestStarted, setQuizTestStarted] = useState(false);
    const [quizTestCompleted, setQuizTestCompleted] = useState(false);
    const [quizTestScore, setQuizTestScore] = useState<number | null>(null);
    const [quizTestTime, setQuizTestTime] = useState(0);
    const [quizTestTimer, setQuizTestTimer] = useState<NodeJS.Timeout | null>(null);
    
    // Quiz Test Timer Effect
    useEffect(() => {
        if (quizTestStarted && !quizTestCompleted) {
            const timer = setInterval(() => {
                setQuizTestTime(prev => prev + 1);
            }, 1000);
            setQuizTestTimer(timer);
            return () => clearInterval(timer);
        } else if (quizTestTimer) {
            clearInterval(quizTestTimer);
            setQuizTestTimer(null);
        }
    }, [quizTestStarted, quizTestCompleted]);
    
    const startQuizTest = () => {
        setQuizTestStarted(true);
        setQuizTestCompleted(false);
        setQuizTestScore(null);
        setQuizTestAnswers(new Array(PROTOCOL_QUIZ.length).fill(-1));
        setQuizTestTime(0);
        setIsQuizTestOpen(true);
    };
    
    const submitQuizTest = async () => {
        if (quizTestAnswers.includes(-1)) {
            alert(t('quiz.pleaseAnswerAll'));
            return;
        }
        
        let score = 0;
        quizTestAnswers.forEach((ans, idx) => {
            if (ans === PROTOCOL_QUIZ[idx].correctAnswer) score++;
        });
        const finalScore = Math.round((score / PROTOCOL_QUIZ.length) * 100);
        
        setQuizTestScore(finalScore);
        setQuizTestCompleted(true);
        setQuizTestStarted(false);
        
        // Update application quiz score in backend if exists
        if (myApplication) {
            const quizDetails = quizTestAnswers.map((ans, idx) => ({
                questionId: PROTOCOL_QUIZ[idx].id,
                question: PROTOCOL_QUIZ[idx].question,
                selectedOption: ans,
                correctOption: PROTOCOL_QUIZ[idx].correctAnswer,
                isCorrect: ans === PROTOCOL_QUIZ[idx].correctAnswer
            }));
            
            try {
                // Update application with quiz score
                await apiApplications.updateStatus(myApplication.id, myApplication.status, {
                    quizScore: finalScore,
                    quizDetails: quizDetails
                });
                
                // Update local state
            setMyApplication({
                ...myApplication,
                quizScore: finalScore,
                quizDetails: quizDetails
            });
                
                toast.success(`Quiz completed! Score: ${finalScore}%`);
            } catch (error: any) {
                console.error('Failed to update quiz score:', error);
                // Still update local state even if backend update fails
                setMyApplication({
                    ...myApplication,
                    quizScore: finalScore,
                    quizDetails: quizDetails
                });
                toast.error('Failed to save quiz score, but it was recorded locally');
            }
        }
    };
    
    const resetQuizTest = () => {
        setQuizTestStarted(false);
        setQuizTestCompleted(false);
        setQuizTestScore(null);
        setQuizTestAnswers(new Array(PROTOCOL_QUIZ.length).fill(-1));
        setQuizTestTime(0);
    };
    
    // Stats - Optimized with useMemo
    const totalEarnings = useMemo(() => {
        return earnings.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    }, [earnings]);
    
    const completedShifts = useMemo(() => {
        return shifts.filter(s => s.status === 'Completed').length;
    }, [shifts]);
    
    const upcomingShifts = useMemo(() => {
        return shifts.filter(s => {
            const shiftDate = new Date(s.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return (s.status === 'Scheduled' || s.status === 'Pending') && 
                   shiftDate >= today && 
                   s.confirmationStatus === 'Confirmed';
        }).length;
    }, [shifts]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (activeShiftId) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeShiftId]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleClockAction = async (shiftId: string) => {
        try {
            if (activeShiftId === shiftId) {
                // Check out
                await apiShifts.checkOut(shiftId);
                setActiveShiftId(null);
                setElapsedTime(0);
                toast.success('Checked out successfully');
            } else {
                // Check in
                await apiShifts.checkIn(shiftId);
                setActiveShiftId(shiftId);
                toast.success('Checked in successfully');
            }
            // Refetch shifts to get updated data
            if (!fetchingRef.current.shifts) {
                fetchingRef.current.shifts = true;
                const transformedShifts = await fetchAndTransformShifts();
                setShifts(transformedShifts);
                // Set active shift if Live
                const activeShift = transformedShifts.find(s => s.status === 'Live');
                if (activeShift) {
                    setActiveShiftId(activeShift.id);
                } else {
                    setActiveShiftId(null);
                }
                fetchingRef.current.shifts = false;
            }
        } catch (error: any) {
            console.error('Error updating shift:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Failed to update shift status';
            toast.error(errorMessage);
            fetchingRef.current.shifts = false;
        }
    };

    const updateShiftStatus = (shiftId: string, status: 'On The Way ' | 'Running Late') => {
        const shift = shifts.find(s => s.id === shiftId);
        if (!shift) return;
        
        // Normalize status (remove trailing space for consistency)
        const normalizedStatus = status.trim() as 'On The Way' | 'Running Late';
        
        // Update the shift status
        setShifts(shifts.map(s => 
            s.id === shiftId 
                ? { ...s, attendanceStatus: normalizedStatus } 
                : s
        ));
        
        // Add notification
        const statusMessage = normalizedStatus === 'On The Way'
            ? t('status.onTheWayMessage')
            : t('status.runningLateMessage');
        
        const newNotification: Notification = {
            id: `notif-${Date.now()}`,
            title: t('status.statusUpdated'),
            message: statusMessage,
            type: normalizedStatus === 'On The Way' ? 'success' : 'error',
            timestamp: 'Just now',
            isRead: false
        };
        
        setNotifications([newNotification, ...notifications]);
        
        // Show success feedback
        const button = document.activeElement as HTMLElement;
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = normalizedStatus === 'On The Way' 
                ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Status Updated!'
                : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Status Updated!';
            button.classList.add('opacity-75', 'cursor-not-allowed');
            (button as HTMLButtonElement).disabled = true;
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('opacity-75', 'cursor-not-allowed');
                (button as HTMLButtonElement).disabled = false;
            }, 2000);
        }
    };

    const confirmShift = async (shiftId: string, status: 'Confirmed' | 'Declined') => {
        try {
            // Find the shift to get event ID
            const shift = shifts.find(s => s.id === shiftId);
            if (!shift) return;

            // Note: Assignment update endpoint doesn't exist yet
            // In a real implementation, we'd call: PUT /events/{eventId}/assignments/{assignmentId}
            // For now, update local state
            setShifts(shifts.map(s => s.id === shiftId ? { 
                ...s, 
                confirmationStatus: status === 'Confirmed' ? 'Confirmed' : 'Declined',
                status: status === 'Confirmed' ? 'Scheduled' : 'Cancelled'
            } : s));
            
            if (status === 'Confirmed') {
                alert(t('shifts.shiftConfirmed'));
            } else {
                alert(t('shifts.shiftDeclined'));
            }
        } catch (error) {
            console.error('Failed to confirm shift:', error);
            alert(error instanceof Error ? error.message : 'Failed to confirm shift');
        }
    };

    const applyForJob = async (jobId: string) => {
        try {
            // Find the job opportunity
            const job = jobs.find(j => j.id === jobId);
            if (!job) {
                toast.error('Job not found');
                return;
            }
            
            // Get user and staff profile
            const userResponse = await apiAuth.getMe();
            if (!userResponse.success || !userResponse.data) {
                throw new Error('Failed to get user information');
            }
            const userData = userResponse.data;
            
            // Extract user info - handle nested structure (userData.user or userData.profile)
            const actualUser = userData.user || userData;
            const actualProfile = userData.profile || {};
            
            console.log('🔍 User data structure:', {
                hasUser: !!userData.user,
                hasProfile: !!userData.profile,
                userEmail: actualUser?.email,
                profileEmail: actualProfile?.email,
                directEmail: userData.email,
            });
            
            // Get staff profile - this has the most complete data
            const userId = actualUser._id || actualUser.id || userData._id || userData.id;
            const staffResponse = await apiStaff.getProfile(userId);
            // Handle both response.data.data (nested) and response.data (direct) structures
            const staffProfile = staffResponse.data?.data || staffResponse.data || staffResponse;
            
            console.log('🔍 Staff profile:', {
                id: staffProfile?.id,
                name: staffProfile?.name,
                email: staffProfile?.email,
                phone: staffProfile?.phone,
                rawStaffProfile: staffProfile,
                staffResponseStructure: {
                    hasData: !!staffResponse.data,
                    hasDataData: !!staffResponse.data?.data,
                    dataKeys: staffResponse.data ? Object.keys(staffResponse.data) : [],
                },
            });
            
            // Check if already applied to this event
            if (job.eventId) {
                const alreadyApplied = myEventApplications.some((app: any) => {
                    const appEventId = app.eventId || app.eventIdObject?._id || app.eventIdObject?.id;
                    const jobEventId = job.eventId?.toString();
                    return appEventId?.toString() === jobEventId && 
                           app.status !== 'Rejected'; // Can reapply if rejected
                });
                
                if (alreadyApplied) {
                    toast.warning(t('jobs.alreadyApplied') || 'You have already applied for this event. Please wait for admin review.');
                    return;
                }
            }
            
            // Create application - ensure all required fields are present
            // Priority: staffProfile (most reliable) > actualProfile > actualUser > userData
            // Staff profile has email: "bnbn1@gmx.fr" so use it first
            // Use type assertion to access email from staffProfile
            const staffEmail = (staffProfile as any)?.email || '';
            const staffName = (staffProfile as any)?.name || '';
            const staffPhone = (staffProfile as any)?.phone || '';
            
            const applicationData = {
                name: (staffName || actualProfile?.name || actualUser?.name || userData.name || '').trim(),
                email: (staffEmail || actualProfile?.email || actualUser?.email || userData.email || '').trim(),
                phone: (staffPhone || actualProfile?.phone || actualUser?.phone || userData.phone || '').trim(),
                roleApplied: (job.role || '').trim(),
                experience: (staffProfile as any)?.experience || staffProfile?.experience || 'Experienced',
                location: (staffProfile as any)?.location || staffProfile?.location || 'Doha',
                eventId: job.eventId, // Ensure eventId is included
                staffId: (staffProfile as any)?.id || staffProfile?.id || staffProfile?._id,
                status: 'Pending' as 'Pending',
            };
            
            console.log('📝 Final application data before validation:', applicationData);
            console.log('📝 Extracted values:', {
                staffEmail,
                staffName,
                staffPhone,
                staffProfileKeys: Object.keys(staffProfile || {}),
            });
            
            // Validate required fields before sending
            if (!applicationData.name || !applicationData.email || !applicationData.phone || !applicationData.roleApplied) {
                const missingFields = [];
                if (!applicationData.name) missingFields.push('name');
                if (!applicationData.email) missingFields.push('email');
                if (!applicationData.phone) missingFields.push('phone');
                if (!applicationData.roleApplied) missingFields.push('roleApplied');
                
                toast.error(`Missing required fields: ${missingFields.join(', ')}`);
                console.error('❌ Missing required fields:', missingFields);
                console.error('Application data:', applicationData);
                console.error('User data:', userData);
                console.error('Staff profile:', staffProfile);
                return;
            }
            
            console.log('📝 Creating application with data:', {
                ...applicationData,
                eventId: job.eventId,
                jobId: job.id,
                jobTitle: job.title,
            });
            
            try {
                const createResponse = await apiApplications.create(applicationData);
                console.log('📝 Application created, response:', createResponse);
                
                toast.success(t('jobs.applicationSubmitted'));
            } catch (error: any) {
                console.error('❌ Failed to create application:', error);
                const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit application';
                toast.error(errorMessage);
                return;
            }
            
            // Refresh my applications to show the new one
            // Use the /me endpoint which is authorized for staff - backend handles filtering by staffId
            const applicationsResponse = await apiApplications.getMyApplications({ page: 1, limit: 100 });
            const myApplications = applicationsResponse.data || [];
            
            // Update event applications list (filter only applications with eventId)
            // Backend returns eventId as string and eventIdObject as populated object
            const eventApplications = myApplications.filter((app: any) => {
                const hasEventId = app.eventId || app.eventIdObject;
                if (hasEventId) {
                    console.log('✅ Updated event application:', {
                        id: app.id,
                        eventId: app.eventId,
                        eventTitle: app.eventIdObject?.title,
                        status: app.status
                    });
                }
                return hasEventId;
            });
            console.log('🔄 Setting event applications after apply:', eventApplications.length);
            setMyEventApplications(eventApplications);
            
            // Also trigger a refresh of the event applications fetch after a short delay
            // This ensures the list is updated immediately from the backend
            setTimeout(async () => {
                try {
                    const refreshResponse = await apiApplications.getMyApplications({ page: 1, limit: 100 });
                    const allApps = refreshResponse.data || [];
                    const eventApps = allApps.filter((app: any) => app.eventId || app.eventIdObject);
                    console.log('🔄 Refreshed event applications from backend:', eventApps.length);
                    setMyEventApplications(eventApps);
                } catch (error) {
                    console.error('Error refreshing event applications:', error);
                }
            }, 1500);
            
            if (myApplications.length > 0) {
                const statusPriority: { [key: string]: number } = {
                    'Pending': 1,
                    'Interview': 2,
                    'Approved': 3,
                    'Rejected': 0
                };
                
                myApplications.sort((a: any, b: any) => {
                    const aPriority = statusPriority[a.status] || 0;
                    const bPriority = statusPriority[b.status] || 0;
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority;
                    }
                    const aDate = new Date(a.appliedDate || a.createdAt || 0).getTime();
                    const bDate = new Date(b.appliedDate || b.createdAt || 0).getTime();
                    return bDate - aDate;
                });
                
                const latestApp = myApplications[0];
                const transformedApp: JobApplication = {
                    id: latestApp._id || latestApp.id,
                    name: latestApp.name || userData.name || '',
                    email: latestApp.email || userData.email || '',
                    phone: latestApp.phone || '',
                    roleApplied: latestApp.roleApplied || '',
                    experience: latestApp.experience || '',
                    location: latestApp.location || 'Doha',
                    status: latestApp.status || 'Pending',
                    appliedDate: latestApp.appliedDate || (latestApp.createdAt ? new Date(latestApp.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                    avatar: latestApp.avatar || latestApp.imageUrl || userData.avatar || profile.avatar,
                    languages: Array.isArray(latestApp.languages) ? latestApp.languages : (typeof latestApp.languages === 'string' ? latestApp.languages.split(',').map(l => l.trim()) : []),
                    quizScore: latestApp.quizScore || 0,
                    quizDetails: Array.isArray(latestApp.quizDetails) ? latestApp.quizDetails : [],
                    interviewDate: latestApp.interviewDate ? (typeof latestApp.interviewDate === 'string' ? latestApp.interviewDate : new Date(latestApp.interviewDate).toISOString().split('T')[0]) : undefined,
                    interviewTime: latestApp.interviewTime || undefined,
                    interviewLocation: latestApp.interviewLocation || undefined,
                    interviewer: latestApp.interviewer || undefined,
                    meetingLink: latestApp.meetingLink || undefined,
                    interviewNotes: latestApp.interviewNotes || undefined,
                    interviewType: latestApp.interviewType || undefined,
                };
                
                setMyApplication(transformedApp);
            }
            
            // Refresh jobs to update spots
            const eventsResponse = await apiEvents.list({ page: 1, limit: 100, status: 'APPROVED'});
            const eventsData = eventsResponse.data || [];
            
            // Re-transform jobs (same logic as fetchJobs)
            // Use staffId from staffProfile that was already fetched
            const currentStaffId = (staffProfile as any)?.id || staffProfile?.id || staffProfile?._id;
            const transformedJobs: JobOpportunity[] = [];
            
            eventsData.forEach((event: any) => {
                if (currentStaffId) {
                    const isAlreadyAssigned = (event.assignments || []).some((a: any) => {
                        const assignmentStaffId = a.staffId?._id || a.staffId?.id || a.staffId || a.staff;
                        return assignmentStaffId?.toString() === currentStaffId?.toString();
                    });
                    if (isAlreadyAssigned) {
                        return;
                    }
                }
                
                const startDate = new Date(event.startAt);
                const endDate = new Date(event.endAt);
                const requiredRoles = event.requiredRoles || {};
                const assignments = event.assignments || [];
                const filledByRole: { [key: string]: number } = {};
                assignments.forEach((a: any) => {
                    const role = a.role || 'General Staff';
                    filledByRole[role] = (filledByRole[role] || 0) + 1;
                });
                
                Object.keys(requiredRoles).forEach((roleName) => {
                    const requiredCount = requiredRoles[roleName] || 0;
                    const filledCount = filledByRole[roleName] || 0;
                    const spotsLeft = requiredCount - filledCount;
                    
                    if (spotsLeft > 0) {
                        const avgRate = assignments.length > 0 
                            ? assignments.reduce((sum: number, a: any) => sum + (a.payment?.totalPayment || 0), 0) / assignments.length
                            : 500;
                        
                        transformedJobs.push({
                            id: `${event.id}-${roleName}`,
                    eventId: event.id,
                    title: event.title,
                    role: roleName,
                    date: startDate.toISOString().split('T')[0],
                    time: `${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
                    location: typeof event.location === 'object' ? event.location.address : event.location,
                            rate: avgRate,
                            requirements: Object.keys(requiredRoles),
                            spotsOpen: spotsLeft,
                    isVIP: event.notes?.isVIP || false,
                        });
                    }
                });
            });
            
            transformedJobs.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return dateA - dateB;
            });
            
            setJobs(transformedJobs);
        } catch (error: any) {
            console.error('Failed to apply for job:', error);
            const errorMessage = error?.response?.data?.error || error?.message || 'Failed to apply for job';
            toast.error(errorMessage);
        }
    };

    // --- MESSAGING ---
    const sendMessage = () => {
        if (!newMessage.trim()) return;
        const msg: Message = {
            id: `msg-${Math.random()}`,
            senderId: user.id,
            senderName: user.name,
            content: newMessage,
            timestamp: new Date().toLocaleTimeString(),
            isRead: false,
            type: 'Direct'
        };
        setMessages([...messages, msg]);
        setNewMessage('');
    };

    const sendIncidentReport = () => {
        if (!reportText.trim()) return;
        const inc: Incident = {
            id: `inc-${Math.random()}`,
            type: 'Other',
            severity: 'Medium',
            description: reportText,
            reportedBy: user.name,
            reportedAt: new Date().toLocaleTimeString(),
            status: 'Open',
            location: 'Reported via Staff App'
        };
        setIncidents([...incidents, inc]);
        setReportText('');
        setIsReportOpen(false);
        alert(t('incident.reportSubmittedSuccess'));
    };

    return (
        <div className={`min-h-screen bg-slate-50 font-sans flex text-gray-900 ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* DESKTOP SIDEBAR */}
            {/* Mobile Header */}
            <header className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <IventiaLogo className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" size="md" />
                        <IventiaText size="sm" className="hidden sm:block" />
                        <h1 className="font-bold text-base sm:text-lg capitalize sm:hidden">
                            {t('staff.dashboard')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher />
                        <button
                            onClick={() => setIsNotifOpen(true)}
                            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={onLogout}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Logout"
                        >
                            <LogOut className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>

            <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col sticky top-0 h-screen">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center gap-2.5">
                    <IventiaLogo className="w-11 h-11 sm:w-12 sm:h-12 flex-shrink-0" size="md" />
                    <IventiaText size="sm" className="flex-1 min-w-0" />
                </div>
                <nav className="p-3 sm:p-4 space-y-1.5 flex-1">
                    {[
                        { id: 'dashboard', icon: Grid, label: t('nav.dashboard') },
                        { id: 'shifts', icon: Calendar, label: t('nav.shifts') },
                        { id: 'assignments', icon: Briefcase, label: t('ui.eventAssignments') },
                        { id: 'earnings', icon: DollarSign, label: t('ui.earnings') },
                        { id: 'jobs', icon: Briefcase, label: t('nav.jobs') },
                        { id: 'application', icon: FileText, label: t('nav.application'), badge: myApplication?.status === 'Interview' ? 'Interview' : myApplication?.status === 'Pending' ? 'Pending' : null },
                        { id: 'documents', icon: FileText, label: t('nav.documents') },
                        { id: 'profile', icon: User, label: t('nav.profile') },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-qatar text-white shadow-lg shadow-qatar/30' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <div className="flex items-center gap-3">
                            <item.icon size={18} /> {item.label}
                            </div>
                            {item.badge && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    item.badge === 'Interview' ? 'bg-blue-500 text-white' :
                                    item.badge === 'Pending' ? 'bg-amber-500 text-white' :
                                    'bg-gray-200 text-gray-700'
                                }`}>
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
                <div className="p-3 sm:p-4 border-t border-gray-100">
                    <button onClick={onLogout} className="flex items-center gap-2.5 text-red-600 px-3 py-2 hover:bg-red-50 rounded-lg w-full transition-colors text-sm"><LogOut size={16} /> {t('nav.logout')}</button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-20 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                            aria-label="Menu"
                        >
                            <Menu size={20} className="text-gray-700" />
                        </button>
                        <div className="lg:hidden flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                            <IventiaLogo className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0" size="sm" />
                            <IventiaText size="sm" className="hidden sm:block flex-shrink-0" />
                            <h1 className="font-bold text-sm sm:text-base capitalize sm:hidden truncate">
                                {activeTab === 'jobs' ? t('jobs.marketplace') : 
                                 activeTab === 'application' ? t('application.myApplication') : 
                                 t(`nav.${activeTab}` as any) || activeTab}
                            </h1>
                        </div>
                    </div>
                    <h1 className="hidden lg:block text-xl md:text-2xl font-bold capitalize text-gray-800 truncate">
                        {activeTab === 'jobs' ? t('jobs.marketplace') : 
                         activeTab === 'application' ? t('application.myApplication') : 
                         t(`nav.${activeTab}` as any) || activeTab}
                    </h1>

                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 relative flex-shrink-0">
                        <LanguageSwitcher />
                        <button 
                            onClick={() => setIsChatOpen(!isChatOpen)} 
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors relative touch-manipulation"
                            aria-label="Messages"
                        >
                            <MessageSquare size={18} className="sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                        <button 
                            onClick={() => setIsNotifOpen(!isNotifOpen)} 
                            className="relative p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                            aria-label="Notifications"
                        >
                            <Bell size={18} className="sm:w-5 sm:h-5 text-gray-600" />
                            {notifications.some(n => !n.isRead) && <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>}
                        </button>

                        {/* Notification Dropdown */}
                        <AnimatePresence>
                            {isNotifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-12 right-0 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-50"
                                >
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">{t('ui.notifications')}</h3>
                                        <button onClick={() => setIsNotifOpen(false)} className="text-gray-400 hover:text-gray-600">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            <>
                                                {notifications.map(notif => (
                                                    <div 
                                                        key={notif.id} 
                                                        className={`p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors touch-manipulation ${
                                                            !notif.isRead ? 'bg-blue-50/50' : ''
                                                        }`}
                                                        onClick={async () => {
                                                            if (!notif.isRead) {
                                                                try {
                                                                    await apiNotifications.markAsRead(notif.id);
                                                                } catch (error) {
                                                                    console.error('Failed to mark notification as read:', error);
                                                                }
                                                            }
                                                            setNotifications(notifications.map(n => 
                                                                n.id === notif.id ? { ...n, isRead: true } : n
                                                            ));
                                                        }}
                                                    >
                                                    <div className="flex items-start gap-2 sm:gap-3">
                                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1.5 sm:mt-2 flex-shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2">
                                                            <h4 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-2">{notif.title}</h4>
                                                                    {notif.type === 'success' && (
                                                                        <CheckCircle size={14} className="sm:w-4 sm:h-4 text-emerald-500 flex-shrink-0" />
                                                                    )}
                                                                    {notif.type === 'error' && (
                                                                        <AlertCircle size={14} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                                                                    )}
                                                                </div>
                                                            <p className="text-[10px] sm:text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                                                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">{notif.timestamp}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                ))}
                                                {notifications.some(n => !n.isRead) && (
                                                    <div className="p-2 sm:p-3 border-t border-gray-100">
                                                        <button 
                                                            className="text-xs text-qatar font-bold hover:underline w-full text-center touch-manipulation py-2"
                                                            onClick={async () => {
                                                                try {
                                                                    await apiNotifications.markAllAsRead();
                                                                } catch (error) {
                                                                    console.error('Failed to mark all as read:', error);
                                                                }
                                                                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                                                            }}
                                                        >
                                                            {t('ui.markAllAsRead')}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-6 sm:p-8 text-center text-gray-500">
                                                <Bell size={24} className="sm:w-8 sm:h-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-xs sm:text-sm font-bold">{t('ui.noNotifications')}</p>
                                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{t('ui.allCaughtUp')}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="hidden lg:flex items-center gap-2 md:gap-3 pl-3 md:pl-4 border-l border-gray-200">
                            <div className="text-right hidden xl:block">
                                <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{profile.name}</p>
                                <p className="text-xs text-gray-500 truncate max-w-[120px]">{profile.role}</p>
                            </div>
                            <img src={profile.avatar} className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-gray-200 flex-shrink-0" alt="" />
                        </div>
                    </div>
                </header>

                <main className="p-3 sm:p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto pb-20 sm:pb-24 lg:pb-8">
                    <React.Fragment>
                    {activeTab === 'dashboard' && (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Stats Cards */}
                            {isLoadingProfile ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 border-blue-200 hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex items-center justify-between">
                        <div>
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">{t('dashboard.totalEarnings')}</p>
                                                <p className="text-2xl font-bold text-blue-900 group-hover:scale-105 transition-transform duration-300">QAR {totalEarnings.toLocaleString()}</p>
                                                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                                    <TrendingUp size={12} className="animate-pulse" /> 
                                                    {earnings.length > 0 ? `${Math.round((earnings.filter(e => e.status === 'PAID').length / earnings.length) * 100)}% ${t('ui.paid')}` : t('ui.noEarningsYet')}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <DollarSign className="text-blue-700" size={24} />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className="bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-50 border-emerald-200 hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">{t('dashboard.completedShifts')}</p>
                                                <p className="text-2xl font-bold text-emerald-900 group-hover:scale-105 transition-transform duration-300">{completedShifts}</p>
                                                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                                    <CheckCircle size={12} className="animate-pulse" /> 
                                                    {profile.onTimeRate >= 95 ? t('ui.excellentOnTimeRate') : t('ui.goodPerformance')}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <Calendar className="text-emerald-700" size={24} />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card className="bg-gradient-to-br from-amber-50 via-amber-100 to-amber-50 border-amber-200 hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">{t('dashboard.upcomingShifts')}</p>
                                                <p className="text-2xl font-bold text-amber-900 group-hover:scale-105 transition-transform duration-300">{upcomingShifts}</p>
                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                    <Clock size={12} className="animate-pulse" /> 
                                                    {upcomingShifts > 0 ? `${t('ui.next')}: ${shifts.find(s => (s.status === 'Scheduled' || s.status === 'Pending') && new Date(s.date) >= new Date() && s.confirmationStatus === 'Confirmed')?.date || t('ui.soon')}` : t('ui.noUpcomingShifts')}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <Clock className="text-amber-700" size={24} />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <Card className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 border-purple-200 hover:shadow-lg transition-all duration-300 group">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">{t('dashboard.rating')}</p>
                                                <p className="text-2xl font-bold text-purple-900 group-hover:scale-105 transition-transform duration-300 flex items-center gap-1">
                                                    {profile.rating}
                                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                                </p>
                                                <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                                                    <Star size={12} className="animate-pulse" /> 
                                                    {profile.rating >= 4.5 ? t('ui.excellent') : profile.rating >= 4 ? t('ui.great') : t('ui.good')}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                                                <Star className="text-purple-700 fill-purple-700" size={24} />
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                {/* Left Column */}
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Interview Alert */}
                                    {myApplication?.status === 'Interview' && myApplication.interviewDate && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Calendar className="text-white" size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="font-bold text-gray-900">{t('interview.scheduled')}</h3>
                                                            <Badge status="Interview" />
                                                        </div>
                                                        <p className="text-sm text-gray-700 mb-3">
                                                            {t('interview.yourInterviewFor')} <span className="font-bold">{myApplication.roleApplied}</span> {t('interview.isScheduled')}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-gray-600 flex items-center gap-1">
                                                                <Calendar size={14} /> {myApplication.interviewDate}
                                                            </span>
                                                            <span className="text-gray-600 flex items-center gap-1">
                                                                <Clock size={14} /> {myApplication.interviewTime}
                                                            </span>
                                                        </div>
                                                        <Button 
                                                            size="sm" 
                                                            className="mt-3 w-full"
                                                            onClick={() => {
                                                                setActiveTab('application');
                                                                setIsInterviewModalOpen(true);
                                                            }}
                                                        >
                                                            <Eye size={16} className="mr-2" /> {t('interview.viewDetails')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )}

                                    <Card>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                {activeShiftId ? (
                                                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 animate-pulse">
                                                        <div className="w-2 h-2 bg-red-600 rounded-full" /> {t('dashboard.liveShift')}
                                                    </span>
                                ) : (
                                                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{t('dashboard.upNext')}</span>
                                )}
                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setIsQRModalOpen(true)}>
                                                <QrCode size={16} className="mr-2" /> {t('qr.myAccessPass')}
                                            </Button>
                        </div>
                                        
                                        {shifts.length > 0 && shifts[0] ? (
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                        <h2 className="text-2xl font-bold text-gray-900">{shifts[0]?.eventTitle || t('shifts.noShifts')}</h2>
                                                    {shifts[0]?.attendanceStatus && (
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                            shifts[0].attendanceStatus === 'On Time' ? 'bg-emerald-100 text-emerald-700' :
                                                            shifts[0].attendanceStatus === 'On The Way' || shifts[0].attendanceStatus === 'On The Way ' ? 'bg-blue-100 text-blue-700' :
                                                            shifts[0].attendanceStatus === 'Running Late' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                                {shifts[0].attendanceStatus?.trim() || ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-500 flex items-center gap-2 mt-1">
                                                        <MapPin size={16} /> {shifts[0]?.location || t('shifts.noShifts')}
                                                </p>
            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                                <div>
                                                    <p className="text-xs text-gray-500">{t('shifts.dateTime')}</p>
                                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-1 mt-1">
                                                            <Calendar size={14} /> {shifts[0]?.date || 'N/A'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                                            <Clock size={14} /> {shifts[0]?.startTime || 'N/A'} - {shifts[0]?.endTime || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">{t('shifts.wage')}</p>
                                                        <p className="text-lg font-bold text-emerald-600 mt-1">QAR {shifts[0]?.wage?.toLocaleString() || '0'}</p>
                                                </div>
            </div>

                                            {activeShiftId ? (
                                                <motion.div
                                                    initial={{ scale: 0.95 }}
                                                    animate={{ scale: 1 }}
                                                    className="bg-red-50 p-4 rounded-xl border border-red-100 mt-4"
                                                >
                                                    <p className="text-xs text-red-600 font-bold mb-2">{t('shifts.elapsedTime')}</p>
                                                    <p className="font-mono text-4xl font-bold text-red-600 text-center">{formatTime(elapsedTime)}</p>
                                                </motion.div>
                                            ) : null}

                                            {!activeShiftId && shifts[0] && (
                                                <div className="flex gap-3 mt-4">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                                if (shifts[0]) updateShiftStatus(shifts[0].id, 'On The Way ');
                                                        }}
                                                        disabled={shifts[0]?.attendanceStatus === 'On The Way' || shifts[0]?.attendanceStatus === 'On The Way '}
                                                        className={`flex-1 py-3 font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                                                            shifts[0]?.attendanceStatus === 'On The Way' || shifts[0]?.attendanceStatus === 'On The Way '
                                                                ? 'bg-blue-200 text-blue-800 border-blue-300 cursor-not-allowed'
                                                                : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 active:scale-95'
                                                        }`}
                                                    >
                                                        <Navigation size={16} /> 
                                                        {shifts[0]?.attendanceStatus === 'On The Way' || shifts[0]?.attendanceStatus === 'On The Way ' 
                                                            ? `${t('status.onTheWay')} ✓` 
                                                            : t('dashboard.onTheWay')}
                                                    </button>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                                if (shifts[0]) updateShiftStatus(shifts[0].id, 'Running Late');
                                                        }}
                                                        disabled={shifts[0]?.attendanceStatus === 'Running Late'}
                                                        className={`flex-1 py-3 font-bold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                                                            shifts[0]?.attendanceStatus === 'Running Late'
                                                                ? 'bg-amber-200 text-amber-800 border-amber-300 cursor-not-allowed'
                                                                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 active:scale-95'
                                                        }`}
                                                    >
                                                        <AlertTriangle size={16} /> 
                                                        {shifts[0]?.attendanceStatus === 'Running Late' 
                                                            ? `${t('status.runningLate')} ✓` 
                                                            : t('status.runningLate')}
                                                    </button>
                </div>
            )}

            <Button
                                                onClick={() => shifts[0] && handleClockAction(shifts[0].id)}
                variant={activeShiftId ? 'danger' : 'primary'}
                                                className="w-full h-14 text-lg shadow-xl mt-4"
                                                    disabled={!shifts[0]}
                                            >
                                                {activeShiftId ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <PauseCircle size={20} /> {t('dashboard.clockOut')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <PlayCircle size={20} /> {t('dashboard.clockIn')}
                                                    </span>
                                                )}
            </Button>

            {activeShiftId && (
                                                <button 
                                                    onClick={() => setIsReportOpen(true)} 
                                                    className="w-full text-xs text-red-500 font-bold hover:underline flex items-center justify-center gap-1 py-2"
                                                >
                                                    <AlertTriangle size={12} /> {t('dashboard.reportIncident')}
                </button>
            )}
                                        </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-400">
                                                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">{t('shifts.noShifts')}</p>
                                                <p className="text-xs text-gray-400 mt-1">{t('shifts.checkBack')}</p>
                                            </div>
                                        )}
        </Card>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Recent Earnings */}
        <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
                                        <Card className="hover:shadow-lg transition-shadow duration-300">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <DollarSign size={18} className="text-emerald-600" /> {t('earnings.recentEarnings')}
                                                </h3>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setActiveTab('earnings')}
                                                >
                                                    {t('ui.viewAll')}
                                                </Button>
                                            </div>
                                            {earnings.length > 0 ? (
                                                <div className="space-y-3">
                                                    {earnings.slice(0, 3).map((earning) => (
                                                        <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-900">{earning.eventName || 'Event'}</p>
                                                                <p className="text-xs text-gray-500">{earning.eventDate || earning.shiftDate}</p>
                    </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-emerald-600">QAR {earning.totalAmount?.toLocaleString() || '0'}</p>
                                                                <Badge status={earning.status === 'PAID' ? 'PAID' : 'PENDING'} className="text-xs" />
                </div>
            </div>
                                                    ))}
                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">{t('ui.noEarningsYet')}</p>
                                                </div>
                                            )}
                                        </Card>
                                    </motion.div>

                                    {/* Recent Shifts */}
                                                <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                    >
                                        <Card className="hover:shadow-lg transition-shadow duration-300">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                    <Calendar size={18} className="text-blue-600" /> {t('shifts.recentShifts')}
                                                </h3>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setActiveTab('shifts')}
                                                >
                                                    {t('ui.viewAll')}
                                                </Button>
                </div>
                                            {shifts.length > 0 ? (
                                                <div className="space-y-3">
                                                    {shifts.slice(0, 3).map((shift) => (
                                                        <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setActiveTab('shifts')}>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-bold text-gray-900">{shift.eventTitle || 'Event'}</p>
                                                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                                                    <Calendar size={12} /> {shift.date}
                                                                    <span className="text-gray-300">•</span>
                                                                    <Clock size={12} /> {shift.startTime} - {shift.endTime}
                                                                </p>
                </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-blue-600">QAR {shift.wage?.toLocaleString() || '0'}</p>
                                                                <Badge status={shift.status} className="text-xs" />
            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-400">
                                                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">{t('shifts.noShifts')}</p>
                                                </div>
                                            )}
        </Card>
        </motion.div>
                                    
                                    {/* Quick Stats */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.4 }}
                                    >
                                        <Card className="hover:shadow-lg transition-shadow duration-300">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <Target size={18} className="text-qatar" /> {t('ui.quickStats')}
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{t('ui.onTimeRate')}</span>
                                                <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${profile.onTimeRate}%` }}
                                                                transition={{ duration: 1, delay: 0.5 }}
                                                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                                                            ></motion.div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{profile.onTimeRate}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">{t('profile.profileStrength')}</span>
                                                <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${profile.profileStrength.overall}%` }}
                                                                transition={{ duration: 1, delay: 0.6 }}
                                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-400"
                                                            ></motion.div>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-900">{profile.profileStrength.overall}%</span>
                                                </div>
                                            </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <span className="text-sm text-gray-600">{t('dashboard.totalEvents')}</span>
                                                    <span className="text-sm font-bold text-gray-900">{shifts.filter(s => s.status === 'Completed').length}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">{t('dashboard.avgRating')}</span>
                                                    <div className="flex items-center gap-1">
                                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                                        <span className="text-sm font-bold text-gray-900">{profile.rating.toFixed(1)}</span>
                                                    </div>
                                            </div>
                                        </div>
                                    </Card>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
)}

{
    activeTab === 'shifts' && (
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('shifts.myShifts')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('shifts.manageShifts')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <List size={16} className="mr-2" /> {t('ui.viewAll')}
                    </Button>
                </div>
            </div>
            
            {isLoadingShifts ? (
                <SkeletonList items={3} />
            ) : shifts.length > 0 ? (
            <div className="space-y-4">
                {shifts.map((shift, index) => (
                    <motion.div
                        key={shift.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card 
                            onClick={() => setExpandedShiftId(expandedShiftId === shift.id ? null : shift.id)} 
                            className={`cursor-pointer transition-all hover:shadow-lg ${expandedShiftId === shift.id ? 'ring-2 ring-qatar/20 shadow-lg' : ''}`}
                        >
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">{shift.eventTitle}</h3>
                                                {shift.confirmationStatus === 'Pending' && (
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Action Required</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <span>{shift.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar size={16} className="text-gray-400" />
                                                    <span>{shift.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock size={16} className="text-gray-400" />
                                                    <span>{shift.startTime} - {shift.endTime}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                                    <DollarSign size={16} />
                                                    <span>QAR {shift.wage || 0}</span>
                                                </div>
                                                {shift.role && (
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Briefcase size={16} className="text-gray-400" />
                                                        <span>{shift.role}</span>
                            </div>
                                                )}
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                        <Badge status={shift.confirmationStatus === 'Pending' ? 'Pending' : shift.status} />
                            {shift.status === 'Live' && (
                                <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                                    <div className="w-2 h-2 bg-red-600 rounded-full" /> Live
                                </span>
                            )}
                        </div>
                                    </div>
                                    
                                    {shift.attendanceStatus && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">Status:</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                    shift.attendanceStatus === 'On Time' ? 'bg-emerald-50 text-emerald-600' :
                                                    shift.attendanceStatus === 'On The Way' || shift.attendanceStatus === 'On The Way ' ? 'bg-blue-50 text-blue-600' :
                                                    shift.attendanceStatus === 'Running Late' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-gray-50 text-gray-600'
                                                }`}>
                                                    {shift.attendanceStatus?.trim() || 'Not Set'}
                                                </span>
                                                {shift.checkInTime && (
                                                    <span className="text-xs text-gray-500">{t('shifts.checkedIn')}: {shift.checkInTime}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <ChevronDown 
                                        className={`text-gray-400 transition-transform ${expandedShiftId === shift.id ? 'rotate-180' : ''}`} 
                                        size={20} 
                                    />
                                </div>
                            </div>
                            
    <AnimatePresence>
        {expandedShiftId === shift.id && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }} 
                                        animate={{ height: 'auto', opacity: 1 }} 
                                        exit={{ height: 0, opacity: 0 }} 
                                        className="pt-6 mt-6 border-t border-gray-100 overflow-hidden"
                                    >
                {shift.confirmationStatus === 'Pending' ? (
                                            <div className="bg-amber-50 p-5 rounded-xl border border-amber-100 mb-4">
                                                <div className="flex items-start gap-3 mb-4">
                                                    <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                                                    <div>
                                                        <p className="text-sm font-bold text-amber-800 mb-1">{t('shifts.confirmationRequired')}</p>
                                                        <p className="text-xs text-amber-700">{t('shifts.confirmAvailability')}</p>
                                                    </div>
                                                </div>
                        <div className="flex gap-3">
                                                    <Button 
                                                        size="sm" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            confirmShift(shift.id, 'Confirmed');
                                                        }} 
                                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                                                    >
                                                        <CheckCircle size={16} className="mr-2" /> {t('shifts.acceptShift')}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            confirmShift(shift.id, 'Declined');
                                                        }} 
                                                        className="flex-1 bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                                                    >
                                                        <X size={16} className="mr-2" /> {t('shifts.decline')}
                                                    </Button>
                        </div>
                    </div>
                ) : (
                                            <div className="space-y-4">
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="bg-blue-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-blue-600 mb-2">{t('shifts.instructions')}</p>
                                                        <p className="text-sm text-blue-900">{shift.instructions}</p>
                                                    </div>
                                                    <div className="bg-gray-50 p-4 rounded-xl">
                                                        <p className="text-xs font-bold text-gray-600 mb-2">{t('shifts.contactInformation')}</p>
                                                        <div className="space-y-2 text-sm">
                                                            <p className="font-bold text-gray-900">{shift.contactPerson}</p>
                                                            <p className="text-gray-600 flex items-center gap-2">
                                                                <Phone size={14} /> {shift.contactPhone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-purple-50 p-4 rounded-xl">
                                                    <p className="text-xs font-bold text-purple-600 mb-2">{t('shifts.requiredAttire')}</p>
                                                    <p className="text-sm text-purple-900">{shift.attire}</p>
                                                </div>
                                                
                                                <div className="flex gap-3">
                                                    <Button 
                                                        className="flex-1" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsQRModalOpen(true);
                                                        }}
                                                    >
                                                        <QrCode size={18} className="mr-2" /> {t('qr.showDigitalBadge')}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.open(`https://maps.google.com/?q=${encodeURIComponent(shift.location)}`, '_blank');
                                                        }}
                                                    >
                                                        <Navigation size={18} className="mr-2" /> {t('interview.getDirections')}
                                                    </Button>
                                                </div>
                                            </div>
                )}
            </motion.div>
        )}
    </AnimatePresence>
                        </Card>
                    </motion.div>
                ))}
            </div>
            ) : (
                <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="text-blue-600" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('shifts.noShifts')}</h3>
                        <p className="text-sm text-gray-500 mb-4">{t('shifts.checkBack')}</p>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('jobs')}
                        >
                            <Briefcase size={16} className="mr-2" />
                            {t('assignments.browseAvailableJobs')}
                        </Button>
                    </motion.div>
                </Card>
            )}
        </div>
    )
}

{/* EVENT ASSIGNMENTS TAB */}
{
    activeTab === 'assignments' && (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('assignments.eventAssignments')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('assignments.viewAllAssignments')}</p>
                </div>
            </div>

            {isLoadingAssignments ? (
                <SkeletonList items={3} />
            ) : eventAssignments.length > 0 ? (
                <div className="space-y-4">
                    {eventAssignments.map((assignment, index) => {
                        const event = assignment.event;
                        const isUpcoming = event?.date && new Date(event.date) >= new Date();
                        const isPast = event?.date && new Date(event.date) < new Date();
                        
                        return (
                            <motion.div
                                key={assignment.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className={`hover:shadow-lg transition-shadow ${isUpcoming ? 'border-l-4 border-l-blue-500' : isPast ? 'border-l-4 border-l-gray-300 opacity-75' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <h3 className="text-xl font-bold text-gray-900">{event?.title || 'Event'}</h3>
                                                        <Badge 
                                                            status={
                                                                assignment.status === 'APPROVED' ? 'Confirmed' :
                                                                assignment.status === 'PENDING' ? 'Pending' :
                                                                assignment.status === 'REJECTED' ? 'Rejected' :
                                                                'Pending'
                                                            }
                                                        />
                                                        {event?.status && (
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                                event.status === 'LIVE' ? 'bg-red-100 text-red-600' :
                                                                event.status === 'APPROVED' ? 'bg-blue-100 text-blue-600' :
                                                                event.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                                event.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                                                                'bg-amber-100 text-amber-600'
                                                            }`}>
                                                                {event.status}
                                                            </span>
                                                        )}
                                                        {isUpcoming && (
                                                            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                                                                Upcoming
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <MapPin size={16} className="text-gray-400" />
                                                            <span className="font-medium">{event?.location || 'TBA'}</span>
                                                        </div>
                                                        {event?.date && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Calendar size={16} className="text-gray-400" />
                                                                <span className="font-medium">{event.date}</span>
                                                            </div>
                                                        )}
                                                        {event?.startTime && event?.endTime && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Clock size={16} className="text-gray-400" />
                                                                <span className="font-medium">{event.startTime} - {event.endTime}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Briefcase size={16} className="text-gray-400" />
                                                            <span className="font-medium">{assignment.role || 'General Staff'}</span>
                                                        </div>
                                                    </div>
                                                    {event?.description && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <p className="text-xs font-bold text-gray-500 mb-1">Event Description</p>
                                                            <p className="text-sm text-gray-700">{event.description}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Payment Details Section */}
                                                    {assignment.payment && assignment.payment.totalPayment > 0 && (
                                                        <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl">
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">Payment Details</p>
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-4 text-sm">
                                                                            <span className="text-gray-700">
                                                                                Type: <span className="font-bold capitalize text-emerald-700">{assignment.payment.type || 'hourly'}</span>
                                                                            </span>
                                                                            {assignment.payment.type === 'hourly' && assignment.payment.hourlyRate > 0 && (
                                                                                <span className="text-gray-700">
                                                                                    Rate: <span className="font-bold text-emerald-700">QAR {assignment.payment.hourlyRate.toLocaleString()}/hr</span>
                                                                                    {assignment.payment.totalHours > 0 && (
                                                                                        <span className="ml-1 text-gray-600">({assignment.payment.totalHours} hrs)</span>
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                            {assignment.payment.type === 'fixed' && assignment.payment.fixedAmount > 0 && (
                                                                                <span className="text-gray-700">
                                                                                    Amount: <span className="font-bold text-emerald-700">QAR {assignment.payment.fixedAmount.toLocaleString()}</span>
                                                                                </span>
                                                                            )}
                                                                            {assignment.payment.type === 'daily' && assignment.payment.dailyRate > 0 && (
                                                                                <span className="text-gray-700">
                                                                                    Rate: <span className="font-bold text-emerald-700">QAR {assignment.payment.dailyRate.toLocaleString()}/day</span>
                                                                                    {assignment.payment.totalDays > 0 && (
                                                                                        <span className="ml-1 text-gray-600">({assignment.payment.totalDays} days)</span>
                                                                                    )}
                                                                                </span>
                                                    )}
                                                </div>
                                                                        
                                                                        {/* Overtime */}
                                                                        {assignment.payment.overtimeHours > 0 && assignment.payment.overtimeRate > 0 && (
                                                                            <div className="text-xs text-gray-600">
                                                                                Overtime: {assignment.payment.overtimeHours} hrs @ QAR {assignment.payment.overtimeRate.toLocaleString()}/hr
                                                                                <span className="font-semibold ml-1">
                                                                                    = QAR {(assignment.payment.overtimeHours * assignment.payment.overtimeRate).toLocaleString()}
                                                                                </span>
                                            </div>
                                                                        )}
                                                                        
                                                                        {/* Allowances */}
                                                                        {(assignment.payment.bonus > 0 || assignment.payment.transportationAllowance > 0 || assignment.payment.mealAllowance > 0 || assignment.payment.deductions > 0) && (
                                                                            <div className="pt-2 border-t border-emerald-200">
                                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                                    {assignment.payment.bonus > 0 && (
                                                                                        <div className="text-gray-700">
                                                                                            <span className="text-gray-500">Bonus:</span> <span className="font-semibold text-emerald-700">+QAR {assignment.payment.bonus.toLocaleString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {assignment.payment.transportationAllowance > 0 && (
                                                                                        <div className="text-gray-700">
                                                                                            <span className="text-gray-500">Transport:</span> <span className="font-semibold text-emerald-700">+QAR {assignment.payment.transportationAllowance.toLocaleString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {assignment.payment.mealAllowance > 0 && (
                                                                                        <div className="text-gray-700">
                                                                                            <span className="text-gray-500">Meal:</span> <span className="font-semibold text-emerald-700">+QAR {assignment.payment.mealAllowance.toLocaleString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {assignment.payment.deductions > 0 && (
                                                                                        <div className="text-gray-700">
                                                                                            <span className="text-gray-500">Deductions:</span> <span className="font-semibold text-red-600">-QAR {assignment.payment.deductions.toLocaleString()}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {assignment.payment.notes && (
                                                                            <div className="pt-2 border-t border-emerald-200">
                                                                                <p className="text-xs text-gray-600 italic">{assignment.payment.notes}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="text-right ml-4">
                                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Payment</p>
                                                                    <p className="text-2xl font-bold text-emerald-600">QAR {assignment.payment.totalPayment.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Assignment Info */}
                                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                                        <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                        {event?.staffAssigned && event?.staffRequired && (
                                                            <span>Staff: {event.staffAssigned}/{event.staffRequired}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <Card className="text-center py-16 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-dashed border-blue-300">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="text-blue-700" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('assignments.noEventAssignments')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('assignments.youllSeeAssignments')}</p>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('jobs')}
                        >
                            <Briefcase size={16} className="mr-2" />
                            {t('assignments.browseAvailableJobs')}
                        </Button>
                    </motion.div>
                    </Card>
                )}
            </div>
    )
}

{/* EARNINGS TAB */}
{
    activeTab === 'earnings' && (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('earnings.myEarnings')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('earnings.trackEarnings')}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setEarningsPeriod('week')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            earningsPeriod === 'week' ? 'bg-qatar text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('earnings.week')}
                    </button>
                    <button
                        onClick={() => setEarningsPeriod('month')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            earningsPeriod === 'month' ? 'bg-qatar text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('earnings.month')}
                    </button>
                    <button
                        onClick={() => setEarningsPeriod('year')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            earningsPeriod === 'year' ? 'bg-qatar text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('earnings.year')}
                    </button>
                    <button
                        onClick={() => setEarningsPeriod('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            earningsPeriod === 'all' ? 'bg-qatar text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('earnings.allTime')}
                    </button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            // Export earnings to CSV
                            const csvContent = [
                                ['Event', 'Date', 'Hours', 'Rate', 'Total', 'Status'],
                                ...earnings.map(e => [
                                    e.eventName || 'N/A',
                                    e.shiftDate || 'N/A',
                                    e.hoursWorked || 0,
                                    e.hourlyRate || 0,
                                    e.totalAmount || 0,
                                    e.status || 'Pending'
                                ])
                            ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
                            
                            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(blob);
                            link.setAttribute('href', url);
                            link.setAttribute('download', `earnings-${new Date().toISOString().split('T')[0]}.csv`);
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success(t('earnings.exportedSuccessfully'));
                        }}
                    >
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                </div>
            </div>

            {/* Earnings Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider">{t('earnings.totalEarnings')}</p>
                            <DollarSign size={24} className="text-emerald-200" />
                        </div>
                        <p className="text-3xl font-extrabold">
                            QAR {earnings.reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString()}
                        </p>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-blue-100 uppercase tracking-wider">Pending</p>
                            <Clock size={24} className="text-blue-200" />
                        </div>
                        <p className="text-3xl font-extrabold">
                            QAR {earnings.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString()}
                        </p>
                    </Card>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-bold text-purple-100 uppercase tracking-wider">Paid</p>
                            <CheckCircle size={24} className="text-purple-200" />
                        </div>
                        <p className="text-3xl font-extrabold">
                            QAR {earnings.filter(e => e.status === 'PAID' || e.status === 'Paid').reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString()}
                        </p>
                    </Card>
                </motion.div>
            </div>

            {/* Earnings List */}
            {isLoadingEarnings ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <div className="h-24 bg-gray-200 rounded"></div>
                        </Card>
                    ))}
                </div>
            ) : earnings.length > 0 ? (
                <div className="space-y-4">
                    {earnings.map((earning, index) => (
                        <motion.div
                            key={earning.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className={`hover:shadow-lg transition-shadow ${earning.status === 'PAID' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-500'}`}>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-3">
                                            <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                        <h3 className="text-xl font-bold text-gray-900">{earning.eventName || 'Event'}</h3>
                                                        <Badge 
                                                            status={
                                                                earning.status === 'PAID' ? 'Paid' :
                                                                earning.status === 'PENDING' ? 'Pending' :
                                                                earning.status === 'APPROVED' ? 'Approved' :
                                                                'Pending'
                                                            }
                                                        />
                                                        {earning.eventStatus && (
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                                earning.eventStatus === 'LIVE' ? 'bg-red-100 text-red-600' :
                                                                earning.eventStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-600' :
                                                                earning.eventStatus === 'APPROVED' ? 'bg-blue-100 text-blue-600' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {earning.eventStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                                        {earning.eventLocation && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <MapPin size={16} className="text-gray-400" />
                                                                <span className="font-medium">{earning.eventLocation}</span>
                                                            </div>
                                                        )}
                                                        {(earning.shiftDate || earning.eventDate) && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                        <Calendar size={16} className="text-gray-400" />
                                                                <span className="font-medium">{earning.shiftDate || earning.eventDate}</span>
                                                    </div>
                                                        )}
                                                        {(earning.shiftStartTime && earning.shiftEndTime) && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                        <Clock size={16} className="text-gray-400" />
                                                                <span className="font-medium">{earning.shiftStartTime} - {earning.shiftEndTime}</span>
                                                    </div>
                                                        )}
                                                        {earning.shiftRole && (
                                                            <div className="flex items-center gap-2 text-gray-600">
                                                                <Briefcase size={16} className="text-gray-400" />
                                                                <span className="font-medium">{earning.shiftRole}</span>
                                                    </div>
                                                        )}
                                                </div>
                                                    
                                                    {/* Payment Breakdown */}
                                                    <div className="mt-4 pt-4 border-t border-gray-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <p className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">{t('earnings.paymentBreakdown')}</p>
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-4 text-sm">
                                                                        <span className="text-gray-700">
                                                                            {t('earnings.hours')}: <span className="font-semibold text-emerald-700">{earning.hoursWorked || 0} {t('earnings.hours')}</span>
                                                                        </span>
                                                                        <span className="text-gray-700">
                                                                            {t('earnings.rate')}: <span className="font-semibold text-emerald-700">QAR {earning.hourlyRate?.toLocaleString() || 0}/{t('earnings.hours')}</span>
                                                                        </span>
                                            </div>
                                                                    
                                                                    {/* Regular Pay */}
                                                                    {earning.hoursWorked > 0 && earning.hourlyRate > 0 && (
                                                                        <div className="text-xs text-gray-600">
                                                                            {t('earnings.regular')}: {earning.hoursWorked} {t('earnings.hours')} × QAR {earning.hourlyRate.toLocaleString()}
                                                                            <span className="font-semibold ml-1 text-emerald-700">
                                                                                = QAR {(earning.hoursWorked * earning.hourlyRate).toLocaleString()}
                                                                            </span>
                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Overtime */}
                                                                    {earning.overtimeHours > 0 && earning.overtimeRate > 0 && (
                                                                        <div className="text-xs text-gray-600 pt-2 border-t border-emerald-200">
                                                                            {t('earnings.overtime')}: {earning.overtimeHours} {t('earnings.hours')} × QAR {earning.overtimeRate.toLocaleString()}/{t('earnings.hours')}
                                                                            <span className="font-semibold ml-1 text-emerald-700">
                                                                                = QAR {(earning.overtimeHours * earning.overtimeRate).toLocaleString()}
                                                                            </span>
                                    </div>
                                                                    )}
                                                                    
                                                                    {earning.paymentDate && (
                                                                        <div className="pt-2 border-t border-emerald-200">
                                                                            <p className="text-xs text-gray-500">
                                                                                {t('earnings.paymentDate')}: <span className="font-semibold">{earning.paymentDate}</span>
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{t('earnings.totalEarnings')}</p>
                                                                <p className="text-3xl font-bold text-emerald-600">QAR {earning.totalAmount?.toLocaleString() || 0}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {earning.eventDescription && (
                                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                                            <p className="text-xs font-bold text-gray-500 mb-1">{t('earnings.eventDescription')}</p>
                                                            <p className="text-sm text-gray-700">{earning.eventDescription}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-16 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-dashed border-emerald-300">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-200 to-emerald-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <DollarSign className="text-emerald-700" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('earnings.noEarningsYet')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('earnings.earningsWillAppear')}</p>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('shifts')}
                        >
                            <Calendar size={16} className="mr-2" />
                            {t('earnings.viewMyShifts')}
                        </Button>
                    </motion.div>
                </Card>
            )}
        </div>
    )
}

{/* NEW JOB MARKETPLACE TAB */ }
{
    activeTab === 'jobs' && (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('jobs.marketplace')}</h2>
                    <p className="text-gray-500 text-sm">{t('jobs.browseOpportunities')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Card className="px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700">
                                {jobs.length} {jobs.length === 1 ? t('jobs.opportunity') : t('jobs.opportunities')} {t('jobs.available')}
                            </span>
                        </div>
                    </Card>
                </div>
                                </div>
            
            {/* My Event Applications Section */}
            {myEventApplications.length > 0 && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase size={20} className="text-blue-600" />
                                {t('jobs.myEventApplications') || 'My Event Applications'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {t('jobs.trackYourApplications') || 'Track your event job applications and their status'}
                            </p>
                        </div>
                        <Badge status="Info" className="bg-blue-100 text-blue-700">
                            {myEventApplications.length} {myEventApplications.length === 1 ? t('application.singular') : t('application.plural')}
                        </Badge>
                    </div>
                    
                    <div className="space-y-3">
                        {myEventApplications.map((app: any, index: number) => {
                            // Use eventIdObject from backend (populated event data) or find in eventsData
                            const eventFromBackend = app.eventIdObject; // Backend populates this
                            const eventFromData = eventsData.find((e: any) => {
                                const eventId = (e.id || e._id)?.toString();
                                const appEventId = app.eventId?.toString() || 
                                                 app.eventId || 
                                                 app.eventIdObject?._id?.toString() || 
                                                 app.eventIdObject?.id?.toString();
                                return eventId === appEventId;
                            });
                            
                            // Prefer backend populated data, fallback to eventsData
                            const event = eventFromBackend || eventFromData;
                            
                            // Extract event details from backend populated object or eventsData
                            const eventTitle = event?.title || app.eventTitle || 'Event';
                            const eventDate = event?.date || 
                                            (event?.startAt ? new Date(event.startAt).toISOString().split('T')[0] : null) ||
                                            app.eventDate;
                            const eventLocation = event?.location ? 
                                (typeof event.location === 'object' ? event.location.address || event.location.city : event.location) :
                                app.eventLocation;
                            
                            return (
                                <motion.div
                                    key={app.id || app._id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="bg-white border border-blue-200 hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-gray-900 text-lg">
                                                        {eventTitle}
                                                    </h4>
                                                    <Badge status={app.status} />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1.5">
                                                        <Briefcase size={14} />
                                                        {app.roleApplied || 'General Staff'}
                                                    </span>
                                                    {eventDate && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar size={14} />
                                                            {eventDate}
                                                        </span>
                                                    )}
                                                    {eventLocation && (
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin size={14} />
                                                            {eventLocation}
                                                        </span>
                                                    )}
                                                    {app.appliedDate && (
                                                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                                            {t('application.applied')}: {app.appliedDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </Card>
            )}
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder={t('jobs.searchJobs')}
                        value={jobSearch}
                        onChange={(e) => setJobSearch(e.target.value)}
                        icon={<Search />}
                        name="jobSearch"
                    />
                            </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setJobFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            jobFilter === 'all' 
                                ? 'bg-qatar text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('jobs.allJobs')}
                    </button>
                    <button
                        onClick={() => setJobFilter('vip')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                            jobFilter === 'vip' 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        <Crown size={14} /> {t('jobs.vipOnly')}
                    </button>
                    <button
                        onClick={() => setJobFilter('regular')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            jobFilter === 'regular' 
                                ? 'bg-blue-500 text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {t('jobs.regular')}
                    </button>
                                </div>
                            </div>
            
            {isLoadingJobs ? (
                <SkeletonList items={3} />
            ) : jobs.length > 0 ? (
            <div className="grid gap-6">
                {jobs
                    .filter(job => {
                        const matchesSearch = jobSearch === '' || 
                            job.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
                            job.role.toLowerCase().includes(jobSearch.toLowerCase()) ||
                            job.location.toLowerCase().includes(jobSearch.toLowerCase());
                        const matchesFilter = jobFilter === 'all' || 
                            (jobFilter === 'vip' && job.isVIP) ||
                            (jobFilter === 'regular' && !job.isVIP);
                        return matchesSearch && matchesFilter;
                    })
                    .sort((a, b) => {
                        // Sort by date (upcoming first), then by VIP status, then by spots available
                        const dateA = new Date(a.date).getTime();
                        const dateB = new Date(b.date).getTime();
                        if (dateA !== dateB) return dateA - dateB;
                        if (a.isVIP !== b.isVIP) return a.isVIP ? -1 : 1;
                        return b.spotsOpen - a.spotsOpen;
                    })
                    .map((job, index) => {
                        const jobDate = new Date(job.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const daysUntil = Math.ceil((jobDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const isUrgent = daysUntil <= 3 && daysUntil > 0;
                        const isVeryUrgent = daysUntil === 1;
                        
                        return (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className={`relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 ${
                                job.isVIP 
                                    ? 'border-amber-300 hover:border-amber-400 bg-gradient-to-br from-amber-50/50 to-white' 
                                    : isUrgent
                                    ? 'border-red-200 hover:border-red-300 bg-gradient-to-br from-red-50/30 to-white'
                                    : 'border-gray-200 hover:border-qatar/40'
                            }`}>
                                {/* VIP Badge */}
                                {job.isVIP && (
                                    <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 via-amber-300 to-amber-200 text-amber-900 text-xs font-bold px-5 py-2 rounded-bl-2xl flex items-center gap-1.5 shadow-lg z-10">
                                        <Crown size={14} fill="currentColor" /> {t('jobs.vipEvent')}
                        </div>
                                )}
                                
                                {/* Urgency Badge */}
                                {isVeryUrgent && (
                                    <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-4 py-2 rounded-br-2xl flex items-center gap-1.5 shadow-lg z-10 animate-pulse">
                                        <Clock size={12} /> {t('jobs.urgentTomorrow')}
                            </div>
                                )}
                                {isUrgent && !isVeryUrgent && (
                                    <div className="absolute top-0 left-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-4 py-2 rounded-br-2xl flex items-center gap-1.5 shadow-lg z-10">
                                        <Clock size={12} /> {t('jobs.daysLeft').replace('{days}', String(daysUntil))}
                                </div>
                                )}
                                
                                <div className="flex flex-col lg:flex-row justify-between gap-6 p-6">
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <h3 className="font-bold text-2xl text-gray-900 mb-2 group-hover:text-qatar transition-colors">
                                                {job.title}
                                            </h3>
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="px-3 py-1.5 bg-qatar/10 text-qatar font-bold text-sm rounded-lg border border-qatar/20">
                                                    {job.role}
                                                </span>
                                                {daysUntil > 0 && (
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        {daysUntil === 1 ? t('jobs.tomorrow') : t('jobs.inDays').replace('{days}', String(daysUntil))}
                                                    </span>
                                                )}
                            </div>
                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <Calendar size={18} className="text-blue-600" />
                                            </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">{t('jobs.date')}</p>
                                                    <p className="text-sm font-bold text-gray-900">{job.date}</p>
                                        </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <Clock size={18} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 font-medium">{t('jobs.time')}</p>
                                                    <p className="text-sm font-bold text-gray-900">{job.time}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                    <MapPin size={18} className="text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-500 font-medium">{t('jobs.location')}</p>
                                                    <p className="text-sm font-bold text-gray-900 truncate">{job.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Event Description */}
                                        {(() => {
                                            // Find the event from jobs to get description
                                            const event = eventsData.find((e: any) => (e.id || e._id) === job.eventId);
                                            if (event?.description) {
                                                return (
                                                    <div className="pt-4 border-t border-gray-200">
                                                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('jobs.eventDescription')}</p>
                                                        <p className="text-sm text-gray-700 line-clamp-2">{event.description}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                        
                                        {job.requirements && job.requirements.length > 0 && (
                                            <div className="pt-4 border-t border-gray-200">
                                                <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">{t('jobs.requirements')}</p>
                                            <div className="flex flex-wrap gap-2">
                            {job.requirements.map((req, i) => (
                                                    <span 
                                                        key={i} 
                                                            className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 font-medium hover:border-qatar/30 transition-colors"
                                                    >
                                                        {req}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col items-center lg:items-end gap-4 min-w-[180px]">
                                        <div className="text-center lg:text-right w-full">
                                            <p className="text-4xl font-extrabold bg-gradient-to-r from-qatar to-blue-600 bg-clip-text text-transparent">
                                                QAR {job.rate.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">{t('admin.totalPay')}</p>
                                        </div>
                                        
                                        <div className="flex flex-col gap-3 w-full">
                                            {(() => {
                                                // Check if already applied to this event
                                                const alreadyApplied = job.eventId && myEventApplications.some((app: any) => {
                                                    const appEventId = app.eventId || app.eventIdObject?._id || app.eventIdObject?.id;
                                                    const jobEventId = job.eventId?.toString();
                                                    return appEventId?.toString() === jobEventId && app.status !== 'Rejected';
                                                });
                                                
                                                if (alreadyApplied) {
                                                    const appliedApp = myEventApplications.find((app: any) => {
                                                        const appEventId = app.eventId || app.eventIdObject?._id || app.eventIdObject?.id;
                                                        const jobEventId = job.eventId?.toString();
                                                        return appEventId?.toString() === jobEventId;
                                                    });
                                                    
                                                    return (
                                                        <div className="w-full">
                                                            <Button 
                                                                size="sm" 
                                                                disabled
                                                                className="w-full font-bold bg-gray-300 text-gray-600 cursor-not-allowed"
                                                            >
                                                                <CheckCircle size={16} className="mr-2" /> 
                                                                {appliedApp?.status === 'Approved' 
                                                                    ? t('jobs.approved') || 'Approved'
                                                                    : appliedApp?.status === 'Interview'
                                                                    ? t('jobs.interviewScheduled') || 'Interview Scheduled'
                                                                    : t('jobs.alreadyApplied') || 'Already Applied'}
                                                            </Button>
                                                            {appliedApp?.status === 'Pending' && (
                                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                                    {t('jobs.waitingForReview') || 'Waiting for admin review'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => applyForJob(job.id)} 
                                                        className={`w-full font-bold shadow-lg hover:shadow-xl transition-all ${
                                                            job.isVIP 
                                                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white' 
                                                                : isUrgent
                                                                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                                                                : 'bg-qatar hover:bg-qatar-light text-white'
                                                        }`}
                                                    >
                                                        <Briefcase size={16} className="mr-2" /> {t('jobs.applyNow')}
                                                    </Button>
                                                );
                                            })()}
                                            
                                            <div className={`flex items-center justify-center gap-2 text-xs font-bold px-4 py-2.5 rounded-lg ${
                                                job.spotsOpen <= 2
                                                    ? 'text-red-700 bg-red-50 border border-red-200'
                                                    : job.spotsOpen <= 5
                                                    ? 'text-amber-700 bg-amber-50 border border-amber-200'
                                                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                                            }`}>
                                                <div className={`w-2.5 h-2.5 rounded-full ${
                                                    job.spotsOpen <= 2 ? 'bg-red-500' : job.spotsOpen <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                                } animate-pulse`}></div>
                                                {job.spotsOpen} {t('jobs.spotsLeft')}
                                            </div>
                                        </div>
                                    </div>
                        </div>
                    </Card>
                        </motion.div>
                        );
                    })}
            </div>
            ) : (
                <Card className="text-center py-16 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-dashed border-amber-300">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="text-amber-700" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('jobs.noJobsFound')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('jobs.tryAdjusting')}</p>
                        <div className="flex gap-2 justify-center">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setJobFilter('all')}
                            >
                                <Filter size={16} className="mr-2" />
                                {t('ui.clearFilters')}
                            </Button>
                        </div>
                    </motion.div>
                    </Card>
                )}
        </div>
    )
}

{
    activeTab === 'documents' && (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('documents.myDocuments')}</h2>
                    <p className="text-gray-500 text-sm mt-1">{t('ui.manageYourIdentification')}</p>
            </div>
                <Button onClick={() => setIsUploadOpen(true)}>
                    <Upload size={18} className="mr-2" /> {t('ui.uploadNew')}
                </Button>
            </div>
            
            {/* Document Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-50 border-emerald-200">
                    <div className="flex items-center justify-between">
                            <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">{t('documents.verified')}</p>
                            <p className="text-2xl font-bold text-emerald-900">
                                {documents.filter(d => d.status === 'Verified').length}
                            </p>
                        </div>
                        <CheckCircle className="text-emerald-600" size={32} />
                    </div>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-amber-600 uppercase mb-1">{t('documents.pending')}</p>
                            <p className="text-2xl font-bold text-amber-900">
                                {documents.filter(d => d.status === 'Pending').length}
                            </p>
                        </div>
                        <Clock className="text-amber-600" size={32} />
                    </div>
                </Card>
                <Card className="bg-red-50 border-red-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-red-600 uppercase mb-1">{t('documents.expiringSoon')}</p>
                            <p className="text-2xl font-bold text-red-900">
                                {documents.filter(d => {
                                    const expiry = new Date(d.expiryDate);
                                    const today = new Date();
                                    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                }).length}
                            </p>
                        </div>
                        <AlertTriangle className="text-red-600" size={32} />
                    </div>
                </Card>
            </div>
            
            {isLoadingDocuments ? (
                <SkeletonList items={3} />
            ) : (
            <div className="grid gap-4">
                {documents.map((doc, index) => {
                        const hasExpiry = doc.expiryDate && doc.expiryDate !== 'undefined' && doc.expiryDate !== '';
                        let daysUntilExpiry = 0;
                        let isExpiringSoon = false;
                        let isExpired = false;
                        
                        if (hasExpiry) {
                            try {
                    const expiry = new Date(doc.expiryDate);
                    const today = new Date();
                                daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
                                isExpired = daysUntilExpiry < 0;
                            } catch (e) {
                                // Invalid date, ignore expiry
                            }
                        }
                        
                        const getDocumentIcon = () => {
                            if (doc.type === 'ID' || doc.type === 'Passport') return <User size={24} />;
                            if (doc.type === 'Certificate') return <Award size={24} />;
                            if (doc.type === 'Contract') return <FileText size={24} />;
                            return <FileText size={24} />;
                        };
                    
                    return (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                        >
                                <Card className={`group hover:shadow-lg transition-all ${
                                    isExpiringSoon ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-white' : 
                                    isExpired ? 'border-red-300 bg-gradient-to-br from-red-50/50 to-white' : 
                                    doc.status === 'Verified' ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white' :
                                    'border-gray-200'
                                }`}>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110 ${
                                                doc.status === 'Verified' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 shadow-emerald-200/50' : 
                                                doc.status === 'Rejected' ? 'bg-gradient-to-br from-red-100 to-red-200' :
                                                'bg-gradient-to-br from-gray-100 to-gray-200'
                                        }`}>
                                                <div className={doc.status === 'Verified' ? 'text-emerald-600' : doc.status === 'Rejected' ? 'text-red-600' : 'text-gray-400'}>
                                                    {getDocumentIcon()}
                                        </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-bold text-gray-900 text-lg truncate">{doc.title}</h3>
                                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                                                        doc.type === 'ID' ? 'bg-blue-100 text-blue-700' :
                                                        doc.type === 'Passport' ? 'bg-purple-100 text-purple-700' :
                                                        doc.type === 'Certificate' ? 'bg-emerald-100 text-emerald-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {doc.type}
                                                </span>
                            </div>
                                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} /> {t('ui.uploaded')}: {doc.uploadDate}
                                                    </span>
                                                    {hasExpiry && (
                                                        <span className={`flex items-center gap-1 font-medium ${
                                                    isExpired ? 'text-red-600' : 
                                                    isExpiringSoon ? 'text-amber-600' : 
                                                    'text-gray-500'
                                                }`}>
                                                            <Clock size={14} /> {t('ui.expires')}: {doc.expiryDate}
                                                            {isExpiringSoon && !isExpired && ` (${daysUntilExpiry} days)`}
                                                    {isExpired && ' (Expired)'}
                                                </span>
                                                    )}
                        </div>
                                                {(isExpiringSoon || isExpired) && (
                                                    <div className={`mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg w-fit ${
                                                        isExpired ? 'text-red-800 bg-red-100 border border-red-200' :
                                                        'text-amber-800 bg-amber-100 border border-amber-200'
                                                    }`}>
                                                        {isExpired ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
                                                        {isExpired ? t('ui.documentExpired') : t('ui.renewalRequiredSoon')}
                                                </div>
                                            )}
                                                </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <Badge status={doc.status} className="text-sm px-3 py-1.5" />
                                            <div className="flex gap-1">
                                                {doc.url && (
                                                    <>
                                                        <button 
                                                            onClick={() => window.open(doc.url, '_blank')}
                                                            className="p-2.5 hover:bg-gray-100 rounded-lg transition-all hover:scale-110 active:scale-95" 
                                                            title={t('ui.viewDocument')}
                                                        >
                                                <Eye size={18} className="text-gray-600" />
                                            </button>
                                                        <button 
                                                            onClick={() => {
                                                                const link = document.createElement('a');
                                                                link.href = doc.url;
                                                                link.download = doc.title;
                                                                link.click();
                                                            }}
                                                            className="p-2.5 hover:bg-gray-100 rounded-lg transition-all hover:scale-110 active:scale-95" 
                                                            title={t('ui.downloadDocument')}
                                                        >
                                                <Download size={18} className="text-gray-600" />
                                            </button>
                                                    </>
                                                )}
                                        </div>
                                    </div>
                                </div>
                    </Card>
                        </motion.div>
                    );
                })}
                
                {documents.length === 0 && (
                    <Card className="text-center py-12">
                        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500 font-bold">{t('ui.noDocumentsUploaded')}</p>
                            <p className="text-sm text-gray-400 mt-2">{t('ui.uploadYourFirstDocument')}</p>
                        <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
                                <Upload size={18} className="mr-2" /> {t('ui.uploadDocument')}
                        </Button>
                    </Card>
                )}
            </div>
            )}
        </div>
    )
}

{
    activeTab === 'application' && (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('application.myApplication')}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('application.trackStatus')}</p>
                </div>
                {!myApplication && (
                    <Button onClick={() => setActiveTab('jobs')}>
                        <Briefcase size={16} className="mr-2" /> Browse Jobs
                    </Button>
                )}
            </div>

            {isLoadingApplication ? (
                <SkeletonList items={3} />
            ) : myApplication ? (
                <>
                    {/* Application Journey Progress */}
                    <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-blue-200 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-blue-100/20"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                                    <motion.div 
                                        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"
                                        whileHover={{ scale: 1.05, rotate: 5 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <FileText className="text-white" size={36} />
                                    </motion.div>
                        <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{myApplication.roleApplied}</h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Calendar size={14} /> {t('application.appliedOn')} {myApplication.appliedDate}
                                        </p>
                        </div>
                    </div>
                                <Badge status={myApplication.status} className="text-base px-5 py-2.5 shadow-lg" />
                </div>
                
                            {/* Progress Steps */}
                            <div className="relative">
                                <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full z-0"></div>
                                <div className="relative flex justify-between items-start">
                                    {[
                                        { 
                                            step: 1, 
                                            label: t('application.submitted'), 
                                            date: myApplication.appliedDate,
                                            status: 'completed',
                                            icon: FileText,
                                            color: 'emerald'
                                        },
                                        { 
                                            step: 2, 
                                            label: t('application.quizCompleted'), 
                                            date: myApplication.quizScore ? t('common.completed') : t('common.pending'),
                                            status: myApplication.quizScore ? 'completed' : 'pending',
                                            icon: BookOpen,
                                            color: myApplication.quizScore ? 'emerald' : 'gray'
                                        },
                                        { 
                                            step: 3, 
                                            label: t('application.interviewScheduled'), 
                                            date: myApplication.interviewDate || t('common.pending'),
                                            status: myApplication.status === 'Interview' ? 'completed' : myApplication.status === 'Approved' ? 'completed' : 'pending',
                                            icon: Calendar,
                                            color: myApplication.status === 'Interview' || myApplication.status === 'Approved' ? 'purple' : 'gray'
                                        },
                                        { 
                                            step: 4, 
                                            label: t('application.finalDecision'), 
                                            date: myApplication.status === 'Approved' ? t('application.approved') : t('common.pending'),
                                            status: myApplication.status === 'Approved' ? 'completed' : 'pending',
                                            icon: CheckCircle,
                                            color: myApplication.status === 'Approved' ? 'emerald' : 'gray'
                                        }
                                    ].map((stepItem, index) => {
                                        const StepIcon = stepItem.icon;
                                        const isCompleted = stepItem.status === 'completed';
                                        const isActive = index === 0 || (isCompleted && index < 3);
                                        
                                        return (
                                            <div key={stepItem.step} className="flex-1 flex flex-col items-center relative z-10">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: index * 0.2, type: "spring" }}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-lg ${
                                                        isCompleted 
                                                            ? `bg-gradient-to-br from-${stepItem.color}-500 to-${stepItem.color}-600 text-white` 
                                                            : 'bg-gray-200 text-gray-400'
                                                    }`}
                                                >
                                                    <StepIcon size={20} />
                                                </motion.div>
                                                <div className="text-center max-w-[120px]">
                                                    <p className={`text-xs font-bold mb-1 ${
                                                        isCompleted ? 'text-gray-900' : 'text-gray-400'
                                                    }`}>
                                                        {stepItem.label}
                                                    </p>
                                                    <p className={`text-xs ${
                                                        isCompleted ? 'text-gray-600' : 'text-gray-400'
                                                    }`}>
                                                        {stepItem.date}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Event Details Card */}
                    {myApplication.eventTitle && (
                        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
                            <div className="flex items-start gap-4">
                                {myApplication.eventImageUrl && (
                                    <img 
                                        src={myApplication.eventImageUrl} 
                                        alt={myApplication.eventTitle} 
                                        className="w-24 h-24 rounded-xl object-cover border-2 border-blue-200 flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xl font-bold text-gray-900">Event Details</h3>
                                        {myApplication.eventStatus && (
                                            <Badge 
                                                status={
                                                    myApplication.eventStatus === 'APPROVED' ? 'Approved' :
                                                    myApplication.eventStatus === 'LIVE' ? 'Live' :
                                                    myApplication.eventStatus === 'COMPLETED' ? 'Completed' :
                                                    'Pending'
                                                }
                                            />
                                        )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Name</p>
                                            <p className="text-lg font-bold text-gray-900">{myApplication.eventTitle}</p>
                                        </div>
                                        {myApplication.eventDate && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Event Date</p>
                                                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <Calendar size={14} /> {myApplication.eventDate}
                                                </p>
                                                {myApplication.eventStartTime && myApplication.eventEndTime && (
                                                    <p className="text-xs text-gray-600 flex items-center gap-2 mt-1">
                                                        <Clock size={12} /> {myApplication.eventStartTime} - {myApplication.eventEndTime}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        {myApplication.eventLocation && (
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Location</p>
                                                <p className="text-sm text-gray-900 flex items-center gap-2">
                                                    <MapPin size={14} /> {myApplication.eventLocation}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Role Applied</p>
                                            <p className="text-sm font-bold text-qatar">{myApplication.roleApplied}</p>
                                        </div>
                                    </div>
                                    {myApplication.eventDescription && (
                                        <div className="mt-4 pt-4 border-t border-blue-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Event Description</p>
                                            <p className="text-sm text-gray-700">{myApplication.eventDescription}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">{t('application.quizScore')}</p>
                                        <p className={`text-3xl font-bold ${
                                            (myApplication.quizScore || 0) >= 70 ? 'text-emerald-700' :
                                            (myApplication.quizScore || 0) >= 50 ? 'text-amber-700' :
                                            'text-red-700'
                        }`}>
                            {myApplication.quizScore || 0}%
                        </p>
                    </div>
                                    <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                                        <BookOpen className="text-emerald-700" size={24} />
                    </div>
                                </div>
                            </Card>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">{t('application.status')}</p>
                                        <p className="text-2xl font-bold text-blue-900">{myApplication.status}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                                        <CheckCircle className="text-blue-700" size={24} />
                    </div>
                </div>
            </Card>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">{t('application.experience')}</p>
                                        <p className="text-2xl font-bold text-purple-900">{myApplication.experience}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                                        <Award className="text-purple-700" size={24} />
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

            {/* Interview Schedule Card */}
            {myApplication.status === 'Interview' && myApplication.interviewDate && (
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-gray-900">Interview Scheduled</h3>
                                    {myApplication.interviewType && (
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            myApplication.interviewType === 'online' 
                                                ? 'bg-blue-100 text-blue-700' 
                                                : 'bg-purple-100 text-purple-700'
                                        }`}>
                                            {myApplication.interviewType === 'online' ? 'Online' : 'Local'}
                                        </span>
                                    )}
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setIsInterviewModalOpen(true)}
                                >
                                    <Eye size={16} className="mr-2" /> View Details
                                </Button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Date & Time</p>
                                    <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar size={16} /> {myApplication.interviewDate}
                                    </p>
                                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                        <Clock size={14} /> {myApplication.interviewTime}
                                    </p>
                                </div>
                                <div>
                                    {myApplication.interviewType === 'local' ? (
                                        <>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Location</p>
                                            <p className="text-sm text-gray-900 flex items-center gap-2">
                                                <MapPin size={14} /> {myApplication.interviewLocation}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Meeting</p>
                                            {myApplication.meetingLink && (
                                                <a 
                                                    href={myApplication.meetingLink} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline inline-block flex items-center gap-1"
                                                >
                                                    <Phone size={14} /> Join Virtual Meeting
                                                </a>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                            {myApplication.interviewNotes && (
                                <div className="mt-4 pt-4 border-t border-purple-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">Interview Notes</p>
                                    <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                                        {myApplication.interviewNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Quiz Test Section */}
            <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                            <BookOpen size={24} /> {t('quiz.protocolQuiz')}
                        </h3>
                        <p className="text-sm text-gray-600">{t('quiz.takeQuiz')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {myApplication.quizScore ? (
                        <>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">{t('quiz.yourScore')}</p>
                                <p className={`text-3xl font-bold ${
                                    (myApplication.quizScore || 0) >= 70 ? 'text-emerald-600' :
                                    (myApplication.quizScore || 0) >= 50 ? 'text-amber-600' :
                                    'text-red-600'
                                }`}>
                                    {myApplication.quizScore}%
                                </p>
                            </div>
                            <Button 
                                variant="outline"
                                onClick={() => setIsQuizModalOpen(true)}
                            >
                                <Eye size={16} className="mr-2" /> {t('quiz.viewResults')}
                            </Button>
                            <Button 
                                onClick={startQuizTest}
                            >
                                <PlayCircle size={16} className="mr-2" /> {t('quiz.retakeQuiz')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="flex-1">
                                <p className="text-sm text-gray-600">{t('quiz.completeQuiz')}</p>
                            </div>
                            <Button 
                                onClick={startQuizTest}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <PlayCircle size={16} className="mr-2" /> {t('quiz.startQuizTest')}
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            {/* Quiz Results Card */}
            {myApplication.quizScore && (
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={24} /> {t('application.quizResults')}
                        </h3>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsQuizModalOpen(true)}
                        >
                            <Eye size={16} className="mr-2" /> {t('application.viewFullResults')}
                        </Button>
                    </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">{t('application.overallScore')}</p>
                            <p className={`text-4xl font-extrabold ${
                                (myApplication.quizScore || 0) >= 70 ? 'text-emerald-600' :
                                (myApplication.quizScore || 0) >= 50 ? 'text-amber-600' :
                                'text-red-600'
                            }`}>
                                {myApplication.quizScore || 0}%
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">
                                {myApplication.quizDetails?.filter(q => q.isCorrect).length || 0} / {myApplication.quizDetails?.length || 0} {t('application.correct')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {myApplication.quizDetails ? Math.round((myApplication.quizDetails.filter(q => q.isCorrect).length / myApplication.quizDetails.length) * 100) : 0}% {t('application.passRate')}
                            </p>
                        </div>
                    </div>
                </div>

                {myApplication.quizDetails && myApplication.quizDetails.length > 0 && (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {myApplication.quizDetails.slice(0, 3).map((q, i) => (
                            <div 
                                key={i} 
                                className={`p-3 rounded-lg border-2 ${
                                    q.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                        q.isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 mb-1">{q.question}</p>
                                        <p className={`text-xs font-medium ${
                                            q.isCorrect ? 'text-emerald-700' : 'text-red-700'
                                        }`}>
                                            {q.isCorrect ? '✓ Correct' : '✗ Incorrect'} - Selected Option {q.selectedOption + 1}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {myApplication.quizDetails.length > 3 && (
                            <p className="text-center text-sm text-gray-500">
                                +{myApplication.quizDetails.length - 3} more questions
                            </p>
                        )}
            </div>
                )}
                </Card>
            )}

            {/* Personal Information */}
            <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Contact Details</p>
                        <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-gray-700">
                                <User size={14} className="text-gray-400" /> 
                                <span className="font-semibold">Name:</span> {myApplication.name}
                            </p>
                            <p className="flex items-center gap-2 text-gray-700">
                                <Mail size={14} className="text-gray-400" /> 
                                <span className="font-semibold">Email:</span> {myApplication.email}
                            </p>
                            {myApplication.phone && (
                                <p className="flex items-center gap-2 text-gray-700">
                                    <Phone size={14} className="text-gray-400" /> 
                                    <span className="font-semibold">Phone:</span> {myApplication.phone}
                                </p>
                            )}
                            <p className="flex items-center gap-2 text-gray-700">
                                <MapPin size={14} className="text-gray-400" /> 
                                <span className="font-semibold">Location:</span> {myApplication.location}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Additional Details</p>
                        <div className="space-y-2 text-sm">
                            {myApplication.nationality && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">Nationality:</span> {myApplication.nationality}
                                </p>
                            )}
                            {myApplication.dob && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">Date of Birth:</span> {myApplication.dob}
                                </p>
                            )}
                            {myApplication.gender && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">Gender:</span> {myApplication.gender}
                                </p>
                            )}
                            {myApplication.languages && myApplication.languages.length > 0 && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">Languages:</span> {myApplication.languages.join(', ')}
                                </p>
                            )}
                            {myApplication.experience && (
                                <p className="text-gray-700">
                                    <span className="font-semibold">Experience:</span> {myApplication.experience}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                {(myApplication.cvUrl || myApplication.idDocumentUrl) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Documents</p>
                        <div className="flex gap-3">
                            {myApplication.cvUrl && (
                                <a 
                                    href={myApplication.cvUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <FileText size={16} /> View CV
                                </a>
                            )}
                            {myApplication.idDocumentUrl && (
                                <a 
                                    href={myApplication.idDocumentUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    <FileText size={16} /> View ID Document
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </Card>

            {/* Application Timeline */}
            <Card>
                <h3 className="text-xl font-bold text-gray-900 mb-6">{t('application.timeline')}</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-900">{t('application.submitted')}</p>
                            <p className="text-sm text-gray-500">{myApplication.appliedDate}</p>
                            {myApplication.eventTitle && (
                                <p className="text-xs text-gray-400 mt-1">For: {myApplication.eventTitle}</p>
                            )}
                        </div>
                    </div>
                    {myApplication.quizScore && (
                        <div className="flex items-start gap-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{t('application.quizCompleted')}</p>
                                <p className="text-sm text-gray-500">Score: {myApplication.quizScore}%</p>
                            </div>
                        </div>
                    )}
                    {myApplication.status === 'Interview' && myApplication.interviewDate && (
                        <div className="flex items-start gap-4">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{t('application.interviewScheduled')}</p>
                                <p className="text-sm text-gray-500">{myApplication.interviewDate} at {myApplication.interviewTime}</p>
                            </div>
                        </div>
                    )}
                    {myApplication.status === 'Approved' && (
                        <div className="flex items-start gap-4">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <div className="flex-1">
                                <p className="font-bold text-emerald-600">{t('application.approved')}</p>
                                <p className="text-sm text-gray-500">{t('application.welcomeTeam')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
                </>
            ) : (
                <Card className="text-center py-16 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-purple-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-blue-700" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Active Application</h3>
                        <p className="text-sm text-gray-600 mb-6">Start your journey by applying for a position</p>
                        <Button 
                            onClick={() => setActiveTab('jobs')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Briefcase size={16} className="mr-2" />
                            Browse Available Positions
                        </Button>
                    </motion.div>
                </Card>
            )}
        </div>
    )
}

{
    activeTab === 'profile' && (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card className="text-center p-8 bg-gradient-to-br from-gray-50 to-white">
                <div className="relative inline-block mb-4">
                    <div className="relative">
                    <img src={profile.avatar} className="w-32 h-32 rounded-full border-4 border-white shadow-xl" alt="" />
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white"></div>
                    </div>
                    <button 
                        onClick={() => setIsProfileEditOpen(true)}
                        className="absolute bottom-0 right-0 bg-qatar text-white p-2 rounded-full hover:bg-qatar-light shadow-lg transition-transform hover:scale-110"
                    >
                        <Settings size={16} />
                    </button>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">{profile.name}</h2>
                <p className="text-gray-500 mb-2">{profile.role} • {profile.location}</p>
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <span className="text-sm font-bold text-gray-700">{profile.rating}</span>
                    <span className="text-xs text-gray-500">({profile.completedShifts} reviews)</span>
                </div>

                <div className="grid grid-cols-3 gap-6 border-t border-gray-100 pt-6">
                    <div>
                        <p className="text-3xl font-bold text-gray-900">{profile.completedShifts}</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">{t('dashboard.completedShifts')}</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-emerald-600">{profile.onTimeRate}%</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">{t('ui.onTimeRate')}</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-amber-600">{profile.xpPoints}</p>
                        <p className="text-xs text-gray-500 uppercase mt-1">{t('profile.xpPoints')}</p>
                    </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Profile Strength */}
            <Card>
                <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 size={20} /> {t('profile.profileStrength')}
                        </h3>
                        <span className="text-2xl font-bold text-gray-900">{profile.profileStrength.overall}%</span>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(profile.profileStrength.sections).map(([key, value]) => (
                            <div key={key}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600 capitalize">{key}</span>
                                    <span className="font-bold text-gray-900">{value}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Skills & Languages */}
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900">{t('profile.skillsLanguages')}</h3>
                        <button 
                            onClick={() => setIsSkillsEditOpen(true)}
                            className="text-sm text-qatar font-bold hover:underline flex items-center gap-1"
                        >
                            <Edit size={14} /> {t('profile.manage')}
                        </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, i) => (
                            <div 
                                key={i} 
                                className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-gray-100 transition-colors"
                            >
                            <span className="text-sm font-bold text-gray-700">{skill.name}</span>
                                {skill.status === 'Verified' ? (
                                    <CheckCircle size={16} className="text-emerald-500" />
                                ) : (
                                    <Clock size={16} className="text-amber-500" />
                                )}
                        </div>
                    ))}
                </div>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 mb-3 uppercase">{t('profile.certifications')}</p>
                        <div className="flex flex-wrap gap-2">
                            {profile.certifications.map((cert, i) => (
                                <div key={i} className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-2">
                                    <Award size={14} className="text-blue-600" />
                                    <span className="text-sm font-bold text-blue-700">{cert}</span>
                                </div>
                            ))}
                        </div>
                </div>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
                <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp size={20} /> {t('profile.performanceMetrics')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="text-blue-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{profile.completedShifts}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('ui.totalShifts')}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle className="text-emerald-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{profile.onTimeRate}%</p>
                        <p className="text-xs text-gray-500 mt-1">On-Time Rate</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Star className="text-amber-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{profile.rating}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('ui.averageRating')}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Zap className="text-purple-600" size={24} />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{profile.xpPoints}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('ui.xpPoints')}</p>
                    </div>
                </div>
            </Card>

            {/* Photo Gallery */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Image size={24} /> {t('profile.photoGallery')}
                        </h3>
                        <span className="text-sm text-gray-500">({galleryPhotos.length} photos)</span>
                        {selectedPhotos.length > 0 && (
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {selectedPhotos.length} selected
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedPhotos.length > 0 ? (
                            <>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={async () => {
                                            if (confirm(t('ui.deleteSelectedPhotos', { count: selectedPhotos.length }))) {
                                                try {
                                                    setIsLoadingGallery(true);
                                                    const staffId = staffProfile?.id || staffProfile?._id;
                                                    if (!staffId) {
                                                        throw new Error('Staff ID not found');
                                                    }
                                                    
                                                    // Delete each selected photo from backend
                                                    for (const photoId of selectedPhotos) {
                                                        await apiStaff.deleteGalleryPhoto(staffId, photoId);
                                                    }
                                                    
                                                    // Refresh gallery photos
                                                    const updatedProfile = await apiStaff.getProfile();
                                                    if (updatedProfile.data?.galleryPhotos) {
                                                        const transformedPhotos = updatedProfile.data.galleryPhotos.map((photo: any) => ({
                                                            id: photo._id?.toString() || photo.id || '',
                                                            url: photo.url || '',
                                                            thumbnail: photo.thumbnail || photo.url || '',
                                                            uploadedAt: photo.uploadedAt || new Date().toISOString().split('T')[0],
                                                            caption: photo.caption || '',
                                                            isProfilePicture: photo.isProfilePicture || false,
                                                        }));
                                                        setGalleryPhotos(transformedPhotos);
                                                    }
                                                    
                                                setSelectedPhotos([]);
                                                    toast.success(`Deleted ${selectedPhotos.length} photo(s)`);
                                                } catch (error: any) {
                                                    console.error('Failed to delete photos:', error);
                                                    toast.error(error?.response?.data?.error || 'Failed to delete photos');
                                                } finally {
                                                    setIsLoadingGallery(false);
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} className="mr-2" /> {t('ui.deleteSelected')}
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => setSelectedPhotos([])}
                                    >
                                        {t('common.cancel')}
                                    </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setGalleryViewMode('grid')}
                                        className={`p-1.5 rounded ${galleryViewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setGalleryViewMode('list')}
                                        className={`p-1.5 rounded ${galleryViewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedPhotos(galleryPhotos.map(p => p.id));
                                    }}
                                >
                                    <Edit size={16} className="mr-2" /> {t('ui.selectAll')}
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={() => setIsPhotoUploadOpen(true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus size={16} className="mr-2" /> {t('profile.addPhoto')}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                
                {galleryPhotos.length > 0 ? (
                    <div className={galleryViewMode === 'grid' 
                        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                        : "space-y-3"
                    }>
                        {galleryPhotos.map((photo, index) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`relative group cursor-pointer ${
                                    galleryViewMode === 'list' ? 'flex items-center gap-4 p-3 border border-gray-200 rounded-xl hover:bg-gray-50' : ''
                                }`}
                                onClick={() => {
                                    if (selectedPhotos.length > 0) {
                                        // Toggle selection
                                        if (selectedPhotos.includes(photo.id)) {
                                            setSelectedPhotos(selectedPhotos.filter(id => id !== photo.id));
                                        } else {
                                            setSelectedPhotos([...selectedPhotos, photo.id]);
                                        }
                                    } else {
                                        setSelectedPhoto(photo.id);
                                        setIsGalleryModalOpen(true);
                                    }
                                }}
                            >
                                {galleryViewMode === 'grid' ? (
                                    <>
                                        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
                                            {selectedPhotos.includes(photo.id) && (
                                                <div className="absolute inset-0 bg-blue-500/30 z-10 flex items-center justify-center">
                                                    <CheckCircle className="text-white" size={32} />
                                                </div>
                                            )}
                                            {photo.isProfilePicture && (
                                                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 flex items-center gap-1">
                                                    <User size={12} /> Profile
                                                </div>
                                            )}
                                            <img 
                                                src={photo.thumbnail} 
                                                alt={photo.caption || t('ui.galleryPhoto')} 
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
                                            </div>
                                            {photo.caption && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                    <p className="text-white text-xs font-bold truncate">{photo.caption}</p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedPhotos.length === 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(t('ui.areYouSureDelete'))) {
                                                        setGalleryPhotos(galleryPhotos.filter(p => p.id !== photo.id));
                                                    }
                                                }}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                                            >
                                                <X size={12} />
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                                            {selectedPhotos.includes(photo.id) && (
                                                <div className="absolute inset-0 bg-blue-500/30 z-10 flex items-center justify-center">
                                                    <CheckCircle className="text-white" size={24} />
                                                </div>
                                            )}
                                            {photo.isProfilePicture && (
                                                <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
                                                    Profile
                                                </div>
                                            )}
                                            <img 
                                                src={photo.thumbnail} 
                                                alt={photo.caption || t('ui.galleryPhoto')} 
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-gray-900 truncate">{photo.caption || t('ui.untitledPhoto')}</p>
                                            <p className="text-xs text-gray-500 mt-1">{t('ui.uploadedOn')} {photo.uploadedAt}</p>
                                        </div>
                                        {selectedPhotos.length === 0 && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm(t('ui.areYouSureDelete'))) {
                                                        setGalleryPhotos(galleryPhotos.filter(p => p.id !== photo.id));
                                                    }
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <Image className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-bold">{t('profile.noPhotos')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('profile.addFirstPhoto')}</p>
                        <Button className="mt-4" onClick={() => setIsPhotoUploadOpen(true)}>
                            <Plus size={18} className="mr-2" /> {t('profile.addPhoto')}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    )
}
                    </React.Fragment>
                </main>
            </div>

    {/* MOBILE SIDEBAR OVERLAY */}
    <AnimatePresence>
        {isMobileMenuOpen && (
            <>
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                />

                {/* Sidebar */}
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 flex flex-col shadow-2xl lg:hidden overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                        <div className="flex items-center gap-2.5">
                            <IventiaLogo className="w-10 h-10 flex-shrink-0" size="md" />
                            <IventiaText size="sm" />
                        </div>
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                            aria-label="Close menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="p-3 sm:p-4 space-y-1.5 flex-1 overflow-y-auto">
                        {[
                            { id: 'dashboard', icon: Grid, label: t('nav.dashboard') },
                            { id: 'shifts', icon: Calendar, label: t('nav.shifts') },
                            { id: 'assignments', icon: Briefcase, label: t('ui.eventAssignments') },
                            { id: 'earnings', icon: DollarSign, label: t('ui.earnings') },
                            { id: 'jobs', icon: Briefcase, label: t('nav.jobs') },
                            { id: 'application', icon: FileText, label: t('nav.application'), badge: myApplication?.status === 'Interview' ? 'Interview' : myApplication?.status === 'Pending' ? 'Pending' : null },
                            { id: 'documents', icon: FileText, label: t('nav.documents') },
                            { id: 'profile', icon: User, label: t('nav.profile') },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all font-medium touch-manipulation active:scale-95 ${
                                    activeTab === item.id ? 'bg-qatar text-white shadow-lg shadow-qatar/30' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} /> 
                                    <span className="text-sm">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                        item.badge === 'Interview' ? 'bg-blue-500 text-white' :
                                        item.badge === 'Pending' ? 'bg-amber-500 text-white' :
                                        'bg-gray-200 text-gray-700'
                                    }`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div className="p-3 sm:p-4 border-t border-gray-100 space-y-2">
                        <div className="px-3 sm:px-4">
                            <LanguageSwitcher />
                        </div>
                        <button 
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                onLogout();
                            }} 
                            className="flex items-center gap-2.5 text-red-600 px-3 sm:px-4 py-2 hover:bg-red-50 rounded-lg w-full transition-colors text-sm touch-manipulation active:scale-95"
                        >
                            <LogOut size={16} /> {t('nav.logout')}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
    </AnimatePresence>

    {/* CHAT SLIDE OVER */ }
    <AnimatePresence>
{
    isChatOpen && (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-qatar text-white flex justify-between items-center">
                <h3 className="font-bold">{t('contact.teamChat')}</h3>
                <button onClick={() => setIsChatOpen(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length > 0 ? (
                    messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex flex-col ${msg.senderId === user.id ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`max-w-[80%] p-3 rounded-xl text-sm shadow-sm ${
                                msg.senderId === user.id 
                                    ? 'bg-qatar text-white rounded-br-none' 
                                    : 'bg-white border border-gray-200 rounded-bl-none'
                            }`}>
                            {msg.content}
                        </div>
                            <span className="text-[10px] text-gray-400 mt-1 px-2">
                                {msg.senderName} • {msg.timestamp}
                            </span>
                        </motion.div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 font-bold">{t('contact.noMessagesYet')}</p>
                        <p className="text-sm text-gray-400 mt-2">{t('contact.startConversation')}</p>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
                <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder={t('contact.typeMessage')}
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/20"
                />
                <button 
                    onClick={sendMessage} 
                    disabled={!newMessage.trim()}
                    className="p-2 bg-qatar text-white rounded-full hover:bg-qatar-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send size={18} />
                </button>
            </div>
        </motion.div>
    )
}
            </AnimatePresence >

    {/* INCIDENT REPORT MODAL */}
    <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title={t('incident.reportIncident')}>
        <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-xl text-red-800 text-sm flex gap-3 border border-red-100">
                <AlertTriangle className="flex-shrink-0 mt-0.5" size={20} />
                <p>{t('incident.urgentOnly')}</p>
            </div>
            <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t('incident.incidentType')}</label>
                <select className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/20 mb-4">
                    <option>{t('incident.safetyIssue')}</option>
                    <option>{t('incident.securityThreat')}</option>
                    <option>{t('incident.logisticsProblem')}</option>
                    <option>{t('incident.equipmentFailure')}</option>
                    <option>{t('common.other')}</option>
                </select>
            </div>
            <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t('incident.description')}</label>
            <textarea
                className="w-full h-32 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/20"
                    placeholder={t('incident.describePlaceholder')}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
            ></textarea>
        </div>
            <div className="flex gap-3 pt-2">
                <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setIsReportOpen(false)}
                >
                    {t('common.cancel')}
                </Button>
                <Button 
                    onClick={sendIncidentReport} 
                    className="flex-1 bg-red-600 hover:bg-red-700 border-none text-white"
                    disabled={!reportText.trim()}
                >
                    <AlertTriangle size={16} className="mr-2" /> {t('incident.submitReport')}
                </Button>
            </div>
        </div>
    </Modal>

    {/* QR CODE MODAL */ }
    <Modal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} title={t('qr.digitalAccessPass')}>
        <div className="flex flex-col items-center space-y-6 py-6">
            <div className="text-center">
                <h3 className="font-bold text-lg text-gray-900">{t('home.dohaExhibition')}</h3>
                <p className="text-gray-500 text-sm">{t('qr.validFor')}</p>
            </div>
            <div className="p-6 bg-white border-4 border-gray-900 rounded-3xl shadow-xl relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-qatar to-qatar-light"></div>
                <QrCode size={200} className="text-gray-900" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-400">ID: 882192-SHIFT-1</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl text-center w-full">
                <p className="text-sm text-blue-800 font-bold">{t('qr.dynamicQRCode')}</p>
                <p className="text-xs text-blue-600 mt-1">{t('qr.refreshesEvery')}</p>
            </div>
            <div className="flex gap-3 w-full">
                <Button variant="outline" className="flex-1" onClick={() => {
                    // Copy QR code data
                    navigator.clipboard.writeText('882192-SHIFT-1');
                    alert(t('qr.qrCodeIdCopied'));
                }}>
                    <Copy size={16} className="mr-2" /> {t('qr.copyID')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => {
                    // Share functionality
                    if (navigator.share) {
                        navigator.share({
                            title: t('qr.myAccessPass'),
                            text: t('qr.staffAccessPass')
                        });
                    }
                }}>
                    <Share2 size={16} className="mr-2" /> {t('qr.share')}
                </Button>
        </div>
        </div>
    </Modal>

    {/* INTERVIEW DETAILS MODAL */}
    {myApplication && (
        <Modal 
            isOpen={isInterviewModalOpen} 
            onClose={() => setIsInterviewModalOpen(false)} 
            title={t('interview.interviewDetails')}
        >
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{t('interview.scheduled')}</h3>
                            <p className="text-sm text-gray-500">Role: {myApplication.roleApplied}</p>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                            myApplication.interviewType === 'online' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-purple-100 text-purple-700'
                        }`}>
                            {myApplication.interviewType === 'online' ? (
                                <>
                                    <Phone size={14} /> {t('interview.online')}
                                </>
                            ) : (
                                <>
                                    <MapPin size={14} /> {t('interview.local')}
                                </>
                            )}
                        </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('interview.date')}</p>
                            <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Calendar size={18} /> {myApplication.interviewDate}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('interview.time')}</p>
                            <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock size={18} /> {myApplication.interviewTime}
                            </p>
                        </div>
                    </div>
                    
                    {myApplication.interviewType === 'local' && myApplication.interviewLocation && (
                        <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('interview.location')}</p>
                            <p className="text-sm text-gray-900 flex items-center gap-2">
                                <MapPin size={16} /> {myApplication.interviewLocation}
                            </p>
                            <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(myApplication.interviewLocation)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-2 inline-block flex items-center gap-1"
                            >
                                <Navigation size={12} /> {t('interview.getDirections')}
                            </a>
                        </div>
                    )}
                    
                    {myApplication.interviewType === 'online' && myApplication.meetingLink && (
                        <div className="mt-4">
                            <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('interview.meetingLink')}</p>
                                <p className="text-sm text-gray-600 break-all">{myApplication.meetingLink}</p>
                            </div>
                            <a 
                                href={myApplication.meetingLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <Phone size={18} /> {t('interview.joinMeeting')}
                            </a>
                        </div>
                    )}
                </div>
                
                {myApplication.interviewNotes && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-3">
                            <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-bold text-amber-800 mb-2">{t('interview.importantNotes')}</p>
                                <p className="text-sm text-amber-700">{myApplication.interviewNotes}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs font-bold text-blue-800 mb-2">{t('interview.whatToBring')}:</p>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li>{t('interview.validQID')}</li>
                        <li>{t('interview.updatedCV')}</li>
                        <li>{t('interview.certificates')}</li>
                        <li>{t('interview.photoID')}</li>
                    </ul>
                </div>
                
                <div className="flex gap-3 pt-2">
                    <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => setIsInterviewModalOpen(false)}
                    >
                        Close
                    </Button>
                    {myApplication.meetingLink && (
                        <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.open(myApplication.meetingLink, '_blank')}
                        >
                            <Phone size={16} className="mr-2" /> Join Meeting
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    )}

    {/* QUIZ TEST MODAL */}
    <Modal 
        isOpen={isQuizTestOpen} 
        onClose={() => {
            if (!quizTestStarted || quizTestCompleted) {
                setIsQuizTestOpen(false);
                resetQuizTest();
            } else {
                if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                    setIsQuizTestOpen(false);
                    resetQuizTest();
                }
            }
        }} 
        title={quizTestCompleted ? t('quiz.viewResults') : quizTestStarted ? t('quiz.protocolQuiz') : t('quiz.startQuizTest')}
    >
        <div className="space-y-6">
            {!quizTestStarted && !quizTestCompleted && (
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <BookOpen className="text-blue-600" size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('quiz.protocolQuiz')}</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {t('quiz.takeQuiz')}
                        </p>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-left space-y-2">
                            <p className="text-xs font-bold text-blue-800 mb-2">{t('quiz.instructions')}:</p>
                            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                                <li>{t('quiz.answerAll').replace('{count}', PROTOCOL_QUIZ.length.toString())}</li>
                                <li>{t('quiz.readCarefully')}</li>
                                <li>{t('quiz.reviewAnswers')}</li>
                                <li>{t('quiz.minimumPassing')}</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="outline" 
                            className="flex-1" 
                            onClick={() => {
                                setIsQuizTestOpen(false);
                                resetQuizTest();
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            onClick={startQuizTest}
                        >
                            <PlayCircle size={16} className="mr-2" /> {t('quiz.startQuiz')}
                        </Button>
                    </div>
                </div>
            )}

            {quizTestStarted && !quizTestCompleted && (
                <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">{t('quiz.progress')}</p>
                            <p className="text-sm text-gray-700">
                                {quizTestAnswers.filter(a => a !== -1).length} / {PROTOCOL_QUIZ.length} {t('quiz.answered')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">{t('quiz.time')}</p>
                            <p className="text-sm font-mono text-gray-700">
                                {Math.floor(quizTestTime / 60)}:{(quizTestTime % 60).toString().padStart(2, '0')}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto">
                        {PROTOCOL_QUIZ.map((q, qIndex) => (
                            <div key={q.id} className="p-4 border border-gray-200 rounded-xl">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {q.id}
                                    </div>
                                    <p className="font-bold text-gray-900 flex-1">{q.question}</p>
                                </div>
                                <div className="space-y-2">
                                    {q.options.map((opt, oIndex) => (
                                        <div
                                            key={oIndex}
                                            onClick={() => {
                                                const newAns = [...quizTestAnswers];
                                                newAns[qIndex] = oIndex;
                                                setQuizTestAnswers(newAns);
                                            }}
                                            className={`w-full text-left p-3 rounded-lg border-2 transition-all cursor-pointer flex items-center gap-3 ${
                                                quizTestAnswers[qIndex] === oIndex
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                                quizTestAnswers[qIndex] === oIndex ? 'border-blue-500' : 'border-gray-300'
                                            }`}>
                                                {quizTestAnswers[qIndex] === oIndex && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                            </div>
                                            <span className="text-sm">{opt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button 
                            variant="outline" 
                            className="flex-1" 
                            onClick={() => {
                                if (confirm(t('quiz.confirmExit'))) {
                                    setIsQuizTestOpen(false);
                                    resetQuizTest();
                                }
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button 
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={submitQuizTest}
                            disabled={quizTestAnswers.includes(-1)}
                        >
                            <CheckCircle size={16} className="mr-2" /> {t('quiz.submitQuiz')}
                        </Button>
                    </div>
                </div>
            )}

            {quizTestCompleted && quizTestScore !== null && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl border border-blue-200 text-center">
                        <p className="text-xs font-bold text-blue-600 uppercase mb-2">{t('quiz.yourScore')}</p>
                        <p className={`text-6xl font-extrabold mb-4 ${
                            quizTestScore >= 70 ? 'text-emerald-600' :
                            quizTestScore >= 50 ? 'text-amber-600' :
                            'text-red-600'
                        }`}>
                            {quizTestScore}%
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                            {quizTestAnswers.filter((ans, idx) => ans === PROTOCOL_QUIZ[idx].correctAnswer).length} {t('application.correct')} {PROTOCOL_QUIZ.length} {t('quiz.questions')}
                        </p>
                        {quizTestScore >= 70 ? (
                            <p className="text-lg font-bold text-emerald-600 mt-4">{t('quiz.passingScore')}</p>
                        ) : (
                            <p className="text-lg font-bold text-amber-600 mt-4">{t('quiz.minimumScore')}</p>
                        )}
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {PROTOCOL_QUIZ.map((q, qIndex) => {
                            const isCorrect = quizTestAnswers[qIndex] === q.correctAnswer;
                            return (
                                <div 
                                    key={q.id}
                                    className={`p-4 rounded-xl border-2 ${
                                        isCorrect 
                                            ? 'bg-emerald-50 border-emerald-200' 
                                            : 'bg-red-50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                            isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                            {q.id}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 mb-2">{q.question}</p>
                                            <div className="space-y-2">
                                                <div className={`p-2 rounded-lg ${
                                                    quizTestAnswers[qIndex] === q.correctAnswer
                                                        ? 'bg-emerald-100 border border-emerald-300'
                                                        : 'bg-red-100 border border-red-300'
                                                }`}>
                                                    <p className="text-xs font-bold text-gray-500 mb-1">{t('admin.selected')}</p>
                                                    <p className={`text-sm font-medium ${
                                                        isCorrect ? 'text-emerald-700' : 'text-red-700'
                                                    }`}>
                                                        {q.options[quizTestAnswers[qIndex]]} {isCorrect ? t('admin.correctAnswer') : t('admin.incorrectAnswer')}
                                                    </p>
                                                </div>
                                                {!isCorrect && (
                                                    <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300">
                                                        <p className="text-xs font-bold text-gray-500 mb-1">{t('admin.correctColon')}</p>
                                                        <p className="text-sm font-medium text-emerald-700">
                                                            {q.options[q.correctAnswer]} ✓
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button 
                            variant="outline" 
                            className="flex-1" 
                            onClick={() => {
                                setIsQuizTestOpen(false);
                                resetQuizTest();
                            }}
                        >
                            {t('common.close')}
                        </Button>
                        {quizTestScore < 70 && (
                            <Button 
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => {
                                    resetQuizTest();
                                    startQuizTest();
                                }}
                            >
                                <PlayCircle size={16} className="mr-2" /> {t('quiz.retake')}
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    </Modal>

    {/* QUIZ RESULTS MODAL */}
    {myApplication && myApplication.quizDetails && (
        <Modal 
            isOpen={isQuizModalOpen} 
            onClose={() => setIsQuizModalOpen(false)} 
            title={t('quiz.viewFullResults')}
        >
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200 text-center">
                    <p className="text-xs font-bold text-blue-600 uppercase mb-2">{t('application.overallScore')}</p>
                    <p className={`text-5xl font-extrabold mb-2 ${
                        (myApplication.quizScore || 0) >= 70 ? 'text-emerald-600' :
                        (myApplication.quizScore || 0) >= 50 ? 'text-amber-600' :
                        'text-red-600'
                    }`}>
                        {myApplication.quizScore || 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                        {myApplication.quizDetails.filter(q => q.isCorrect).length} {t('application.correct')} {myApplication.quizDetails.length} {t('quiz.questions')}
                    </p>
                    {(myApplication.quizScore || 0) >= 70 ? (
                        <p className="text-sm font-bold text-emerald-600 mt-2">{t('quiz.passingScore')}</p>
                    ) : (
                        <p className="text-sm font-bold text-amber-600 mt-2">{t('quiz.reviewIncorrect')}</p>
                    )}
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {myApplication.quizDetails.map((q, i) => (
                        <div 
                            key={i}
                            className={`p-4 rounded-xl border-2 ${
                                q.isCorrect 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-red-50 border-red-200'
                            }`}
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                                    q.isCorrect 
                                        ? 'bg-emerald-500 text-white' 
                                        : 'bg-red-500 text-white'
                                }`}>
                                    {i + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 mb-2">{q.question}</p>
                                    <div className="space-y-2">
                                        <div className={`p-2 rounded-lg ${
                                            q.selectedOption === q.correctOption
                                                ? 'bg-emerald-100 border border-emerald-300'
                                                : 'bg-red-100 border border-red-300'
                                        }`}>
                                            <p className="text-xs font-bold text-gray-500 mb-1">{t('admin.selected')}</p>
                                            <p className={`text-sm font-medium ${
                                                q.isCorrect ? 'text-emerald-700' : 'text-red-700'
                                            }`}>
                                                {t('admin.option')} {q.selectedOption + 1} {q.isCorrect ? t('admin.correctAnswer') : t('admin.incorrectAnswer')}
                                            </p>
                                        </div>
                                        {!q.isCorrect && (
                                            <div className="p-2 rounded-lg bg-emerald-100 border border-emerald-300">
                                                <p className="text-xs font-bold text-gray-500 mb-1">{t('admin.correctColon')}</p>
                                                <p className="text-sm font-medium text-emerald-700">
                                                    {t('admin.option')} {q.correctOption + 1} ✓
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-3 pt-2">
                    <Button 
                        variant="outline" 
                        className="flex-1" 
                        onClick={() => setIsQuizModalOpen(false)}
                    >
                        {t('common.close')}
                    </Button>
                </div>
            </div>
        </Modal>
    )}

    {/* PHOTO GALLERY VIEWER MODAL */}
    <Modal 
        isOpen={isGalleryModalOpen} 
        onClose={() => {
            setIsGalleryModalOpen(false);
            setSelectedPhoto(null);
        }} 
        title={t('profile.photoGallery')}
        className="max-w-4xl"
    >
        {selectedPhoto && (
            <div className="space-y-4">
                {(() => {
                    const photo = galleryPhotos.find(p => p.id === selectedPhoto);
                    if (!photo) return null;
                    return (
                        <>
                            <div className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden">
                                <img 
                                    src={photo.url} 
                                    alt={photo.caption || 'Gallery photo'} 
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    {photo.caption && (
                                        <p className="font-bold text-gray-900">{photo.caption}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">{t('ui.uploadedOn')} {photo.uploadedAt}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = photo.url;
                                            link.download = photo.caption || 'photo';
                                            link.click();
                                        }}
                                    >
                                        <Download size={16} className="mr-2" /> Download
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                // Set as profile picture
                                                setGalleryPhotos(galleryPhotos.map(p => ({
                                                    ...p,
                                                    isProfilePicture: p.id === photo.id
                                                })));
                                                setProfile({
                                                    ...profile,
                                                    avatar: photo.url
                                                });
                                                alert(t('profile.pictureUpdated'));
                                            }}
                                        >
                                            <User size={16} className="mr-2" /> {t('ui.setAsProfilePicture')}
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = photo.url;
                                                link.download = photo.caption || 'photo';
                                                link.click();
                                            }}
                                        >
                                            <Download size={16} className="mr-2" /> Download
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                if (confirm(t('ui.areYouSureDelete'))) {
                                                    setGalleryPhotos(galleryPhotos.filter(p => p.id !== photo.id));
                                                    setIsGalleryModalOpen(true);
                                                    setSelectedPhoto(null);
                                                }
                                            }}
                                        >
                                            <Trash2 size={16} className="mr-2" /> {t('ui.delete')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            {galleryPhotos.length > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            const currentIndex = galleryPhotos.findIndex(p => p.id === selectedPhoto);
                                            const prevIndex = currentIndex > 0 ? currentIndex - 1 : galleryPhotos.length - 1;
                                            setSelectedPhoto(galleryPhotos[prevIndex].id);
                                        }}
                                    >
                                        ← {t('common.previous')}
                                    </Button>
                                    <p className="text-sm text-gray-500">
                                        {galleryPhotos.findIndex(p => p.id === selectedPhoto) + 1} {t('common.of')} {galleryPhotos.length}
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                            const currentIndex = galleryPhotos.findIndex(p => p.id === selectedPhoto);
                                            const nextIndex = currentIndex < galleryPhotos.length - 1 ? currentIndex + 1 : 0;
                                            setSelectedPhoto(galleryPhotos[nextIndex].id);
                                        }}
                                    >
                                        {t('common.next')} →
                                    </Button>
                                </div>
                            )}
                        </>
                    );
                })()}
            </div>
        )}
    </Modal>

    {/* UPLOAD PHOTO MODAL */}
    <Modal 
        isOpen={isPhotoUploadOpen} 
        onClose={() => {
            setIsPhotoUploadOpen(false);
            setPhotoUploadFile(null);
            setPhotoUploadProgress(0);
            setPhotoCaption('');
        }} 
        title={t('profile.addPhoto')}
    >
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                <Camera className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-sm font-bold text-gray-700 mb-2">{t('ui.dropPhotoHere')}</p>
                <p className="text-xs text-gray-500 mb-4">{t('ui.supportedFormats')}</p>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                                toast.error('File size must be less than 10MB');
                                return;
                            }
                            if (!file.type.startsWith('image/')) {
                                toast.error('Please select an image file');
                                return;
                            }
                            setPhotoUploadFile(file);
                        }
                    }}
                    className="hidden"
                    id="photo-upload"
                />
                <button
                    type="button"
                    onClick={() => {
                        const input = document.getElementById('photo-upload') as HTMLInputElement;
                        if (input) {
                            input.click();
                        }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-medium text-gray-700 hover:text-blue-700 cursor-pointer"
                >
                    <Camera size={16} /> {t('ui.choosePhoto')}
                </button>
            </div>
            
            {photoUploadFile && (
                <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                                <img 
                                    src={URL.createObjectURL(photoUploadFile)} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{photoUploadFile.name}</p>
                                <p className="text-xs text-gray-500">{(photoUploadFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button onClick={() => setPhotoUploadFile(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>
                    
                    <div className="mb-4">
                        <label className="text-sm font-bold text-gray-700 mb-2 block">{t('ui.caption')} ({t('common.optional')})</label>
                        <Input
                            type="text"
                            placeholder={t('ui.addCaption')}
                            value={photoCaption}
                            onChange={(e) => setPhotoCaption(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    
                    {isPhotoUploading && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Uploading...</span>
                                <span className="font-bold text-gray-900">{photoUploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${photoUploadProgress}%` }}
                                    className="h-full bg-blue-600"
                                ></motion.div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex gap-3 pt-4">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                        setIsPhotoUploadOpen(false);
                        setPhotoUploadFile(null);
                        setPhotoCaption('');
                    }}
                >
                    Cancel
                </Button>
                <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                        if (!photoUploadFile) {
                            toast.error('Please select a photo');
                            return;
                        }
                        
                        const staffId = staffProfile?.id || staffProfile?._id;
                        if (!staffId) {
                            toast.error('Staff ID not found');
                            return;
                        }
                        
                        setIsPhotoUploading(true);
                        setPhotoUploadProgress(0);
                        
                        try {
                            // Convert file to base64 or upload to cloud storage
                            // For now, we'll use a data URL (in production, upload to cloud storage first)
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                                try {
                                    const base64String = reader.result as string;
                                    
                                    // Upload to backend
                                    const response = await apiStaff.addGalleryPhoto(staffId, {
                                        url: base64String,
                                        thumbnail: base64String, // In production, generate thumbnail
                                        caption: photoCaption.trim() || '',
                                        isProfilePicture: false,
                                    });
                                    
                                    // Refresh gallery photos
                                    if (response.data?.galleryPhotos) {
                                        const transformedPhotos = response.data.galleryPhotos.map((photo: any) => ({
                                            id: photo._id?.toString() || photo.id || '',
                                            url: photo.url || '',
                                            thumbnail: photo.thumbnail || photo.url || '',
                                            uploadedAt: photo.uploadedAt || new Date().toISOString().split('T')[0],
                                            caption: photo.caption || '',
                                            isProfilePicture: photo.isProfilePicture || false,
                                        }));
                                        setGalleryPhotos(transformedPhotos);
                                    }
                                    
                                    setIsPhotoUploading(false);
                                    setIsPhotoUploadOpen(false);
                                    setPhotoUploadFile(null);
                                    setPhotoUploadProgress(0);
                                    setPhotoCaption('');
                                    toast.success(t('ui.uploadComplete'));
                                } catch (error: any) {
                                    console.error('Failed to upload photo:', error);
                                    toast.error(error?.response?.data?.error || 'Failed to upload photo');
                                    setIsPhotoUploading(false);
                                    setPhotoUploadProgress(0);
                                }
                            };
                            reader.onprogress = (e) => {
                                if (e.lengthComputable) {
                                    const progress = Math.round((e.loaded / e.total) * 100);
                                    setPhotoUploadProgress(progress);
                            }
                            };
                            reader.readAsDataURL(photoUploadFile);
                        } catch (error: any) {
                            console.error('Failed to upload photo:', error);
                            toast.error(error?.response?.data?.error || 'Failed to upload photo');
                            setIsPhotoUploading(false);
                            setPhotoUploadProgress(0);
                        }
                    }}
                    disabled={!photoUploadFile || isPhotoUploading}
                >
                    {isPhotoUploading ? t('ui.uploading') : t('profile.addPhoto')}
                </Button>
            </div>
        </div>
    </Modal>

    {/* PROFILE EDIT MODAL */}
    <Modal 
        isOpen={isProfileEditOpen} 
        onClose={() => {
            setIsProfileEditOpen(false);
            setProfileEditData({
                name: profile.name,
                role: profile.role,
                location: profile.location,
                bio: '',
                phone: '+974 5500 1234',
                email: user.email || 'staff@liywan.qa',
                languages: profile.skills.map(s => s.name),
            });
        }} 
        title={t('profile.editProfile')}
    >
        <div className="space-y-6">
            {/* Avatar Section */}
            <div className="text-center">
                <div className="relative inline-block mb-4">
                    <img 
                        src={profile.avatar} 
                        className="w-24 h-24 rounded-full border-4 border-gray-200 mx-auto" 
                        alt="Profile" 
                    />
                    <button
                        onClick={() => {
                            setIsProfileEditOpen(false);
                            setIsGalleryModalOpen(true);
                            setSelectedPhoto(galleryPhotos.find(p => p.isProfilePicture)?.id || galleryPhotos[0]?.id || null);
                        }}
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg"
                    >
                        <Camera size={16} />
                    </button>
                </div>
                <p className="text-sm text-gray-500">{t('profile.changeAvatar')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.fullName')}</label>
                    <Input
                        value={profileEditData.name}
                        onChange={(e) => setProfileEditData({ ...profileEditData, name: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.role')}</label>
                    <Input
                        value={profileEditData.role}
                        onChange={(e) => setProfileEditData({ ...profileEditData, role: e.target.value })}
                        className="w-full"
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.location')}</label>
                    <Input
                        value={profileEditData.location}
                        onChange={(e) => setProfileEditData({ ...profileEditData, location: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.phone')}</label>
                    <Input
                        value={profileEditData.phone}
                        onChange={(e) => setProfileEditData({ ...profileEditData, phone: e.target.value })}
                        className="w-full"
                    />
                </div>
            </div>

            <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.email')}</label>
                <Input
                    type="email"
                    value={profileEditData.email}
                    onChange={(e) => setProfileEditData({ ...profileEditData, email: e.target.value })}
                    className="w-full"
                />
            </div>

            <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.bio')}</label>
                <textarea
                    value={profileEditData.bio}
                    onChange={(e) => setProfileEditData({ ...profileEditData, bio: e.target.value })}
                    className="w-full h-24 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder={t('profile.tellAboutYourself')}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setIsProfileEditOpen(false)}
                >
                    {t('common.cancel')}
                </Button>
                <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                        try {
                            // Get current staff profile first
                            const staffProfileResponse = await apiStaff.getProfile();
                            const staffProfile = staffProfileResponse.data || staffProfileResponse;

                            // Update staff profile
                            if (staffProfile.id) {
                                await apiStaff.update(staffProfile.id, {
                                    name: profileEditData.name,
                                    phone: profileEditData.phone,
                                skills: profileEditData.languages,
                            });
                            }

                            // Refresh profile
                            const updatedProfileResponse = await apiStaff.getProfile();
                            const updatedProfile = updatedProfileResponse.data || updatedProfileResponse;
                            
                            // Get user info from auth
                            const userProfileResponse = await apiAuth.getMe();
                            const userProfile = userProfileResponse.data || userProfileResponse;
                            
                            setProfile(prev => ({
                                ...prev,
                                name: userProfile.name || userProfile.displayName || prev.name,
                                email: userProfile.email || prev.email,
                                role: updatedProfile.role || prev.role,
                                location: updatedProfile.location || profileEditData.location,
                                skills: (updatedProfile.skills || []).map((skill: string) => ({ name: skill, status: 'Verified' })),
                            }));

                            setIsProfileEditOpen(false);
                            alert(t('profile.profileUpdated'));
                        } catch (error) {
                            console.error('Failed to update profile:', error);
                            alert(error instanceof Error ? error.message : 'Failed to update profile');
                        }
                    }}
                >
                    <CheckCircle size={16} className="mr-2" /> {t('profile.saveChanges')}
                </Button>
            </div>
        </div>
    </Modal>

    {/* SKILLS MANAGEMENT MODAL */}
    <Modal 
        isOpen={isSkillsEditOpen} 
        onClose={() => setIsSkillsEditOpen(false)} 
        title={t('profile.manageSkillsLanguages')}
    >
        <div className="space-y-6">
            <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.addNewSkill')}</label>
                <div className="flex gap-2">
                    <Input
                        placeholder={t('profile.enterSkillName')}
                        className="flex-1"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                const newSkill = (e.target as HTMLInputElement).value.trim();
                                if (!profile.skills.some(s => s.name.toLowerCase() === newSkill.toLowerCase())) {
                                    setProfile({
                                        ...profile,
                                        skills: [...profile.skills, { name: newSkill, status: 'Pending' }]
                                    });
                                    (e.target as HTMLInputElement).value = '';
                                } else {
                                    alert('This skill already exists');
                                }
                            }
                        }}
                    />
                    <Button
                        onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            if (input && input.value.trim()) {
                                const newSkill = input.value.trim();
                                if (!profile.skills.some(s => s.name.toLowerCase() === newSkill.toLowerCase())) {
                                    setProfile({
                                        ...profile,
                                        skills: [...profile.skills, { name: newSkill, status: 'Pending' }]
                                    });
                                    input.value = '';
                                } else {
                                    alert('This skill already exists');
                                }
                            }
                        }}
                    >
                        <Plus size={16} className="mr-2" /> {t('common.add')}
                    </Button>
                </div>
            </div>

            <div>
                <p className="text-sm font-bold text-gray-700 mb-3">{t('profile.skillsLanguages')}</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {profile.skills.map((skill, i) => (
                        <div 
                            key={i}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900">{skill.name}</span>
                                {skill.status === 'Verified' ? (
                                    <Badge status="Verified" />
                                ) : (
                                    <Badge status="Pending" />
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setProfile({
                                        ...profile,
                                        skills: profile.skills.filter((_, idx) => idx !== i)
                                    });
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">{t('profile.addCertification')}</label>
                <div className="flex gap-2">
                    <Input
                        placeholder={t('profile.enterCertificationName')}
                        className="flex-1"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                                const newCert = (e.target as HTMLInputElement).value.trim();
                                if (!profile.certifications.includes(newCert)) {
                                    setProfile({
                                        ...profile,
                                        certifications: [...profile.certifications, newCert]
                                    });
                                    (e.target as HTMLInputElement).value = '';
                                } else {
                                    alert('This certification already exists');
                                }
                            }
                        }}
                    />
                    <Button
                        onClick={(e) => {
                            const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                            if (input && input.value.trim()) {
                                const newCert = input.value.trim();
                                if (!profile.certifications.includes(newCert)) {
                                    setProfile({
                                        ...profile,
                                        certifications: [...profile.certifications, newCert]
                                    });
                                    input.value = '';
                                } else {
                                    alert('This certification already exists');
                                }
                            }
                        }}
                    >
                        <Plus size={16} className="mr-2" /> {t('common.add')}
                    </Button>
                </div>
            </div>

            <div>
                <p className="text-sm font-bold text-gray-700 mb-3">{t('profile.certifications')}</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {profile.certifications.map((cert, i) => (
                        <div 
                            key={i}
                            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                            <div className="flex items-center gap-2">
                                <Award size={16} className="text-blue-600" />
                                <span className="text-sm font-bold text-blue-700">{cert}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setProfile({
                                        ...profile,
                                        certifications: profile.certifications.filter((_, idx) => idx !== i)
                                    });
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-4">
                <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setIsSkillsEditOpen(false)}
                >
                    {t('common.close')}
                </Button>
            </div>
        </div>
    </Modal>

    {/* UPLOAD DOCUMENT MODAL */}
    <Modal isOpen={isUploadOpen} onClose={() => {
        setIsUploadOpen(false);
        setUploadFile(null);
        setUploadProgress(0);
    }} title={t('ui.uploadDocument')}>
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-qatar transition-colors">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-sm font-bold text-gray-700 mb-2">{t('documents.dropFileHere')}</p>
                <p className="text-xs text-gray-500 mb-4">{t('documents.supportedFormats')}</p>
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                                alert('File size must be less than 10MB');
                                return;
                            }
                            setUploadFile(file);
                        }
                    }}
                    className="hidden"
                    id="file-upload"
                />
                <label htmlFor="file-upload">
                    <Button variant="outline" as="span">
                        <Upload size={16} className="mr-2" /> Choose File
                    </Button>
                </label>
            </div>
            
            {uploadFile && (
                <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <FileText className="text-gray-600" size={20} />
                            <div>
                                <p className="text-sm font-bold text-gray-900">{uploadFile.name}</p>
                                <p className="text-xs text-gray-500">{(uploadFile.size / 1024).toFixed(2)} KB</p>
                            </div>
                        </div>
                        <button onClick={() => setUploadFile(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={18} />
                        </button>
                    </div>
                    {isUploading && (
                        <div className="mt-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600">Uploading...</span>
                                <span className="font-bold text-gray-900">{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                    className="h-full bg-qatar"
                                ></motion.div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">{t('documents.documentType')}</label>
                    <select className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-qatar/20">
                        <option>{t('documents.idDocument')}</option>
                        <option>{t('documents.certificate')}</option>
                        <option>{t('documents.license')}</option>
                        <option>{t('common.other')}</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">{t('documents.expiryDate')} ({t('common.optional')})</label>
                    <Input
                        type="date"
                        className="w-full"
                    />
                </div>
            </div>
            
            <div className="flex gap-3 pt-4">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                        setIsUploadOpen(false);
                        setUploadFile(null);
                    }}
                >
                    {t('common.cancel')}
                </Button>
                <Button
                    className="flex-1"
                    onClick={async () => {
                        if (!uploadFile) {
                            alert(t('documents.selectFile'));
                            return;
                        }
                        setIsUploading(true);
                        try {
                            // Get staff profile ID
                            const { auth } = await import('../services/api');
                            const userData = await auth.getMe();
                            
                            if (!userData.success || !userData.data.profile?._id) {
                                throw new Error('Staff profile not found');
                            }

                            const staffId = userData.data.profile._id;
                            const documentType = (document.querySelector('select') as HTMLSelectElement)?.value || 'ID';
                            const expiryDate = (document.querySelector('input[type="date"]') as HTMLInputElement)?.value || null;

                            // Upload document using API
                            const formData = new FormData();
                            formData.append('file', uploadFile);
                            formData.append('title', uploadFile.name);
                            formData.append('type', documentType);
                            if (expiryDate) {
                                formData.append('expiryDate', expiryDate);
                            }

                            const { staff } = await import('../services/api');
                            const uploadResponse = await staff.uploadDocument(staffId, uploadFile, {
                                title: uploadFile.name,
                                type: (document.querySelector('select') as HTMLSelectElement)?.value || 'ID',
                                expiryDate: (document.querySelector('input[type="date"]') as HTMLInputElement)?.value || null,
                            });

                            setIsUploading(false);
                            setIsUploadOpen(false);
                            setUploadFile(null);
                            setUploadProgress(0);
                            
                            // Refresh documents - transform backend structure
                            if (uploadResponse.success && uploadResponse.data?.documents) {
                                const transformedDocs = uploadResponse.data.documents.map((doc: any) => ({
                                    id: doc._id || doc.id || `doc-${Date.now()}-${Math.random()}`,
                                    title: doc.title || 'Document',
                                    type: doc.type || 'Certificate',
                                    uploadDate: doc.uploadDate ? (typeof doc.uploadDate === 'string' ? doc.uploadDate : new Date(doc.uploadDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                                    expiryDate: doc.expiryDate ? (typeof doc.expiryDate === 'string' ? doc.expiryDate : new Date(doc.expiryDate).toISOString().split('T')[0]) : undefined,
                                    status: doc.status || 'Pending',
                                    url: doc.url || '',
                                }));
                                setDocuments(transformedDocs);
                            } else {
                                // Refresh profile to get updated documents
                                try {
                                    const staffResponse = await apiStaff.getProfile();
                                    if (staffResponse.data?.documents) {
                                        const transformedDocs = staffResponse.data.documents.map((doc: any) => ({
                                            id: doc._id || doc.id || `doc-${Date.now()}-${Math.random()}`,
                                            title: doc.title || 'Document',
                                            type: doc.type || 'Certificate',
                                            uploadDate: doc.uploadDate ? (typeof doc.uploadDate === 'string' ? doc.uploadDate : new Date(doc.uploadDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
                                            expiryDate: doc.expiryDate ? (typeof doc.expiryDate === 'string' ? doc.expiryDate : new Date(doc.expiryDate).toISOString().split('T')[0]) : undefined,
                                            status: doc.status || 'Pending',
                                            url: doc.url || '',
                                        }));
                                        setDocuments(transformedDocs);
                                    }
                                } catch (refreshError) {
                                    console.error('Failed to refresh documents:', refreshError);
                                }
                            }
                            
                            alert(t('documents.uploadSuccess'));
                        } catch (error) {
                            console.error('Failed to upload document:', error);
                            setIsUploading(false);
                            toast.error(error instanceof Error ? error.message : t('ui.failedToUploadDocument'));
                        }
                    }}
                    disabled={!uploadFile || isUploading}
                >
                    {isUploading ? t('ui.uploading') : t('documents.uploadDocument')}
                </Button>
            </div>
        </div>
    </Modal>

            {/* Mobile Bottom Navigation */}
            <BottomNavigation
                items={[
                    { id: 'dashboard', label: t('nav.dashboard'), icon: Grid, onClick: () => setActiveTab('dashboard') },
                    { id: 'shifts', label: t('nav.shifts'), icon: Calendar, badge: shifts.length > 0 ? shifts.length : undefined, onClick: () => setActiveTab('shifts') },
                    { id: 'jobs', label: t('nav.jobs'), icon: Briefcase, badge: jobs.length > 0 ? jobs.length : undefined, onClick: () => setActiveTab('jobs') },
                    { id: 'profile', label: t('nav.profile'), icon: User, onClick: () => setActiveTab('profile') },
                ]}
                activeId={activeTab}
            />
        </div >
    );
};

export default StaffPortal;