export { default as api } from './api';
export { authService } from './authService';
export { contactService } from './contactService';
// export { notificationService } from './notificationService'; // Disabled due to permission issues
export type { User, LoginCredentials, RegisterData, AuthResponse } from './authService';
export type { Contact, CreateContactData, ContactsResponse, UpcomingBirthday, CalendarData } from './contactService';
