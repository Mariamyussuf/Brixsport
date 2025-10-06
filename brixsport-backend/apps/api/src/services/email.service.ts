import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export const emailService = {
  sendEmail: async (options: EmailOptions) => {
    try {
      const msg: any = {
        to: options.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@brixsport.com',
        subject: options.subject
      };
      
      if (options.text) {
        msg.text = options.text;
      }
      
      if (options.html) {
        msg.html = options.html;
      }
      
      if (options.templateId) {
        msg.templateId = options.templateId;
      }
      
      if (options.dynamicTemplateData) {
        msg.dynamicTemplateData = options.dynamicTemplateData;
      }
      
      await sgMail.send(msg);
      logger.info('Email sent successfully', { to: options.to, subject: options.subject });
      
      return {
        success: true,
        message: 'Email sent successfully'
      };
    } catch (error: any) {
      logger.error('Failed to send email', { error: error.message, to: options.to });
      throw error;
    }
  },
  
  sendVerificationEmail: async (email: string, verificationToken: string) => {
    try {
      const verificationUrl = `${process.env.APP_URL}/verify-email?token=${verificationToken}`;
      
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Verify your email address',
        html: `
          <h2>Welcome to Brixsport!</h2>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verificationUrl}">Verify Email</a></p>
          <p>If you didn't create an account, please ignore this email.</p>
        `
      });
      
      return result;
    } catch (error: any) {
      logger.error('Failed to send verification email', { error: error.message, email });
      throw error;
    }
  },
  
  sendPasswordResetEmail: async (email: string, resetToken: string) => {
    try {
      const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
      
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the link below to proceed:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      });
      
      return result;
    } catch (error: any) {
      logger.error('Failed to send password reset email', { error: error.message, email });
      throw error;
    }
  },
  
  sendMFASetupEmail: async (email: string, qrCodeDataUrl: string) => {
    try {
      const result = await emailService.sendEmail({
        to: email,
        subject: 'MFA Setup',
        html: `
          <h2>Multi-Factor Authentication Setup</h2>
          <p>Scan the QR code below with your authenticator app to set up MFA:</p>
          <img src="${qrCodeDataUrl}" alt="MFA QR Code" />
          <p>If you cannot scan the QR code, enter this code manually in your authenticator app:</p>
          <p>[SECRET_CODE_WILL_BE_PROVIDED_SEPARATELY]</p>
        `
      });
      
      return result;
    } catch (error: any) {
      logger.error('Failed to send MFA setup email', { error: error.message, email });
      throw error;
    }
  },
  
  sendSecurityAlert: async (email: string, alertType: string, details: any) => {
    try {
      const result = await emailService.sendEmail({
        to: email,
        subject: `Security Alert: ${alertType}`,
        html: `
          <h2>Security Alert</h2>
          <p>We detected a ${alertType} on your account:</p>
          <p>${JSON.stringify(details, null, 2)}</p>
          <p>If this was not you, please change your password immediately.</p>
        `
      });
      
      return result;
    } catch (error: any) {
      logger.error('Failed to send security alert email', { error: error.message, email });
      throw error;
    }
  }
};