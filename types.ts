export enum UserRole {
  PUBLIC = 'PUBLIC',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT',
  SUPERVISOR = 'SUPERVISOR'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
}

export interface EventBudget {
  total: number;
  staffingAllocated: number;
  logisticsAllocated: number;
  marketingAllocated: number;
  cateringAllocated?: number;
  technologyAllocated?: number;
  miscellaneousAllocated?: number;
  spent: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Pending' | 'Cancelled';
  staffRequired: number;
  staffAssigned: number;
  revenue: number;
  imageUrl?: string;
  shifts?: Shift[];
  budget?: EventBudget;
  roles?: EventRole[];
}

export interface EventRole {
  roleName: string;
  count: number;
  filled: number;
}

export interface StaffSkill {
  name: string;
  status: 'Verified' | 'Pending' | 'Rejected';
}

export interface ClientFeedback {
  id: string;
  eventId: string;
  eventName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface StaffDocument {
  id: string;
  title: string;
  type: 'ID' | 'Passport' | 'Certificate' | 'Contract';
  uploadDate: string;
  expiryDate?: string;
  status: 'Verified' | 'Pending' | 'Expired' | 'Rejected';
  url: string;
}

export interface StaffProfile {
  id: string;
  name: string;
  role: string;
  rating: number;
  status: 'Available' | 'On Shift' | 'Leave' | 'Suspended';
  skills: StaffSkill[];
  imageUrl: string;
  totalEarnings: number;
  email: string;
  phone: string;
  location: string;
  joinedDate: string;
  feedback?: ClientFeedback[];
  completedShifts?: number;
  onTimeRate?: number;
  certifications?: string[];
  xpPoints?: number;
  level?: 'Bronze' | 'Silver' | 'Gold' | 'Elite';
  documents?: StaffDocument[];
}

export interface ClientProfile {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive';
    totalEvents: number;
    totalSpent: number;
    imageUrl: string;
}

export interface SupervisorProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'Active' | 'On Leave';
    assignedEvents: number;
    rating: number;
    imageUrl: string;
}

export interface QuizAnswer {
  questionId: number;
  question: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
}

export interface JobApplication {
  // Event details (optional, populated when eventId is present)
  eventId?: string;
  eventTitle?: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  eventLocation?: string;
  eventDescription?: string;
  eventStatus?: string;
  eventImageUrl?: string;
  
  // Existing fields
  id: string;
  name: string;
  email: string;
  phone: string;
  roleApplied: string;
  experience: string;
  location: string;
  status: 'Pending' | 'Interview' | 'Approved' | 'Rejected';
  appliedDate: string;
  avatar: string;
  idDocumentUrl?: string;
  nationality?: string;
  dob?: string;
  gender?: 'Male' | 'Female';
  height?: string;
  weight?: string;
  shirtSize?: string;
  cvUrl?: string;
  languages?: string[];
  quizScore?: number;
  quizDetails?: QuizAnswer[];
  interviewDate?: string;
  interviewTime?: string;
  interviewLocation?: string;
  interviewer?: string;
  interviewNotes?: string;
  meetingLink?: string;
  interviewType?: 'local' | 'online';
}

export interface Shift {
  id: string;
  eventId: string;
  eventTitle: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'Scheduled' | 'Live' | 'Completed' | 'Pending';
  confirmationStatus?: 'Confirmed' | 'Declined' | 'Pending';
  wage: number;
  instructions?: string;
  contactPerson?: string;
  contactPhone?: string;
  attire?: string;
  attendanceStatus?: 'On Time' | 'En Route' | 'Running Late' | 'Arrived' | 'Absent';
  checkInTime?: string;
  checkOutTime?: string;
  role?: string;
  uniformVerified?: boolean;
}

// --- NEW ENTERPRISE TYPES ---

export interface JobOpportunity {
  id: string;
  eventId: string;
  title: string;
  role: string;
  date: string;
  time: string;
  location: string;
  rate: number;
  requirements: string[];
  spotsOpen: number;
  isVIP?: boolean;
}

export interface Booking {
  id: string;
  eventType: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  budget: string;
  staff: {
    servers: number;
    hosts: number;
    other: number;
  };
  contact: {
    name: string;
    company: string;
    phone: string;
    email: string;
  };
  eventDetails: {
    venue: string;
    guests: string;
    dressCode: string;
    special: string;
  };
  status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Converted';
  submittedDate: string;
  convertedToEventId?: string;
}

export interface Transaction {
  id: string;
  date: string;
  event: string;
  amount: number;
  status: 'Paid' | 'Processing';
  staffName?: string;
}

export interface PayrollItem {
  id: string;
  staffId: string;
  staffName: string;
  eventId: string;
  eventName: string;
  shiftDate: string;
  hoursWorked: number;
  hourlyRate: number;
  totalAmount: number;
  status: 'Unpaid' | 'Processing' | 'Paid';
  overtimeHours?: number;
  overtimeRate?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai';
  category?: 'System' | 'Application' | 'Staff' | 'Finance';
  timestamp: string;
  isRead: boolean;
}

export interface Badge {
  id: string;
  staffName: string;
  role: string;
  eventId: string;
  eventName: string;
  qrCodeUrl: string;
  accessLevel: 'All Access' | 'Staff Area' | 'VIP Only';
  status: 'Active' | 'Revoked';
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  type: 'Video' | 'Document' | 'Interactive';
  duration: string;
  thumbnailUrl: string;
  requiredForRole?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  xpPoints: number;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Incident {
  id: string;
  type: 'Medical' | 'Security' | 'Logistics' | 'Behavioral' | 'Other';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: 'Open' | 'Resolved';
  eventId?: string;
  location?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'Direct' | 'Broadcast';
}