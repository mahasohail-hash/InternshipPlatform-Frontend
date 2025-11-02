import axios from 'axios';
import { getSession } from 'next-auth/react';

// Create the Axios instance
const api = axios.create({
  // --- THIS IS THE FIX ---
  // Set the base URL for ALL requests
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
 timeout: 15000,
  // --- END OF FIX ---
});

// Add the interceptor to attach the token
api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    const accessToken = (session as any)?.accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[API Interceptor] Token attached successfully.');
    } else {
      // This happens when the session is still loading or logged out
      console.log('[API Interceptor] No session or token found.');
      // Optional: You can throw an error here, but we let the 401 handle it
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default api;
