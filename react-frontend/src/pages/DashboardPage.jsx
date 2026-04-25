import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  // Define modules based on user role
  const getAvailableModules = () => {
    const modules = [];

    // All authenticated users can access these
    modules.push({
      id: 'events',
      title: 'Events & Community',
      description: 'Browse and book campus events, view memories, and connect with the community',
      icon: '🎉',
      path: '/events',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      roles: ['student', 'rider', 'driver', 'admin', 'staff']
    });

    modules.push({
      id: 'canteen',
      title: 'Canteen Services',
      description: 'Order food, view offers, and manage canteen requests',
      icon: '🍽️',
      path: '/canteen',
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      roles: ['student', 'rider', 'driver', 'admin', 'staff']
    });

    modules.push({
      id: 'study-area',
      title: 'Study Area',
      description: 'Book study spaces and manage your study sessions',
      icon: '📚',
      path: '/study-area',
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      roles: ['student', 'rider', 'driver', 'admin', 'staff']
    });

    // Transport module - available to riders and drivers
    if (user.role === 'rider' || user.role === 'driver' || user.role === 'admin') {
      modules.push({
        id: 'transport',
        title: 'Transport',
        description: user.role === 'driver' 
          ? 'Manage your rides and view driver dashboard'
          : 'Book rides and track your journey',
        icon: '🚗',
        path: user.role === 'driver' ? '/driver-dashboard' : '/rider-dashboard',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        roles: ['student', 'rider', 'driver', 'admin']
      });
    }

    // Admin modules
    if (user.role === 'admin') {
      modules.push({
        id: 'admin-overview',
        title: 'Admin Overview',
        description: 'Manage users, view system statistics, and configure settings',
        icon: '⚙️',
        path: '/admin',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        roles: ['admin']
      });

      modules.push({
        id: 'admin-canteen',
        title: 'Canteen Management',
        description: 'Manage food items, offers, and canteen operations',
        icon: '🍳',
        path: '/admin-canteen',
        color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        roles: ['admin']
      });

      modules.push({
        id: 'admin-events',
        title: 'Event Management',
        description: 'Create and manage campus events',
        icon: '📋',
        path: '/admin-events',
        color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        roles: ['admin']
      });

      modules.push({
        id: 'admin-study-area',
        title: 'Study Area Management',
        description: 'Manage study spaces and bookings',
        icon: '🏢',
        path: '/admin-study-area',
        color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        roles: ['admin']
      });
    }

    // Filter modules based on user role
    return modules.filter(module => module.roles.includes(user.role));
  };

  const availableModules = getAvailableModules();

  const features = [
    { icon: '🎯', title: 'All-in-One', desc: 'Access all campus services from a single dashboard.', color: '#667eea' },
    { icon: '🔒', title: 'Secure', desc: 'Your data is protected with enterprise-grade security.', color: '#f5576c' },
    { icon: '⚡', title: 'Fast', desc: 'Lightning-fast performance for seamless experience.', color: '#00f2fe' },
    { icon: '📱', title: 'Mobile Ready', desc: 'Access from any device, anywhere, anytime.', color: '#38f9d7' },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Welcome"
        title={`Hello, ${user.name}! 👋`}
        subtitle={`You're logged in as a ${user.role}. Access all available modules below.`}
      />

      <section className="section-block">
        <div className="container canteenx-grid">
          {/* Hero Section with Enhanced Design */}
          <article className="surface canteenx-hero" style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p className="canteenx-kicker" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '800',
                fontSize: '0.85rem'
              }}>
                ✨ YOUR CAMPUS HUB
              </p>
              <h2 style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '2rem',
                fontWeight: '900'
              }}>
                Dashboard Command Center
              </h2>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                Navigate through all campus services seamlessly. From events to transport, 
                canteen to study areas - everything you need is just a click away.
              </p>
              
              {/* Quick Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                {user.role === 'driver' ? (
                  <button
                    onClick={() => navigate('/driver-dashboard')}
                    className="button button-primary"
                    style={{
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      border: 'none',
                      padding: '0.9rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(67, 233, 123, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(67, 233, 123, 0.4)';
                    }}
                  >
                    🚘 Driver Dashboard
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/rider-dashboard')}
                    className="button button-primary"
                    style={{
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      border: 'none',
                      padding: '0.9rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(67, 233, 123, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(67, 233, 123, 0.4)';
                    }}
                  >
                    🚗 Find a Ride
                  </button>
                )}
              </div>
            </div>
            <div className="canteenx-hero-cards" style={{ gap: '1rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15))',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: '16px',
                padding: '1.2rem',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <strong style={{ fontSize: '2rem', color: '#667eea' }}>{availableModules.length}</strong>
                <span style={{ fontSize: '0.9rem' }}>Available Modules</span>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.15), rgba(56, 249, 215, 0.15))',
                border: '1px solid rgba(67, 233, 123, 0.3)',
                borderRadius: '16px',
                padding: '1.2rem',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(67, 233, 123, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <strong style={{ fontSize: '2rem', color: '#43e97b' }}>24/7</strong>
                <span style={{ fontSize: '0.9rem' }}>Access Anytime</span>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.15), rgba(0, 242, 254, 0.15))',
                border: '1px solid rgba(79, 172, 254, 0.3)',
                borderRadius: '16px',
                padding: '1.2rem',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(79, 172, 254, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <strong style={{ fontSize: '2rem', color: '#4facfe' }}>Live</strong>
                <span style={{ fontSize: '0.9rem' }}>Real-time Updates</span>
              </div>
            </div>
            {/* Decorative Elements */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              zIndex: 0
            }} />
          </article>

          {/* Modules Section - Canteen Style */}
          <article className="surface canteenx-actions">
            <div className="canteenx-actions-head">
              <h2>Your Modules</h2>
              <p>
                Select a module to get started. Your role <strong>({user.role})</strong> determines which modules you can access.
              </p>
            </div>
            <div className="canteenx-actions-grid">
              {availableModules.map((module) => (
                <article key={module.id} className="canteenx-action-card">
                  <div className="canteenx-action-icon">{module.icon}</div>
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>
                  <button
                    onClick={() => navigate(module.path)}
                    className="button button-small button-primary"
                  >
                    Access Module →
                  </button>
                </article>
              ))}
            </div>

            {availableModules.length === 0 && (
              <div className="empty-state">
                <p>No modules available for your role. Please contact an administrator.</p>
              </div>
            )}
          </article>

          {/* Features Grid with Enhanced Design */}
          <div className="canteenx-feature-grid" style={{ gap: '1.5rem' }}>
            {features.map((f, idx) => (
              <article 
                key={idx} 
                className="surface canteenx-feature-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  animation: `fadeInUp 0.6s ease-out ${0.6 + idx * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${f.color}40`;
                  e.currentTarget.style.borderColor = `${f.color}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '1rem',
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))'
                }}>
                  {f.icon}
                </div>
                <h3 style={{ 
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  marginBottom: '0.5rem',
                  color: f.color
                }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>{f.desc}</p>
              </article>
            ))}
          </div>

          {/* Account Information with Enhanced Design */}
          <article className="surface canteenx-selector" style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '20px'
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>👤 Your Account Information</h2>
            <p style={{ fontSize: '1.05rem' }}>View and manage your profile details</p>
            <div className="canteenx-selector-grid" style={{ gap: '1.2rem', marginTop: '1.5rem' }}>
              <div className="canteenx-selector-card" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <span className="canteenx-selector-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#667eea' }}>NAME</span>
                <span className="canteenx-selector-sub" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user.name}</span>
              </div>
              <div className="canteenx-selector-card" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 87, 108, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <span className="canteenx-selector-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f5576c' }}>EMAIL</span>
                <span className="canteenx-selector-sub" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user.email}</span>
              </div>
              <div className="canteenx-selector-card" style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 172, 254, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <span className="canteenx-selector-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4facfe' }}>STUDENT ID</span>
                <span className="canteenx-selector-sub" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{user.studentId || 'N/A'}</span>
              </div>
              <div className="canteenx-selector-card active" style={{
                background: 'linear-gradient(135deg, rgba(67, 233, 123, 0.15), rgba(56, 249, 215, 0.15))',
                border: '1px solid rgba(67, 233, 123, 0.4)',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(67, 233, 123, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <span className="canteenx-selector-title" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#43e97b' }}>ROLE</span>
                <span className="canteenx-selector-sub" style={{ fontSize: '1.1rem', fontWeight: '600', textTransform: 'uppercase' }}>{user.role}</span>
                <span className="canteenx-selector-tag" style={{
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  marginTop: '0.5rem',
                  display: 'inline-block',
                  boxShadow: '0 4px 10px rgba(67, 233, 123, 0.3)'
                }}>
                  ✓ ACTIVE
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Add keyframe animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
