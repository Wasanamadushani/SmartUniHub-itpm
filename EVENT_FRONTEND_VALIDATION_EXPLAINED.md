# Event Frontend Validation - Code Explanation

## Overview
This document explains all frontend validation code for the Event Management system, including event creation and event booking.

---

## 1. CREATE EVENT VALIDATION (`CreateEventPage.jsx`)

### A. Required Fields Validation

#### **Title Validation** (Lines 48-53)
```javascript
if (!formData.title || !formData.title.trim()) {
  setError('Event title is required.');
  setIsSubmitting(false);
  return;
}
```
**Explanation:**
- Checks if title exists and is not empty after trimming whitespace
- Prevents submission if title is missing
- Shows error message to user

---

#### **Start Date Validation** (Lines 55-60)
```javascript
if (!formData.startDate) {
  setError('Start date and time are required.');
  setIsSubmitting(false);
  return;
}
```
**Explanation:**
- Ensures start date/time is provided
- Required for scheduling the event

---

#### **End Date Validation** (Lines 62-67)
```javascript
if (!formData.endDate) {
  setError('End date and time are required.');
  setIsSubmitting(false);
  return;
}
```
**Explanation:**
- Ensures end date/time is provided
- Required to know when event finishes

---

### B. Date/Time Logic Validation

#### **Valid Date Check** (Lines 69-75)
```javascript
const now = new Date();
const startDate = new Date(formData.startDate);
const endDate = new Date(formData.endDate);

if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
  setError('Please provide valid start and end date/time.');
  setIsSubmitting(false);
  return;
}
```
**Explanation:**
- Converts string dates to Date objects
- Checks if dates are valid (not NaN)
- Prevents invalid date formats from being submitted

---

#### **Past Date Prevention** (Lines 77-82)
```javascript
if (startDate < now) {
  setError('Start date/time cannot be in the past.');
  setIsSubmitting(false);
  return;
}
```
**Explanation:**
- Compares start date with current time
- Prevents creating events that already started
- Ensures events are scheduled for future

---

#### **End After Start Validation** (Lines 84-89)
```javascript
if (endDate <= startDate) {
  setError('End date/time must be later than start date/time.');
  setIsSubmitting(false);
  return;
}
```
**Explanation:**
- Ensures end date is after start date
- Prevents illogical time ranges
- Event must have positive duration

---

### C. Indoor Event Specific Validation

#### **Total Seats Validation** (Lines 91-103)
```javascript
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
```
**Explanation:**
- Only validates if event type is "indoor"
- Checks if totalSeats field is filled
- Converts to integer and validates it's a positive whole number
- Prevents negative or decimal seat counts

---

#### **Ticket Price Validation** (Lines 105-117)
```javascript
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
```
**Explanation:**
- Only validates if event type is "indoor"
- Checks if ticketPrice field is filled
- Converts to float (allows decimals like 150.50)
- Validates it's a finite number (not Infinity or NaN)
- Ensures price is not negative (can be 0 for free events)

---

### D. Overlapping Events Check (Lines 120-138)

```javascript
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
```
**Explanation:**
- Fetches all existing events from database
- Checks if new event overlaps with any existing event
- Overlap logic: `startDate < eventEnd && endDate > eventStart`
- Shows detailed error with conflicting event details
- If check fails, continues (backend will validate)

---

### E. HTML Input Validation (Lines 217-280)

#### **Title Input**
```javascript
<input
  type="text"
  name="title"
  value={formData.title}
  onChange={handleChange}
  required
  placeholder="Enter event title"
/>
```
**Explanation:**
- `required` attribute: Browser-level validation
- Prevents form submission if empty
- Shows browser's default error message

---

#### **Date/Time Inputs**
```javascript
<input
  type="datetime-local"
  name="startDate"
  value={formData.startDate}
  onChange={handleChange}
  min={minStartDateTime}
  required
/>

<input
  type="datetime-local"
  name="endDate"
  value={formData.endDate}
  onChange={handleChange}
  min={formData.startDate || minStartDateTime}
  required
/>
```
**Explanation:**
- `type="datetime-local"`: Shows date/time picker
- `min` attribute: Prevents selecting past dates
- End date min is set to start date (ensures end > start)
- `required`: Browser-level validation

---

#### **Total Seats Input**
```javascript
<input
  type="number"
  name="totalSeats"
  value={formData.totalSeats}
  onChange={handleChange}
  required
  min="1"
  placeholder="Number of seats"
/>
```
**Explanation:**
- `type="number"`: Only allows numeric input
- `min="1"`: Prevents 0 or negative values
- Browser shows up/down arrows for number selection

---

#### **Ticket Price Input**
```javascript
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
```
**Explanation:**
- `type="number"`: Only allows numeric input
- `min="0"`: Allows 0 (free events) but not negative
- `step="0.01"`: Allows decimal values (e.g., 150.50)
- Supports currency with 2 decimal places

---

## 2. BOOK EVENT VALIDATION (`BookEventPage.jsx`)

### A. User Authentication Check

#### **User Login Validation** (Lines 42-43)
```javascript
const bookingDisabledReason = useMemo(() => {
  if (!userId) return 'Please log in before booking an event.';
```
**Explanation:**
- Checks if user is logged in
- `userId` comes from stored user session
- Prevents anonymous bookings

---

### B. Event Selection Validation

#### **Event Selected Check** (Lines 44)
```javascript
  if (!selectedEventId || !selectedEvent) return 'Choose an event card to continue.';
```
**Explanation:**
- Ensures user has selected an event
- Prevents booking without event selection

---

