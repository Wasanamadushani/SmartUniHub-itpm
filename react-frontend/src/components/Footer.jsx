import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">🎓 SLIIT Campus Hub</div>
          <p>
            Your all-in-one platform for campus life - Transport, Events, Food, and Study Spaces. Connecting SLIIT students since 2024.
          </p>
        </div>

        <div>
          <h4>Services</h4>
          <ul>
            <li><Link to="/rider-dashboard">🚗 Transport</Link></li>
            <li><Link to="/events">🎉 Events</Link></li>
            <li><Link to="/canteen">🍽️ Canteen</Link></li>
            <li><Link to="/study-area">📚 Study Area</Link></li>
          </ul>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/chat">Messages</Link></li>
            <li><Link to="/become-driver">Become a Driver</Link></li>
          </ul>
        </div>

        <div>
          <h4>Account</h4>
          <ul>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">© 2026 SLIIT Campus Hub. All rights reserved.</div>
    </footer>
  );
}