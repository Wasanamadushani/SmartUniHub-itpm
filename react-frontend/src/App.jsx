import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import BecomeDriverPage from './pages/BecomeDriverPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RiderDashboardPage from './pages/RiderDashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';
import AdminStudyAreaPage from './pages/AdminStudyAreaPage';
import CanteenAdminPage from './pages/CanteenAdminPage';
import AdminEventsPage from './pages/AdminEventsPage';
import TrackRidePage from './pages/TrackRidePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import CreateEventPage from './pages/CreateEventPage';
import BookEventPage from './pages/BookEventPage';
import EventPaymentPage from './pages/EventPaymentPage';
import EventReceiptUploadPage from './pages/EventReceiptUploadPage';
import EventPaymentSuccessPage from './pages/EventPaymentSuccessPage';
import EventStallRequestPage from './pages/EventStallRequestPage';
import EventMemoriesPage from './pages/EventMemoriesPage';
import EventsCalendarPage from './pages/EventsCalendarPage';
import DashboardTestPage from './pages/DashboardTestPage';
import StudyAreaPage from './pages/StudyAreaPage';
import StudentFinesPage from './pages/StudentFinesPage';
import CanteenPage from './pages/CanteenPage';
import CanteenOffersPage from './pages/CanteenOffersPage';
import CanteenFoodStockPage from './pages/CanteenFoodStockPage';
import CanteenRequestPage from './pages/CanteenRequestPage';
import HelperProfilePage from './pages/HelperProfilePage';
import TransportLoginPage from './pages/TransportLoginPage';
import TransportDashboardPage from './pages/TransportDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import { CanteenProvider } from './context/CanteenContext';

export default function App() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isAdminRoute =
    path === '/admin' ||
    path === '/admin-dashboard' ||
    path.startsWith('/admin-') ||
    path.startsWith('/admin/') ||
    path === '/canteenadmin' ||
    path === '/canteeenadmin' ||
    path === '/admincanteen' ||
    path === '/adminevent';

  return (
    <AuthProvider>
      <CanteenProvider>
        <div className={`app-shell ${isAdminRoute ? 'admin-shell' : ''}`}>
          {isAdminRoute ? (
            <header className="admin-topbar-wrap">
              <div className="container admin-topbar">
                <Link to="/admin" className="admin-brand">Admin Dashboard</Link>
                <nav className="admin-topbar-links">
                  <Link to="/admin">Overview</Link>
                  <Link to="/admin-canteen">Canteen Admin</Link>
                  <Link to="/admin-events">Event Admin</Link>
                  <Link to="/admin-study-area">Study Area Admin</Link>
                </nav>
              </div>
            </header>
          ) : (
            <Navbar />
          )}
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/become-driver" element={<BecomeDriverPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/rider-dashboard" element={<ProtectedRoute><RiderDashboardPage /></ProtectedRoute>} />
              <Route path="/driver-dashboard" element={<ProtectedRoute><DriverDashboardPage /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminPage /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/admin-study-area" element={<ProtectedRoute requiredRole="admin"><AdminStudyAreaPage /></ProtectedRoute>} />
              <Route path="/admin-canteen" element={<ProtectedRoute requiredRole="admin"><CanteenAdminPage /></ProtectedRoute>} />
              <Route path="/admin/canteen" element={<ProtectedRoute requiredRole="admin"><CanteenAdminPage /></ProtectedRoute>} />
              <Route path="/canteenadmin" element={<ProtectedRoute requiredRole="admin"><CanteenAdminPage /></ProtectedRoute>} />
              <Route path="/canteeenadmin" element={<ProtectedRoute requiredRole="admin"><CanteenAdminPage /></ProtectedRoute>} />
              <Route path="/admincanteen" element={<ProtectedRoute requiredRole="admin"><CanteenAdminPage /></ProtectedRoute>} />
              <Route path="/admin-events" element={<ProtectedRoute requiredRole="admin"><AdminEventsPage /></ProtectedRoute>} />
              <Route path="/admin/events" element={<ProtectedRoute requiredRole="admin"><AdminEventsPage /></ProtectedRoute>} />
              <Route path="/adminevent" element={<ProtectedRoute requiredRole="admin"><AdminEventsPage /></ProtectedRoute>} />
              <Route path="/track-ride" element={<TrackRidePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route path="/create-event" element={<CreateEventPage />} />
              <Route path="/book-event" element={<BookEventPage />} />
              <Route path="/book-event/payment" element={<EventPaymentPage />} />
              <Route path="/book-event/payment/receipt" element={<EventReceiptUploadPage />} />
              <Route path="/book-event/payment/success" element={<EventPaymentSuccessPage />} />
              <Route path="/event-stalls/new" element={<EventStallRequestPage />} />
              <Route path="/event-memories" element={<EventMemoriesPage />} />
              <Route path="/events-calendar" element={<EventsCalendarPage />} />
              <Route path="/canteen" element={<CanteenPage />} />
              <Route path="/canteen-offers" element={<CanteenOffersPage />} />
              <Route path="/canteen-food-stock" element={<CanteenFoodStockPage />} />
              <Route path="/canteen-requests" element={<CanteenRequestPage />} />
              <Route path="/helper-profile" element={<HelperProfilePage />} />
              <Route path="/study-area" element={<StudyAreaPage />} />
              <Route path="/student-fines" element={<StudentFinesPage />} />
              <Route path="/transport-login" element={<TransportLoginPage />} />
              <Route path="/transport-dashboard" element={<TransportDashboardPage />} />
              <Route path="/dashboard-test" element={<DashboardTestPage />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          {!isAdminRoute ? <Footer /> : null}
        </div>
      </CanteenProvider>
    </AuthProvider>
  );
}