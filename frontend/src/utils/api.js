import axios from 'axios';

// Create Axios Instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Uses env var in production, Vite proxy in dev
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF Token Management
let csrfToken = null;

const fetchCsrfToken = async () => {
  try {
    const res = await api.get('/api/csrf-token');
    csrfToken = res.data.csrfToken;
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err.message);
  }
};

// Fetch CSRF token on app load
fetchCsrfToken();

// Request Interceptor: attach CSRF token to state-changing requests
api.interceptors.request.use(
  async (config) => {
    const method = config.method?.toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      if (!csrfToken) await fetchCsrfToken();
      if (csrfToken) config.headers['x-csrf-token'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Normalize server errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized (AuthContext will redirect)
    }
    
    // Normalize and return standard error messages
    const errorMessage = 
      error.response?.data?.error || 
      error.response?.data?.message || 
      error.message || 
      'Something went wrong with the server connection.';
      
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
