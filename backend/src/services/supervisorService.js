import SupervisorProfile from '../models/SupervisorProfile.js';
import User from '../models/User.js';

export const getAllSupervisors = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { location: { $regex: query.search, $options: 'i' } },
      { department: { $regex: query.search, $options: 'i' } },
      { specialization: { $regex: query.search, $options: 'i' } },
    ];
  }
  
  if (query.status && query.status !== 'All') {
    filter.status = query.status;
  }

  const supervisors = await SupervisorProfile.find(filter)
    .populate('userId', 'email isActive')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await SupervisorProfile.countDocuments(filter);

  // Format supervisors data
  const formattedSupervisors = (supervisors || []).map((supervisor) => {
    const supervisorObj = JSON.parse(JSON.stringify(supervisor));
    
    // Convert _id to string and add id field for frontend compatibility
    if (supervisorObj._id) {
      supervisorObj.id = supervisorObj._id.toString();
      supervisorObj._id = supervisorObj._id.toString();
    }
    
    // Ensure default values
    if (!supervisorObj.imageUrl) {
      supervisorObj.imageUrl = 'https://i.pravatar.cc/150';
    }
    if (typeof supervisorObj.assignedEvents !== 'number') supervisorObj.assignedEvents = 0;
    if (typeof supervisorObj.rating !== 'number') supervisorObj.rating = 5;
    if (!supervisorObj.location) supervisorObj.location = 'Doha';
    
    // Ensure additional fields exist
    if (supervisorObj.department === undefined) supervisorObj.department = '';
    if (supervisorObj.specialization === undefined) supervisorObj.specialization = '';
    if (typeof supervisorObj.yearsOfExperience !== 'number') supervisorObj.yearsOfExperience = 0;
    if (!Array.isArray(supervisorObj.certifications)) supervisorObj.certifications = [];
    if (!Array.isArray(supervisorObj.languages)) supervisorObj.languages = [];
    if (supervisorObj.notes === undefined) supervisorObj.notes = '';
    
    return supervisorObj;
  });

  return {
    data: formattedSupervisors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getSupervisorById = async (id) => {
  const supervisor = await SupervisorProfile.findById(id)
    .populate('userId', 'email isActive')
    .lean();

  if (!supervisor) {
    throw new Error('Supervisor not found');
  }

  const formattedSupervisor = JSON.parse(JSON.stringify(supervisor));
  if (formattedSupervisor._id) {
    formattedSupervisor._id = formattedSupervisor._id.toString();
  }
  
  return formattedSupervisor;
};

export const createSupervisor = async (supervisorData) => {
  // Validate required fields
  if (!supervisorData.name || !supervisorData.email) {
    throw new Error('Name and email are required');
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email: supervisorData.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create user account first
  const user = await User.create({
    name: supervisorData.name,
    email: supervisorData.email,
    password: supervisorData.password || 'TempPassword123!',
    role: 'SUPERVISOR',
  });

  // Create supervisor profile
  const supervisor = await SupervisorProfile.create({
    userId: user._id,
    name: supervisorData.name,
    email: supervisorData.email,
    phone: supervisorData.phone || '',
    status: supervisorData.status || 'Active',
    assignedEvents: 0,
    rating: 5,
    imageUrl: supervisorData.imageUrl || `https://i.pravatar.cc/150?u=${Math.random()}`,
  });

  const createdSupervisor = await SupervisorProfile.findById(supervisor._id)
    .populate('userId', 'email isActive')
    .lean();
  
  const formattedSupervisor = JSON.parse(JSON.stringify(createdSupervisor));
  
  // Convert _id to string and add id field
  if (formattedSupervisor._id) {
    formattedSupervisor.id = formattedSupervisor._id.toString();
    formattedSupervisor._id = formattedSupervisor._id.toString();
  }
  
  // Ensure default values
  if (!formattedSupervisor.imageUrl) {
    formattedSupervisor.imageUrl = 'https://i.pravatar.cc/150';
  }
  if (typeof formattedSupervisor.assignedEvents !== 'number') formattedSupervisor.assignedEvents = 0;
  if (typeof formattedSupervisor.rating !== 'number') formattedSupervisor.rating = 5;
  if (!formattedSupervisor.location) formattedSupervisor.location = 'Doha';
  
  // Ensure additional fields exist
  if (formattedSupervisor.department === undefined) formattedSupervisor.department = '';
  if (formattedSupervisor.specialization === undefined) formattedSupervisor.specialization = '';
  if (typeof formattedSupervisor.yearsOfExperience !== 'number') formattedSupervisor.yearsOfExperience = 0;
  if (!Array.isArray(formattedSupervisor.certifications)) formattedSupervisor.certifications = [];
  if (!Array.isArray(formattedSupervisor.languages)) formattedSupervisor.languages = [];
  if (formattedSupervisor.notes === undefined) formattedSupervisor.notes = '';
  
  return formattedSupervisor;
};

export const updateSupervisor = async (id, updateData) => {
  const { userId, password, ...safeUpdateData } = updateData;

  const supervisor = await SupervisorProfile.findByIdAndUpdate(id, safeUpdateData, {
    new: true,
    runValidators: true,
  })
    .populate('userId', 'email isActive')
    .lean();

  if (!supervisor) {
    throw new Error('Supervisor not found');
  }

  // Update user email if changed
  if (updateData.email && supervisor.userId) {
    await User.findByIdAndUpdate(supervisor.userId._id, { email: updateData.email });
  }

  const formattedSupervisor = JSON.parse(JSON.stringify(supervisor));
  if (formattedSupervisor._id) {
    formattedSupervisor._id = formattedSupervisor._id.toString();
  }
  
  return formattedSupervisor;
};

export const deleteSupervisor = async (id) => {
  const supervisor = await SupervisorProfile.findById(id);
  if (!supervisor) {
    throw new Error('Supervisor not found');
  }

  // Delete associated user account
  if (supervisor.userId) {
    await User.findByIdAndDelete(supervisor.userId);
  }

  await SupervisorProfile.findByIdAndDelete(id);
  return { success: true };
};

