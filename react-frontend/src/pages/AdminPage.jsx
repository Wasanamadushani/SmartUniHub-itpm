import PageHeader from '../components/PageHeader';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { clearAuthenticatedUser } from '../lib/auth';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingEvents, setPendingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [dbHealth, setDbHealth] = useState({
    isConnected: false,
    mongoState: 'unknown',
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRides: 0,
    totalEvents: 0,
    pendingApprovals: 0,
    activeRides: 0,
    totalRevenue: 0
  });
  const [transportData, setTransportData] = useState({
    activeRides: [],
    pendingRequests: [],
    topDrivers: [],
    metrics: {
      activeRidesCount: 0,
      pendingRequestsCount: 0,
      completedToday: 0,
      totalDrivers: 0,
      activeRiders: 0,
      revenueToday: 0
    }
  });
  const [transportLoading, setTransportLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [studyAreaData, setStudyAreaData] = useState({
    seats: [],
    bookings: [],
    fines: [],
    metrics: {
      totalSeats: 0,
      occupiedSeats: 0,
      availableSeats: 0,
      occupancyRate: 0,
      activeStudents: 0,
      pendingBookings: 0
    }
  });
  const [studyAreaLoading, setStudyAreaLoading] = useState(false);
  const [eventsData, setEventsData] = useState({
    pendingEvents: [],
    allEvents: [],
    stalls: [],
    bookings: [],
    metrics: {
      totalEvents: 0,
      pendingEventsCount: 0,
      activeStalls: 0,
      pendingStalls: 0,
      pendingPayments: 0
    }
  });
  const [eventsLoading, setEventsLoading] = useState(false);

  async function handleLogout() {
    try {
      clearAuthenticatedUser();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }

  useEffect(() => {
    async function loadEventsData() {
      setEventsLoading(true);
      try {
        const [pendingRes, allRes, stallsRes, bookingsRes] = await Promise.all([
          apiRequest('/api/admin/events/pending'),
          apiRequest('/api/admin/events'),
          apiRequest('/api/admin/stalls'),
          apiRequest('/api/admin/event-bookings?paymentStatus=pending_verification')
        ]);

        const pendingEvents = Array.isArray(pendingRes) ? pendingRes : [];
        const allEvents = Array.isArray(allRes) ? allRes : [];
        const stalls = Array.isArray(stallsRes) ? stallsRes : [];
        const bookings = Array.isArray(bookingsRes) ? bookingsRes : [];

        setPendingEvents(pendingEvents);
        setEventsData({
          pendingEvents,
          allEvents,
          stalls,
          bookings,
          metrics: {
            totalEvents: allEvents.length,
            pendingEventsCount: pendingEvents.length,
            activeStalls: stalls.filter(s => s.status === 'approved').length,
            pendingStalls: stalls.filter(s => s.status === 'pending').length,
            pendingPayments: bookings.length
          }
        });
      } catch (err) {
        console.error('Error loading events data:', err);
      } finally {
        setEventsLoading(false);
        setIsLoading(false);
      }
    }

    if (activeTab === 'events' || activeTab === 'overview') {
      loadEventsData();
    }
  }, [activeTab]);

  useEffect(() => {
    async function loadDbHealth() {
      try {
        const data = await apiRequest('/api/admin/db-health');
        setDbHealth(data);
      } catch (err) {
        console.error('Error loading DB health:', err);
      }
    }

    loadDbHealth();
  }, []);

  useEffect(() => {
    // Generate dynamic notifications
    const newNotifs = [];
    if (transportData.metrics.pendingRequestsCount > 0) {
      newNotifs.push({ id: 'rides', type: 'info', message: `ℹ️ ${transportData.metrics.pendingRequestsCount} ride requests awaiting assignment`, timestamp: new Date() });
    }
    if (eventsData.metrics.pendingEventsCount > 0) {
      newNotifs.push({ id: 'events', type: 'warning', message: `⚠️ ${eventsData.metrics.pendingEventsCount} new events need approval`, timestamp: new Date() });
    }
    if (eventsData.metrics.pendingPayments > 0) {
      newNotifs.push({ id: 'payments', type: 'info', message: `💳 ${eventsData.metrics.pendingPayments} payments awaiting verification`, timestamp: new Date() });
    }
    if (eventsData.metrics.pendingStalls > 0) {
      newNotifs.push({ id: 'stalls', type: 'info', message: `🏪 ${eventsData.metrics.pendingStalls} stall requests pending`, timestamp: new Date() });
    }
    
    if (newNotifs.length === 0 && dbHealth.isConnected) {
      newNotifs.push({ id: 'health', type: 'success', message: '✅ System is running smoothly', timestamp: new Date() });
    }
    
    setNotifications(newNotifs);
  }, [transportData.metrics.pendingRequestsCount, eventsData.metrics.pendingEventsCount, eventsData.metrics.pendingPayments, eventsData.metrics.pendingStalls, dbHealth.isConnected]);

  useEffect(() => {
    async function loadTransportData() {
      setTransportLoading(true);
      try {
        // Load active rides
        const ridesResponse = await apiRequest('/api/rides?status=ongoing,accepted');
        const rides = Array.isArray(ridesResponse) ? ridesResponse : [];
        
        // Load pending requests
        const pendingResponse = await apiRequest('/api/rides?status=pending');
        const pending = Array.isArray(pendingResponse) ? pendingResponse : [];
        
        // Load drivers
        const driversResponse = await apiRequest('/api/drivers?isApproved=true');
        const drivers = Array.isArray(driversResponse) ? driversResponse : [];
        
        // Calculate metrics
        const completedToday = await apiRequest('/api/rides/stats/completed-today').catch(() => ({ count: 0 }));
        const revenueToday = await apiRequest('/api/rides/stats/revenue-today').catch(() => ({ total: 0 }));
        
        setTransportData({
          activeRides: rides.slice(0, 10),
          pendingRequests: pending.slice(0, 10),
          topDrivers: drivers.slice(0, 5),
          metrics: {
            activeRidesCount: rides.length,
            pendingRequestsCount: pending.length,
            completedToday: completedToday.count || 0,
            totalDrivers: drivers.length,
            activeRiders: rides.length,
            revenueToday: revenueToday.total || 0
          }
        });
        
        // Load all users and drivers for management
        const usersResponse = await apiRequest('/api/users');
        setAllUsers(Array.isArray(usersResponse) ? usersResponse : []);
        
        const allDriversResponse = await apiRequest('/api/drivers');
        setAllDrivers(Array.isArray(allDriversResponse) ? allDriversResponse : []);
      } catch (err) {
        console.error('Error loading transport data:', err);
      } finally {
        setTransportLoading(false);
      }
    }

    if (activeTab === 'transport' || activeTab === 'users' || activeTab === 'overview') {
      loadTransportData();
    }
  }, [activeTab]);

  const fetchStudyAreaData = async () => {
    setStudyAreaLoading(true);
    try {
      // Load seats
      const seatsResponse = await apiRequest('/api/seats');
      const seats = Array.isArray(seatsResponse) ? seatsResponse : [];
      
      // Load seat bookings
      const bookingsResponse = await apiRequest('/api/bookings?status=booked');
      const bookings = Array.isArray(bookingsResponse) ? bookingsResponse : [];
      
      // Load fines
      const finesResponse = await apiRequest('/api/fines');
      const fines = Array.isArray(finesResponse) ? finesResponse : [];
      
      // Calculate metrics
      const totalSeats = seats.length;
      const occupiedSeats = seats.filter(s => s.status === 'occupied').length;
      const availableSeats = totalSeats - occupiedSeats;
      const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
      
      setStudyAreaData({
        seats: seats.slice(0, 20),
        bookings: bookings.slice(0, 10),
        fines: fines.slice(0, 10),
        metrics: {
          totalSeats,
          occupiedSeats,
          availableSeats,
          occupancyRate,
          activeStudents: occupiedSeats,
          pendingBookings: bookings.length
        }
      });
    } catch (err) {
      console.error('Error loading study area data:', err);
    } finally {
      setStudyAreaLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'study-area') {
      fetchStudyAreaData();
    }
  }, [activeTab]);

  // PDF Download function
  async function downloadUsersPDF() {
    try {
      // Create a simple CSV format that can be converted to PDF
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Name,Email,Role,Phone,Status,Joined Date\n';
      
      allUsers.forEach(user => {
        const row = [
          user.name || 'N/A',
          user.email || 'N/A',
          user.role || 'N/A',
          user.phone || 'N/A',
          user.status || 'Active',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
        ].join(',');
        csvContent += row + '\n';
      });

      // Create a blob and download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `users_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download report');
    }
  }

  // Add notification
  function addNotification(message, type = 'info') {
    const newNotification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }

  // Remove notification
  function removeNotification(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const handleAddSeat = async () => {
    const tableId = prompt('Enter Table ID (number):');
    const seatNumber = prompt('Enter Seat Number:');
    if (!tableId || !seatNumber) return;
    
    try {
      await apiRequest('/api/seats', {
        method: 'POST',
        body: JSON.stringify({ tableId: Number(tableId), seatNumber: Number(seatNumber) })
      });
      addNotification(`✅ Seat T${tableId}-S${seatNumber} added successfully`, 'success');
      fetchStudyAreaData();
    } catch(err) {
      addNotification(`❌ Error adding seat: ${err.message}`, 'warning');
    }
  };

  const handleSyncSeats = () => {
    fetchStudyAreaData();
    addNotification('🔄 Seat availability synced successfully', 'success');
  };

  const handleViewAnalytics = () => {
    addNotification(`📊 Analytics Summary: ${studyAreaData.metrics.occupancyRate}% Occupancy. ${studyAreaData.metrics.totalSeats} Total Seats.`, 'info');
  };

  const handleRemoveSeat = async () => {
    const tableId = prompt('Enter Table ID to remove:');
    const seatNumber = prompt('Enter Seat Number to remove:');
    if (!tableId || !seatNumber) return;
    
    const seatIdTarget = `T${tableId}-S${seatNumber}`;
    try {
      const allSeatsRes = await apiRequest('/api/seats');
      const seatsArray = Array.isArray(allSeatsRes) ? allSeatsRes : [];
      const targetSeat = seatsArray.find(s => s.seatId === seatIdTarget);
      
      if(!targetSeat) {
         addNotification(`❌ Seat ${seatIdTarget} not found!`, 'warning');
         return;
      }

      await apiRequest(`/api/seats/${targetSeat._id}`, {
        method: 'DELETE'
      });
      addNotification(`🗑️ Seat ${seatIdTarget} removed completely`, 'success');
      fetchStudyAreaData();
    } catch(err) {
      addNotification(`❌ Error removing seat: ${err.message}`, 'warning');
    }
  };

  const handleEditSeat = async (seat) => {
    let currentTable = '';
    let currentSeat = '';
    if (seat.seatId && seat.seatId.includes('T') && seat.seatId.includes('-S')) {
      const parts = seat.seatId.split('-S');
      currentTable = parts[0].replace('T', '');
      currentSeat = parts[1];
    }

    const newTableId = prompt(`Enter new Table ID for ${seat.seatId || seat._id}:`, currentTable);
    if (newTableId === null) return;
    
    const newSeatNumber = prompt(`Enter new Seat Number for ${seat.seatId || seat._id}:`, currentSeat);
    if (newSeatNumber === null) return;

    if (!newTableId || !newSeatNumber) {
      addNotification('❌ Both Table ID and Seat Number are required to edit', 'warning');
      return;
    }

    try {
      await apiRequest(`/api/seats/${seat._id}`, {
        method: 'PUT',
        body: JSON.stringify({ tableId: Number(newTableId), seatNumber: Number(newSeatNumber) })
      });
      addNotification(`✅ Seat updated successfully to T${newTableId}-S${newSeatNumber}`, 'success');
      fetchStudyAreaData();
    } catch(err) {
      addNotification(`❌ Error updating seat: ${err.message}`, 'warning');
    }
  };

  const handleViewFine = async (fine) => {
    let details = `Fine Details:\n\nStudent: ${fine.user?.name || 'N/A'}\nReason: ${fine.reason}\nAmount: LKR ${fine.amount}\nStatus: ${fine.status.toUpperCase()}\nDate: ${new Date(fine.createdAt).toLocaleString()}`;
    
    if (fine.status === 'unpaid') {
      const confirmPay = window.confirm(`${details}\n\nDo you want to manually mark this fine as PAID?`);
      if (confirmPay) {
        try {
          await apiRequest(`/api/fines/pay/${fine._id}`, {
            method: 'PUT'
          });
          addNotification(`✅ Fine for ${fine.user?.name || 'student'} marked as paid.`, 'success');
          fetchStudyAreaData();
        } catch (err) {
          addNotification(`❌ Error updating fine: ${err.message}`, 'warning');
        }
      }
    } else {
      window.alert(details);
    }
  };

  async function handleApprove(eventId) {
    try {
      await apiRequest(`/api/admin/events/${eventId}/approve`, {
        method: 'POST',
      });
      addNotification('✅ Event approved successfully', 'success');
      // Refresh data
      const data = await apiRequest('/api/admin/events/pending');
      setPendingEvents(data);
      // Also refresh eventsData
      const allRes = await apiRequest('/api/admin/events');
      setEventsData(prev => ({ 
        ...prev, 
        pendingEvents: data, 
        allEvents: Array.isArray(allRes) ? allRes : prev.allEvents 
      }));
    } catch (err) {
      console.error('Error approving event:', err);
      addNotification('❌ Error approving event', 'warning');
    }
  }

  async function handleReject(eventId) {
    try {
      await apiRequest(`/api/admin/events/${eventId}/reject`, {
        method: 'POST',
      });
      addNotification('⚠️ Event rejected', 'info');
      // Refresh data
      const data = await apiRequest('/api/admin/events/pending');
      setPendingEvents(data);
      // Also refresh eventsData
      const allRes = await apiRequest('/api/admin/events');
      setEventsData(prev => ({ 
        ...prev, 
        pendingEvents: data, 
        allEvents: Array.isArray(allRes) ? allRes : prev.allEvents 
      }));
    } catch (err) {
      console.error('Error rejecting event:', err);
      addNotification('❌ Error rejecting event', 'warning');
    }
  }

  async function handleStallStatus(stallId, status) {
    try {
      await apiRequest(`/api/admin/stalls/${stallId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      addNotification(`✅ Stall ${status} successfully`, 'success');
      // Refresh stalls
      const stallsRes = await apiRequest('/api/admin/stalls');
      setEventsData(prev => ({ 
        ...prev, 
        stalls: Array.isArray(stallsRes) ? stallsRes : prev.stalls 
      }));
    } catch (err) {
      console.error('Error updating stall status:', err);
      addNotification('❌ Error updating stall status', 'warning');
    }
  }

  async function handleVerifyPayment(bookingId, paymentStatus) {
    const note = prompt('Enter a verification note (optional):');
    try {
      await apiRequest(`/api/admin/event-bookings/${bookingId}/payment-status`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus, note })
      });
      addNotification(`✅ Payment ${paymentStatus} successfully`, 'success');
      // Refresh bookings
      const bookingsRes = await apiRequest('/api/admin/event-bookings?paymentStatus=pending_verification');
      setEventsData(prev => ({ 
        ...prev, 
        bookings: Array.isArray(bookingsRes) ? bookingsRes : prev.bookings 
      }));
    } catch (err) {
      console.error('Error verifying payment:', err);
      addNotification('❌ Error verifying payment', 'warning');
    }
  }

  async function handleUpdateEventStatus(eventId, status) {
    try {
      await apiRequest(`/api/admin/events/${eventId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      addNotification(`✅ Event status updated to ${status}`, 'success');
      // Refresh all events
      const allRes = await apiRequest('/api/admin/events');
      setEventsData(prev => ({ 
        ...prev, 
        allEvents: Array.isArray(allRes) ? allRes : prev.allEvents 
      }));
    } catch (err) {
      console.error('Error updating event status:', err);
      addNotification('❌ Error updating event status', 'warning');
    }
  }

  async function handleDeleteEvent(eventId) {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await apiRequest(`/api/admin/events/${eventId}`, {
        method: 'DELETE'
      });
      addNotification('🗑️ Event deleted successfully', 'success');
      // Refresh events
      const [pendingRes, allRes] = await Promise.all([
        apiRequest('/api/admin/events/pending'),
        apiRequest('/api/admin/events')
      ]);
      setPendingEvents(pendingRes);
      setEventsData(prev => ({ 
        ...prev, 
        pendingEvents: pendingRes, 
        allEvents: allRes 
      }));
    } catch (err) {
      console.error('Error deleting event:', err);
      addNotification('❌ Error deleting event', 'warning');
    }
  }

  async function handleAssignDriver(rideId) {
    // Get list of available drivers
    try {
      const drivers = await apiRequest('/api/drivers?isApproved=true&isAvailable=true');
      
      if (!drivers || drivers.length === 0) {
        addNotification('❌ No available drivers found', 'warning');
        return;
      }

      // Create a simple prompt with driver names
      const driverList = drivers.map((d, idx) => `${idx + 1}. ${d.user?.name || 'Driver'} - ${d.vehicleModel || 'Vehicle'} (${d.vehicleNumber || 'N/A'})`).join('\n');
      const selection = prompt(`Select a driver by number:\n\n${driverList}`);
      
      if (!selection) return;
      
      const driverIndex = parseInt(selection) - 1;
      if (isNaN(driverIndex) || driverIndex < 0 || driverIndex >= drivers.length) {
        addNotification('❌ Invalid driver selection', 'warning');
        return;
      }

      const selectedDriver = drivers[driverIndex];
      const fare = prompt('Enter fare amount (Rs.):');
      
      if (!fare || isNaN(fare) || parseFloat(fare) <= 0) {
        addNotification('❌ Invalid fare amount', 'warning');
        return;
      }

      // Assign driver to ride
      await apiRequest(`/api/rides/${rideId}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({
          driverId: selectedDriver._id,
          fare: parseFloat(fare)
        })
      });

      addNotification('✅ Driver assigned successfully', 'success');
      
      // Refresh transport data
      const pendingResponse = await apiRequest('/api/rides?status=pending');
      const pending = Array.isArray(pendingResponse) ? pendingResponse : [];
      setTransportData(prev => ({
        ...prev,
        pendingRequests: pending.slice(0, 10)
      }));
    } catch (err) {
      console.error('Error assigning driver:', err);
      addNotification(`❌ Error assigning driver: ${err.message}`, 'warning');
    }
  }

  async function handleCancelRide(rideId) {
    if (!window.confirm('Are you sure you want to cancel this ride request?')) return;
    
    const reason = prompt('Enter cancellation reason (optional):');
    
    try {
      await apiRequest(`/api/rides/${rideId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: reason || 'Cancelled by admin' })
      });

      addNotification('✅ Ride cancelled successfully', 'success');
      
      // Refresh transport data
      const pendingResponse = await apiRequest('/api/rides?status=pending');
      const pending = Array.isArray(pendingResponse) ? pendingResponse : [];
      setTransportData(prev => ({
        ...prev,
        pendingRequests: pending.slice(0, 10)
      }));
    } catch (err) {
      console.error('Error cancelling ride:', err);
      addNotification(`❌ Error cancelling ride: ${err.message}`, 'warning');
    }
  }

  async function handleDeleteStall(stallId) {
    if (!window.confirm('Are you sure you want to delete this stall request?')) return;
    try {
      await apiRequest(`/api/admin/stalls/${stallId}`, {
        method: 'DELETE'
      });
      addNotification('🗑️ Stall deleted successfully', 'success');
      // Refresh stalls
      const stallsRes = await apiRequest('/api/admin/stalls');
      setEventsData(prev => ({ 
        ...prev, 
        stalls: Array.isArray(stallsRes) ? stallsRes : prev.stalls 
      }));
    } catch (err) {
      console.error('Error deleting stall:', err);
      addNotification('❌ Error deleting stall', 'warning');
    }
  }

  function renderTab() {
    if (activeTab === 'transport') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Transport Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { label: 'Active Rides', value: transportData.metrics.activeRidesCount, icon: '🚗', color: '#f59e0b' },
              { label: 'Pending Requests', value: transportData.metrics.pendingRequestsCount, icon: '⏳', color: '#ef4444' },
              { label: 'Completed Today', value: transportData.metrics.completedToday, icon: '✅', color: '#10b981' },
              { label: 'Total Drivers', value: transportData.metrics.totalDrivers, icon: '👨‍🚗', color: '#3b82f6' },
              { label: 'Active Riders', value: transportData.metrics.activeRiders, icon: '👥', color: '#8b5cf6' },
              { label: 'Revenue Today', value: `LKR ${transportData.metrics.revenueToday}`, icon: '💰', color: '#06b6d4' }
            ].map((metric, idx) => (
              <div key={idx} className="surface dashboard-panel" style={{
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {metric.icon}
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {metric.label}
                </p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: metric.color }}>
                  {metric.value}
                </h3>
              </div>
            ))}
          </div>

          {/* Active Rides Monitor */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🚗</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Active Rides Monitor</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time tracking of ongoing rides</p>
              </div>
            </div>

            {transportLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading active rides...</p>
            ) : transportData.activeRides.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No active rides at the moment</p>
              </div>
            ) : (
              <div className="card-stack">
                {transportData.activeRides.map((ride) => (
                  <div key={ride._id} className="surface nested-card" style={{
                    padding: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
                          {ride.riderId?.name || 'Rider'}
                        </strong>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          Driver: {ride.driverId?.user?.name || 'Unassigned'}
                        </p>
                      </div>
                      <span className="pill" style={{
                        background: ride.status === 'ongoing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: ride.status === 'ongoing' ? '#f59e0b' : '#3b82f6'
                      }}>
                        {ride.status === 'ongoing' ? '🚗 In Transit' : '📍 Accepted'}
                      </span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        📍 {ride.pickupLocation?.address || ride.pickupLocation || 'Pickup'} → 🎯 {ride.dropLocation?.address || ride.dropLocation || 'Drop'}
                      </p>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        background: 'var(--border)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${ride.status === 'ongoing' ? 65 : 30}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                      <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {ride.status === 'ongoing' ? '65' : '30'}% Complete
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>
                        LKR {ride.fare || 0}
                      </strong>
                      <button type="button" className="button button-secondary button-small">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Ride Requests */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Pending Ride Requests</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Awaiting driver acceptance</p>
              </div>
            </div>

            {transportLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading pending requests...</p>
            ) : transportData.pendingRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="card-stack">
                {transportData.pendingRequests.map((request) => (
                  <div key={request._id} className="surface nested-card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
                        {request.riderId?.name || 'Rider'}
                      </strong>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        📍 {request.pickupLocation?.address || request.pickupLocation || 'Pickup'} → 🎯 {request.dropLocation?.address || request.dropLocation || 'Drop'}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        👥 {request.passengers || 1} passenger{request.passengers > 1 ? 's' : ''} • ⏱️ {new Date(request.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        type="button" 
                        className="button button-primary button-small"
                        onClick={() => handleAssignDriver(request._id)}
                      >
                        Assign Driver
                      </button>
                      <button 
                        type="button" 
                        className="button button-secondary button-small"
                        onClick={() => handleCancelRide(request._id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Driver Performance */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>⭐</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Top Drivers</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Best performing drivers this week</p>
              </div>
            </div>

            {transportLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading driver data...</p>
            ) : transportData.topDrivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No drivers available</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.95rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Driver Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Rides</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Rating</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Vehicle</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transportData.topDrivers.map((driver, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong>{driver.user?.name || 'Driver'}</strong>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {driver.ridesCompleted || 0}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                            ⭐ {Number(driver.rating || 0).toFixed(1)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {driver.vehicleModel || 'N/A'} • {driver.vehicleNumber || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="pill" style={{
                            background: driver.isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: driver.isApproved ? '#10b981' : '#6b7280'
                          }}>
                            {driver.isApproved ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Management */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>👥</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>User Management</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Control and monitor all users</p>
                </div>
              </div>
              <button 
                type="button" 
                className="button button-primary button-small"
                onClick={downloadUsersPDF}
              >
                📥 Download Report
              </button>
            </div>

            {transportLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading users...</p>
            ) : allUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No users found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.95rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Email</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Role</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Phone</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.slice(0, 20).map((user, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong>{user.name || 'N/A'}</strong>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {user.email || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="pill" style={{
                            background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: user.role === 'admin' ? '#ef4444' : '#3b82f6'
                          }}>
                            {user.role || 'user'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {user.phone || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="pill success" style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981'
                          }}>
                            Active
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button type="button" className="button button-secondary button-small">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Driver Management */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🚗</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Driver Management</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve, suspend, or manage drivers</p>
              </div>
            </div>

            {transportLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading drivers...</p>
            ) : allDrivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No drivers found</p>
              </div>
            ) : (
              <div className="card-stack">
                {allDrivers.slice(0, 10).map((driver) => (
                  <div key={driver._id} className="surface nested-card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
                        {driver.user?.name || 'Driver'}
                      </strong>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        📧 {driver.user?.email || 'N/A'} • 📞 {driver.user?.phone || 'N/A'}
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        🚗 {driver.vehicleModel || 'N/A'} • {driver.vehicleNumber || 'N/A'} • ⭐ {Number(driver.rating || 0).toFixed(1)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="pill" style={{
                        background: driver.isApproved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: driver.isApproved ? '#10b981' : '#ef4444'
                      }}>
                        {driver.isApproved ? '✅ Approved' : '⏳ Pending'}
                      </span>
                      {!driver.isApproved ? (
                        <button 
                          type="button" 
                          className="button button-primary button-small"
                          onClick={async () => {
                            try {
                              await apiRequest(`/api/drivers/${driver._id}/approve`, {
                                method: 'PATCH'
                              });
                              addNotification(`✅ Driver ${driver.user?.name || 'driver'} approved successfully`, 'success');
                              // Refresh drivers
                              const allDriversResponse = await apiRequest('/api/drivers');
                              setAllDrivers(Array.isArray(allDriversResponse) ? allDriversResponse : []);
                            } catch (err) {
                              addNotification(`❌ Error approving driver: ${err.message}`, 'warning');
                            }
                          }}
                        >
                          Approve
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="button button-secondary button-small"
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to suspend this driver?')) return;
                            try {
                              await apiRequest(`/api/drivers/${driver._id}/reject`, {
                                method: 'PATCH'
                              });
                              addNotification(`⚠️ Driver ${driver.user?.name || 'driver'} suspended`, 'info');
                              // Refresh drivers
                              const allDriversResponse = await apiRequest('/api/drivers');
                              setAllDrivers(Array.isArray(allDriversResponse) ? allDriversResponse : []);
                            } catch (err) {
                              addNotification(`❌ Error suspending driver: ${err.message}`, 'warning');
                            }
                          }}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'overview') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { label: 'Total Users', value: allUsers.length || '0', icon: '👥', color: '#3b82f6' },
              { label: 'Active Rides', value: transportData.metrics.activeRidesCount || '0', icon: '🚗', color: '#f59e0b' },
              { label: 'Total Events', value: eventsData.metrics.totalEvents || '0', icon: '🎉', color: '#8b5cf6' },
              { label: 'Pending Approvals', value: (eventsData.metrics.pendingEventsCount + eventsData.metrics.pendingStalls + eventsData.metrics.pendingPayments + transportData.metrics.pendingRequestsCount) || '0', icon: '⏳', color: '#ef4444' },
              { label: 'Total Revenue', value: `LKR ${transportData.metrics.revenueToday || 0}`, icon: '💰', color: '#10b981' },
              { label: 'System Health', value: dbHealth.isConnected ? 'Good' : 'Poor', icon: '✅', color: '#06b6d4' }
            ].map((metric, idx) => (
              <div key={idx} className="surface dashboard-panel" style={{
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  background: `${metric.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem'
                }}>
                  {metric.icon}
                </div>
                <div>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {metric.label}
                  </p>
                  <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: metric.color }}>
                    {metric.value}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Database Status */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🗄️</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Database Status</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>System health and connectivity</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{
                padding: '1rem',
                background: dbHealth.isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: `2px solid ${dbHealth.isConnected ? '#10b981' : '#ef4444'}`
              }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  Connection Status
                </p>
                <strong style={{ fontSize: '1.2rem', color: dbHealth.isConnected ? '#10b981' : '#ef4444' }}>
                  {dbHealth.isConnected ? '✅ Connected' : '❌ Disconnected'}
                </strong>
              </div>
              <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                border: '2px solid #3b82f6'
              }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  MongoDB State
                </p>
                <strong style={{ fontSize: '1.2rem', color: '#3b82f6' }}>
                  {dbHealth.mongoState || 'Unknown'}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="surface dashboard-panel">
            <h2 style={{ marginBottom: '1.5rem' }}>Quick Access</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              <Link to="/admin-study-area" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none' }}>
                📚 Study Area Admin
              </Link>
              <Link to="/admin-canteen" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none' }}>
                🍽️ Canteen Admin
              </Link>
              <Link to="/admin-events" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center', textDecoration: 'none' }}>
                🎉 Event Admin
              </Link>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }} onClick={() => setActiveTab('users')}>
                👥 User Management
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'events') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Events Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { label: 'Total Events', value: eventsData.metrics.totalEvents, icon: '🎉', color: '#8b5cf6' },
              { label: 'Pending Approvals', value: eventsData.metrics.pendingEventsCount, icon: '⏳', color: '#ef4444' },
              { label: 'Pending Stalls', value: eventsData.metrics.pendingStalls, icon: '🏪', color: '#f59e0b' },
              { label: 'Pending Payments', value: eventsData.metrics.pendingPayments, icon: '💰', color: '#10b981' }
            ].map((metric, idx) => (
              <div key={idx} className="surface dashboard-panel" style={{
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{metric.icon}</div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{metric.label}</p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: metric.color }}>{metric.value}</h3>
              </div>
            ))}
          </div>

          {/* Pending Event Approvals Section */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Pending Event Approvals</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review and approve new event submissions</p>
              </div>
            </div>

            {eventsLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading pending events...</p>
            ) : eventsData.pendingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No pending events to review</p>
              </div>
            ) : (
              <div className="card-stack">
                {eventsData.pendingEvents.map((event) => (
                  <div key={event._id} className="surface nested-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.5rem' }}>{event.title}</strong>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        📍 {event.location} • 📅 {new Date(event.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" className="button button-primary button-small" onClick={() => handleApprove(event._id)}>✅ Approve</button>
                      <button type="button" className="button button-secondary button-small" onClick={() => handleReject(event._id)}>❌ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Events Lifecycle Section */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>📅</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Event Lifecycle Management</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor and update status of all platform events</p>
              </div>
            </div>

            {eventsLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading events...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Event Title</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventsData.allEvents.slice(0, 10).map((event) => (
                      <tr key={event._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}><strong>{event.title}</strong></td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{new Date(event.startDate).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem' }}>
                          <select 
                            value={event.status} 
                            onChange={(e) => handleUpdateEventStatus(event._id, e.target.value)}
                            style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button type="button" className="button button-secondary button-small" style={{ color: '#ef4444' }} onClick={() => handleDeleteEvent(event._id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stall Management Section */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🏪</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Stall Management</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage stall requests for events</p>
              </div>
            </div>

            {eventsLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading stalls...</p>
            ) : eventsData.stalls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No stall requests found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Stall Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Event</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventsData.stalls.map((stall) => (
                      <tr key={stall._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}><strong>{stall.stallName}</strong></td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{stall.eventId?.title || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span className="pill" style={{
                            background: stall.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : stall.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: stall.status === 'approved' ? '#10b981' : stall.status === 'pending' ? '#f59e0b' : '#ef4444'
                          }}>
                            {stall.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            {stall.status === 'pending' && (
                              <>
                                <button type="button" className="button button-primary button-small" onClick={() => handleStallStatus(stall._id, 'approved')}>Approve</button>
                                <button type="button" className="button button-secondary button-small" onClick={() => handleStallStatus(stall._id, 'rejected')}>Reject</button>
                              </>
                            )}
                            <button type="button" className="button button-secondary button-small" style={{ color: '#ef4444' }} onClick={() => handleDeleteStall(stall._id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Verification Section */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>💳</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Booking & Payment Verification</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Verify payment receipts for event bookings</p>
              </div>
            </div>

            {eventsLoading ? (
               <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading bookings...</p>
            ) : eventsData.bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No pending payment verifications</p>
              </div>
            ) : (
              <div className="card-stack">
                {eventsData.bookings.map((booking) => (
                  <div key={booking._id} className="surface nested-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>{booking.userName}</strong>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Event: {booking.event?.title || 'N/A'} • Tickets: {booking.bookingCount} • Amount: LKR {booking.paymentAmount}
                      </p>
                      {booking.paymentReceiptData && (
                        <a href={booking.paymentReceiptData} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
                          📄 View Payment Receipt
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" className="button button-primary button-small" onClick={() => handleVerifyPayment(booking._id, 'approved')}>✅ Verify</button>
                      <button type="button" className="button button-secondary button-small" onClick={() => handleVerifyPayment(booking._id, 'rejected')}>❌ Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'users') {
      return (
        <div className="surface dashboard-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '2rem' }}>👥</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>User Management</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>View and manage all system users</p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.95rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Name</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Role</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length > 0 ? allUsers.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong>{user.name}</strong>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="pill" style={{
                        background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: user.role === 'admin' ? '#ef4444' : '#3b82f6'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="pill success" style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981'
                      }}>
                        Active
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'study-area') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Study Area Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { label: 'Total Seats', value: studyAreaData.metrics.totalSeats, icon: '🪑', color: '#3b82f6' },
              { label: 'Occupied Seats', value: studyAreaData.metrics.occupiedSeats, icon: '👤', color: '#f59e0b' },
              { label: 'Available Seats', value: studyAreaData.metrics.availableSeats, icon: '✅', color: '#10b981' },
              { label: 'Occupancy Rate', value: `${studyAreaData.metrics.occupancyRate}%`, icon: '📊', color: '#8b5cf6' },
              { label: 'Active Students', value: studyAreaData.metrics.activeStudents, icon: '👥', color: '#06b6d4' },
              { label: 'Pending Bookings', value: studyAreaData.metrics.pendingBookings, icon: '⏳', color: '#ef4444' }
            ].map((metric, idx) => (
              <div key={idx} className="surface dashboard-panel" style={{
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {metric.icon}
                </div>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {metric.label}
                </p>
                <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: metric.color }}>
                  {metric.value}
                </h3>
              </div>
            ))}
          </div>

          {/* Seat Management */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🪑</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Seat Management</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage study area seats and availability</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <button type="button" className="button button-primary" style={{ padding: '1rem' }} onClick={handleAddSeat}>
                ➕ Add Seats
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }} onClick={handleSyncSeats}>
                🔄 Sync Availability
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }} onClick={handleViewAnalytics}>
                📊 View Analytics
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }} onClick={handleRemoveSeat}>
                🗑️ Remove Seats
              </button>
            </div>

            {studyAreaLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading seats...</p>
            ) : studyAreaData.seats.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No seats found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.95rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Seat ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Location</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Booked By</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studyAreaData.seats.map((seat, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong>{seat.seatId || seat._id || 'N/A'}</strong>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {seat.location || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="pill" style={{
                            background: seat.status === 'occupied' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: seat.status === 'occupied' ? '#f59e0b' : '#10b981'
                          }}>
                            {seat.status === 'occupied' ? '👤 Occupied' : '✅ Available'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {seat.bookedBy?.name || seat.bookedBy || '-'}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button type="button" className="button button-secondary button-small" onClick={() => handleEditSeat(seat)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Booking Requests */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>⏳</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Pending Booking Requests</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve or reject seat booking requests</p>
              </div>
            </div>

            {studyAreaLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading bookings...</p>
            ) : studyAreaData.bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No pending bookings</p>
              </div>
            ) : (
              <div className="card-stack">
                {studyAreaData.bookings.map((booking) => (
                  <div key={booking._id} className="surface nested-card" style={{
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>
                        {booking.user?.name || 'Student'}
                      </strong>
                      <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Seat: T{booking.seat?.tableId}-S{booking.seat?.seatNumber} • Date: {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'N/A'} • Time: {booking.startTime || 'N/A'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button type="button" className="button button-primary button-small">
                        ✅ Approve
                      </button>
                      <button type="button" className="button button-secondary button-small">
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fine Management */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>💰</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Fine Management</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Track and manage student fines</p>
              </div>
            </div>

            {studyAreaLoading ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading fines...</p>
            ) : studyAreaData.fines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <p>No fines recorded</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.95rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Student Name</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Reason</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Amount</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studyAreaData.fines.map((fine, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem' }}>
                          <strong>{fine.user?.name || 'Student'}</strong>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                          {fine.reason || 'N/A'}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600', color: '#ef4444' }}>
                          LKR {fine.amount || 0}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span className="pill" style={{
                            background: fine.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: fine.status === 'paid' ? '#10b981' : '#ef4444'
                          }}>
                            {fine.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <button type="button" className="button button-secondary button-small" onClick={() => handleViewFine(fine)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }




    if (activeTab === 'settings') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Settings Header */}
          <div style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            color: 'white'
          }}>
            <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️ System Settings</h1>
            <p style={{ margin: 0, opacity: 0.9 }}>Configure platform behavior, notifications, and system preferences</p>
          </div>

          {/* Platform Configuration */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🏢</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Platform Configuration</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize platform name, branding, and core settings</p>
              </div>
            </div>
            
            <div className="field-grid two-col">
              <label>
                <strong>Platform Name</strong>
                <input type="text" defaultValue="SLIIT Student Transport" placeholder="Enter platform name" />
              </label>
              <label>
                <strong>Support Email</strong>
                <input type="email" defaultValue="support@sliit.lk" placeholder="support@example.com" />
              </label>
              <label>
                <strong>Support Phone</strong>
                <input type="tel" defaultValue="+94 77 123 4567" placeholder="+94 XX XXX XXXX" />
              </label>
              <label>
                <strong>Website URL</strong>
                <input type="url" defaultValue="https://sliit-transport.lk" placeholder="https://example.com" />
              </label>
              <label style={{ gridColumn: '1 / -1' }}>
                <strong>Platform Description</strong>
                <textarea placeholder="Describe your platform..." defaultValue="SLIIT Student Transport - Connecting students with reliable rides" style={{ minHeight: '80px', fontFamily: 'inherit' }} />
              </label>
            </div>
          </div>

          {/* Pricing & Commission */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>💰</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Pricing & Commission</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set fare rates and commission structure</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label>
                  <strong>Base Fare (LKR)</strong>
                  <input type="number" defaultValue="100" placeholder="100" />
                </label>
                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Minimum fare for any ride</p>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label>
                  <strong>Per KM Rate (LKR)</strong>
                  <input type="number" defaultValue="25" placeholder="25" />
                </label>
                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Charge per kilometer</p>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label>
                  <strong>Commission Rate (%)</strong>
                  <input type="number" defaultValue="10" placeholder="10" />
                </label>
                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Platform commission from each ride</p>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label>
                  <strong>Surge Multiplier</strong>
                  <input type="number" defaultValue="1.5" placeholder="1.5" step="0.1" />
                </label>
                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Peak hour multiplier</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🔔</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Notification Preferences</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure system notifications and alerts</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { title: 'Email Notifications', desc: 'Send email alerts for important events', icon: '📧', checked: true },
                { title: 'SMS Alerts', desc: 'Send SMS for ride updates and emergencies', icon: '📱', checked: true },
                { title: 'Push Notifications', desc: 'Browser push notifications for real-time updates', icon: '🔔', checked: true },
                { title: 'Ride Confirmations', desc: 'Notify users when rides are confirmed', icon: '✅', checked: true },
                { title: 'Driver Arrival Alerts', desc: 'Alert riders when driver is nearby', icon: '📍', checked: true },
                { title: 'Payment Receipts', desc: 'Send payment confirmation emails', icon: '💳', checked: true },
                { title: 'Promotional Messages', desc: 'Send offers and promotional content', icon: '🎉', checked: false },
                { title: 'System Alerts', desc: 'Critical system and maintenance alerts', icon: '⚠️', checked: true }
              ].map((item, idx) => (
                <label key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}>
                  <input type="checkbox" defaultChecked={item.checked} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{item.icon} {item.title}</strong>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Security Settings */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🔒</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Security & Access Control</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage security policies and access controls</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Password Policy</h3>
                <div className="field-grid two-col">
                  <label>
                    <strong>Minimum Password Length</strong>
                    <input type="number" defaultValue="8" min="6" max="20" />
                  </label>
                  <label>
                    <strong>Password Expiry (Days)</strong>
                    <input type="number" defaultValue="90" placeholder="0 for no expiry" />
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Security Features</h3>
                {[
                  { label: 'Enable Two-Factor Authentication', checked: true },
                  { label: 'Require Email Verification', checked: true },
                  { label: 'Enable IP Whitelisting', checked: false },
                  { label: 'Enable Session Timeout', checked: true }
                ].map((item, idx) => (
                  <label key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}>
                    <input type="checkbox" defaultChecked={item.checked} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* System Maintenance */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🔧</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>System Maintenance</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Perform system maintenance and cleanup tasks</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button type="button" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center' }}>
                🗑️ Clear Cache
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center' }}>
                📊 Generate Reports
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center' }}>
                🔄 Sync Database
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem', textAlign: 'center' }}>
                📥 Backup Data
              </button>
            </div>
          </div>

          {/* API Configuration */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>🔌</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>API & Integrations</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure external services and API keys</p>
              </div>
            </div>
            
            <div className="field-grid two-col">
              <label>
                <strong>Google Maps API Key</strong>
                <input type="password" placeholder="Enter API key" defaultValue="••••••••••••••••" />
              </label>
              <label>
                <strong>Twilio Account SID</strong>
                <input type="password" placeholder="Enter Account SID" defaultValue="••••••••••••••••" />
              </label>
              <label>
                <strong>Stripe API Key</strong>
                <input type="password" placeholder="Enter API key" defaultValue="••••••••••••••••" />
              </label>
              <label>
                <strong>Firebase Project ID</strong>
                <input type="text" placeholder="Enter Project ID" defaultValue="sliit-transport" />
              </label>
            </div>
          </div>

          {/* Backup & Export */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>💾</span>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Data Management</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Backup, export, and manage system data</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>📥 Export Data</h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Export all system data as JSON</p>
                <button type="button" className="button button-primary button-small">
                  Export JSON
                </button>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>💾 Create Backup</h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create full system backup</p>
                <button type="button" className="button button-primary button-small">
                  Backup Now
                </button>
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>📊 View Backups</h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage existing backups</p>
                <button type="button" className="button button-primary button-small">
                  View Backups
                </button>
              </div>
            </div>
          </div>

          {/* Save & Logout */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="button button-primary" style={{ padding: '1rem' }}>
              💾 Save All Settings
            </button>
            <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
              ↩️ Reset to Default
            </button>
            <button type="button" className="button button-secondary" style={{ padding: '1rem' }} onClick={() => setActiveTab('overview')}>
              ← Back to Overview
            </button>
          </div>

          {/* Logout Section */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'rgba(239, 68, 68, 0.05)',
            borderRadius: '12px',
            border: '2px solid rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '2.5rem' }}>🚪</span>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#ef4444' }}>Logout</h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                  Sign out from your admin account and return to the login page.
                </p>
                <button 
                  type="button" 
                  className="button button-secondary" 
                  style={{ borderColor: '#ef4444', color: '#ef4444' }}
                  onClick={handleLogout}
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default fallback
    return (
      <div className="surface dashboard-panel">
        <p>Select a tab to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Notification Container */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '400px'
      }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: notif.type === 'success' ? '#d1fae5' : notif.type === 'warning' ? '#fef3c7' : '#dbeafe',
              border: `2px solid ${notif.type === 'success' ? '#10b981' : notif.type === 'warning' ? '#f59e0b' : '#3b82f6'}`,
              color: notif.type === 'success' ? '#065f46' : notif.type === 'warning' ? '#92400e' : '#1e40af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <span style={{ flex: 1, fontWeight: '500' }}>{notif.message}</span>
            <button
              type="button"
              onClick={() => removeNotification(notif.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: 0,
                color: 'inherit'
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        <PageHeader
          eyebrow="Admin Panel"
          title="Dashboard"
          subtitle="Monitor users, drivers, rides, and platform activity."
        />
        
        {/* Notification Button */}
        <button
          type="button"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s',
            zIndex: 100
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
          }}
          onClick={() => {
            // Show notification center or trigger notification
            addNotification('🔔 Notification center opened', 'info');
          }}
        >
          🔔 Notifications
          {notifications.length > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      <section className="section-block">
        <div className="container dashboard-shell">
          {/* Sidebar Navigation */}
          <aside className="surface dashboard-sidebar">
            <div className="sidebar-profile">
              <div className="avatar-badge">👨‍💼</div>
              <h3>Admin Panel</h3>
              <p>System Control</p>
            </div>
            <nav className="sidebar-nav">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'transport', label: 'Transport Control', icon: '🚗' },
                { id: 'study-area', label: 'Study Area Control', icon: '📚' },
                { id: 'events', label: 'Events', icon: '🎉' },
                { id: 'users', label: 'Users', icon: '👥' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="dashboard-content">
            {renderTab()}
          </div>
        </div>
      </section>
    </>
  );
}
