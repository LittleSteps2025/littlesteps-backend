import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to your preferred email service
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASSWORD // Your email password or app password
  }
});

// Send OTP email
export const sendOtpEmail = async (email, otp, parentName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'LittleSteps Daycare - Account Activation Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0;">LittleSteps Daycare</h1>
              <p style="color: #666; margin: 5px 0;">Where Care Begins</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to LittleSteps!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Dear ${parentName || 'Parent'},
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Your account has been created by our daycare administrator. To complete your registration and access your parent dashboard, please use the following One-Time Password (OTP):
            </p>
            
            <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This code will expire in 15 minutes</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              To complete your registration:
            </p>
            
            <ol style="color: #666; line-height: 1.8; margin-bottom: 20px;">
              <li>Open the LittleSteps mobile app</li>
              <li>Go to the Sign Up page</li>
              <li>Enter your email address and create a password</li>
              <li>Enter the OTP code above when prompted</li>
            </ol>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> This OTP is valid for 15 minutes only. If you didn't request this, please contact our daycare immediately.
              </p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need assistance, please don't hesitate to contact us.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                This email was sent by LittleSteps Daycare Management System
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send welcome email after successful registration
export const sendWelcomeEmail = async (email, parentName) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to LittleSteps Daycare!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4CAF50; margin: 0;">🎉 Welcome to LittleSteps!</h1>
              <p style="color: #666; margin: 5px 0;">Where Care Begins</p>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Dear ${parentName || 'Parent'},
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              Congratulations! Your account has been successfully activated. You now have full access to the LittleSteps parent dashboard where you can:
            </p>
            
            <ul style="color: #666; line-height: 1.8; margin-bottom: 20px;">
              <li>View your child's daily activities and reports</li>
              <li>Communicate with daycare staff</li>
              <li>Access photos and updates</li>
              <li>Manage pickup schedules</li>
              <li>Make payments securely</li>
              <li>And much more!</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #4CAF50; color: white; padding: 15px 30px; border-radius: 25px; display: inline-block;">
                <strong>Your account is now active!</strong>
              </div>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need assistance navigating the app, our friendly staff is here to help.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Thank you for choosing LittleSteps Daycare
              </p>
            </div>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email as it's not critical
    return { success: false, error: error.message };
  }
};
