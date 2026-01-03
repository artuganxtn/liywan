import JobApplication from '../models/JobApplication.js';
import User from '../models/User.js';
import StaffProfile from '../models/StaffProfile.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/emailService.js';

// Note: Service functions don't use asyncHandler - only route handlers do

export const getAllApplications = async (query = {}) => {
  const {
    status,
    roleApplied,
    eventId,
    staffId,
    email,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (roleApplied) {
    filter.roleApplied = roleApplied;
  }

  if (eventId) {
    filter.eventId = eventId;
  }

  if (staffId) {
    filter.staffId = staffId;
  }

  if (email) {
    filter.email = email;
  }

  const skip = (page - 1) * limit;

  const applications = await JobApplication.find(filter)
    .populate('eventId', 'title startAt endAt location description status imageUrl requiredRoles')
    .populate('staffId', 'name email phone imageUrl role location')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await JobApplication.countDocuments(filter);

  // Convert _id to string for each application and ensure all fields are present
  const formattedApplications = applications.map(app => {
    // Ensure languages is always an array
    let languages = [];
    if (Array.isArray(app.languages)) {
      languages = app.languages;
    } else if (typeof app.languages === 'string' && app.languages.trim()) {
      languages = app.languages.split(',').map(l => l.trim()).filter(l => l);
    }
    
    // Ensure avatar has proper fallback - use staff profile imageUrl if available
    let avatar = app.avatar || app.imageUrl;
    
    // If no avatar in application, try to get from populated staff profile
    if (!avatar || avatar === '' || avatar === 'null' || avatar === 'undefined' || avatar === '#') {
      if (app.staffId && typeof app.staffId === 'object' && app.staffId.imageUrl) {
        avatar = app.staffId.imageUrl;
      }
    }
    
    // Final fallback to random avatar only if nothing else is available
    if (!avatar || avatar === '' || avatar === 'null' || avatar === 'undefined' || avatar === '#') {
      avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(app.name || 'user')}`;
    }
    
    // Handle eventId - it might be populated as an object or just an ObjectId
    let eventId = null;
    let eventIdObject = null;
    
    
    if (app.eventId) {
      if (typeof app.eventId === 'object' && app.eventId._id) {
        // Populated event object - extract the ID and keep the full object
        eventId = app.eventId._id.toString();
        eventIdObject = {
          _id: app.eventId._id.toString(),
          id: app.eventId._id.toString(),
          title: app.eventId.title,
          startAt: app.eventId.startAt,
          endAt: app.eventId.endAt,
          location: app.eventId.location,
          description: app.eventId.description,
          status: app.eventId.status,
          imageUrl: app.eventId.imageUrl,
          requiredRoles: app.eventId.requiredRoles,
        };
      } else if (typeof app.eventId === 'object' && app.eventId.id) {
        eventId = app.eventId.id.toString();
      } else {
        // Just an ObjectId
        eventId = app.eventId.toString();
      }
    } else {
    }
    
    // Handle staffId similarly
    let staffId = null;
    if (app.staffId) {
      if (typeof app.staffId === 'object' && app.staffId._id) {
        staffId = app.staffId._id.toString();
      } else if (typeof app.staffId === 'object' && app.staffId.id) {
        staffId = app.staffId.id.toString();
      } else {
        staffId = app.staffId.toString();
      }
    }
    
    return {
      ...app,
      _id: app._id.toString(),
      id: app._id.toString(),
      avatar: avatar,
      languages: languages,
      // Preserve eventId - include both the ID string and the populated object if available
      eventId: eventId || (app.eventId ? app.eventId.toString() : null),
      eventIdObject: eventIdObject || (app.eventId && typeof app.eventId === 'object' && app.eventId.title ? {
        _id: app.eventId._id?.toString() || app.eventId.id?.toString(),
        id: app.eventId._id?.toString() || app.eventId.id?.toString(),
        title: app.eventId.title,
        startAt: app.eventId.startAt,
        endAt: app.eventId.endAt,
        location: app.eventId.location,
        description: app.eventId.description,
        status: app.eventId.status,
        imageUrl: app.eventId.imageUrl,
        requiredRoles: app.eventId.requiredRoles,
      } : null),
      staffId: staffId || app.staffId?.toString() || null,
      // Include populated staff profile data for frontend use
      staffIdObject: app.staffId && typeof app.staffId === 'object' ? {
        _id: app.staffId._id?.toString() || app.staffId.id?.toString(),
        id: app.staffId._id?.toString() || app.staffId.id?.toString(),
        name: app.staffId.name,
        email: app.staffId.email,
        phone: app.staffId.phone,
        imageUrl: app.staffId.imageUrl,
        role: app.staffId.role,
        location: app.staffId.location,
      } : null,
      // Ensure all fields have defaults
      name: app.name || '',
      email: app.email || '',
      phone: app.phone || '',
      roleApplied: app.roleApplied || '',
      experience: app.experience || '',
      location: app.location || 'Doha',
      status: app.status || 'Pending',
      quizScore: app.quizScore || 0,
      quizDetails: Array.isArray(app.quizDetails) ? app.quizDetails : [],
      nationality: app.nationality || '',
      gender: app.gender || '',
      height: app.height || '',
      weight: app.weight || '',
      shirtSize: app.shirtSize || '',
      qidNumber: app.qidNumber || '',
      cvUrl: app.cvUrl || '',
      idDocumentUrl: app.idDocumentUrl || '',
    };
  });

  return {
    data: formattedApplications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getApplicationById = async (id) => {
  const application = await JobApplication.findById(id)
    .populate('eventId', 'title startAt endAt location description status imageUrl requiredRoles')
    .populate('staffId', 'name email phone imageUrl role location')
    .lean();
    
  if (!application) {
    throw new Error('Application not found');
  }
  
  // Format similar to getAllApplications
  let eventId = null;
  if (application.eventId) {
    if (typeof application.eventId === 'object' && application.eventId._id) {
      eventId = application.eventId._id.toString();
    } else if (typeof application.eventId === 'object' && application.eventId.id) {
      eventId = application.eventId.id.toString();
    } else {
      eventId = application.eventId.toString();
    }
  }
  
  // Ensure avatar has proper fallback - use staff profile imageUrl if available
  let avatar = application.avatar || application.imageUrl;
  
  // If no avatar in application, try to get from populated staff profile
  if (!avatar || avatar === '' || avatar === 'null' || avatar === 'undefined' || avatar === '#') {
    if (application.staffId && typeof application.staffId === 'object' && application.staffId.imageUrl) {
      avatar = application.staffId.imageUrl;
    }
  }
  
  // Final fallback to random avatar only if nothing else is available
  if (!avatar || avatar === '' || avatar === 'null' || avatar === 'undefined' || avatar === '#') {
    avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(application.name || 'user')}`;
  }
  
  // Handle staffId
  let staffId = null;
  if (application.staffId) {
    if (typeof application.staffId === 'object' && application.staffId._id) {
      staffId = application.staffId._id.toString();
    } else if (typeof application.staffId === 'object' && application.staffId.id) {
      staffId = application.staffId.id.toString();
    } else {
      staffId = application.staffId.toString();
    }
  }
  
  return {
    ...application,
    _id: application._id.toString(),
    id: application._id.toString(),
    avatar: avatar,
    eventId: eventId || application.eventId?.toString() || null,
    eventIdObject: application.eventId && typeof application.eventId === 'object' ? {
      _id: application.eventId._id?.toString() || application.eventId.id?.toString(),
      id: application.eventId._id?.toString() || application.eventId.id?.toString(),
      title: application.eventId.title,
      startAt: application.eventId.startAt,
      endAt: application.eventId.endAt,
      location: application.eventId.location,
      description: application.eventId.description,
      status: application.eventId.status,
      imageUrl: application.eventId.imageUrl,
      requiredRoles: application.eventId.requiredRoles,
    } : null,
    staffId: staffId || application.staffId?.toString() || null,
    // Include populated staff profile data for frontend use
    staffIdObject: application.staffId && typeof application.staffId === 'object' ? {
      _id: application.staffId._id?.toString() || application.staffId.id?.toString(),
      id: application.staffId._id?.toString() || application.staffId.id?.toString(),
      name: application.staffId.name,
      email: application.staffId.email,
      phone: application.staffId.phone,
      imageUrl: application.staffId.imageUrl,
      role: application.staffId.role,
      location: application.staffId.location,
    } : null,
  };
};

export const createApplication = async (applicationData) => {
  console.log('[createApplication] Received applicationData:', {
    name: applicationData.name,
    email: applicationData.email,
    eventId: applicationData.eventId,
    eventIdType: typeof applicationData.eventId,
    staffId: applicationData.staffId,
    allKeys: Object.keys(applicationData),
  });
  
  // Check for duplicate application if eventId and staffId are provided
  if (applicationData.eventId && applicationData.staffId) {
    const existingApplication = await JobApplication.findOne({
      eventId: applicationData.eventId,
      staffId: applicationData.staffId,
      status: { $in: ['Pending', 'Interview', 'Approved'] } // Only check active applications
    });
    
    if (existingApplication) {
      throw new Error('You have already applied for this event. Please wait for the admin to review your application.');
    }
  }
  
  // Also check by email if staffId not provided but eventId is
  if (applicationData.eventId && !applicationData.staffId && applicationData.email) {
    const existingApplication = await JobApplication.findOne({
      eventId: applicationData.eventId,
      email: applicationData.email,
      status: { $in: ['Pending', 'Interview', 'Approved'] }
    });
    
    if (existingApplication) {
      throw new Error('You have already applied for this event. Please wait for the admin to review your application.');
    }
  }
  
  // Create the job application
  const application = await JobApplication.create(applicationData);
  
  console.log('[createApplication] Created application:', {
    _id: application._id,
    email: application.email,
    name: application.name,
  });

  // For event applications (with eventId), only create account/profile if they don't exist
  // For general applications (no eventId), always create account/profile
  const isEventApplication = !!applicationData.eventId;
  
  // Automatically create user account and staff profile for the applicant
  // BUT: For event applications, only create if user doesn't exist (staff already registered)
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: applicationData.email });
    
    if (!existingUser) {
      // Use the password from application, or fallback to temporary
      const userPassword = applicationData.password && applicationData.password.trim() !== '' 
        ? applicationData.password 
        : 'TempPassword123!';
      
      // Create user account
      const user = await User.create({
        name: applicationData.name,
        email: applicationData.email,
        password: userPassword, // This will be hashed automatically by User model pre-save hook
        role: 'STAFF',
        avatar: applicationData.avatar || `https://i.pravatar.cc/150?u=${applicationData.name}`,
        isActive: true, // Active by default, admin can deactivate if needed
      });

      // Create staff profile linked to the user
      const staffProfile = await StaffProfile.create({
        userId: user._id,
        name: applicationData.name,
        email: applicationData.email,
        phone: applicationData.phone || '',
        role: applicationData.roleApplied || 'General Staff',
        status: 'Available', // New applicants start as available
        location: applicationData.location || 'Doha',
        imageUrl: applicationData.avatar || `https://i.pravatar.cc/150?u=${applicationData.name}`,
        nationality: applicationData.nationality || '',
        dob: applicationData.dob ? new Date(applicationData.dob) : undefined,
        gender: applicationData.gender || '',
        height: applicationData.height || '',
        weight: applicationData.weight || '',
        shirtSize: applicationData.shirtSize || '',
        qidNumber: applicationData.qidNumber || '',
        languages: applicationData.languages || [],
        skills: [], // Will be populated based on role
        documents: [], // Documents will be uploaded later
        certifications: applicationData.certifications || [],
        feedback: [],
        rating: 5, // Default starting rating
        completedShifts: 0,
        onTimeRate: 100,
        xpPoints: 0,
        level: 'Bronze',
        totalEarnings: 0,
        joinedDate: new Date(),
      });

      // Link the application to the staff profile
      application.staffId = staffProfile._id;
      await application.save();

      // Send welcome email to applicant with login credentials
      try {
        await sendEmail(
          applicationData.email,
          'Application Received - Welcome to LIYWAN!',
          'application_submitted',
          {
            name: applicationData.name,
            email: applicationData.email,
            password: userPassword, // Include password in email
            roleApplied: applicationData.roleApplied,
            experience: applicationData.experience,
            quizScore: applicationData.quizScore,
            status: application.status,
            loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          }
        );
      } catch (emailError) {
        // Don't fail application creation if email fails
      }
    } else {
      // User already exists - link to existing staff profile
      const existingStaff = await StaffProfile.findOne({ userId: existingUser._id });
      if (existingStaff) {
        application.staffId = existingStaff._id;
        await application.save();
        
        // For event applications, update staff profile with latest info if needed
        if (isEventApplication) {
          // Update staff profile with application data if fields are missing
          let updated = false;
          if (applicationData.avatar && !existingStaff.imageUrl) {
            existingStaff.imageUrl = applicationData.avatar;
            updated = true;
          }
          if (applicationData.phone && !existingStaff.phone) {
            existingStaff.phone = applicationData.phone;
            updated = true;
          }
          if (applicationData.location && !existingStaff.location) {
            existingStaff.location = applicationData.location;
            updated = true;
          }
          if (updated) {
            await existingStaff.save();
          }
        }
      } else if (!isEventApplication) {
        // For general applications, create staff profile if it doesn't exist
        const newStaffProfile = await StaffProfile.create({
          userId: existingUser._id,
          name: applicationData.name,
          email: applicationData.email,
          phone: applicationData.phone || '',
          role: applicationData.roleApplied || 'General Staff',
          status: 'Available',
          location: applicationData.location || 'Doha',
          imageUrl: applicationData.avatar || existingUser.avatar || `https://i.pravatar.cc/150?u=${applicationData.name}`,
          nationality: applicationData.nationality || '',
          dob: applicationData.dob ? new Date(applicationData.dob) : undefined,
          gender: applicationData.gender || '',
          height: applicationData.height || '',
          weight: applicationData.weight || '',
          shirtSize: applicationData.shirtSize || '',
          qidNumber: applicationData.qidNumber || '',
          languages: applicationData.languages || [],
          skills: [],
          documents: [],
          certifications: applicationData.certifications || [],
          feedback: [],
          rating: 5,
          completedShifts: 0,
          onTimeRate: 100,
          xpPoints: 0,
          level: 'Bronze',
          totalEarnings: 0,
          joinedDate: new Date(),
        });
        application.staffId = newStaffProfile._id;
        await application.save();
      }
    }
  } catch (error) {
    // Don't fail the application creation
    // The application is still created, admin can manually create the account if needed
    console.error('Error in createApplication user/staff creation:', error);
  }

  return application;
};

