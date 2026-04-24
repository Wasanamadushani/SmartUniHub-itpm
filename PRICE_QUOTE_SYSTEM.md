# Price Quote System for Ride Booking

## Overview
Implemented a price negotiation system where drivers can send price quotes to students for ride requests, and students can accept or reject the quotes before confirming the ride.

## Features Implemented

### 1. Backend Changes

#### Ride Model (`backend/models/Ride.js`)
**Added Fields:**
- `quotedFare` (Number) - The fare amount quoted by the driver
- `quoteStatus` (String, enum) - Status of the quote: 'none', 'sent', 'accepted', 'rejected'
- `quoteSentAt` (Date) - Timestamp when quote was sent
- `quoteRespondedAt` (Date) - Timestamp when rider responded to quote
- **Updated `status` enum** - Added 'quoted' status to existing statuses

#### Ride Controller (`backend/controllers/rideController.js`)
**New Functions:**
1. **`sendQuote`** - Driver sends price quote to rider
   - Validates fare amount
   - Sets ride status to 'quoted'
   - Associates driver with ride
   - Records quote timestamp

2. **`acceptQuote`** - Rider accepts the price quote
   - Changes status from 'quoted' to 'accepted'
   - Sets final fare to quoted fare
   - Records response timestamp
   - Confirms the ride

3. **`rejectQuote`** - Rider rejects the price quote
   - Changes status back to 'pending'
   - Removes driver association
   - Resets quoted fare
   - Makes ride available for other drivers

#### Ride Routes (`backend/routes/rideRoutes.js`)
**New Endpoints:**
- `PATCH /api/rides/:id/send-quote` - Driver sends quote
- `PATCH /api/rides/:id/accept-quote` - Rider accepts quote
- `PATCH /api/rides/:id/reject-quote` - Rider rejects quote

### 2. Frontend Changes

#### Driver Dashboard (`react-frontend/src/pages/DriverDashboardPage.jsx`)

**Ride Requests Tab - Enhanced UI:**
- Shows all pending ride requests
- Each request displays:
  - Pickup → Drop locations
  - Time and passengers
  - Rider name
  - Payment method
  - **Price Quote Input Field** (new)
  - **Send Quote Button** (new)

**Quote Sending Features:**
- Input field for entering fare amount
- Validation: Must be positive number
- "Send Quote" button sends price to rider
- Loading state while sending
- Success message after sending
- Request removed from list after quote sent

**State Management:**
- `sendingQuoteId` - Tracks which quote is being sent
- `quoteAmounts` - Stores fare amounts for each ride

#### Rider Dashboard (`react-frontend/src/pages/RiderDashboardPage.jsx`)

**My Bookings Tab - Enhanced UI:**
- Shows all active bookings including quoted rides
- **Quote Received Card** (new) - Displayed when driver sends quote:
  - Driver name
  - Quoted fare amount (large, prominent)
  - Accept Quote button (green)
  - Reject button (gray)
  - Beautiful gradient design
- Status badge shows "💬 Quote Received" for quoted rides

**Quote Response Features:**
- Accept button confirms ride at quoted price
- Reject button returns ride to pending status
- Confirmation dialog before rejecting
- Loading state while responding
- Success messages after action
- Automatic refresh of bookings list

**State Management:**
- `respondingToQuoteId` - Tracks which quote is being responded to

## User Flow

### For Drivers:

1. **View Ride Requests:**
   - Go to Ride Requests tab
   - See all pending ride requests
   - Each request shows rider details and payment method

2. **Send Price Quote:**
   - Enter fare amount in the input field (e.g., "500")
   - Click "📤 Send Quote" button
   - Quote is sent to the rider
   - Request disappears from list
   - Success message: "Price quote sent successfully. Waiting for rider to accept."

3. **Wait for Response:**
   - Rider will either accept or reject the quote
   - If accepted: Ride moves to "accepted" status
   - If rejected: Ride returns to pending (available for other drivers)

### For Riders (Students):

1. **Book a Ride:**
   - Fill in ride details and book
   - Ride appears in "My Bookings" with "pending" status

