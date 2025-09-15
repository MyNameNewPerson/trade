import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      console.warn(`⚠️  Email service not configured - missing environment variables: ${missingVars.join(', ')}`);
      console.warn('ℹ️  To enable email functionality, set the following environment variables:');
      console.warn('   - SMTP_HOST (e.g., smtp.gmail.com)');
      console.warn('   - SMTP_PORT (e.g., 587)');
      console.warn('   - SMTP_USER (your email)');
      console.warn('   - SMTP_PASS (your password or app password)');
      console.warn('   - SMTP_FROM (optional, defaults to SMTP_USER)');
      return;
    }

    const config: EmailConfig = {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    };

    try {
      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
    }
  }

  async sendActivationEmail(to: string, login: string, activationToken: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('⚠️  Email service not configured - activation email not sent');
      return false;
    }

    const baseUrl = process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';
    
    const activationUrl = `${baseUrl}/activate?token=${activationToken}`;
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const mailOptions = {
      from: {
        name: 'Exchange Platform',
        address: fromEmail!
      },
      to,
      subject: 'Activate Your Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Account Activation</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Exchange Platform!</h1>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px; font-size: 24px; font-weight: 600;">Hi ${login},</h2>
              
              <p style="color: #4b5563; margin: 0 0 20px; font-size: 16px; line-height: 1.6;">
                Thanks for registering! To complete your account setup and start using our exchange platform, 
                please activate your account by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: #ffffff; text-decoration: none; padding: 12px 30px; 
                          border-radius: 8px; font-weight: 600; font-size: 16px;
                          transition: transform 0.2s ease;">
                  Activate Account
                </a>
              </div>
              
              <p style="color: #6b7280; margin: 20px 0 0; font-size: 14px; line-height: 1.5;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              <p style="color: #3b82f6; margin: 10px 0; font-size: 14px; word-break: break-all;">
                ${activationUrl}
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                  This activation link expires in 24 hours for security reasons. 
                  If you didn't create this account, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Exchange Platform!
      
Hi ${login},

Thanks for registering! To complete your account setup, please activate your account by visiting this link:

${activationUrl}

This activation link expires in 24 hours for security reasons.

If you didn't create this account, please ignore this email.

Best regards,
Exchange Platform Team`
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Activation email sent successfully to ${to}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send activation email to ${to}:`, error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }
}

// Create singleton instance
export const emailService = new EmailService();