import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/notificationService';

// Test endpoint to verify notification service functionality
export async function GET() {
  try {
    // Test creating a notification
    const testResult = await NotificationService.sendNotification(
      'ADMIN',
      { type: 'SPECIFIC', userIds: ['test-user'] },
      {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'SYSTEM_ALERT',
        priority: 'NORMAL',
        source: 'ADMIN'
      }
    );

    // Test getting user notifications
    const userNotifications = await NotificationService.getUserNotifications('test-user');

    // Test updating notification status
    if (userNotifications.notifications.length > 0) {
      await NotificationService.updateNotificationStatus(
        'test-user',
        userNotifications.notifications[0].id,
        'READ'
      );
    }

    // Test creating a template
    const template = await NotificationService.createTemplate({
      name: 'Test Template',
      type: 'SYSTEM_ALERT',
      titleTemplate: 'Test: {{message}}',
      messageTemplate: 'This is a test template with {{value}}',
      defaultPriority: 'NORMAL',
      defaultCategory: 'systemAlerts',
      variables: ['message', 'value'],
      isActive: true
    });

    // Test sending template notification
    const templateResult = await NotificationService.sendTemplateNotification(
      'ADMIN',
      template.id,
      { type: 'SPECIFIC', userIds: ['test-user'] },
      {
        message: 'Hello World',
        value: '123'
      }
    );

    // Test getting templates
    const templates = await NotificationService.getAllTemplates();

    // Test user preferences
    const preferences = await NotificationService.getUserPreferences('test-user');
    
    const updatedPreferences = await NotificationService.updateUserPreferences('test-user', {
      categories: {
        ...preferences.categories,
        systemAlerts: false
      }
    });

    return NextResponse.json({
      success: true,
      testResult,
      userNotifications: await NotificationService.getUserNotifications('test-user'),
      templateResult,
      templates,
      preferences: updatedPreferences
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}