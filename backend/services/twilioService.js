const twilio = require('twilio');

class TwilioService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    this.adminPhone = process.env.ADMIN_PHONE;
    
    if (!this.accountSid || !this.authToken || !this.whatsappNumber) {
      console.error('⚠️ Twilio credentials not properly configured');
      return;
    }
    
    this.client = twilio(this.accountSid, this.authToken);
    console.log('✅ Twilio WhatsApp service initialized');
  }

  // Check if service is configured
  isConfigured() {
    return !!(this.accountSid && this.authToken && this.whatsappNumber && this.client);
  }

  // Format phone number for WhatsApp
  formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }
    
    // Ensure it starts with +
    if (!cleanNumber.startsWith('+')) {
      cleanNumber = '+' + cleanNumber;
    }
    
    return `whatsapp:${cleanNumber}`;
  }

  // Send WhatsApp message
  async sendMessage(phoneNumber, message) {
    if (!this.isConfigured()) {
      return { success: false, error: 'Twilio WhatsApp service not configured' };
    }

    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      console.log(`📱 Sending WhatsApp message to ${formattedPhone}`);
      
      const messageResponse = await this.client.messages.create({
        body: message,
        from: this.whatsappNumber,
        to: formattedPhone
      });

      console.log('✅ WhatsApp message sent successfully:', messageResponse.sid);
      
      return {
        success: true,
        messageId: messageResponse.sid,
        status: messageResponse.status,
        phone: formattedPhone
      };

    } catch (error) {
      console.error('❌ Failed to send WhatsApp message:', error);
      return {
        success: false,
        error: error.message,
        code: error.code,
        phone: phoneNumber
      };
    }
  }

  // Generate receipt message
  generateReceiptMessage(donationData) {
    const balance = (parseFloat(donationData.totalAmount) || 0) - (parseFloat(donationData.amountPaid) || 0);
    
    let paymentDetails = '';
    if (donationData.paymentStatus === 'Completed') {
      paymentDetails = `💵 *Amount Paid:* ₹${donationData.amountPaid || 0}`;
    } else {
      paymentDetails = `💵 *Total Amount:* ₹${donationData.totalAmount || 0}
✅ *Paying Now:* ₹${donationData.amountPaid || 0}
⚖️ *Balance Amount:* ₹${balance}`;
    }
    
    return `🕉️ *${process.env.DONATION_FUND_NAME || 'Poonam Sagarcha Raja Donation Fund'}* 🕉️

*DONATION RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${donationData.name}
📞 *Phone:* ${donationData.phone}
🏠 *Address:* ${donationData.wing} Wing, Flat ${donationData.flat}, ${donationData.building}
💰 *Payment Method:* ${donationData.paymentMethod}
📊 *Status:* ${donationData.paymentStatus}

*PAYMENT DETAILS*
━━━━━━━━━━━━━━━━━━━━━━━━
${paymentDetails}

━━━━━━━━━━━━━━━━━━━━━━━━
🙏 *Thank you for your donation!*
📅 *Date & Time:* ${new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })}`;
  }

  // Send receipt to user
  async sendReceiptToUser(donationData) {
    try {
      const message = this.generateReceiptMessage(donationData);
      const result = await this.sendMessage(donationData.phone, message);
      
      return {
        ...result,
        recipient: 'user',
        phone: donationData.phone
      };
    } catch (error) {
      console.error('Error sending receipt to user:', error);
      return {
        success: false,
        error: error.message,
        recipient: 'user',
        phone: donationData.phone
      };
    }
  }

  // Send receipt to admin
  async sendReceiptToAdmin(donationData) {
    try {
      const adminMessage = `🔔 *NEW DONATION RECEIVED*

${this.generateReceiptMessage(donationData)}

━━━━━━━━━━━━━━━━━━━━━━━━
📊 *Admin Notification*
🔗 *System:* Donation Management System`;

      const result = await this.sendMessage(this.adminPhone, adminMessage);
      
      return {
        ...result,
        recipient: 'admin',
        phone: this.adminPhone
      };
    } catch (error) {
      console.error('Error sending receipt to admin:', error);
      return {
        success: false,
        error: error.message,
        recipient: 'admin',
        phone: this.adminPhone
      };
    }
  }

  // Send receipt to both user and admin
  async sendReceiptToAll(donationData) {
    const results = [];

    // Send to user
    const userResult = await this.sendReceiptToUser(donationData);
    results.push(userResult);

    // Send to admin (optional - can be disabled)
    if (this.adminPhone) {
      const adminResult = await this.sendReceiptToAdmin(donationData);
      results.push(adminResult);
    }

    return results;
  }

  // Test Twilio connection
  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, error: 'Twilio service not configured' };
    }

    try {
      // Test by getting account info
      const account = await this.client.api.accounts(this.accountSid).fetch();
      
      return {
        success: true,
        accountSid: account.sid,
        accountName: account.friendlyName,
        status: account.status,
        whatsappNumber: this.whatsappNumber
      };
    } catch (error) {
      console.error('Twilio connection test failed:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
}

module.exports = new TwilioService();
