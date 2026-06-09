export { default as api, setOnUnauthorized, ApiError } from './api';
export { authService } from './authService';
export { contactService } from './contactService';
export { templateService } from './templateService';
export type { User, LoginCredentials, RegisterData, AuthResponse } from './authService';
export type { Contact, CreateContactData, ContactsResponse, UpcomingBirthday, CalendarData } from './contactService';
export type { MessageTemplate } from './templateService';
