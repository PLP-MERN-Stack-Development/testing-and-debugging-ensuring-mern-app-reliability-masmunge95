import axios from 'axios';

// In development, the Vite proxy in `vite.config.js` will forward requests from /api to the backend.
// In production (on Netlify), the redirect rule in `netlify.toml` will do the same.
// Therefore, we can use a relative baseURL.
const baseURL = '/api';

// Helper function to get the Clerk token. This assumes Clerk is initialized.
const getAuthToken = async () => {
  if (window.Clerk?.session) {
    return window.Clerk.session.getToken({ template: 'Metadata-claims' });
  }
  return null;
};

// Helper function to get full URL for uploaded files
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (typeof imagePath !== 'string') return '';
  if (imagePath.startsWith('http')) return imagePath;
  // In production, image URLs should point directly to the backend service.
  // Use environment variables for flexibility.
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  return `${apiBaseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

const api = axios.create({
  baseURL,
});

// Use an interceptor to automatically attach the auth token to every request.
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;