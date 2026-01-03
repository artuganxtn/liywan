import ClientProfile from '../models/ClientProfile.js';
import User from '../models/User.js';

export const getAllClients = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) {
    filter.status = query.status;
  }
  if (query.search) {
    filter.$or = [
      { companyName: { $regex: query.search, $options: 'i' } },
      { contactPerson: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { city: { $regex: query.search, $options: 'i' } },
      { industry: { $regex: query.search, $options: 'i' } },
    ];
  }
  
  if (query.status && query.status !== 'All') {
    filter.status = query.status;
  }

  const clients = await ClientProfile.find(filter)
    .populate('userId', 'email isActive')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await ClientProfile.countDocuments(filter);

  // Format clients data
  const formattedClients = (clients || []).map((client) => {
    const clientObj = JSON.parse(JSON.stringify(client));
    
    // Convert _id to string and add id field for frontend compatibility
    if (clientObj._id) {
      clientObj.id = clientObj._id.toString();
      clientObj._id = clientObj._id.toString();
    }
    
    // Ensure default values
    if (!clientObj.imageUrl) {
      clientObj.imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientObj.companyName || 'Company')}&background=8A1538&color=fff&size=128`;
    }
    if (typeof clientObj.totalEvents !== 'number') clientObj.totalEvents = 0;
    if (typeof clientObj.totalSpent !== 'number') clientObj.totalSpent = 0;
    if (!clientObj.city) clientObj.city = 'Doha';
    if (!clientObj.country) clientObj.country = 'Qatar';
    
    // Ensure additional fields exist
    if (clientObj.address === undefined) clientObj.address = '';
    if (clientObj.taxId === undefined) clientObj.taxId = '';
    if (clientObj.website === undefined) clientObj.website = '';
    if (clientObj.industry === undefined) clientObj.industry = '';
    if (clientObj.companySize === undefined) clientObj.companySize = '';
    if (clientObj.notes === undefined) clientObj.notes = '';
    
    return clientObj;
  });

  return {
    data: formattedClients,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getClientById = async (id) => {
  const client = await ClientProfile.findById(id)
    .populate('userId', 'email isActive')
    .lean();

  if (!client) {
    throw new Error('Client not found');
  }

  const formattedClient = JSON.parse(JSON.stringify(client));
  if (formattedClient._id) {
    formattedClient._id = formattedClient._id.toString();
  }
  
  return formattedClient;
};

export const createClient = async (clientData) => {
  // Validate required fields
  if (!clientData.companyName || !clientData.email) {
    throw new Error('Company name and email are required');
  }

  // Check if user with this email already exists
  const existingUser = await User.findOne({ email: clientData.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create user account first
  const user = await User.create({
    name: clientData.contactPerson || clientData.companyName,
    email: clientData.email,
    password: clientData.password || 'TempPassword123!',
    role: 'CLIENT',
  });

  // Create client profile
  const client = await ClientProfile.create({
    userId: user._id,
    companyName: clientData.companyName,
    contactPerson: clientData.contactPerson || clientData.companyName,
    email: clientData.email,
    phone: clientData.phone || '',
    status: clientData.status || 'Active',
    totalEvents: 0,
    totalSpent: 0,
    imageUrl: clientData.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(clientData.companyName)}&background=random`,
  });

  const createdClient = await ClientProfile.findById(client._id)
    .populate('userId', 'email isActive')
    .lean();
  
  const formattedClient = JSON.parse(JSON.stringify(createdClient));
  
  // Convert _id to string and add id field
  if (formattedClient._id) {
    formattedClient.id = formattedClient._id.toString();
    formattedClient._id = formattedClient._id.toString();
  }
  
  // Ensure default values
  if (!formattedClient.imageUrl) {
    formattedClient.imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formattedClient.companyName || 'Company')}&background=8A1538&color=fff&size=128`;
  }
  if (typeof formattedClient.totalEvents !== 'number') formattedClient.totalEvents = 0;
  if (typeof formattedClient.totalSpent !== 'number') formattedClient.totalSpent = 0;
  if (!formattedClient.city) formattedClient.city = 'Doha';
  if (!formattedClient.country) formattedClient.country = 'Qatar';
  
  // Ensure additional fields exist
  if (formattedClient.address === undefined) formattedClient.address = '';
  if (formattedClient.taxId === undefined) formattedClient.taxId = '';
  if (formattedClient.website === undefined) formattedClient.website = '';
  if (formattedClient.industry === undefined) formattedClient.industry = '';
  if (formattedClient.companySize === undefined) formattedClient.companySize = '';
  if (formattedClient.notes === undefined) formattedClient.notes = '';
  
  return formattedClient;
};

export const updateClient = async (id, updateData) => {
  const { userId, password, ...safeUpdateData } = updateData;

  const client = await ClientProfile.findByIdAndUpdate(id, safeUpdateData, {
    new: true,
    runValidators: true,
  })
    .populate('userId', 'email isActive')
    .lean();

  if (!client) {
    throw new Error('Client not found');
  }

  // Update user email if changed
  if (updateData.email && client.userId) {
    await User.findByIdAndUpdate(client.userId._id, { email: updateData.email });
  }

  const formattedClient = JSON.parse(JSON.stringify(client));
  if (formattedClient._id) {
    formattedClient._id = formattedClient._id.toString();
  }
  
  return formattedClient;
};

export const deleteClient = async (id) => {
  const client = await ClientProfile.findById(id);
  if (!client) {
    throw new Error('Client not found');
  }

  // Delete associated user account
  if (client.userId) {
    await User.findByIdAndDelete(client.userId);
  }

  await ClientProfile.findByIdAndDelete(id);
  return { success: true };
};

