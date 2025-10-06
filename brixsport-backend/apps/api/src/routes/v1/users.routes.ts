import { Router } from 'express';
import { userController } from '../../controllers/user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { 
  updateProfileSchema,
  uploadProfilePictureSchema,
  updatePreferencesSchema,
  updateNotificationSettingsSchema,
  validate
} from '../../validation/user.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', userController.getCurrentUser);

// Update user profile
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// Upload profile picture
router.post('/profile/picture', validate(uploadProfilePictureSchema), userController.uploadProfilePicture);

// Remove profile picture
router.delete('/profile/picture', userController.removeProfilePicture);

// Get user preferences
router.get('/preferences', userController.getPreferences);

// Update preferences
router.put('/preferences', validate(updatePreferencesSchema), userController.updatePreferences);

// Get user activity log
router.get('/activity', userController.getActivityLog);

// Get notification settings
router.get('/notifications', userController.getNotificationSettings);

// Update notification settings
router.put('/notifications', validate(updateNotificationSettingsSchema), userController.updateNotificationSettings);

export default router;