import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';
import { createEventBooking, getEventBookingSummary, isMongoObjectId } from '../lib/eventCommunityApi';

const MAX_SEATS_PER_BOOKING = 5;
const MIN_EXPIRY_YEAR_SHORT = 26;
const MAX_EXPIRY_YEAR_SHORT = MIN_EXPIRY_YEAR_SHORT + 5;
const EMPTY_SUMMARY = {
  totalSeats: 0,
  bookedSeats: 0,
  remainingSeats: 0,
  isBookable: false,
  userHasBooked: false,
};

function normalizeSeatCount(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }
  return Math.min(parsed, MAX_SEATS_PER_BOOKING);
}

function formatCardNumberInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiryInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function EventPaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEventId = location.state?.eventId || searchParams.get('eventId') || '';
  const initialSelectedEvent = location.state?.selectedEvent || null;
  const initialBookingCount = normalizeSeatCount(location.state?.bookingCount || searchParams.get('seats') || 1);
  const initialNote = String(location.state?.note || searchParams.get('note') || '').trim();

  const user = useMemo(() => readStoredUser(), []);
  const rawUserId = user?._id || user?.id || '';
  const userId = isMongoObjectId(rawUserId) ? rawUserId : '';

  const [eventId] = useState(initialEventId);
  const [selectedEvent, setSelectedEvent] = useState(initialSelectedEvent);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [bookingCount] = useState(initialBookingCount);
  const [note, setNote] = useState(initialNote);
  const [paymentForm, setPaymentForm] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadPaymentContext() {
      if (!eventId) {
        setError('Event details are missing. Please select an event and try again.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError('');

        const summaryPromise = getEventBookingSummary(eventId, userId);
        const eventPromise = selectedEvent && selectedEvent._id === eventId
          ? Promise.resolve(selectedEvent)
          : apiRequest(`/events/${eventId}`);

        const [summaryData, eventData] = await Promise.all([summaryPromise, eventPromise]);
        setSummary(summaryData || EMPTY_SUMMARY);
        setSelectedEvent(eventData || null);
      } catch (requestError) {
        setError(requestError.message || 'Unable to load payment details.');
      } finally {
        setIsLoading(false);
      }
    }

    loadPaymentContext();
  }, [eventId, selectedEvent, userId]);

  function validatePaymentForm() {
    const cardHolderName = String(paymentForm.cardHolderName || '').trim();
    const cardNumber = String(paymentForm.cardNumber || '').replace(/\s+/g, '');
    const expiry = String(paymentForm.expiry || '').trim();
    const cvv = String(paymentForm.cvv || '').trim();

    if (!/^[A-Za-z ]{3,80}$/.test(cardHolderName)) {
      return 'Card holder name must contain only letters and spaces.';
    }

    if (!/^\d{16}$/.test(cardNumber)) {
      return 'Card number must be exactly 16 digits.';
    }

    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry)) {
      return 'Expiry must be in MM/YY format.';
    }

    if (!/^\d{3}$/.test(cvv)) {
      return 'CVV must be exactly 3 digits.';
    }

    const [month, yearShort] = expiry.split('/').map(Number);
    if (yearShort < MIN_EXPIRY_YEAR_SHORT || yearShort > MAX_EXPIRY_YEAR_SHORT) {
      return `Expiry year must be between ${MIN_EXPIRY_YEAR_SHORT} and ${MAX_EXPIRY_YEAR_SHORT}.`;
    }

    const year = 2000 + yearShort;
    const expiryDate = new Date(year, month, 0, 23, 59, 59, 999);
    if (expiryDate < new Date()) {
      return 'Card expiry date is in the past.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!userId) {
      setError('Please log in before booking an event.');
      return;
    }

    if (!eventId || !selectedEvent) {
      setError('Event details are missing. Please go back and select an event.');
      return;
    }

    if (selectedEvent.status !== 'approved' || selectedEvent.eventType !== 'indoor') {
      setError('Only approved indoor events can be booked.');
      return;
    }

    if (!summary.isBookable) {
      setError('This event is not bookable right now.');
      return;
    }

    const eventTicketPrice = Number(selectedEvent.ticketPrice);
    if (!Number.isFinite(eventTicketPrice) || eventTicketPrice < 0) {
      setError('Ticket price is not configured for this event.');
      return;
    }

    if (summary.userHasBooked) {
      setError('You have already booked this event.');
      return;
    }

    if (summary.remainingSeats < bookingCount) {
      setError('Not enough remaining seats for this booking.');
      return;
    }

    const paymentValidationError = validatePaymentForm();
    if (paymentValidationError) {
      setError(paymentValidationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingResponse = await createEventBooking(eventId, {
        userId,
        userName: user?.name || user?.fullName || 'Student',
        userEmail: user?.email || '',
        bookingCount,
        note,
        payment: {
          cardHolderName: String(paymentForm.cardHolderName || '').trim(),
          cardNumber: String(paymentForm.cardNumber || '').replace(/\s+/g, ''),
          expiry: String(paymentForm.expiry || '').trim(),
          cvv: String(paymentForm.cvv || '').trim(),
        },
      });

      const createdBookingId = bookingResponse?.booking?._id;
      const createdBookingAmount = Number(bookingResponse?.booking?.paymentAmount || totalAmount || 0);
      if (createdBookingId) {
        navigate(
          `/book-event/payment/receipt?bookingId=${encodeURIComponent(createdBookingId)}&eventId=${encodeURIComponent(eventId)}&amount=${encodeURIComponent(String(createdBookingAmount))}`,
          {
            state: {
              bookingId: createdBookingId,
              eventId,
              amount: createdBookingAmount,
            },
          }
        );
        return;
      }

      setSuccess('Payment submitted successfully. Admin will verify your payment and issue the ticket after approval.');
      setPaymentForm({
        cardHolderName: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit payment right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const unitTicketPrice = Number.isFinite(Number(selectedEvent?.ticketPrice))
    ? Number(selectedEvent.ticketPrice)
    : Number.isFinite(Number(summary?.ticketPrice))
      ? Number(summary.ticketPrice)
      : 0;
  const totalAmount = Number((unitTicketPrice * bookingCount)).toFixed(2);

  return (
    <section className="paymentx-shell section-block">
      <div className="container paymentx-wrap">
        <header className="paymentx-header">
          <div>
            <p className="paymentx-kicker">Secure Checkout</p>
            <h1>Card Payment</h1>
            <p>Enter payment details to complete your event booking request.</p>
          </div>
          <button
            type="button"
            className="button button-ghost"
            onClick={() => navigate(`/book-event?eventId=${encodeURIComponent(eventId)}`)}
          >
            Back to Book Event
          </button>
        </header>

        {error ? <div className="paymentx-alert paymentx-alert-error">{error}</div> : null}
        {success ? <div className="paymentx-alert paymentx-alert-success">{success}</div> : null}

        {!userId ? (
          <div className="paymentx-login-card">
            <p>Please log in to continue with payment.</p>
            <Link to="/login" className="button button-primary button-small">Go to Login</Link>
          </div>
        ) : null}

        <div className="paymentx-grid">
          <form onSubmit={handleSubmit} className="paymentx-card paymentx-form" noValidate>
            <h2>Payment Details</h2>

            <label className="paymentx-label">
              <span>Card Holder Name *</span>
              <input
                type="text"
                value={paymentForm.cardHolderName}
                onChange={(event) => setPaymentForm((prev) => ({ ...prev, cardHolderName: event.target.value }))}
                placeholder="Name on card"
                required
              />
            </label>

            <label className="paymentx-label">
              <span>Card Number *</span>
              <input
                type="text"
                value={paymentForm.cardNumber}
                onChange={(event) => setPaymentForm((prev) => ({
                  ...prev,
                  cardNumber: formatCardNumberInput(event.target.value),
                }))}
                placeholder="16-digit card number"
                inputMode="numeric"
                maxLength={19}
                required
              />
            </label>

            <div className="paymentx-row">
              <label className="paymentx-label">
                <span>Expiry (MM/YY) *</span>
                <input
                  type="text"
                  value={paymentForm.expiry}
                  onChange={(event) => setPaymentForm((prev) => ({
                    ...prev,
                    expiry: formatExpiryInput(event.target.value),
                  }))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </label>
              <label className="paymentx-label">
                <span>CVV *</span>
                <input
                  type="password"
                  value={paymentForm.cvv}
                  onChange={(event) => setPaymentForm((prev) => ({
                    ...prev,
                    cvv: String(event.target.value || '').replace(/\D/g, '').slice(0, 3),
                  }))}
                  placeholder="3 digits"
                  inputMode="numeric"
                  maxLength={3}
                  required
                />
              </label>
            </div>

            <label className="paymentx-label">
              <span>Note (Optional)</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Any booking note for organizers"
                maxLength={300}
              />
            </label>

            <div className="paymentx-secure-note">
              <strong>Secure and encrypted checkout</strong>
              <p>Your payment details are validated before submission.</p>
            </div>

            <div className="paymentx-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting || isLoading || !userId}
              >
                {isSubmitting ? 'Submitting Payment...' : 'Pay & Submit Booking'}
              </button>
            </div>
          </form>

          <aside className="paymentx-card paymentx-summary">
            <h2>Order Summary</h2>
            {isLoading ? (
              <p>Loading booking details...</p>
            ) : selectedEvent ? (
              <>
                <div className="paymentx-summary-event">
                  <h3>{selectedEvent.title}</h3>
                  <p>{selectedEvent.location || 'Campus'}</p>
                  <p>{selectedEvent.startDate ? new Date(selectedEvent.startDate).toLocaleString() : '-'}</p>
                </div>

                <div className="paymentx-summary-line">
                  <span>Ticket Price (each)</span>
                  <strong>LKR {unitTicketPrice.toFixed(2)}</strong>
                </div>
                <div className="paymentx-summary-line">
                  <span>Tickets x {bookingCount}</span>
                  <strong>LKR {totalAmount}</strong>
                </div>
                <div className="paymentx-summary-line">
                  <span>Service Fee</span>
                  <strong>LKR 0.00</strong>
                </div>
                <div className="paymentx-summary-line">
                  <span>Tax</span>
                  <strong>LKR 0.00</strong>
                </div>

                <div className="paymentx-summary-total">
                  <span>Total</span>
                  <strong>LKR {totalAmount}</strong>
                </div>

                <div className="paymentx-summary-meta">
                  <p><strong>Status:</strong> {selectedEvent.status}</p>
                  <p><strong>Type:</strong> {selectedEvent.eventType}</p>
                  <p><strong>Seats Remaining:</strong> {summary.remainingSeats}</p>
                </div>
              </>
            ) : (
              <p>Unable to load selected event.</p>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
