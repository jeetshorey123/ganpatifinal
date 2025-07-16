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
        </div>

        <div className="contact-info">
          <h4>📞 Support</h4>
          <p>Jeet: 9833232395</p>
          <p>Rishi: 8169912193</p>
          <p>Email: poonamsagarcharaja@gmail.com</p>
        </div>

        <div className="legal-info">
          <h4>📋 Legal</h4>
          <p>Privacy Policy</p>
          <p>Terms & Conditions</p>
          <p>© 2025 Poonam Sagarcha Raja. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;