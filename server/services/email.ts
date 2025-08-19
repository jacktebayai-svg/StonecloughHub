import nodemailer from 'nodemailer';
import { z } from 'zod';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// Create transporter
const transporter = nodemailer.createTransporter(emailConfig);

// Email validation schema
const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  text: z.string().optional(),
  html: z.string().optional(),
  from: z.string().email().optional(),
});

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to Stoneclough Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Stoneclough Hub!</h2>
        <p>Hi {{name}},</p>
        <p>Thanks for joining our community platform. You can now:</p>
        <ul>
          <li>Discover local businesses in our directory</li>
          <li>Participate in community discussions</li>
          <li>Stay updated with local news and events</li>
          <li>Access civic data and council information</li>
        </ul>
        <p>
          <a href="{{appUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Explore Stoneclough Hub
          </a>
        </p>
        <p>Best regards,<br>The Stoneclough Hub Team</p>
      </div>
    `,
  },

  resetPassword: {
    subject: 'Reset Your Password - Stoneclough Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Hi {{name}},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p>
          <a href="{{resetUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The Stoneclough Hub Team</p>
      </div>
    `,
  },

  newForumReply: {
    subject: 'New Reply to Your Discussion - Stoneclough Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Reply to Your Discussion</h2>
        <p>Hi {{name}},</p>
        <p><strong>{{replyAuthor}}</strong> replied to your discussion:</p>
        <h3 style="color: #374151;">{{discussionTitle}}</h3>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;">
          {{replyContent}}
        </div>
        <p>
          <a href="{{discussionUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Discussion
          </a>
        </p>
        <p>Best regards,<br>The Stoneclough Hub Team</p>
      </div>
    `,
  },

  businessApproved: {
    subject: 'Your Business Listing Approved - Stoneclough Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Business Listing Approved!</h2>
        <p>Hi {{name}},</p>
        <p>Great news! Your business listing for <strong>{{businessName}}</strong> has been approved and is now live on Stoneclough Hub.</p>
        <p>Your business is now visible to all community members and visitors.</p>
        <p>
          <a href="{{businessUrl}}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Your Listing
          </a>
        </p>
        <p>Best regards,<br>The Stoneclough Hub Team</p>
      </div>
    `,
  },

  surveyInvitation: {
    subject: 'Community Survey - Your Opinion Matters',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Community Survey</h2>
        <p>Hi {{name}},</p>
        <p>We'd love to hear your thoughts on: <strong>{{surveyTitle}}</strong></p>
        <p>{{surveyDescription}}</p>
        <p>Your feedback helps us improve our community and services.</p>
        <p>
          <a href="{{surveyUrl}}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Take Survey
          </a>
        </p>
        <p>Thank you for your participation!</p>
        <p>Best regards,<br>The Stoneclough Hub Team</p>
      </div>
    `,
  },

  newsletter: {
    subject: 'Stoneclough Hub Newsletter - {{date}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb; text-align: center;">Stoneclough Hub Newsletter</h1>
        <p style="text-align: center; color: #6b7280;">{{date}}</p>
        
        <h2 style="color: #374151;">What's New This Week</h2>
        {{content}}
        
        <div style="border-top: 1px solid #e5e7eb; margin: 32px 0; padding-top: 24px;">
          <p>
            <a href="{{unsubscribeUrl}}" style="color: #6b7280; text-decoration: none;">
              Unsubscribe from newsletter
            </a>
          </p>
        </div>
      </div>
    `,
  },

  moderationAlert: {
    subject: 'Content Requires Moderation - Stoneclough Hub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Moderation Required</h2>
        <p>Hi {{moderatorName}},</p>
        <p>New content has been flagged for moderation:</p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px;">
          <p><strong>Type:</strong> {{contentType}}</p>
          <p><strong>Author:</strong> {{authorName}}</p>
          <p><strong>Title:</strong> {{title}}</p>
          <p><strong>Reason:</strong> {{flagReason}}</p>
        </div>
        <p>
          <a href="{{moderationUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Review Content
          </a>
        </p>
        <p>Best regards,<br>The Stoneclough Hub System</p>
      </div>
    `,
  },
};

// Template rendering function
function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value);
  });
  return rendered;
}

// Email service class
export class EmailService {
  private isConfigured: boolean;
  private emailQueue: Array<{
    id: string;
    email: any;
    retries: number;
    scheduledAt: Date;
  }> = [];

  constructor() {
    this.isConfigured = !!(emailConfig.auth.user && emailConfig.auth.pass);
    if (!this.isConfigured) {
      console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
    }
  }

  async sendEmail(emailData: z.infer<typeof emailSchema>): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('Attempted to send email but service not configured');
      return false;
    }

    try {
      emailSchema.parse(emailData);

      const result = await transporter.sendMail({
        from: emailData.from || process.env.SMTP_FROM || emailConfig.auth.user,
        ...emailData,
      });

      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTemplateEmail(
    templateName: keyof typeof templates,
    to: string | string[],
    variables: Record<string, string>
  ): Promise<boolean> {
    const template = templates[templateName];
    if (!template) {
      console.error('Template not found:', templateName);
      return false;
    }

    const renderedSubject = renderTemplate(template.subject, variables);
    const renderedHtml = renderTemplate(template.html, variables);

    return this.sendEmail({
      to,
      subject: renderedSubject,
      html: renderedHtml,
    });
  }

  // Convenience methods for common email types
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.sendTemplateEmail('welcome', to, {
      name,
      appUrl: process.env.APP_URL || 'http://localhost:5173',
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<boolean> {
    return this.sendTemplateEmail('resetPassword', to, {
      name,
      resetUrl,
    });
  }

  async sendForumReplyNotification(
    to: string,
    name: string,
    discussionTitle: string,
    replyAuthor: string,
    replyContent: string,
    discussionUrl: string
  ): Promise<boolean> {
    return this.sendTemplateEmail('newForumReply', to, {
      name,
      discussionTitle,
      replyAuthor,
      replyContent: replyContent.length > 200 ? replyContent.substring(0, 200) + '...' : replyContent,
      discussionUrl,
    });
  }

  async sendBusinessApprovalEmail(
    to: string,
    name: string,
    businessName: string,
    businessUrl: string
  ): Promise<boolean> {
    return this.sendTemplateEmail('businessApproved', to, {
      name,
      businessName,
      businessUrl,
    });
  }

  async sendSurveyInvitation(
    to: string | string[],
    name: string,
    surveyTitle: string,
    surveyDescription: string,
    surveyUrl: string
  ): Promise<boolean> {
    return this.sendTemplateEmail('surveyInvitation', to, {
      name,
      surveyTitle,
      surveyDescription,
      surveyUrl,
    });
  }

  async sendNewsletter(
    to: string[],
    content: string,
    date: string = new Date().toLocaleDateString()
  ): Promise<boolean> {
    return this.sendTemplateEmail('newsletter', to, {
      content,
      date,
      unsubscribeUrl: `${process.env.APP_URL || 'http://localhost:5173'}/unsubscribe`,
    });
  }

  async sendModerationAlert(
    to: string,
    moderatorName: string,
    contentType: string,
    authorName: string,
    title: string,
    flagReason: string,
    moderationUrl: string
  ): Promise<boolean> {
    return this.sendTemplateEmail('moderationAlert', to, {
      moderatorName,
      contentType,
      authorName,
      title,
      flagReason,
      moderationUrl,
    });
  }

  // Bulk email functionality
  async sendBulkEmails(
    templateName: keyof typeof templates,
    recipients: Array<{ email: string; variables: Record<string, string> }>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const success = await this.sendTemplateEmail(
        templateName,
        recipient.email,
        recipient.variables
      );
      
      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Add a small delay to avoid overwhelming the SMTP server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }

  // Email queue management (simple in-memory queue)
  addToQueue(emailData: z.infer<typeof emailSchema>, scheduledAt: Date = new Date()): string {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    
    this.emailQueue.push({
      id,
      email: emailData,
      retries: 0,
      scheduledAt,
    });

    return id;
  }

  async processQueue(): Promise<void> {
    const now = new Date();
    const readyEmails = this.emailQueue.filter(item => item.scheduledAt <= now);

    for (const item of readyEmails) {
      const success = await this.sendEmail(item.email);
      
      if (success) {
        // Remove from queue
        this.emailQueue = this.emailQueue.filter(queueItem => queueItem.id !== item.id);
      } else {
        // Retry logic
        item.retries++;
        if (item.retries >= 3) {
          // Remove after 3 failed attempts
          this.emailQueue = this.emailQueue.filter(queueItem => queueItem.id !== item.id);
          console.error('Email failed after 3 retries, removing from queue:', item.id);
        } else {
          // Reschedule for retry
          item.scheduledAt = new Date(now.getTime() + (item.retries * 5 * 60 * 1000)); // Exponential backoff
        }
      }
    }
  }

  // Health check
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return false;
    }
  }

  getQueueStatus(): { pending: number; total: number } {
    return {
      pending: this.emailQueue.length,
      total: this.emailQueue.length,
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Start queue processing (runs every minute)
setInterval(() => {
  emailService.processQueue();
}, 60000);
