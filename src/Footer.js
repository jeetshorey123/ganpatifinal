import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Donation info section removed as requested */}

        <div className="community-info">
          <h4>🕉️ Poonam Sagarcha Raja</h4>
          <p>Supporting our community through devotion and service</p>
          <p>Address:sankalp society,poonam sagar complex,mira road east,mumbai</p>
        </div>

        <div className="contact-info">
          <h4>📞 Support</h4>
          <p>Jeet: 9833232395</p>
          <p>Rishi: 8169912193</p>
          <p>Email: poonamsagarcharaja@gmail.com</p>
        </div>

        <div className="legal-info">
          <h4>📋 Legal</h4>
          <button
            className="legal-link"
            onClick={() => window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'privacy' }))}
            style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Privacy Policy
          </button>
          <button
            className="legal-link"
            onClick={() => window.dispatchEvent(new CustomEvent('navigateToPage', { detail: 'terms' }))}
            style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
          >
            Terms & Conditions
          </button>
          <span className="footer-contact">Contact: <a href="mailto:shoreyjeet@gmail.com">shoreyjeet@gmail.com</a>, <a href="tel:9967606080">9967606080</a></span>
          <p>© 2025 Poonam Sagarcha Raja. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
