import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { readStoredUser } from '../lib/auth';
import { isMongoObjectId, getEventBookingDetail } from '../lib/eventCommunityApi';

export default function EventPaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = location.state?.bookingId || searchParams.get('bookingId') || '';
  const eventId = location.state?.eventId || searchParams.get('eventId') || '';
  const amountPaid = Number(location.state?.amount || searchParams.get('amount') || '0');

  const user = useMemo(() => readStoredUser(), []);
  const rawUserId = user?._id || user?.id || '';
  const userId = isMongoObjectId(rawUserId) ? rawUserId : '';

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollInterval, setPollInterval] = useState(null);

  const paymentStatus = booking?.paymentStatus || 'pending_verification';
  const isApproved = paymentStatus === 'approved';
  const isPending = paymentStatus === 'pending_verification';

  // Fetch booking details and setup polling
  useEffect(() => {
    if (!isMongoObjectId(bookingId)) {
      setError('Invalid booking ID');
      setLoading(false);
      return;
    }

    async function fetchBooking() {
      try {
        const data = await getEventBookingDetail(bookingId);
        setBooking(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Unable to load booking details');
        console.error('Fetch booking error:', err);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchBooking();

    // Setup polling every 3 seconds to check for admin approval
    const interval = setInterval(fetchBooking, 3000);
    setPollInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bookingId]);

  // Stop polling once payment is approved
  useEffect(() => {
    if (isApproved && pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [isApproved, pollInterval]);

  if (loading && !booking) {
    return (
      <section className="paymentx-shell section-block">
        <div className="container receiptx-wrap">
          <div className="receiptx-card">
            <div className="paymentx-loading">Loading payment status...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="paymentx-shell section-block">
      <div className="container receiptx-wrap">
        <div className="receiptx-card">
          <header className="receiptx-head">
            <div className={`receiptx-icon ${isApproved ? 'receiptx-icon-success' : 'receiptx-icon-pending'}`} aria-hidden="true">
              {isApproved ? '✓' : '⏳'}
            </div>
            <div>
              <h1>{isApproved ? 'Payment Approved' : 'Payment Submitted Successfully'}</h1>
              <p>{isApproved ? 'Your payment has been verified and approved.' : 'Your payment receipt has been received. Awaiting admin verification.'}</p>
            </div>
          </header>

          {error ? (
            <div className="paymentx-alert paymentx-alert-error">{error}</div>
          ) : null}

          {/* Status Badge */}
          <div className={`successx-status-badge ${isApproved ? 'successx-approved' : 'successx-pending'}`}>
            <span className="successx-status-label">
              {isApproved ? '✓ Approved' : '⏳ Pending Approval'}
            </span>
            {isPending && (
              <small className="successx-status-helper">Admin is verifying your payment...</small>
            )}
          </div>

          {/* Booking Details */}
          <div className="successx-details-grid">
            <div className="successx-detail-item">
              <label>Booking ID</label>
              <strong className="successx-mono">{bookingId || 'N/A'}</strong>
            </div>
            <div className="successx-detail-item">
              <label>Amount Paid</label>
              <strong className="successx-amount">Rs.{amountPaid.toFixed(2)}</strong>
            </div>
            <div className="successx-detail-item">
              <label>Payment Status</label>
              <strong className={isApproved ? 'successx-text-success' : 'successx-text-warning'}>
                {isApproved ? 'Approved' : 'Pending Verification'}
              </strong>
            </div>
            {booking?.verifiedAt && (
              <div className="successx-detail-item">
                <label>Verified At</label>
                <strong>{new Date(booking.verifiedAt).toLocaleString()}</strong>
              </div>
            )}
            {booking?.createdAt && (
              <div className="successx-detail-item">
                <label>Submitted At</label>
                <strong>{new Date(booking.createdAt).toLocaleString()}</strong>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="successx-actions">
            <button
              className="button button-secondary"
              onClick={() => navigate('/book-event')}
            >
              Browse More Events
            </button>
            {isApproved && (
              <button
                className="button button-primary"
                onClick={() => navigate('/rider-dashboard')}
              >
                Go to Dashboard
              </button>
            )}
            {isPending && (
              <button
                className="button button-outline"
                onClick={() => window.location.reload()}
              >
                Refresh Status
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="successx-info-box">
            {isApproved ? (
              <>
                <h4>✓ What's Next?</h4>
                <ul>
                  <li>Your booking is confirmed and approved</li>
                  <li>Check your email for confirmation details</li>
                  <li>View your bookings in the dashboard</li>
                  <li>You can now access event details and participate</li>
                </ul>
              </>
            ) : (
              <>
                <h4>⏳ Waiting for Verification</h4>
                <ul>
                  <li>Your receipt has been uploaded successfully</li>
                  <li>An admin will verify your payment shortly</li>
                  <li>This page will automatically update when approved</li>
                  <li>You can safely close this page and check back later</li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
