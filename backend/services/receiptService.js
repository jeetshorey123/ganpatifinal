const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');
const twilioService = require('./twilioService');
// Fast2SMS service removed
const handlebars = require('handlebars');

class ReceiptService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (this.supabaseUrl && this.supabaseServiceKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
      console.log('✅ Receipt service initialized');
    }
  }

  // Generate receipt message (same as Twilio service)
  generateReceiptMessage(donationData) {
    return twilioService.generateReceiptMessage(donationData);
  }

  // Generate PDF receipt
  async generatePDFReceipt(donationData) {
    let browser;
    try {
      console.log('🔄 Generating PDF receipt...');

      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 1200 });

      const html = this.generateReceiptHTML(donationData);
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      console.log('✅ PDF receipt generated successfully');
      return pdfBuffer;

    } catch (error) {
      console.error('❌ Error generating PDF receipt:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Generate HTML template for PDF
  generateReceiptHTML(donationData) {
    const balance = (parseFloat(donationData.totalAmount) || 0) - (parseFloat(donationData.amountPaid) || 0);
    
    const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Donation Receipt</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 15px;
          padding: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #FF6B35;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #FF6B35;
          margin-bottom: 10px;
        }
        .title {
          font-size: 24px;
          color: #333;
          margin: 10px 0;
        }
        .receipt-number {
          background: #FF6B35;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          display: inline-block;
          margin-top: 10px;
        }
        .details-section {
          margin: 25px 0;
        }
        .section-title {
          background: #f8f9fa;
          padding: 12px 20px;
          border-left: 4px solid #FF6B35;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          border-radius: 0 8px 8px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
        }
        .detail-label {
          color: #666;
          font-weight: 500;
        }
        .detail-value {
          color: #333;
          font-weight: bold;
        }
        .amount-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }
        .amount-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .total-amount {
          font-size: 24px;
          font-weight: bold;
          border-top: 2px solid rgba(255,255,255,0.3);
          padding-top: 15px;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          color: #666;
        }
        .thank-you {
          font-size: 20px;
          color: #FF6B35;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .date-time {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 5px;
          font-size: 14px;
          margin-top: 15px;
        }
        .status-badge {
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .status-completed {
          background: #d4edda;
          color: #155724;
        }
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🕉️ ${process.env.DONATION_FUND_NAME || 'Poonam Sagarcha Raja Donation Fund'}</div>
          <div class="title">DONATION RECEIPT</div>
          <div class="receipt-number">Receipt #${Date.now()}</div>
        </div>

        <div class="details-section">
          <div class="section-title">📋 Donor Information</div>
          <div class="detail-row">
            <span class="detail-label">👤 Full Name:</span>
            <span class="detail-value">${donationData.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📞 Phone Number:</span>
            <span class="detail-value">${donationData.phone}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">🏠 Address:</span>
            <span class="detail-value">${donationData.wing} Wing, Flat ${donationData.flat}, ${donationData.building}</span>
          </div>
        </div>

        <div class="details-section">
          <div class="section-title">💳 Payment Information</div>
          <div class="detail-row">
            <span class="detail-label">💰 Payment Method:</span>
            <span class="detail-value">${donationData.paymentMethod}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">📊 Payment Status:</span>
            <span class="detail-value">
              <span class="status-badge ${donationData.paymentStatus === 'Completed' ? 'status-completed' : 'status-pending'}">
                ${donationData.paymentStatus}
              </span>
            </span>
          </div>
        </div>

        <div class="amount-section">
          <div class="amount-row">
            <span>💵 Total Amount:</span>
            <span>₹${donationData.totalAmount || 0}</span>
          </div>
          <div class="amount-row">
            <span>✅ Amount Paid:</span>
            <span>₹${donationData.amountPaid || 0}</span>
          </div>
          ${balance > 0 ? `
          <div class="amount-row">
            <span>⚖️ Balance Amount:</span>
            <span>₹${balance}</span>
          </div>
          ` : ''}
          <div class="amount-row total-amount">
            <span>💰 ${donationData.paymentStatus === 'Completed' ? 'Total Paid:' : 'Paid Now:'}</span>
            <span>₹${donationData.amountPaid || 0}</span>
          </div>
        </div>

        <div class="footer">
          <div class="thank-you">🙏 Thank you for your generous donation!</div>
          <p>Your contribution helps support our community initiatives and makes a real difference.</p>
          <div class="date-time">
            📅 Generated on: ${new Date().toLocaleString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            })}
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    return template;
  }

  // Upload PDF to Supabase storage
  async uploadPDFToStorage(pdfBuffer, filename) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not configured');
      }

      console.log(`📤 Uploading PDF to storage: ${filename}`);

      const { data, error } = await this.supabase.storage
        .from('receipts')
        .upload(filename, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('receipts')
        .getPublicUrl(filename);

      console.log('✅ PDF uploaded successfully');
      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('❌ Error uploading PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 🔗 Save receipt URL to donation record in database
  async updateDonationWithReceiptUrl(donationId, receiptUrl) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase not configured');
      }

      console.log(`💾 Updating donation ${donationId} with receipt URL...`);

      const { data, error } = await this.supabase
        .from('donations')
        .update({ 
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', donationId)
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ Donation updated with receipt URL successfully');
      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Error updating donation with receipt URL:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate filename for PDF
  generatePDFFilename(donationData) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = donationData.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `receipt_${safeName}_${timestamp}.pdf`;
  }

  // 🔗 Generate PDF receipt and store link in database (without sending)
  async generatePDFAndStoreLink(donationData) {
    try {
      console.log('🔄 Generating PDF receipt and storing link...');

      // Generate PDF
      const pdfBuffer = await this.generatePDFReceipt(donationData);
      
      // Upload to storage
      const filename = this.generatePDFFilename(donationData);
      const uploadResult = await this.uploadPDFToStorage(pdfBuffer, filename);

      if (!uploadResult.success) {
        throw new Error(`Failed to upload PDF: ${uploadResult.error}`);
      }

      // Update donation record with receipt URL (if donation ID exists)
      let updateResult = null;
      if (donationData.id) {
        updateResult = await this.updateDonationWithReceiptUrl(donationData.id, uploadResult.url);
        if (updateResult.success) {
          console.log('✅ Donation record updated with receipt URL');
        } else {
          console.warn('⚠️ Failed to update donation with receipt URL:', updateResult.error);
        }
      } else {
        console.warn('⚠️ No donation ID provided, receipt URL not saved to database');
      }

      return {
        success: true,
        pdf: {
          generated: true,
          filename: filename,
          size: pdfBuffer.length,
          url: uploadResult.url
        },
        storage: uploadResult,
        database: updateResult,
        message: 'PDF receipt generated and stored successfully.'
      };

    } catch (error) {
      console.error('❌ Error generating PDF and storing link:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 📄 Generate PDF receipt and upload to storage with URL saving
  async generateAndSendPDFReceipt(donationData) {
    try {
      console.log('🔄 Starting PDF receipt generation and sending...');

      // Generate PDF
      const pdfBuffer = await this.generatePDFReceipt(donationData);
      
      // Upload to storage
      const filename = this.generatePDFFilename(donationData);
      const uploadResult = await this.uploadPDFToStorage(pdfBuffer, filename);

      if (!uploadResult.success) {
        throw new Error(`Failed to upload PDF: ${uploadResult.error}`);
      }

      // Update donation record with receipt URL (if donation ID exists)
      let updateResult = null;
      if (donationData.id) {
        updateResult = await this.updateDonationWithReceiptUrl(donationData.id, uploadResult.url);
        if (updateResult.success) {
          console.log('✅ Donation record updated with receipt URL');
        } else {
          console.warn('⚠️ Failed to update donation with receipt URL:', updateResult.error);
        }
      } else {
        console.warn('⚠️ No donation ID provided, receipt URL not saved to database');
      }

      // Send PDF via WhatsApp (note: Twilio doesn't support media in sandbox)
      console.log('📱 PDF generated and stored. WhatsApp media sending requires approved Twilio account.');

      return {
        success: true,
        pdf: {
          generated: true,
          filename: filename,
          size: pdfBuffer.length,
          url: uploadResult.url
        },
        storage: uploadResult,
        database: updateResult,
        message: 'PDF receipt generated and stored. Text receipt sent via WhatsApp.'
      };

    } catch (error) {
      console.error('❌ Error in PDF receipt process:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send complete receipt (WhatsApp + SMS + PDF)
  async sendCompleteReceipt(donationData) {
    try {
      console.log('📱 Sending complete receipt (WhatsApp + SMS + PDF)...');

      const results = {
        whatsapp: null,
        sms: null,
        pdf: null,
        phone: donationData.phone,
        success: false
      };

      // Send WhatsApp receipt
      console.log('Step 1: Sending WhatsApp receipt...');
      results.whatsapp = await twilioService.sendReceiptToUser(donationData);

      // SMS functionality has been removed
      console.log('Step 2: Skipping SMS receipt (functionality removed)');
      results.sms = { success: false, message: 'SMS functionality removed' };

      // Generate PDF in background
      console.log('Step 3: Generating PDF receipt...');
      results.pdf = await this.generateAndSendPDFReceipt(donationData);

      // Mark as successful if at least one delivery method worked
      results.success = results.whatsapp?.success || results.sms?.success || results.pdf?.success;

      console.log('✅ Complete receipt process completed:', {
        whatsapp: results.whatsapp?.success,
        sms: results.sms?.success,
        pdf: results.pdf?.success,
        phone: donationData.phone
      });

      return results;

    } catch (error) {
      console.error('❌ Error sending complete receipt:', error);
      return {
        success: false,
        error: error.message,
        phone: donationData.phone
      };
    }
  }

  // Send receipt via Email only
  async sendEmailReceipt(donationData) {
    try {
      console.log('📧 Sending receipt via email...');

      // First generate and store PDF
      const pdfResult = await this.generatePDFAndStoreLink(donationData);
      
      if (!pdfResult.success) {
        throw new Error('Failed to generate PDF: ' + pdfResult.error);
      }

      // TODO: Add email service integration here
      // For now, we'll return success with PDF link stored
      console.log('✅ Email receipt process completed (PDF link stored in database)');
      
      return {
        success: true,
        method: 'email',
        email: donationData.email,
        pdfUrl: pdfResult.pdfUrl,
        message: 'Receipt generated and link saved to database. Email integration pending.'
      };

    } catch (error) {
      console.error('❌ Error sending email receipt:', error);
      return {
        success: false,
        error: error.message,
        method: 'email',
        email: donationData.email
      };
    }
  }

  // Send receipt to bulk phone list via SMS
  async sendReceiptToBulkSMS(donationData, phoneNumbers) {
    try {
      console.log(`📱 SMS functionality removed - not sending to ${phoneNumbers.length} numbers`);
      
      const result = { success: false, message: 'SMS functionality has been removed' };
      
      return {
        success: result.success,
        channel: 'bulk_sms',
        phones: phoneNumbers,
        data: result
      };

    } catch (error) {
      console.error('❌ Error sending bulk SMS receipts:', error);
      return {
        success: false,
        error: error.message,
        channel: 'bulk_sms',
        phones: phoneNumbers
      };
    }
  }
}

module.exports = new ReceiptService();
