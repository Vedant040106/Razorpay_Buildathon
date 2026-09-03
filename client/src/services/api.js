import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recoverai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Standardize response payload extraction
api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    const errorPayload = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to communicate with RecoverAI API'
    };
    return Promise.reject(errorPayload);
  }
);
