import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import EventActionBar from '../components/EventActionBar';
import { apiRequest } from '../lib/api';
import { readStoredUser } from '../lib/auth';
import { getEventBookingSummary, getMyEventBookings, isMongoObjectId } from '../lib/eventCommunityApi';

const EMPTY_SUMMARY = {
  totalSeats: 0,
  bookedSeats: 0,
  remainingSeats: 0,
  isBookable: false,
  userHasBooked: false,
};
const MAX_SEATS_PER_BOOKING = 5;

export default function BookEventPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preferredEventId = searchParams.get('eventId') || '';
  const user = useMemo(() => readStoredUser(), []);
  const rawUserId = user?._id || user?.id || '';
  const userId = isMongoObjectId(rawUserId) ? rawUserId : '';

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [bookingCount, setBookingCount] = useState('1');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myBookings, setMyBookings] = useState([]);

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedEventId) || null,
    [events, selectedEventId]
  );

  const bookingDisabledReason = useMemo(() => {
    if (!userId) return 'Please log in before booking an event.';
    if (!selectedEventId || !selectedEvent) return 'Choose an event card to continue.';
    if (!summary.isBookable) return 'This event is not bookable right now.';
    if (summary.userHasBooked) return 'You have already booked this event.';
    if (summary.remainingSeats < 1) return 'No seats remaining for this event.';
    return '';
  }, [userId, selectedEventId, selectedEvent, summary.isBookable, summary.userHasBooked, summary.remainingSeats]);

  function handleSelectEvent(eventId) {
    setSelectedEventId(eventId);
    setSuccess('');
    setError('');
  }

  async function loadMyBookings() {
    if (!userId) {
      setMyBookings([]);
      return;
    }

    try {
      const bookings = await getMyEventBookings(userId);
      setMyBookings(Array.isArray(bookings) ? bookings : []);
    } catch {
      setMyBookings([]);
    }
  }

  useEffect(() => {
    async function loadBookableEvents() {
      try {
        setIsLoading(true);
        setError('');
        setSuccess('');

        const data = await apiRequest('/events?status=approved');
        const approvedIndoorEvents = Array.isArray(data)
          ? data.filter((event) => event.status === 'approved' && event.eventType === 'indoor')
          : [];

        setEvents(approvedIndoorEvents);

        if (approvedIndoorEvents.length === 0) {
          setSelectedEventId('');
          setSummary(EMPTY_SUMMARY);
          return;
        }

        const requestedExists = approvedIndoorEvents.some((event) => event._id === preferredEventId);
        if (preferredEventId && requestedExists) {
          setSelectedEventId(preferredEventId);
        } else {
          setSelectedEventId(approvedIndoorEvents[0]._id);
          if (preferredEventId && !requestedExists) {
            setError('Selected event is not bookable. Only approved indoor events can be booked.');
          }
        }
      } catch (requestError) {
        setError(requestError.message || 'Unable to load approved indoor events.');
      } finally {
        setIsLoading(false);
      }
    }

    loadBookableEvents();
  }, [preferredEventId]);

  useEffect(() => {
    async function loadSummary() {
      if (!selectedEventId) {
        setSummary(EMPTY_SUMMARY);
        return;
      }

      try {
        const response = await getEventBookingSummary(selectedEventId, userId);
        setSummary(response);

        if (response.remainingSeats <= 0) {
          setBookingCount('1');
          return;
        }

        const currentCount = Number(bookingCount || 1);
        const maxSelectableSeats = MAX_SEATS_PER_BOOKING;
        if (!Number.isInteger(currentCount) || currentCount < 1 || currentCount > maxSelectableSeats) {
          setBookingCount(String(Math.min(Math.max(1, currentCount || 1), maxSelectableSeats)));
        }
      } catch (requestError) {
        setError(requestError.message || 'Unable to load booking summary.');
      }
    }

    loadSummary();
  }, [selectedEventId, userId]);

  useEffect(() => {
    loadMyBookings();
  }, [userId]);

  function handleProceedToPayment() {
    setError('');
    setSuccess('');

    if (bookingDisabledReason) {
      setError(bookingDisabledReason);
      return;
    }

    const seats = Number(bookingCount || 1);
    if (!Number.isInteger(seats) || seats < 1) {
      setError('Booking count must be a positive whole number.');
      return;
    }

    if (seats > MAX_SEATS_PER_BOOKING) {
      setError(`You can book a maximum of ${MAX_SEATS_PER_BOOKING} seats at once.`);
      return;
    }

    const noteValue = String(note || '').trim();
    const paymentUrl = `/book-event/payment?eventId=${encodeURIComponent(selectedEventId)}&seats=${encodeURIComponent(String(seats))}&note=${encodeURIComponent(noteValue)}`;
    navigate(paymentUrl, {
      state: {
        eventId: selectedEventId,
        bookingCount: seats,
        note: noteValue,
        selectedEvent,
      },
    });
  }

  function handlePrintTicket(booking) {
    if (!booking || booking.paymentStatus !== 'approved') {
      return;
    }

    const eventData = booking.event || {};
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      return;
    }

    const html = `
      <!doctype html>
      <html>
      <head>
        <title>Event Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          .ticket { border: 2px dashed #1e3a8a; border-radius: 14px; padding: 20px; max-width: 680px; }
          h1 { margin-top: 0; }
          .meta { margin: 8px 0; font-size: 15px; }
          .code { font-size: 22px; font-weight: bold; letter-spacing: 1px; margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <h1>${eventData.title || 'Event Ticket'}</h1>
          <div class="meta"><strong>Name:</strong> ${booking.userName || '-'}</div>
          <div class="meta"><strong>Location:</strong> ${eventData.location || '-'}</div>
          <div class="meta"><strong>Start:</strong> ${eventData.startDate ? new Date(eventData.startDate).toLocaleString() : '-'}</div>
          <div class="meta"><strong>Seats:</strong> ${booking.bookingCount || 1}</div>
          <div class="meta"><strong>Payment Reference:</strong> ${booking.paymentReference || '-'}</div>
          <div class="code">Ticket Code: ${booking.ticketCode || '-'}</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Book Event</span>
            <h2>Reserve Seats for Approved Indoor Events</h2>
            <p>
              Booking is available only for events that are admin approved and marked as indoor.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{events.length}</strong><span>Bookable Events</span></div>
            <div className="eventsx-stat-card"><strong>{summary.totalSeats}</strong><span>Total Seats</span></div>
            <div className="eventsx-stat-card"><strong>{summary.bookedSeats}</strong><span>Booked Seats</span></div>
            <div className="eventsx-stat-card"><strong>{summary.remainingSeats}</strong><span>Remaining</span></div>
          </div>
        </article>

        <div className="eventsx-toolbar">
          <EventActionBar />
        </div>

        {error ? <div className="surface eventsx-empty"><p className="text-danger">{error}</p></div> : null}
        {success ? <div className="surface eventsx-empty"><p>{success}</p></div> : null}

        {!userId ? (
          <div className="surface eventsx-empty">
            <p>Please log in to book an event.</p>
            <Link to="/login" className="button button-primary button-small">Go to Login</Link>
          </div>
        ) : null}

        {isLoading ? (
          <div className="surface card eventsx-empty">
            <p>Loading bookable events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="surface card eventsx-empty">
            <p>No approved indoor events are available for booking right now.</p>
          </div>
        ) : (
          <div className="eventsx-book-event-grid">
            {events.map((eventItem) => {
              const isSelected = eventItem._id === selectedEventId;
              return (
                <article
                  key={eventItem._id}
                  className={`surface eventsx-card ${isSelected ? 'eventsx-book-card-active' : ''}`}
                >
                  <div className="eventsx-card-head">
                    <span className="section-kicker">{new Date(eventItem.startDate).toLocaleDateString()}</span>
                    <span className="pill success">{eventItem.eventType}</span>
                  </div>
                  <h3>{eventItem.title}</h3>
                  <p className="eventsx-location">{eventItem.location || 'Campus'}</p>
                  <p>{eventItem.description || 'No additional details available.'}</p>
                  <div className="eventsx-meta">
                    <span>Start: {new Date(eventItem.startDate).toLocaleString()}</span>
                    <span>End: {new Date(eventItem.endDate).toLocaleString()}</span>
                    <span>Seats: {eventItem.totalSeats || 0}</span>
                  </div>
                  <div className="eventsx-actions">
                    <button
                      type="button"
                      className={`button button-small ${isSelected ? 'button-secondary' : 'button-primary'}`}
                      onClick={() => handleSelectEvent(eventItem._id)}
                    >
                      {isSelected ? 'Selected' : 'Book Event'}
                    </button>
                    <Link to={`/events/${eventItem._id}`} className="button button-small button-ghost">
                      View Details
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="eventsx-book-grid">
          <div className="surface eventsx-book-form">
            <div className="eventsx-detail-card">
              <h4>Selected Event</h4>
              {selectedEvent ? (
                <>
                  <p><strong>{selectedEvent.title}</strong></p>
                  <p>{selectedEvent.location || 'Campus'}</p>
                </>
              ) : (
                <p className="eventsx-muted-note">Choose an event card above to continue booking.</p>
              )}
            </div>

            <label>
              <span>Seats to Book *</span>
              <input
                type="number"
                min="1"
                max={MAX_SEATS_PER_BOOKING}
                step="1"
                value={bookingCount}
                onChange={(event) => setBookingCount(event.target.value)}
                required
                disabled={!selectedEventId}
              />
              <small className="eventsx-muted-note">Maximum {MAX_SEATS_PER_BOOKING} seats per booking.</small>
              {bookingDisabledReason ? <small className="text-danger">{bookingDisabledReason}</small> : null}
            </label>

            <label>
              <span>Note (Optional)</span>
              <textarea
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Any booking note for organizers"
                maxLength={300}
              />
            </label>

            <div className="eventsx-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={handleProceedToPayment}
                disabled={Boolean(bookingDisabledReason)}
              >
                Proceed to Payment
              </button>
            </div>
          </div>

          <aside className="surface eventsx-create-side">
            <h3>Booking Status</h3>
            {isLoading ? <p>Loading bookable events...</p> : null}
            {!selectedEvent ? <p>No approved indoor event selected.</p> : null}

            {selectedEvent ? (
              <div className="eventsx-book-status">
                <div className="eventsx-detail-card">
                  <h4>{selectedEvent.title}</h4>
                  <p><strong>Location:</strong> {selectedEvent.location || 'Campus'}</p>
                  <p><strong>Start:</strong> {new Date(selectedEvent.startDate).toLocaleString()}</p>
                  <p><strong>End:</strong> {new Date(selectedEvent.endDate).toLocaleString()}</p>
                  <p><strong>Status:</strong> {selectedEvent.status}</p>
                  <p><strong>Type:</strong> {selectedEvent.eventType}</p>
                </div>

                <div className="eventsx-detail-card">
                  <h4>Seat Capacity</h4>
                  <p><strong>Total Seats:</strong> {summary.totalSeats}</p>
                  <p><strong>Booked:</strong> {summary.bookedSeats}</p>
                  <p><strong>Remaining:</strong> {summary.remainingSeats}</p>
                  {summary.userHasBooked ? (
                    <p className="eventsx-muted-note">You have already booked this event.</p>
                  ) : null}
                  {!summary.isBookable ? (
                    <p className="eventsx-muted-note">This event is not currently bookable.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <article className="surface eventsx-detail-card">
          <h3>My Event Tickets</h3>
          {myBookings.length === 0 ? (
            <p>No bookings yet.</p>
          ) : (
            <div className="eventsx-card-grid">
              {myBookings.map((booking) => (
                <div key={booking._id} className="eventsx-card">
                  <h4>{booking.event?.title || 'Event'}</h4>
                  <p><strong>Seats:</strong> {booking.bookingCount}</p>
                  <p><strong>Payment:</strong> {booking.paymentStatus}</p>
                  <p><strong>Reference:</strong> {booking.paymentReference || '-'}</p>
                  {booking.paymentStatus === 'approved' ? (
                    <>
                      <p><strong>Ticket:</strong> {booking.ticketCode || '-'}</p>
                      <button
                        type="button"
                        className="button button-small button-primary"
                        onClick={() => handlePrintTicket(booking)}
                      >
                        Print Ticket
                      </button>
                    </>
                  ) : (
                    <p className="eventsx-muted-note">Ticket will appear after admin payment approval.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
