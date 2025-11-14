import sgMail from '@sendgrid/mail';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

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
  
  sendPasswordResetEmail: async (email: string, resetToken: string, userName: string = 'User', ipAddress: string = 'Unknown') => {
    try {
      const resetUrl = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`;
      const appUrl = process.env.APP_URL || 'https://brixsport.com';
      const timestamp = new Date().toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'long',
        timeZone: 'UTC' 
      });
      
      // Load HTML template
      const templatePath = path.join(__dirname, '../templates/email/password-reset.html');
      let htmlTemplate = '';
      
      try {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      } catch (err) {
        logger.warn('Failed to load email template, using fallback', { error: err });
        // Fallback HTML if template file doesn't exist
        htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Hello {{userName}},</p>
            <p>We received a request to reset your password.</p>
            <p><a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">Reset Your Password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p style="font-size: 12px; color: #666;">Request from IP: {{ipAddress}} at {{timestamp}}</p>
          </body>
          </html>
        `;
      }
      
      // Replace placeholders
      const html = htmlTemplate
        .replace(/{{userName}}/g, userName)
        .replace(/{{userEmail}}/g, email)
        .replace(/{{resetUrl}}/g, resetUrl)
        .replace(/{{appUrl}}/g, appUrl)
        .replace(/{{timestamp}}/g, timestamp)
        .replace(/{{ipAddress}}/g, ipAddress)
        .replace(/{{currentYear}}/g, new Date().getFullYear().toString());
      
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Password Reset Request - Brixsport',
        html
      });
      
      logger.info('Password reset email sent', { email, ipAddress });
      return result;
    } catch (error: any) {
      logger.error('Failed to send password reset email', { error: error.message, email });
      throw error;
    }
  },
  
  sendPasswordResetSuccessEmail: async (email: string, userName: string = 'User', ipAddress: string = 'Unknown') => {
    try {
      const loginUrl = `${process.env.APP_URL}/auth/login`;
      const appUrl = process.env.APP_URL || 'https://brixsport.com';
      const supportEmail = process.env.SUPPORT_EMAIL || 'support@brixsport.com';
      const timestamp = new Date().toLocaleString('en-US', { 
        dateStyle: 'full', 
        timeStyle: 'long',
        timeZone: 'UTC' 
      });
      
      // Load HTML template
      const templatePath = path.join(__dirname, '../templates/email/password-reset-success.html');
      let htmlTemplate = '';
      
      try {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
      } catch (err) {
        logger.warn('Failed to load success email template, using fallback', { error: err });
        // Fallback HTML
        htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Password Successfully Reset</h2>
            <p>Hello {{userName}},</p>
            <p>Your password has been successfully changed.</p>
            <p><a href="{{loginUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">Log In Now</a></p>
            <p style="color: #dc2626;">If you didn't make this change, contact support immediately at {{supportEmail}}</p>
            <p style="font-size: 12px; color: #666;">Changed from IP: {{ipAddress}} at {{timestamp}}</p>
          </body>
          </html>
        `;
      }
      
      // Replace placeholders
      const html = htmlTemplate
        .replace(/{{userName}}/g, userName)
        .replace(/{{userEmail}}/g, email)
        .replace(/{{loginUrl}}/g, loginUrl)
        .replace(/{{appUrl}}/g, appUrl)
        .replace(/{{supportEmail}}/g, supportEmail)
        .replace(/{{timestamp}}/g, timestamp)
        .replace(/{{ipAddress}}/g, ipAddress)
        .replace(/{{currentYear}}/g, new Date().getFullYear().toString());
      
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Password Successfully Changed - Brixsport',
        html
      });
      
      logger.info('Password reset success email sent', { email });
      return result;
    } catch (error: any) {
      logger.error('Failed to send password reset success email', { error: error.message, email });
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
  },
  
  sendLoggerCredentials: async (email: string, name: string, temporaryPassword: string) => {
    try {
      const result = await emailService.sendEmail({
        to: email,
        subject: 'Brixsport Logger Account Created',
        html: `
          <h2>Welcome to Brixsport Logger System</h2>
          <p>Hello ${name},</p>
          <p>Your logger account has been created successfully.</p>
          <p><strong>Temporary Credentials:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${temporaryPassword}</li>
          </ul>
          <p>Please log in to the system and change your password immediately for security reasons.</p>
          <p><a href="${process.env.APP_URL}/logger/login">Login to Logger System</a></p>
          <p>For security reasons, this temporary password will expire in 24 hours.</p>
          <p>If you didn't request this account, please contact your administrator immediately.</p>
        `
      });
      
      return result;
    } catch (error: any) {
      logger.error('Failed to send logger credentials email', { error: error.message, email });
      throw error;
    }
  }
};