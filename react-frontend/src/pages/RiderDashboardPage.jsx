import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LiveMap from '../components/LiveMap';
import ChatModal from '../components/ChatModal';
import { riderMetrics } from '../data/siteData';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

const baseTabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'book', label: 'Book a Ride', icon: '🎫' },
  { id: 'bookings', label: 'My Bookings', icon: '📋' },
  { id: 'history', label: 'Ride History', icon: '📜' },
  { id: 'favorites', label: 'Favorite Drivers', icon: '⭐' },
  { id: 'driver', label: 'Become a Driver', icon: '🚙' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function RiderDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [activeRide, setActiveRide] = useState(null);
  const [rideStatus, setRideStatus] = useState('idle');
  const [driverLocation, setDriverLocation] = useState(null);
  const [studentLocation, setStudentLocation] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    pickup: '',
    drop: '',
    date: '',
    time: '',
    passengers: '1',
    vehicleType: 'bike'
  });
  const [riderRides, setRiderRides] = useState([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [ridesError, setRidesError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [drivers, setDrivers] = useState([]);

  // Dynamically add Current Ride tab when there's an active ride
  const tabs = activeRide && ['accepted', 'ongoing'].includes(rideStatus)
    ? [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'current-ride', label: 'Current Ride', icon: '🚗' },
        ...baseTabs.slice(1)
      ]
    : baseTabs;
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState('');
  const [favoriteDriverIds, setFavoriteDriverIds] = useState([]);
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const favoriteStorageKey = currentUserId ? `favoriteDrivers:${currentUserId}` : 'favoriteDrivers:guest';

  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(readStoredUser());
    window.addEventListener('auth-changed', handleAuthChange);

    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  // Poll for active rides every 5 seconds
  useEffect(() => {
    if (!currentUserId) return;

    async function checkForActiveRide() {
      try {
        // Check if user has any accepted or ongoing rides
        const response = await apiRequest(`/api/rides/rider/${currentUserId}`);
        const rides = Array.isArray(response) ? response : [];
        
        // Find the first accepted or ongoing ride
        const activeRideData = rides.find(ride => 
          ride.status === 'accepted' || ride.status === 'ongoing'
        );

        if (activeRideData) {
          setActiveRide(activeRideData);
          setRideStatus(activeRideData.status);
          
          // Auto-switch to current ride tab if a ride was just accepted
          if (activeRideData.status === 'accepted' && !activeRide) {
            setActiveTab('current-ride');
          }
        } else if (activeRide && (activeRide.status === 'completed' || activeRide.status === 'cancelled')) {
          // Clear active ride if it's completed or cancelled
          setActiveRide(null);
          setRideStatus('idle');
          setDriverLocation(null);
          if (activeTab === 'current-ride') {
            setActiveTab('overview');
          }
        }
      } catch (error) {
        console.error('Failed to check for active ride:', error);
      }
    }

    // Check immediately
    checkForActiveRide();

    // Then poll every 5 seconds
    const pollInterval = setInterval(checkForActiveRide, 5000);

    return () => clearInterval(pollInterval);
  }, [currentUserId, activeRide, activeTab]);

  // Poll for driver location every 3 seconds when ride is active
  useEffect(() => {
    if (!activeRide || !['accepted', 'ongoing'].includes(rideStatus)) {
      setDriverLocation(null);
      return;
    }

    async function fetchDriverLocation() {
      try {
        // Simulate driver location - In production, this would come from backend
        // For now, use browser geolocation as mock driver location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setDriverLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: Date.now()
              });
            },
            (error) => {
              console.error('Error getting driver location:', error);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 0
            }
          );
        }
      } catch (error) {
        console.error('Failed to fetch driver location:', error);
      }
    }

    // Fetch immediately
    fetchDriverLocation();

    // Then poll every 3 seconds
    const locationPollInterval = setInterval(fetchDriverLocation, 3000);

    return () => clearInterval(locationPollInterval);
  }, [activeRide, rideStatus]);

  // Poll for student's own location every 3 seconds when ride is active
  useEffect(() => {
    if (!activeRide || !['accepted', 'ongoing'].includes(rideStatus)) {
      setStudentLocation(null);
      return;
    }

    async function fetchStudentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setStudentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now()
            });
          },
          (error) => {
            console.error('Error getting student location:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0
          }
        );
      }
    }

    // Fetch immediately
    fetchStudentLocation();

    // Then poll every 3 seconds
    const studentLocationPollInterval = setInterval(fetchStudentLocation, 3000);

    return () => clearInterval(studentLocationPollInterval);
  }, [activeRide, rideStatus]);

  useEffect(() => {
    try {
      const storedFavorites = JSON.parse(localStorage.getItem(favoriteStorageKey) || '[]');
      setFavoriteDriverIds(Array.isArray(storedFavorites) ? storedFavorites : []);
    } catch (_error) {
      setFavoriteDriverIds([]);
    }
  }, [favoriteStorageKey]);

  useEffect(() => {
    localStorage.setItem(favoriteStorageKey, JSON.stringify(favoriteDriverIds));
  }, [favoriteDriverIds, favoriteStorageKey]);

  async function loadRiderRides() {
    if (!currentUserId) {
      setRiderRides([]);
      return;
    }

    setLoadingRides(true);
    setRidesError('');

    try {
      const rides = await apiRequest(`/api/rides/rider/${currentUserId}`);
      setRiderRides(Array.isArray(rides) ? rides : []);
    } catch (error) {
      setRidesError(error.message || 'Unable to load rides right now.');
      setRiderRides([]);
    } finally {
      setLoadingRides(false);
    }
  }

  useEffect(() => {
    if (!['overview', 'bookings', 'history'].includes(activeTab)) {
      return;
    }

    loadRiderRides();
  }, [activeTab, currentUserId]);

  async function loadDrivers() {
    setLoadingDrivers(true);
    setDriversError('');

    try {
      const driverList = await apiRequest('/api/drivers?isApproved=true');
      setDrivers(Array.isArray(driverList) ? driverList : []);
    } catch (error) {
      setDriversError(error.message || 'Unable to load drivers right now.');
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'favorites') {
      return;
    }

    loadDrivers();
  }, [activeTab]);

  function toggleFavoriteDriver(driverId) {
    setFavoriteDriverIds((current) => {
      if (current.includes(driverId)) {
        return current.filter((id) => id !== driverId);
      }
      return [...current, driverId];
    });
  }

  async function handleBookRide() {
    if (!currentUserId) {
      setBookingError('Please log in to book a ride.');
      return;
    }

    if (!bookForm.pickup || !bookForm.drop || !bookForm.date || !bookForm.time || !bookForm.passengers || !bookForm.vehicleType) {
      setBookingError('Please fill all required booking fields.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingMessage('');

    try {
      await apiRequest('/api/rides', {
        method: 'POST',
        body: JSON.stringify({
          riderId: currentUserId,
          pickupLocation: bookForm.pickup,
          dropLocation: bookForm.drop,
          scheduledDate: bookForm.date,
          scheduledTime: bookForm.time,
          passengers: Number(bookForm.passengers),
          vehicleType: bookForm.vehicleType
        })
      });

      setBookingMessage('Ride request submitted successfully.');
      setBookForm({ pickup: '', drop: '', date: '', time: '', passengers: '1', vehicleType: 'bike' });
      await loadRiderRides();
      setActiveTab('bookings');
    } catch (error) {
      setBookingError(error.message || 'Unable to book ride right now.');
    } finally {
      setBookingLoading(false);
    }
  }

  function renderTab() {
    if (activeTab === 'current-ride') {
      const statusLabel =
        rideStatus === 'idle' ? 'No active ride' :
        rideStatus === 'pending' ? 'Waiting for driver' :
        rideStatus === 'accepted' ? 'Driver on the way' :
        rideStatus === 'ongoing' ? 'Ride in progress' :
        'Completed';

      if (!activeRide) {
        return (
          <div className="surface dashboard-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚗</div>
            <h2>No Active Ride</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Book a ride to get started on your journey.
            </p>
            <button 
              type="button" 
              className="button button-primary"
              onClick={() => setActiveTab('book')}
            >
              Book a Ride →
            </button>
          </div>
        );
      }

      // Extract driver info from the ride data
      const driverInfo = activeRide.driver?.user || activeRide.driver || {};
      const driverProfile = activeRide.driver || {};
      
      // Get location details - use the exact text from booking form
      const pickupLocation = activeRide.pickupLocation?.address || activeRide.pickupLocation || activeRide.pickup || 'Pickup Location';
      const dropLocation = activeRide.dropLocation?.address || activeRide.dropLocation || activeRide.drop || 'Drop Location';
      
      // Get coordinates for map
      const pickupCoords = activeRide.pickupLocation?.coordinates 
        ? { lat: activeRide.pickupLocation.coordinates[1], lng: activeRide.pickupLocation.coordinates[0] }
        : { lat: 6.9147, lng: 79.9729 };
      
      // For drop-off, use coordinates if available, otherwise use a nearby default
      const dropoffCoords = activeRide.dropLocation?.coordinates
        ? { lat: activeRide.dropLocation.coordinates[1], lng: activeRide.dropLocation.coordinates[0] }
        : { lat: 6.9147, lng: 79.9729 }; // Default to nearby location

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Banner */}
          <div style={{
            padding: '1.5rem',
            background: rideStatus === 'completed' 
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))'
              : rideStatus === 'ongoing'
              ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))'
              : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))',
            borderRadius: '16px',
            border: '1px solid',
            borderColor: rideStatus === 'completed' ? '#10b981' : rideStatus === 'ongoing' ? '#f59e0b' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: rideStatus === 'completed' ? '#10b981' : rideStatus === 'ongoing' ? '#f59e0b' : '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem'
              }}>
                {rideStatus === 'completed' ? '✓' : rideStatus === 'ongoing' ? '🚗' : '📍'}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{statusLabel}</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {rideStatus === 'pending' && 'Waiting for driver to accept your request'}
                  {rideStatus === 'accepted' && 'Your driver is on the way to pick you up'}
                  {rideStatus === 'ongoing' && 'Enjoy your ride to the destination'}
                  {rideStatus === 'completed' && 'You have arrived at your destination'}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Driver Information Card */}
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  color: 'white'
                }}>
                  🚗
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Your Driver</p>
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{driverInfo.name || 'Driver Name'}</h3>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>⭐ Rating</span>
                  <strong style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{driverProfile.rating || 4.8} / 5.0</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>📞 Contact</span>
                  <strong>{driverInfo.phone || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>🚗 Vehicle</span>
                  <strong>{driverProfile.vehicleModel || 'Vehicle'} • {driverProfile.vehicleNumber || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>💰 Fare</span>
                  <strong style={{ fontSize: '1.3rem', color: '#10b981' }}>Rs. {activeRide.fare || 0}</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  className="button button-secondary" 
                  style={{ width: '100%' }}
                  onClick={() => {
                    if (driverInfo.phone) {
                      window.location.href = `tel:${driverInfo.phone}`;
                    } else {
                      alert('Driver phone number not available');
                    }
                  }}
                >
                  📞 Call Driver
                </button>
                <button 
                  type="button" 
                  className="button button-secondary" 
                  style={{ width: '100%' }}
                  onClick={() => setShowChatModal(true)}
                >
                  💬 Message
                </button>
              </div>
            </div>

            {/* Trip Progress Timeline */}
            <div className="surface dashboard-panel">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Trip Progress</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Pickup */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: rideStatus === 'ongoing' || rideStatus === 'completed' ? '#10b981' : '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {rideStatus === 'ongoing' || rideStatus === 'completed' ? '✓' : '📍'}
                    </div>
                    <div style={{ 
                      width: '2px', 
                      flex: 1, 
                      background: rideStatus === 'ongoing' || rideStatus === 'completed' ? '#10b981' : '#e5e7eb',
                      minHeight: '40px'
                    }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: '1rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Pickup Location</strong>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {pickupLocation}
                    </p>
                    {rideStatus === 'accepted' && (
                      <span className="pill" style={{ marginTop: '0.5rem', display: 'inline-block', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        Driver arriving
                      </span>
                    )}
                    {(rideStatus === 'ongoing' || rideStatus === 'completed') && (
                      <span className="pill success" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        Picked up
                      </span>
                    )}
                  </div>
                </div>

                {/* Dropoff */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: rideStatus === 'completed' ? '#10b981' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      color: rideStatus === 'completed' ? 'white' : '#9ca3af',
                      fontWeight: 'bold'
                    }}>
                      {rideStatus === 'completed' ? '✓' : '🎯'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Drop-off Location</strong>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {dropLocation}
                    </p>
                    {rideStatus === 'ongoing' && (
                      <span className="pill" style={{ marginTop: '0.5rem', display: 'inline-block', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        In transit
                      </span>
                    )}
                    {rideStatus === 'completed' && (
                      <span className="pill success" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                        Arrived
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Map */}
          {(rideStatus === 'accepted' || rideStatus === 'ongoing') && (
            <div className="surface dashboard-panel">
              <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
                {rideStatus === 'accepted' ? 'Driver Location' : 'Live Location'}
              </h3>
              <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden' }}>
                <LiveMap 
                  pickup={pickupCoords}
                  dropoff={{
                    lat: dropoffCoords.lat,
                    lng: dropoffCoords.lng,
                    address: dropLocation
                  }}
                  driverLocation={driverLocation}
                  studentLocation={studentLocation}
                  showDriverLocation={true}
                  showStudentLocation={true}
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="surface dashboard-panel">
            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                🚨 Report Issue
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                📍 Share Location
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                ℹ️ Ride Details
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }} onClick={() => setActiveTab('bookings')}>
                📋 My Bookings
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'book') {
      return (
        <div className="surface dashboard-panel">
          <h2>Book a Ride</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Search for available rides and manage your requests directly from this dashboard.
          </p>
          <div className="field-grid two-col">
            <label>
              Pickup Location
              <input
                type="text"
                placeholder="Enter pickup location"
                value={bookForm.pickup}
                onChange={(event) => setBookForm((current) => ({ ...current, pickup: event.target.value }))}
              />
            </label>
            <label>
              Drop Location
              <input
                type="text"
                placeholder="Enter destination"
                value={bookForm.drop}
                onChange={(event) => setBookForm((current) => ({ ...current, drop: event.target.value }))}
              />
            </label>
          </div>
          <div className="field-grid two-col">
            <label>
              Date
              <input
                type="date"
                value={bookForm.date}
                onChange={(event) => setBookForm((current) => ({ ...current, date: event.target.value }))}
              />
            </label>
            <label>
              Time
              <input
                type="time"
                value={bookForm.time}
                onChange={(event) => setBookForm((current) => ({ ...current, time: event.target.value }))}
              />
            </label>
            <label>
              Passengers
              <select
                value={bookForm.passengers}
                onChange={(event) => setBookForm((current) => ({ ...current, passengers: event.target.value }))}
              >
                <option value="1">1 Passenger</option>
                <option value="2">2 Passengers</option>
                <option value="3">3 Passengers</option>
                <option value="4">4 Passengers</option>
              </select>
            </label>
            <label>
              Vehicle Type
              <select
                value={bookForm.vehicleType}
                onChange={(event) => setBookForm((current) => ({ ...current, vehicleType: event.target.value }))}
              >
                <option value="bike">Bike</option>
                <option value="tuk">Tuk</option>
                <option value="car">Car</option>
                <option value="van">Van</option>
              </select>
            </label>
          </div>

          {bookingMessage ? <div className="notice success">{bookingMessage}</div> : null}
          {bookingError ? <div className="notice error">{bookingError}</div> : null}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="button button-primary" onClick={handleBookRide} disabled={bookingLoading}>
              {bookingLoading ? 'Booking...' : 'Book Ride Now'}
            </button>
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('bookings')}>View My Bookings</button>
          </div>
        </div>
      );
    }

    if (activeTab === 'bookings') {
      const activeBookings = riderRides.filter((ride) => ['pending', 'accepted', 'ongoing'].includes(ride.status));

      return (
        <div className="surface dashboard-panel">
          <h2>Active Bookings</h2>
          {ridesError ? <div className="notice error">{ridesError}</div> : null}
          {loadingRides ? <p>Loading your bookings...</p> : null}
          <div className="card-stack">
            {!loadingRides && activeBookings.length === 0 ? (
              <article className="surface nested-card">
                <strong>No active bookings</strong>
                <p>Your pending, accepted, and ongoing rides will appear here.</p>
              </article>
            ) : null}

            {activeBookings.map((ride) => (
              <article key={ride._id} className="surface nested-card">
                <strong>
                  {(ride.pickupLocation?.address || 'Pickup')} {'->'} {(ride.dropLocation?.address || 'Drop')}
                </strong>
                <p>{ride.scheduledDate ? new Date(ride.scheduledDate).toLocaleDateString() : 'N/A'} · {ride.scheduledTime || 'N/A'}</p>
                <p>Passengers: {ride.passengers || 1}</p>
                <p>Vehicle: {ride.vehicleType || 'Not selected'}</p>
                <span className={`pill ${ride.status === 'pending' ? '' : 'success'}`}>{ride.status}</span>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'history') {
      const historicalBookings = riderRides.filter((ride) => ['completed', 'cancelled'].includes(ride.status));

      return (
        <div className="surface dashboard-panel">
          <h2>Ride History</h2>
          <p>Track your completed and cancelled rides.</p>
          {ridesError ? <div className="notice error">{ridesError}</div> : null}
          {loadingRides ? <p>Loading ride history...</p> : null}

          <div className="card-stack">
            {!loadingRides && historicalBookings.length === 0 ? (
              <article className="surface nested-card">
                <strong>No ride history yet</strong>
                <p>Your completed and cancelled rides will appear here.</p>
              </article>
            ) : null}

            {historicalBookings.map((ride) => (
              <article key={ride._id} className="surface nested-card">
                <strong>
                  {(ride.pickupLocation?.address || 'Pickup')} {'->'} {(ride.dropLocation?.address || 'Drop')}
                </strong>
                <p>{ride.scheduledDate ? new Date(ride.scheduledDate).toLocaleDateString() : 'N/A'} · {ride.scheduledTime || 'N/A'}</p>
                <p>Fare: Rs. {ride.fare || 0}</p>
                <p>Vehicle: {ride.vehicleType || 'Not selected'}</p>
                <span className={`pill ${ride.status === 'completed' ? 'success' : ''}`}>{ride.status}</span>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'favorites') {
      const favoriteDrivers = drivers.filter((driver) => favoriteDriverIds.includes(driver._id));
      const suggestedDrivers = drivers.filter((driver) => !favoriteDriverIds.includes(driver._id));

      return (
        <div className="surface dashboard-panel">
          <h2>Favorite Drivers</h2>
          <p>Save preferred drivers so they are easier to find next time.</p>

          {driversError ? <div className="notice error">{driversError}</div> : null}
          {loadingDrivers ? <p>Loading available drivers...</p> : null}

          {!loadingDrivers && (
            <>
              <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Favorites: {favoriteDrivers.length}
              </div>

              <div className="card-stack" style={{ marginBottom: '1.5rem' }}>
                {favoriteDrivers.length === 0 ? (
                  <article className="surface nested-card">
                    <strong>No favorite drivers yet</strong>
                    <p>Tap the star button on a driver to save them here.</p>
                  </article>
                ) : null}

                {favoriteDrivers.map((driver) => (
                  <article key={driver._id} className="surface nested-card">
                    <strong>{driver.user?.name || 'Driver'}</strong>
                    <p>{driver.vehicleType || 'Vehicle'} · {driver.vehicleNumber || 'N/A'}</p>
                    <p>Rating: {Number(driver.rating || 0).toFixed(1)} · Seats: {driver.capacity || 'N/A'}</p>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() => toggleFavoriteDriver(driver._id)}
                    >
                      Remove Favorite
                    </button>
                  </article>
                ))}
              </div>

              <h3 style={{ marginBottom: '1rem' }}>Suggested Drivers</h3>
              <div className="card-stack">
                {suggestedDrivers.map((driver) => (
                  <article key={driver._id} className="surface nested-card">
                    <strong>{driver.user?.name || 'Driver'}</strong>
                    <p>{driver.vehicleType || 'Vehicle'} · {driver.vehicleNumber || 'N/A'}</p>
                    <p>Rating: {Number(driver.rating || 0).toFixed(1)} · Seats: {driver.capacity || 'N/A'}</p>
                    <button
                      type="button"
                      className="button button-primary button-small"
                      onClick={() => toggleFavoriteDriver(driver._id)}
                    >
                      Add to Favorites
                    </button>
                  </article>
                ))}
                {suggestedDrivers.length === 0 ? (
                  <article className="surface nested-card">
                    <strong>No more suggested drivers</strong>
                    <p>All loaded drivers are already in your favorites.</p>
                  </article>
                ) : null}
              </div>
            </>
          )}
        </div>
      );
    }

    if (activeTab === 'driver') {
      return (
        <div className="surface dashboard-panel">
          <h2>Become a Driver</h2>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Start earning by offering rides to fellow SLIIT students. Join our community of verified drivers.
          </p>
          
          <div style={{ 
            padding: '2rem', 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>Benefits of Being a Driver</h3>
            <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💰</span>
                <span>Earn extra income while commuting</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🤝</span>
                <span>Help fellow students save on transport</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌱</span>
                <span>Reduce carbon footprint through carpooling</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
                <span>Build your reputation with ratings</span>
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Requirements</h3>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <li>Valid SLIIT student ID</li>
              <li>Valid driver's license</li>
              <li>Vehicle registration documents</li>
              <li>Vehicle insurance</li>
            </ul>
          </div>

          <Link to="/become-driver" className="button button-primary">
            Apply to Become a Driver →
          </Link>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Settings Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Rider Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Manage your profile, preferences, and account settings
            </p>
          </div>

          {/* Settings Navigation Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            marginBottom: '2rem',
            borderBottom: '2px solid var(--border)',
            overflowX: 'auto',
            paddingBottom: '0.5rem'
          }}>
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'preferences', label: 'Preferences', icon: '🚗' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'payment', label: 'Payment', icon: '💳' },
              { id: 'privacy', label: 'Privacy', icon: '🔒' },
              { id: 'account', label: 'Account', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(`settings-${tab.id}`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: activeTab === `settings-${tab.id}` ? 'var(--primary)' : 'transparent',
                  color: activeTab === `settings-${tab.id}` ? 'white' : 'var(--text)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: activeTab === `settings-${tab.id}` ? '600' : '500',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {(!activeTab.startsWith('settings-') || activeTab === 'settings-profile') && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>👤</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Profile Information</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Update your personal details and contact information</p>
                </div>
              </div>
              
              <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '3rem',
                  color: 'white',
                  marginBottom: '1rem'
                }}>
                  👨‍🎓
                </div>
                <div>
                  <button type="button" className="button button-secondary button-small">
                    Change Avatar
                  </button>
                </div>
              </div>
              
              <div className="field-grid two-col">
                <label>
                  <strong>Full Name</strong>
                  <input type="text" defaultValue="Student Name" placeholder="Enter your full name" />
                </label>
                <label>
                  <strong>Email Address</strong>
                  <input type="email" defaultValue="student@sliit.lk" placeholder="your.email@sliit.lk" />
                </label>
                <label>
                  <strong>Phone Number</strong>
                  <input type="tel" defaultValue="+94 77 123 4567" placeholder="+94 XX XXX XXXX" />
                </label>
                <label>
                  <strong>Student ID</strong>
                  <input type="text" defaultValue="IT12345678" disabled style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
                </label>
                <label>
                  <strong>Faculty</strong>
                  <select defaultValue="Computing">
                    <option value="Computing">Faculty of Computing</option>
                    <option value="Engineering">Faculty of Engineering</option>
                    <option value="Business">Faculty of Business</option>
                    <option value="Humanities">Faculty of Humanities</option>
                  </select>
                </label>
                <label>
                  <strong>Year of Study</strong>
                  <select defaultValue="2">
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Save Changes</button>
                <button type="button" className="button button-secondary">Cancel</button>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'settings-preferences' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>🚗</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Ride Preferences</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set your default ride preferences and filters</p>
                </div>
              </div>
              
              <div className="field-grid two-col">
                <label>
                  <strong>Preferred Pickup Location</strong>
                  <input type="text" placeholder="e.g., Malabe Town" />
                </label>
                <label>
                  <strong>Preferred Drop Location</strong>
                  <input type="text" placeholder="e.g., SLIIT Malabe Campus" />
                </label>
                <label>
                  <strong>Default Number of Passengers</strong>
                  <select defaultValue="1">
                    <option value="1">1 Passenger</option>
                    <option value="2">2 Passengers</option>
                    <option value="3">3 Passengers</option>
                    <option value="4">4+ Passengers</option>
                  </select>
                </label>
                <label>
                  <strong>Preferred Vehicle Type</strong>
                  <select defaultValue="any">
                    <option value="any">Any Vehicle</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="SUV">SUV</option>
                    <option value="Van">Van</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Tuk-Tuk">Tuk-Tuk</option>
                  </select>
                </label>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: '600' }}>Additional Preferences</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  { label: 'Allow shared rides to reduce costs', checked: true },
                  { label: 'Only show verified drivers', checked: true },
                  { label: 'Prefer female drivers (when available)', checked: false }
                ].map((item) => (
                  <label key={item.label} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '1rem',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border)'
                  }}>
                    <input type="checkbox" defaultChecked={item.checked} style={{ width: '18px', height: '18px' }} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Save Preferences</button>
                <button type="button" className="button button-secondary">Reset to Default</button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'settings-notifications' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>🔔</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Notification Preferences</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose what notifications you want to receive</p>
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Notification Types</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { title: 'Ride Confirmations', desc: 'Get notified when your ride is confirmed', checked: true },
                  { title: 'Driver Arrival Alerts', desc: 'Receive alerts when driver is nearby', checked: true },
                  { title: 'Ride Reminders', desc: 'Get reminders 15 minutes before scheduled rides', checked: true },
                  { title: 'New Driver Matches', desc: 'Alerts when new drivers match your route', checked: true },
                  { title: 'Payment Receipts', desc: 'Receive payment confirmations and receipts', checked: true },
                  { title: 'Promotional Messages', desc: 'Receive updates about new features and offers', checked: false }
                ].map((item) => (
                  <label key={item.title} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem', 
                    padding: '1rem',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border)'
                  }}>
                    <input type="checkbox" defaultChecked={item.checked} style={{ marginTop: '0.25rem', width: '18px', height: '18px' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{item.title}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Notification Channels</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  { label: 'Email Notifications', checked: true },
                  { label: 'SMS Notifications', checked: true },
                  { label: 'Push Notifications', checked: true }
                ].map((item) => (
                  <label key={item.label} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem', 
                    padding: '1rem',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border)'
                  }}>
                    <input type="checkbox" defaultChecked={item.checked} style={{ width: '18px', height: '18px' }} />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Save Preferences</button>
                <button type="button" className="button button-secondary">Disable All</button>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'settings-payment' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>💳</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Payment Methods</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your payment options</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Cash on Delivery */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))', 
                  borderRadius: '12px',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '3rem' }}>💵</div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Cash on Delivery</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>Pay driver directly after the ride</span>
                    </div>
                  </div>
                  <span className="pill success" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Active</span>
                </div>

                {/* Credit/Debit Card */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'var(--bg)', 
                  borderRadius: '12px',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '3rem' }}>💳</div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Credit/Debit Card</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>Pay securely with your card</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'var(--border)', borderRadius: '20px' }}>Coming Soon</span>
                </div>

                {/* Mobile Wallet */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'var(--bg)', 
                  borderRadius: '12px',
                  border: '2px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.6
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontSize: '3rem' }}>📱</div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '0.25rem' }}>Mobile Wallet</strong>
                      <span style={{ color: 'var(--text-secondary)' }}>Pay using mobile payment apps</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', background: 'var(--border)', borderRadius: '20px' }}>Coming Soon</span>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'settings-privacy' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>🔒</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Privacy & Security</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your privacy settings and password</p>
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Privacy Settings</h3>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { title: 'Share location with driver', desc: 'Allow drivers to see your pickup location', checked: true },
                  { title: 'Show profile to drivers', desc: 'Let drivers see your name and rating', checked: true },
                  { title: 'Save ride history', desc: 'Keep records of past rides for easy rebooking', checked: false }
                ].map((item) => (
                  <label key={item.title} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '1rem', 
                    padding: '1rem',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: '1px solid var(--border)'
                  }}>
                    <input type="checkbox" defaultChecked={item.checked} style={{ marginTop: '0.25rem', width: '18px', height: '18px' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{item.title}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Change Password</h3>
              <div className="field-grid">
                <label>
                  <strong>Current Password</strong>
                  <input type="password" placeholder="Enter current password" />
                </label>
                <label>
                  <strong>New Password</strong>
                  <input type="password" placeholder="Enter new password" />
                </label>
                <label>
                  <strong>Confirm New Password</strong>
                  <input type="password" placeholder="Confirm new password" />
                </label>
              </div>
              
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '8px',
                borderLeft: '3px solid #3b82f6'
              }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#3b82f6' }}>Password Requirements:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <li>At least 8 characters long</li>
                  <li>Include uppercase and lowercase letters</li>
                  <li>Include at least one number</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Update Security Settings</button>
                <button type="button" className="button button-secondary">Cancel</button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'settings-account' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>⚙️</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Account Management</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account data and status</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Download Data */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(59, 130, 246, 0.05)', 
                  borderRadius: '12px',
                  border: '2px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>📥</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Download My Data</h3>
                      <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                        Request a copy of all your personal data and ride history in a downloadable format.
                      </p>
                      <button type="button" className="button button-secondary" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                        Request Data Export
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(239, 68, 68, 0.05)', 
                  borderRadius: '12px',
                  border: '2px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>🗑️</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#ef4444' }}>Delete Account</h3>
                      <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button type="button" className="button button-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="dashboard-overview-grid">
        {ridesError ? <div className="notice error">{ridesError}</div> : null}
        <div className="stats-grid compact">
          {riderMetrics.map((metric) => (
            <article key={metric.label} className={`surface stat-card tone-${metric.tone}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>

        <div className="surface dashboard-panel">
          <h2>Active Bookings</h2>
          <div className="card-stack">
            {(riderRides.filter((ride) => ['pending', 'accepted', 'ongoing'].includes(ride.status)).slice(0, 3)).map((ride) => (
              <article key={ride._id} className="surface nested-card">
                <strong>
                  {(ride.pickupLocation?.address || 'Pickup')} {'->'} {(ride.dropLocation?.address || 'Drop')}
                </strong>
                <p>{ride.scheduledDate ? new Date(ride.scheduledDate).toLocaleDateString() : 'N/A'} · {ride.scheduledTime || 'N/A'}</p>
                <span className={`pill ${ride.status === 'pending' ? '' : 'success'}`}>{ride.status}</span>
              </article>
            ))}
            {!loadingRides && riderRides.filter((ride) => ['pending', 'accepted', 'ongoing'].includes(ride.status)).length === 0 ? (
              <article className="surface nested-card">
                <strong>No active bookings</strong>
                <p>Create a ride request from Book Ride.</p>
              </article>
            ) : null}
          </div>
        </div>

        <div className="surface dashboard-panel">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('book')}>
              Book Ride
            </button>
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('bookings')}>
              My Bookings
            </button>
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('history')}>
              Ride History
            </button>
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('driver')}>
              Become Driver
            </button>
          </div>
          
          {/* Test Button - Remove in production */}
          {!activeRide && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#3b82f6' }}>🧪 Test Mode</strong>
              <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Simulate a driver accepting your ride request
                {bookForm.drop && <><br /><strong>Drop Location:</strong> {bookForm.drop}</>}
              </p>
              <button 
                type="button" 
                className="button button-primary button-small"
                onClick={() => {
                  // Use the drop location from booking form if available
                  const testDropLocation = bookForm.drop || 'SLIIT Malabe Campus - Main Entrance';
                  const testPickupLocation = bookForm.pickup || 'Malabe Town';
                  
                  setActiveRide({
                    _id: '123',
                    driver: { 
                      name: 'John Driver', 
                      phone: '+94 77 123 4567', 
                      rating: 4.8,
                      vehicleModel: 'Toyota Axio',
                      vehicleNumber: 'CAR-1234'
                    },
                    pickupLocation: testPickupLocation,
                    dropLocation: testDropLocation,
                    fare: 250,
                    passengers: 1,
                    status: 'accepted'
                  });
                  setRideStatus('accepted');
                  setActiveTab('current-ride');
                }}
              >
                ✅ Simulate Driver Accepted
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Rider Dashboard"
        title="Welcome back"
        subtitle="Manage bookings, review ride history, and find your next trip."
      />

      {/* Active Ride Notification Banner */}
      {activeRide && ['accepted', 'ongoing'].includes(rideStatus) && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '1rem 0',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem'
              }}>
                {rideStatus === 'accepted' ? '📍' : '🚗'}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {rideStatus === 'accepted' ? 'Driver Accepted Your Ride!' : 'Ride in Progress'}
                </strong>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.9rem' }}>
                  {rideStatus === 'accepted' 
                    ? `${activeRide.driver?.user?.name || activeRide.driver?.name || 'Driver'} is on the way to pick you up`
                    : `Heading to ${activeRide.dropLocation?.address || activeRide.dropoff || 'destination'}`
                  }
                </p>
              </div>
            </div>
            <button 
              type="button" 
              className="button button-secondary"
              style={{ background: 'white', color: '#10b981', border: 'none' }}
              onClick={() => setActiveTab('current-ride')}
            >
              View Current Ride →
            </button>
          </div>
        </div>
      )}

      <section className="section-block">
        <div className="container dashboard-shell">
          <aside className="surface dashboard-sidebar">
            <div className="sidebar-profile">
              <div className="avatar-badge">👨‍🎓</div>
              <h3>Rider Name</h3>
              <p>SLIIT Student</p>
            </div>
            <nav className="sidebar-nav">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="dashboard-content">{renderTab()}</div>
        </div>
      </section>

      {/* Chat Modal */}
      {showChatModal && activeRide && (
        <ChatModal
          rideId={activeRide._id}
          currentUserId={currentUser?._id}
          onClose={() => setShowChatModal(false)}
        />
      )}
    </>
  );
}
