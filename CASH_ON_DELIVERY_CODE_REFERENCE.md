# Code Snippets - Cash on Delivery Implementation

## 📌 Quick Reference for Developers

---

## 🔗 API Functions (canteenApi.js)

```javascript
// Create payment when requester clicks Pay
export const createPayment = (requestId) =>
  api.post("/api/payments/create", { requestId });

// Confirm payment when helper receives cash
export const confirmCashPayment = (paymentId) =>
  api.post("/api/payments/confirm-cash-payment", { 
    paymentId, 
    helperConfirmed: true 
  });

// Get payment details for a request
export const getRequestPayment = (requestId) =>
  api.get(`/api/payments/request/${requestId}`);
```

---

## 📊 State Variables (CanteenRequestPage.jsx)

```javascript
// Track payment modals and status
const [paymentModal, setPaymentModal] = useState({ 
  open: false, 
  request: null, 
  loading: false 
});

// Track payment status per request ID
const [paymentStatuses, setPaymentStatuses] = useState({});

// Show success confirmation to user
const [successModal, setSuccessModal] = useState({ 
  open: false, 
  message: '', 
  type: '' 
});
```

---

## 🎬 Handler Functions

### Requester: Initiate Payment

```javascript
const doInitiatePayment = async (request) => {
  if (!currentUser?._id || !request._id) return;
  setPaymentModal((prev) => ({ ...prev, loading: true }));
  
  try {
    const response = await createPayment(request._id);
    
    if (response.success || response.data) {
      // Track payment status
      setPaymentStatuses((prev) => ({
        ...prev,
        [request._id]: { 
          paymentId: response.payment?._id || response.data?._id, 
          status: 'PENDING' 
        },
      }));
      
      // Show success modal
      setSuccessModal({
        open: true,
        message: `Payment initiated! Helper will receive LKR ${response.payment?.amount || request.totalPrice || 0} in cash on delivery.`,
        type: 'payment-initiated',
      });
      
      setPaymentModal({ open: false, request: null, loading: false });
      await loadRequests();
    }
  } catch (error) {
    console.error('Payment creation failed:', error);
    alert('Failed to initiate payment: ' + (error.response?.data?.message || error.message));
  } finally {
    setPaymentModal((prev) => ({ ...prev, loading: false }));
  }
};
```

### Helper: Confirm Payment Received

```javascript
const doConfirmPaymentReceived = async (requestId) => {
  if (!currentUser?._id) return;
  
  try {
    const paymentData = paymentStatuses[requestId];
    
    if (!paymentData?.paymentId) {
      alert('Payment record not found');
      return;
    }
    
    const response = await confirmCashPayment(paymentData.paymentId);
    
    if (response.success || response.data) {
      // Show success modal
      setSuccessModal({
        open: true,
        message: `Payment confirmed! LKR ${response.payment?.amount || response.data?.amount || 0} received. Request marked completed.`,
        type: 'payment-completed',
      });
      
      // Update request to COMPLETED
      await doUpdateStatus(requestId, 'COMPLETED');
      await loadRequests();
    }
  } catch (error) {
    console.error('Payment confirmation failed:', error);
    alert('Failed to confirm payment: ' + (error.response?.data?.message || error.message));
  }
};
```

---

## 🎨 UI Components

### Requester: Pay Now Button

```jsx
{stepStatus === 'DELIVERED' && helperAccepted && !isCancelled ? (
  <div className="canteenpro-payment-section">
    {!paymentStatuses[request._id] ? (
      <button
        type="button"
        className="button button-primary button-full"
        onClick={() => doInitiatePayment(request)}
      >
        💳 Pay Now (Cash on Delivery)
      </button>
    ) : (
      <div className="canteenpro-payment-status">
        <p className="canteenpro-inline-note success">
          ✓ Payment initiated. Helper will confirm when they receive the cash.
        </p>
      </div>
    )}
  </div>
) : null}
```

### Helper: Confirm Payment Button

```jsx
{status === 'DELIVERED' ? (
  <button
    type="button"
    className="button button-small button-primary"
    onClick={() => doConfirmPaymentReceived(request._id)}
  >
    ✓ Confirm Payment Received
  </button>
) : null}
```

### Success Modal (Both Parties)

```jsx
{successModal.open ? (
  <div className="canteenpro-modal-overlay">
    <div className="canteenpro-modal small">
      <div className="canteenpro-modal-head">
        <div>
          <h3>
            {successModal.type === 'payment-initiated' 
              ? '💳 Payment Initiated' 
              : '✓ Payment Confirmed'}
          </h3>
        </div>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => setSuccessModal({ open: false, message: '', type: '' })}
        >
          Close
        </button>
      </div>
      <div className="canteenpro-modal-body">
        <article className="canteenpro-success-card">
          <p>{successModal.message}</p>
          <button
            type="button"
            className="button button-primary button-full"
            onClick={() => setSuccessModal({ open: false, message: '', type: '' })}
          >
            Done
          </button>
        </article>
      </div>
    </div>
  </div>
) : null}
```

---

## 🎨 CSS Styles

