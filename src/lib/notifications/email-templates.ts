// Email Templates for Notifications
// Centralized email template management

import { minifyForProduction } from '../utils/html-minifier';

export interface CaseAssignmentEmailData {
  clientName: string;
  caseReference: string;
  agentName: string;
  caseId: string;
}

export interface CaseStatusUpdateEmailData {
  clientName: string;
  caseReference: string;
  oldStatus: string;
  newStatus: string;
  caseId: string;
  notes?: string;
}

export interface DocumentStatusEmailData {
  clientName: string;
  documentName: string;
  status: 'APPROVED' | 'REJECTED';
  caseReference: string;
  rejectionReason?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.patricktravel.com';
const COMPANY_NAME = 'Patrick Travel Services';

/**
 * Email template for case assignment notification
 */
export function getCaseAssignmentEmailTemplate(data: CaseAssignmentEmailData): {
  subject: string;
  html: string;
} {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Assigned</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">Case Assigned!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Great news about your immigration case</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${data.clientName}</strong>,</p>
    
    <p style="font-size: 16px;">We're pleased to inform you that your immigration case has been assigned to one of our experienced advisors!</p>
    
    <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #0066CC;">
      <h3 style="margin: 0 0 16px 0; color: #0066CC; font-size: 18px;">📋 Case Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666; width: 40%;">Case Reference:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #333;">${data.caseReference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Your Advisor:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #0066CC;">${data.agentName}</td>
        </tr>
      </table>
    </div>
    
    <h3 style="color: #333; font-size: 18px; margin: 24px 0 12px 0;">What Happens Next?</h3>
    <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
      <li>Your advisor will review your case details thoroughly</li>
      <li>They will contact you within 24-48 hours to discuss next steps</li>
      <li>You can message them directly through the chat feature</li>
      <li>You'll receive updates as your case progresses</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/case/${data.caseId}" 
         style="background: #0066CC; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 102, 204, 0.25);">
        View Case Details
      </a>
    </div>
    
    <div style="background: #e8f4ff; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #0066CC;">
        💡 <strong>Tip:</strong> Download our mobile app for instant notifications and chat with your advisor on the go!
      </p>
    </div>
    
    <div style="border-top: 1px solid #e0e0e0; margin-top: 32px; padding-top: 24px;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        Best regards,<br/>
        <strong style="color: #333;">The ${COMPANY_NAME} Team</strong>
      </p>
      <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
        If you have any questions, please reply to this email or contact our support team.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">© 2025 ${COMPANY_NAME}. All rights reserved.</p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `Case ${data.caseReference} - Advisor Assigned`,
    html: minifyForProduction(html), // PERFORMANCE: Minify in production
  };
}

/**
 * Email template for case status update
 */
export function getCaseStatusUpdateEmailTemplate(data: CaseStatusUpdateEmailData): {
  subject: string;
  html: string;
} {
  const statusEmoji: Record<string, string> = {
    SUBMITTED: '📝',
    UNDER_REVIEW: '👀',
    DOCUMENTS_REQUIRED: '📄',
    PROCESSING: '⚙️',
    APPROVED: '✅',
    REJECTED: '❌',
    CLOSED: '🔒',
  };

  const emoji = statusEmoji[data.newStatus] || '📋';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: #0066CC; color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">${emoji} Status Update</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>${data.clientName}</strong>,</p>
    
    <p>Your case <strong>${data.caseReference}</strong> has been updated.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Status changed from:</strong></p>
      <p style="margin: 0; padding: 10px; background: #e9ecef; border-radius: 6px; display: inline-block;">${data.oldStatus.replace(/_/g, ' ')}</p>
      <p style="margin: 15px 0 10px 0;"><strong>To:</strong></p>
      <p style="margin: 0; padding: 10px; background: #0066CC; color: white; border-radius: 6px; display: inline-block; font-weight: 600;">${data.newStatus.replace(/_/g, ' ')}</p>
    </div>
    
    ${
      data.notes
        ? `
    <div style="background: #fff3cd; padding: 16px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #856404;">Note from your advisor:</p>
      <p style="margin: 8px 0 0 0; color: #856404;">${data.notes}</p>
    </div>
    `
        : ''
    }
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/case/${data.caseId}" 
         style="background: #0066CC; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        View Case Details
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Best regards,<br/>
      <strong>${COMPANY_NAME}</strong>
    </p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `Case ${data.caseReference} - Status Update: ${data.newStatus.replace(/_/g, ' ')}`,
    html: minifyForProduction(html), // PERFORMANCE: Minify in production
  };
}

/**
 * Email template for document status update
 */
