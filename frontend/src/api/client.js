import axios from 'axios';
import { BASE_URL, API_BASE_PATH, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './config';

const envBase = process.env.REACT_APP_BASE_URL || BASE_URL || '';
const envPath = process.env.REACT_APP_API_BASE_PATH || API_BASE_PATH || '';
const baseURL = `${envBase}${envPath}`;

const client = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10 minutes timeout
  withCredentials: false,
});

// Request interceptor: Add Authorization header to all requests
client.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullURL: `${config.baseURL}${config.url}`
    });
    
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Authorization header added');
      } else {
        console.log('⚠️ No token found in localStorage');
      }
    } catch (e) {
      console.error('❌ Error getting token:', e);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: Handle token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.config.url, '- Status:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ Response error:', error.config?.url, '- Status:', error.response?.status);
    
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      try {
        const refreshUrl = `${envBase}${envPath}/auth/refresh-token`;
        const resp = await axios.post(refreshUrl, { refreshToken });
        const newToken = resp?.data?.accessToken;
        const newRefresh = resp?.data?.refreshToken;
        if (newToken) {
          localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
        }
        if (newRefresh) {
          localStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);
        }
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