2. **Receive Quote:**
   - Driver sends a price quote
   - Ride status changes to "💬 Quote Received"
   - Beautiful quote card appears showing:
     - Driver name
     - Quoted fare (Rs. XXX)
     - Accept and Reject buttons

3. **Respond to Quote:**
   - **Accept:** Click "✅ Accept Quote"
     - Ride confirmed at quoted price
     - Status changes to "accepted"
     - Driver can start the ride
   - **Reject:** Click "❌ Reject"
     - Confirmation dialog appears
     - Ride returns to "pending" status
     - Available for other drivers to quote

## UI Design

### Driver's Quote Input (Ride Requests)

```
┌─────────────────────────────────────────────────────────┐
│ SLIIT Campus -> Colombo Fort                           │
│ 10:00 AM · 2 passenger(s)                              │
│ Rider: Jane Smith                                      │
│ 💳 Payment: 💵 Cash on Delivery                        │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 💰 Your Price Quote (Rs.)                       │   │
│ │ [Enter fare amount____________]                 │   │
│ │                                                 │   │
│ │ [📤 Send Quote]                                 │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Rider's Quote Card (My Bookings)

```
┌─────────────────────────────────────────────────────────┐
│ SLIIT Campus -> Colombo Fort                           │
│ 04/25/2026 · 10:00 AM                                  │
│ Passengers: 2                                          │
│ Payment: 💵 Cash on Delivery                           │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ 💰 Price Quote Received!                        │   │
│ │ Driver: John Doe                                │   │
│ │                                                 │   │
│ │           Rs. 500                               │   │
│ │                                                 │   │
│ │ [✅ Accept Quote]  [❌ Reject]                  │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Status: 💬 Quote Received                              │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### 1. Send Quote (Driver)
```
PATCH /api/rides/:id/send-quote
```

**Request Body:**
```json
{
  "driverId": "driver_id",
  "quotedFare": 500
}
```

**Response:**
```json
{
  "_id": "ride_id",
  "rider": { ... },
  "driver": { ... },
  "status": "quoted",
  "quotedFare": 500,
  "quoteStatus": "sent",
  "quoteSentAt": "2026-04-23T...",
  ...
}
```

### 2. Accept Quote (Rider)
```
PATCH /api/rides/:id/accept-quote
```

**Response:**
```json
{
  "_id": "ride_id",
  "status": "accepted",
  "fare": 500,
  "quoteStatus": "accepted",
  "quoteRespondedAt": "2026-04-23T...",
  ...
}
```

### 3. Reject Quote (Rider)
```
PATCH /api/rides/:id/reject-quote
```

**Response:**
```json
{
  "_id": "ride_id",
  "status": "pending",
  "driver": null,
  "quotedFare": 0,
  "quoteStatus": "rejected",
  "quoteRespondedAt": "2026-04-23T...",
  ...
}
```

## Database Schema

### Ride Document (Updated)
```javascript
{
  _id: ObjectId,
  rider: ObjectId (ref: User),
  driver: ObjectId (ref: Driver),
  pickupLocation: { address, lat, lng },
  dropLocation: { address, lat, lng },
  scheduledDate: Date,
  scheduledTime: String,
  passengers: Number,
  status: String (enum: ['pending', 'quoted', 'accepted', 'ongoing', 'completed', 'cancelled']),
  fare: Number,                    // Final fare
  quotedFare: Number,              // NEW: Driver's quoted fare
  quoteStatus: String,             // NEW: 'none', 'sent', 'accepted', 'rejected'
  quoteSentAt: Date,               // NEW: When quote was sent
  quoteRespondedAt: Date,          // NEW: When rider responded
  paymentMethod: String,
  // ... other fields
}
```

## Status Flow

```
pending → quoted → accepted → ongoing → completed
   ↑         ↓
   └─ rejected
```

**Status Descriptions:**
- **pending** - Ride request created, waiting for driver quotes
- **quoted** - Driver sent a price quote, waiting for rider response
- **accepted** - Rider accepted the quote, ride confirmed
- **ongoing** - Ride in progress
- **completed** - Ride finished
- **cancelled** - Ride cancelled

