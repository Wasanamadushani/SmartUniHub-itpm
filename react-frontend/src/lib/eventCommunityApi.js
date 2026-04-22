import { apiRequest } from './api';

const MONGO_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export const isMongoObjectId = (value) => MONGO_OBJECT_ID_REGEX.test(String(value || ''));

export const getApprovedStalls = async (eventId = '') => {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return apiRequest(`/api/stalls${query}`);
};

export const createStallRequest = async (payload) => {
  return apiRequest('/api/stalls', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getAdminStalls = async (status = 'all') => {
  const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/admin/stalls${query}`);
};

export const updateStallStatus = async (stallId, status) => {
  return apiRequest(`/api/admin/stalls/${stallId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const deleteStall = async (stallId) => {
  return apiRequest(`/api/admin/stalls/${stallId}`, {
    method: 'DELETE',
  });
};

export const getEventMemories = async (eventId = '') => {
  const query = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return apiRequest(`/api/event-memories${query}`);
};

export const createEventMemory = async (payload) => {
  return apiRequest('/api/event-memories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateEventMemory = async (memoryId, payload) => {
  return apiRequest(`/api/event-memories/${memoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const deleteEventMemory = async (memoryId, actingUserId) => {
  return apiRequest(`/api/event-memories/${memoryId}`, {
    method: 'DELETE',
    body: JSON.stringify({ actingUserId }),
  });
};

export const getEventBookingSummary = async (eventId, userId = '') => {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  const query = isMongoObjectId(userId) ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiRequest(`/api/events/${eventId}/bookings/summary${query}`);
};

export const createEventBooking = async (eventId, payload) => {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest(`/api/events/${eventId}/bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const uploadEventBookingReceipt = async (bookingId, payload) => {
  if (!bookingId) {
    throw new Error('bookingId is required');
  }

  return apiRequest(`/api/events/bookings/${bookingId}/receipt`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getMyEventBookings = async (userId) => {
  if (!isMongoObjectId(userId)) {
    return [];
  }

  return apiRequest(`/api/events/bookings/my?userId=${encodeURIComponent(userId)}`);
};

export const getEventBookingDetail = async (bookingId) => {
  if (!isMongoObjectId(bookingId)) {
    throw new Error('Invalid booking ID');
  }

  return apiRequest(`/api/events/bookings/${bookingId}`);
};

export const getAdminEventBookings = async (paymentStatus = 'pending_verification') => {
  const query = paymentStatus ? `?paymentStatus=${encodeURIComponent(paymentStatus)}` : '';
  return apiRequest(`/api/admin/event-bookings${query}`);
};

export const updateAdminEventBookingPaymentStatus = async (bookingId, paymentStatus, note = '') => {
  if (!bookingId) {
    throw new Error('bookingId is required');
  }

  return apiRequest(`/api/admin/event-bookings/${bookingId}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus, note }),
  });
};
