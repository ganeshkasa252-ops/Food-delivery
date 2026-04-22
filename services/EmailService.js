const nodemailer = require('nodemailer');

/**
 * Email Service Class
 * Handles sending emails for OTP and notifications
 * Demonstrates: Service integration, Environment configuration
 */
class EmailService {
  constructor() {
    this.transporter = this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment
   * @private
   * @returns {Object} Nodemailer transporter instance
   */
  initializeTransporter() {
    // Always use configured SMTP (Gmail or other)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log('✅ Using configured SMTP:', process.env.SMTP_HOST);
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      // Fallback: Development with test account for Ethereal Email
      console.log('⚠️ Using Ethereal Email test account');
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: 'nicola.roob28@ethereal.email',
          pass: '8U272NuqXE7G2DgHYg'
        }
      });
    }
  }

  /**
   * Send OTP email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} username - User's username
   * @returns {Promise<Object>} Email send result
   */
  async sendOtpEmail(email, otp, username) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@foodexpress.com',
        to: email,
        subject: `Your Food Express OTP: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Food Express</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p>Hi <strong>${username}</strong>,</p>
              <p>Your One-Time Password (OTP) for Food Express login is:</p>
              <div style="background-color: #667eea; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
              </div>
              <p style="color: #666;">This OTP will expire in 5 minutes.</p>
              <p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
                If you didn't request this OTP, please ignore this email. Your account is safe.
              </p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ OTP email sent to ${email}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
      throw new Error(`Email service error: ${error.message}`);
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} username - User's username
   * @returns {Promise<Object>} Email send result
   */
  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@foodexpress.com',
        to: email,
        subject: `Welcome to Food Express, ${username}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">Food Express</h1>
            </div>
            <div style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p>Welcome to Food Express, <strong>${username}</strong>!</p>
              <p>Your account has been successfully created. You can now log in and start ordering delicious food.</p>
              <p style="color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px;">
                Thank you for choosing Food Express. Enjoy your meals!
              </p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
      // Don't throw - welcome email is non-critical
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
