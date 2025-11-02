import axios from 'axios';
import { getSession } from 'next-auth/react';

// Define the Axios instance
// Using the name 'apiClient' as per your filename
const apiClient = axios.create({
  // Use the environment variable for the backend API URL (e.g., http://localhost:3001/api)
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add ONE async request interceptor to attach the token using getSession
apiClient.interceptors.request.use(
  async (config) => {
    // getSession() gets the current, active session
    const session = await getSession();
    
    // The session callback adds it directly to the session object
    const token = session?.accessToken; 

    if (token) {
      console.log('[API Interceptor] Token found on session.accessToken, attaching header.'); // Log success
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('[API Interceptor] Token NOT found on session.accessToken!'); // Log failure
      console.log('[API Interceptor] Current session:', session); // Log session for debugging
    }
    
    return config;
  },
  (error) => {
    // Handle errors during request setup
    console.error('[API Interceptor] Request setup error:', error);
    return Promise.reject(error);
  }
);
// -----------------------------

apiClient.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized (401). Potentially redirecting to login...');
      
    }
    return Promise.reject(error);
  }
);

export default apiClient;
