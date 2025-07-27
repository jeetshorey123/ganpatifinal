import React, { useState, useEffect } from 'react';
import { donationService } from './supabaseClient';
import './AdminTransactions.css';
import ReceiptPDFGenerator from './ReceiptPDFGenerator';

function AdminTransactions() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10); // Show 10 transactions per page
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [filters, setFilters] = useState({
    paymentStatus: 'all',
    receiptPreference: 'all',
    paymentType: 'all'
  });
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successfulPayments: 0,
    pendingPayments: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentTransactions();
    }
  }, [isAuthenticated]);

  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      const result = await donationService.getRecentTransactions(200); // Fetch more for pagination
      if (result.success) {
        setTransactions(result.data);
        // Calculate stats
        const stats = result.data.reduce((acc, curr) => {
          acc.totalTransactions++;
          // Use amount_paid if available, else total_amount, else amount
          const amt = parseFloat(curr.amount_paid || curr.total_amount || curr.amount || 0);
          acc.totalAmount += isNaN(amt) ? 0 : amt;
          const status = (curr.payment_status || curr.paymentStatus || '').toLowerCase();
          if (status === 'success') acc.successfulPayments++;
          if (status === 'pending') acc.pendingPayments++;
          return acc;
        }, {
          totalTransactions: 0,
          totalAmount: 0,
          successfulPayments: 0,
          pendingPayments: 0
        });
        setStats(stats);
      } else {
        console.error('Error fetching transactions:', result.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const validUsers = ['jeet', 'rishi'];
    if (validUsers.includes(loginData.username) && loginData.password === 'sankalp69') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    setLoginError('');
    setTransactions([]);
    setCurrentPage(1);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    setLoginError('');
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      setIsDeleting(true);
      console.log('Attempting to delete transaction with ID:', transactionId);
      
      const result = await donationService.deleteTransaction(transactionId);
      
      if (result.success) {
        setTransactions(prev => prev.filter(t => t.id !== transactionId));
        setDeleteConfirm(null);
        // Use custom notification instead of alert
        showNotification('success', 'Transaction deleted successfully');
        
        setTimeout(() => {
          fetchRecentTransactions();
        }, 500);
      } else {
        console.error('Database deletion failed:', result.error);
        showNotification('error', `Failed to delete transaction: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showNotification('error', 'Error deleting transaction. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = (transaction) => {
    setDeleteConfirm(transaction);
  };

  const showNotification = (type, message) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    }, 100);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const formatAddress = (transaction) => {
    if (transaction.resident_type === 'Outsider') {
      return 'Outsider';
    }
    if (transaction.wing && transaction.flat && transaction.building) {
      return `${transaction.wing}-${transaction.flat}, ${transaction.building}`;
    }
    return 'Address not available';
  };

  // Generate receipt message for WhatsApp
  const generateReceiptMessage = (transaction) => {
    const balanceAmount = Math.max(0, parseFloat(transaction.total_amount || 0) - parseFloat(transaction.amount_paid || 0));
    const addressText = transaction.resident_type === 'Sankalp Resident' 
      ? `${transaction.wing}-${transaction.flat}, ${transaction.building}`
      : 'Outsider';
    const statusEmoji = transaction.payment_status === 'success' ? '✅' : transaction.payment_status === 'pending' ? '⏳' : '❌';
    const paymentStatusText = `${statusEmoji} ${transaction.payment_status.charAt(0).toUpperCase() + transaction.payment_status.slice(1)}`;
    const dateTime = new Date(transaction.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    let message = `🪔 *POONAM SAGARCHA RAJA DONATION RECEIPT* 🪔\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *Donor Details*\n` +
      `• Name: ${transaction.name}\n` +
      `• Phone: ${transaction.phone}\n` +
      `• Resident Type: ${transaction.resident_type}\n` +
      `• Address: ${addressText}\n\n` +
      `💳 *Payment Details*\n` +
      `• Total Amount: ₹${transaction.total_amount || transaction.amount_paid}\n` +
      `• Amount Paid: ₹${transaction.amount_paid}\n` +
      `• Balance: ₹${balanceAmount}\n` +
      `• Method: ${transaction.payment_method}\n` +
      `• Status: ${paymentStatusText}\n\n` +
      `📅 *Date & Time:* ${dateTime}`;

    if (transaction.receipt_url) {
      message += `\n\n📄 *Digital Receipt:*\n${transaction.receipt_url}`;
    }

    message += `\n\n🙏 *Thank you for your generous donation!*\n*May Lord Ganesha bless you and your family.*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━`;

    return message;
  };

  // Send WhatsApp receipt
  const handleSendWhatsApp = async (transaction) => {
    try {
      setSendingWhatsApp(true);
      // Find serial number for this transaction
      const allSorted = getFilteredTransactions();
      const serialNumber = allSorted.findIndex(t => t.id === transaction.id) + 1;
      // Inject serial number as 'receipt_serial' for PDF
      const transactionWithSerial = { ...transaction, receipt_serial: serialNumber };
      // 1. Download the PDF receipt with serial number
      const pdfGenerator = new ReceiptPDFGenerator();
      const result = await pdfGenerator.downloadReceiptPDF(transactionWithSerial);
      if (!result.success) {
        throw new Error('Failed to generate receipt locally.');
      }
      // 2. Open WhatsApp as before
      const message = encodeURIComponent(generateReceiptMessage(transactionWithSerial));
      const phoneNumber = transaction.phone.replace(/[^0-9]/g, '');
      const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const whatsappUrl = isMobile
        ? `whatsapp://send?phone=${formattedPhone}&text=${message}`
        : `https://wa.me/${formattedPhone}?text=${message}`;
      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }
      showNotification('success', 'PDF downloaded and WhatsApp message opened! Click send in WhatsApp to deliver the receipt.');
    } catch (error) {
      console.error('Error sending WhatsApp message or downloading PDF:', error);
      showNotification('error', 'Error downloading PDF or opening WhatsApp. Please try again.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const getFilteredTransactions = () => {
    // Filter transactions as before
    const filtered = transactions.filter(transaction => {
      // Normalize status for comparison
      const status = (transaction.payment_status || '').toLowerCase();
      const filterStatus = (filters.paymentStatus || '').toLowerCase();
      const matchesPaymentStatus = filterStatus === 'all' || status === filterStatus;

      // Custom logic for receipt preference
      let matchesReceiptPreference = true;
      if (filters.receiptPreference === 'whatsapp') {
        matchesReceiptPreference = (transaction.receipt_delivery_preference && transaction.receipt_delivery_preference.toLowerCase() === 'whatsapp');
      } else if (filters.receiptPreference === 'download') {
        matchesReceiptPreference = (transaction.receipt_delivery_preference && (transaction.receipt_delivery_preference.toLowerCase() === 'download' || transaction.receipt_delivery_preference.toLowerCase() === 'download now'));
      } else if (filters.receiptPreference !== 'all') {
        matchesReceiptPreference = transaction.receipt_delivery_preference === filters.receiptPreference;
      }

      // Only show Cash or UPI payments if selected in filter
      let matchesPaymentType = true;
      if (filters.paymentType === 'Cash' || filters.paymentType === 'UPI') {
        matchesPaymentType = transaction.payment_method === filters.paymentType;
      } else if (filters.paymentType === 'all') {
        matchesPaymentType = transaction.payment_method === 'Cash' || transaction.payment_method === 'UPI';
      }

      return matchesPaymentStatus && matchesReceiptPreference && matchesPaymentType;
    });
    // Sort by created_at ascending (oldest first)
    filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return filtered;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Pagination logic (move to component scope)
  const paginatedTransactions = () => {
    const filtered = getFilteredTransactions();
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filtered.slice(startIdx, startIdx + rowsPerPage);
  };
  const totalFiltered = getFilteredTransactions().length;
  const totalPages = Math.ceil(totalFiltered / rowsPerPage);

  const handleGenerateReceipt = async (transaction) => {
    try {
      setGeneratingReceipt(true);
      // Find serial number for this transaction
      const allSorted = getFilteredTransactions();
      const serialNumber = allSorted.findIndex(t => t.id === transaction.id) + 1;
      // Inject serial number as 'receipt_serial' for PDF
      const transactionWithSerial = { ...transaction, receipt_serial: serialNumber };
      // Generate PDF locally using ReceiptPDFGenerator
      const pdfGenerator = new ReceiptPDFGenerator();
      const result = await pdfGenerator.downloadReceiptPDF(transactionWithSerial);
      if (result.success) {
        alert('✅ Receipt generated and downloaded successfully!');
      } else {
        throw new Error('Failed to generate receipt locally.');
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('❌ Failed to generate receipt: ' + error.message);
    } finally {
      setGeneratingReceipt(false);
    }
  };

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="admin-transactions-container">
        <div className="admin-login-container glass-card">
          <h2>Admin Dashboard</h2>
          {loginError && (
            <div className="error-message status-badge error">
              <i className="fas fa-exclamation-circle"></i>
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-control"
                type="text"
                name="username"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                placeholder="Enter your username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="btn">
              <i className="fas fa-sign-in-alt"></i>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-transactions-container">
        <div className="loading">Loading recent transactions...</div>
      </div>
    );
  }

  return (
    <div className="admin-transactions-container">
      <div className="admin-dashboard">
        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stats-card glass-card">
            <i className="fas fa-chart-line"></i>
            <h3>Total Transactions</h3>
            <p>{stats.totalTransactions}</p>
          </div>
          <div className="stats-card glass-card">
            <i className="fas fa-rupee-sign"></i>
            <h3>Total Amount</h3>
            <p>₹{stats.totalAmount.toLocaleString()}</p>
          </div>
          <div className="stats-card glass-card">
            <i className="fas fa-check-circle"></i>
            <h3>Successful Payments</h3>
            <p>{stats.successfulPayments}</p>
          </div>
          <div className="stats-card glass-card">
            <i className="fas fa-clock"></i>
            <h3>Pending Payments</h3>
            <p>{stats.pendingPayments}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-container glass-card" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', marginBottom: '2rem', padding: '1rem 2rem' }}>
          <div style={{ minWidth: 180 }}>
            <label style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>Payment Status</label>
            <select
              className="filter-select"
              value={filters.paymentStatus}
              name="paymentStatus"
              onChange={handleFilterChange}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div style={{ minWidth: 180 }}>
            <label style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>Payment Type</label>
            <select
              className="filter-select"
              value={filters.paymentType}
              name="paymentType"
              onChange={handleFilterChange}
            >
              <option value="all">All Payment Types</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net Banking</option>
            </select>
          </div>
          <div style={{ minWidth: 180 }}>
            <label style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>Receipt Preference</label>
            <select
              className="filter-select"
              value={filters.receiptPreference}
              name="receiptPreference"
              onChange={handleFilterChange}
            >
              <option value="all">All Receipt Preferences</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="download">Download Now</option>
            </select>
          </div>
          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => fetchRecentTransactions()}>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 6 }}><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.64-.66 3.13-1.76 4.24l1.42 1.42C19.07 16.07 20 14.13 20 12c0-4.42-3.58-8-8-8zm-6 6c0-1.64.66-3.13 1.76-4.24L6.34 4.34C4.93 5.93 4 7.87 4 10c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"/></svg>
            Refresh
          </button>
          <button className="btn primary" style={{ marginLeft: 8 }} onClick={e => { e.preventDefault(); setTransactions(getFilteredTransactions()); }}>
            Apply Filter
          </button>
        </div>

        {/* Transactions Table */}
        <div className="transactions-table-container glass-card" style={{ marginLeft: 0, marginRight: 'auto', width: '100%', maxWidth: '100vw', overflowX: 'auto' }}>
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : (
            <>
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Actions</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Amount Paid</th>
                    <th>Total Amount</th>
                    <th>Balance</th>
                    <th>Payment Method</th>
                    <th>📬 Receipt Delivery Preference</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Get all filtered and sorted transactions for serial number calculation
                    const allSorted = getFilteredTransactions();
                    return paginatedTransactions().map((transaction, idx) => {
                      const balanceAmount = Math.max(0, parseFloat(transaction.total_amount || 0) - parseFloat(transaction.amount_paid || 0));
                      const addressText = transaction.resident_type === 'Sankalp Resident' 
                        ? `${transaction.wing}-${transaction.flat}, ${transaction.building}`
                        : 'Outsider';
                      // Find the index of this transaction in the full sorted list for correct serial number
                      const serialNumber = allSorted.findIndex(t => t.id === transaction.id) + 1;
                      return (
                        <tr key={transaction.id}>
                          <td>{serialNumber}</td>
                          <td>{transaction.name}</td>
                          <td className="actions-cell" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', alignItems: 'center' }}>
                            <button 
                              className="btn success"
                              style={{ fontSize: '0.85rem', padding: '0.35rem 0.7rem', minWidth: 'unset', margin: 0 }}
                              onClick={() => handleGenerateReceipt(transaction)}
                              disabled={generatingReceipt}
                              title="Download PDF"
                            >
                              Download
                            </button>
                            <button 
                              className="btn warning"
                              style={{ fontSize: '0.85rem', padding: '0.35rem 0.7rem', minWidth: 'unset', margin: 0 }}
                              onClick={() => handleSendWhatsApp(transaction)}
                              disabled={sendingWhatsApp}
                              title="Send WhatsApp"
                            >
                              WhatsApp
                            </button>
                          </td>
                          <td>{transaction.phone}</td>
                          <td>{addressText}</td>
                          <td>₹{parseFloat(transaction.amount_paid || transaction.amount).toLocaleString()}</td>
                          <td>₹{parseFloat(transaction.total_amount || transaction.amount).toLocaleString()}</td>
                          <td>₹{balanceAmount.toLocaleString()}</td>
                          <td>{transaction.payment_method || 'N/A'}</td>
                          <td>{transaction.receipt_delivery_preference || 'N/A'}</td>
                          <td>{new Date(transaction.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '1.5rem 0' }}>
                  <button className="btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt; Prev</button>
                  <span style={{ margin: '0 1rem', color: '#fff' }}>Page {currentPage} of {totalPages}</span>
                  <button className="btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next &gt;</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal glass-card">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this transaction?</p>
              <div className="modal-actions">
                <button 
                  className="btn"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn error"
                  onClick={() => handleDeleteTransaction(deleteConfirm.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="loading-spinner-small"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash-alt"></i> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button className="btn logout-btn" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  );
}

export default AdminTransactions;



