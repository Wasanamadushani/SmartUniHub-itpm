import axios from "axios";

const configuredApiBaseUrl =
  import.meta.env.VITE_NODE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "";

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Foods
export const getFoods = (canteen = null) =>
  api.get("/foods", { params: canteen ? { canteen } : {} });

export const addFood = (payload) => api.post("/foods", payload);
export const updateFood = (id, payload) => api.put(`/foods/${id}`, payload);
export const deleteFood = (id) => api.delete(`/foods/${id}`);

// Offers (food promotions)
export const getOffers = (canteenOrRequestId = null) => {
  if (!canteenOrRequestId) return Promise.resolve({ data: [] });
  const isCanteen = canteenOrRequestId === "anohana" || canteenOrRequestId === "basement";
  if (isCanteen) return api.get("/offers", { params: { canteen: canteenOrRequestId } });
  return api.get(`/offers/${canteenOrRequestId}`);
};
export const getAllOffers = (canteen = null) =>
  api.get("/offers/admin", { params: canteen ? { canteen } : {} });
export const createOffer = (payload) => api.post("/offers", payload);
export const updateOffer = (id, payload) => api.put(`/offers/${id}`, payload);
export const deleteOffer = (id) => api.delete(`/offers/${id}`);

// Requests
export const createFoodRequest = (payload) =>
  api.post("/requests", {
    requesterId: payload?.requesterId,
    foodItem: payload?.foodItem || payload?.foodName || "Food item",
    quantity: payload?.quantity,
    note: payload?.note || payload?.message || "",
    canteen: payload?.canteen || "",
  });
export const getOpenRequests = (canteen) =>
  api.get("/requests", { params: canteen ? { canteen } : {} });
export const getMyRequests = (userId) => api.get(`/requests/my/${userId}`);
export const getHelperRequests = (userId) => api.get(`/requests/helper/${userId}`);
export const getRequestDetails = (id) => api.get(`/requests/${id}`);
export const updateRequestByRequester = (id, payload) => api.put(`/requests/${id}`, payload);
export const deleteRequest = (id, payload) => api.delete(`/requests/${id}`, { data: payload });
export const cancelRequest = (id, payload) => api.put(`/requests/${id}/cancel`, payload);
export const assignHelper = (id, payload) => api.put(`/requests/${id}/assign`, payload);
export const updateRequestStatus = (id, payload) => api.put(`/requests/${id}/status`, payload);
export const acceptRequestByHelper = (id, payload) => api.put(`/requests/${id}/accept`, payload);
export const updateTracking = (id, payload) => api.put(`/requests/${id}/track`, payload);

// Helper offers
export const submitHelperOffer = (payload) => api.post("/requests/helper-offers", payload);
export const getOffersByRequest = (requestId) => api.get(`/requests/helper-offers/${requestId}`);

// Users
export const getUsers = () => api.get("/users");
export const createUser = (payload) => api.post("/users", payload);
export const getHelpers = () => api.get("/users/helpers/active");
export const getUserById = (userId) => api.get(`/users/${userId}`);
export const updateUserProfile = (userId, payload) => api.put(`/users/${userId}`, payload);

// Payments - Cash on Delivery
export const createPayment = async (requestId, requesterId) => {
  try {
    const response = await api.post("/payments/create", { requestId, requesterId });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to create payment");
  }
};

export const confirmCashPayment = async (paymentId, helperId) => {
  try {
    const response = await api.post("/payments/confirm-cash-payment", { paymentId, helperId, helperConfirmed: true });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to confirm payment");
  }
};

export const getRequestPayment = async (requestId) => {
  try {
    const response = await api.get(`/payments/request/${requestId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "Failed to fetch payment");
  }
};

export const mockUsers = [
  { _id: "66a700000000000000000001", name: "Ayesha Perera", role: "student", isHelper: true },
];