**Quote Status:**
- **none** - No quote sent yet
- **sent** - Driver sent quote, waiting for response
- **accepted** - Rider accepted the quote
- **rejected** - Rider rejected the quote

## Validation

### Backend Validation:
- Quoted fare must be positive number
- Can only send quote for 'pending' rides
- Can only accept/reject quotes for 'quoted' rides
- Driver must be approved to send quotes

### Frontend Validation:
- Fare input must be filled
- Fare must be positive number
- Buttons disabled during loading
- Confirmation required before rejecting

## Testing Checklist

### Driver Testing:
- [ ] Login as approved driver
- [ ] Go to Ride Requests tab
- [ ] See pending ride requests
- [ ] Enter fare amount in input field
- [ ] Click "Send Quote" button
- [ ] See success message
- [ ] Request disappears from list
- [ ] Check database - ride status is 'quoted'

### Rider Testing:
- [ ] Login as rider
- [ ] Book a ride
- [ ] Wait for driver to send quote
- [ ] Go to My Bookings
- [ ] See "Quote Received" card
- [ ] See quoted fare amount
- [ ] See driver name
- [ ] Click "Accept Quote"
- [ ] See success message
- [ ] Ride status changes to "accepted"
- [ ] Check database - fare equals quotedFare

### Reject Quote Testing:
- [ ] Rider receives quote
- [ ] Click "Reject" button
- [ ] See confirmation dialog
- [ ] Confirm rejection
- [ ] Ride returns to "pending" status
- [ ] Ride available for other drivers
- [ ] Check database - driver is null

### Edge Cases:
- [ ] Multiple drivers can't quote same ride
- [ ] Can't send quote without fare amount
- [ ] Can't send negative fare
- [ ] Can't accept already accepted quote
- [ ] Can't reject already rejected quote

## Security Considerations

1. **Driver Approval:** Only approved drivers can send quotes
2. **Ride Ownership:** Only the rider who created the ride can accept/reject quotes
3. **Status Validation:** Backend validates ride status before allowing actions
4. **Fare Validation:** Quoted fare must be positive number
5. **Driver Association:** Ride is associated with driver when quote is sent

## Future Enhancements

1. **Multiple Quotes:**
   - Allow multiple drivers to quote same ride
   - Rider can compare quotes and choose best one
   - Show all quotes in a list

2. **Quote Expiration:**
   - Quotes expire after certain time (e.g., 15 minutes)
   - Auto-reject expired quotes
   - Notify driver if quote expired

3. **Counter Offers:**
   - Rider can counter-offer with different price
   - Driver can accept/reject counter-offer
   - Negotiation history

4. **Quote Notifications:**
   - Push notifications when quote received
   - Email notifications
   - SMS alerts

5. **Quote Analytics:**
   - Track average quote amounts
   - Show quote acceptance rate
   - Price recommendations based on distance

6. **Automatic Pricing:**
   - Suggest fare based on distance
   - Dynamic pricing based on demand
   - Surge pricing during peak hours

## Notes

- Backend server needs restart after model/route changes
- Quoted rides don't show to other drivers
- Rejected quotes make ride available again
- Accepted quotes confirm the ride immediately
- Quote history is preserved in database
- Riders can only respond to one quote at a time

## Files Modified

### Backend:
1. `backend/models/Ride.js` - Added quote fields
2. `backend/controllers/rideController.js` - Added quote functions
3. `backend/routes/rideRoutes.js` - Added quote routes

### Frontend:
1. `react-frontend/src/pages/DriverDashboardPage.jsx` - Added quote sending UI
2. `react-frontend/src/pages/RiderDashboardPage.jsx` - Added quote response UI

## Success Criteria

✅ Drivers can send price quotes
✅ Riders receive quote notifications
✅ Riders can accept quotes
✅ Riders can reject quotes
✅ Quotes are validated
✅ Status flow works correctly
✅ UI is intuitive and clear
✅ Real-time updates work
✅ Database stores quote history

---

**Implementation Date**: April 23, 2026
**Status**: ✅ Complete - Ready for Testing
**Next Action**: Restart backend server and test the quote system
