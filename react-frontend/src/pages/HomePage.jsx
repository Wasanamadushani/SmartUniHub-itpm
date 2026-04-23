import { Link } from 'react-router-dom';

export default function HomePage() {
  const platformStats = [
    { icon: '👥', value: '1,200+', label: 'Active Students', color: '#3b82f6' },
    { icon: '🎉', value: '50+', label: 'Campus Events', color: '#8b5cf6' },
    { icon: '🍽️', value: '4', label: 'Canteens', color: '#10b981' },
    { icon: '📚', value: '100+', label: 'Study Seats', color: '#f59e0b' },
  ];

  const mainServices = [
    {
      icon: '🚗',
      title: 'Smart Transport',
      description: 'Connect with fellow students for safe, affordable rides to and from campus. Share costs and reduce your carbon footprint.',
      link: '/rider-dashboard',
      color: '#3b82f6',
      features: ['Real-time tracking', 'Verified drivers', 'Shared rides']
    },
    {
      icon: '🎉',
      title: 'Campus Events',
      description: 'Discover and register for exciting events, workshops, and activities happening around campus.',
      link: '/events',
      color: '#8b5cf6',
      features: ['Event calendar', 'Easy registration', 'Notifications']
    },
    {
      icon: '🍽️',
      title: 'Canteen Hub',
      description: 'Browse menus, order food, and track deliveries from all campus canteens in one place.',
      link: '/canteen',
      color: '#10b981',
      features: ['Live menu', 'Order tracking', 'Special offers']
    },
    {
      icon: '📚',
      title: 'Study Areas',
      description: 'Book your study seat in advance and manage your study sessions efficiently.',
      link: '/study-area',
      color: '#f59e0b',
      features: ['Seat booking', 'Real-time availability', 'Session management']
    },
  ];

  const benefits = [
    {
      icon: '🔒',
      title: 'Verified Students',
      description: 'Only SLIIT students can access the platform, ensuring a safe and trusted community.'
    },
    {
      icon: '⚡',
      title: 'Real-Time Updates',
      description: 'Live tracking for rides, instant event notifications, and real-time food order status.'
    },
    {
      icon: '💰',
      title: 'Cost Effective',
      description: 'Share rides to save money, get canteen offers, and book study spaces for free.'
    },
    {
      icon: '📱',
      title: 'Easy to Use',
      description: 'Simple, intuitive interface designed for quick access to all campus services.'
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">🎓 For SLIIT Students Only</span>
            <h1>Your Campus, <span>Your Hub.</span></h1>
            <p>
              Everything you need for campus life in one place. Access transport, events, food, and study spaces seamlessly.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="button button-primary">Get Started Free</Link>
              <Link to="/rider-dashboard" className="button button-secondary">Book a Ride</Link>
            </div>

            <div className="hero-pill">
              <div className="avatar-stack" aria-hidden="true">
                <span>👨‍🎓</span>
                <span>👩‍🎓</span>
                <span>👨‍🎓</span>
              </div>
              <p><strong>1,200+ students</strong> using our platform daily</p>
            </div>
          </div>

          <div className="hero-panel surface">
            <div className="hero-panel-header">
              <span>Platform Stats</span>
              <span className="pulse-badge">Live</span>
            </div>
            <div className="mini-stat-grid">
              {platformStats.map((stat) => (
                <div key={stat.label} className="mini-stat" style={{ borderLeft: `3px solid ${stat.color}` }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview Section */}
      <section className="section-block">
        <div className="container section-heading center">
          <div>
            <span className="section-kicker">Our Services</span>
            <h2>Everything You Need for Campus Life</h2>
          </div>
          <p>Four essential services designed to make your campus experience better.</p>
        </div>

        <div className="container" style={{ display: 'grid', gap: '2rem' }}>
          {mainServices.map((service, index) => (
            <article 
              key={service.title}
              className="surface"
              style={{
                display: 'grid',
                gridTemplateColumns: index % 2 === 0 ? '1fr 1.2fr' : '1.2fr 1fr',
                gap: '2rem',
                padding: '2.5rem',
                borderRadius: '20px',
                alignItems: 'center',
                background: `linear-gradient(135deg, ${service.color}08, ${service.color}03)`,
                border: `1px solid ${service.color}20`,
              }}
            >
              <div style={{ order: index % 2 === 0 ? 1 : 2 }}>
                <div 
                  style={{
                    fontSize: '4rem',
                    marginBottom: '1rem',
                    display: 'inline-block',
                    padding: '1rem',
                    background: `${service.color}15`,
                    borderRadius: '16px',
                  }}
                >
                  {service.icon}
                </div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '0.75rem', color: service.color }}>
                  {service.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.7' }}>
                  {service.description}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {service.features.map((feature) => (
                    <span 
                      key={feature}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: `${service.color}15`,
                        color: service.color,
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                      }}
                    >
                      ✓ {feature}
                    </span>
                  ))}
                </div>
                <Link 
                  to={service.link}
                  className="button button-primary"
                  style={{ 
                    background: service.color,
                    borderColor: service.color,
                  }}
                >
                  Explore {service.title} →
                </Link>
              </div>
              <div 
                style={{
                  order: index % 2 === 0 ? 2 : 1,
                  background: `${service.color}10`,
                  borderRadius: '16px',
                  padding: '3rem',
                  textAlign: 'center',
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8rem',
                }}
              >
                {service.icon}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="section-block muted-section">
        <div className="container section-heading center">
          <div>
            <span className="section-kicker">By The Numbers</span>
            <h2>Making Campus Life Better</h2>
          </div>
        </div>

        <div className="container stats-grid">
          <article className="stat-card surface" style={{ borderTop: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🚗</div>
            <strong>500+</strong>
            <span>Rides Completed</span>
          </article>
          <article className="stat-card surface" style={{ borderTop: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <strong>50+</strong>
            <span>Events Hosted</span>
          </article>
          <article className="stat-card surface" style={{ borderTop: '4px solid #10b981' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍽️</div>
            <strong>1,000+</strong>
            <span>Orders Delivered</span>
          </article>
          <article className="stat-card surface" style={{ borderTop: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
            <strong>100+</strong>
            <span>Study Seats Available</span>
          </article>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-block">
        <div className="container section-heading center">
          <div>
            <span className="section-kicker">Why Choose Us</span>
            <h2>Built for SLIIT Students</h2>
          </div>
          <p>A comprehensive platform designed specifically for your campus needs.</p>
        </div>

        <div className="container card-grid feature-grid">
          {benefits.map((benefit) => (
            <article key={benefit.title} className="surface card feature-card">
              <div className="feature-icon" style={{ fontSize: '3rem' }}>{benefit.icon}</div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-block">
        <div className="container">
          <div 
            className="surface" 
            style={{ 
              padding: '4rem 2rem', 
              textAlign: 'center', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
              borderRadius: '24px',
            }}
          >
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              <h2 style={{ marginBottom: '1rem', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
                Ready to Get Started?
              </h2>
              <p style={{ 
                marginBottom: '2.5rem', 
                color: 'var(--text-secondary)', 
                fontSize: '1.1rem',
                lineHeight: '1.7'
              }}>
                Join thousands of SLIIT students already using our platform for their daily campus needs. 
                Sign up now and experience the convenience.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="button button-primary" style={{ minWidth: '180px' }}>
                  Create Free Account
                </Link>
                <Link to="/login" className="button button-secondary" style={{ minWidth: '180px' }}>
                  Sign In
                </Link>
                <Link to="/rider-dashboard" className="button button-secondary" style={{ minWidth: '180px' }}>
                  Book a Ride
                </Link>
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
                No credit card required • Free for all SLIIT students
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}