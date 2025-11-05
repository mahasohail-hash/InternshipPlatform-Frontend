import axios from 'axios';
import { getSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';

const getBaseUrl = () => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  // Ensure it's always http://localhost:3001/api or your configured backend URL + /api
   if (!backendUrl) {
    console.warn("NEXT_PUBLIC_BACKEND_URL is not set. Defaulting to http://localhost:3001.");
    return 'http://localhost:3001'; // Default base WITHOUT /api
  }
  const cleanedUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
  return cleanedUrl; // CRITICAL FIX: Base URL should NOT include '/api' here. Components will add it.
};

const api = axios.create({
  baseURL: getBaseUrl(), // Use the helper function to ensure /api suffix
  headers: {
     'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate', // Keep this
    'Expires': '0', },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    const accessToken = session?.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    // CRITICAL FIX: Ensure the config.url gets the /api prefix, as baseURL no longer has it.
    // This is necessary because some frontend calls are just '/users' and need '/api/users'.
    if (!config.url?.startsWith('/api/')) {
        config.url = `/api${config.url}`;
    }
    console.log(`[API Interceptor] Sending request to ${config.baseURL}${config.url} with Auth: ${!!accessToken}`);
    return config;
  },
  async (error) => {
    console.error(`[API Interceptor] Request error for ${error.config?.baseURL}${error.config?.url}:`, error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API Interceptor] Received response for ${response.config.baseURL}${response.config.url}: Status ${response.status}`);
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.error(`[API Interceptor] Unauthorized (401) for ${error.config?.baseURL}${error.config?.url}. Signing out.`);
      await signOut({ redirect: false, callbackUrl: '/auth/login?error=SessionExpired' });
    } else {
      console.error(`[API Interceptor] Response error for ${error.config?.baseURL}${error.config?.url}: Status ${error.response?.status}`, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;