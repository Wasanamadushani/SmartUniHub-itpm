import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';

export default function RidePaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = readStoredUser();

  // Get ride details from navigation state or query params
  const rideData = location.state || {
    pickup: searchParams.get('pickup') || '',
    drop: searchParams.get('drop') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    passengers: searchParams.get('passengers') || '1',
  };

  const [paymentForm, setPaymentForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Validation
  const errors = {
    cardHolderName: !paymentForm.cardHolderName.trim()
      ? 'Cardholder name is required'
      : !/^[A-Za-z ]{3,80}$/.test(paymentForm.cardHolderName.trim())
      ? 'Enter a valid name (letters and spaces only)'
      : '',
    cardNumber: !paymentForm.cardNumber.trim()
      ? 'Card number is required'
      : !/^\d{16}$/.test(paymentForm.cardNumber.replace(/\s+/g, ''))
      ? 'Enter a valid 16-digit card number'
      : '',
    expiry: !paymentForm.expiry.trim()
      ? 'Expiry date is required'
      : !/^(0[1-9]|1[0-2])\/(\d{2})$/.test(paymentForm.expiry.trim())
      ? 'Enter valid expiry (MM/YY)'
      : '',
    cvv: !paymentForm.cvv.trim()
      ? 'CVV is required'
      : !/^\d{3}$/.test(paymentForm.cvv.trim())
      ? 'Enter a valid 3-digit CVV'
      : '',
  };

  const isFormValid = Object.values(errors).every((err) => !err);

  // Format card number with spaces
  function formatCardNumber(value) {
    const cleaned = value.replace(/\s+/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ');
  }

  // Format expiry as MM/YY
  function formatExpiry(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  }

  function handleCardNumberChange(e) {
    const value = e.target.value.replace(/\s+/g, '');
    if (/^\d{0,16}$/.test(value)) {
      setPaymentForm((prev) => ({ ...prev, cardNumber: value }));
    }
  }

  function handleExpiryChange(e) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setPaymentForm((prev) => ({ ...prev, expiry: formatExpiry(value) }));
    }
  }

  function handleCvvChange(e) {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) {
      setPaymentForm((prev) => ({ ...prev, cvv: value }));
    }
  }

  function touchField(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Touch all fields
    setTouched({
      cardHolderName: true,
      cardNumber: true,
      expiry: true,
      cvv: true,
    });

    if (!isFormValid) {
      setError('Please fix the errors in the form.');
      return;
    }

    if (!user || !user._id) {
      setError('Please log in to book a ride.');
      return;
    }

    // Validate expiry date
    const [month, year] = paymentForm.expiry.split('/').map(Number);
    const expiryYear = 2000 + year;
    const expiryDate = new Date(expiryYear, month, 0, 23, 59, 59);
    if (expiryDate < new Date()) {
      setError('Card has expired. Please use a valid card.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Create ride with card payment
      const response = await apiRequest('/api/rides', {
        method: 'POST',
        body: JSON.stringify({
          riderId: user._id,
          pickupLocation: rideData.pickup,
          dropLocation: rideData.drop,
          scheduledDate: rideData.date,
          scheduledTime: rideData.time,
          passengers: Number(rideData.passengers),
          paymentMethod: 'card',
          cardPayment: {
            cardHolderName: paymentForm.cardHolderName.trim(),
            cardLast4: paymentForm.cardNumber.slice(-4),
            cardExpiry: paymentForm.expiry,
          },
        }),
      });

      setSuccess('Payment successful! Your ride has been booked.');
      
      // Clear form
      setPaymentForm({
        cardHolderName: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
      });

      // Redirect to rider dashboard after 2 seconds
      setTimeout(() => {
        navigate('/rider-dashboard', { state: { tab: 'bookings' } });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-block">
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="surface" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
            <h2 style={{ marginBottom: '0.5rem' }}>Card Payment</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Enter your card details to complete the booking
            </p>
          </div>

          {/* Ride Summary */}
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem' }}>
              Ride Details
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pickup:</span>
                <strong>{rideData.pickup}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Drop:</span>
                <strong>{rideData.drop}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date:</span>
                <strong>{rideData.date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Time:</span>
                <strong>{rideData.time}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Passengers:</span>
                <strong>{rideData.passengers}</strong>
              </div>
            </div>
          </div>

          {error && (
            <div className="notice error" style={{ marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="notice success" style={{ marginBottom: '1.5rem' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Cardholder Name */}
              <label>
                <span className="field-label-row">Cardholder Name</span>
                <input
                  type="text"
                  value={paymentForm.cardHolderName}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, cardHolderName: e.target.value }))
                  }
                  onBlur={() => touchField('cardHolderName')}
                  placeholder="John Doe"
                  className={touched.cardHolderName && errors.cardHolderName ? 'input-error' : ''}
                  disabled={isSubmitting}
                />
                {touched.cardHolderName && errors.cardHolderName && (
                  <span className="field-error">{errors.cardHolderName}</span>
                )}
              </label>

              {/* Card Number */}
              <label>
                <span className="field-label-row">Card Number</span>
                <input
                  type="text"
                  value={formatCardNumber(paymentForm.cardNumber)}
                  onChange={handleCardNumberChange}
                  onBlur={() => touchField('cardNumber')}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  className={touched.cardNumber && errors.cardNumber ? 'input-error' : ''}
                  disabled={isSubmitting}
                />
                {touched.cardNumber && errors.cardNumber && (
                  <span className="field-error">{errors.cardNumber}</span>
                )}
              </label>

              {/* Expiry and CVV */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <label>
                  <span className="field-label-row">Expiry Date</span>
                  <input
                    type="text"
                    value={paymentForm.expiry}
                    onChange={handleExpiryChange}
                    onBlur={() => touchField('expiry')}
                    placeholder="MM/YY"
                    maxLength="5"
                    className={touched.expiry && errors.expiry ? 'input-error' : ''}
                    disabled={isSubmitting}
                  />
                  {touched.expiry && errors.expiry && (
                    <span className="field-error">{errors.expiry}</span>
                  )}
                </label>

                <label>
                  <span className="field-label-row">CVV</span>
                  <input
                    type="text"
                    value={paymentForm.cvv}
                    onChange={handleCvvChange}
                    onBlur={() => touchField('cvv')}
                    placeholder="123"
                    maxLength="3"
                    className={touched.cvv && errors.cvv ? 'input-error' : ''}
                    disabled={isSubmitting}
                  />
                  {touched.cvv && errors.cvv && (
                    <span className="field-error">{errors.cvv}</span>
                  )}
                </label>
              </div>

              {/* Security Note */}
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🔒</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Your payment information is secure and encrypted
                </span>
              </div>

              {/* Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => navigate('/rider-dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={isSubmitting || !isFormValid}
                >
                  {isSubmitting ? 'Processing...' : 'Pay & Book Ride'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
