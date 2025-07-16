const axios = require('axios');

class Fast2SMSService {
  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY;
    this.baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
    
    if (!this.apiKey) {
      console.error('⚠️ Fast2SMS API key not configured');
      return;
    }
    
    console.log('✅ Fast2SMS service initialized');
  }

  // Check if service is configured
  isConfigured() {
    return !!this.apiKey;
  }

  // Format phone numbers for Fast2SMS (remove +91, keep 10 digits only)
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Remove country code if present
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      cleanNumber = cleanNumber.substring(2);
    }
    
    // Ensure it's 10 digits
    if (cleanNumber.length === 10) {
      return cleanNumber;
    }
    
    throw new Error(`Invalid phone number format: ${phoneNumber}`);
  }

  // Send SMS to single number
  async sendSMS(phoneNumber, message) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Fast2SMS service not configured' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      console.log(`📱 Sending SMS via Fast2SMS to ${formattedPhone}`);
      
      const response = await axios.post(this.baseUrl, new URLSearchParams({
        message: message,
        numbers: formattedPhone,
        route: 'q',
        language: 'english'
      }), {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.return === true) {
        console.log('✅ SMS sent successfully via Fast2SMS:', response.data.request_id);
        return {
          success: true,
          messageId: response.data.request_id,
          phone: formattedPhone,
          data: response.data
        };
      } else {
        console.error('❌ Fast2SMS API error:', response.data);
        return {
          success: false,
          error: response.data.message || 'Unknown error',
          phone: formattedPhone
        };
      }

    } catch (error) {
      console.error('❌ Failed to send SMS via Fast2SMS:', error.message);
      return {
        success: false,
        error: error.message,
        phone: phoneNumber
      };
    }
  }

  // Send SMS to multiple numbers
  async sendBulkSMS(phoneNumbers, message) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Fast2SMS service not configured' };
    }

    try {
      // Format all phone numbers
      const formattedNumbers = phoneNumbers.map(phone => this.formatPhoneNumber(phone));
      const numbersString = formattedNumbers.join(',');
      
      console.log(`📱 Sending bulk SMS via Fast2SMS to ${formattedNumbers.length} numbers`);
      
      const response = await axios.post(this.baseUrl, new URLSearchParams({
        message: message,
        numbers: numbersString,
        route: 'q',
        language: 'english'
      }), {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.return === true) {
        console.log('✅ Bulk SMS sent successfully via Fast2SMS:', response.data.request_id);
        return {
          success: true,
          messageId: response.data.request_id,
          phones: formattedNumbers,
          data: response.data
        };
      } else {
        console.error('❌ Fast2SMS bulk API error:', response.data);
        return {
          success: false,
          error: response.data.message || 'Unknown error',
          phones: formattedNumbers
        };
      }

    } catch (error) {
      console.error('❌ Failed to send bulk SMS via Fast2SMS:', error.message);
      return {
        success: false,
        error: error.message,
        phones: phoneNumbers
      };
    }
  }

  // Generate receipt message for SMS (shorter format due to SMS character limits)
  generateSMSReceiptMessage(donationData) {
    const balance = (parseFloat(donationData.totalAmount) || 0) - (parseFloat(donationData.amountPaid) || 0);
    
    let paymentDetails = '';
    if (donationData.paymentStatus === 'Completed') {
      paymentDetails = `Amount: Rs.${donationData.amountPaid || 0}`;
    } else {
      paymentDetails = `Paid: Rs.${donationData.amountPaid || 0}, Balance: Rs.${balance}`;
    }
    
    return `🕉️ ${process.env.DONATION_FUND_NAME || 'Ganpati Donation'}

RECEIPT
Name: ${donationData.name}
Phone: ${donationData.phone}
Address: ${donationData.wing}-${donationData.flat}, ${donationData.building}
Payment: ${donationData.paymentMethod}
Status: ${donationData.paymentStatus}

${paymentDetails}

🙏 Thank you for your donation!
Date: ${new Date().toLocaleDateString('en-IN')}`;
  }

  // Send receipt to user via SMS
  async sendReceiptToUser(donationData) {
    try {
      const message = this.generateSMSReceiptMessage(donationData);
      const result = await this.sendSMS(donationData.phone, message);
      
      return {
        ...result,
        recipient: 'user',
        channel: 'sms',
        phone: donationData.phone
      };
    } catch (error) {
      console.error('Error sending SMS receipt to user:', error);
      return {
        success: false,
        error: error.message,
        recipient: 'user',
        channel: 'sms',
        phone: donationData.phone
      };
    }
  }

  // Send receipt to admin via SMS
  async sendReceiptToAdmin(donationData) {
    try {
      const adminMessage = `🔔 NEW DONATION

${this.generateSMSReceiptMessage(donationData)}

📊 Admin Alert - Donation System`;

      const result = await this.sendSMS(process.env.ADMIN_PHONE, adminMessage);
      
      return {
        ...result,
        recipient: 'admin',
        channel: 'sms',
        phone: process.env.ADMIN_PHONE
      };
    } catch (error) {
      console.error('Error sending SMS receipt to admin:', error);
      return {
        success: false,
        error: error.message,
        recipient: 'admin',
        channel: 'sms',
        phone: process.env.ADMIN_PHONE
      };
    }
  }

  // Send receipt to multiple phone numbers (bulk)
  async sendReceiptToPhoneList(donationData, phoneNumbers) {
    try {
      const message = this.generateSMSReceiptMessage(donationData);
      const result = await this.sendBulkSMS(phoneNumbers, message);
      
      return {
        ...result,
        recipient: 'bulk',
        channel: 'sms',
        phones: phoneNumbers
      };
    } catch (error) {
      console.error('Error sending bulk SMS receipts:', error);
      return {
        success: false,
        error: error.message,
        recipient: 'bulk',
        channel: 'sms',
        phones: phoneNumbers
      };
    }
  }

  // Test Fast2SMS connection
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, error: 'Fast2SMS service not configured' };
    }

    try {
      // Send a test message to the admin number
      const testMessage = `🧪 Fast2SMS Test Message\n\nThis is a test message to verify Fast2SMS integration.\n\nTime: ${new Date().toLocaleString('en-IN')}`;
      
      const result = await this.sendSMS(process.env.ADMIN_PHONE, testMessage);
      
      return {
        success: result.success,
        message: result.success ? 'Test SMS sent successfully' : 'Test SMS failed',
        data: result
      };
    } catch (error) {
      console.error('Fast2SMS connection test failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new Fast2SMSService();
