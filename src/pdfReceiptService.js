import ReceiptPDFGenerator from './ReceiptPDFGenerator';
import { pdfStorageService } from './pdfStorageService';
import { facebookWhatsAppService } from './facebookWhatsAppService';

class PDFReceiptService {
  constructor() {
    this.pdfGenerator = new ReceiptPDFGenerator();
  }

  // Complete flow: Generate PDF, Upload, Send via WhatsApp
  async generateAndSendPDFReceipt(donationData) {
    try {
      console.log('Starting PDF receipt generation and sending process...');

      // Step 1: Ensure storage bucket exists
      const bucketResult = await pdfStorageService.createBucketIfNotExists();
      if (!bucketResult.success) {
        console.warn('Could not create/verify storage bucket:', bucketResult.error);
        // Continue anyway - might still work if bucket exists
      }

      // Step 2: Generate PDF
      console.log('Generating PDF receipt...');
      const pdfResult = await this.pdfGenerator.generateReceiptPDF(donationData);
      
      if (!pdfResult) {
        throw new Error('Failed to generate PDF');
      }

      // Step 3: Generate filename and upload to storage
      console.log('Uploading PDF to storage...');
      const filename = pdfStorageService.generatePDFFilename(donationData);
      const uploadResult = await pdfStorageService.uploadPDFToStorage(pdfResult.blob, filename);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload PDF: ${uploadResult.error}`);
      }

      // Step 4: Send via WhatsApp using Facebook API
      console.log('Sending PDF receipt via WhatsApp...');
      const whatsappResults = await facebookWhatsAppService.sendReceiptWithPDFToAll(
        donationData, 
        uploadResult.url, 
        filename
      );

      // Step 5: Process results
      const results = {
        pdf: {
          generated: true,
          filename: filename,
          url: uploadResult.url
        },
        whatsapp: this.processWhatsAppResults(whatsappResults),
        success: true
      };

      console.log('PDF receipt process completed:', results);
      return results;

    } catch (error) {
      console.error('Error in PDF receipt process:', error);
      return {
        pdf: { generated: false, error: error.message },
        whatsapp: { sent: false, error: error.message },
        success: false,
        error: error.message
      };
    }
  }

  // Process WhatsApp results to determine success/failure
  processWhatsAppResults(whatsappResults) {
    const results = {
      user: { textSent: false, pdfSent: false },
      admin: { textSent: false, pdfSent: false },
      summary: ''
    };

    whatsappResults.forEach(recipientResult => {
      const { recipient, results: messageResults } = recipientResult;
      
      messageResults.forEach(messageResult => {
        if (messageResult.type === 'text') {
          results[recipient].textSent = messageResult.success;
        } else if (messageResult.type === 'pdf') {
          results[recipient].pdfSent = messageResult.success;
        }
      });
    });

    // Generate summary message
    const userSuccess = results.user.textSent && results.user.pdfSent;
    const adminSuccess = results.admin.textSent && results.admin.pdfSent;

    if (userSuccess && adminSuccess) {
      results.summary = '✅ PDF receipts sent successfully to both user and admin!';
    } else if (userSuccess && !adminSuccess) {
      results.summary = '✅ PDF receipt sent to user, ⚠️ admin delivery failed';
    } else if (!userSuccess && adminSuccess) {
      results.summary = '⚠️ User PDF delivery failed, ✅ admin receipt sent';
    } else {
      results.summary = '❌ PDF receipt delivery failed for both user and admin';
    }

    return results;
  }

  // Send PDF receipt only to user
  async sendPDFReceiptToUser(donationData) {
    try {
      // Generate PDF
      const pdfResult = await this.pdfGenerator.generateReceiptPDF(donationData);
      const filename = pdfStorageService.generatePDFFilename(donationData);
      
      // Upload to storage
      const uploadResult = await pdfStorageService.uploadPDFToStorage(pdfResult.blob, filename);
      
      if (!uploadResult.success) {
        throw new Error(`Failed to upload PDF: ${uploadResult.error}`);
      }

      // Send to user only using Facebook WhatsApp API
      const results = await facebookWhatsAppService.sendReceiptWithPDF(
        donationData.phone, 
        donationData, 
        uploadResult.url, 
        filename
      );

      const textSent = results.find(r => r.type === 'text')?.success || false;
      const pdfSent = results.find(r => r.type === 'pdf')?.success || false;

      return {
        success: textSent && pdfSent,
        textSent,
        pdfSent,
        url: uploadResult.url,
        filename
      };

    } catch (error) {
      console.error('Error sending PDF receipt to user:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download PDF directly (for testing or manual sharing)
  async generatePDFForDownload(donationData) {
    try {
      const pdfResult = await this.pdfGenerator.generateReceiptPDF(donationData);
      
      if (!pdfResult) {
        throw new Error('Failed to generate PDF');
      }

      // Create download link
      const url = URL.createObjectURL(pdfResult.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename: pdfResult.filename
      };

    } catch (error) {
      console.error('Error generating PDF for download:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create and export singleton instance
export const pdfReceiptService = new PDFReceiptService();
export default pdfReceiptService;
