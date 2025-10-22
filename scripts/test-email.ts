#!/usr/bin/env tsx
/**
 * Email Service Test Script
 *
 * This script tests the email service configuration by sending a test email.
 *
 * Usage:
 *   pnpm tsx scripts/test-email.ts
 *
 * Environment Variables Required:
 *   - SMTP_HOST
 *   - SMTP_PORT
 *   - SMTP_USER
 *   - SMTP_PASSWORD
 */

import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), '.env') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEmailService() {
  log('\n========================================', 'cyan');
  log('   Email Service Configuration Test', 'cyan');
  log('========================================\n', 'cyan');

  // Check if required environment variables are set
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    log('❌ Missing required environment variables:', 'red');
    missingVars.forEach((varName) => {
      log(`   - ${varName}`, 'red');
    });
    log('\nPlease set these variables in your .env file', 'yellow');
    process.exit(1);
  }

  // Display configuration (hide password)
  log('📧 SMTP Configuration:', 'blue');
  log(`   Host: ${process.env.SMTP_HOST}`, 'blue');
  log(`   Port: ${process.env.SMTP_PORT}`, 'blue');
  log(`   Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes' : 'No'}`, 'blue');
  log(`   User: ${process.env.SMTP_USER}`, 'blue');
  log(`   Password: ${'*'.repeat(process.env.SMTP_PASSWORD?.length || 0)}\n`, 'blue');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    // Test 1: Verify SMTP connection
    log('🔍 Testing SMTP connection...', 'yellow');
    await transporter.verify();
    log('✅ SMTP connection successful!\n', 'green');

    // Test 2: Send test email
    const testEmailAddress = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (!testEmailAddress) {
      log('❌ No recipient email address found', 'red');
      log('   Set ADMIN_EMAIL or use SMTP_USER as fallback', 'yellow');
      process.exit(1);
    }

    log(`📨 Sending test email to: ${testEmailAddress}...`, 'yellow');

    const info = await transporter.sendMail({
      from: `Patrick Travel Services <${process.env.SMTP_USER}>`,
      to: testEmailAddress,
      subject: '✅ Email Service Test - Patrick Travel Services',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h2 { margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .info-box { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #e5e7eb; }
            .timestamp { color: #6b7280; font-size: 13px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Email Service Test</h2>
            </div>
            <div class="content">
              <div class="success-icon">🎉</div>
              <h3 style="text-align: center; color: #10b981;">Email Service is Working!</h3>
              <p>Congratulations! Your email service has been configured correctly and is now operational.</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>📋 Configuration Details:</strong></p>
                <ul style="margin: 10px 0 0 0;">
                  <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                  <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                  <li>Sender: ${process.env.SMTP_USER}</li>
                  <li>Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes (TLS)' : 'No'}</li>
                </ul>
              </div>

              <h4>What's Next?</h4>
              <ul>
                <li>✅ Your email service is ready for production use</li>
                <li>📧 Contact form submissions will be sent to: <strong>${testEmailAddress}</strong></li>
                <li>🔔 System notifications will work correctly</li>
                <li>📬 User-to-user messaging emails will be delivered</li>
              </ul>

              <div class="timestamp">
                <strong>Test completed at:</strong> ${new Date().toLocaleString()}
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0; font-weight: 600;">Patrick Travel Services</p>
              <p style="margin: 8px 0 0 0;">Immigration & Travel Document Services</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Email Service Test - Patrick Travel Services

✅ SUCCESS! Your email service is configured correctly.

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}
- Sender: ${process.env.SMTP_USER}
- Secure: ${process.env.SMTP_SECURE === 'true' ? 'Yes (TLS)' : 'No'}

What's Next?
✅ Your email service is ready for production use
📧 Contact form submissions will be sent to: ${testEmailAddress}
🔔 System notifications will work correctly
📬 User-to-user messaging emails will be delivered

Test completed at: ${new Date().toLocaleString()}

Patrick Travel Services
Immigration & Travel Document Services
      `,
    });

    log('✅ Test email sent successfully!', 'green');
    log(`   Message ID: ${info.messageId}\n`, 'green');

    // Summary
    log('========================================', 'cyan');
    log('   ✅ All Tests Passed!', 'green');
    log('========================================', 'cyan');
    log('\n✨ Your email service is ready to use!\n', 'green');
    log(`📬 Check your inbox at: ${testEmailAddress}\n`, 'blue');
  } catch (error: any) {
    log('\n❌ Email Service Test Failed!', 'red');
    log('========================================\n', 'red');

    if (error.code === 'EAUTH') {
      log('Authentication Error:', 'red');
      log('  - Check your SMTP_USER and SMTP_PASSWORD', 'yellow');
      log('  - For Gmail: Ensure 2FA is enabled and you are using an App Password', 'yellow');
      log('  - For other providers: Verify your credentials are correct', 'yellow');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      log('Connection Error:', 'red');
      log('  - Check your SMTP_HOST and SMTP_PORT', 'yellow');
      log('  - Verify your firewall allows outbound connections', 'yellow');
      log('  - Check if the SMTP server is accessible from your network', 'yellow');
    } else if (error.code === 'ESOCKET') {
      log('Socket Error:', 'red');
      log('  - Check if SMTP_SECURE is set correctly', 'yellow');
      log('  - Try toggling between secure (true) and non-secure (false)', 'yellow');
    } else {
      log('Unknown Error:', 'red');
      log(`  ${error.message}`, 'yellow');
    }

    log('\nFull Error Details:', 'red');
    console.error(error);

    log('\n💡 Troubleshooting Tips:', 'blue');
    log('  1. Verify all environment variables in your .env file', 'blue');
    log('  2. Check the EMAIL_SETUP_GUIDE.md for detailed configuration', 'blue');
    log('  3. Ensure your email provider allows SMTP access', 'blue');
    log('  4. For Gmail: Use an App Password, not your regular password\n', 'blue');

    process.exit(1);
  }
}

// Run the test
testEmailService().catch((error) => {
  log('\n❌ Unexpected error occurred:', 'red');
  console.error(error);
  process.exit(1);
});
