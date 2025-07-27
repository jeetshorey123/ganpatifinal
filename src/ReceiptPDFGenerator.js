import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from './supabaseClient';

class ReceiptPDFGenerator {
  constructor() {
    this.pdf = null;
  }

  // Create PDF receipt
  async generateReceiptPDF(donationData) {
    try {
      // Create a temporary HTML element for the receipt
      const receiptElement = this.createReceiptHTML(donationData);
      document.body.appendChild(receiptElement);

      // Convert HTML to canvas
      const canvas = await html2canvas(receiptElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false
      });

      // Remove the temporary element
      document.body.removeChild(receiptElement);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Generate filename
      const filename = `receipt_${donationData.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      
      // Convert to blob for upload
      const pdfBlob = pdf.output('blob');
      
      return {
        filename: filename,
        blob: pdfBlob,
        pdf: pdf
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Redesigned PDF receipt template
  createReceiptHTML(data) {
    const receiptDiv = document.createElement('div');
    receiptDiv.style.cssText = `
      width: 800px;
      padding: 40px;
      font-family: 'Segoe UI', 'Arial', sans-serif;
      background: linear-gradient(135deg, #181c2b 0%, #232a3d 100%);
      border: 3px solid #00fff7;
      border-radius: 24px;
      position: absolute;
      top: -9999px;
      left: -9999px;
      color: #fff;
      box-shadow: 0 0 40px #00fff7a0;
    `;

    const currentDate = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const totalAmount = parseFloat(data.total_amount || data.totalAmount || data.amount_paid || 0);
    const amountPaid = parseFloat(data.amount_paid || data.amountPaid || 0);
    const balanceAmount = Math.max(0, totalAmount - amountPaid);
    const addressText = (data.resident_type === 'Outsider' || data.residentType === 'Outsider')
      ? 'Outsider'
      : (data.wing ? `${data.wing}-${data.flat}, ${data.building}` : 'Not specified');

    receiptDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <img src='https://upload.wikimedia.org/wikipedia/commons/7/7e/Ganesh_icon.png' alt='Ganpati Logo' style='height: 60px; margin-bottom: 10px;' />
        <div style="font-size: 28px; font-weight: bold; color: #FFD700; margin-bottom: 6px; letter-spacing: 1.5px; text-shadow: 0 0 10px #FFD700;">
          Sankalp Utsav Samiti
        </div>
        <div style="font-size: 32px; font-weight: bold; color: #00fff7; margin-bottom: 10px; letter-spacing: 2px; text-shadow: 0 0 12px #00fff7;">
          GANPATI DONATION RECEIPT
        </div>
        <div style="font-size: 22px; font-weight: bold; color: #fff; margin-bottom: 20px; text-shadow: 0 0 8px #00fff7;">
          <span style="color:#00fff7">#${data.receipt_serial || data.id || 'N/A'}</span>
        </div>
        <div style="width: 100%; height: 4px; background: linear-gradient(90deg,#00fff7 0%,#00ffa3 100%); margin: 24px 0; border-radius: 2px;"></div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px; gap: 32px;">
        <div style="flex: 1; background: #232a3d; border-radius: 16px; padding: 22px; box-shadow: 0 0 12px #00fff7a0;">
          <div style="font-size: 20px; font-weight: bold; color: #00fff7; margin-bottom: 15px;">
            👤 Donor Details
          </div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Name:</strong> ${data.name}</div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Phone:</strong> ${data.phone}</div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Resident Type:</strong> ${data.resident_type || data.residentType || 'Not specified'}</div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Address:</strong> ${addressText}</div>
        </div>
        <div style="flex: 1; background: #232a3d; border-radius: 16px; padding: 22px; box-shadow: 0 0 12px #00fff7a0;">
          <div style="font-size: 20px; font-weight: bold; color: #00fff7; margin-bottom: 15px;">
            💰 Payment Details
          </div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Total Amount:</strong> <span style='color:#FFD700'>₹${totalAmount}</span></div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Amount Paid:</strong> <span style='color:#00ffa3'>₹${amountPaid}</span></div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Balance:</strong> <span style='color:#ff3d71'>₹${balanceAmount}</span></div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Payment Method:</strong> ${data.payment_method || data.paymentMethod}</div>
          <div style="margin-bottom: 10px; font-size: 17px;"><strong>Status:</strong> ${data.payment_status || data.paymentStatus}</div>
        </div>
      </div>

      <div style="background: #181c2b; padding: 20px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 0 8px #00fff7a0;">
        <div style="font-size: 18px; font-weight: bold; color: #00fff7; margin-bottom: 10px;">
          📅 Transaction Information
        </div>
        <div style="margin-bottom: 10px; font-size: 16px;"><strong>Date & Time:</strong> ${currentDate}</div>
        <div style="margin-bottom: 10px; font-size: 16px;"><strong>Receipt ID:</strong> ${data.receipt_serial || data.id || 'N/A'}</div>
        ${data.payment_id ? `<div style="margin-bottom: 10px; font-size: 16px;"><strong>Payment ID:</strong> ${data.payment_id}</div>` : ''}
      </div>

      <div style="text-align: center; margin-top: 40px;">
        <div style="font-size: 20px; font-weight: bold; color: #FFD700; margin-bottom: 10px; text-shadow: 0 0 8px #FFD700;">
          🙏 Thank you for your generous donation!
        </div>
        <div style="font-size: 16px; color: #00fff7;">
          May Lord Ganesha bless you and your family.
        </div>
      </div>

      <div style="margin-top: 30px; border-top: 2px solid #00fff7; padding-top: 20px; text-align: center;">
        <div style="font-size: 13px; color: #b5b5c3;">
          This is a computer-generated receipt. No signature required.
        </div>
      </div>
    `;

    return receiptDiv;
  }

  // Upload PDF to Supabase Storage
  async uploadPDFToStorage(pdfBlob, filename) {
    try {
      console.log('Uploading PDF to Supabase Storage:', filename);
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(`receipts/${filename}`, pdfBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      console.log('PDF uploaded successfully to Supabase:', data);

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(`receipts/${filename}`);

      const publicUrl = publicUrlData.publicUrl;
      console.log('Public URL generated:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        filename: filename,
        path: data.path
      };
    } catch (error) {
      console.error('Error uploading PDF to Supabase:', error);
      
      // Fallback: create local blob URL if Supabase upload fails
      console.log('Falling back to local blob URL');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      return {
        success: true,
        url: blobUrl,
        filename: filename,
        isLocal: true
      };
    }
  }

  // Generate and upload receipt
  async generateAndUploadReceipt(donationData) {
    try {
      console.log('Generating PDF receipt for:', donationData.name);
      
      // Generate PDF
      const pdfResult = await this.generateReceiptPDF(donationData);
      
      // Upload to storage
      const uploadResult = await this.uploadPDFToStorage(pdfResult.blob, pdfResult.filename);
      
      if (uploadResult.success) {
        console.log('Receipt uploaded successfully:', uploadResult.url);
        return {
          success: true,
          receiptUrl: uploadResult.url,
          filename: uploadResult.filename
        };
      } else {
        throw new Error(uploadResult.error);
      }
    } catch (error) {
      console.error('Error in generateAndUploadReceipt:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download PDF directly (for testing)
  async downloadReceiptPDF(donationData) {
    try {
      const pdfResult = await this.generateReceiptPDF(donationData);
      
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
      console.error('Error downloading PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default ReceiptPDFGenerator;