export function getDocumentStatusEmailTemplate(data: DocumentStatusEmailData): {
  subject: string;
  html: string;
} {
  const isApproved = data.status === 'APPROVED';
  const statusColor = isApproved ? '#28a745' : '#dc3545';
  const emoji = isApproved ? '✅' : '❌';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: ${statusColor}; color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">${emoji} Document ${data.status}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p>Dear <strong>${data.clientName}</strong>,</p>
    
    <p>Your document <strong>${data.documentName}</strong> for case <strong>${data.caseReference}</strong> has been ${isApproved ? 'approved' : 'rejected'}.</p>
    
    ${
      !isApproved && data.rejectionReason
        ? `
    <div style="background: #f8d7da; padding: 16px; border-radius: 8px; border-left: 4px solid #dc3545; margin: 20px 0;">
      <p style="margin: 0; font-weight: 600; color: #721c24;">Reason for rejection:</p>
      <p style="margin: 8px 0 0 0; color: #721c24;">${data.rejectionReason}</p>
    </div>
    <p>Please upload a corrected version of the document through your dashboard or mobile app.</p>
    `
        : ''
    }
    
    ${
      isApproved
        ? `
    <p>Your document has been verified and added to your case file. Thank you for your cooperation!</p>
    `
        : ''
    }
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}/(tabs)/documents" 
         style="background: ${statusColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        View Documents
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px;">
      Best regards,<br/>
      <strong>${COMPANY_NAME}</strong>
    </p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `Document ${isApproved ? 'Approved' : 'Rejected'} - ${data.caseReference}`,
    html: minifyForProduction(html), // PERFORMANCE: Minify in production
  };
}

/**
 * Email template for agent notification when case is assigned
 */
export function getAgentCaseAssignmentEmailTemplate(data: {
  agentName: string;
  caseReference: string;
  clientName: string;
  serviceType: string;
  priority: string;
  caseId: string;
}): {
  subject: string;
  html: string;
} {
  const priorityColors: Record<string, string> = {
    LOW: '#6c757d',
    NORMAL: '#0066CC',
    HIGH: '#fd7e14',
    URGENT: '#dc3545',
  };

  const priorityColor = priorityColors[data.priority] || '#0066CC';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Case Assignment</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🎯 New Case Assigned!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">You have a new case to review</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${data.agentName}</strong>,</p>
    
    <p style="font-size: 16px;">A new case has been assigned to you. Please review the details and contact the client within 24-48 hours.</p>
    
    <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #667eea;">
      <h3 style="margin: 0 0 16px 0; color: #667eea; font-size: 18px;">📋 Case Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666; width: 40%;">Case Reference:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #333;">${data.caseReference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Client:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #333;">${data.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Service Type:</td>
          <td style="padding: 8px 0; color: #333;">${data.serviceType.replace(/_/g, ' ')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Priority:</td>
          <td style="padding: 8px 0;">
            <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
              ${data.priority}
            </span>
          </td>
        </tr>
      </table>
    </div>
    
    <h3 style="color: #333; font-size: 18px; margin: 24px 0 12px 0;">📝 Your Next Steps</h3>
    <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
      <li>Review the case details and uploaded documents</li>
      <li>Contact the client within 24-48 hours</li>
      <li>Update the case status as you progress</li>
      <li>Use the chat feature for quick communication</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/cases/${data.caseId}" 
         style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25);">
        View Case Details
      </a>
    </div>
    
    <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        ⚡ <strong>Important:</strong> Please acknowledge this assignment by updating the case status or sending the client a message.
      </p>
    </div>
    
    <div style="border-top: 1px solid #e0e0e0; margin-top: 32px; padding-top: 24px;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        Best regards,<br/>
        <strong style="color: #333;">The ${COMPANY_NAME} Team</strong>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">© 2025 ${COMPANY_NAME}. All rights reserved.</p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `New Case Assigned: ${data.caseReference} - ${data.clientName}`,
    html: minifyForProduction(html),
  };
}

/**
 * Email template for case submission confirmation (to client)
 */
