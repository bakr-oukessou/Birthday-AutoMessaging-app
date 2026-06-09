import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

const API_URL = Constants.expoConfig?.extra?.apiUrl || DEFAULT_API_URL;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Called when the server rejects our token so the app can return to login
let onUnauthorized: (() => void) | null = null;
export const setOnUnauthorized = (listener: (() => void) | null) => {
  onUnauthorized = listener;
};

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
}

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Turn axios/network failures into errors with a human-readable message
const toApiError = (error: AxiosError<ApiResponse>): ApiError => {
  if (error.response) {
    const { data, status } = error.response;
    if (data?.errors?.length) {
      return new ApiError(data.errors.map((e) => e.message).join('\n'), status);
    }
    if (data?.message) {
      return new ApiError(data.message, status);
    }
    return new ApiError(`Request failed (${status})`, status);
  }
  if (error.code === 'ECONNABORTED') {
    return new ApiError('The request timed out. Please try again.');
  }
  return new ApiError('Cannot reach the server. Check your connection and try again.');
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid: clear session and notify the app
      await AsyncStorage.multiRemove(['authToken', 'user']);
      onUnauthorized?.();
    }
    return Promise.reject(toApiError(error));
  }
);

export default api;
