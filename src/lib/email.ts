import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendQREmail(
  riderEmail: string,
  riderName: string,
  qrCodeBase64: string
): Promise<void> {
  try {
    // Extract base64 data from data URL
    const base64Data = qrCodeBase64.split(',')[1];
    
    await resend.emails.send({
      from: 'ParkMitra <onboarding@resend.dev>',
      to: riderEmail,
      subject: 'Your ParkMitra QR Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
              }
              .content {
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
              }
              .qr-container {
                text-align: center;
                margin: 30px 0;
                padding: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .qr-code {
                max-width: 300px;
                height: auto;
              }
              .instructions {
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
              }
              .instructions h3 {
                color: #667eea;
                margin-top: 0;
              }
              .instructions ul {
                padding-left: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🅿️ ParkMitra</h1>
              <p>Your Smart Parking Solution</p>
            </div>
            <div class="content">
              <h2>Welcome, ${riderName}!</h2>
              <p>Your ParkMitra account has been created successfully. Below is your unique QR code for parking access.</p>
              
              <div class="qr-container">
                <img src="${qrCodeBase64}" alt="Your QR Code" class="qr-code" />
                <p><strong>Save this QR code</strong></p>
              </div>

              <div class="instructions">
                <h3>How to Use:</h3>
                <ul>
                  <li>Show this QR code at the parking entry gate</li>
                  <li>The admin will scan it to record your entry time</li>
                  <li>Show the same QR code when exiting</li>
                  <li>Payment will be calculated based on your parking duration</li>
                </ul>
                
                <h3>Pricing:</h3>
                <ul>
                  <li>First 30 minutes: ₹20</li>
                  <li>More than 30 minutes: ₹30 (flat rate)</li>
                </ul>
              </div>

              <div class="footer">
                <p>This is an automated email. Please do not reply.</p>
                <p>© 2026 ParkMitra - Kolkata</p>
              </div>
            </div>
          </body>
        </html>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: base64Data,
        },
      ],
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send QR code email');
  }
}
