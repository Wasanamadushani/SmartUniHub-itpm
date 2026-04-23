import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuthenticatedUser, readStoredUser } from '../lib/auth';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());

  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(readStoredUser());
    window.addEventListener('auth-changed', handleAuthChange);

    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname, location.hash]);

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'User';

  // Get navigation links based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/events', label: 'Events' },
      { to: '/canteen', label: 'Canteen' },
      { to: '/study-area', label: 'Study Area' },
      { to: '/student-fines', label: 'My Fines' }
    ];

    if (currentUser?.role === 'driver' || currentUser?.role === 'admin') {
      baseLinks.push({ to: '/rider-dashboard', label: 'Find Ride' });
    }

    return baseLinks;
  };

  // Get dropdown menu items based on user role
  const getDropdownItems = () => {
    const items = [];

    if (currentUser?.role === 'admin') {
      items.push({ to: '/admin', label: '⚙️ Admin Overview' });
      items.push({ to: '/admin-canteen', label: '🍳 Canteen Admin' });
      items.push({ to: '/admin-events', label: '📋 Event Admin' });
      items.push({ to: '/admin-study-area', label: '🏢 Study Area Admin' });
    } else if (currentUser?.role === 'driver') {
      items.push({ to: '/driver-dashboard', label: '🚗 Driver Dashboard' });
      items.push({ to: '/become-driver', label: '📝 Driver Settings' });
    } else {
      items.push({ to: '/rider-dashboard', label: '🚗 My Rides' });
      items.push({ to: '/become-driver', label: '📝 Become a Driver' });
    }

    items.push({ to: '/chat', label: '💬 Messages' });
    items.push({ divider: true });
    items.push({ action: 'logout', label: '🚪 Logout' });

    return items;
  };

  function handleLogout(event) {
    event.preventDefault();
    clearAuthenticatedUser();
    navigate('/login');
  }

  const navLinks = getNavLinks();
  const dropdownItems = getDropdownItems();

  return (
    <header className="navbar-wrap">
      <nav className="navbar container">
        <Link to="/" className="brand">
          <span className="brand-mark">🎓</span>
          <span>SLIIT<span>Hub</span></span>
        </Link>

        <button
          type="button"
          className={`burger ${menuOpen ? 'open' : ''}`}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-panel ${menuOpen ? 'open' : ''}`}>
          {currentUser && (
            <ul className="nav-links">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} end={link.to === '/dashboard'}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          <div className="nav-actions">
            {currentUser ? (
              <div className="account-menu">
                <button
                  type="button"
                  className="account-button"
                  onClick={() => setAccountMenuOpen((value) => !value)}
                >
                  <span className="account-avatar">👤</span>
                  <span>{firstName}</span>
                  <span className="account-caret">▾</span>
                </button>

                {accountMenuOpen ? (
                  <div className="account-dropdown">
                    <div className="dropdown-header">
                      <strong>{currentUser.name}</strong>
                      <small>{currentUser.role}</small>
                    </div>
                    <div className="dropdown-divider" />
                    {dropdownItems.map((item, idx) => {
                      if (item.divider) {
                        return <div key={idx} className="dropdown-divider" />;
                      }
                      if (item.action === 'logout') {
                        return (
                          <button
                            key={idx}
                            type="button"
                            className="dropdown-item dropdown-logout"
                            onClick={handleLogout}
                          >
                            {item.label}
                          </button>
                        );
                      }
                      return (
                        <Link key={idx} to={item.to} className="dropdown-item">
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-link-ghost">
                  Login
                </Link>
                <Link to="/register" className="button button-primary button-small">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}