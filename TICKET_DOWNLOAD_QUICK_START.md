# Ticket Download Feature - Quick Start Guide

## 🚀 Quick Start for Developers

### Prerequisites
- MongoDB database running
- Backend server running on port 5000
- React frontend running on port 3000
- At least one event created and approved

### Testing the Feature (5 Minutes)

#### Step 1: Create a Test Booking (1 min)
```bash
# Navigate to backend directory
cd SmartUniHub-itpm/backend

# Run the test data seeder (if not already done)
node seedEvents.js
```

#### Step 2: Make a Booking (2 min)
1. Open browser: `http://localhost:3000`
2. Login as a student
3. Navigate to "Book Event"
4. Select an approved indoor event
5. Book 5 seats
6. Fill in payment details (test card: 1234567812345678)
7. Submit booking

#### Step 3: Approve Payment (1 min)
1. Login as admin
2. Go to "Event Bookings" section
3. Find the pending booking
4. Click "Approve"
5. Tickets are automatically generated!

#### Step 4: Download Tickets (1 min)
1. Go back to student account
2. Navigate to payment success page
3. Click "Download 5 Tickets" button
4. 5 HTML files will download
5. Open any ticket in browser to view

---

## 🧪 Testing Checklist

### Backend Tests
```bash
# Test ticket generation
cd SmartUniHub-itpm/backend
node testTicketGeneration.js
```

Expected output:
```
🎫 Ticket Generation Test
==================================================
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Looking for approved bookings...
✅ Found approved booking:
   Booking ID: 69e9ed4d83566a80ae973a07
   Event: Tech Conference 2026
   Seats Booked: 5
   User: John Doe
   Payment Status: approved

✅ Tickets already generated:
   Ticket 1:
     - Ticket Number: TKT-ABC123-1
     - Seat Number: 1
     - QR Code: TKT-ABC123-1
     - Issued At: 2026-04-23T10:30:00.000Z
   ...

✨ Ticket generation is working correctly!
```

### API Tests

#### Test 1: Get Booking Details
```bash
curl http://localhost:5000/api/events/bookings/BOOKING_ID
```

Expected response:
```json
{
  "_id": "69e9ed4d83566a80ae973a07",
  "bookingCount": 5,
  "paymentStatus": "approved",
  "tickets": [
    {
      "ticketNumber": "TKT-ABC123-1",
      "seatNumber": 1,
      "qrCode": "TKT-ABC123-1",
      "issuedAt": "2026-04-23T10:30:00.000Z"
    }
    // ... more tickets
  ]
}
```

#### Test 2: Get Tickets for Download
```bash
curl "http://localhost:5000/api/events/bookings/BOOKING_ID/tickets?userId=USER_ID"
```

Expected response:
```json
{
  "bookingId": "69e9ed4d83566a80ae973a07",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "event": {
    "title": "Tech Conference 2026",
    "location": "Main Hall",
    "startDate": "2026-05-01T10:00:00Z",
    "endDate": "2026-05-01T18:00:00Z"
  },
  "tickets": [
    {
      "ticketNumber": "TKT-ABC123-1",
      "seatNumber": 1,
      "qrCode": "TKT-ABC123-1",
      "issuedAt": "2026-04-23T10:30:00.000Z"
    }
    // ... more tickets
  ],
  "bookingCount": 5,
  "paymentAmount": 5000,
  "verifiedAt": "2026-04-23T10:30:00.000Z"
}
```

### Frontend Tests

#### Test 1: Payment Success Page
1. Navigate to: `http://localhost:3000/event-payment-success?bookingId=BOOKING_ID&amount=5000`
2. Verify:
   - ✅ Booking details display correctly
   - ✅ "Seats Booked" shows correct count
   - ✅ Download button appears when approved
   - ✅ Button text shows correct ticket count

#### Test 2: Ticket Download
1. Click "Download Tickets" button
2. Verify:
   - ✅ Loading state appears
   - ✅ Multiple files download (one per seat)
   - ✅ Files are named correctly
   - ✅ No errors in console

#### Test 3: Ticket Display
1. Open downloaded HTML file in browser
2. Verify:
   - ✅ Ticket displays correctly
   - ✅ All information is accurate
   - ✅ Seat number is correct
   - ✅ QR code is visible
   - ✅ Design looks professional

---

## 🐛 Troubleshooting

### Issue: Tickets not generating
**Solution:**
```javascript
// Check admin routes - ensure this code exists:
if (paymentStatus === 'approved') {
  const tickets = [];
  for (let i = 1; i <= existingBooking.bookingCount; i++) {
    const ticketNumber = `${generateTicketCode()}-${i}`;
    tickets.push({
      ticketNumber,
      seatNumber: i,
      qrCode: ticketNumber,
      issuedAt: new Date(),
    });
  }
  update.tickets = tickets;
}
```

### Issue: Download button not appearing
**Solution:**
```javascript
// Check payment success page conditions:
{isApproved && booking?.tickets && booking.tickets.length > 0 && (
  <TicketDownload 
    bookingId={bookingId} 
    userId={userId} 
    bookingCount={booking.bookingCount}
  />
)}
```

### Issue: API returns 404
**Solution:**
```javascript
// Verify route is registered in server.js:
app.use('/api/events', eventRoutes);

// Verify endpoint exists in eventRoutes.js:
router.get('/bookings/:bookingId/tickets', async (req, res) => {
  // ... implementation
});
```

### Issue: Tickets array is empty
**Solution:**
```bash
# Re-approve the booking to regenerate tickets
# Or run the test script:
node backend/testTicketGeneration.js
```

---

## 📝 Code Snippets