export function getCaseSubmissionConfirmationEmailTemplate(data: {
  clientName: string;
  caseReference: string;
  serviceType: string;
  caseId: string;
}): {
  subject: string;
  html: string;
} {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Case Submitted Successfully</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">✅ Case Submitted!</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your application has been received</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;">Dear <strong>${data.clientName}</strong>,</p>
    
    <p style="font-size: 16px;">Thank you for submitting your case to ${COMPANY_NAME}! We have successfully received your application and our team will review it shortly.</p>
    
    <div style="background: #d4edda; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #28a745;">
      <h3 style="margin: 0 0 16px 0; color: #155724; font-size: 18px;">📋 Submission Confirmation</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #155724; width: 40%;">Case Reference:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #155724;">${data.caseReference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #155724;">Service Type:</td>
          <td style="padding: 8px 0; color: #155724;">${data.serviceType.replace(/_/g, ' ')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #155724;">Status:</td>
          <td style="padding: 8px 0; color: #155724;">SUBMITTED</td>
        </tr>
      </table>
    </div>
    
    <h3 style="color: #333; font-size: 18px; margin: 24px 0 12px 0;">What Happens Next?</h3>
    <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
      <li>Our team will review your case within 24-48 hours</li>
      <li>We'll assign an experienced advisor to your case</li>
      <li>You'll receive an email notification once an advisor is assigned</li>
      <li>Your advisor will contact you to discuss next steps</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/case/${data.caseId}" 
         style="background: #28a745; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(40, 167, 69, 0.25);">
        Track Your Case
      </a>
    </div>
    
    <div style="background: #e8f4ff; padding: 16px; border-radius: 8px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #0066CC;">
        💡 <strong>Tip:</strong> You can track your case progress, upload documents, and chat with your advisor through the mobile app or web dashboard.
      </p>
    </div>
    
    <div style="border-top: 1px solid #e0e0e0; margin-top: 32px; padding-top: 24px;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        Thank you for choosing us,<br/>
        <strong style="color: #333;">The ${COMPANY_NAME} Team</strong>
      </p>
      <p style="color: #999; font-size: 12px; margin: 16px 0 0 0;">
        Please keep your case reference number <strong>${data.caseReference}</strong> for future correspondence.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">© 2025 ${COMPANY_NAME}. All rights reserved.</p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `Case ${data.caseReference} - Submission Confirmed`,
    html: minifyForProduction(html),
  };
}

/**
 * Email template for admin notification of new case submission
 */
export function getAdminNewCaseNotificationEmailTemplate(data: {
  caseReference: string;
  clientName: string;
  serviceType: string;
  priority: string;
  caseId: string;
}): {
  subject: string;
  html: string;
} {
  const priorityColors: Record<string, string> = {
    LOW: '#6c757d',
    NORMAL: '#0066CC',
    HIGH: '#fd7e14',
    URGENT: '#dc3545',
  };

  const priorityColor = priorityColors[data.priority] || '#0066CC';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Case Submission</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🔔 New Case Submitted</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Requires assignment to an advisor</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; margin-top: 0;"><strong>Admin Alert:</strong></p>
    
    <p style="font-size: 16px;">A new case has been submitted and is awaiting assignment to an advisor.</p>
    
    <div style="background: #f8f9fa; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #dc3545;">
      <h3 style="margin: 0 0 16px 0; color: #dc3545; font-size: 18px;">📋 Case Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666; width: 40%;">Case Reference:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #333;">${data.caseReference}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Client:</td>
          <td style="padding: 8px 0; font-weight: 700; color: #333;">${data.clientName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Service Type:</td>
          <td style="padding: 8px 0; color: #333;">${data.serviceType.replace(/_/g, ' ')}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: 600; color: #666;">Priority:</td>
          <td style="padding: 8px 0;">
            <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">
              ${data.priority}
            </span>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/dashboard/admin/cases/${data.caseId}" 
         style="background: #dc3545; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 53, 69, 0.25);">
        Assign Advisor
      </a>
    </div>
    
    <div style="background: #fff3cd; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        ⚠️ <strong>Action Required:</strong> Please assign an available advisor to this case as soon as possible.
      </p>
    </div>
    
    <div style="border-top: 1px solid #e0e0e0; margin-top: 32px; padding-top: 24px;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        System Notification<br/>
        <strong style="color: #333;">${COMPANY_NAME} Admin Dashboard</strong>
      </p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">© 2025 ${COMPANY_NAME}. All rights reserved.</p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `[ADMIN] New Case Submitted: ${data.caseReference} - ${data.clientName}`,
    html: minifyForProduction(html),
  };
}

/**
 * Email template for welcome message
 */
export function getWelcomeEmailTemplate(firstName: string): {
  subject: string;
  html: string;
} {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; padding: 40px 20px;">
    <h1 style="color: #0066CC; font-size: 32px; margin: 0;">Welcome to ${COMPANY_NAME}!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px;">
    <p>Dear <strong>${firstName}</strong>,</p>
    
    <p>Thank you for choosing ${COMPANY_NAME} for your immigration services. We're excited to help you achieve your goals!</p>
    
    <h3 style="color: #0066CC;">🚀 Get Started</h3>
    <ul style="line-height: 2;">
      <li>Submit your first case through the dashboard or mobile app</li>
      <li>Upload required documents securely</li>
      <li>Chat with your assigned advisor</li>
      <li>Track your case progress in real-time</li>
    </ul>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${APP_URL}/(tabs)/" 
         style="background: #0066CC; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        Go to Dashboard
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">
      Need help? Our support team is available 24/7. Just send us a message through the app!
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>© 2025 ${COMPANY_NAME}. All rights reserved.</p>
  </div>
  
</body>
</html>
  `;

  return {
    subject: `Welcome to ${COMPANY_NAME}!`,
    html: minifyForProduction(html), // PERFORMANCE: Minify in production
  };
}
