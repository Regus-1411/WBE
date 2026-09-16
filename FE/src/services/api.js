// DROP REST API Client

const BASE_URL = "http://localhost:8080/api";

function getAuthHeader() {
  const token = localStorage.getItem("drop_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = (data.data && typeof data.data === "object")
        ? Object.values(data.data).join(", ")
        : (data.message || `HTTP error! status: ${response.status}`);
      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    console.warn(`API call to ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const authApi = {
  login: async (credentials) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  register: async (userData) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  getProfile: async () => {
    return request("/auth/profile");
  },
  updateProfile: async (data) => {
    return request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

export const apartmentApi = {
  getAll: async () => request("/apartments"),
  getById: async (id) => request(`/apartments/${id}`),
  create: async (data) => request("/apartments", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => request(`/apartments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
};

export const householdApi = {
  getByApartment: async (apartmentId) => request(`/households?apartmentId=${apartmentId}`),
  getById: async (id) => request(`/households/${id}`),
  create: async (data) => request("/households", { method: "POST", body: JSON.stringify(data) }),
  update: async (id, data) => request(`/households/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: async (id) => request(`/households/${id}`, { method: "DELETE" }),
  configureMeter: async (id, data) => request(`/households/${id}/meter`, { method: "PUT", body: JSON.stringify(data) }),
  assignResident: async (householdId, userId) => request(`/households/${householdId}/residents`, { method: "POST", body: JSON.stringify({ userId }) }),
  removeResident: async (householdId, userId) => request(`/households/${householdId}/residents/${userId}`, { method: "DELETE" }),
};

export const waterUsageApi = {
  recordManual: async (data) => request("/water-usage/manual", { method: "POST", body: JSON.stringify(data) }),
  uploadCsv: async (file, apartmentId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("apartmentId", apartmentId);

    const token = localStorage.getItem("drop_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(`${BASE_URL}/water-usage/bulk-upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    return response.json();
  },
  getByHousehold: async (householdId) => request(`/water-usage/household/${householdId}`),
  getByApartment: async (apartmentId) => request(`/water-usage/apartment/${apartmentId}`),
};

export const adminResidentApi = {
  createResident: async (data) => request("/admin/residents", { method: "POST", body: JSON.stringify(data) }),
  checkEmail: async (email) => request(`/admin/residents/check-email?email=${encodeURIComponent(email)}`),
  getResidents: async (apartmentId) => request(`/admin/residents?apartmentId=${apartmentId}`),
  resendCredentials: async (id) => request(`/admin/residents/${id}/resend-credentials`, { method: "POST" }),
};