### Generate Tickets Manually (MongoDB Shell)
```javascript
// Connect to MongoDB
use smartunihub

// Find a booking
db.eventbookings.findOne({ paymentStatus: 'approved' })

// Update with tickets
db.eventbookings.updateOne(
  { _id: ObjectId('BOOKING_ID') },
  {
    $set: {
      tickets: [
        {
          ticketNumber: 'TKT-TEST-1',
          seatNumber: 1,
          qrCode: 'TKT-TEST-1',
          issuedAt: new Date()
        },
        {
          ticketNumber: 'TKT-TEST-2',
          seatNumber: 2,
          qrCode: 'TKT-TEST-2',
          issuedAt: new Date()
        }
      ]
    }
  }
)
```

### Test Ticket Download in Browser Console
```javascript
// Open payment success page and run in console:
const bookingId = '69e9ed4d83566a80ae973a07';
const userId = 'USER_ID';

fetch(`http://localhost:5000/api/events/bookings/${bookingId}/tickets?userId=${userId}`)
  .then(res => res.json())
  .then(data => console.log('Tickets:', data))
  .catch(err => console.error('Error:', err));
```

### Verify Tickets in Database
```javascript
// In Node.js or MongoDB shell:
const EventBooking = require('./models/EventBooking');

EventBooking.findById('BOOKING_ID')
  .then(booking => {
    console.log('Booking Count:', booking.bookingCount);
    console.log('Tickets Generated:', booking.tickets.length);
    console.log('Tickets:', booking.tickets);
  });
```

---

## 🔧 Configuration

### Environment Variables
No additional environment variables needed. Uses existing:
```env
MONGO_URI=mongodb://localhost:27017/smartunihub
PORT=5000
```

### Dependencies
No new dependencies required. Uses existing:
- Express.js (backend routing)
- Mongoose (database)
- React (frontend)

---

## 📚 API Documentation

### Endpoint: Get Tickets
```
GET /api/events/bookings/:bookingId/tickets
```

**Query Parameters:**
- `userId` (required): User ID for authorization

**Response:**
```json
{
  "bookingId": "string",
  "userName": "string",
  "userEmail": "string",
  "event": {
    "title": "string",
    "location": "string",
    "startDate": "date",
    "endDate": "date"
  },
  "tickets": [
    {
      "ticketNumber": "string",
      "seatNumber": "number",
      "qrCode": "string",
      "issuedAt": "date"
    }
  ],
  "bookingCount": "number",
  "paymentAmount": "number",
  "verifiedAt": "date"
}
```

**Error Responses:**
- `400`: Invalid booking ID or user ID
- `404`: Booking not found or not approved
- `500`: Server error

---

## 🎨 Customization

### Change Ticket Design
Edit: `react-frontend/src/components/TicketDownload.jsx`

```javascript
// Modify the ticketHTML template
const ticketHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        /* Your custom styles here */
        .ticket-header {
          background: linear-gradient(135deg, #YOUR_COLOR 0%, #YOUR_COLOR 100%);
        }
      </style>
    </head>
    <body>
      <!-- Your custom HTML here -->
    </body>
  </html>
`;
```

### Change Ticket Number Format
Edit: `backend/routes/eventRoutes.js` and `backend/routes/adminRoutes.js`

```javascript
function generateTicketCode() {
  // Customize format here
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `YOUR_PREFIX-${timestamp}-${random}`;
}
```

### Add QR Code Images
Install QR code library:
```bash
npm install qrcode
```

Update ticket generation:
```javascript
const QRCode = require('qrcode');

// Generate QR code image
const qrCodeDataUrl = await QRCode.toDataURL(ticket.ticketNumber);

// Add to ticket
tickets.push({
  ticketNumber,
  seatNumber: i,
  qrCode: ticketNumber,
  qrCodeImage: qrCodeDataUrl,  // Add this
  issuedAt: new Date()
});
```

---

## 📊 Performance Considerations

### Database Queries
- Tickets are embedded in booking document (no additional queries)
- Index on `paymentStatus` for fast filtering
- Populate event details only when needed

### File Downloads
- HTML files are small (~10KB each)
- Downloads are staggered by 500ms
- No server-side file storage needed

### Scalability
- Supports up to 5 seats per booking (configurable)
- Can handle thousands of bookings
- No external dependencies

---

## 🚀 Deployment Checklist

- [ ] Database migration (tickets field added automatically)
- [ ] Backend routes deployed
- [ ] Frontend components deployed
- [ ] Test with real bookings
- [ ] Verify ticket downloads work
- [ ] Check mobile responsiveness
- [ ] Test print functionality
- [ ] Verify QR codes display correctly
- [ ] Test with different browsers
- [ ] Monitor error logs

---

## 📞 Support

### Common Questions

**Q: Do I need to migrate existing bookings?**
A: No, the tickets field is optional. New bookings will have tickets automatically.

**Q: Can I regenerate tickets?**
A: Yes, run the test script or re-approve the booking.

**Q: How do I customize ticket design?**
A: Edit the HTML template in `TicketDownload.jsx`.

**Q: Can I add more fields to tickets?**
A: Yes, update the schema in `EventBooking.js` and the ticket generation logic.

---

## ✅ Success Criteria

Your implementation is working correctly if:

1. ✅ Admin approval generates tickets automatically
2. ✅ Number of tickets matches booking count
3. ✅ Each ticket has unique ticket number
4. ✅ Seat numbers are sequential (1, 2, 3, ...)
5. ✅ Download button appears on payment success page
6. ✅ Clicking download generates multiple HTML files
7. ✅ Each HTML file opens correctly in browser
8. ✅ Tickets display all information correctly
9. ✅ QR codes are visible and unique
10. ✅ Tickets are print-friendly

---

**Happy Coding! 🎉**
