const express = require('express');
const router = express.Router();
const fast2smsService = require('../services/fast2smsService');

// Send SMS to single number
router.post('/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and message are required'
      });
    }

    const result = await fast2smsService.sendSMS(phoneNumber, message);
    res.json(result);

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send SMS to multiple numbers (bulk)
router.post('/send-bulk', async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;

    if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
      return res.status(400).json({
        success: false,
        error: 'Phone numbers array and message are required'
      });
    }

    const result = await fast2smsService.sendBulkSMS(phoneNumbers, message);
    res.json(result);

  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send receipt to user via SMS
router.post('/send-receipt', async (req, res) => {
  try {
    const donationData = req.body;

    if (!donationData.phone || !donationData.name) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and name are required'
      });
    }

    const result = await fast2smsService.sendReceiptToUser(donationData);
    res.json(result);

  } catch (error) {
    console.error('Error sending SMS receipt:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send receipt to phone list (bulk)
router.post('/send-receipt-bulk', async (req, res) => {
  try {
    const { donationData, phoneNumbers } = req.body;

    if (!donationData || !phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({
        success: false,
        error: 'Donation data and phone numbers array are required'
      });
    }

    const result = await fast2smsService.sendReceiptToPhoneList(donationData, phoneNumbers);
    res.json(result);

  } catch (error) {
    console.error('Error sending bulk SMS receipts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Fast2SMS connection
router.get('/test-connection', async (req, res) => {
  try {
    const result = await fast2smsService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Error testing Fast2SMS connection:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
