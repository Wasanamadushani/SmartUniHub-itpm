# Event Booking "Proceed to Payment" Button Fix

## Issue Summary
The "Proceed to Payment" button in the event booking page was showing as disabled with the message "This event is not bookable right now."

## Root Cause
The button is **working correctly** - it's disabled because events need to meet specific criteria to be bookable:

### Requirements for Bookable Events:
1. **Status**: Must be `approved` (not `pending`, `rejected`, `cancelled`, or `completed`)
2. **Event Type**: Must be `indoor` (outdoor events don't require booking)
3. **Total Seats**: Must have `totalSeats > 0`
4. **Ticket Price**: Must have a valid `ticketPrice` (for indoor events)

## Solution

### Option 1: Fix Existing Events (Recommended)
Run the migration script to update existing events:

```bash
cd backend
node fixExistingEvents.js
```

This script will:
- Find all approved events missing booking fields
- Set default values:
  - `eventType: 'indoor'`
  - `totalSeats: 100`
  - `ticketPrice: 500`
- Show which events were fixed
- List any pending events that need admin approval

### Option 2: Reseed Events
Delete existing events and create new bookable ones:

```bash
cd backend
node seedEvents.js
```

This will create:
- **2 Bookable Indoor Events** (approved, with seats and prices)
  - SLIIT Got Talent 2024 (100 seats, Rs. 500)
  - Tech Conference 2024 (150 seats, Rs. 750)
- **1 Outdoor Event** (not bookable - free entry)
  - Sports Day 2024
- **1 Pending Event** (needs admin approval)
  - Music Festival 2024 (200 seats, Rs. 1000)

### Option 3: Manual Fix via Admin Dashboard
1. Go to Admin Dashboard → Events Management
2. For each event you want to make bookable:
   - Edit the event
   - Set **Event Type** to `indoor`
   - Set **Total Seats** (e.g., 100)
   - Set **Ticket Price** (e.g., 500)
   - Set **Status** to `approved`
3. Save changes

### Option 4: Manual Fix via MongoDB
Connect to your MongoDB and run:

```javascript
// Fix a specific event
db.events.updateOne(
  { _id: ObjectId("your_event_id_here") },
  { 
    $set: { 
      eventType: "indoor",
      totalSeats: 100,
      ticketPrice: 500,
      status: "approved"
    }
  }
)

// Or fix all approved events at once
db.events.updateMany(
  { status: "approved" },
  { 
    $set: { 
      eventType: "indoor",
      totalSeats: 100,
      ticketPrice: 500
    }
  }
)
```

## Verification Steps

After applying the fix:

1. **Check Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Check Frontend**:
   - Navigate to `/book-event` page
   - You should see bookable events listed
   - Select an event
   - The "Proceed to Payment" button should now be **enabled**
   - Stats should show: Total Seats, Booked Seats, Remaining Seats

3. **Test Booking Flow**:
   - Click "Proceed to Payment"
   - Should navigate to payment page
   - Fill in payment details
   - Complete booking
   - Check "My Event Tickets" section

## Event Booking Logic Reference

### Backend Logic (`backend/routes/eventRoutes.js`)
```javascript
const isBookable = event.status === 'approved' 
                && event.eventType === 'indoor' 
                && totalSeats > 0;
```

### Frontend Logic (`react-frontend/src/pages/BookEventPage.jsx`)
```javascript
const bookingDisabledReason = useMemo(() => {
  if (!userId) return 'Please log in before booking an event.';
  if (!selectedEventId || !selectedEvent) return 'Choose an event card to continue.';
  if (!summary.isBookable) return 'This event is not bookable right now.';
  if (summary.userHasBooked) return 'You have already booked this event.';
  if (summary.remainingSeats < 1) return 'No seats remaining for this event.';
  return '';
}, [userId, selectedEventId, selectedEvent, summary.isBookable, summary.userHasBooked, summary.remainingSeats]);
```

## Files Modified

1. **backend/seedEvents.js**
   - Updated to create properly configured bookable events
   - Added indoor events with seats and prices
   - Added variety of event types for testing

2. **backend/fixExistingEvents.js** (NEW)
   - Migration script to fix existing events
   - Sets default values for missing fields
   - Reports on pending events

## Event Types Explained

### Indoor Events (Bookable)
- Require seat booking
- Have limited capacity (`totalSeats`)
- Require payment (`ticketPrice`)
- Examples: Concerts, Talent Shows, Conferences

### Outdoor Events (Not Bookable)
- Free entry, no booking required
- No seat limits
- No payment required
- Examples: Sports Day, Outdoor Festivals, Open Air Events

## Common Issues & Solutions

### Issue: "This event is not bookable right now"
**Solution**: Event needs to be approved, indoor type, with seats and price

### Issue: "You have already booked this event"
**Solution**: Users can only book each event once. Use a different user account to test.

### Issue: "No seats remaining for this event"
**Solution**: Event is fully booked. Increase `totalSeats` or create a new event.

### Issue: No events showing on booking page
**Solution**: No approved indoor events exist. Run seed script or create events via admin.

## Testing Checklist

- [ ] Backend server running without errors
- [ ] Frontend showing bookable events
- [ ] Event cards display correctly
- [ ] "Proceed to Payment" button is enabled
- [ ] Can navigate to payment page
- [ ] Payment form accepts card details
- [ ] Booking creates successfully
- [ ] Tickets appear in "My Event Tickets"
- [ ] Admin can approve payment
- [ ] Tickets become downloadable after approval

## Support

If issues persist:
1. Check browser console for errors
2. Check backend terminal for API errors
3. Verify MongoDB connection
4. Ensure all required fields are set on events
5. Restart both backend and frontend servers
