import nodemailer from 'nodemailer';

// Create transporter (configure with your email service)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file');
  }

  return nodemailer.createTransport({
    // Gmail configuration (you can change this to your preferred email service)
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your app password
    },
    // Alternative SMTP configuration example:
    // host: process.env.SMTP_HOST,
    // port: process.env.SMTP_PORT,
    // secure: false, // true for 465, false for other ports
    // auth: {
    //   user: process.env.SMTP_USER,
    //   pass: process.env.SMTP_PASS,
    // },
  });
};

// Send verification code email
export const sendVerificationCodeEmail = async (email, code, name = 'User') => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'LittleSteps',
      address: process.env.EMAIL_USER || 'noreply@littlesteps.com'
    },
    to: email,
    subject: 'Password Reset Verification Code - LittleSteps',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">LittleSteps</h1>
            <p style="color: #666; margin: 5px 0;">Early Childhood Education Management</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hello ${name},
            </p>
            <p style="color: #475569; line-height: 1.6;">
              We received a request to reset your password for your LittleSteps account. 
              Please use the following verification code to proceed:
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #2563eb; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
              ${code}
            </div>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>Important:</strong> This code will expire in 30 minutes. 
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">
              © 2025 LittleSteps. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      LittleSteps - Password Reset Request
      
      Hello ${name},
      
      We received a request to reset your password for your LittleSteps account.
      
      Your verification code is: ${code}
      
      This code will expire in 30 minutes.
      
      If you didn't request this password reset, please ignore this email.
      
      © 2025 LittleSteps. All rights reserved.
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification code email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification code email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset success notification
export const sendPasswordResetSuccessEmail = async (email, name = 'User') => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'LittleSteps',
      address: process.env.EMAIL_USER || 'noreply@littlesteps.com'
    },
    to: email,
    subject: 'Password Reset Successful - LittleSteps',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">LittleSteps</h1>
            <p style="color: #666; margin: 5px 0;">Early Childhood Education Management</p>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a;">
            <h2 style="color: #166534; margin-top: 0;">✓ Password Reset Successful</h2>
            <p style="color: #15803d; line-height: 1.6;">
              Hello ${name},
            </p>
            <p style="color: #15803d; line-height: 1.6;">
              Your password has been successfully reset for your LittleSteps account.
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> If you did not make this change, 
              please contact our support team immediately.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              This is an automated message. Please do not reply to this email.
            </p>
            <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">
              © 2025 LittleSteps. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      LittleSteps - Password Reset Successful
      
      Hello ${name},
      
      Your password has been successfully reset for your LittleSteps account.
      
      Security Notice: If you did not make this change, please contact our support team immediately.
      
      © 2025 LittleSteps. All rights reserved.
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset success email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset success email:', error);
    // Don't throw error for notification emails
    console.log('Continuing despite email notification failure');
  }
};

// Send parent verification email for child registration
export const sendParentVerificationEmail = async (email, token, name = 'Parent') => {
  console.log('Sending parent verification email to:', email);
  
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'LittleSteps',
        address: process.env.EMAIL_USER || 'noreply@littlesteps.com'
      },
      to: email,
      subject: 'Parent Verification Required - LittleSteps Child Registration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Parent Verification Required</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">LittleSteps</h1>
              <p style="color: #666; margin: 5px 0;">Early Childhood Education Management</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
              <h2 style="color: #1e293b; margin-top: 0;">Parent Verification Required</h2>
              <p style="color: #475569; line-height: 1.6;">
                Hello ${name},
              </p>
              <p style="color: #475569; line-height: 1.6;">
                We need to verify your identity before completing your child's registration at LittleSteps. 
                Please use the following verification code to confirm your details:
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #16a34a; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; display: inline-block;">
                ${token}
              </div>
            </div>
            
            <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <p style="color: #1e40af; margin: 0; font-size: 14px;">
                <strong>Next Steps:</strong> Enter this verification code in the registration form 
                to complete your child's enrollment process.
              </p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Important:</strong> This code will expire in 10 minutes. 
                If you didn't initiate this registration, please ignore this email.
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                This is an automated message. Please do not reply to this email.
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 5px 0 0 0;">
                © 2025 LittleSteps. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        LittleSteps - Parent Verification Required
        
        Hello ${name},
        
        We need to verify your identity before completing your child's registration at LittleSteps.
        
        Your verification code is: ${token}
        
        This code will expire in 10 minutes.
        
        Enter this verification code in the registration form to complete your child's enrollment process.
        
        If you didn't initiate this registration, please ignore this email.
        
        © 2025 LittleSteps. All rights reserved.
      `
    };
    
    console.log('Attempting to send parent verification email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Parent verification email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending parent verification email:', error);
    throw new Error('Failed to send parent verification email: ' + error.message);
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  const transporter = createTransporter();
  
  try {
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};
