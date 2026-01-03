import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Event, StaffProfile, JobApplication, Booking, Shift, PayrollItem, Incident } from '../types';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';
import { parseApiError, ApiError, logError, ErrorType } from '../utils/errorHandler';
import { getCSRFToken, globalRateLimiter } from '../utils/security';
import { getApiBaseUrl } from '../utils/apiConfig';

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
  timeout: 30000, // 30 second timeout
});

// Request interceptor to add auth token, CSRF token, and rate limiting
api.interceptors.request.use(
  (config) => {
    // Add CSRF token
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    // Add auth token
    const token = getCookie('auth_token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Rate limiting check
    const rateLimitKey = `${config.method?.toUpperCase()}_${config.url}`;
    if (!globalRateLimiter.isAllowed(rateLimitKey)) {
      const waitTime = globalRateLimiter.getTimeUntilNext(rateLimitKey);
      return Promise.reject(
        new ApiError(
          `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
          'CLIENT' as any,
          'RATE_LIMIT',
          { waitTime },
          'Too many requests. Please wait a moment and try again.'
        )
      );
    }

    return config;
  },
  (error) => {
    const apiError = parseApiError(error);
    logError(apiError, 'Request Interceptor');
    return Promise.reject(apiError);
  }
);

// Response interceptor for enhanced error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (import.meta.env.MODE === 'development') {
      console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    const apiError = parseApiError(error);
    
    // Log error
    logError(apiError, `Response Interceptor - ${error.config?.method?.toUpperCase()} ${error.config?.url}`);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Only redirect if we're not already on the login page
      const token = getCookie('auth_token') || localStorage.getItem('auth_token');
      if (token && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/staff-portal')) {
        // Clear tokens
        deleteCookie('auth_token');
        deleteCookie('refresh_token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        
        // Only redirect if we're not in StaffPortal or AdminDashboard
        if (!window.location.pathname.includes('/staff-portal') && !window.location.pathname.includes('/admin-dashboard')) {
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      }
    }

    // Handle CSRF token mismatch
    const errorData = error.response?.data as any;
    if (error.response?.status === 403 && errorData?.error?.includes('CSRF')) {
      // Regenerate CSRF token
      sessionStorage.removeItem('csrf_token');
      const newToken = getCSRFToken();
      // Retry the request with new token
      if (error.config) {
        const headers = error.config.headers as Record<string, string> || {};
        headers['X-CSRF-Token'] = newToken;
        error.config.headers = headers as any;
        return api.request(error.config);
      }
    }

    return Promise.reject(apiError);
  }
);

// Transform backend event to frontend format
const transformEvent = (e: any): Event => {
  if (!e) {
    console.error('transformEvent: Event data is undefined or null');
    throw new Error('Event data is undefined');
  }
  
  console.log('Transforming event:', {
    id: e._id || e.id,
    title: e.title,
    status: e.status,
    hasStartAt: !!e.startAt,
    hasLocation: !!e.location,
    hasRequiredRoles: !!e.requiredRoles,
  });
  
  // Calculate staffAssigned from assignments if not provided
  const staffAssigned = e.staffAssigned !== undefined 
    ? e.staffAssigned 
    : (Array.isArray(e.assignments) ? e.assignments.filter((a: any) => a.status === 'APPROVED').length : 0);
  
  // Parse date safely - try multiple date fields
  let eventDate = '';
  if (e.startAt) {
    try {
      const date = new Date(e.startAt);
      if (!isNaN(date.getTime())) {
        eventDate = date.toISOString().split('T')[0];
      }
    } catch (err) {
    }
  }
  // Fallback to date field if startAt is not available
  if (!eventDate && e.date) {
    try {
      const date = new Date(e.date);
      if (!isNaN(date.getTime())) {
        eventDate = date.toISOString().split('T')[0];
      } else if (typeof e.date === 'string' && e.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        eventDate = e.date;
      }
    } catch (err) {
    }
  }
  
  // Handle location - can be object or string
  let location = '';
  if (typeof e.location === 'object' && e.location !== null) {
    location = e.location.address || e.location.city || e.location.name || '';
  } else if (typeof e.location === 'string') {
    location = e.location;
  }
  
  // Map status correctly - handle both uppercase and mixed case
  let status: 'Upcoming' | 'Live' | 'Completed' | 'Pending' | 'Cancelled' = 'Pending';
  const statusUpper = String(e.status || '').toUpperCase();
  if (statusUpper === 'PENDING') status = 'Pending';
  else if (statusUpper === 'APPROVED' || statusUpper === 'UPCOMING') status = 'Upcoming';
  else if (statusUpper === 'LIVE') status = 'Live';
  else if (statusUpper === 'COMPLETED') status = 'Completed';
  else if (statusUpper === 'CANCELLED' || statusUpper === 'CANCELED') status = 'Cancelled';
  else if (e.status) {
    // Try to match as-is if it's already in the correct format
    const validStatuses = ['Pending', 'Upcoming', 'Live', 'Completed', 'Cancelled'];
    if (validStatuses.includes(e.status)) {
      status = e.status as any;
    }
  }
  
  // Transform requiredRoles (Map or object) to roles array
  let roles: Array<{ roleName: string; count: number; filled: number }> = [];
  if (e.requiredRoles) {
    // Handle Map (from Mongoose) - should be converted to object by JSON.parse(JSON.stringify)
    if (e.requiredRoles instanceof Map) {
      e.requiredRoles.forEach((count: number, roleName: string) => {
        // Count both APPROVED and PENDING assignments for display
        const filled = Array.isArray(e.assignments) ? e.assignments.filter((a: any) => 
          a.role === roleName && (a.status === 'APPROVED' || a.status === 'PENDING')
        ).length : 0;
        roles.push({ roleName, count, filled });
      });
    } 
    // Handle plain object
    else if (typeof e.requiredRoles === 'object' && !Array.isArray(e.requiredRoles)) {
      roles = Object.entries(e.requiredRoles).map(([roleName, count]) => {
        // Count both APPROVED and PENDING assignments for display
        const filled = Array.isArray(e.assignments) ? e.assignments.filter((a: any) => 
          a.role === roleName && (a.status === 'APPROVED' || a.status === 'PENDING')
        ).length : 0;
  return {
          roleName,
          count: count as number,
          filled,
        };
      });
    }
  }
  
  // If no roles found but staffRequired is set, create a default role
  if (roles.length === 0 && (e.staffRequired || 0) > 0) {
    roles = [{
      roleName: 'General Staff',
      count: e.staffRequired || 0,
      filled: staffAssigned,
    }];
  }
  
  const transformed = {
    id: e._id || e.id || '',
    title: e.title || '',
    location: location,
    date: eventDate,
    description: e.description || '',
    status: status,
    staffRequired: e.staffRequired || 0,
    staffAssigned: staffAssigned,
    revenue: e.revenue || 0,
    roles: roles,
    assignments: e.assignments || [], // Include assignments in transformed event
    budget: {
      total: e.budget?.total || 0,
      staffingAllocated: e.budget?.staffingAllocated || 0,
      logisticsAllocated: e.budget?.logisticsAllocated || 0,
      marketingAllocated: e.budget?.marketingAllocated || 0,
      cateringAllocated: e.budget?.cateringAllocated || 0,
      technologyAllocated: e.budget?.technologyAllocated || 0,
      miscellaneousAllocated: e.budget?.miscellaneousAllocated || 0,
      spent: e.budget?.spent || 0,
    },
    imageUrl: e.imageUrl,
  };
  
  console.log('Transformed event result:', {
    id: transformed.id,
    title: transformed.title,
    status: transformed.status,
    date: transformed.date,
    location: transformed.location,
  });
  
  return transformed;
};

// Transform backend staff to frontend format
const transformStaff = (s: any): StaffProfile => {
  if (!s) {
    console.error('transformStaff: Staff data is undefined or null');
    throw new Error('Staff data is undefined');
  }
  
  // Format date fields properly
  let joinedDate = new Date().toISOString().split('T')[0];
  if (s.joinedDate) {
    try {
      joinedDate = new Date(s.joinedDate).toISOString().split('T')[0];
    } catch (e) {
      // If already in YYYY-MM-DD format, use as is
      if (typeof s.joinedDate === 'string' && s.joinedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        joinedDate = s.joinedDate;
      }
    }
  }
  
  let dob = '';
  if (s.dob) {
    try {
      dob = new Date(s.dob).toISOString().split('T')[0];
    } catch (e) {
      // If already in YYYY-MM-DD format, use as is
      if (typeof s.dob === 'string' && s.dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dob = s.dob;
      }
    }
  }
  
  return {
    id: s._id || s.id || '',
    name: s.name || '',
    role: s.role || 'Hostess',
    rating: s.rating || 5,
    status: s.status || 'Available',
    skills: s.skills || [],
    imageUrl: s.imageUrl || 'https://i.pravatar.cc/150',
    totalEarnings: s.totalEarnings || 0,
    email: s.email || '',
    phone: s.phone || '',
    location: s.location || 'Doha',
    joinedDate: joinedDate,
    feedback: s.feedback || [],
    completedShifts: s.completedShifts || 0,
    onTimeRate: s.onTimeRate || 100,
    certifications: Array.isArray(s.certifications) ? s.certifications : [],
    xpPoints: s.xpPoints || 0,
    level: s.level || 'Bronze',
    documents: Array.isArray(s.documents) ? s.documents : [],
    // Additional fields (not in StaffProfile type, but may be in backend response)
    // Note: languages, dob, gender, height, weight, shirtSize, qidNumber, galleryPhotos are not in StaffProfile type but may be in backend response
    // These are included in the returned object but not typed in StaffProfile
    // qidNumber: s.qidNumber || '', // Removed - not in StaffProfile type
    // galleryPhotos: Array.isArray(s.galleryPhotos) ? s.galleryPhotos.map((photo: any) => ({
    //   id: photo._id || photo.id || '',
    //   url: photo.url || '',
    //   thumbnail: photo.thumbnail || photo.url || '',
    //   caption: photo.caption || '',
    //   uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    //   isProfilePicture: photo.isProfilePicture || false,
    // })) : [], // Removed - not in StaffProfile type
  };
};

// Transform backend shift to frontend format
const transformShift = (s: any): Shift => {
  return {
    id: s._id || s.id,
    eventId: s.eventId?._id || s.eventId || '',
    eventTitle: s.eventId?.title || s.eventTitle || '',
    location: s.location || s.eventId?.location?.address || '',
    startTime: new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    endTime: new Date(s.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    date: new Date(s.date || s.startTime).toISOString().split('T')[0],
    status: s.status,
    confirmationStatus: s.confirmationStatus,
    wage: s.wage || 0,
    instructions: s.instructions,
    contactPerson: s.contactPerson,
    contactPhone: s.contactPhone,
    attire: s.attire,
    attendanceStatus: s.attendanceStatus,
    checkInTime: s.checkInTime ? new Date(s.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    checkOutTime: s.checkOutTime ? new Date(s.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
    role: s.role,
    uniformVerified: s.uniformVerified,
  };
};

// Auth
export const auth = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      // Set cookies for session persistence
      setCookie('auth_token', response.data.data.token, 7); // 7 days
      setCookie('refresh_token', response.data.data.refreshToken, 30); // 30 days
      // Also keep in localStorage as fallback
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('refresh_token', response.data.data.refreshToken);
    }
    return response.data;
  },
  
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    if (response.data.success) {
      // Set cookies for session persistence
      setCookie('auth_token', response.data.data.token, 7);
      setCookie('refresh_token', response.data.data.refreshToken, 30);
      // Also keep in localStorage as fallback
      localStorage.setItem('auth_token', response.data.data.token);
      localStorage.setItem('refresh_token', response.data.data.refreshToken);
    }
    return response.data;
  },
  
  getMe: async () => {
    // Check for token before making request to prevent unnecessary 401s
    const token = getCookie('auth_token') || localStorage.getItem('auth_token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
        data: null,
      };
    }
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      deleteCookie('auth_token');
      deleteCookie('refresh_token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (resetToken: string, password: string) => {
    const response = await api.put(`/auth/reset-password/${resetToken}`, { password });
    return response.data;
  },
  
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Events
export const events = {
  list: async (params?: { page?: number; limit?: number; status?: string; search?: string; upcoming?: string | boolean; clientId?: string }) => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = Date.now();
      const response = await api.get('/events', { 
        params: { ...params, _t: cacheBuster },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      
      // Backend returns: { success: true, data: [...events], pagination: {...} }
      console.log('Events API response structure:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        dataType: typeof response.data?.data,
        isArray: Array.isArray(response.data?.data),
        dataLength: response.data?.data?.length || 0,
      });
      
      const eventsArray = response.data?.data || [];
      
      console.log('Events array extracted:', {
        length: eventsArray?.length || 0,
        isArray: Array.isArray(eventsArray),
        firstEvent: eventsArray?.[0] ? {
          id: eventsArray[0]._id || eventsArray[0].id,
          title: eventsArray[0].title,
          status: eventsArray[0].status,
        } : 'none',
      });
      
      if (!Array.isArray(eventsArray)) {
        console.error('Events API did not return an array:', eventsArray, typeof eventsArray);
        return {
          success: false,
          data: [],
          pagination: response.data?.pagination || {},
        };
      }
      
      if (eventsArray.length === 0) {
        console.warn('Events array is empty');
        return {
          success: response.data?.success !== false,
          data: [],
          pagination: response.data?.pagination || {},
        };
      }
      
      const transformedEvents = eventsArray
        .filter((e: any) => {
          // Filter out null/undefined and ensure we have at least an _id or id
          if (!e || e === null || e === undefined) {
            console.warn('Skipping null/undefined event');
            return false;
          }
          if (!e._id && !e.id) {
            console.warn('Skipping event without ID:', e);
            return false;
          }
          return true;
        })
        .map((e: any, index: number) => {
        try {
            console.log(`Transforming event ${index + 1}/${eventsArray.length}:`, {
              id: e._id || e.id,
              title: e.title,
              status: e.status,
            });
            
          const transformed = transformEvent(e);
            console.log('Successfully transformed event:', {
              id: transformed.id,
              title: transformed.title,
              status: transformed.status,
            });
          return transformed;
        } catch (error: any) {
            console.error('Error transforming event:', {
              eventId: e?._id || e?.id,
              title: e?.title,
              error: error?.message,
              stack: error?.stack,
            });
          // Return a minimal valid event object instead of null to prevent data loss
            const fallbackEvent = {
            id: e._id || e.id || '',
            title: e.title || 'Untitled Event',
              location: typeof e.location === 'object' ? (e.location?.address || e.location?.city || '') : (e.location || ''),
              date: e.startAt ? new Date(e.startAt).toISOString().split('T')[0] : (e.date || ''),
            description: e.description || '',
            status: 'Pending' as const,
            staffRequired: e.staffRequired || 0,
            staffAssigned: e.staffAssigned || 0,
            revenue: e.revenue || 0,
            roles: [],
            budget: {
                total: e.budget?.total || 0,
                staffingAllocated: e.budget?.staffingAllocated || 0,
                logisticsAllocated: e.budget?.logisticsAllocated || 0,
                marketingAllocated: e.budget?.marketingAllocated || 0,
                cateringAllocated: e.budget?.cateringAllocated || 0,
                technologyAllocated: e.budget?.technologyAllocated || 0,
                miscellaneousAllocated: e.budget?.miscellaneousAllocated || 0,
                spent: e.budget?.spent || 0,
            },
              imageUrl: e.imageUrl,
          };
            console.log('Using fallback event:', fallbackEvent);
            return fallbackEvent;
        }
        })
        .filter((e: any) => e !== null && e !== undefined); // Remove any null entries
      
      console.log('Final transformed events count:', transformedEvents.length);
      if (transformedEvents.length > 0) {
        console.log('First transformed event:', transformedEvents[0]);
      }
      
      return {
        success: response.data?.success !== false,
        data: transformedEvents,
        pagination: response.data?.pagination || {},
      };
    } catch (error: any) {
      console.error('Error in events.list:', error);
      throw error;
    }
  },
  
  get: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    if (!response.data || !response.data.data) {
      throw new Error('Event not found');
    }
    return {
      ...response.data,
      data: transformEvent(response.data.data),
    };
  },
  
  create: async (data: Partial<Event & { endDate?: string }>) => {
    // Validate required fields
    if (!data.title || !data.date) {
      throw new Error('Title and date are required');
    }
    
    // Transform frontend format to backend format
    const startDate = data.date ? new Date(data.date + 'T10:00:00Z') : new Date();
    const endDate = (data as any).endDate 
      ? new Date((data as any).endDate + 'T18:00:00Z') 
      : new Date(startDate.getTime() + 8 * 60 * 60 * 1000);
    
    // Ensure startDate is valid
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date');
    }
    if (isNaN(endDate.getTime())) {
      throw new Error('Invalid end date');
    }
    
    // Transform roles array to requiredRoles object/Map
    const requiredRoles: Record<string, number> = {};
    if (data.roles && data.roles.length > 0) {
      data.roles.forEach(role => {
        if (role.roleName && role.count > 0) {
          requiredRoles[role.roleName] = role.count;
        }
      });
    } else if (data.staffRequired && data.staffRequired > 0) {
      // If no roles specified but staffRequired is set, create default
      requiredRoles['General Staff'] = data.staffRequired;
    }
    
    // Calculate staffRequired from roles if not explicitly set
    const calculatedStaffRequired = data.staffRequired || 
      Object.values(requiredRoles).reduce((sum, count) => sum + count, 0);
    
    const backendData: any = {
      title: data.title,
      description: data.description || '',
      location: {
        address: data.location || '',
        city: 'Doha',
        country: 'Qatar',
      },
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      status: data.status === 'Pending' ? 'PENDING' : 
              data.status === 'Upcoming' ? 'APPROVED' :
              data.status === 'Live' ? 'LIVE' :
              data.status === 'Completed' ? 'COMPLETED' : 
              data.status === 'Cancelled' ? 'CANCELLED' : 'PENDING',
      staffRequired: calculatedStaffRequired,
      requiredRoles: requiredRoles,
      budget: data.budget || { 
        total: 0, 
        staffingAllocated: 0, 
        logisticsAllocated: 0, 
        marketingAllocated: 0, 
        cateringAllocated: 0, 
        technologyAllocated: 0, 
        miscellaneousAllocated: 0, 
        spent: 0 
      },
      revenue: data.revenue || 0,
    };
    
    console.log('Sending event creation request:', backendData);
    const response = await api.post('/events', backendData);
    
    if (!response.data) {
      throw new Error('Invalid response from server');
    }
    
    // Handle both response.data.data and response.data directly
    const eventData = response.data.data || response.data;
    if (!eventData) {
      throw new Error('Event data not found in response');
    }
    
    return {
      ...response.data,
      data: transformEvent(eventData),
    };
  },
  
  update: async (id: string, data: Partial<Event>) => {
    if (!id) {
      throw new Error('Event ID is required for update');
    }
    
    const backendData: any = {
      title: data.title,
      description: data.description || '',
      location: typeof data.location === 'string' 
        ? { address: data.location, city: 'Doha', country: 'Qatar' } 
        : (data.location || { address: '', city: 'Doha', country: 'Qatar' }),
      status: data.status === 'Pending' ? 'PENDING' :
              data.status === 'Upcoming' ? 'APPROVED' :
              data.status === 'Live' ? 'LIVE' :
              data.status === 'Completed' ? 'COMPLETED' : 
              data.status === 'Cancelled' ? 'CANCELLED' : 'PENDING',
      budget: data.budget || { 
        total: 0, 
        staffingAllocated: 0, 
        logisticsAllocated: 0, 
        marketingAllocated: 0, 
        cateringAllocated: 0, 
        technologyAllocated: 0, 
        miscellaneousAllocated: 0, 
        spent: 0 
      },
      revenue: data.revenue || 0,
    };
    
    // Update dates if provided
    if (data.date) {
      const startDate = new Date(data.date + 'T10:00:00Z');
      const endDate = (data as any).endDate 
        ? new Date((data as any).endDate + 'T18:00:00Z')
        : new Date(data.date + 'T18:00:00Z');
      
      if (!isNaN(startDate.getTime())) {
        backendData.startAt = startDate.toISOString();
      }
      if (!isNaN(endDate.getTime())) {
        backendData.endAt = endDate.toISOString();
      }
    }
    
    // Update requiredRoles if roles are provided
    if (data.roles && data.roles.length > 0) {
      const requiredRoles: Record<string, number> = {};
      data.roles.forEach(role => {
        if (role.roleName && role.count > 0) {
          requiredRoles[role.roleName] = role.count;
        }
      });
      backendData.requiredRoles = requiredRoles;
      backendData.staffRequired = data.staffRequired || 
        Object.values(requiredRoles).reduce((sum, count) => sum + count, 0);
    } else if (data.staffRequired) {
      backendData.staffRequired = data.staffRequired;
    }
    
    console.log('Sending event update request:', backendData);
    const response = await api.put(`/events/${id}`, backendData);
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from server');
    }
    
    return {
      ...response.data,
      data: transformEvent(response.data.data),
    };
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
  
  assignStaff: async (eventId: string, staffId: string, role: string, paymentData?: any) => {
    const requestBody: any = { staffId, role };
    if (paymentData && paymentData.payment) {
      requestBody.payment = paymentData.payment;
    }
    const response = await api.post(`/events/${eventId}/assign`, requestBody);
    return {
      ...response.data,
      data: transformEvent(response.data.data),
    };
  },
  
  updateAssignment: async (eventId: string, staffId: string, status: string) => {
    const response = await api.put(`/events/${eventId}/assignments/${staffId}`, { status });
    return {
      ...response.data,
      data: transformEvent(response.data.data),
    };
  },
  
  // Smart Assignment Features
  getSmartMatches: async (eventId: string, role: string, count: number = 5) => {
    const response = await api.get(`/events/${eventId}/smart-match/${role}`, {
      params: { count },
    });
    return response.data;
  },
  
  autoAssign: async (eventId: string, options: {
    autoCreateShifts?: boolean;
    notifyStaff?: boolean;
    maxAssignmentsPerRole?: number;
  } = {}) => {
    const response = await api.post(`/events/${eventId}/auto-assign`, options);
    return {
      ...response.data,
      data: response.data.data?.event ? transformEvent(response.data.data.event) : response.data.data,
    };
  },
  
  autoCreateShifts: async (eventId: string, staffIds?: string[], notifyStaff: boolean = true) => {
    const response = await api.post(`/events/${eventId}/auto-shifts`, {
      staffIds,
      notifyStaff,
    });
    return response.data;
  },
  
  getRecommendations: async (eventId: string) => {
    const response = await api.get(`/events/${eventId}/recommendations`);
    return response.data;
  },
  
  detectConflicts: async (staffId: string, startTime: string, endTime: string, excludeShiftId?: string) => {
    const response = await api.post('/shifts/detect-conflicts', {
      staffId,
      startTime,
      endTime,
      excludeShiftId,
    });
    return response.data;
  },
};

// Staff
export const staff = {
  list: async (params?: { page?: number; limit?: number; role?: string; status?: string; search?: string }) => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const cacheBuster = Date.now();
      const response = await api.get('/staff', { 
        params: { ...params, _t: cacheBuster },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      
      const staffArray = response.data?.data || [];
      
      if (!Array.isArray(staffArray)) {
        console.error('Staff API did not return an array:', staffArray);
    return {
          success: false,
          data: [],
          pagination: {},
        };
      }
      
      const transformedStaff = staffArray
        .filter((s: any) => s !== null && s !== undefined)
        .map((s: any) => {
          try {
            return transformStaff(s);
          } catch (error: any) {
            console.error('Error transforming staff:', s, error);
            // Return minimal valid staff object
            return {
              id: s._id || s.id || '',
              name: s.name || 'Unknown',
              role: s.role || 'General Staff',
              rating: s.rating || 5,
              status: s.status || 'Available',
              skills: s.skills || [],
              imageUrl: s.imageUrl || 'https://i.pravatar.cc/150',
              totalEarnings: s.totalEarnings || 0,
              email: s.email || '',
              phone: s.phone || '',
              location: s.location || 'Doha',
              joinedDate: s.joinedDate ? new Date(s.joinedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              completedShifts: s.completedShifts || 0,
              onTimeRate: s.onTimeRate || 100,
              certifications: s.certifications || [],
              xpPoints: s.xpPoints || 0,
              level: s.level || 'Bronze',
              documents: s.documents || [],
              feedback: s.feedback || [],
            };
          }
        })
        .filter((s: any) => s !== null);
      
      return {
        success: response.data?.success !== false,
        data: transformedStaff,
        pagination: response.data?.pagination || {},
    };
    } catch (error: any) {
      console.error('Error in staff.list:', error);
      throw error;
    }
  },
  
  get: async (id: string) => {
    const response = await api.get(`/staff/${id}`);
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
  
  getProfile: async (userId?: string) => {
    const params = userId ? { userId } : {};
    const response = await api.get('/staff/me', { params });
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
  
  create: async (data: Partial<StaffProfile>) => {
    console.log('Creating staff with data:', data);
    const response = await api.post('/staff', data);
    console.log('Create staff response:', response.data);
    
    // Handle response structure - backend returns { success: true, data: {...} }
    const staffData = response.data?.data || response.data;
    
    if (!staffData) {
      console.error('No staff data in response:', response.data);
      throw new Error('Invalid response from server - no staff data');
    }
    
    try {
      const transformed = transformStaff(staffData);
    return {
      ...response.data,
        data: transformed,
    };
    } catch (error: any) {
      console.error('Error transforming staff:', error);
      console.error('Staff data received:', staffData);
      throw new Error(`Failed to transform staff data: ${error.message}`);
    }
  },
  
  update: async (id: string, data: Partial<StaffProfile>) => {
    if (!id) {
      throw new Error('Staff ID is required for update');
    }
    
    console.log('Updating staff with data:', data);
    const response = await api.put(`/staff/${id}`, data);
    console.log('Update staff response:', response.data);
    
    // Handle response structure
    const staffData = response.data?.data || response.data;
    
    if (!staffData) {
      console.error('No staff data in response:', response.data);
      throw new Error('Invalid response from server - no staff data');
    }
    
    try {
      const transformed = transformStaff(staffData);
    return {
      ...response.data,
        data: transformed,
    };
    } catch (error: any) {
      console.error('Error transforming staff:', error);
      console.error('Staff data received:', staffData);
      throw new Error(`Failed to transform staff data: ${error.message}`);
    }
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  },
  
  uploadDocument: async (staffId: string, file: File, documentData: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', documentData.title || file.name);
    formData.append('type', documentData.type || 'Certificate');
    if (documentData.expiryDate) {
      formData.append('expiryDate', documentData.expiryDate);
    }
    
    const response = await api.post(`/staff/${staffId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
  
  verifyDocument: async (staffId: string, documentId: string, status: 'Verified' | 'Pending' | 'Expired' | 'Rejected') => {
    const response = await api.put(`/staff/${staffId}/documents/${documentId}`, { status });
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
  
  addGalleryPhoto: async (staffId: string, photoData: { url: string; thumbnail?: string; caption?: string; isProfilePicture?: boolean }) => {
    const response = await api.post(`/staff/${staffId}/gallery`, photoData);
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
  
  deleteGalleryPhoto: async (staffId: string, photoId: string) => {
    const response = await api.delete(`/staff/${staffId}/gallery/${photoId}`);
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
  
  updateGalleryPhoto: async (staffId: string, photoId: string, updateData: { caption?: string; isProfilePicture?: boolean }) => {
    const response = await api.put(`/staff/${staffId}/gallery/${photoId}`, updateData);
    return {
      ...response.data,
      data: transformStaff(response.data.data),
    };
  },
};

// Applications
export const applications = {
  list: async (params?: { page?: number; limit?: number; status?: string; roleApplied?: string }) => {
    // Admin endpoint - requires admin access
    try {
      console.log('Fetching applications with params:', params);
      const response = await api.get('/applications', { params });
      console.log('Applications API raw response:', response);
      console.log('Applications response data:', response.data);
      
      if (!response || !response.data) {
        console.error('No response or data in response');
        return { data: [], pagination: {} };
      }
      
      // Handle case where data might be directly in response.data or response.data.data
      const applicationsData = response.data.data || response.data || [];
      
      console.log('Applications data to transform:', applicationsData);
      
      return {
        ...response.data,
        data: Array.isArray(applicationsData) ? applicationsData.map((a: any) => {
          // Ensure languages is always an array
          let languages = [];
          if (Array.isArray(a.languages)) {
            languages = a.languages;
          } else if (typeof a.languages === 'string') {
            languages = a.languages.split(',').map((l: string) => l.trim()).filter((l: string) => l);
          }
          
          // Ensure avatar has proper fallback
          const avatar = (a.avatar && a.avatar !== 'null' && a.avatar !== 'undefined' && a.avatar !== '#' && a.avatar !== '') 
            ? a.avatar 
            : ((a.imageUrl && a.imageUrl !== 'null' && a.imageUrl !== 'undefined' && a.imageUrl !== '#' && a.imageUrl !== '')
              ? a.imageUrl
              : `https://i.pravatar.cc/150?u=${encodeURIComponent(a.name || 'user')}`);
          
          // Format appliedDate - handle ISO date strings
          let appliedDate = new Date().toISOString().split('T')[0];
          if (a.appliedDate) {
            try {
              if (typeof a.appliedDate === 'string') {
                // If it's already in YYYY-MM-DD format, use it
                if (a.appliedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  appliedDate = a.appliedDate;
                } else if (a.appliedDate.includes('T')) {
                  // If it's an ISO string, extract just the date part
                  appliedDate = a.appliedDate.split('T')[0];
                } else {
                  // Try to parse as date
                  const dateObj = new Date(a.appliedDate);
                  if (!isNaN(dateObj.getTime())) {
                    appliedDate = dateObj.toISOString().split('T')[0];
                  }
                }
              } else {
                // If it's a Date object or timestamp
                const dateObj = new Date(a.appliedDate);
                if (!isNaN(dateObj.getTime())) {
                  appliedDate = dateObj.toISOString().split('T')[0];
                }
              }
            } catch (e) {
              console.warn('Error parsing appliedDate:', e);
            }
          }
          
          // Format dob - handle ISO date strings
          let dob = '';
          if (a.dob) {
            try {
              if (typeof a.dob === 'string') {
                // If it's already in YYYY-MM-DD format, use it
                if (a.dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  dob = a.dob;
                } else {
                  // If it's an ISO string, extract just the date part
                  const dateObj = new Date(a.dob);
                  if (!isNaN(dateObj.getTime())) {
                    dob = dateObj.toISOString().split('T')[0];
                  }
                }
              } else {
                // If it's a Date object or timestamp
                const dateObj = new Date(a.dob);
                if (!isNaN(dateObj.getTime())) {
                  dob = dateObj.toISOString().split('T')[0];
                }
              }
            } catch (e) {
              console.warn('Error parsing dob:', e);
            }
          }
          
          return {
            // Preserve all other fields first (excluding id, _id, avatar, languages, cvUrl, idDocumentUrl which we'll set explicitly)
            ...(Object.fromEntries(Object.entries(a).filter(([key]) => 
              !['id', '_id', 'avatar', 'languages', 'cvUrl', 'idDocumentUrl'].includes(key)
            )) as any),
            // Override with formatted/transformed values
            _id: a._id?.toString() || a._id || '',
            id: a._id?.toString() || a.id || '',
            name: a.name || '',
            email: a.email || '',
            phone: a.phone || '',
            roleApplied: a.roleApplied || '',
            experience: a.experience || '',
            location: a.location || 'Doha',
            status: a.status || 'Pending',
            appliedDate: appliedDate,
            avatar,
            quizScore: typeof a.quizScore === 'number' ? a.quizScore : (a.quizScore ? parseInt(a.quizScore) : 0),
            quizDetails: Array.isArray(a.quizDetails) ? a.quizDetails : [],
            nationality: a.nationality || '',
            dob: dob,
            gender: a.gender || '',
            height: a.height || '',
            weight: a.weight || '',
            shirtSize: a.shirtSize || '',
            qidNumber: a.qidNumber || '',
            staffId: a.staffId ? (a.staffId.toString ? a.staffId.toString() : a.staffId) : null,
            languages,
            cvUrl: (a.cvUrl && a.cvUrl !== 'null' && a.cvUrl !== 'undefined' && a.cvUrl !== '#' && a.cvUrl !== '') ? a.cvUrl : '',
            idDocumentUrl: (a.idDocumentUrl && a.idDocumentUrl !== 'null' && a.idDocumentUrl !== 'undefined' && a.idDocumentUrl !== '#' && a.idDocumentUrl !== '') ? a.idDocumentUrl : '',
          };
        }) : [],
      };
    } catch (error: any) {
      console.error('Error in applications.list:', error);
      console.error('Error response:', error?.response);
      throw error;
    }
  },
  
  // Get current staff member's applications
  getMyApplications: async (params?: { page?: number; limit?: number; status?: string }) => {
    try {
      console.log('Fetching my applications with params:', params);
      const response = await api.get('/applications/me', { params });
      console.log('My applications API raw response:', response);
      console.log('My applications response data:', response.data);
      
      if (!response || !response.data) {
        console.error('No response or data in response');
        return { data: [], pagination: {} };
      }
      
      // Handle case where data might be directly in response.data or response.data.data
      const applicationsData = response.data.data || response.data || [];
      
      console.log('My applications data to transform:', applicationsData);
      
      return {
        ...response.data,
        data: Array.isArray(applicationsData) ? applicationsData.map((a: any) => {
          console.log('Transforming application:', {
            id: a._id || a.id,
            eventId: a.eventId,
            eventIdObject: a.eventIdObject,
            hasEventId: !!a.eventId,
            hasEventIdObject: !!a.eventIdObject,
          });
          
          // Same transformation as list method
          let languages = [];
          if (Array.isArray(a.languages)) {
            languages = a.languages;
          } else if (typeof a.languages === 'string') {
            languages = a.languages.split(',').map((l: string) => l.trim()).filter((l: string) => l);
          }
          
          const avatar = (a.avatar && a.avatar !== 'null' && a.avatar !== 'undefined' && a.avatar !== '#' && a.avatar !== '') 
            ? a.avatar 
            : ((a.imageUrl && a.imageUrl !== 'null' && a.imageUrl !== 'undefined' && a.imageUrl !== '#' && a.imageUrl !== '')
              ? a.imageUrl
              : `https://i.pravatar.cc/150?u=${encodeURIComponent(a.name || 'user')}`);
          
          let appliedDate = new Date().toISOString().split('T')[0];
          if (a.appliedDate) {
            try {
              if (typeof a.appliedDate === 'string') {
                if (a.appliedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  appliedDate = a.appliedDate;
                } else if (a.appliedDate.includes('T')) {
                  appliedDate = a.appliedDate.split('T')[0];
                } else {
                  const dateObj = new Date(a.appliedDate);
                  if (!isNaN(dateObj.getTime())) {
                    appliedDate = dateObj.toISOString().split('T')[0];
                  }
                }
              } else {
                const dateObj = new Date(a.appliedDate);
                if (!isNaN(dateObj.getTime())) {
                  appliedDate = dateObj.toISOString().split('T')[0];
                }
              }
            } catch (e) {
              console.warn('Error parsing appliedDate:', e);
            }
          }
          
          let dob = '';
          if (a.dob) {
            try {
              if (typeof a.dob === 'string') {
                if (a.dob.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  dob = a.dob;
                } else {
                  const dateObj = new Date(a.dob);
                  if (!isNaN(dateObj.getTime())) {
                    dob = dateObj.toISOString().split('T')[0];
                  }
                }
              } else {
                const dateObj = new Date(a.dob);
                if (!isNaN(dateObj.getTime())) {
                  dob = dateObj.toISOString().split('T')[0];
                }
              }
            } catch (e) {
              console.warn('Error parsing dob:', e);
            }
          }
          
          return {
            id: a._id?.toString() || a.id || '',
            name: a.name || '',
            email: a.email || '',
            phone: a.phone || '',
            roleApplied: a.roleApplied || '',
            experience: a.experience || '',
            location: a.location || 'Doha',
            status: a.status || 'Pending',
            appliedDate: appliedDate,
            avatar: avatar,
            quizScore: typeof a.quizScore === 'number' ? a.quizScore : (a.quizScore ? parseInt(a.quizScore) : 0),
            quizDetails: Array.isArray(a.quizDetails) ? a.quizDetails : [],
            nationality: a.nationality || '',
            dob: dob,
            gender: a.gender || '',
            height: a.height || '',
            weight: a.weight || '',
            shirtSize: a.shirtSize || '',
            qidNumber: a.qidNumber || '',
            languages: languages,
            staffId: a.staffId ? (a.staffId.toString ? a.staffId.toString() : a.staffId) : null,
            cvUrl: (a.cvUrl && a.cvUrl !== 'null' && a.cvUrl !== 'undefined' && a.cvUrl !== '#' && a.cvUrl !== '') ? a.cvUrl : '',
            idDocumentUrl: (a.idDocumentUrl && a.idDocumentUrl !== 'null' && a.idDocumentUrl !== 'undefined' && a.idDocumentUrl !== '#' && a.idDocumentUrl !== '') ? a.idDocumentUrl : '',
            interviewDate: a.interviewDate ? (typeof a.interviewDate === 'string' ? a.interviewDate : new Date(a.interviewDate).toISOString().split('T')[0]) : undefined,
            interviewTime: a.interviewTime || undefined,
            interviewLocation: a.interviewLocation || undefined,
            interviewer: a.interviewer || undefined,
            meetingLink: a.meetingLink || undefined,
            interviewNotes: a.interviewNotes || undefined,
            interviewType: a.interviewType || undefined,
            eventId: a.eventId || undefined,
            _id: a._id?.toString() || a._id || '',
          };
        }) : [],
      };
    } catch (error: any) {
      console.error('Error in applications.getMyApplications:', error);
      console.error('Error response:', error?.response);
      throw error;
    }
  },
  
  get: async (id: string) => {
    const response = await api.get(`/applications/${id}`);
    return response.data;
  },
  
  create: async (data: Partial<JobApplication>) => {
    try {
      const response = await api.post('/applications', data);
      // Ensure we return the response data structure
      if (response.data) {
        return response.data;
      }
      // If response.data is undefined, return the response itself
      return response;
    } catch (error: any) {
      console.error('Error creating application:', error);
      // Re-throw with more context
      throw error;
    }
  },
  
  updateStatus: async (id: string, status: string, interviewData?: any) => {
    const response = await api.put(`/applications/${id}/status`, { status, ...interviewData });
    return response.data;
  },
};

// Shifts
export const shifts = {
  list: async (params?: { page?: number; limit?: number; eventId?: string; staffId?: string; status?: string }) => {
    const response = await api.get('/shifts', { params });
    return {
      ...response.data,
      data: response.data.data?.map(transformShift) || [],
    };
  },
  
  get: async (id: string) => {
    const response = await api.get(`/shifts/${id}`);
    return {
      ...response.data,
      data: transformShift(response.data.data),
    };
  },
  
  create: async (data: Partial<Shift>) => {
    // Handle date/time combination safely
    let startTimeISO: string;
    let endTimeISO: string;
    
    if (data.date && data.startTime && data.endTime) {
      // Check if startTime/endTime are already ISO strings
      if (typeof data.startTime === 'string' && data.startTime.includes('T')) {
        startTimeISO = data.startTime;
      } else {
        // Combine date and time string (format: "YYYY-MM-DD" + "HH:mm")
        const startDateTime = new Date(`${data.date}T${data.startTime}`);
        if (isNaN(startDateTime.getTime())) {
          throw new Error(`Invalid start time: ${data.date}T${data.startTime}`);
        }
        startTimeISO = startDateTime.toISOString();
      }
      
      if (typeof data.endTime === 'string' && data.endTime.includes('T')) {
        endTimeISO = data.endTime;
      } else {
        const endDateTime = new Date(`${data.date}T${data.endTime}`);
        if (isNaN(endDateTime.getTime())) {
          throw new Error(`Invalid end time: ${data.date}T${data.endTime}`);
        }
        endTimeISO = endDateTime.toISOString();
      }
    } else {
      // Fallback to current time if date/time not provided
      const now = new Date();
      startTimeISO = now.toISOString();
      endTimeISO = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours later
    }
    
    const backendData: any = {
      eventId: data.eventId,
      staffId: (data as any).staffId, // staffId may be provided but not in Shift type
      startTime: startTimeISO,
      endTime: endTimeISO,
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      wage: data.wage || 0,
      role: data.role,
      instructions: data.instructions,
      contactPerson: data.contactPerson,
      contactPhone: data.contactPhone,
      attire: data.attire,
    };
    
    const response = await api.post('/shifts', backendData);
    return {
      ...response.data,
      data: transformShift(response.data.data),
    };
  },
  
  checkIn: async (id: string) => {
    const response = await api.post(`/shifts/${id}/checkin`);
    return {
      ...response.data,
      data: transformShift(response.data.data),
    };
  },
  
  checkOut: async (id: string) => {
    const response = await api.post(`/shifts/${id}/checkout`);
    return {
      ...response.data,
      data: transformShift(response.data.data),
    };
  },
};

// Payroll
// Transform backend payroll to frontend format
const transformPayroll = (p: any): any => {
  if (!p) return null;
  
  // Extract event details
  const event = p.eventId || {};
  const eventLocation = typeof event.location === 'object' 
    ? (event.location?.address || event.location?.city || '')
    : (event.location || '');
  
  // Extract shift details if available
  const shift = p.shiftId || {};
  
  // Format dates
  const shiftDate = p.shiftDate 
    ? (typeof p.shiftDate === 'string' 
        ? (p.shiftDate.includes('T') ? p.shiftDate.split('T')[0] : p.shiftDate)
        : new Date(p.shiftDate).toISOString().split('T')[0])
    : '';
  
  const paymentDate = p.paymentDate 
    ? (typeof p.paymentDate === 'string' 
        ? (p.paymentDate.includes('T') ? p.paymentDate.split('T')[0] : p.paymentDate)
        : new Date(p.paymentDate).toISOString().split('T')[0])
    : undefined;
  
  // Normalize status
  let status = p.status || 'Unpaid';
  if (status === 'Unpaid') status = 'PENDING';
  if (status === 'Processing') status = 'PENDING';
  if (status === 'Paid') status = 'PAID';
  
  // Format event dates/times
  const eventStartDate = event.startAt ? new Date(event.startAt) : null;
  const eventEndDate = event.endAt ? new Date(event.endAt) : null;
  const eventDate = eventStartDate ? eventStartDate.toISOString().split('T')[0] : shiftDate;
  const eventStartTime = eventStartDate ? eventStartDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  const eventEndTime = eventEndDate ? eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
  
  // Format shift times if available
  const shiftStartTime = shift.startTime 
    ? (typeof shift.startTime === 'string' 
        ? new Date(shift.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : shift.startTime)
    : eventStartTime;
  const shiftEndTime = shift.endTime 
    ? (typeof shift.endTime === 'string' 
        ? new Date(shift.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : shift.endTime)
    : eventEndTime;
  
  return {
    id: p._id || p.id || '',
    staffId: p.staffId?._id || p.staffId || '',
    staffName: p.staffName || p.staffId?.name || '',
    eventId: p.eventId?._id || p.eventId || '',
    eventName: p.eventName || p.eventId?.title || event?.title || 'Event',
    eventLocation: eventLocation,
    eventDate: eventDate,
    eventStartTime: eventStartTime,
    eventEndTime: eventEndTime,
    eventDescription: event.description || '',
    eventStatus: event.status || '',
    shiftDate: shiftDate,
    shiftStartTime: shiftStartTime,
    shiftEndTime: shiftEndTime,
    shiftRole: shift.role || '',
    shiftLocation: shift.location || eventLocation,
    hoursWorked: typeof p.hoursWorked === 'number' ? p.hoursWorked : (p.totalHours || 0),
    hourlyRate: typeof p.hourlyRate === 'number' ? p.hourlyRate : (p.rate || 0),
    totalAmount: typeof p.totalAmount === 'number' ? p.totalAmount : (p.amount || p.total || 0),
    status: status,
    paymentDate: paymentDate,
    overtimeHours: p.overtimeHours || 0,
    overtimeRate: p.overtimeRate || 0,
    shiftId: p.shiftId?._id || p.shiftId || '',
    createdAt: p.createdAt ? (typeof p.createdAt === 'string' ? p.createdAt : new Date(p.createdAt).toISOString()) : '',
    updatedAt: p.updatedAt ? (typeof p.updatedAt === 'string' ? p.updatedAt : new Date(p.updatedAt).toISOString()) : '',
  };
};

export const payroll = {
  // Get current staff member's earnings
  getEarnings: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/payroll/me', { params });
    return {
      ...response.data,
      data: response.data.data?.map(transformPayroll).filter((p: any) => p !== null) || [],
    };
  },
  
  list: async (params?: { page?: number; limit?: number; status?: string; staffId?: string; eventId?: string }) => {
    const response = await api.get('/payroll', { params });
    return {
      ...response.data,
      data: response.data.data?.map(transformPayroll).filter((p: any) => p !== null) || [],
    };
  },
  
  get: async (id: string) => {
    const response = await api.get(`/payroll/${id}`);
    return {
      ...response.data,
      data: transformPayroll(response.data.data),
    };
  },
  
  create: async (data: any) => {
    const response = await api.post('/payroll', data);
    return {
      ...response.data,
      data: transformPayroll(response.data.data),
    };
  },
  
  createFromShift: async (shiftId: string) => {
    const response = await api.post(`/payroll/from-shift/${shiftId}`);
    return {
      ...response.data,
      data: transformPayroll(response.data.data),
    };
  },
  
  generateFromEvent: async (eventId: string) => {
    const response = await api.post(`/payroll/generate-from-event/${eventId}`);
    return {
      ...response.data,
      data: response.data.data?.map(transformPayroll).filter((p: any) => p !== null) || [],
    };
  },
  
  generateAll: async () => {
    const response = await api.post('/payroll/generate-all');
    return {
      ...response.data,
      data: response.data.data?.map(transformPayroll).filter((p: any) => p !== null) || [],
    };
  },
  
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/payroll/${id}/status`, { status });
    return {
      ...response.data,
      data: transformPayroll(response.data.data),
    };
  },
};

// Incidents
export const incidents = {
  list: async (params?: { page?: number; limit?: number; status?: string; type?: string; severity?: string; eventId?: string }) => {
    const response = await api.get('/incidents', { params });
    return {
      ...response.data,
      data: response.data.data?.map((i: any) => ({
        id: i._id || i.id,
        type: i.type,
        severity: i.severity,
        description: i.description,
        reportedBy: i.reportedBy?.name || i.reportedBy || '',
        reportedAt: i.reportedAt ? new Date(i.reportedAt).toLocaleString() : new Date().toLocaleString(),
        status: i.status,
        eventId: i.eventId?._id || i.eventId || '',
        location: i.location,
      })) || [],
    };
  },
  
  create: async (data: any) => {
    const response = await api.post('/incidents', data);
    return response.data;
  },
  
  resolve: async (id: string, resolutionNotes: string) => {
    const response = await api.put(`/incidents/${id}/resolve`, { resolutionNotes });
    return response.data;
  },
};

// AI
export const ai = {
  staffingForecast: async (eventType: string, attendees: number, location: string) => {
    const response = await api.post('/ai/staffing-forecast', { eventType, attendees, location });
    return response.data;
  },
  
  adminAssistant: async (query: string, context?: any) => {
    const response = await api.post('/ai/admin-assistant', { query, context });
    return response.data;
  },
  
  matchStaff: async (eventId: string, role?: string) => {
    const response = await api.post('/ai/match-staff', { eventId, role });
    return response.data;
  },
};

// Clients
// Transform backend client to frontend format
const transformClient = (c: any) => {
  if (!c) return null;
  
  return {
    id: c._id || c.id || '',
    companyName: c.companyName || '',
    contactPerson: c.contactPerson || '',
    email: c.email || '',
    phone: c.phone || '',
    status: c.status || 'Active',
    totalEvents: c.totalEvents || 0,
    totalSpent: c.totalSpent || 0,
    imageUrl: c.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.companyName || 'Company')}&background=8A1538&color=fff&size=128`,
    // Additional fields
    address: c.address || '',
    city: c.city || 'Doha',
    country: c.country || 'Qatar',
    taxId: c.taxId || '',
    website: c.website || '',
    industry: c.industry || '',
    companySize: c.companySize || '',
    notes: c.notes || '',
  };
};

export const clients = {
  list: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get('/clients', { 
      params: { ...params, _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    return {
      ...response.data,
      data: response.data.data?.map(transformClient).filter((c: any) => c !== null) || [],
    };
  },
  
  get: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return {
      ...response.data,
      data: transformClient(response.data.data),
    };
  },
  
  create: async (data: any) => {
    const response = await api.post('/clients', data);
    return {
      ...response.data,
      data: transformClient(response.data.data),
    };
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/clients/${id}`, data);
    return {
      ...response.data,
      data: transformClient(response.data.data),
    };
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};

// Upload API with progress tracking
export const upload = {
  single: async (
    file: File,
    options?: {
      onUploadProgress?: (progress: number) => void;
      compress?: boolean;
    }
  ): Promise<{ success: boolean; data: { url: string; filename: string; path: string } }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && options?.onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onUploadProgress(progress);
        }
      },
    });
    
    return response.data;
  },
  
  multiple: async (
    files: File[],
    options?: {
      onUploadProgress?: (progress: number) => void;
    }
  ): Promise<{ success: boolean; data: Array<{ url: string; filename: string; path: string }> }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && options?.onUploadProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onUploadProgress(progress);
        }
      },
    });
    
    return response.data;
  },
  
  // Enhanced upload with automatic compression
  upload: async (
    file: File,
    options?: {
      onUploadProgress?: (progress: number) => void;
      compress?: boolean;
    }
  ): Promise<{ success: boolean; data: { url: string; filename: string; path: string } }> => {
    return upload.single(file, options);
  },
};

// Transform backend supervisor to frontend format
const transformSupervisor = (s: any) => {
  if (!s) return null;
  
  return {
    id: s._id || s.id || '',
    name: s.name || '',
    email: s.email || '',
    phone: s.phone || '',
    status: s.status || 'Active',
    assignedEvents: s.assignedEvents || 0,
    rating: s.rating || 5,
    imageUrl: s.imageUrl || 'https://i.pravatar.cc/150',
    // Additional fields
    location: s.location || 'Doha',
    department: s.department || '',
    specialization: s.specialization || '',
    yearsOfExperience: s.yearsOfExperience || 0,
    certifications: Array.isArray(s.certifications) ? s.certifications : [],
    languages: Array.isArray(s.languages) ? s.languages : [],
    notes: s.notes || '',
  };
};

// Supervisors
export const supervisors = {
  list: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get('/supervisors', { 
      params: { ...params, _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    return {
      ...response.data,
      data: response.data.data?.map(transformSupervisor).filter((s: any) => s !== null) || [],
    };
  },
  
  get: async (id: string) => {
    const response = await api.get(`/supervisors/${id}`);
    return {
      ...response.data,
      data: transformSupervisor(response.data.data),
    };
  },
  
  create: async (data: any) => {
    const response = await api.post('/supervisors', data);
    return {
      ...response.data,
      data: transformSupervisor(response.data.data),
    };
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/supervisors/${id}`, data);
    return {
      ...response.data,
      data: {
        id: response.data.data._id || response.data.data.id,
        ...response.data.data,
      },
    };
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/supervisors/${id}`);
    return response.data;
  },
};

// Audit Logs
export const logs = {
  list: async (params?: { page?: number; limit?: number; user?: string; action?: string; resourceType?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/logs', { params: { ...params, _t: Date.now() } });
    return {
      ...response.data,
      data: response.data.data?.map((l: any) => ({
        id: l._id || l.id,
        user: l.user,
        role: l.role,
        action: l.action,
        details: l.details,
        timestamp: l.timestamp || (l.createdAt ? new Date(l.createdAt).toLocaleString() : new Date().toLocaleString()),
        resourceType: l.resourceType,
        resourceId: l.resourceId,
      })) || [],
    };
  },
  
  create: async (data: any) => {
    const response = await api.post('/logs', data);
    return response.data;
  },
};

// Notifications API
export const notifications = {
  list: async (params?: { page?: number; limit?: number; filter?: string; category?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.filter) queryParams.append('filter', params.filter);
    if (params?.category) queryParams.append('category', params.category);
    
    const response = await api.get(`/notifications?${queryParams.toString()}`);
    return response.data;
  },
  
  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
  
  clearAll: async () => {
    const response = await api.delete('/notifications/clear/all');
    return response.data;
  },
  
  sendEmail: async (to: string, subject: string, template: string, data: Record<string, any>) => {
    const response = await api.post('/notifications/email', {
      to,
      subject,
      template,
      data,
    });
    return response.data;
  },
};

// Transform backend booking to frontend format
const transformBooking = (b: any) => {
  if (!b) return null;
  
  return {
    id: b._id || b.id || '',
    eventType: b.eventType || '',
    date: b.date ? (typeof b.date === 'string' ? b.date : new Date(b.date).toISOString().split('T')[0]) : '',
    time: b.time || '',
    duration: b.duration || '',
    location: b.location || '',
    budget: b.budget || '',
    staff: b.staff || { servers: 0, hosts: 0, other: 0 },
    contact: b.contact || { name: '', company: '', phone: '', email: '' },
    eventDetails: b.eventDetails || { venue: '', guests: '', dressCode: '', special: '' },
    status: b.status || 'Pending',
    submittedDate: b.submittedDate ? (typeof b.submittedDate === 'string' ? b.submittedDate : new Date(b.submittedDate).toISOString()) : new Date().toISOString(),
    convertedToEventId: b.convertedToEventId || null,
    createdAt: b.createdAt ? (typeof b.createdAt === 'string' ? b.createdAt : new Date(b.createdAt).toISOString()) : new Date().toISOString(),
    updatedAt: b.updatedAt ? (typeof b.updatedAt === 'string' ? b.updatedAt : new Date(b.updatedAt).toISOString()) : new Date().toISOString(),
  };
};

// Bookings API
export const bookings = {
  list: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await api.get('/bookings', { 
      params: { ...params, _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    return {
      ...response.data,
      data: response.data.data?.map(transformBooking).filter((b: any) => b !== null) || [],
    };
  },
  
  get: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return {
      ...response.data,
      data: transformBooking(response.data.data),
    };
  },
  
  create: async (data: any) => {
    const response = await api.post('/bookings', data);
    return {
      ...response.data,
      data: transformBooking(response.data.data),
    };
  },
  
  updateStatus: async (id: string, status: string, eventId?: string) => {
    const response = await api.put(`/bookings/${id}/status`, { status, eventId });
    return {
      ...response.data,
      data: transformBooking(response.data.data),
    };
  },
};

export default {
  auth,
  events,
  staff,
  applications,
  bookings,
  shifts,
  payroll,
  incidents,
  ai,
  clients,
  supervisors,
  logs,
  notifications,
};

