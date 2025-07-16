import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallback values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://pngzkvczhcuwwowztvcb.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ3prdmN6aGN1d3dvd3p0dmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzY5NzksImV4cCI6MjA2NzkxMjk3OX0.j0eHLlyXuySaZG41QH0pXA-iW1vT0HD-eiE99dwiF8w';

// Debug: Log environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database service functions
export const donationService = {
  // Insert a new donation record
  async insertDonation(donationData) {
    try {
      console.log('Attempting to insert donation:', donationData);
      
      // Calculate balance amount
      const totalAmount = parseFloat(donationData.totalAmount) || 0;
      const amountPaid = parseFloat(donationData.amountPaid) || 0;
      const balanceAmount = totalAmount - amountPaid;
      
      // First, try to determine what columns exist in the database
      const { data: testData } = await supabase
        .from('donations')
        .select('*')
        .limit(1);
      
      // Email functionality removed
      const hasResidentTypeColumn = testData && testData.length > 0 && testData[0].hasOwnProperty('resident_type');
      
      console.log('Database has resident_type column:', hasResidentTypeColumn);
      
      // Create insert data based on available columns
      const insertData = {
        name: donationData.name,
        phone: donationData.phone,
        wing: donationData.wing || null,
        flat: donationData.flat || null,
        building: donationData.building || null,
        payment_method: donationData.paymentMethod,
        payment_status: donationData.paymentStatus,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        receipt_delivery_preference: donationData.receiptDeliveryPreference || 'WhatsApp', // Add receipt preference
        // Don't insert balance_amount initially - let database calculate it or add it later
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_id: donationData.paymentId || donationData.razorpayPaymentId || null
      };

      // Email functionality removed
      
      if (hasResidentTypeColumn) {
        insertData.resident_type = donationData.residentType || 'Sankalp Resident';
        // Only set wing/flat/building for Sankalp Residents if resident_type column exists
        if (donationData.residentType !== 'Sankalp Resident') {
          insertData.wing = null;
          insertData.flat = null;
          insertData.building = null;
        }
      }

      console.log('Prepared insert data:', insertData);
      
      const { data, error } = await supabase
        .from('donations')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        return { success: false, error: error.message };
      }

      // After successful insert, update the balance_amount separately if needed
      if (data && data[0]) {
        const insertedId = data[0].id;
        try {
          await supabase
            .from('donations')
            .update({ balance_amount: balanceAmount })
            .eq('id', insertedId);
        } catch (balanceError) {
          console.log('Note: Could not update balance_amount, but main record inserted successfully');
        }
      }

      console.log('Donation inserted successfully:', data);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error in insertDonation:', error);
      return { success: false, error: error.message };
    }
  },

  // Alias for insertDonation for backward compatibility
  addDonation: async function(donationData) {
    console.log('addDonation called with:', donationData);
    return this.insertDonation(donationData);
  },

  // Get all donations
  async getAllDonations() {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donations:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getAllDonations:', error);
      return { success: false, error: error.message };
    }
  },

  // Get donations by building
  async getDonationsByBuilding(building) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .eq('building', building)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching donations by building:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getDonationsByBuilding:', error);
      return { success: false, error: error.message };
    }
  },

  // Get donation statistics
  async getDonationStats() {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('total_amount, amount_paid, payment_status');

      if (error) {
        console.error('Error fetching donation stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        totalDonations: data.length,
        totalAmountCollected: data.reduce((sum, donation) => sum + (donation.amount_paid || 0), 0),
        pendingAmount: data.reduce((sum, donation) => {
          if (donation.payment_status === 'Pending') {
            return sum + (donation.total_amount - donation.amount_paid);
          }
          return sum;
        }, 0),
        completedDonations: data.filter(d => d.payment_status === 'Completed').length,
        pendingDonations: data.filter(d => d.payment_status === 'Pending').length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error in getDonationStats:', error);
      return { success: false, error: error.message };
    }
  },

  // Update donation status
  async updateDonationStatus(id, paymentStatus, amountPaid = null, paymentId = null) {
    try {
      const updateData = {
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };

      if (amountPaid !== null) {
        updateData.amount_paid = parseFloat(amountPaid);
      }

      if (paymentId) {
        updateData.payment_id = paymentId;
      }

      const { data, error } = await supabase
        .from('donations')
        .update(updateData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating donation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error in updateDonationStatus:', error);
      return { success: false, error: error.message };
    }
  },

  // Update receipt URL for a donation
  // Removed duplicate updateReceiptUrl definition. Only keep one correct version below.

  // Get receipt URLs for a donation
  async getReceiptUrls(donationId) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('receipt_url, receipt_link')
        .eq('id', donationId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching receipt URLs:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all receipts (for admin view)
  async getAllReceipts() {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('id, name, created_at, receipt_url, receipt_link, payment_status, amount_paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching all receipts:', error);
      return { success: false, error: error.message };
    }
  },

  // Storage service functions
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

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(`receipts/${filename}`);

      return {
        success: true,
        url: publicUrlData.publicUrl,
        filename: filename,
        path: data.path
      };
    } catch (error) {
      console.error('Error uploading PDF to Supabase:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // List all uploaded receipts
  async listReceiptFiles() {
    try {
      const { data, error } = await supabase.storage
        .from('receipts')
        .list('receipts', {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('Error listing files:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in listReceiptFiles:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin transaction management methods
  async getRecentTransactions(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  async deleteTransaction(transactionId) {
    try {
      console.log('Deleting transaction from database with ID:', transactionId);
      
      // First check if the transaction exists
      const { data: existingTransaction, error: checkError } = await supabase
        .from('donations')
        .select('id, name, phone, amount_paid')
        .eq('id', transactionId)
        .single();

      if (checkError) {
        console.error('Error checking transaction existence:', checkError);
        return {
          success: false,
          error: 'Transaction not found or database error: ' + checkError.message
        };
      }

      if (!existingTransaction) {
        return {
          success: false,
          error: 'Transaction not found in database'
        };
      }

      console.log('Found transaction to delete:', existingTransaction);

      // Now delete the transaction
      const { error: deleteError } = await supabase
        .from('donations')
        .delete()
        .eq('id', transactionId);

      if (deleteError) {
        console.error('Error deleting transaction:', deleteError);
        return {
          success: false,
          error: 'Failed to delete from database: ' + deleteError.message
        };
      }

      console.log('Transaction successfully deleted from database');
      return {
        success: true,
        message: 'Transaction deleted successfully from database',
        deletedTransaction: existingTransaction
      };
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      return {
        success: false,
        error: 'Unexpected error: ' + error.message
      };
    }
  },

  // Email functionality removed
  async sendReceiptEmail(donationData, pdfUrl) {
    return { 
      success: false, 
      error: 'Email functionality has been removed from the system' 
    };
  },

  // Upload PDF receipt and get public URL
  async uploadPDFReceipt(pdfBlob, fileName) {
    try {
      console.log('Uploading PDF receipt:', fileName);
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        console.error("Upload failed:", error);
        return { success: false, error };
      }

      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      console.log('PDF uploaded successfully. URL:', urlData.publicUrl);
      return {
        success: true,
        data: urlData.publicUrl
      };
    } catch (error) {
      console.error("Error uploading PDF:", error);
      return { success: false, error };
    }
  },

  // Update transaction with receipt URL
  async updateReceiptUrl(transactionId, receiptUrl) {
    try {
      console.log('Updating receipt URL for transaction:', transactionId);
      
      const { data, error } = await supabase
        .from('donations')
        .update({ receipt_url: receiptUrl })
        .eq('id', transactionId)
        .select();

      if (error) {
        console.error("Failed to update receipt URL:", error);
        return { success: false, error };
      }

      console.log('Receipt URL updated successfully');
      return { success: true, data: data[0] };
    } catch (error) {
      console.error("Error updating receipt URL:", error);
      return { success: false, error };
    }
  },

  // Generate and upload PDF receipt
  async generateAndUploadReceipt(transaction) {
    try {
      console.log('Generating receipt for transaction:', transaction.id);
      
      // Generate PDF content
      const pdfContent = await this.generatePDFContent(transaction);
      const pdfBlob = new Blob([pdfContent], { type: 'application/pdf' });
      
      // Generate unique filename
      const fileName = `receipt_${transaction.id}_${Date.now()}.pdf`;
      
      // Upload PDF and get URL
      const uploadResult = await this.uploadPDFReceipt(pdfBlob, fileName);
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload PDF');
      }
      
      // Update transaction with receipt URL
      const updateResult = await this.updateReceiptUrl(transaction.id, uploadResult.data);
      
      if (!updateResult.success) {
        throw new Error('Failed to update transaction with receipt URL');
      }
      
      return {
        success: true,
        data: {
          receiptUrl: uploadResult.data,
          transaction: updateResult.data
        }
      };
    } catch (error) {
      console.error("Error generating and uploading receipt:", error);
      return { success: false, error };
    }
  },

  // Generate PDF content
  async generatePDFContent(transaction) {
    // You'll need to add a PDF generation library like jsPDF
    // This is a placeholder that returns a simple PDF ArrayBuffer
    const content = `
      Poonam Sagarcha Raja Donation Receipt
      
      Donor Name: ${transaction.name}
      Phone: ${transaction.phone}
      Amount: ₹${transaction.amount_paid}
      Date: ${new Date(transaction.created_at).toLocaleString()}
      
      Thank you for your donation!
    `;
    
    // Convert text to ArrayBuffer (in practice, use jsPDF or similar)
    const encoder = new TextEncoder();
    return encoder.encode(content);
  }
};

export default supabase;
