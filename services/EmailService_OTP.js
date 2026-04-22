const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    // Debug: Log what we're reading from env
    console.log('📧 Email Service Initialization:');
    console.log('   SMTP_HOST:', process.env.SMTP_HOST ? '✓' : '✗');
    console.log('   SMTP_PORT:', process.env.SMTP_PORT ? '✓' : '✗');
    console.log('   SMTP_USER:', process.env.SMTP_USER ? '✓' : '✗');
    console.log('   SMTP_PASS:', process.env.SMTP_PASS ? '✓' : '✗');

    // Configure email transporter using SMTP environment variables
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' ? true : false,
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
      }
    };

    console.log('📧 SMTP Config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: smtpConfig.auth.user ? '✓ Set' : '✗ Not set', pass: smtpConfig.auth.pass ? '✓ Set' : '✗ Not set' }
    });

    this.transporter = nodemailer.createTransport(smtpConfig);

    // Test transporter on initialization
    this.testConnection();
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.log('⚠️ Make sure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in .env');
    }
  }

  /**
   * Send OTP to user email
   */
  async sendOtpEmail(email, otp, username, purpose = 'registration') {
    try {
      let subject = '';
      let purposeText = '';

      if (purpose === 'registration') {
        subject = `Your OTP for Food Express Registration is ${otp}`;
        purposeText = 'to verify your account';
      } else if (purpose === 'password-reset') {
        subject = `Your OTP for Food Express Password Reset is ${otp}`;
        purposeText = 'to reset your password';
      } else {
        subject = `Your OTP for Food Express is ${otp}`;
        purposeText = 'to verify your identity';
      }

      const mailOptions = {
        from: `"${process.env.SMTP_FROM || process.env.EMAIL_FROM_NAME || 'Food Express'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🍔 Food Express</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Your Trusted Food Delivery Service</p>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
                Hello <strong>${username}</strong>,
              </p>

              <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;">
                Your OTP ${purposeText} is:
              </p>

              <!-- OTP Display -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.9);">Your One-Time Password</p>
                <h2 style="font-size: 42px; letter-spacing: 8px; color: white; margin: 10px 0 0 0; font-weight: bold;">${otp}</h2>
              </div>

              <!-- Expiry Warning -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #856404;">
                  <strong>⏰ Important:</strong> This OTP will expire in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
              </div>

              <p style="font-size: 14px; color: #666; margin: 20px 0 0 0;">
                If you didn't request this OTP, please ignore this email and ensure your account is secure.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

              <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                © 2026 Food Express. All rights reserved.<br>
                <a href="https://foodexpress.local" style="color: #667eea; text-decoration: none;">www.foodexpress.local</a>
              </p>
            </div>

            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 15px;">
              Please don't reply to this email. This is an automated message.
            </p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email} | Message ID: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(email, username) {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM || process.env.EMAIL_FROM_NAME || 'Food Express'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: email,
        subject: `Welcome to Food Express, ${username}! 🎉`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🍔 Food Express</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Welcome Aboard!</p>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 18px; color: #333; margin: 0 0 15px 0;">
                🎉 Welcome, <strong>${username}</strong>!
              </p>

              <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;">
                Your account has been successfully created. You can now explore our delicious menu and start ordering from your favorite restaurants.
              </p>

              <div style="background-color: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #667eea; margin: 0 0 15px 0;">What You Can Do Now:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #666;">
                  <li style="margin: 8px 0;">🔍 Browse restaurants and menus</li>
                  <li style="margin: 8px 0;">🛒 Add items to your cart</li>
                  <li style="margin: 8px 0;">💳 Choose your payment method</li>
                  <li style="margin: 8px 0;">🚀 Place your first order</li>
                </ul>
              </div>

              <a href="http://localhost:3000/home.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: bold;">Start Ordering Now</a>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

              <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                © 2026 Food Express. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send welcome email:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetEmail(email, username) {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM || process.env.EMAIL_FROM_NAME || 'Food Express'}" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Password Has Been Successfully Changed - Food Express',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Password Changed</h1>
            </div>

            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #333; margin: 0 0 15px 0;">
                Hello ${username},
              </p>

              <p style="font-size: 14px; color: #666; margin: 0 0 20px 0;">
                Your password has been successfully changed. Your account is now secured with your new password.
              </p>

              <div style="background-color: #f0f4ff; border-left: 4px solid #27ae60; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #27ae60;">
                  <strong>✅ Your account is secure:</strong> If you didn't make this change, please contact support immediately.
                </p>
              </div>

              <a href="http://localhost:3000/login.html" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 15px; font-weight: bold;">Login with New Password</a>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">

              <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
                © 2026 Food Express. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset confirmation sent to ${email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send password reset email:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
