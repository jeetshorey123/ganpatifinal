import React, { useState, useEffect } from 'react';
import './App.css';
import ExportData from './ExportData';
import ReceiptPDFGenerator from './ReceiptPDFGenerator';
import AdminTransactions from './AdminTransactions';
import { donationService } from './supabaseClient';
import Ganpati from './ganpati1.jpg'
import Society from './society.jpg';
import Ganpati2 from './ganpati2.jpg'
import Ganpati3 from './ganpati3.jpg'
import Sports from './sports.jpg';
import Cultural from './cultural.jpg';
import Video from './video.mp4'
import Logo from './logo.jpg'
//import Logoback from './logo192.png'

function AppRouter() {
  const [currentPage, setCurrentPage] = useState('donation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'export':
        return <ExportData />;
      case 'admin':
        return <AdminTransactions />;
      case 'about':
        return <AboutUs />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsAndConditions />;
      case 'donation':
      default:
        return <DonationForm />;
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setIsMenuOpen(false); // Close menu on page change
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="app-router">
      <nav className="app-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <div className="logo-container">
              <img 
                src={Logo} 
                alt="Poonam Sagarcha Raja Logo" 
                className="nav-logo"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo192.png";
                }}
              />
              <div className="logo-glow-ring"></div>
            </div>
            <div className="brand-text">
              <h1>Poonam Sagar Cha Raja</h1>
              <div className="brand-subtitle">Divine Donation Portal</div>
              <div className="brand-subtitle">मन्नत के गणपति</div>
              <div className="brand-subtitle">नवसाचा गणपती</div>
            </div>
          </div>
          
          {/* Hamburger Menu Button */}
          <div className={`nav-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          
          {/* Navigation Links */}
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <button 
              className={currentPage === 'donation' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handlePageChange('donation')}
            >
              <span>💰 Donation Form</span>
            </button>
            <button 
              className={currentPage === 'about' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handlePageChange('about')}
            >
              <span>🏠 About Us</span>
            </button>
            <button 
              className={currentPage === 'export' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handlePageChange('export')}
            >
              <span>📊 Export Data</span>
            </button>
            <button 
              className={currentPage === 'admin' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handlePageChange('admin')}
            >
              <span>🛡️ Admin</span>
            </button>
            <button 
              className={currentPage === 'privacy' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handlePageChange('privacy')}
            >
              <span>🔒 Privacy Policy</span>
            </button>
            <button 
              className={currentPage === 'terms' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => handlePageChange('terms')}
            >
              <span>📋 Terms & Conditions</span>
            </button>
          </div>
        </div>
      </nav>
      
      <main className="app-main">
        {renderPage()}
      </main>
      
      <Footer />
    </div>
  );
}

function DonationForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    residentType: '',
    wing: '',
    flat: '',
    building: '',
    paymentMethod: '',
    paymentStatus: '',
    totalAmount: '',
    amountPaid: ''
  });

  const [submittedData, setSubmittedData] = useState(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [pdfReceiptUrl, setPdfReceiptUrl] = useState(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
  const [adminLoginError, setAdminLoginError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => {
      const updatedData = {
        ...prev,
        [name]: value
      };

      // If resident type changes, clear address fields
      if (name === 'residentType') {
        updatedData.wing = '';
        updatedData.flat = '';
        updatedData.building = '';
      }

      // If payment status is completed, set amount paid equal to total amount
      if (name === 'paymentStatus' && value === 'Completed') {
        updatedData.amountPaid = updatedData.totalAmount;
      }
      
      // If payment status is pending, clear amount paid to allow manual entry
      if (name === 'paymentStatus' && value === 'Pending') {
        updatedData.amountPaid = '';
      }
      
      // If total amount changes and payment status is completed, update amount paid
      if (name === 'totalAmount' && prev.paymentStatus === 'Completed') {
        updatedData.amountPaid = value;
      }

      return updatedData;
    });
  };

  // Calculate balance amount
  const calculateBalance = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    const paid = parseFloat(formData.amountPaid) || 0;
    return Math.max(0, total - paid);
  };

  // Generate receipt message
  const generateReceiptMessage = (data = submittedData) => {
    if (!data) return '';

    const balanceAmount = calculateBalance();
    const currentDate = new Date().toLocaleString();

    // Format address based on resident type
    const addressText = data.residentType === 'Sankalp Resident' 
      ? `${data.wing}-${data.flat}, ${data.building}`
      : 'Outsider';

    return `🕉️ *POONAM SAGARCHA RAJA* 🕉️

*DONATION RECEIPT*
━━━━━━━━━━━━━━━━━━━━━━━━

👤 *Donor Details:*
Name: ${data.name}
Phone: ${data.phone}
Resident Type: ${data.residentType}
Address: ${addressText}

💰 *Payment Details:*
Total Amount: ₹${data.totalAmount}
Amount Paid: ₹${data.amountPaid}
Balance: ₹${balanceAmount}
Payment Method: ${data.paymentMethod}
Status: ${data.paymentStatus}

📅 *Date & Time:* ${currentDate}

🙏 *Thank you for your generous donation!*
May Lord Ganesha bless you and your family.

━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // Send WhatsApp message
  const sendWhatsApp = () => {
    const message = encodeURIComponent(generateReceiptMessage());
    const donorPhone = submittedData.phone.replace(/[^0-9]/g, '');

    // Ensure phone number starts with country code
    const formattedPhone = donorPhone.startsWith('91') ? donorPhone : `91${donorPhone}`;

    // Try to open WhatsApp app first, then fallback to web
    const whatsappAppUrl = `whatsapp://send?phone=${formattedPhone}&text=${message}`;
    const whatsappWebUrl = `https://wa.me/${formattedPhone}?text=${message}`;

    // Check if on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // On mobile, try to open WhatsApp app
      window.location.href = whatsappAppUrl;
    } else {
      // On desktop, open WhatsApp Web
      window.open(whatsappWebUrl, '_blank');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateReceiptMessage());
      alert('Receipt copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  // Download PDF receipt
  const downloadPDFReceipt = async () => {
    try {
      setIsPdfGenerating(true);
      
      // If PDF URL is already available (from Supabase Storage), use it
      if (pdfReceiptUrl && pdfReceiptUrl !== 'Not Generated') {
        // Create a temporary link to download the PDF from Supabase Storage
        const link = document.createElement('a');
        link.href = pdfReceiptUrl;
        link.download = `receipt_${submittedData.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('PDF receipt downloaded successfully!');
      } else {
        // Generate and download PDF locally
        const pdfGenerator = new ReceiptPDFGenerator();
        const result = await pdfGenerator.downloadReceiptPDF(submittedData);
        
        if (result.success) {
          alert('PDF receipt downloaded successfully!');
        } else {
          alert('Failed to generate PDF receipt. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      setIsPaymentProcessing(true);
      
      // Use the amount paid field for the payment amount
      const paymentAmount = parseFloat(formData.amountPaid) || parseFloat(formData.totalAmount);
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_B3kzlWfmfYWp6J',
        amount: paymentAmount * 100,
        currency: 'INR',
        name: 'Poonam Sagarcha Raja Donation Fund',
        description: 'UPI Donation Payment',
        image: '/logo192.png',
        prefill: {
          name: formData.name,
          contact: formData.phone,
        },
        method: {
          upi: true,
          card: false,
          netbanking: false,
          wallet: false,
        },
        theme: {
          color: '#8B4513'
        },
        handler: async function (response) {
          console.log('Payment successful:', response);
          
          // Update form data with payment details
          const updatedFormData = {
            ...formData,
            paymentMethod: 'UPI',
            // Set payment status based on whether full or partial payment
            paymentStatus: (paymentAmount >= parseFloat(formData.totalAmount)) ? 'Completed' : 'Pending',
            amountPaid: paymentAmount.toString(),
            razorpayPaymentId: response.razorpay_payment_id
          };
          
          // Save to database
          const result = await donationService.insertDonation(updatedFormData);
          
          if (result.success) {
            const donationRecord = result.data;
            setSubmittedData({...updatedFormData, id: donationRecord.id});
            
            // Generate PDF receipt
            const pdfGenerator = new ReceiptPDFGenerator();
            const pdfResult = await pdfGenerator.generateAndUploadReceipt({
              ...updatedFormData,
              id: donationRecord.id
            });
            
            if (pdfResult.success) {
              // Update database with receipt URL
              await donationService.updateReceiptUrl(donationRecord.id, pdfResult.receiptUrl);
              // Store PDF URL for immediate download
              setPdfReceiptUrl(pdfResult.receiptUrl);
              console.log('Receipt PDF generated and URL updated');
            }
            
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}\n\nReceipt is being sent to admin and PDF is being generated...`);
          } else {
            console.error('Error saving payment to database:', result.error);
            setSubmittedData(updatedFormData);
            alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}\n\nReceipt is being sent to admin, but failed to save to database.`);
          }
        },
        modal: {
          ondismiss: function() {
            setIsPaymentProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      alert('Error initiating payment. Please try again.');
      setIsPaymentProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Submitting donation with data:', formData);
      const result = await donationService.insertDonation(formData);
      
      if (result.success) {
        const donationRecord = result.data;
        setSubmittedData({...formData, id: donationRecord.id});
        
        // Generate PDF receipt
        const pdfGenerator = new ReceiptPDFGenerator();
        const pdfResult = await pdfGenerator.generateAndUploadReceipt({
          ...formData,
          id: donationRecord.id
        });
        
        if (pdfResult.success) {
          // Update database with receipt URL
          await donationService.updateReceiptUrl(donationRecord.id, pdfResult.receiptUrl);
          // Store PDF URL for immediate download
          setPdfReceiptUrl(pdfResult.receiptUrl);
          console.log('Receipt PDF generated and URL updated');
          
          // Email functionality has been removed

          // If receipt preference is Download, trigger PDF download immediately
          if (formData.receiptDeliveryPreference === 'Download') {
            const pdfGenerator = new ReceiptPDFGenerator();
            await pdfGenerator.downloadReceiptPDF({
              ...formData,
              id: donationRecord.id
            });
          }
        }
        
        // Auto-send WhatsApp only if WhatsApp is selected
        if (formData.receiptDeliveryPreference === 'WhatsApp') {
          setTimeout(() => {
            const message = encodeURIComponent(generateReceiptMessage(formData));
            const donorPhone = formData.phone.replace(/[^0-9]/g, '');
            const formattedPhone = donorPhone.startsWith('91') ? donorPhone : `91${donorPhone}`;
            const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
            window.open(whatsappUrl, '_blank');
          }, 1000);
        }
        
        alert('Donation recorded successfully! Receipt is being sent to admin and PDF is being generated...');
      } else {
        console.error('Error saving donation:', result.error);
        alert(`Failed to save donation to database: ${result.error}\n\nPlease contact admin if this persists.`);
        // Don't set submittedData on failure
      }
    } catch (error) {
      console.error('Error saving donation:', error);
      alert(`Error saving donation: ${error.message}\n\nPlease contact admin if this persists.`);
    }
  };

  const handleAdminLoginChange = (e) => {
    const { name, value } = e.target;
    setAdminLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminLoginData.username === 'admin' && adminLoginData.password === 'admin123') {
      setIsAdminAuthenticated(true);
      setAdminLoginError('');
      setShowConfirmation(true);
    } else {
      setAdminLoginError('Invalid admin credentials');
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit} className="donation-form">
        <h2>🕉️ Poonam Sagarcha Raja 🕉️</h2>
        
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="Enter your phone number"
            pattern="[0-9]{10}"
          />
        </div>

        <div className="form-group">
          <label>Resident Type *</label>
          <select
            name="residentType"
            value={formData.residentType}
            onChange={handleChange}
            required
          >
            <option value="">Select Resident Type</option>
            <option value="Sankalp Resident">Sankalp Resident</option>
            <option value="Outsider">Outsider</option>
          </select>
        </div>

        {formData.residentType === 'Sankalp Resident' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Wing *</label>
                <select
                  name="wing"
                  value={formData.wing}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Wing</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Flat Number *</label>
                <input
                  type="text"
                  name="flat"
                  value={formData.flat}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 101, 102"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Building *</label>
              <select
                name="building"
                value={formData.building}
                onChange={handleChange}
                required
              >
                <option value="">Select Building</option>
                <option value="Sankalp 1">Sankalp 1</option>
                <option value="Sankalp 2">Sankalp 2</option>
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Payment Method *</label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            required
          >
            <option value="">Select Payment Method</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div className="form-group receipt-preference">
          <label htmlFor="receiptDeliveryPreference">
            <span className="icon">📬</span> Choose Receipt Delivery Preference:
          </label>
          <select
            id="receiptDeliveryPreference"
            name="receiptDeliveryPreference"
            value={formData.receiptDeliveryPreference}
            onChange={handleChange}
            className="receipt-preference-select"
            required
          >
            <option value="">Select delivery method</option>
            <option value="WhatsApp">📱 WhatsApp</option>
            <option value="Download">⬇️ Download Now</option>
          </select>
        </div>

        <div className="form-group">
          <label>Payment Status *</label>
          <select
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleChange}
            required
          >
            <option value="">Select Payment Status</option>
            <option value="Completed">Full Payment</option>
            <option value="Pending">Partial Payment</option>
          </select>
        </div>

        <div className="form-group">
          <label>Total Amount (₹) *</label>
          <input
            type="number"
            name="totalAmount"
            value={formData.totalAmount}
            onChange={handleChange}
            required
            min="1"
            placeholder="Enter total amount"
          />
        </div>

        <div className="form-group">
          <label>Amount Paid (₹) *</label>
          <input
            type="number"
            name="amountPaid"
            value={formData.amountPaid}
            onChange={handleChange}
            required
            min="0"
            max={formData.totalAmount}
            placeholder="Enter amount paid"
            readOnly={formData.paymentStatus === 'Completed'}
          />
        </div>

        {formData.totalAmount && formData.amountPaid && (
          <div className="balance-info">
            <strong>Balance Amount: ₹{calculateBalance()}</strong>
          </div>
        )}

        <div className="form-actions">
          {formData.paymentMethod === 'UPI' && 
           formData.name && formData.phone && formData.residentType &&
           (formData.residentType === 'Outsider' || (formData.wing && formData.flat && formData.building)) &&
           formData.totalAmount && formData.amountPaid && (
            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={isPaymentProcessing}
              className="razorpay-btn"
            >
              {isPaymentProcessing ? 'Processing...' : '💳 Pay with UPI'}
            </button>
          )}
          
          {formData.paymentMethod === 'UPI' && 
           (!formData.name || !formData.phone || !formData.residentType ||
            (formData.residentType === 'Sankalp Resident' && (!formData.wing || !formData.flat || !formData.building)) ||
            !formData.totalAmount || !formData.amountPaid) && (
            <div className="validation-message">
              <p>⚠️ Please fill all required fields to proceed with UPI payment</p>
            </div>
          )}
          
          {formData.paymentMethod !== 'UPI' && (
            <div className="payment-section">
              <div className="form-group submit-container">
                <button type="submit" className="submit-btn">
                  {isPaymentProcessing ? '⏳ Processing...' : '� Make Payment'}
                </button>
                {!formData.receiptDeliveryPreference && (
                  <div className="validation-hint">
                    Please select how you'd like to receive your receipt
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      {submittedData && (
        <div className="success-message">
          <h3>✅ Donation Recorded Successfully!</h3>
          <div className="receipt-details">
            <p><strong>Name:</strong> {submittedData.name}</p>
            <p><strong>Phone:</strong> {submittedData.phone}</p>
            <p><strong>Resident Type:</strong> {submittedData.residentType}</p>
            {submittedData.residentType === 'Sankalp Resident' && (
              <p><strong>Address:</strong> {submittedData.wing}-{submittedData.flat}, {submittedData.building}</p>
            )}
            <p><strong>Amount Paid:</strong> ₹{submittedData.amountPaid}</p>
            <p><strong>Payment Method:</strong> {submittedData.paymentMethod}</p>
            <p><strong>Status:</strong> {submittedData.paymentStatus}</p>
            <p><strong>Balance:</strong> ₹{calculateBalance()}</p>
          </div>
          
          <div className="receipt-actions">
            <h4>Receipt Actions:</h4>
            {submittedData.receiptDeliveryPreference === 'Download' ? (
              <>
                <div className="pdf-ready-notice">
                  ✅ Your PDF Receipt has been downloaded!
                </div>
                <button type="button" onClick={downloadPDFReceipt} className="pdf-btn" disabled={isPdfGenerating}>
                  ⬇️ Download Again
                </button>
                {pdfReceiptUrl && (
                  <button type="button" onClick={() => window.open(pdfReceiptUrl, '_blank')} className="pdf-btn">
                    � Open PDF in New Tab
                  </button>
                )}
              </>
            ) : submittedData.receiptDeliveryPreference === 'WhatsApp' ? (
              <div className="whatsapp-notice">
                ✅ Receipt will be sent via WhatsApp
              </div>
            ) : (
              <>
                <div className="email-notice">
                  ✅ Receipt will be sent to your email
                </div>
                <button type="button" onClick={copyToClipboard} className="copy-btn">
                  � Copy Receipt Text
                </button>
              </>
            )}
            
          </div>
          {!isAdminAuthenticated && submittedData.receiptDeliveryPreference === 'WhatsApp' && (
            <div className="admin-login-container">
              <h3>🔐 Admin Login Required</h3>
              <form onSubmit={handleAdminLogin} className="admin-login-form">
                <div className="form-group">
                  <label>Admin Username</label>
                  <input
                    type="text"
                    name="username"
                    value={adminLoginData.username}
                    onChange={handleAdminLoginChange}
                    required
                    placeholder="Enter admin username"
                  />
                </div>
                <div className="form-group">
                  <label>Admin Password</label>
                  <input
                    type="password"
                    name="password"
                    value={adminLoginData.password}
                    onChange={handleAdminLoginChange}
                    required
                    placeholder="Enter admin password"
                  />
                </div>
                {adminLoginError && <div className="error-message">❌ {adminLoginError}</div>}
                <button type="submit" className="admin-login-btn">🔑 Login</button>
              </form>
            </div>
          )}

          {isAdminAuthenticated && showConfirmation && (
            <div className="confirmation-container">
              <h3>✅ Admin Login Successful</h3>
              <p>Do you want to send the receipt via WhatsApp?</p>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmation(false);
                  sendWhatsApp();
                }}
                className="confirm-btn"
              >
                📱 Yes, Send Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="cancel-btn"
              >
                ❌ No, Cancel
              </button>
            </div>
          )}

          {isAdminAuthenticated && submittedData.receiptDeliveryPreference === 'WhatsApp' && !showConfirmation && (
            <button
              type="button"
              onClick={sendWhatsApp}
              className="whatsapp-btn"
            >
              📱 Send Receipt via WhatsApp
            </button>
          )
          }
        </div>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>🕉️ Poonam Sagarcha Raja</h4>
          <p>Supporting our community through devotion and service</p>
        </div>
        
        <div className="footer-section">
          <h4>📞 Support</h4>
          <p>Jeet: <a href="tel:9833232395">9833232395</a></p>
          <p>Rishi: <a href="tel:8169912193">8169912193</a></p>
          <p>Email: <a href="mailto:poonamsagarcharaja@gmail.com">poonamsagarcharaja@gmail.com</a></p>
        </div>
        
        <div className="footer-section">
          <h4>📋 Legal</h4>
          <p><a href="#" onClick={() => window.location.hash = 'privacy'}>Privacy Policy</a></p>
          <p><a href="#" onClick={() => window.location.hash = 'terms'}>Terms & Conditions</a></p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 Poonam Sagarcha Raja. All rights reserved.</p>
      </div>
    </footer>
  );
}

function PrivacyPolicy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p>Last updated: December 2024</p>
        <p>We value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website.</p>
        
        <h2>1. Information We Collect</h2>
        <p>When you make a donation or fill out a form, we may collect the following:</p>
        <ul>
          <li>Your name</li>
          <li>Email address</li>
          <li>Phone number (if provided)</li>
          <li>Address information (for residents)</li>
          <li>Transaction details (amount, payment ID, etc.)</li>
        </ul>
        
        <h2>2. How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul>
          <li>Process donations</li>
          <li>Send you donation receipts</li>
          <li>Maintain transaction records</li>
          <li>Respond to queries or provide support</li>
          <li>Send WhatsApp receipts (with admin approval)</li>
        </ul>
        
        <h2>3. Data Security</h2>
        <p>We take appropriate measures to protect your data. Transactions are processed through secure payment gateways like Razorpay. We do not store your card or banking information on our servers.</p>
        
        <h2>4. Sharing Your Information</h2>
        <p>We do not sell, trade, or share your personal data with third parties, except where legally required or necessary for donation processing.</p>
        
        <h2>5. Cookies</h2>
        <p>Our website may use basic cookies for improving user experience. No personally identifiable information is stored in cookies.</p>
        
        <h2>6. Your Consent</h2>
        <p>By using our website and submitting your details, you consent to this Privacy Policy.</p>
        
        <h2>7. Changes to This Policy</h2>
        <p>We may update this Privacy Policy occasionally. Any changes will be posted on this page with a new update date.</p>
        
        <h2>8. Contact Us</h2>
        <p>If you have any questions about this policy, please contact us:</p>
        <ul>
          <li>Jeet: <strong>9833232395</strong></li>
          <li>Rishi: <strong>8169912193</strong></li>
          <li>Email: <strong>poonamsagarcharaja@gmail.com</strong></li>
        </ul>
      </div>
    </div>
  );
}

function TermsAndConditions() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <h1>Terms & Conditions</h1>
        <p>Last updated: December 2024</p>
        <p>These terms and conditions outline the rules and regulations for using our website. By accessing this website and making a donation, you agree to accept all terms and conditions written here.</p>
        
        <h2>1. Donations</h2>
        <p>All donations made through this website are voluntary and non-refundable unless stated otherwise. We reserve the right to reject or refund donations in exceptional cases.</p>
        
        <h2>2. Payment Processing</h2>
        <p>We use third-party services like Razorpay to securely process donations. We are not responsible for any errors or delays caused by these providers.</p>
        
        <h2>3. Receipt Generation</h2>
        <p>Once a donation is successfully processed, a receipt will be generated and can be delivered via WhatsApp or downloaded as PDF, based on your preference.</p>
        
        <h2>4. Use of Website</h2>
        <p>You agree to use this site only for lawful purposes. Any misuse, hacking attempts, or fraudulent activity will lead to permanent blocking and legal action if needed.</p>
        
        <h2>5. Intellectual Property</h2>
        <p>All content, logos, and images on this website are the property of Poonam Sagarcha Raja, unless otherwise stated. Unauthorized use is prohibited.</p>
        
        <h2>6. WhatsApp Receipt Delivery</h2>
        <p>WhatsApp receipt delivery requires admin authentication for security purposes. We are not responsible for delivery failures due to incorrect phone numbers or WhatsApp service issues.</p>
        
        <h2>7. Changes to the Terms</h2>
        <p>We reserve the right to modify these terms at any time. Continued use of the website implies acceptance of any updated terms.</p>
        
        <h2>8. Contact Us</h2>
        <p>For any queries regarding these terms, please contact:</p>
        <ul>
          <li>Jeet: <strong>9833232395</strong></li>
          <li>Rishi: <strong>8169912193</strong></li>
          <li>Email: <strong>poonamsagarcharaja@gmail.com</strong></li>
        </ul>
      </div>
    </div>
  );
}

function AboutUs() {
  return (
    <div className="legal-page about-us-page">
      <div className="legal-container about-us-container">
        <div className="hero-section">
          <div className="hero-content">
            <h1>🏠 About Us – Sankalp Society</h1>
            <div className="hero-subtitle">Where tradition meets togetherness, and every festival is celebrated with heart, devotion, and joy.</div>
          </div>
          <div className="hero-images">
            <img src={Ganpati} alt="Ganpati Festival Celebration" className="hero-image main" />
            <img src={Society} alt="Our Beautiful Society" className="hero-image secondary" />
          </div>
        </div>
        
        <div className="content-section">
          <div className="intro-text">
            <p>Welcome to <strong>Sankalp Society</strong> – a community where tradition meets togetherness, and every festival is celebrated with heart, devotion, and joy. We are a vibrant residential society that takes pride in nurturing a spirit of unity and cultural harmony through our shared celebrations, with our Ganpati festival at the very heart of it all.</p>
          </div>

          <div className="section-block ganpati-section">
            <div className="section-content">
              <h2>🕉️ Our Ganesh Utsav Celebration</h2>
              <p>At Sankalp Society, Ganesh Utsav is not just an event – it's an experience that brings every resident together in a shared expression of faith and festivity. For five unforgettable days, we welcome Lord Ganesha into our hearts and homes with grand devotion and collective enthusiasm. From the moment of Ganpati Aagman, the atmosphere transforms into one of warmth, color, music, and joy.</p>
            </div>
            <div className="section-images">
              <img src={Ganpati2} alt="Ganesh Utsav Celebrations" className="section-image" />
              <img src={Ganpati3} alt="Ganpati Festival Activities" className="section-image" />
            </div>
          </div>

          <div className="section-block">
            <h2>🍽️ Traditions & Rituals</h2>
            <p>Our celebrations begin with <strong>56 Bhog</strong>, a traditional offering of 56 varieties of food to Lord Ganesha, symbolizing abundance and gratitude. Each day is marked by soulful aartis, where residents of all ages come together in devotion and prayer, strengthening our spiritual bond and community spirit.</p>
          </div>

          <div className="section-block cultural-section">
            <div className="section-content">
              <h2>🎭 Cultural Activities & Entertainment</h2>
              <p>But it's not just about rituals – our Ganpati festival is a lively blend of culture, entertainment, and creativity. We host a variety of events that engage every age group, from sports tournaments and cultural performances to engaging activities like:</p>
              <div className="activities-grid">
                <div className="activity-item">🎲 Housie Games</div>
                <div className="activity-item">🎨 Drawing Competitions</div>
                <div className="activity-item">💅 Mehendi Design Contests</div>
                <div className="activity-item">🧠 Quiz Games</div>
                <div className="activity-item">🏆 Sports Tournaments</div>
                <div className="activity-item">🎭 Cultural Performances</div>
              </div>
            </div>
            <div className="section-images vertical">
              <img src={Sports} alt="Sports Activities" className="section-image" />
              <img src={Cultural} alt="Cultural Events" className="section-image" />
            </div>
          </div>

          <div className="section-block cultural-day-section">
            <div className="section-content">
              <h2>🎪 Cultural Day & Special Events</h2>
              <p>Our <strong>Cultural Day</strong> is a special highlight, where residents showcase their talents in music, dance, and drama – creating memories that last long after the celebrations end. The joy continues all the way to Visarjan Day, where we bid farewell to Bappa with a grand procession, dhol beats, and heartfelt dance – celebrating his presence and seeking his blessings until he returns next year.</p>
            </div>
            <div className="video-section">
              <video 
                src={Video}
                controls 
                poster="/ganpati1.jpg"
                className="celebration-video"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
              <p className="video-caption">Watch our amazing festival celebrations!</p>
            </div>
          </div>

          <div className="mission-section">
            <h2>💫 Our Mission</h2>
            <p>At Sankalp Society, we believe in the power of festivals to unite, uplift, and inspire. Whether it's Ganpati Utsav or any other occasion, our mission is to spread happiness, nurture bonds, and uphold our beautiful traditions with pride.</p>
          </div>

          <div className="closing-section">
            <div className="call-to-action">
              <h3>Join us as we celebrate not just festivals, but the spirit of togetherness.</h3>
              <p><strong>Sankalp Society – where every celebration feels like home.</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppRouter;
