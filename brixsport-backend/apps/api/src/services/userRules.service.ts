import { logger } from '../utils/logger';

// Business rules for user management
export const userRules = {
  // Validate user registration data
  validateRegistration: (userData: any) => {
    const errors: string[] = [];
    
    // Email validation
    if (!userData.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Invalid email format');
    }
    
    // Password validation
    if (!userData.password) {
      errors.push('Password is required');
    } else if (userData.password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(userData.password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one digit');
    }
    
    // Name validation
    if (!userData.firstName) {
      errors.push('First name is required');
    } else if (userData.firstName.length > 50) {
      errors.push('First name must be less than 50 characters');
    }
    
    if (!userData.lastName) {
      errors.push('Last name is required');
    } else if (userData.lastName.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }
    
    // Role validation
    const validRoles = ['user', 'logger', 'senior_logger', 'logger_admin', 'admin', 'super_admin'];
    if (userData.role && !validRoles.includes(userData.role)) {
      errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    return errors;
  },
  
  // Validate user profile update
  validateProfileUpdate: (userData: any) => {
    const errors: string[] = [];
    
    // Email validation if provided
    if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.push('Invalid email format');
    }
    
    // Name validation if provided
    if (userData.firstName && userData.firstName.length > 50) {
      errors.push('First name must be less than 50 characters');
    }
    
    if (userData.lastName && userData.lastName.length > 50) {
      errors.push('Last name must be less than 50 characters');
    }
    
    // Phone number validation if provided
    if (userData.phoneNumber && !/^\+?[\d\s\-\(\)]{10,}$/.test(userData.phoneNumber)) {
      errors.push('Invalid phone number format');
    }
    
    // Date of birth validation if provided
    if (userData.dateOfBirth) {
      const dob = new Date(userData.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push('Invalid date of birth format');
      } else {
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 13) {
          errors.push('User must be at least 13 years old');
        }
        if (age > 120) {
          errors.push('Invalid date of birth');
        }
      }
    }
    
    // Preferred language validation if provided
    const validLanguages = ['en', 'es', 'fr', 'de'];
    if (userData.preferredLanguage && !validLanguages.includes(userData.preferredLanguage)) {
      errors.push(`Invalid preferred language. Must be one of: ${validLanguages.join(', ')}`);
    }
    
    return errors;
  },
  
  // Validate password change
  validatePasswordChange: (passwordData: any) => {
    const errors: string[] = [];
    
    if (!passwordData.currentPassword) {
      errors.push('Current password is required');
    }
    
    if (!passwordData.newPassword) {
      errors.push('New password is required');
    } else if (passwordData.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one digit');
    }
    
    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.push('New password must be different from current password');
    }
    
    return errors;
  },
  
  // Validate user role assignment
  validateRoleAssignment: (roleData: any) => {
    const errors: string[] = [];
    
    const validRoles = ['user', 'logger', 'senior_logger', 'logger_admin', 'admin', 'super_admin'];
    if (!roleData.role) {
      errors.push('Role is required');
    } else if (!validRoles.includes(roleData.role)) {
      errors.push(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    // Additional validation for elevated roles
    const elevatedRoles = ['admin', 'super_admin'];
    if (elevatedRoles.includes(roleData.role) && !roleData.reason) {
      errors.push('Reason is required for elevated roles');
    }
    
    return errors;
  },
  
  // Validate user deactivation
  validateUserDeactivation: (deactivationData: any) => {
    const errors: string[] = [];
    
    if (!deactivationData.reason) {
      errors.push('Reason for deactivation is required');
    } else if (deactivationData.reason.length < 10) {
      errors.push('Reason must be at least 10 characters long');
    }
    
    return errors;
  },
  
  // Check if user can be deleted
  canDeleteUser: (userId: string, requestingUserId: string, requestingUserRole: string) => {
    const errors: string[] = [];
    
    // Users can't delete themselves
    if (userId === requestingUserId) {
      errors.push('Users cannot delete their own account');
    }
    
    // Only admins and super admins can delete users
    const allowedRoles = ['admin', 'super_admin'];
    if (!allowedRoles.includes(requestingUserRole)) {
      errors.push('Insufficient permissions to delete users');
    }
    
    return errors;
  },
  
  // Validate notification preferences
  validateNotificationPreferences: (preferences: any) => {
    const errors: string[] = [];
    
    if (preferences.email !== undefined && typeof preferences.email !== 'boolean') {
      errors.push('Email preference must be a boolean value');
    }
    
    if (preferences.push !== undefined && typeof preferences.push !== 'boolean') {
      errors.push('Push notification preference must be a boolean value');
    }
    
    if (preferences.sms !== undefined && typeof preferences.sms !== 'boolean') {
      errors.push('SMS preference must be a boolean value');
    }
    
    return errors;
  }
};