#### **Bookable Event Check** (Lines 45)
```javascript
  if (!summary.isBookable) return 'This event is not bookable right now.';
```
**Explanation:**
- Checks if event is approved and indoor type
- Backend determines bookability
- Prevents booking outdoor or pending events

---

#### **Already Booked Check** (Lines 46)
```javascript
  if (summary.userHasBooked) return 'You have already booked this event.';
```
**Explanation:**
- Prevents duplicate bookings
- One booking per user per event
- Backend tracks user bookings

---

#### **Seats Available Check** (Lines 47)
```javascript
  if (summary.remainingSeats < 1) return 'No seats remaining for this event.';
```
**Explanation:**
- Checks if event has available seats
- Prevents overbooking
- Real-time seat availability

---

### C. Booking Count Validation

#### **Positive Integer Check** (Lines 155-159)
```javascript
const seats = Number(bookingCount || 1);
if (!Number.isInteger(seats) || seats < 1) {
  setError('Booking count must be a positive whole number.');
  return;
}
```
**Explanation:**
- Converts booking count to number
- Ensures it's a whole number (not decimal)
- Must be at least 1 seat

---

#### **Maximum Seats Check** (Lines 161-165)
```javascript
if (seats > MAX_SEATS_PER_BOOKING) {
  setError(`You can book a maximum of ${MAX_SEATS_PER_BOOKING} seats at once.`);
  return;
}
```
**Explanation:**
- `MAX_SEATS_PER_BOOKING = 5` (constant)
- Prevents booking too many seats at once
- Ensures fair distribution

---

### D. HTML Input Validation

#### **Seats Input** (Lines 345-356)
```javascript
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
```
**Explanation:**
- `type="number"`: Numeric input only
- `min="1"`: At least 1 seat
- `max={MAX_SEATS_PER_BOOKING}`: Maximum 5 seats
- `step="1"`: Whole numbers only
- `disabled`: Prevents input if no event selected
- Shows helpful messages below input

---

#### **Note Input** (Lines 358-366)
```javascript
<textarea
  rows={3}
  value={note}
  onChange={(event) => setNote(event.target.value)}
  placeholder="Any booking note for organizers"
  maxLength={300}
/>
```
**Explanation:**
- `maxLength={300}`: Limits note to 300 characters
- Optional field (no required attribute)
- Prevents excessively long notes

---

## 3. PAYMENT VALIDATION (`BookEventPaymentPage.jsx`)

### A. Card Holder Name Validation
```javascript
const cardHolderValid = /^[A-Za-z ]{3,80}$/.test(cardHolderName);
```
**Explanation:**
- Regex pattern: Only letters and spaces
- Minimum 3 characters
- Maximum 80 characters
- Prevents numbers or special characters

---

### B. Card Number Validation
```javascript
const cardNumber = String(paymentPayload.cardNumber || '').replace(/\s+/g, '');
const cardNumberValid = /^\d{16}$/.test(cardNumber);
```
**Explanation:**
- Removes all spaces from input
- Checks for exactly 16 digits
- No letters or special characters allowed

---

### C. Expiry Date Validation
```javascript
const expiryValid = /^(0[1-9]|1[0-2])\/(\d{2})$/.test(expiry);
```
**Explanation:**
- Format: MM/YY
- Month: 01-12 only
- Year: 2 digits
- Example: 12/26

---

#### **Expiry Date Range Check**
```javascript
const [expiryMonth, expiryYearShort] = expiry.split('/').map(Number);
if (expiryYearShort < MIN_EXPIRY_YEAR_SHORT || expiryYearShort > MAX_EXPIRY_YEAR_SHORT) {
  return res.status(400).json({
    message: `Expiry year must be between ${MIN_EXPIRY_YEAR_SHORT} and ${MAX_EXPIRY_YEAR_SHORT}`,
  });
}
```
**Explanation:**
- MIN_EXPIRY_YEAR_SHORT = 26 (year 2026)
- MAX_EXPIRY_YEAR_SHORT = 31 (year 2031)
- Prevents very old or very future dates

---

#### **Expiry Date Past Check**
```javascript
const expiryYear = 2000 + expiryYearShort;
const expiryDate = new Date(expiryYear, expiryMonth, 0, 23, 59, 59, 999);
if (expiryDate < new Date()) {
  return res.status(400).json({ message: 'Card expiry date is in the past' });
}
```
**Explanation:**
- Converts YY to full year (26 → 2026)
- Creates date object for last day of expiry month
- Compares with current date
- Rejects expired cards

---

### D. CVV Validation
```javascript
const cvvValid = /^\d{3}$/.test(cvv);
```
**Explanation:**
- Exactly 3 digits required
- No letters or special characters
- Standard CVV format

---

## Summary of Validation Types

### 1. **Required Field Validation**
- Checks if fields are filled
- Prevents empty submissions

### 2. **Data Type Validation**
- Ensures numbers are numbers
- Ensures dates are valid dates

### 3. **Range Validation**
- Min/max values for numbers
- Date ranges (past/future)

### 4. **Format Validation**
- Regex patterns for card details
- Date format (MM/YY)

### 5. **Business Logic Validation**
- Overlapping events check
- Seat availability check
- Duplicate booking prevention

### 6. **HTML5 Validation**
- `required` attribute
- `min`/`max` attributes
- `type` attribute (number, date, etc.)

---

## Validation Flow Diagram

```
User Input
    ↓
HTML5 Validation (Browser)
    ↓
JavaScript Validation (Frontend)
    ↓
API Request
    ↓
Backend Validation (Server)
    ↓
Database
```

**Multi-layer approach ensures data integrity!**
