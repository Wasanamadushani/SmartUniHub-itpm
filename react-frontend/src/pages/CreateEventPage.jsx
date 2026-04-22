import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import EventActionBar from '../components/EventActionBar';

function toDateTimeLocalValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const minStartDateTime = useMemo(() => toDateTimeLocalValue(new Date()), []);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    eventType: 'indoor',
    totalSeats: '',
    ticketPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.title || !formData.title.trim()) {
        setError('Event title is required.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.startDate) {
        setError('Start date and time are required.');
        setIsSubmitting(false);
        return;
      }

      if (!formData.endDate) {
        setError('End date and time are required.');
        setIsSubmitting(false);
        return;
      }

      const now = new Date();
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        setError('Please provide valid start and end date/time.');
        setIsSubmitting(false);
        return;
      }

      if (startDate < now) {
        setError('Start date/time cannot be in the past.');
        setIsSubmitting(false);
        return;
      }

      if (endDate <= startDate) {
        setError('End date/time must be later than start date/time.');
        setIsSubmitting(false);
        return;
      }

      // Validate indoor event requirements
      if (formData.eventType === 'indoor') {
        if (!formData.totalSeats || formData.totalSeats === '') {
          setError('Total seats is required for indoor events.');
          setIsSubmitting(false);
          return;
        }

        const totalSeats = parseInt(formData.totalSeats);
        if (!Number.isInteger(totalSeats) || totalSeats < 1) {
          setError('Total seats must be a positive number.');
          setIsSubmitting(false);
          return;
        }

        if (!formData.ticketPrice || formData.ticketPrice === '') {
          setError('Ticket price is required for indoor events.');
          setIsSubmitting(false);
          return;
        }

        const ticketPrice = parseFloat(formData.ticketPrice);
        if (!Number.isFinite(ticketPrice) || ticketPrice < 0) {
          setError('Ticket price must be a valid non-negative number.');
          setIsSubmitting(false);
          return;
        }
      }

      // Check for overlapping events
      try {
        const allEventsResponse = await apiRequest('/api/events?includeAll=true');
        const allEvents = Array.isArray(allEventsResponse) ? allEventsResponse : [];
        
        const conflictingEvent = allEvents.find(event => {
          const eventStart = new Date(event.startDate);
          const eventEnd = new Date(event.endDate);
          return startDate < eventEnd && endDate > eventStart;
        });

        if (conflictingEvent) {
          setError(`Cannot create event: there is already an event "${conflictingEvent.title}" scheduled during this time slot (${new Date(conflictingEvent.startDate).toLocaleString()} - ${new Date(conflictingEvent.endDate).toLocaleString()}). Please choose a different date/time range.`);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn('Could not check for overlapping events:', err);
        // Continue anyway, let backend validation handle it
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location.trim(),
        eventType: formData.eventType,
        totalSeats: formData.eventType === 'indoor' ? parseInt(formData.totalSeats) : undefined,
        ticketPrice: formData.eventType === 'indoor' ? parseFloat(formData.ticketPrice) : undefined,
      };

      console.log('Submitting event data:', eventData);

      const response = await apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });

      console.log('Event created successfully:', response);
      
      if (response?._id) {
        navigate('/admin-events');
      } else {
        setError('Event created but could not redirect. Please check admin panel.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <section className="section-block">
      <div className="container eventsx-grid">
        <article className="surface eventsx-hero">
          <div>
            <span className="section-kicker">Create Event</span>
            <h2>Launch a New Campus Event</h2>
            <p>
              Fill in event details and submit for admin approval. Clear and complete details speed up moderation.
            </p>
          </div>
          <div className="eventsx-stat-grid">
            <div className="eventsx-stat-card"><strong>{formData.title ? 'Ready' : 'Draft'}</strong><span>Current State</span></div>
            <div className="eventsx-stat-card"><strong>{formData.eventType}</strong><span>Event Type</span></div>
            <div className="eventsx-stat-card"><strong>{formData.totalSeats || '-'}</strong><span>Seat Capacity</span></div>
            <div className="eventsx-stat-card"><strong>{formData.eventType === 'indoor' && formData.ticketPrice !== '' ? `LKR ${formData.ticketPrice}` : '-'}</strong><span>Ticket Price</span></div>
          </div>
        </article>

        <div className="eventsx-toolbar">
          <EventActionBar />
        </div>

        <div className="eventsx-create-grid">
          <form onSubmit={handleSubmit} className="surface eventsx-create-form">
            {error ? <p className="text-danger">{error}</p> : null}

            <label>
              <span>Event Title *</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter event title"
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the event"
                rows={4}
              />
            </label>

            <div className="field-grid">
              <label>
                <span>Start Date & Time *</span>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={minStartDateTime}
                  required
                />
              </label>

              <label>
                <span>End Date & Time *</span>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || minStartDateTime}
                  required
                />
              </label>
            </div>

            <label>
              <span>Location</span>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Event location"
              />
            </label>

            <label>
              <span>Event Type *</span>
              <select name="eventType" value={formData.eventType} onChange={handleChange} required>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </label>

            {formData.eventType === 'indoor' ? (
              <>
                <label>
                  <span>Total Seats *</span>
                  <input
                    type="number"
                    name="totalSeats"
                    value={formData.totalSeats}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Number of seats"
                  />
                </label>

                <label>
                  <span>Ticket Price (LKR) *</span>
                  <input
                    type="number"
                    name="ticketPrice"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="Enter ticket price"
                    required
                  />
                </label>
              </>
            ) : null}

            <div className="eventsx-actions">
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Event'}
              </button>
              <Link to="/events" className="button button-ghost">Back to Events</Link>
            </div>
          </form>

          <aside className="surface eventsx-create-side">
            <h3>Submission Preview</h3>
            <p>Review your event summary before submitting.</p>
            <div className="eventsx-detail-grid">
              <div className="eventsx-detail-card">
                <h4>Title</h4>
                <p>{formData.title || 'Untitled Event'}</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Schedule</h4>
                <p>{formData.startDate ? new Date(formData.startDate).toLocaleString() : 'Start time not set'}</p>
                <p>{formData.endDate ? new Date(formData.endDate).toLocaleString() : 'End time not set'}</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Location</h4>
                <p>{formData.location || 'To be decided'}</p>
              </div>
              <div className="eventsx-detail-card">
                <h4>Status on Submit</h4>
                <p>Pending Approval</p>
              </div>
              {formData.eventType === 'indoor' ? (
                <div className="eventsx-detail-card">
                  <h4>Ticket Price</h4>
                  <p>{formData.ticketPrice !== '' ? `LKR ${formData.ticketPrice}` : 'No price set'}</p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}