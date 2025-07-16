import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import Footer from './Footer'; // Import the external Footer component
import './AdminAuth.css'; // Import admin authentication styles
import './AboutUs.css'; // Import new About Us styles
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

  // Admin authentication moved to DonationForm component

  return (
    <div className="app-router">
      {/* Admin Authentication Modal moved to DonationForm component */}
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
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [whatsappPendingData, setWhatsappPendingData] = useState(null);
  
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
            
            // Store pending WhatsApp data and show admin authentication modal
            setWhatsappPendingData({ donorPhone, message });
            setShowAdminAuth(true);
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

  // Admin authentication function
  const handleAdminAuth = (e) => {
    e.preventDefault();
    
    // These should be stored securely in a real application
    // For demo purposes only:
    const validUsername = 'admin';
    const validPassword = 'admin123';
    
    if (adminUsername === validUsername && adminPassword === validPassword) {
      // Authentication successful
      setShowAdminAuth(false);
      
      // Proceed with WhatsApp redirection
      if (whatsappPendingData) {
        const { donorPhone, message } = whatsappPendingData;
        const formattedPhone = donorPhone.startsWith('91') ? donorPhone : `91${donorPhone}`;
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
        window.open(whatsappUrl, '_blank');
        
        // Reset pending data
        setWhatsappPendingData(null);
      }
    } else {
      alert('Invalid admin credentials. Please try again.');
    }
    
    // Clear credentials
    setAdminPassword('');
  };

  return (
    <div className="home-page">
      {/* Admin Authentication Modal */}
      {showAdminAuth && (
        <div className="modal-overlay">
          <div className="admin-auth-modal">
            <h2>🔐 Admin Authentication</h2>
            <p>Please enter admin credentials to send WhatsApp receipt</p>
            
            <form onSubmit={handleAdminAuth}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Admin username"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  required
                />
              </div>
              
              <div className="button-group">
                <button type="submit" className="primary-button">Login</button>
                <button 
                  type="button" 
                  className="secondary-button"
                  onClick={() => {
                    setShowAdminAuth(false);
                    setWhatsappPendingData(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Poonam Sagarcha Raja</h1>
            <p className="hero-subtitle">Divine Donation Portal</p>
            <p className="hero-description">
              Support our community celebrations and contribute to the growth of our cultural heritage.
              Every donation helps us bring more joy and prosperity to our festivities.
            </p>
            <div className="hero-cta">
              <button className="cta-button" onClick={() => window.scrollTo({top: document.querySelector('.donation-form-container').offsetTop - 100, behavior: 'smooth'})}>Donate Now</button>
              <button className="cta-button secondary" onClick={() => window.scrollTo({top: document.querySelector('.donation-form-container').offsetTop - 100, behavior: 'smooth'})}>
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="image-container">
              {/* Use existing Ganpati image */}
              <img src={Ganpati} alt="Ganpati" className="main-image" />
              <div className="glow-effect"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Donate With Us?</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🙏</div>
            <h3>Divine Blessings</h3>
            <p>Every contribution brings divine blessings and prosperity to you and your family.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏮</div>
            <h3>Cultural Preservation</h3>
            <p>Help us preserve and celebrate our rich cultural traditions for generations to come.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Transparent Management</h3>
            <p>Full transparency in how your donations are utilized for community development.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧾</div>
            <h3>Digital Receipts</h3>
            <p>Receive instant digital receipts for all your generous contributions.</p>
          </div>
        </div>
      </section>
      
      {/* Donation Form Section */}
      <section className="donation-form-section">
        <div className="section-header">
          <h2 className="donation-title">Make Your Contribution</h2>
          <p className="donation-subtitle">Support our community and be a part of our divine celebrations</p>
        </div>
        
        <div className="donation-form-container">
          <div className="donation-benefits">
            <div className="benefit-card">
              <div className="benefit-icon">🙏</div>
              <h3>Divine Blessings</h3>
              <p>Receive blessings for you and your family</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📱</div>
              <h3>Instant Receipt</h3>
              <p>Get digital receipts immediately</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💫</div>
              <h3>Community Support</h3>
              <p>Help grow our cultural activities</p>
            </div>
          </div>

          <div className="card donation-form">
            <form onSubmit={handleSubmit} className="form-content">
              <div className="form-header">
                <h2>🕉️ Poonam Sagarcha Raja 🕉️</h2>
                <p>Fill in the details below to make your contribution</p>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="form-input"
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
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Resident Type *</label>
                  <select
                    name="residentType"
                    value={formData.residentType}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Resident Type</option>
                    <option value="Sankalp Resident">Sankalp Resident</option>
                    <option value="Outsider">Outsider</option>
                  </select>
                </div>

                {formData.residentType === 'Sankalp Resident' && (
                  <div className="resident-details">
                    <div className="form-group">
                      <label>Wing *</label>
                      <select
                        name="wing"
                        value={formData.wing}
                        onChange={handleChange}
                        required
                        className="form-select"
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
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Building *</label>
                      <select
                        name="building"
                        value={formData.building}
                        onChange={handleChange}
                        required
                        className="form-select"
                      >
                        <option value="">Select Building</option>
                        <option value="Sankalp 1">Sankalp 1</option>
                        <option value="Sankalp 2">Sankalp 2</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="form-group payment-details">
                  <label>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="receipt-label">
                    <span className="icon">📬</span> Receipt Delivery Preference *
                  </label>
                  <select
                    id="receiptDeliveryPreference"
                    name="receiptDeliveryPreference"
                    value={formData.receiptDeliveryPreference}
                    onChange={handleChange}
                    className="form-select"
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
                    className="form-select"
                  >
                    <option value="">Select Payment Status</option>
                    <option value="Completed">Full Payment</option>
                    <option value="Pending">Partial Payment</option>
                  </select>
                </div>

                <div className="form-group amount-group">
                  <label>Total Amount (₹) *</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Enter total amount"
                    className="form-input"
                  />
                </div>

                <div className="form-group amount-group">
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
                    className="form-input"
                  />
                </div>
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
                    {isPaymentProcessing ? '⏳ Processing...' : '💳 Pay with UPI'}
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
                        {isPaymentProcessing ? '⏳ Processing...' : '💰 Make Payment'}
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
          </div>
        </div>
      </section>
      
      {/* Donation stats section removed as requested */}
    </div>
  );
}

// Footer component has been moved to its own file: Footer.js

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
    <div className="about-us-page">
      <section className="about-hero">
        <div className="hero-background">
          <img src={Ganpati} alt="Lord Ganesha" />
        </div>
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Sankalp Society</h1>
          <p className="hero-subtitle">Where tradition meets togetherness, and every festival is celebrated with heart, devotion, and joy.</p>
        </div>
      </section>

      <main className="content-section">
        <div className="intro">
          <p>Welcome to <strong>Sankalp Society</strong> – a vibrant community where cultural harmony and spiritual traditions flourish. We take immense pride in fostering unity through our shared celebrations, with the magnificent Ganpati festival being the crown jewel of our cultural calendar.</p>
        </div>

        <section>
          <h2 className="section-title">🕉️ Our Ganesh Utsav Celebration</h2>
          <div className="images-grid">
            <div className="image-card">
              <img src={Ganpati2} alt="Ganesh Utsav Celebrations" />
              <div className="image-overlay">
                <h3>Grand Celebrations</h3>
                <p>Five days of devotion, culture, and community bonding</p>
              </div>
            </div>
            <div className="image-card">
              <img src={Ganpati3} alt="Ganpati Festival Activities" />
              <div className="image-overlay">
                <h3>Cultural Activities</h3>
                <p>Bringing together generations in joyous festivities</p>
              </div>
            </div>
          </div>
          <p>At Sankalp Society, Ganesh Utsav transcends being merely an event – it's a divine experience that unites every resident in a shared expression of faith and festivity. For five unforgettable days, we welcome Lord Ganesha into our hearts and homes with grand devotion and collective enthusiasm.</p>
        </section>

        <section className="traditions">
          <h2 className="section-title">🍽️ Sacred Traditions & Rituals</h2>
          <p>Our celebrations commence with the revered <strong>56 Bhog</strong>, a traditional offering of 56 varieties of food to Lord Ganesha, symbolizing abundance and gratitude. Each day is marked by soulful aartis, where residents of all ages come together in devotion and prayer, strengthening our spiritual bond and community spirit.</p>
        </section>

        <section className="video-section">
          <h2 className="section-title">📽️ Experience Our Celebrations</h2>
          <div className="video-container">
            <video 
              src={Video}
              controls
              poster={Ganpati2}
              className="feature-video"
            >
              Your browser does not support the video tag.
            </video>
            <div className="video-description">
              <h3>Witness the Magic</h3>
              <p>Take a glimpse into our vibrant celebrations and community spirit</p>
            </div>
          </div>
        </section>

        <section className="activities">
          <h2 className="section-title">🏆 Sports & Cultural Activities</h2>
          <div className="activities-grid">
            <div className="activity-card">
              <img src={Sports} alt="Sports Events" />
              <div className="activity-content">
                <h3>Sports Events</h3>
                <ul className="activities-list">
                  <li>🏏 Cricket Tournament</li>
                  <li>🏸 Badminton Championship</li>
                  <li>♟️ Chess Competition</li>
                  <li>🎯 Indoor Games</li>
                </ul>
              </div>
            </div>
            <div className="activity-card">
              <img src={Cultural} alt="Cultural Events" />
              <div className="activity-content">
                <h3>Cultural Events</h3>
                <ul className="activities-list">
                  <li>🎨 Art Competition</li>
                  <li>💃 Dance Performances</li>
                  <li>🎭 Drama Shows</li>
                  <li>🎵 Musical Evening</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="community">
          <h2 className="section-title">🏠 Our Beautiful Community</h2>
          <div className="images-grid">
            <div className="image-card">
              <img src={Society} alt="Our Beautiful Society" />
              <div className="image-overlay">
                <h3>Our Home</h3>
                <p>A place where every corner tells a story</p>
              </div>
            </div>
            <div className="image-card">
              <img src={Ganpati} alt="Festival Celebration" />
              <div className="image-overlay">
                <h3>Festival Spirit</h3>
                <p>Celebrating together as one family</p>
              </div>
            </div>
          </div>
        </section>

        <section className="closing">
          <h2 className="section-title">💫 Our Mission</h2>
          <p>At Sankalp Society, we believe in the power of festivals to unite, uplift, and inspire. Whether it's Ganpati Utsav or any other occasion, our mission is to spread happiness, nurture bonds, and uphold our beautiful traditions with pride.</p>
          
          <div className="call-to-action">
            <h3>Join Our Celebration of Unity</h3>
            <p>Experience the magic of festivals where every celebration feels like home</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AppRouter;
