import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { donationService } from './supabaseClient';
import './Receipt.css';

function Receipt() {
  const { slug } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const result = await donationService.getReceiptBySlug(slug);
        if (result.success) {
          setReceipt(result.data);
        } else {
          setError('Receipt not found');
        }
      } catch (err) {
        setError('Error loading receipt');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [slug]);

  if (loading) {
    return (
      <div className="receipt-container">
        <div className="loading">Loading receipt...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipt-container">
        <div className="error">
          <h2>❌ {error}</h2>
          <p>The receipt you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  const formatAddress = (receipt) => {
    if (receipt.resident_type === 'Outsider') {
      return 'Outsider';
    }
    return receipt.wing && receipt.flat && receipt.building
      ? `${receipt.wing}-${receipt.flat}, ${receipt.building}`
      : 'Address not provided';
  };

  const calculateBalance = () => {
    const total = parseFloat(receipt.total_amount || 0);
    const paid = parseFloat(receipt.amount_paid || 0);
    return Math.max(0, total - paid);
  };

  return (
    <div className="receipt-container">
      <div className="receipt-card">
        <div className="receipt-header">
          <h1>🕉️ Poonam Sagarcha Raja</h1>
          <div className="receipt-title">Donation Receipt</div>
        </div>

        <div className="receipt-section">
          <h3>👤 Donor Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Name:</label>
              <span>{receipt.name}</span>
            </div>
            <div className="detail-item">
              <label>Phone:</label>
              <span>{receipt.phone}</span>
            </div>
            <div className="detail-item">
              <label>Email:</label>
              <span>{receipt.email || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Address:</label>
              <span>{formatAddress(receipt)}</span>
            </div>
          </div>
        </div>

        <div className="receipt-section">
          <h3>💰 Payment Details</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Total Amount:</label>
              <span>₹{receipt.total_amount}</span>
            </div>
            <div className="detail-item">
              <label>Amount Paid:</label>
              <span>₹{receipt.amount_paid}</span>
            </div>
            <div className="detail-item">
              <label>Balance:</label>
              <span>₹{calculateBalance()}</span>
            </div>
            <div className="detail-item">
              <label>Payment Method:</label>
              <span>{receipt.payment_method}</span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={`status ${receipt.payment_status.toLowerCase()}`}>
                {receipt.payment_status}
              </span>
            </div>
          </div>
        </div>

        <div className="receipt-footer">
          <div className="timestamp">
            Date: {new Date(receipt.created_at).toLocaleString()}
          </div>
          <div className="blessing">
            🙏 Thank you for your generous donation!
            <br />
            May Lord Ganesha bless you and your family.
          </div>
        </div>

        {receipt.receipt_url && (
          <div className="pdf-section">
            <a
              href={receipt.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-download-btn"
            >
              📄 Download PDF Receipt
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default Receipt;
