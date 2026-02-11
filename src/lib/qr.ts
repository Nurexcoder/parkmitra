import QRCode from 'qrcode';

// Generate QR code as base64 PNG
export async function generateQRCode(riderId: string): Promise<string> {
  try {
    // Generate QR code containing only the rider ID
    const qrCodeDataURL = await QRCode.toDataURL(riderId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
    });
    
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
