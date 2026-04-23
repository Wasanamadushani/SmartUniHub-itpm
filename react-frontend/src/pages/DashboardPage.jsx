import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import '../styles/dashboard-unified.css';

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
      roles: ['student', 'rider', 'driver', 'admin', 'staff']
    });

    modules.push({
      id: 'canteen',
      title: 'Canteen Services',
      description: 'Order food, view offers, and manage canteen requests',
      icon: '🍽️',
      path: '/canteen',
      roles: ['student', 'rider', 'driver', 'admin', 'staff']
    });

    modules.push({
      id: 'study-area',
      title: 'Study Area',
      description: 'Book study spaces and manage your study sessions',
      icon: '📚',
      path: '/study-area',
      roles: ['student', 'rider', 'driver', 'admin', 'staff']
    });

    modules.push({
      id: 'fines',
      title: 'My Fines',
      description: 'View and manage your outstanding fines',
      icon: '⚠️',
      path: '/student-fines',
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
        roles: ['admin']
      });

      modules.push({
        id: 'admin-canteen',
        title: 'Canteen Management',
        description: 'Manage food items, offers, and canteen operations',
        icon: '🍳',
        path: '/admin-canteen',
        roles: ['admin']
      });

      modules.push({
        id: 'admin-events',
        title: 'Event Management',
        description: 'Create and manage campus events',
        icon: '📋',
        path: '/admin-events',
        roles: ['admin']
      });

      modules.push({
        id: 'admin-study-area',
        title: 'Study Area Management',
        description: 'Manage study spaces and bookings',
        icon: '🏢',
        path: '/admin-study-area',
        roles: ['admin']
      });
    }

    // Filter modules based on user role
    return modules.filter(module => module.roles.includes(user.role));
  };

  const availableModules = getAvailableModules();

  return (
    <>
      <PageHeader
        eyebrow="Welcome"
        title={`Hello, ${user.name}!`}
        subtitle={`You're logged in as a ${user.role}. Access all available modules below.`}
      />

      <section className="section-block dashboard-section">
        <div className="container">
          <div className="dashboard-header">
            <h2>Your Modules</h2>
            <p className="dashboard-subtitle">
              Select a module to get started. Your role ({user.role}) determines which modules you can access.
            </p>
          </div>

          <div className="modules-grid">
            {availableModules.map((module) => (
              <div
                key={module.id}
                className="module-card"
                onClick={() => navigate(module.path)}
              >
                <div className="module-icon">{module.icon}</div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <button className="module-button">
                  Access Module →
                </button>
              </div>
            ))}
          </div>

          {availableModules.length === 0 && (
            <div className="empty-state">
              <p>No modules available for your role. Please contact an administrator.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section-block user-info-section">
        <div className="container">
          <div className="user-info-card">
            <h3>Your Account Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>{user.name}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              <div className="info-item">
                <label>Student ID</label>
                <p>{user.studentId}</p>
              </div>
              <div className="info-item">
                <label>Role</label>
                <p className="role-badge">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
