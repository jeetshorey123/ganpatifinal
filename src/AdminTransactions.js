import React, { useState, useEffect } from 'react';
import { donationService } from './supabaseClient';
import './AdminTransactions.css';
import ReceiptPDFGenerator from './ReceiptPDFGenerator';

function AdminTransactions() {
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
      const result = await donationService.getRecentTransactions(20);
      if (result.success) {
        setTransactions(result.data);
        // Calculate stats
        const stats = result.data.reduce((acc, curr) => {
          acc.totalTransactions++;
          acc.totalAmount += parseFloat(curr.amount || 0);
          if (curr.paymentStatus === 'success') acc.successfulPayments++;
          if (curr.paymentStatus === 'pending') acc.pendingPayments++;
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
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    setLoginError('');
    setTransactions([]);
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
      const message = encodeURIComponent(generateReceiptMessage(transaction));
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
      showNotification('success', 'WhatsApp message opened! Click send in WhatsApp to deliver the receipt.');
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      showNotification('error', 'Error opening WhatsApp. Please try again.');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  const getFilteredTransactions = () => {
    return transactions.filter(transaction => {
      const matchesPaymentStatus = filters.paymentStatus === 'all' || 
        (filters.paymentStatus === 'partial' ? 
          transaction.payment_status === 'Pending' : 
          transaction.payment_status === filters.paymentStatus);

      const matchesReceiptPreference = filters.receiptPreference === 'all' || 
        transaction.receipt_delivery_preference === filters.receiptPreference;

      const matchesPaymentType = filters.paymentType === 'all' || 
        transaction.payment_method === filters.paymentType;

      return matchesPaymentStatus && matchesReceiptPreference && matchesPaymentType;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateReceipt = async (transaction) => {
    try {
      setGeneratingReceipt(true);

      // Generate PDF locally using ReceiptPDFGenerator
      const pdfGenerator = new ReceiptPDFGenerator();
      const result = await pdfGenerator.downloadReceiptPDF(transaction);

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
              onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value }))}
            >
              <option value="all">All Payment Types</option>
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
              onChange={(e) => setFilters(prev => ({ ...prev, receiptPreference: e.target.value }))}
            >
              <option value="all">All Receipt Preferences</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="both">Both</option>
            </select>
          </div>
          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => fetchRecentTransactions()}>
            <svg viewBox="0 0 24 24" style={{ width: 20, height: 20, verticalAlign: 'middle', marginRight: 6 }}><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.64-.66 3.13-1.76 4.24l1.42 1.42C19.07 16.07 20 14.13 20 12c0-4.42-3.58-8-8-8zm-6 6c0-1.64.66-3.13 1.76-4.24L6.34 4.34C4.93 5.93 4 7.87 4 10c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z"/></svg>
            Refresh
          </button>
        </div>

        {/* Transactions Table */}
        <div className="transactions-table-container glass-card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Amount Paid</th>
                  <th>Total Amount</th>
                  <th>Balance</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(transaction => {
                  const balanceAmount = Math.max(0, parseFloat(transaction.total_amount || 0) - parseFloat(transaction.amount_paid || 0));
                  const addressText = transaction.resident_type === 'Sankalp Resident' 
                    ? `${transaction.wing}-${transaction.flat}, ${transaction.building}`
                    : 'Outsider';
                  return (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>{transaction.name}</td>
                      <td>{transaction.phone}</td>
                      <td>{addressText}</td>
                      <td>₹{parseFloat(transaction.amount_paid || transaction.amount).toLocaleString()}</td>
                      <td>₹{parseFloat(transaction.total_amount || transaction.amount).toLocaleString()}</td>
                      <td>₹{balanceAmount.toLocaleString()}</td>
                      <td>{new Date(transaction.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      <td className="actions-cell" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', alignItems: 'center' }}>
                        <button 
                          className="btn-icon success"
                          onClick={() => handleGenerateReceipt(transaction)}
                          disabled={generatingReceipt}
                          title="Download PDF"
                        >
                          <svg viewBox="0 0 24 24"><path d="M5 20h14v-2H5v2zm7-18C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10c0-5.52-4.48-10-10-10zm1 14h-2v-6H8l4-4 4 4h-3v6z"/></svg>
                        </button>
                        <button 
                          className="btn-icon warning"
                          onClick={() => handleSendWhatsApp(transaction)}
                          disabled={sendingWhatsApp}
                          title="Send WhatsApp"
                        >
                          <svg viewBox="0 0 32 32"><path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.693 4.607 1.893 6.527L4 29l7.646-2.527A12.96 12.96 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.953 0-3.805-.527-5.393-1.527l-.387-.24-4.547 1.5 1.52-4.44-.253-.4C6.527 18.805 6 16.953 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.293-7.293c-.293-.293-.707-.293-1 0l-2.293 2.293V11c0-.553-.447-1-1-1s-1 .447-1 1v9.293l-2.293-2.293c-.293-.293-.707-.293-1 0s-.293.707 0 1l3.293 3.293c.195.195.451.293.707.293s.512-.098.707-.293l3.293-3.293c.293-.293.293-.707 0-1z"/></svg>
                        </button>
                        <button 
                          className="btn-icon error"
                          onClick={() => confirmDelete(transaction)}
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24"><path d="M6 19c0 1.104.896 2 2 2h8c1.104 0 2-.896 2-2V7H6v12zm3.46-9.12l1.06 1.06L12 11.59l1.47-1.47 1.06 1.06L13.06 12.65l1.47 1.47-1.06 1.06L12 13.71l-1.47 1.47-1.06-1.06 1.47-1.47-1.47-1.47zM15.5 4l-1-1h-5l-1 1H5v2h14V4h-3.5z"/></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