```css
/* Payment section styling */
.canteenpro-payment-section {
  margin-top: 1rem;
  display: grid;
  gap: 0.75rem;
}

/* Payment status indicator */
.canteenpro-payment-status {
  padding: 0.75rem;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.canteenpro-payment-status.success {
  color: #10b981;
  font-weight: 500;
}

.canteenpro-inline-note.success {
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.3);
}

/* Success card in modal */
.canteenpro-success-card {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  text-align: center;
}

.canteenpro-success-card p {
  margin: 0;
  font-size: 1rem;
  color: var(--text);
  line-height: 1.6;
}

.canteenpro-success-card .button {
  margin-top: 0.5rem;
}
```

---

## 🔄 Data Flow

### Request State Throughout Flow

```javascript
// Initial state
{
  _id: "req123",
  foodItem: "Lunch plate",
  quantity: 1,
  itemPrice: 250,
  requester: "user1",
  selectedHelper: "user2",
  selectedServiceCharge: 50,
  status: "OPEN",
  paymentStatus: "PENDING",
  paymentId: null,
  totalPrice: 300
}

// After DELIVERED
{
  ...
  status: "DELIVERED",
  paymentStatus: "PENDING", // Payment about to be created
  paymentId: null
}

// After Pay Now clicked
{
  ...
  status: "DELIVERED",
  paymentStatus: "PENDING", // Payment created
  paymentId: "payment123"  // Link to payment record
}

// After Confirm Payment
{
  ...
  status: "COMPLETED",
  paymentStatus: "COMPLETED", // Payment confirmed
  paymentId: "payment123",
  paidAt: "2026-04-20T10:30:00Z"
}
```

### Payment Record Lifecycle

```javascript
// Created by doInitiatePayment
{
  _id: "payment123",
  transactionId: "TXN-1713607800000-ABC123DEF",
  foodRequest: "req123",
  requester: "user1",
  helper: "user2",
  amount: 300,  // itemPrice + serviceCharge
  status: "PENDING",
  paymentMethod: "CASH",
  itemDetails: {
    itemName: "Lunch plate",
    quantity: 1,
    itemPrice: 250
  },
  serviceCharge: 50,
  paidAt: null,
  createdAt: "2026-04-20T10:30:00Z"
}

// Updated by doConfirmPaymentReceived
{
  ...
  status: "COMPLETED",
  paidAt: "2026-04-20T10:32:00Z",
  updatedAt: "2026-04-20T10:32:00Z"
}
```

---

## 🧪 Testing Code Snippets

### Check Payment Created
```javascript
// In browser console while testing:
const payment = await fetch('/api/payments/request/req123')
  .then(r => r.json());
console.log(payment); 
// Should show: amount: 300, status: "PENDING"
```

### Verify Request Updated
```javascript
// Check that request has payment linked
const request = await fetch('/api/requests/req123')
  .then(r => r.json());
console.log(request.paymentId, request.paymentStatus);
// Should show: paymentId: "payment123", paymentStatus: "PENDING"
```

### Simulate Helper Confirmation
```javascript
// In helper's browser console:
const confirmed = await fetch('/api/payments/confirm-cash-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ paymentId: 'payment123' })
}).then(r => r.json());
console.log(confirmed.payment.status); 
// Should show: "COMPLETED"
```

---

## 📝 Import Statements

```javascript
// In CanteenRequestPage.jsx, add to imports:
import {
  // ... existing imports ...
  createPayment,
  confirmCashPayment,
  getRequestPayment,
} from '../lib/canteenApi';
```

---

## 🔗 Database Queries

### Find All Pending Payments
```javascript
db.payments.find({ status: "PENDING" })
```

### Find Payments for a Helper
```javascript
db.payments.find({ helper: ObjectId("helperUserId") })
```

### Check Payment for a Request
```javascript
db.payments.findOne({ foodRequest: ObjectId("requestId") })
```

### Total Revenue by Helper
```javascript
db.payments.aggregate([
  { $match: { status: "COMPLETED" } },
  { $group: { _id: "$helper", total: { $sum: "$amount" } } }
])
```

---

## 🚀 Integration Points

### With Existing Code
- Uses existing `doUpdateStatus()` function
- Uses existing `loadRequests()` function
- Uses existing button styling
- Uses existing modal overlay
- Compatible with all existing request flows

### API Endpoints Consumed
1. `POST /api/payments/create` - Payment model endpoint
2. `POST /api/payments/confirm-cash-payment` - Payment model endpoint
3. `PUT /api/requests/:id/status` - Update request to COMPLETED

---

## 📚 Related Files

| File | Purpose | Changes |
|------|---------|---------|
| Backend: `paymentController.js` | API handlers | Already implemented ✓ |
| Backend: `paymentRoutes.js` | API routes | Already implemented ✓ |
| Backend: `Payment.js` model | Data schema | Already implemented ✓ |
| Frontend: `canteenApi.js` | API client | Added 3 functions |
| Frontend: `CanteenRequestPage.jsx` | UI/Logic | Added handlers & components |
| Frontend: `styles.css` | Styling | Added payment styles |

---

## ✅ Verification Checklist

- [ ] All imports present
- [ ] State variables initialized
- [ ] Handlers implemented
- [ ] UI components rendering
- [ ] CSS styles applied
- [ ] API calls working
- [ ] Success modals showing
- [ ] Buttons responding
- [ ] Status updating correctly
- [ ] Database records created

---

**Version**: 1.0  
**Last Updated**: April 20, 2026  
**Status**: Ready for Integration ✅
