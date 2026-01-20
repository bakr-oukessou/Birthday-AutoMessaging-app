import api, { ApiResponse } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  _id: string;
  email: string;
  name: string;
  timezone: string;
  settings: {
    defaultSendingTime: string;
    enableAutoSend: boolean;
    preferredChannel: 'sms' | 'whatsapp' | 'email';
    defaultTemplate: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  timezone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      await this.saveAuthData(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Login failed');
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    
    if (response.data.success && response.data.data) {
      await this.saveAuthData(response.data.data);
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data.user;
    }
    
    throw new Error(response.data.message || 'Failed to get profile');
  }

  async updateProfile(data: { name?: string; timezone?: string }): Promise<User> {
    const response = await api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    
    if (response.data.success && response.data.data) {
      const user = response.data.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    
    throw new Error(response.data.message || 'Failed to update profile');
  }

  async updateSettings(settings: Partial<User['settings']>): Promise<User['settings']> {
    const response = await api.put<ApiResponse<{ settings: User['settings'] }>>('/auth/settings', settings);
    
    if (response.data.success && response.data.data) {
      return response.data.data.settings;
    }
    
    throw new Error(response.data.message || 'Failed to update settings');
  }

  async getSettings(): Promise<{ settings: User['settings']; timezone: string }> {
    const response = await api.get<ApiResponse<{ settings: User['settings']; timezone: string }>>('/auth/settings');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get settings');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.put<ApiResponse>('/auth/password', {
      currentPassword,
      newPassword,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to change password');
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }

  async getStoredUser(): Promise<User | null> {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  private async saveAuthData(data: AuthResponse): Promise<void> {
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }
}

export const authService = new AuthService();
