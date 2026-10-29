export const hasErrors = (e) => Object.values(e).some(Boolean);
/* ---- regular expressions ------------------------------------------------- */
export const RX = {
    /** Letters (incl. accents) with spaces, apostrophes, dots and hyphens; must start with a letter. 2-50 chars. */
    name: /^\p{L}[\p{L}\s'’.-]{1,49}$/u,
    /** local@domain.tld - no spaces, one @, TLD of 2+ letters. */
    email: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
    /** Optional +, then digits with spaces, dashes or brackets. Digit count checked separately (7-15). */
    phone: /^\+?[0-9][0-9\s()-]{5,19}$/,
    /** Employee ID such as LS-0042. */
    employeeId: /^[A-Za-z0-9][A-Za-z0-9-]{2,19}$/,
    /** Room number such as 305 or 12B. */
    roomNumber: /^[A-Za-z0-9][A-Za-z0-9-]{0,9}$/,
    /** 24-hour HH:MM (matches the server's own rule). */
    time: /^([01]\d|2[0-3]):[0-5]\d$/,
    /** Currency code like PKR / USD. */
    currency: /^[A-Za-z]{3,5}$/,
    /** http(s) URL or an app-relative path such as /images/deluxe.webp or /uploads/x.jpg */
    imageRef: /^(https?:\/\/\S+|\/\S+)$/i,
    /** Mongo ObjectId (24 hex chars). */
    objectId: /^[a-f\d]{24}$/i,
};
/* ---- single-field rules (return '' when valid, otherwise the message) ---- */
export const required = (v, label) => (String(v ?? '').trim() ? '' : `${label} is required`);
export const nameRule = (v, label, requiredField = true) => {
    const s = v.trim();
    if (!s)
        return requiredField ? `${label} is required` : '';
    if (s.length < 2)
        return `${label} must be at least 2 characters`;
    if (s.length > 50)
        return `${label} must be 50 characters or fewer`;
    return RX.name.test(s) ? '' : `${label} can only contain letters, spaces, apostrophes, dots and hyphens`;
};
export const emailRule = (v, requiredField = true) => {
    const s = v.trim();
    if (!s)
        return requiredField ? 'Email is required' : '';
    if (s.length > 254)
        return 'Email is too long';
    return RX.email.test(s) ? '' : 'Enter a valid email address, e.g. name@example.com';
};
export const phoneRule = (v, requiredField = true) => {
    const s = v.trim();
    if (!s)
        return requiredField ? 'Phone number is required' : '';
    const digits = s.replace(/\D/g, '').length;
    return RX.phone.test(s) && digits >= 7 && digits <= 15 ? '' : 'Enter a valid phone number, e.g. +92 300 1234567';
};
/** Password: 8-64 chars with a lowercase letter, an uppercase letter and a number (server only needs 8+). */
export const passwordRule = (v, label = 'Password') => {
    if (!v)
        return `${label} is required`;
    if (v.length < 8)
        return `${label} must be at least 8 characters`;
    if (v.length > 64)
        return `${label} must be 64 characters or fewer`;
    if (!/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v))
        return `${label} needs an uppercase letter, a lowercase letter and a number`;
    return '';
};
export const confirmRule = (v, other) => (!v ? 'Please confirm your password' : v === other ? '' : 'Passwords do not match');
export const maxLen = (v, n, label) => (v.length > n ? `${label} must be ${n} characters or fewer` : '');
export const intRange = (v, min, max, label) => {
    if (String(v).trim() === '')
        return `${label} is required`;
    const n = Number(v);
    return Number.isInteger(n) && n >= min && n <= max ? '' : `${label} must be a whole number between ${min} and ${max}`;
};
export const moneyRule = (v, label, min = 0, requiredField = true) => {
    if (String(v).trim() === '')
        return requiredField ? `${label} is required` : '';
    const n = Number(v);
    return Number.isFinite(n) && n >= min ? '' : `${label} must be ${min > 0 ? `at least ${min}` : 'zero or more'}`;
};
export const dateRule = (v, label, requiredField = true) => (!v ? (requiredField ? `${label} is required` : '') : isNaN(+new Date(v)) ? `${label} is not a valid date` : '');
export function validateLogin(f) {
    return { email: emailRule(f.email), password: f.password ? '' : 'Password is required' };
}
export function validateRegister(f) {
    return {
        firstName: nameRule(f.firstName, 'First name'), lastName: nameRule(f.lastName, 'Last name'),
        email: emailRule(f.email), phone: phoneRule(f.phone), password: passwordRule(f.password), confirmPassword: confirmRule(f.confirmPassword, f.password),
        address: maxLen(f.address, 200, 'Address'), city: f.city.trim() && !RX.name.test(f.city.trim()) ? 'City can only contain letters, spaces and hyphens' : '',
        country: f.country.trim() && !RX.name.test(f.country.trim()) ? 'Country can only contain letters, spaces and hyphens' : '',
        agree: f.agree ? '' : 'Please accept the terms to continue',
    };
}
export const validateReset = (f) => ({ password: passwordRule(f.password, 'New password'), confirmPassword: confirmRule(f.confirmPassword, f.password) });
/** Strength meter for the password field: 0-4. */
export function passwordStrength(v) {
    let s = 0;
    if (v.length >= 8)
        s++;
    if (/[a-z]/.test(v) && /[A-Z]/.test(v))
        s++;
    if (/\d/.test(v))
        s++;
    if (/[^A-Za-z0-9]/.test(v) || v.length >= 12)
        s++;
    return s;
}
export function validateStaff(f) {
    let dob = '';
    if (f.dateOfBirth) {
        const age = (Date.now() - +new Date(f.dateOfBirth)) / 31557600000;
        dob = isNaN(age) ? 'Enter a valid date of birth' : age < 16 ? 'Staff must be at least 16 years old' : age > 100 ? 'Enter a valid date of birth' : '';
    }
    return {
        firstName: nameRule(f.firstName, 'First name'), lastName: nameRule(f.lastName, 'Last name'), dateOfBirth: dob, email: emailRule(f.email), phone: phoneRule(f.phone),
        emergencyName: nameRule(f.emergencyName, 'Emergency contact name'), emergencyPhone: phoneRule(f.emergencyPhone), emergencyRelationship: required(f.emergencyRelationship, 'Relationship'),
        employeeId: !f.employeeId.trim() ? 'Employee ID is required' : RX.employeeId.test(f.employeeId.trim()) ? '' : 'Use 3-20 letters, numbers or hyphens, e.g. LS-0042',
        department: required(f.department, 'Department'), designation: required(f.designation, 'Designation') || maxLen(f.designation, 80, 'Designation'), joiningDate: dateRule(f.joiningDate, 'Joining date'), role: required(f.role, 'Role'),
    };
}
export function validateGuest(f) {
    return { firstName: nameRule(f.firstName, 'First name'), lastName: nameRule(f.lastName, 'Last name'), email: emailRule(f.email), phone: phoneRule(f.phone), dateOfBirth: dateRule(f.dateOfBirth, 'Date of birth', false) || (f.dateOfBirth && new Date(f.dateOfBirth) > new Date() ? 'Date of birth cannot be in the future' : ''), specialRequests: maxLen(f.specialRequests, 500, 'Special requests'), notes: maxLen(f.notes, 500, 'Notes') };
}
export const validateProfile = (f) => ({ firstName: nameRule(f.firstName, 'First name'), lastName: nameRule(f.lastName, 'Last name'), phone: phoneRule(f.phone, false), dateOfBirth: f.dateOfBirth && new Date(f.dateOfBirth) > new Date() ? 'Date of birth cannot be in the future' : '', address: maxLen(f.address, 200, 'Address') });
export const validatePasswordChange = (f) => ({ currentPassword: f.currentPassword ? '' : 'Current password is required', newPassword: passwordRule(f.newPassword, 'New password') || (f.newPassword === f.currentPassword ? 'New password must be different from the current one' : ''), confirmPassword: confirmRule(f.confirmPassword, f.newPassword) });
export const validateContact = (f) => ({ name: nameRule(f.name, 'Name'), email: emailRule(f.email), subject: required(f.subject, 'Subject') || maxLen(f.subject, 120, 'Subject'), message: !f.message.trim() ? 'Message is required' : f.message.trim().length < 10 ? 'Message must be at least 10 characters' : maxLen(f.message, 1500, 'Message') });
