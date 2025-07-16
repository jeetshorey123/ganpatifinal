import React, { useState, useEffect } from 'react';
import { donationService } from './supabaseClient';
import './ReceiptList.css';

function ReceiptList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const result = await donationService.getAllReceipts();
      if (result.success) {
        setReceipts(result.data);
      } else {
        setError('Failed to load receipts');
      }
    } catch (err) {
      setError('Error loading receipts');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="receipts-container">
        <div className="loading">Loading receipts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipts-container">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="receipts-container">
      <div className="receipts-header">
        <h2>🧾 All Donation Receipts</h2>
        <button onClick={fetchReceipts} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="receipts-summary">
        <p>📋 Total Receipts: <strong>{receipts.length}</strong></p>
      </div>

      <div className="receipts-grid">
        {receipts.map((receipt) => (
          <div key={receipt.id} className="receipt-card">
            <div className="receipt-card-header">
              <h3>{receipt.name}</h3>
              <span className="receipt-date">
                {new Date(receipt.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="receipt-card-body">
              <div className="receipt-info">
                <p><strong>Amount:</strong> ₹{receipt.amount_paid}</p>
                <p>
                  <strong>Status:</strong>
                  <span className={`status ${receipt.payment_status.toLowerCase()}`}>
                    {receipt.payment_status}
                  </span>
                </p>
              </div>
              
              <div className="receipt-actions">
                {receipt.receipt_url && (
                  <a
                    href={receipt.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="receipt-btn pdf-btn"
                  >
                    📄 View PDF
                  </a>
                )}
                {receipt.receipt_link && (
                  <a
                    href={receipt.receipt_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="receipt-btn link-btn"
                  >
                    🔗 Online Receipt
                  </a>
                )}
                <button
                  onClick={() => {
                    const link = receipt.receipt_link || receipt.receipt_url;
                    if (link) {
                      navigator.clipboard.writeText(link);
                      alert('Receipt link copied to clipboard!');
                    }
                  }}
                  className="receipt-btn copy-btn"
                  disabled={!receipt.receipt_link && !receipt.receipt_url}
                >
                  📋 Copy Link
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReceiptList;
