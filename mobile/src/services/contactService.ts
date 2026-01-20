import api, { ApiResponse } from './api';

export interface Contact {
  _id: string;
  name: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  customMessage?: string;
  notificationSettings: {
    enableNotification: boolean;
    sendingChannel: 'sms' | 'whatsapp' | 'email' | 'user_default';
    sendingTime?: string;
    reminderDaysBefore: number;
  };
  tags: string[];
  notes?: string;
  relationship: 'family' | 'friend' | 'colleague' | 'other';
  isActive: boolean;
  age: number;
  nextBirthday: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  dateOfBirth: string;
  phone?: string;
  email?: string;
  customMessage?: string;
  notificationSettings?: Partial<Contact['notificationSettings']>;
  tags?: string[];
  notes?: string;
  relationship?: Contact['relationship'];
}

export interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export interface UpcomingBirthday {
  contact: Contact;
  daysUntil: number;
  nextBirthday: string;
  turningAge: number;
}

export interface CalendarData {
  [date: string]: Array<{
    id: string;
    name: string;
    turningAge: number;
  }>;
}

class ContactService {
  async getContacts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    relationship?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    upcomingDays?: number;
  }): Promise<ContactsResponse> {
    const response = await api.get<ApiResponse<ContactsResponse>>('/contacts', { params });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get contacts');
  }

  async getContact(id: string): Promise<Contact> {
    const response = await api.get<ApiResponse<{ contact: Contact }>>(`/contacts/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data.contact;
    }
    
    throw new Error(response.data.message || 'Failed to get contact');
  }

  async createContact(data: CreateContactData): Promise<Contact> {
    const response = await api.post<ApiResponse<{ contact: Contact }>>('/contacts', data);
    
    if (response.data.success && response.data.data) {
      return response.data.data.contact;
    }
    
    throw new Error(response.data.message || 'Failed to create contact');
  }

  async updateContact(id: string, data: Partial<CreateContactData>): Promise<Contact> {
    const response = await api.put<ApiResponse<{ contact: Contact }>>(`/contacts/${id}`, data);
    
    if (response.data.success && response.data.data) {
      return response.data.data.contact;
    }
    
    throw new Error(response.data.message || 'Failed to update contact');
  }

  async deleteContact(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/contacts/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete contact');
    }
  }

  async getUpcomingBirthdays(days: number = 30): Promise<UpcomingBirthday[]> {
    const response = await api.get<ApiResponse<{ upcomingBirthdays: UpcomingBirthday[] }>>('/contacts/upcoming', {
      params: { days },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data.upcomingBirthdays;
    }
    
    throw new Error(response.data.message || 'Failed to get upcoming birthdays');
  }

  async getTodaysBirthdays(): Promise<{ birthdays: Contact[]; count: number }> {
    const response = await api.get<ApiResponse<{ birthdays: Contact[]; count: number }>>('/contacts/today');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get today\'s birthdays');
  }

  async getBirthdayCalendar(year?: number, month?: number): Promise<CalendarData> {
    const response = await api.get<ApiResponse<{ calendar: CalendarData }>>('/contacts/calendar', {
      params: { year, month },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data.calendar;
    }
    
    throw new Error(response.data.message || 'Failed to get birthday calendar');
  }
}

export const contactService = new ContactService();