export const updateApplicationStatus = async (id, status, interviewData = {}) => {
  const updateData = { status, ...interviewData };
  const application = await JobApplication.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Handle approval - ensure staff profile is active and properly set up
  if (status === 'Approved') {
    try {
      // Find or create user account
      let user = await User.findOne({ email: application.email });
      
      if (!user) {
        // Create user account if it doesn't exist
        user = await User.create({
          name: application.name,
          email: application.email,
          password: 'TempPassword123!', // Admin should set proper password
          role: 'STAFF',
          avatar: application.avatar || `https://i.pravatar.cc/150?u=${application.name}`,
          isActive: true,
        });
      } else {
        // Ensure user is active
        user.isActive = true;
        await user.save();
      }

      // Find or create staff profile
      let staffProfile = await StaffProfile.findOne({ userId: user._id });
      
      if (!staffProfile) {
        // Create staff profile if it doesn't exist
        staffProfile = await StaffProfile.create({
          userId: user._id,
          name: application.name,
          email: application.email,
          phone: application.phone || '',
          role: application.roleApplied || 'General Staff',
          status: 'Available', // Approved staff are available
          location: application.location || 'Doha',
          imageUrl: application.avatar || `https://i.pravatar.cc/150?u=${application.name}`,
          nationality: application.nationality || '',
          dob: application.dob ? new Date(application.dob) : undefined,
          gender: application.gender || '',
          height: application.height || '',
          weight: application.weight || '',
          shirtSize: application.shirtSize || '',
          qidNumber: application.qidNumber || '',
          languages: application.languages || [],
          skills: [],
          documents: [],
          certifications: [],
          feedback: [],
          rating: 5,
          completedShifts: 0,
          onTimeRate: 100,
          xpPoints: 0,
          level: 'Bronze',
          totalEarnings: 0,
          joinedDate: new Date(),
        });
      } else {
        // Update existing staff profile with application data
        staffProfile.status = 'Available'; // Ensure they're available
        staffProfile.role = application.roleApplied || staffProfile.role;
        if (application.avatar && !staffProfile.imageUrl) {
          staffProfile.imageUrl = application.avatar;
        }
        if (application.nationality && !staffProfile.nationality) {
          staffProfile.nationality = application.nationality;
        }
        if (application.dob && !staffProfile.dob) {
          staffProfile.dob = new Date(application.dob);
        }
        if (application.gender && !staffProfile.gender) {
          staffProfile.gender = application.gender;
        }
        if (application.height && !staffProfile.height) {
          staffProfile.height = application.height;
        }
        if (application.weight && !staffProfile.weight) {
          staffProfile.weight = application.weight;
        }
        if (application.shirtSize && !staffProfile.shirtSize) {
          staffProfile.shirtSize = application.shirtSize;
        }
        if (application.qidNumber && !staffProfile.qidNumber) {
          staffProfile.qidNumber = application.qidNumber;
        }
        if (application.languages && application.languages.length > 0) {
          staffProfile.languages = application.languages;
        }
        await staffProfile.save();
      }

      // Link application to staff profile
      application.staffId = staffProfile._id;
      await application.save();

    } catch (error) {
      // Don't fail the approval if staff profile update fails
    }
  }

  // Send email notification based on status
  try {
    if (status === 'Approved') {
      await sendEmail(
        application.email,
        'Application Approved - LIYWAN',
        'application_approved',
        {
          name: application.name,
          roleApplied: application.roleApplied,
        }
      );
    } else if (status === 'Rejected') {
      await sendEmail(
        application.email,
        'Application Update - LIYWAN',
        'application_rejected',
        {
          name: application.name,
          roleApplied: application.roleApplied,
        }
      );
    } else if (status === 'Interview') {
      // Format interview date for email
      let formattedDate = '';
      if (interviewData.interviewDate) {
        try {
          const date = new Date(interviewData.interviewDate);
          formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        } catch (e) {
          formattedDate = interviewData.interviewDate;
        }
      }
      
      await sendEmail(
        application.email,
        'Interview Scheduled - LIYWAN',
        'interview_scheduled',
        {
          name: application.name,
          roleApplied: application.roleApplied,
          interviewDate: formattedDate || interviewData.interviewDate || 'TBD',
          interviewTime: interviewData.interviewTime || 'TBD',
          interviewLocation: interviewData.interviewLocation || 'TBD',
          interviewer: interviewData.interviewer || 'HR Team',
          interviewNotes: interviewData.interviewNotes || '',
          meetingLink: interviewData.meetingLink || '',
          interviewType: interviewData.interviewType || 'local',
        }
      );
    }
      } catch (emailError) {
    // Don't fail status update if email fails
  }

  return application;
};

