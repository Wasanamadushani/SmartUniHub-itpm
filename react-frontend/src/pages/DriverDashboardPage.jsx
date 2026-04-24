import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LiveMap from '../components/LiveMap';
import ChatModal from '../components/ChatModal';
import { driverMetrics, rideMatches } from '../data/siteData';
import { apiRequest } from '../lib/api';
import { clearAuthenticatedUser, readStoredUser } from '../lib/auth';

const tabs = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'current-ride', label: 'Current Ride', icon: '🚗' },
  { id: 'requests', label: 'Ride Requests', icon: '📬' },
  { id: 'history', label: 'Ride History', icon: '📜' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsTab, setSettingsTab] = useState('profile');
  const [rideStatus, setRideStatus] = useState('idle');
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [driverProfile, setDriverProfile] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [loadingCurrentRide, setLoadingCurrentRide] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [acceptingRideId, setAcceptingRideId] = useState('');
  const [sendingQuoteId, setSendingQuoteId] = useState('');
  const [quoteAmounts, setQuoteAmounts] = useState({});
  const [requestError, setRequestError] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const currentUserId = currentUser?._id || currentUser?.id || '';
  const unreadNotifications = notificationItems.length;

  useEffect(() => {
    const nextNotifications = [];

    if (pendingRides.length > 0) {
      nextNotifications.push(`You have ${pendingRides.length} pending ride request(s).`);
    }

    if (rideStatus === 'accepted') {
      nextNotifications.push('Active ride accepted. Head to pickup location.');
    }

    if (rideStatus === 'ongoing') {
      nextNotifications.push('Ride is in progress. Live tracking is enabled.');
    }

    if (driverProfile && !driverProfile.isAvailable) {
      nextNotifications.push('Your account is paused. Reactivate to receive requests.');
    }

    setNotificationItems(nextNotifications);
  }, [pendingRides.length, rideStatus, driverProfile]);

  function getStoredDriverId() {
    try {
      const storedDriver = JSON.parse(localStorage.getItem('driver') || 'null');
      return storedDriver?._id || storedDriver?.id || '';
    } catch (_error) {
      return '';
    }
  }

  async function ensureDriverId() {
    if (driverProfile?._id) {
      return driverProfile._id;
    }

    const storedDriverId = getStoredDriverId();
    if (storedDriverId) {
      return storedDriverId;
    }

    if (!currentUserId) {
      return '';
    }

    try {
      const profile = await apiRequest(`/drivers/user/${currentUserId}`);
      setDriverProfile(profile);
      return profile?._id || '';
    } catch (_error) {
      return '';
    }
  }

  async function handleStartRide() {
    if (!activeRide?._id) {
      setRequestError('No active ride selected to start.');
      return;
    }

    setRequestError('');

    try {
      const updatedRide = await apiRequest(`/rides/${activeRide._id}/start`, {
        method: 'PATCH'
      });
      setActiveRide(updatedRide);
      setRideStatus('ongoing');
      setRequestMessage('Ride started. Live map is now active.');
    } catch (error) {
      setRequestError(error.message || 'Unable to start ride right now.');
    }
  }

  async function handlePauseAccountToggle() {
    const driverId = await ensureDriverId();
    if (!driverId) {
      setRequestError('Driver profile not found. Please complete driver registration first.');
      return;
    }

    setRequestError('');
    setRequestMessage('');
    setAccountActionLoading('pause');

    try {
      const isAvailable = Boolean(driverProfile?.isAvailable);
      const updatedDriver = await apiRequest(`/drivers/${driverId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !isAvailable })
      });

      setDriverProfile(updatedDriver);
      setRequestMessage(!isAvailable
        ? 'Driver account reactivated. You are now available for requests.'
        : 'Driver account paused. You will not receive new ride requests.'
      );
    } catch (error) {
      setRequestError(error.message || 'Unable to update account status right now.');
    } finally {
      setAccountActionLoading('');
    }
  }

  async function handleDeleteAccount() {
    const driverId = await ensureDriverId();
    if (!driverId) {
      setRequestError('Driver profile not found. Please complete driver registration first.');
      return;
    }

    const confirmed = window.confirm('Delete your driver account permanently? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setRequestError('');
    setRequestMessage('');
    setAccountActionLoading('delete');

    try {
      await apiRequest(`/drivers/${driverId}`, { method: 'DELETE' });
      clearAuthenticatedUser();
      navigate('/login');
    } catch (error) {
      setRequestError(error.message || 'Unable to delete account right now.');
      setAccountActionLoading('');
    }
  }

  async function handleCompleteRide() {
    if (!activeRide?._id) {
      setRequestError('No active ride selected to complete.');
      return;
    }

    setRequestError('');

    try {
      const updatedRide = await apiRequest(`/rides/${activeRide._id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ distance: 0, duration: 0 })
      });
      setActiveRide(updatedRide);
      setRideStatus('completed');
      setRequestMessage('Ride completed successfully.');
    } catch (error) {
      setRequestError(error.message || 'Unable to complete ride right now.');
    }
  }

  function handleCallRider() {
    const riderPhone = activeRide?.rider?.phone;
    if (!riderPhone) {
      setRequestError('Rider phone number is not available for this ride.');
      return;
    }

    const normalizedPhone = String(riderPhone).replace(/[^\d+]/g, '');
    if (!normalizedPhone) {
      setRequestError('Rider phone number is invalid.');
      return;
    }

    setRequestError('');
    setRequestMessage('Opening phone dialer...');
    window.location.href = `tel:${normalizedPhone}`;
  }

  function handleLiveMessage() {
    if (!activeRide?._id) {
      setRequestError('No active ride selected to message.');
      return;
    }

    setRequestError('');
    setRequestMessage('Opening live chat...');
    navigate('/chat');
  }

  useEffect(() => {
    const handleAuthChange = () => setCurrentUser(readStoredUser());
    window.addEventListener('auth-changed', handleAuthChange);

    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  useEffect(() => {
    async function loadDriverProfile() {
      if (!currentUserId) {
        setDriverProfile(null);
        return;
      }

      try {
        const profile = await apiRequest(`/drivers/user/${currentUserId}`);
        setDriverProfile(profile);
      } catch (_error) {
        setDriverProfile(null);
      }
    }

    loadDriverProfile();
  }, [currentUserId]);

  async function loadPendingRides() {
    setLoadingRequests(true);
    setRequestError('');

    try {
      const rides = await apiRequest('/rides/pending');
      const ridesArray = Array.isArray(rides) ? rides : [];
      
      // Only show rides if driver is approved
      // Filter out rides that already have quotes from other drivers
      if (driverProfile && driverProfile.isApproved) {
        const availableRides = ridesArray.filter(ride => 
          ride.status === 'pending' || 
          (ride.status === 'quoted' && ride.driver?._id === driverProfile._id)
        );
        setPendingRides(availableRides);
      } else {
        setPendingRides([]);
      }
    } catch (error) {
      setRequestError(error.message || 'Unable to load ride requests right now.');
    } finally {
      setLoadingRequests(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'requests') {
      return;
    }

    loadPendingRides();
  }, [activeTab]);

  useEffect(() => {
    if (activeRide?.status) {
      setRideStatus(activeRide.status);
      return;
    }

    if (!activeRide) {
      setRideStatus('idle');
    }
  }, [activeRide]);

  async function loadCurrentRide() {
    if (!driverProfile?._id) {
      setActiveRide(null);
      return;
    }

    setLoadingCurrentRide(true);
    setRequestError('');

    try {
      const rides = await apiRequest(`/rides/driver/${driverProfile._id}`);
      const normalized = Array.isArray(rides) ? rides : [];
      const latestActiveRide = normalized.find((ride) => ride?.status === 'ongoing')
        || normalized.find((ride) => ride?.status === 'accepted');

      setActiveRide(latestActiveRide || null);
    } catch (error) {
      setRequestError(error.message || 'Unable to load current ride right now.');
      setActiveRide(null);
    } finally {
      setLoadingCurrentRide(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'current-ride') {
      return;
    }

    loadCurrentRide();
  }, [activeTab, driverProfile?._id]);

  async function loadRideHistory() {
    if (!driverProfile?._id) {
      setRideHistory([]);
      setHistoryError('Driver profile not found. Complete driver registration first.');
      return;
    }

    setLoadingHistory(true);
    setHistoryError('');

    try {
      const rides = await apiRequest(`/rides/driver/${driverProfile._id}`);
      const normalized = Array.isArray(rides) ? rides : [];
      const historicalRides = normalized.filter((ride) =>
        ride?.status === 'completed' || ride?.status === 'cancelled'
      );

      setRideHistory(historicalRides);
    } catch (error) {
      setHistoryError(error.message || 'Unable to load ride history right now.');
      setRideHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'history') {
      return;
    }

    loadRideHistory();
  }, [activeTab, driverProfile?._id]);

  async function handleAcceptRequest(rideId) {
    const driverId = await ensureDriverId();
    if (!driverId) {
      setRequestError('Driver profile not found. Please complete driver registration first.');
      return;
    }

    setRequestMessage('');
    setRequestError('');
    setAcceptingRideId(rideId);

    try {
      const acceptedRide = await apiRequest(`/rides/${rideId}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({
          driverId
        })
      });

      setPendingRides((current) => current.filter((ride) => ride._id !== rideId));
      setRequestMessage('Ride request accepted successfully.');
      setActiveRide(acceptedRide);
      setRideStatus('accepted');
      setActiveTab('current-ride');
    } catch (error) {
      setRequestError(error.message || 'Unable to accept this ride request.');
    } finally {
      setAcceptingRideId('');
    }
  }

  async function handleSendQuote(rideId) {
    const driverId = await ensureDriverId();
    if (!driverId) {
      setRequestError('Driver profile not found. Please complete driver registration first.');
      return;
    }

    const quotedFare = quoteAmounts[rideId];
    if (!quotedFare || quotedFare <= 0) {
      setRequestError('Please enter a valid fare amount.');
      return;
    }

    setRequestMessage('');
    setRequestError('');
    setSendingQuoteId(rideId);

    try {
      await apiRequest(`/rides/${rideId}/send-quote`, {
        method: 'PATCH',
        body: JSON.stringify({
          driverId,
          quotedFare: Number(quotedFare)
        })
      });

      setPendingRides((current) => current.filter((ride) => ride._id !== rideId));
      setRequestMessage('Price quote sent successfully. Waiting for rider to accept.');
      setQuoteAmounts((current) => {
        const updated = { ...current };
        delete updated[rideId];
        return updated;
      });
    } catch (error) {
      setRequestError(error.message || 'Unable to send quote.');
    } finally {
      setSendingQuoteId('');
    }
  }

  function renderEarningsPage() {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <div
          style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
            borderRadius: '16px',
            border: '2px solid rgba(16, 185, 129, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>Total Earnings</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>This month</p>
            </div>
            <div style={{ fontSize: '3rem' }}>💰</div>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: '700', color: '#10b981', marginBottom: '1rem' }}>
            Rs. 45,250
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Completed Rides</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>38</div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Avg per Ride</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>Rs. 1,190</div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pending</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>Rs. 2,500</div>
            </div>
          </div>
        </div>

        <div className="surface dashboard-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '2rem' }}>💳</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Payment Settings</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage how you receive payments</p>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Payment Methods</h3>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                padding: '1rem',
                background: 'var(--bg)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>💵</div>
                <div>
                  <strong style={{ display: 'block' }}>Cash on Delivery</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Collect payment directly from riders</span>
                </div>
              </div>
              <span className="pill success">Active</span>
            </div>
            <div
              style={{
                padding: '1rem',
                background: 'var(--bg)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: 0.6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '2rem' }}>🏦</div>
                <div>
                  <strong style={{ display: 'block' }}>Bank Transfer</strong>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Coming soon</span>
                </div>
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Bank Account Details</h3>
          <div className="field-grid two-col">
            <label>
              <strong>Bank Name</strong>
              <input type="text" placeholder="e.g., Commercial Bank" />
            </label>
            <label>
              <strong>Account Number</strong>
              <input type="text" placeholder="Account number" />
            </label>
            <label>
              <strong>Account Holder Name</strong>
              <input type="text" placeholder="Name as per bank account" />
            </label>
            <label>
              <strong>Branch</strong>
              <input type="text" placeholder="Branch name" />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="button button-primary">Save Payment Details</button>
            <button type="button" className="button button-secondary">Cancel</button>
          </div>
        </div>

        <div className="surface dashboard-panel">
          <h2 style={{ marginBottom: '1.5rem' }}>💲 Pricing Preferences</h2>
          <div className="field-grid two-col">
            <label>
              <strong>Base Fare (per km)</strong>
              <input type="number" min="0" step="10" defaultValue="50" placeholder="Rs. per km" />
            </label>
            <label>
              <strong>Minimum Fare</strong>
              <input type="number" min="0" step="50" defaultValue="200" placeholder="Minimum charge" />
            </label>
          </div>
          <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Allow riders to negotiate fare</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input type="checkbox" />
              <span>Surge pricing during peak hours</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  function renderTab() {
    if (activeTab === 'current-ride') {
      const statusLabel =
        rideStatus === 'idle' ? 'Waiting for a ride request' :
        rideStatus === 'accepted' ? 'Heading to pickup' :
        rideStatus === 'ongoing' ? 'Ride in progress' :
        'Completed';

      if (loadingCurrentRide) {
        return (
          <div className="surface dashboard-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <h2>Loading Current Ride...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Fetching your latest accepted or ongoing ride.</p>
          </div>
        );
      }

      if (!activeRide) {
        return (
          <div className="surface dashboard-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚗</div>
            <h2>No Active Ride</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Accept a request from the Ride Requests tab to begin earning.
            </p>
            <button 
              type="button" 
              className="button button-primary"
              onClick={() => setActiveTab('requests')}
            >
              View Ride Requests →
            </button>
          </div>
        );
      }

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
                  {rideStatus === 'accepted' && 'Navigate to pickup location and start the ride'}
                  {rideStatus === 'ongoing' && 'Drive safely to the destination'}
                  {rideStatus === 'completed' && 'Ride completed successfully'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {rideStatus === 'accepted' && (
                <button 
                  type="button" 
                  className="button button-primary"
                  onClick={handleStartRide}
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 'bold' }}
                >
                  🚀 Start Ride
                </button>
              )}
              {rideStatus === 'ongoing' && (
                <button 
                  type="button" 
                  className="button button-primary"
                  onClick={handleCompleteRide}
                  style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 'bold', background: '#10b981' }}
                >
                  ✓ Complete Ride
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          {requestMessage && (
            <div className="notice success">✓ {requestMessage}</div>
          )}
          {requestError && (
            <div className="notice error">✗ {requestError}</div>
          )}

          {/* Main Content Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Rider Information Card */}
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
                  👤
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Rider</p>
                  <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{activeRide.rider?.name || 'Student Rider'}</h3>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>📞 Contact</span>
                  <strong>{activeRide.rider?.phone || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>👥 Passengers</span>
                  <strong style={{ fontSize: '1.2rem', color: '#f59e0b' }}>{activeRide.passengers || 1}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>💰 Fare</span>
                  <strong style={{ fontSize: '1.3rem', color: '#10b981' }}>Rs. {activeRide.fare || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>💳 Payment</span>
                  <strong>Cash on Delivery</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button type="button" className="button button-secondary" style={{ width: '100%' }} onClick={handleCallRider}>
                  📞 Call
                </button>
                <button type="button" className="button button-secondary" style={{ width: '100%' }} onClick={() => setShowChatModal(true)}>
                  💬 Message
                </button>
              </div>
            </div>

            {/* Trip Progress Card */}
            <div className="surface dashboard-panel">
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Trip Progress</h3>
              
              <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>
                {/* Progress Line */}
                <div style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '1.5rem',
                  bottom: '1.5rem',
                  width: '2px',
                  background: 'linear-gradient(to bottom, #3b82f6, #10b981)',
                  opacity: 0.3
                }} />

                {/* Step 1: Pickup */}
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-2.5rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: rideStatus !== 'accepted' ? '#10b981' : '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {rideStatus !== 'accepted' ? '✓' : '1'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>Pickup Location</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {activeRide.pickupLocation?.address || 'N/A'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                      🕐 {activeRide.scheduledTime || 'Time not specified'}
                    </p>
                  </div>
                </div>

                {/* Step 2: In Transit */}
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-2.5rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: rideStatus === 'completed' ? '#10b981' : rideStatus === 'ongoing' ? '#f59e0b' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {rideStatus === 'completed' ? '✓' : rideStatus === 'ongoing' ? '🚗' : '2'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>In Transit</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {rideStatus === 'ongoing' ? 'Driving to destination...' : rideStatus === 'completed' ? 'Journey completed' : 'Waiting to start'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Drop-off */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-2.5rem',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: rideStatus === 'completed' ? '#10b981' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: rideStatus === 'completed' ? 'white' : '#9ca3af',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    {rideStatus === 'completed' ? '✓' : '3'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '1rem' }}>Drop-off Location</strong>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {activeRide.dropLocation?.address || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Map - Full Width */}
          <div className="surface dashboard-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>🗺️ Live Map Tracking</h2>
              {rideStatus === 'ongoing' && (
                <div style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '20px',
                  border: '1px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 2s infinite'
                  }} />
                  <strong style={{ color: '#f59e0b', fontSize: '0.9rem' }}>Live Tracking</strong>
                </div>
              )}
            </div>
            
            <LiveMap 
              pickupLocation={activeRide.pickupLocation}
              dropLocation={activeRide.dropLocation}
              isTracking={rideStatus === 'ongoing'}
            />
            
            {rideStatus === 'ongoing' && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem 1.25rem', 
                background: 'rgba(59, 130, 246, 0.05)', 
                borderRadius: '8px',
                borderLeft: '3px solid #3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                <div>
                  <strong style={{ color: '#3b82f6' }}>Real-time Location Sharing</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0, fontSize: '0.9rem' }}>
                    Your location is being shared with the rider. They can track your position in real-time.
                  </p>
                </div>
              </div>
            )}

            {rideStatus === 'accepted' && (
              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem 1.25rem', 
                background: 'rgba(245, 158, 11, 0.05)', 
                borderRadius: '8px',
                borderLeft: '3px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🧭</span>
                <div>
                  <strong style={{ color: '#f59e0b' }}>Navigate to Pickup</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: 0, fontSize: '0.9rem' }}>
                    Use the map to navigate to the pickup location. Click "Start Ride" once you've picked up the rider.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="surface dashboard-panel">
            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                🗺️ Open in Google Maps
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                🚨 Report Issue
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                📸 Upload Photo
              </button>
              <button type="button" className="button button-secondary" style={{ padding: '1rem' }}>
                ℹ️ Ride Details
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'requests') {
      return (
        <div className="surface dashboard-panel">
          <h2>Ride Requests</h2>
          {requestMessage ? <div className="notice success">{requestMessage}</div> : null}
          {requestError ? <div className="notice error">{requestError}</div> : null}

          {!driverProfile ? (
            <div className="notice error" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              <div>
                <strong>⚠️ No driver profile found for this account.</strong>
                <p style={{ margin: '0.5rem 0 0 0' }}>
                  Complete driver registration to accept rides and start earning.
                </p>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={() => navigate('/become-driver')}
                style={{ marginTop: '0.5rem' }}
              >
                Complete Driver Registration →
              </button>
            </div>
          ) : driverProfile && !driverProfile.isApproved ? (
            <div className="notice" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              alignItems: 'flex-start',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              color: '#92400e'
            }}>
              <div>
                <strong>⏳ Your driver account is pending approval.</strong>
                <p style={{ margin: '0.5rem 0 0 0' }}>
                  An admin will review your registration and approve your account soon. You will be able to accept ride requests once approved.
                </p>
              </div>
            </div>
          ) : null}

          {loadingRequests ? <p>Loading ride requests...</p> : null}

          <div className="card-stack">
            {!loadingRequests && pendingRides.length === 0 ? (
              <article className="surface nested-card">
                <strong>No pending rides</strong>
                <p>New rider requests will appear here when available.</p>
              </article>
            ) : null}

            {pendingRides.map((ride) => (
              <article key={ride._id} className="surface nested-card">
                <strong>
                  {(ride.pickupLocation?.address || 'Pickup')} {'->'} {(ride.dropLocation?.address || 'Drop')}
                </strong>
                <p>{ride.scheduledTime || 'N/A'} · {ride.passengers || 1} passenger(s)</p>
                <p>Rider: {ride.rider?.name || 'Student'}</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0', fontWeight: '600' }}>
                  💳 Payment: {ride.paymentMethod === 'cash' ? '💵 Cash on Delivery' : '💳 Card Payment'}
                </p>
                
                {/* Price Quote Input */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>
                    💰 Your Price Quote (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="Enter fare amount"
                    value={quoteAmounts[ride._id] || ''}
                    onChange={(e) => setQuoteAmounts((current) => ({ ...current, [ride._id]: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '1rem',
                      marginBottom: '0.75rem'
                    }}
                    disabled={!driverProfile || !driverProfile.isApproved}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="button button-primary button-small"
                      onClick={() => handleSendQuote(ride._id)}
                      disabled={!driverProfile || !driverProfile.isApproved || sendingQuoteId === ride._id || !quoteAmounts[ride._id]}
                      style={{ flex: 1 }}
                    >
                      {sendingQuoteId === ride._id ? 'Sending...' : '📤 Send Quote'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="surface dashboard-panel">
          <h2>Ride History</h2>
          <p>Review your completed and cancelled rides in one place.</p>

          {historyError ? <div className="notice error">{historyError}</div> : null}
          {loadingHistory ? <p>Loading ride history...</p> : null}

          <div className="card-stack">
            {!loadingHistory && !historyError && rideHistory.length === 0 ? (
              <article className="surface nested-card">
                <strong>No ride history yet</strong>
                <p>Your completed and cancelled rides will appear here.</p>
              </article>
            ) : null}

            {!loadingHistory && rideHistory.map((ride) => (
              <article key={ride._id} className="surface nested-card">
                <strong>
                  {(ride.pickupLocation?.address || 'Pickup')} {'->'} {(ride.dropLocation?.address || 'Drop')}
                </strong>
                <p>{ride.scheduledDate || 'N/A'} · {ride.scheduledTime || 'N/A'}</p>
                <p>Rider: {ride.rider?.name || 'Student'}</p>
                <p>Fare: Rs. {ride.fare || 0}</p>
                <span className={`pill ${ride.status === 'completed' ? 'success' : ''}`}>
                  {ride.status === 'completed' ? 'Completed' : 'Cancelled'}
                </span>
              </article>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'earnings') {
      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {renderEarningsPage()}
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Settings Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '700' }}>Driver Settings</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Manage your profile, vehicle, availability, and preferences
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
              { id: 'vehicle', label: 'Vehicle', icon: '🚗' },
              { id: 'availability', label: 'Availability', icon: '📅' },
              { id: 'earnings', label: 'Earnings', icon: '💰' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'account', label: 'Account', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: settingsTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: settingsTab === tab.id ? 'white' : 'var(--text)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: settingsTab === tab.id ? '600' : '500',
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
          {settingsTab === 'profile' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Verification Status Banner */}
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                borderRadius: '12px',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '3rem' }}>✅</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: '#10b981' }}>Verified Driver</h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Your account is verified. License and vehicle documents approved.
                  </p>
                </div>
                <button type="button" className="button button-secondary button-small" style={{ borderColor: '#10b981', color: '#10b981' }} onClick={() => { setActiveTab('settings'); setSettingsTab('vehicle'); setShowDocuments(false); }}>
                  View Vehicle Details
                </button>
              </div>

              {/* Profile Information */}
              <div className="surface dashboard-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '2rem' }}>👤</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Profile Information</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Update your personal details and contact information</p>
                  </div>
                </div>
                
                {/* Profile Photo */}
                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    color: 'white',
                    marginBottom: '1rem',
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    🚗
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button type="button" className="button button-secondary button-small">
                      Change Photo
                    </button>
                    <button type="button" className="button button-secondary button-small">
                      Remove
                    </button>
                  </div>
                </div>

                <div className="field-grid two-col">
                  <label>
                    <strong>Full Name</strong>
                    <input type="text" defaultValue={currentUser?.name || 'Driver Name'} placeholder="Enter your full name" />
                  </label>
                  <label>
                    <strong>Email Address</strong>
                    <input type="email" defaultValue={currentUser?.email || 'driver@example.com'} placeholder="your.email@sliit.lk" />
                  </label>
                  <label>
                    <strong>Phone Number</strong>
                    <input type="tel" defaultValue={currentUser?.phone || '+94 77 123 4567'} placeholder="+94 XX XXX XXXX" />
                  </label>
                  <label>
                    <strong>Student ID</strong>
                    <input type="text" defaultValue={currentUser?.studentId || 'IT12345678'} disabled style={{ background: 'var(--bg)', cursor: 'not-allowed' }} />
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

              {/* Driver Stats */}
              <div className="surface dashboard-panel">
                <h2 style={{ marginBottom: '1.5rem' }}>📊 Driver Performance</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Rating', value: '4.8', icon: '⭐', color: '#f59e0b' },
                    { label: 'Total Rides', value: '247', icon: '🚗', color: '#3b82f6' },
                    { label: 'Completion Rate', value: '98%', icon: '✅', color: '#10b981' },
                    { label: 'Response Time', value: '2 min', icon: '⚡', color: '#8b5cf6' }
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      padding: '1.5rem',
                      background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`,
                      borderRadius: '12px',
                      border: `2px solid ${stat.color}30`,
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{stat.icon}</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem', color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Tab */}
          {settingsTab === 'vehicle' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* License & Documents Section - Show first when accessed via View Documents */}
              {showDocuments && (
                <div className="surface dashboard-panel" style={{ 
                  border: '3px solid #10b981',
                  boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.1)',
                  animation: 'highlight 0.5s ease-in-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>📄</span>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>License & Vehicle Documents</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your verified documents</p>
                      </div>
                    </div>
                    <button type="button" className="button button-secondary button-small" onClick={() => setShowDocuments(false)}>
                      Show All Vehicle Info
                    </button>
                  </div>
                  
                  <div className="field-grid two-col">
                    <label>
                      <strong>Driver's License Number</strong>
                      <input type="text" defaultValue={driverProfile?.licenseNumber || 'LIC-5678'} placeholder="License number" disabled style={{ background: 'var(--bg)' }} />
                    </label>
                    <label>
                      <strong>License Expiry Date</strong>
                      <input type="date" defaultValue="2026-12-31" disabled style={{ background: 'var(--bg)' }} />
                    </label>
                    <label>
                      <strong>Insurance Policy Number</strong>
                      <input type="text" defaultValue="INS-2024-9876" placeholder="Insurance policy number" disabled style={{ background: 'var(--bg)' }} />
                    </label>
                    <label>
                      <strong>Insurance Expiry Date</strong>
                      <input type="date" defaultValue="2025-06-30" disabled style={{ background: 'var(--bg)' }} />
                    </label>
                  </div>
                  
                  <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '12px',
                    border: '2px solid rgba(16, 185, 129, 0.3)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '2rem' }}>✅</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#10b981', fontSize: '1.1rem' }}>All Documents Verified</strong>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Your license and vehicle documents have been verified and approved.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>🪪</span>
                          <strong>Driver's License</strong>
                        </div>
                        <span className="pill success" style={{ fontSize: '0.8rem' }}>Verified</span>
                      </div>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                          <strong>Insurance</strong>
                        </div>
                        <span className="pill success" style={{ fontSize: '0.8rem' }}>Verified</span>
                      </div>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>📋</span>
                          <strong>Vehicle Registration</strong>
                        </div>
                        <span className="pill success" style={{ fontSize: '0.8rem' }}>Verified</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '3px solid #3b82f6'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#3b82f6' }}>📎 Update Documents</strong>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Need to update your documents? Upload new copies here.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" className="button button-secondary button-small">Upload License</button>
                      <button type="button" className="button button-secondary button-small">Upload Insurance</button>
                      <button type="button" className="button button-secondary button-small">Upload Registration</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Overview Card */}
              {!showDocuments && (
                <>
              <div style={{
                padding: '2rem',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
                borderRadius: '16px',
                border: '2px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem'
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
                }}>
                  🚗
                </div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>{driverProfile?.vehicleModel || 'Toyota Axio'}</h2>
                  <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    {driverProfile?.vehicleNumber || 'CAR-1234'} • {driverProfile?.vehicleType || 'Sedan'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="pill success">Verified</span>
                    <span className="pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                      {driverProfile?.capacity || 4} Seats
                    </span>
                  </div>
                </div>
                <button type="button" className="button button-secondary">
                  Upload Photo
                </button>
              </div>

              {/* Vehicle Details */}
              <div className="surface dashboard-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '2rem' }}>🚗</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Vehicle Information</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your vehicle details and documentation</p>
                  </div>
                </div>
                
                <div className="field-grid two-col">
                  <label>
                    <strong>Vehicle Type</strong>
                    <select defaultValue={driverProfile?.vehicleType || 'Sedan'}>
                      <option value="Sedan">Sedan</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="SUV">SUV</option>
                      <option value="Van">Van</option>
                      <option value="Motorbike">Motorbike</option>
                      <option value="Tuk-Tuk">Tuk-Tuk</option>
                    </select>
                  </label>
                  <label>
                    <strong>Vehicle Model</strong>
                    <input type="text" defaultValue={driverProfile?.vehicleModel || 'Toyota Axio'} placeholder="e.g., Toyota Axio" />
                  </label>
                  <label>
                    <strong>Vehicle Number</strong>
                    <input type="text" defaultValue={driverProfile?.vehicleNumber || 'CAR-1234'} placeholder="ABC-1234" />
                  </label>
                  <label>
                    <strong>License Plate</strong>
                    <input type="text" placeholder="e.g., WP CAR-1234" />
                  </label>
                  <label>
                    <strong>Seating Capacity</strong>
                    <select defaultValue={driverProfile?.capacity || 4}>
                      <option value="1">1 Passenger</option>
                      <option value="2">2 Passengers</option>
                      <option value="3">3 Passengers</option>
                      <option value="4">4 Passengers</option>
                      <option value="5">5 Passengers</option>
                      <option value="6">6 Passengers</option>
                      <option value="7">7+ Passengers</option>
                    </select>
                  </label>
                  <label>
                    <strong>Vehicle Color</strong>
                    <input type="text" placeholder="e.g., White" />
                  </label>
                  <label>
                    <strong>Year of Manufacture</strong>
                    <input type="number" min="1990" max="2025" placeholder="e.g., 2018" />
                  </label>
                  <label>
                    <strong>Fuel Type</strong>
                    <select defaultValue="Petrol">
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </label>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: '600' }}>Vehicle Features</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {[
                    { label: 'Air Conditioning', icon: '❄️' },
                    { label: 'GPS Navigation', icon: '🗺️' },
                    { label: 'Music System', icon: '🎵' },
                    { label: 'Phone Charger', icon: '🔌' },
                    { label: 'Child Seat Available', icon: '👶' },
                    { label: 'Pet Friendly', icon: '🐕' }
                  ].map((feature) => (
                    <label key={feature.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input type="checkbox" />
                      <span>{feature.icon}</span>
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="button button-primary">Update Vehicle</button>
                  <button type="button" className="button button-secondary">Cancel</button>
                </div>
              </div>

              {/* License Information */}
              <div className="surface dashboard-panel">
                <h2 style={{ marginBottom: '1.5rem' }}>📄 License & Documents</h2>
                <div className="field-grid two-col">
                  <label>
                    <strong>Driver's License Number</strong>
                    <input type="text" defaultValue={driverProfile?.licenseNumber || 'LIC-5678'} placeholder="License number" />
                  </label>
                  <label>
                    <strong>License Expiry Date</strong>
                    <input type="date" />
                  </label>
                  <label>
                    <strong>Insurance Policy Number</strong>
                    <input type="text" placeholder="Insurance policy number" />
                  </label>
                  <label>
                    <strong>Insurance Expiry Date</strong>
                    <input type="date" />
                  </label>
                </div>
                
                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  borderLeft: '3px solid #3b82f6'
                }}>
                  <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#3b82f6' }}>📎 Upload Documents</strong>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Keep your documents up to date for verification
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" className="button button-secondary button-small">License Copy</button>
                    <button type="button" className="button button-secondary button-small">Insurance</button>
                    <button type="button" className="button button-secondary button-small">Vehicle Registration</button>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          )}

          {/* Availability Tab */}
          {settingsTab === 'availability' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>📅</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Availability Schedule</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set your weekly availability for accepting rides</p>
                </div>
              </div>
              
              <div style={{ 
                padding: '1rem 1.5rem', 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05))',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
                  <input type="checkbox" defaultChecked={driverProfile?.isAvailable} style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>I'm currently available for rides</span>
                </label>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>Weekly Schedule</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <div key={day} style={{ 
                    display: 'grid',
                    gridTemplateColumns: '140px 1fr 40px 1fr',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: 'var(--bg)',
                    borderRadius: '8px',
                    border: '1px solid var(--border)'
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked />
                      <strong>{day}</strong>
                    </label>
                    <input type="time" defaultValue="08:00" />
                    <span style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>to</span>
                    <input type="time" defaultValue="18:00" />
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Save Schedule</button>
                <button type="button" className="button button-secondary">Reset to Default</button>
              </div>
            </div>
          )}

          {/* Routes Tab */}
          {settingsTab === 'routes' && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="surface dashboard-panel">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '2rem' }}>🗺️</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Preferred Routes</h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set your regular routes to match with riders</p>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: '600' }}>My Regular Routes</h3>
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  {[
                    { from: 'Malabe Town', to: 'SLIIT Campus', time: 'Morning (7-9 AM)', active: true },
                    { from: 'SLIIT Campus', to: 'Malabe Town', time: 'Evening (5-7 PM)', active: true },
                    { from: 'Kaduwela', to: 'SLIIT Campus', time: 'Morning (7-9 AM)', active: false }
                  ].map((route, idx) => (
                    <div key={idx} style={{
                      padding: '1.5rem',
                      background: route.active ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg)',
                      borderRadius: '12px',
                      border: route.active ? '2px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{ fontSize: '2rem' }}>📍</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <strong>{route.from}</strong>
                          <span style={{ color: 'var(--text-secondary)' }}>→</span>
                          <strong>{route.to}</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{route.time}</p>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
                        <input type="checkbox" defaultChecked={route.active} />
                        <span style={{ fontSize: '0.9rem' }}>Active</span>
                      </label>
                      <button type="button" className="button button-secondary button-small">Edit</button>
                    </div>
                  ))}
                </div>

                <button type="button" className="button button-primary">+ Add New Route</button>
              </div>

              <div className="surface dashboard-panel">
                <h2 style={{ marginBottom: '1.5rem' }}>🎯 Route Preferences</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked />
                    <div>
                      <strong style={{ display: 'block' }}>Accept nearby pickups</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Accept rides within 2km of your route</span>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked />
                    <div>
                      <strong style={{ display: 'block' }}>Flexible timing</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Accept rides ±30 minutes from scheduled time</span>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" />
                    <div>
                      <strong style={{ display: 'block' }}>Return trips only</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Only accept rides that match your return route</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {settingsTab === 'notifications' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>🔔</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Notification Preferences</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose what notifications you want to receive</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '1rem' }}>
                {[
                  { title: 'New Ride Requests', desc: 'Get notified when riders request your services', checked: true },
                  { title: 'Ride Confirmations', desc: 'Receive confirmation when rides are booked', checked: true },
                  { title: 'Ride Reminders', desc: 'Get reminders 30 minutes before scheduled rides', checked: true },
                  { title: 'Payment Notifications', desc: 'Alerts for completed payments and earnings', checked: true },
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
                    border: '1px solid var(--border)',
                    transition: 'all 0.2s'
                  }}>
                    <input type="checkbox" defaultChecked={item.checked} style={{ marginTop: '0.25rem', width: '18px', height: '18px' }} />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{item.title}</strong>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Save Preferences</button>
                <button type="button" className="button button-secondary">Disable All</button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {settingsTab === 'security' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>🔒</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Security Settings</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your password and account security</p>
                </div>
              </div>
              
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
                marginTop: '1.5rem',
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
                  <li>Include at least one special character</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="button button-primary">Change Password</button>
                <button type="button" className="button button-secondary">Cancel</button>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {settingsTab === 'account' && (
            <div className="surface dashboard-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '2rem' }}>⚙️</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Account Management</h2>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account status and data</p>
                </div>
              </div>

              {requestMessage ? <div className="notice success">{requestMessage}</div> : null}
              {requestError ? <div className="notice error">{requestError}</div> : null}
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Pause Account */}
                <div style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(245, 158, 11, 0.05)', 
                  borderRadius: '12px',
                  border: '2px solid rgba(245, 158, 11, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>⏸️</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>Pause Driver Account</h3>
                      <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)' }}>
                        Temporarily stop receiving ride requests without deleting your account. You can reactivate anytime.
                      </p>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                        onClick={handlePauseAccountToggle}
                        disabled={accountActionLoading === 'pause'}
                      >
                        {accountActionLoading === 'pause'
                          ? 'Updating...'
                          : driverProfile?.isAvailable
                          ? 'Pause Account'
                          : 'Reactivate Account'}
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
                        Permanently delete your driver account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        type="button"
                        className="button button-secondary"
                        style={{ borderColor: '#ef4444', color: '#ef4444' }}
                        onClick={handleDeleteAccount}
                        disabled={accountActionLoading === 'delete'}
                      >
                        {accountActionLoading === 'delete' ? 'Deleting...' : 'Delete Account'}
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
        <div className="stats-grid compact">
          {driverMetrics.map((metric) => (
            <article key={metric.label} className={`surface stat-card tone-${metric.tone}`}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>

        <div className="surface dashboard-panel">
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <button type="button" className="button button-secondary">Set Availability</button>
            <button type="button" className="button button-secondary">Update Location</button>
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('requests')}>View Requests</button>
            <button type="button" className="button button-secondary" onClick={() => setActiveTab('earnings')}>Earnings</button>
          </div>
        </div>

        <div className="surface dashboard-panel">
          <h2>Recent Ride Requests</h2>
          <div className="card-stack">
            {rideMatches.slice(0, 2).map((ride) => (
              <article key={`${ride.driver}-${ride.time}`} className="surface nested-card">
                <strong>{ride.route}</strong>
                <p>{ride.time} · {ride.price}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Driver Dashboard"
        title="Welcome back"
        subtitle="Manage ride requests, earnings, and your driving schedule."
      />

      <section className="section-block">
        <div className="container dashboard-shell">
          <aside className="surface dashboard-sidebar">
            <div className="sidebar-profile">
              <div className="avatar-badge">🚘</div>
              <h3>Driver Name</h3>
              <p>Verified Driver</p>
              <div style={{ position: 'relative', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => setShowNotifications((current) => !current)}
                  aria-label="Driver notifications"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem'
                  }}
                >
                  🔔 Notifications
                  {unreadNotifications > 0 ? (
                    <span
                      style={{
                        minWidth: '20px',
                        height: '20px',
                        borderRadius: '999px',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 0.35rem',
                        fontWeight: 700
                      }}
                    >
                      {unreadNotifications}
                    </span>
                  ) : null}
                </button>

                {showNotifications ? (
                  <div
                    className="surface"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 0.5rem)',
                      right: 0,
                      width: '280px',
                      maxHeight: '240px',
                      overflowY: 'auto',
                      zIndex: 20,
                      padding: '0.75rem'
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Notifications</strong>
                    {notificationItems.length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No new notifications.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '0.5rem' }}>
                        {notificationItems.map((notification) => (
                          <div
                            key={notification}
                            style={{
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)',
                              padding: '0.5rem',
                              background: 'var(--bg)',
                              borderRadius: '8px',
                              border: '1px solid var(--border)'
                            }}
                          >
                            {notification}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
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
