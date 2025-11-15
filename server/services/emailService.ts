import 'dotenv/config';

const MAILJET_API_KEY = process.env.MAILJET_API_KEY || '2c7350eda7ba27a0352d8762da8abdb1';
const MAILJET_SECRET_KEY = process.env.MAILJET_SECRET_KEY || '3b8d3d04c0631c9938510c2a3287fb4a';
const SENDER_EMAIL = 'theo.luu13@gmail.com';
const SENDER_NAME = 'Alloy Procurement';

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailContent {
  subject: string;
  textPart: string;
  htmlPart: string;
}

export interface SendEmailRequest {
  to: EmailRecipient[];
  subject: string;
  textPart: string;
  htmlPart: string;
  customId?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageIds: string[];
  messageUUIDs: string[];
  errors?: string[];
}

export async function sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    // For hackathon: use theo.luu13@gmail.com for both sender and receiver
    const messages = request.to.map(recipient => ({
      From: {
        Email: SENDER_EMAIL,
        Name: SENDER_NAME,
      },
      To: [
        {
          Email: SENDER_EMAIL, // Send to theo.luu13@gmail.com instead of actual vendor
          Name: recipient.name || recipient.email,
        },
      ],
      Subject: request.subject,
      TextPart: request.textPart,
      HTMLPart: request.htmlPart,
      CustomID: request.customId || `order-${Date.now()}`,
      Headers: {
        'Reply-To': SENDER_EMAIL,
        'X-Vendor-Original': recipient.email, // Store original vendor email in header
      },
    }));

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        Messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Mailjet API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Extract message IDs and UUIDs
    const messageIds: string[] = [];
    const messageUUIDs: string[] = [];
    const errors: string[] = [];

    if (data.Messages) {
      for (const message of data.Messages) {
        if (message.Status === 'success') {
          if (message.To) {
            for (const recipient of message.To) {
              if (recipient.MessageID) {
                messageIds.push(recipient.MessageID.toString());
              }
              if (recipient.MessageUUID) {
                messageUUIDs.push(recipient.MessageUUID);
              }
            }
          }
        } else if (message.Errors) {
          for (const error of message.Errors) {
            errors.push(error.ErrorMessage || 'Unknown error');
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      messageIds,
      messageUUIDs,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error('Error sending email via Mailjet:', error);
    throw error;
  }
}

