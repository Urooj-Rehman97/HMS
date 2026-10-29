/** Central configuration + enum lists. Values mirror the server's Mongoose enums exactly. */
/** Base URL of the Express API (set VITE_API_URL in .env). */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'https://hmsbackend-z1w5.onrender.com/api').replace(/\/$/, '');
/** Origin that serves uploaded files such as /uploads/gallery/xyz.jpg */
export const FILES_URL = (import.meta.env.VITE_FILES_URL ?? API_URL.replace(/\/api$/, '')).replace(/\/$/, '');
export const ROLE_LABEL = { admin: 'Admin', manager: 'Manager', receptionist: 'Receptionist', housekeeping: 'Housekeeping', guest: 'Guest' };
/** Role names exactly as the server stores them. */
export const SERVER_ROLE = { admin: 'Admin', manager: 'Manager', receptionist: 'Receptionist', housekeeping: 'Housekeeping', guest: 'Guest' };
/** Roles an admin/manager may invite as staff (server: createStaffValidation). */
export const STAFF_ROLES = ['Manager', 'Receptionist', 'Housekeeping', 'Admin'];
export const PAGE_SIZE = 10;
/* ---- enums (server values) ------------------------------------------------ */
export const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW'];
export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'];
export const BOOKING_SOURCES = ['ONLINE', 'STAFF', 'WALK_IN'];
export const ROOM_STATUSES = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'VACANT'];
export const BILL_STATUSES = ['DRAFT', 'OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'];
export const CHARGE_TYPES = ['ROOM', 'SERVICE', 'FOOD', 'TRANSPORT', 'OTHER'];
export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'];
export const KEY_TYPES = ['CARD', 'PHYSICAL', 'DIGITAL', 'OTHER'];
export const TASK_TYPES = ['CHECKOUT_CLEANING', 'REGULAR_CLEANING', 'DEEP_CLEANING', 'INSPECTION', 'AMENITIES_RESTOCK', 'OTHER'];
export const TASK_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const MAINTENANCE_CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'HVAC', 'FURNITURE', 'APPLIANCE', 'STRUCTURAL', 'INTERNET', 'OTHER'];
export const MAINTENANCE_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
export const SERVICE_CATEGORIES = ['ROOM_SERVICE', 'WAKE_UP_CALL', 'TRANSPORTATION', 'LAUNDRY', 'SPA', 'FOOD', 'BEVERAGE', 'OTHER'];
export const SERVICE_REQUEST_STATUSES = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED'];
export const FEEDBACK_STATUSES = ['PUBLISHED', 'HIDDEN', 'PENDING'];
export const NOTIFICATION_TYPES = ['BOOKING', 'CHECK_IN', 'CHECK_OUT', 'PAYMENT', 'MAINTENANCE', 'HOUSEKEEPING', 'SERVICE_REQUEST', 'FEEDBACK', 'SYSTEM', 'GENERAL'];
export const NOTIFICATION_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
export const GALLERY_CATEGORIES = ['Rooms', 'Suites', 'Restaurant', 'Pool', 'Spa', 'Gym', 'Lobby', 'Events', 'Exterior', 'Other'];
export const GENDERS = ['Male', 'Female', 'Other'];
export const DEPARTMENTS = ['Management', 'Front Desk', 'Housekeeping', 'Maintenance', 'Food & Beverage', 'Concierge', 'Finance'];
export const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];
export const ROOM_PREFERENCES = ['King Bed', 'Queen Bed', 'Twin Beds', 'Single Bed'];
export const SMOKING_PREFERENCES = ['Non-Smoking', 'Smoking'];
export const FLOOR_PREFERENCES = ['No Preference', 'Low Floor', 'High Floor'];
/** 'CHECKED_IN' → 'Checked in' (used for every status badge, filter and table cell). */
export const labelOf = (code) => (!code ? '—' : String(code).replace(/[_-]+/g, ' ').toLowerCase().replace(/^./, c => c.toUpperCase()));
