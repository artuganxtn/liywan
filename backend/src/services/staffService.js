import StaffProfile from '../models/StaffProfile.js';
import User from '../models/User.js';

export const getAllStaff = async (query = {}) => {
  // Parse query parameters - ensure they're numbers
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 100; // Increased default limit for admin dashboard
  const sort = query.sort || '-createdAt';
  const role = query.role;
  const status = query.status;
  const search = query.search;

  const filter = {};

  if (role && role !== 'All') {
    filter.role = role;
  }

  if (status && status !== 'All') {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { nationality: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const staff = await StaffProfile.find(filter)
    .populate('userId', 'email isActive')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await StaffProfile.countDocuments(filter);

  // Format staff data properly
  const formattedStaff = (staff || []).map((s) => {
    const staffObj = JSON.parse(JSON.stringify(s));
    
    // Convert _id to string and add id field for frontend compatibility
    if (staffObj._id) {
      if (typeof staffObj._id.toString === 'function') {
        staffObj.id = staffObj._id.toString();
        staffObj._id = staffObj._id.toString();
      } else if (typeof staffObj._id === 'object' && staffObj._id.$oid) {
        staffObj.id = staffObj._id.$oid;
        staffObj._id = staffObj._id.$oid;
      } else {
        staffObj.id = String(staffObj._id);
        staffObj._id = String(staffObj._id);
      }
    }
    
    // Ensure dates are properly formatted
    if (staffObj.joinedDate) {
      staffObj.joinedDate = new Date(staffObj.joinedDate).toISOString().split('T')[0];
    }
    if (staffObj.dob) {
      staffObj.dob = new Date(staffObj.dob).toISOString().split('T')[0];
    }
    
    // Ensure arrays exist and are properly formatted
    if (!Array.isArray(staffObj.skills)) staffObj.skills = [];
    if (!Array.isArray(staffObj.documents)) staffObj.documents = [];
    if (!Array.isArray(staffObj.feedback)) staffObj.feedback = [];
    if (!Array.isArray(staffObj.certifications)) staffObj.certifications = [];
    if (!Array.isArray(staffObj.languages)) staffObj.languages = [];
    if (!Array.isArray(staffObj.galleryPhotos)) staffObj.galleryPhotos = [];
    
    // Ensure additional fields exist (even if empty)
    if (staffObj.nationality === undefined) staffObj.nationality = '';
    if (staffObj.dob === undefined || staffObj.dob === null) staffObj.dob = null;
    if (staffObj.gender === undefined) staffObj.gender = '';
    if (staffObj.height === undefined) staffObj.height = '';
    if (staffObj.weight === undefined) staffObj.weight = '';
    if (staffObj.shirtSize === undefined) staffObj.shirtSize = '';
    if (staffObj.qidNumber === undefined) staffObj.qidNumber = '';
    
    // Ensure default values for performance metrics
    if (typeof staffObj.rating !== 'number') staffObj.rating = 5;
    if (typeof staffObj.completedShifts !== 'number') staffObj.completedShifts = 0;
    if (typeof staffObj.onTimeRate !== 'number') staffObj.onTimeRate = 100;
    if (typeof staffObj.totalEarnings !== 'number') staffObj.totalEarnings = 0;
    if (typeof staffObj.xpPoints !== 'number') staffObj.xpPoints = 0;
    if (!staffObj.level) staffObj.level = 'Bronze';
    
    // Ensure imageUrl exists
    if (!staffObj.imageUrl) staffObj.imageUrl = 'https://i.pravatar.cc/150';
    
    // Format documents with proper IDs
    if (Array.isArray(staffObj.documents)) {
      staffObj.documents = staffObj.documents.map((doc, idx) => ({
        ...doc,
        _id: doc._id?.toString() || doc._id || `doc-${idx}`,
        id: doc._id?.toString() || doc._id || `doc-${idx}`,
        uploadDate: doc.uploadDate ? (typeof doc.uploadDate === 'string' ? doc.uploadDate : new Date(doc.uploadDate).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        expiryDate: doc.expiryDate ? (typeof doc.expiryDate === 'string' ? doc.expiryDate : new Date(doc.expiryDate).toISOString().split('T')[0]) : undefined,
      }));
    }
    
    // Format gallery photos with proper IDs
    if (Array.isArray(staffObj.galleryPhotos)) {
      staffObj.galleryPhotos = staffObj.galleryPhotos.map((photo, idx) => ({
        ...photo,
        _id: photo._id?.toString() || photo._id || `photo-${idx}`,
        id: photo._id?.toString() || photo._id || `photo-${idx}`,
        uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      }));
    }
    
    return staffObj;
  });

  return {
    data: formattedStaff,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getStaffById = async (id) => {
  const staff = await StaffProfile.findById(id)
    .populate('userId', 'email isActive')
    .lean();

  if (!staff) {
    throw new Error('Staff not found');
  }

  // Format the response
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  
  // Convert _id to string and add id field
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const getStaffByUserId = async (userId) => {
  const staff = await StaffProfile.findOne({ userId })
    .populate('userId', 'email isActive')
    .lean();

  if (!staff) {
    return null;
  }

  // Format the response
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  
  // Convert _id to string and add id field
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const createStaff = async (data) => {
  const staff = new StaffProfile(data);
  await staff.save();
  
  // Return formatted staff data
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const updateStaff = async (id, updateData) => {
  // Don't allow updating userId
  // Performance metrics (rating, completedShifts, onTimeRate) are auto-calculated
  // from event participation and should not be manually updated
  const { userId, rating, completedShifts, onTimeRate, ...safeUpdateData } = updateData;
  
  // Remove empty string values for enum fields (they cause validation errors)
  // Gender enum only accepts 'Male' or 'Female', not empty strings
  if (safeUpdateData.gender === '' || safeUpdateData.gender === null || safeUpdateData.gender === undefined) {
    delete safeUpdateData.gender;
  }
  
  // Handle optional string fields - allow empty strings to clear the field, or remove if null/undefined
  // For nationality, height, weight, shirtSize - allow empty strings to clear
  if (safeUpdateData.nationality === null || safeUpdateData.nationality === undefined) {
    delete safeUpdateData.nationality;
  }
  if (safeUpdateData.height === null || safeUpdateData.height === undefined) {
    delete safeUpdateData.height;
  }
  if (safeUpdateData.weight === null || safeUpdateData.weight === undefined) {
    delete safeUpdateData.weight;
  }
  if (safeUpdateData.shirtSize === null || safeUpdateData.shirtSize === undefined) {
    delete safeUpdateData.shirtSize;
  }
  
  // For dates - allow empty strings or null to clear, but format properly
  if (safeUpdateData.dob === '' || safeUpdateData.dob === null || safeUpdateData.dob === undefined) {
    delete safeUpdateData.dob;
  } else if (safeUpdateData.dob) {
    // Ensure dob is a valid date string
    try {
      const dobDate = new Date(safeUpdateData.dob);
      if (isNaN(dobDate.getTime())) {
        delete safeUpdateData.dob;
      } else {
        safeUpdateData.dob = dobDate;
      }
    } catch (e) {
      delete safeUpdateData.dob;
    }
  }
  
  if (safeUpdateData.joinedDate === '' || safeUpdateData.joinedDate === null || safeUpdateData.joinedDate === undefined) {
    delete safeUpdateData.joinedDate;
  } else if (safeUpdateData.joinedDate) {
    // Ensure joinedDate is a valid date string
    try {
      const joinedDate = new Date(safeUpdateData.joinedDate);
      if (isNaN(joinedDate.getTime())) {
        delete safeUpdateData.joinedDate;
      } else {
        safeUpdateData.joinedDate = joinedDate;
      }
    } catch (e) {
      delete safeUpdateData.joinedDate;
    }
  }

  const staff = await StaffProfile.findByIdAndUpdate(
    id,
    safeUpdateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate('userId', 'email isActive')
    .lean();

  if (!staff) {
    throw new Error('Staff not found');
  }

  // Format the response
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  
  // Convert _id to string and add id field
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const deleteStaff = async (id) => {
  const staff = await StaffProfile.findById(id);
  if (!staff) {
    throw new Error('Staff not found');
  }

  // Delete associated user
  await User.findByIdAndDelete(staff.userId);
  await StaffProfile.findByIdAndDelete(id);

  return staff;
};

export const uploadStaffDocument = async (staffId, documentData) => {
  const staff = await StaffProfile.findById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  // Ensure document has required fields
  const newDocument = {
    title: documentData.title || 'Untitled Document',
    type: documentData.type || 'Certificate',
    url: documentData.url || '',
    uploadDate: new Date(),
    expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : undefined,
    status: documentData.status || 'Pending',
  };

  staff.documents.push(newDocument);
  await staff.save();

  // Return formatted staff
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString() : new Date().toISOString(),
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const verifyDocument = async (staffId, documentId, status) => {
  const staff = await StaffProfile.findById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  const document = staff.documents.id(documentId);
  if (!document) {
    throw new Error('Document not found');
  }

  // Validate status
  const validStatuses = ['Verified', 'Pending', 'Expired', 'Rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  document.status = status;
  await staff.save();

  // Return formatted staff
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString() : new Date().toISOString(),
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const addGalleryPhoto = async (staffId, photoData) => {
  const staff = await StaffProfile.findById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  // If this is set as profile picture, unset all others
  if (photoData.isProfilePicture) {
    if (staff.galleryPhotos && staff.galleryPhotos.length > 0) {
      staff.galleryPhotos.forEach(photo => {
        photo.isProfilePicture = false;
      });
    }
    // Also update imageUrl if it's the profile picture
    staff.imageUrl = photoData.url;
  }

  const newPhoto = {
    url: photoData.url,
    thumbnail: photoData.thumbnail || photoData.url,
    caption: photoData.caption || '',
    uploadedAt: photoData.uploadedAt || new Date(),
    isProfilePicture: photoData.isProfilePicture || false,
  };

  if (!staff.galleryPhotos) {
    staff.galleryPhotos = [];
  }
  staff.galleryPhotos.push(newPhoto);
  await staff.save();

  // Return formatted staff data
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString() : new Date().toISOString(),
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const deleteGalleryPhoto = async (staffId, photoId) => {
  const staff = await StaffProfile.findById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  if (!staff.galleryPhotos || staff.galleryPhotos.length === 0) {
    throw new Error('No gallery photos found');
  }

  const photoIndex = staff.galleryPhotos.findIndex(
    photo => photo._id && photo._id.toString() === photoId
  );

  if (photoIndex === -1) {
    throw new Error('Photo not found');
  }

  staff.galleryPhotos.splice(photoIndex, 1);
  await staff.save();

  // Return formatted staff data
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString() : new Date().toISOString(),
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};

export const updateGalleryPhoto = async (staffId, photoId, updateData) => {
  const staff = await StaffProfile.findById(staffId);
  if (!staff) {
    throw new Error('Staff not found');
  }

  if (!staff.galleryPhotos || staff.galleryPhotos.length === 0) {
    throw new Error('No gallery photos found');
  }

  const photo = staff.galleryPhotos.find(
    p => p._id && p._id.toString() === photoId
  );

  if (!photo) {
    throw new Error('Photo not found');
  }

  // Update photo fields
  if (updateData.caption !== undefined) {
    photo.caption = updateData.caption;
  }

  // If setting as profile picture, unset all others and update imageUrl
  if (updateData.isProfilePicture === true) {
    if (staff.galleryPhotos && staff.galleryPhotos.length > 0) {
      staff.galleryPhotos.forEach(p => {
        if (p._id && p._id.toString() !== photoId) {
          p.isProfilePicture = false;
        }
      });
    }
    photo.isProfilePicture = true;
    staff.imageUrl = photo.url;
  } else if (updateData.isProfilePicture === false) {
    photo.isProfilePicture = false;
  }

  await staff.save();

  // Return formatted staff data
  const formattedStaff = JSON.parse(JSON.stringify(staff));
  if (formattedStaff._id) {
    formattedStaff.id = formattedStaff._id.toString();
    formattedStaff._id = formattedStaff._id.toString();
  }
  
  // Format dates
  if (formattedStaff.joinedDate) {
    formattedStaff.joinedDate = new Date(formattedStaff.joinedDate).toISOString().split('T')[0];
  }
  if (formattedStaff.dob) {
    formattedStaff.dob = new Date(formattedStaff.dob).toISOString().split('T')[0];
  }
  
  // Ensure arrays exist
  if (!Array.isArray(formattedStaff.skills)) formattedStaff.skills = [];
  if (!Array.isArray(formattedStaff.documents)) formattedStaff.documents = [];
  if (!Array.isArray(formattedStaff.feedback)) formattedStaff.feedback = [];
  if (!Array.isArray(formattedStaff.certifications)) formattedStaff.certifications = [];
  if (!Array.isArray(formattedStaff.languages)) formattedStaff.languages = [];
  if (!Array.isArray(formattedStaff.galleryPhotos)) formattedStaff.galleryPhotos = [];
  
  // Format documents with proper IDs
  if (Array.isArray(formattedStaff.documents)) {
    formattedStaff.documents = formattedStaff.documents.map((doc, idx) => ({
      ...doc,
      id: doc._id ? doc._id.toString() : `doc-${idx}`,
      _id: doc._id ? doc._id.toString() : `doc-${idx}`,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate).toISOString() : new Date().toISOString(),
      expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : undefined,
    }));
  }
  
  // Format gallery photos with proper IDs
  if (Array.isArray(formattedStaff.galleryPhotos)) {
    formattedStaff.galleryPhotos = formattedStaff.galleryPhotos.map((photo, idx) => ({
      ...photo,
      id: photo._id ? photo._id.toString() : `photo-${idx}`,
      _id: photo._id ? photo._id.toString() : `photo-${idx}`,
      uploadedAt: photo.uploadedAt ? (typeof photo.uploadedAt === 'string' ? photo.uploadedAt : new Date(photo.uploadedAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
    }));
  }

  return formattedStaff;
};
