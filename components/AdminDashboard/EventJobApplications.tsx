import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Filter, CheckCircle, XCircle, Clock, Mail, Phone, 
    MapPin, Calendar, Award, FileText, Eye, UserCheck, UserX, 
    TrendingUp, AlertCircle, Star, Briefcase
} from 'lucide-react';
import { Card, Button, Badge, Input, Skeleton } from '../UI';
import { JobApplication, Event } from '../../types';
import { applications as apiApplications, events as apiEvents } from '../../services/api';
import { useToast } from '../ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EventJobApplicationsProps {
    event: Event;
    onClose: () => void;
    onApplicationUpdate?: () => void;
}

export const EventJobApplications: React.FC<EventJobApplicationsProps> = ({
    event,
    onClose,
    onApplicationUpdate
}) => {
    const toast = useToast();
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        fetchApplications();
    }, [event.id]);

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const response = await apiApplications.list({ 
                page: 1, 
                limit: 100,
                eventId: event.id 
            });
            
            const apps = response.data || [];
            // Transform to match JobApplication type
            const transformedApps: JobApplication[] = apps.map((app: any) => ({
                id: app._id || app.id,
                name: app.name || '',
                email: app.email || '',
                phone: app.phone || '',
                roleApplied: app.roleApplied || '',
                experience: app.experience || '',
                location: app.location || '',
                status: app.status || 'Pending',
                appliedDate: app.appliedDate || (app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
                // Use real avatar from API - backend already handles fallback to staff profile imageUrl
                // Only use generated avatar as absolute last resort if backend didn't provide one
                avatar: (app.avatar && app.avatar !== 'null' && app.avatar !== 'undefined' && app.avatar !== '#' && app.avatar !== 'https://i.pravatar.cc/150')
                    ? app.avatar
                    : (app.imageUrl && app.imageUrl !== 'null' && app.imageUrl !== 'undefined' && app.imageUrl !== '#' && app.imageUrl !== 'https://i.pravatar.cc/150')
                        ? app.imageUrl
                        : (app.staffIdObject?.imageUrl && app.staffIdObject.imageUrl !== 'null' && app.staffIdObject.imageUrl !== 'undefined' && app.staffIdObject.imageUrl !== '#' && app.staffIdObject.imageUrl !== 'https://i.pravatar.cc/150')
                            ? app.staffIdObject.imageUrl
                            : undefined, // Let the UI component handle the fallback
                languages: Array.isArray(app.languages) ? app.languages : (typeof app.languages === 'string' ? app.languages.split(',').map(l => l.trim()) : []),
                quizScore: app.quizScore || 0,
                quizDetails: Array.isArray(app.quizDetails) ? app.quizDetails : [],
                interviewDate: app.interviewDate,
                interviewTime: app.interviewTime,
                interviewLocation: app.interviewLocation,
                interviewer: app.interviewer,
                meetingLink: app.meetingLink,
                interviewNotes: app.interviewNotes,
                interviewType: app.interviewType,
            }));
            
            setApplications(transformedApps);
        } catch (error: any) {
            console.error('Failed to fetch applications:', error);
            toast.error(error?.response?.data?.error || 'Failed to load applications');
            setApplications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const updateApplicationStatus = async (applicationId: string, newStatus: 'Pending' | 'Interview' | 'Approved' | 'Rejected', interviewData?: any) => {
        try {
            // Find the application to get staffId and roleApplied
            const application = applications.find(app => app.id === applicationId);
            
            await apiApplications.updateStatus(applicationId, newStatus, interviewData);
            
            // If approved and has eventId, assign staff to event
            if (newStatus === 'Approved' && event.id && application) {
                try {
                    // Get staffId from the application - it should be set by backend when approved
                    // We need to refetch the application to get the updated staffId
                    const updatedAppResponse = await apiApplications.get(applicationId);
                    const updatedApp = updatedAppResponse.data;
                    
                    // If staffId exists, assign to event
                    if (updatedApp?.staffId || application.staffId) {
                        const staffIdToAssign = updatedApp?.staffId || application.staffId;
                        await apiEvents.assignStaff(
                            event.id,
                            staffIdToAssign,
                            application.roleApplied || 'General Staff'
                        );
                        toast.success('Staff assigned to event successfully');
                    }
                } catch (assignError: any) {
                    console.error('Failed to assign staff to event:', assignError);
                    // Don't fail the approval if assignment fails - staff can be assigned manually
                    toast.warning('Application approved, but staff assignment failed. Please assign manually.');
                }
            }
            
            toast.success(`Application ${newStatus.toLowerCase()} successfully`);
            fetchApplications();
            if (onApplicationUpdate) onApplicationUpdate();
        } catch (error: any) {
            console.error('Failed to update application:', error);
            toast.error(error?.response?.data?.error || 'Failed to update application');
        }
    };

    const filteredApplications = applications.filter(app => {
        const matchesSearch = !searchTerm || 
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.roleApplied.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'Pending').length,
        interview: applications.filter(a => a.status === 'Interview').length,
        approved: applications.filter(a => a.status === 'Approved').length,
        rejected: applications.filter(a => a.status === 'Rejected').length,
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Interview': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-amber-100 text-amber-700 border-amber-200';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-qatar/10 to-blue-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Job Applications - {event.title}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {stats.total} total application{stats.total !== 1 ? 's' : ''} • {event.date}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-gray-300"
                        >
                            <XCircle size={18} className="mr-2" /> Close
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <Card className="p-4 bg-white border-2 border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total</p>
                                    <p className="text-2xl font-extrabold text-gray-900">{stats.total}</p>
                                </div>
                                <Users className="text-gray-400" size={24} />
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border-2 border-amber-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-amber-600 uppercase mb-1">Pending</p>
                                    <p className="text-2xl font-extrabold text-amber-700">{stats.pending}</p>
                                </div>
                                <Clock className="text-amber-500" size={24} />
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border-2 border-blue-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-blue-600 uppercase mb-1">Interview</p>
                                    <p className="text-2xl font-extrabold text-blue-700">{stats.interview}</p>
                                </div>
                                <Calendar className="text-blue-500" size={24} />
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border-2 border-emerald-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Approved</p>
                                    <p className="text-2xl font-extrabold text-emerald-700">{stats.approved}</p>
                                </div>
                                <CheckCircle className="text-emerald-500" size={24} />
                            </div>
                        </Card>
                        <Card className="p-4 bg-white border-2 border-red-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-red-600 uppercase mb-1">Rejected</p>
                                    <p className="text-2xl font-extrabold text-red-700">{stats.rejected}</p>
                                </div>
                                <XCircle className="text-red-500" size={24} />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<Search />}
                                name="search"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'Pending', 'Interview', 'Approved', 'Rejected'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                        statusFilter === status
                                            ? 'bg-qatar text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {status === 'all' ? 'All' : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Applications List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} variant="rounded" height={120} />
                            ))}
                        </div>
                    ) : filteredApplications.length === 0 ? (
                        <Card className="text-center py-12 bg-gray-50">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No Applications Found</h3>
                            <p className="text-sm text-gray-600">
                                {searchTerm || statusFilter !== 'all' 
                                    ? 'Try adjusting your filters' 
                                    : 'No applications have been submitted for this event yet'}
                            </p>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {filteredApplications.map((app, index) => (
                                    <motion.div
                                        key={app.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="hover:shadow-lg transition-all border-2 hover:border-qatar/30">
                                            <div className="p-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-qatar/20 to-blue-100 flex items-center justify-center flex-shrink-0">
                                                            {app.avatar && 
                                                             app.avatar !== 'null' && 
                                                             app.avatar !== 'undefined' && 
                                                             app.avatar !== '#' && 
                                                             !app.avatar.includes('pravatar') && 
                                                             !app.avatar.includes('ui-avatars') ? (
                                                                <img 
                                                                    src={app.avatar} 
                                                                    alt={app.name} 
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        // Hide image and show icon fallback on error
                                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                                        const parent = (e.target as HTMLImageElement).parentElement;
                                                                        if (parent && !parent.querySelector('.fallback-icon')) {
                                                                            const icon = document.createElement('div');
                                                                            icon.className = 'fallback-icon flex items-center justify-center w-full h-full';
                                                                            icon.innerHTML = '<svg class="w-8 h-8 text-qatar" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>';
                                                                            parent.appendChild(icon);
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Users className="text-qatar" size={32} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                                                                <Badge 
                                                                    status={app.status} 
                                                                    className={getStatusColor(app.status)}
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Briefcase size={14} className="text-gray-400" />
                                                                    <span className="font-medium">{app.roleApplied}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Mail size={14} className="text-gray-400" />
                                                                    <span>{app.email}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <Phone size={14} className="text-gray-400" />
                                                                    <span>{app.phone || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                    <MapPin size={14} className="text-gray-400" />
                                                                    <span>{app.location}</span>
                                                                </div>
                                                            </div>
                                                            {app.quizScore !== undefined && app.quizScore > 0 && (
                                                                <div className="flex items-center gap-2 mb-3">
                                                                    <Award className="text-amber-500" size={16} />
                                                                    <span className="text-sm font-bold text-amber-700">
                                                                        Quiz Score: {app.quizScore}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                <Calendar size={12} />
                                                                Applied on {new Date(app.appliedDate).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-2 min-w-[200px]">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedApplication(app);
                                                                setIsDetailModalOpen(true);
                                                            }}
                                                            className="w-full"
                                                        >
                                                            <Eye size={14} className="mr-2" /> View Details
                                                        </Button>
                                                        
                                                        {app.status === 'Pending' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateApplicationStatus(app.id, 'Interview')}
                                                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                                                                >
                                                                    <Calendar size={14} className="mr-2" /> Schedule Interview
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateApplicationStatus(app.id, 'Approved')}
                                                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                                                                >
                                                                    <UserCheck size={14} className="mr-2" /> Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => updateApplicationStatus(app.id, 'Rejected')}
                                                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                                                >
                                                                    <UserX size={14} className="mr-2" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                        
                                                        {app.status === 'Interview' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => updateApplicationStatus(app.id, 'Approved')}
                                                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                                                                >
                                                                    <CheckCircle size={14} className="mr-2" /> Approve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => updateApplicationStatus(app.id, 'Rejected')}
                                                                    className="w-full border-red-300 text-red-600 hover:bg-red-50"
                                                                >
                                                                    <XCircle size={14} className="mr-2" /> Reject
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Application Detail Modal */}
            {isDetailModalOpen && selectedApplication && (
                <ApplicationDetailModal
                    application={selectedApplication}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedApplication(null);
                    }}
                    onStatusUpdate={updateApplicationStatus}
                />
            )}
        </div>
    );
};

const ApplicationDetailModal: React.FC<{
    application: JobApplication;
    onClose: () => void;
    onStatusUpdate: (id: string, status: 'Pending' | 'Interview' | 'Approved' | 'Rejected', notes?: string) => void;
}> = ({ application, onClose, onStatusUpdate }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-qatar/10 to-blue-50">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                        <Button variant="outline" onClick={onClose} size="sm">
                            <XCircle size={16} />
                        </Button>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Personal Info */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Name</p>
                                <p className="font-medium text-gray-900">{application.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="font-medium text-gray-900">{application.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                <p className="font-medium text-gray-900">{application.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Location</p>
                                <p className="font-medium text-gray-900">{application.location}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Application Info */}
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Application Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Role Applied</p>
                                <p className="font-medium text-gray-900">{application.roleApplied}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Experience</p>
                                <p className="font-medium text-gray-900">{application.experience}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <Badge status={application.status} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Applied Date</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(application.appliedDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Quiz Results */}
                    {application.quizScore !== undefined && application.quizScore > 0 && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-4">Quiz Results</h4>
                            <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Quiz Score</p>
                                        <p className="text-3xl font-extrabold text-amber-700">{application.quizScore}%</p>
                                    </div>
                                    <Award className="text-amber-500" size={48} />
                                </div>
                            </Card>
                        </div>
                    )}
                    
                    {/* Languages */}
                    {application.languages && application.languages.length > 0 && (
                        <div>
                            <h4 className="text-lg font-bold text-gray-900 mb-4">Languages</h4>
                            <div className="flex flex-wrap gap-2">
                                {application.languages.map((lang, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

