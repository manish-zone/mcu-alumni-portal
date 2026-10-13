/**
 * MCU Alumni Portal - REST API Client
 * Connects React Vite frontend to the Go (Golang) REST API backend.
 */

const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('mcu_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutMs = options.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    const msg = err.name === 'AbortError' ? 'Network request timed out' : err.message;
    console.warn(`[API] ${options.method || 'GET'} ${endpoint} failed:`, msg);
    throw new Error(msg);
  }
}

// Authentication Service
export const authAPI = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data?.token) {
      localStorage.setItem('mcu_auth_token', data.token);
      localStorage.setItem('mcu_user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (userData) => {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data?.token) {
      localStorage.setItem('mcu_auth_token', data.token);
      localStorage.setItem('mcu_user', JSON.stringify(data.user));
    }
    return data;
  },

  googleAuth: async (payload) => {
    const data = await request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data?.token) {
      localStorage.setItem('mcu_auth_token', data.token);
      localStorage.setItem('mcu_user', JSON.stringify(data.user));
    }
    return data;
  },

  checkAccountByEmail: async (email) => {
    const clean = (email || '').trim().toLowerCase();
    if (!clean) return null;
    return request(`/auth/profile?email=${encodeURIComponent(clean)}`);
  },

  getMe: () => request('/auth/me'),

  forgotPassword: (email) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  resetPassword: (payload) => request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  updateProfile: async (profileData) => {
    const data = await request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    if (data) {
      try {
        localStorage.setItem('mcu_user', JSON.stringify(data));
      } catch (e) {
        console.warn('Could not cache user profile to localStorage (quota exceeded?):', e);
      }
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('mcu_auth_token');
    localStorage.removeItem('mcu_user');
  },

  getCurrentUser: () => {
    try {
      const u = localStorage.getItem('mcu_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('mcu_auth_token'),
};

// Alumni Directory Service
export const alumniAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/alumni${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/alumni/${id}`),
};

// Events & Abhyuday 2026 Service
export const eventsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/events/${id}`),
  rsvp: (id, payload) =>
    request(`/events/${id}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Jobs Service
export const jobsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs${query ? `?${query}` : ''}`);
  },
  create: (jobData) =>
    request('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    }),
  delete: (jobId, requesterEmail) => {
    const query = requesterEmail ? `?requester_email=${encodeURIComponent(requesterEmail)}` : '';
    return request(`/jobs/${jobId}${query}`, {
      method: 'DELETE',
    });
  },
  requestReferral: (jobId, payload) =>
    request(`/jobs/${jobId}/referral`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  applyReferral: (payload) =>
    request('/jobs/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeout: 15000,
    }),
  getApplications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/jobs/applications${query ? `?${query}` : ''}`);
  },
  getMyApplications: (params = {}) => {
    const query = new URLSearchParams({ role: 'applicant', ...params }).toString();
    return request(`/jobs/applications${query ? `?${query}` : ''}`);
  },
  updateApplicationStatus: (appId, status) =>
    request(`/jobs/applications/${appId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  deleteApplication: (appId) =>
    request(`/jobs/applications/${appId}`, {
      method: 'DELETE',
    }),
};

// Mentorship Service
export const mentorshipAPI = {
  requestSession: (payload) =>
    request('/mentorship/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/mentorship/my-requests${query ? `?${query}` : ''}`);
  },
  updateRequestStatus: (reqId, payload) =>
    request(`/mentorship/requests/${reqId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteRequest: (reqId) =>
    request(`/mentorship/requests/${reqId}`, {
      method: 'DELETE',
    }),
};

// Campus Memories Service
export const memoriesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/memories${query ? `?${query}` : ''}`);
  },
};

// Giving & Philanthropy Service
export const givingAPI = {
  getInitiatives: () => request('/giving/initiatives'),
  donate: (payload) =>
    request('/giving/donate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// University Metadata & Stats
export const metaAPI = {
  getCampuses: () => request('/meta/campuses'),
  getDepartments: () => request('/meta/departments'),
  getStats: () => request('/meta/stats'),
};
