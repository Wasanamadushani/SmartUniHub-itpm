import api from './api';

// Create a payment record for a food request
export const createPayment = async (requestId) => {
  try {
    const response = await api.post('/payments/create', {
      requestId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create payment' };
  }
};

// Confirm cash payment at delivery (mark as paid)
export const confirmCashPayment = async (paymentId, helperConfirmed = false) => {
  try {
    const response = await api.post('/payments/confirm-cash-payment', {
      paymentId,
      helperConfirmed,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to confirm payment' };
  }
};

// Get payment details for a specific request
export const getRequestPayment = async (requestId) => {
  try {
    const response = await api.get(`/payments/request/${requestId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payment' };
  }
};

// Get payment details
export const getPaymentDetails = async (paymentId) => {
  try {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch payment details' };
  }
};

// Get all pending cash payments for a helper
export const getHelperPendingPayments = async (userId, options = {}) => {
  try {
    const { status = 'PENDING', limit = 20, skip = 0 } = options;
    const params = new URLSearchParams();
    params.append('status', status);
    params.append('limit', limit);
    params.append('skip', skip);

    const response = await api.get(`/payments/user/helper/${userId}?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch helper payments' };
  }
};

// Get all payments for a requester
export const getRequesterPayments = async (userId, options = {}) => {
  try {
    const { status, limit = 20, skip = 0 } = options;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit);
    params.append('skip', skip);

    const response = await api.get(`/payments/user/requester/${userId}?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch requester payments' };
  }
};

// Cancel a pending payment
export const cancelPayment = async (paymentId, reason = '') => {
  try {
    const response = await api.post('/payments/cancel', {
      paymentId,
      reason,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to cancel payment' };
  }
};
