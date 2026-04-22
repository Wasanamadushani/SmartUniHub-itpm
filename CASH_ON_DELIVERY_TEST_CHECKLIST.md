# Cash on Delivery - Quick Testing Checklist

## 🎯 User Story: Student Pays Helper via Cash on Delivery

### Scenario: Student requests food from canteen helper

---

## ✅ Step-by-Step Test Flow

### Phase 1: Request & Assignment (5 min)
- [ ] Student creates food request (e.g., "Lunch plate - 1x, LKR 250")
- [ ] Helper submits offer with service charge (e.g., LKR 50)
- [ ] Student selects and confirms helper
- [ ] Helper accepts confirmation
- [ ] **Verify Status: ASSIGNED** ✓

### Phase 2: Delivery (3 min)
- [ ] Helper marks "Mark Picked"
- [ ] **Verify Status: PICKED** ✓
- [ ] Helper updates location (optional)
- [ ] Student marks "Mark Delivered (I Received Order)"
- [ ] **Verify Status: DELIVERED** ✓

### Phase 3: Payment Initiation - REQUESTER (2 min)
- [ ] Look for new button: "💳 Pay Now (Cash on Delivery)"
- [ ] **Verify button appears** ✓
- [ ] Click the button
- [ ] **Verify success modal shows**: "Payment initiated. Helper will confirm when they receive the cash." ✓
- [ ] **Verify total amount shown**: LKR 300 (250 item + 50 service) ✓
- [ ] **Verify button now disabled** ✓
- [ ] **Verify status: "Payment initiated..."** ✓

### Phase 4: Payment Confirmation - HELPER (2 min)
- [ ] Switch to helper user account
- [ ] Look for request in "Helper Requests" section with DELIVERED status
- [ ] **Verify button changed to**: "✓ Confirm Payment Received" ✓
- [ ] Click the button
- [ ] **Verify success modal shows**: "Payment confirmed! LKR 300 received. Request marked completed." ✓
- [ ] Close modal
- [ ] **Verify Status: COMPLETED** ✓

### Phase 5: Verification (2 min)
- [ ] Switch back to requester view
- [ ] **Verify request now shows: COMPLETED** ✓
- [ ] Switch back to helper view
- [ ] **Verify request gone from active list** ✓
- [ ] Check both user dashboards show completed transaction

---

## ❌ What Should NOT Happen

- ❌ Payment button appears before DELIVERED status
- ❌ Requester can pay multiple times for same request
- ❌ Helper button shows "Mark Completed (Cash Received)" (old version)
- ❌ Payment confirmed without both parties confirmed
- ❌ Request moves to COMPLETED without payment confirmed
- ❌ Wrong amount displayed
- ❌ Payment status not synchronized between users

---

## 🔍 Database Verification

### Check Payment Record Created
```javascript
// In MongoDB, check:
db.payments.findOne({ foodRequest: ObjectId("...") })

// Should show:
{
  transactionId: "TXN-...",
  foodRequest: ObjectId("..."),
  requester: ObjectId("..."),
  helper: ObjectId("..."),
  amount: 300,
  status: "COMPLETED",
  paidAt: Date,
  itemDetails: {
    itemName: "Lunch plate",
    quantity: 1,
    itemPrice: 250
  },
  serviceCharge: 50
}
```

### Check FoodRequest Updated
```javascript
db.foodrequests.findOne({ _id: ObjectId("...") })

// Should show:
{
  status: "COMPLETED",
  paymentId: ObjectId("..."),
  paymentStatus: "COMPLETED",
  paidAt: Date,
  totalPrice: 300
}
```

---

## 📱 UI Elements to Verify

### Requester Section
- [ ] "💳 Pay Now (Cash on Delivery)" button present
- [ ] Button styled with primary color
- [ ] Payment section only shows at DELIVERED
- [ ] Amount clearly displayed
- [ ] Button disabled after click
- [ ] Status message: "Payment initiated..."

### Helper Section
- [ ] "✓ Confirm Payment Received" button present
- [ ] Button styled with primary color
- [ ] Only shows at DELIVERED status
- [ ] Replaces old "Mark Completed" button
- [ ] Clear action message

### Success Modals
- [ ] Modal appears with header
- [ ] Correct message for payment initiated/confirmed
- [ ] Amount shown in message (Requester) or confirmation (Helper)
- [ ] Done button to close modal

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Button not appearing | Check status is DELIVERED, refresh page |
| Wrong amount | Verify item price + service charge calculation |
| Modal not showing | Check browser console for errors, verify API |
| Payment appears stuck | Refresh, check both user views |
| Status not updating | Try full page reload, check network requests |

---

## 📊 Test Matrix

| Scenario | Steps | Expected | Status |
|----------|-------|----------|--------|
| Normal flow | 1. Create → 2. Assign → 3. Deliver → 4. Pay → 5. Confirm | COMPLETED | ✓ |
| Requester views payment | Pay → Check status | "Payment initiated..." | ✓ |
| Helper confirms payment | Confirm → Check status | "COMPLETED" | ✓ |
| Multiple requests | Run 2+ in parallel | Each isolated | ✓ |
| Amount calculation | Item 250 + Charge 50 | Total 300 | ✓ |

---

## 🎬 Demo Script (2 minutes)

1. **Requester**: "I'll create a lunch request"
   - Create request: Lunch plate, LKR 250
   
2. **Helper**: "I can deliver that for LKR 50"
   - Submit offer: Service charge LKR 50
   
3. **Requester**: "Great, I'll pick you"
   - Select and confirm helper
   
4. **Helper**: "Order ready!"
   - Mark PICKED, deliver, update location
   
5. **Requester**: "Received! Now I'll pay"
   - Mark DELIVERED
   - Click "💳 Pay Now"
   - See success: "Payment initiated"
   
6. **Helper**: "Confirmed, I have the cash"
   - Click "✓ Confirm Payment Received"
   - See success: "Payment confirmed! LKR 300 received"
   
7. **Both**: Check dashboard - Request shows COMPLETED ✓

---

## 📋 Sign-off Checklist

- [ ] All buttons appear at correct times
- [ ] All modals show correct messages
- [ ] All amounts calculated correctly
- [ ] Status transitions work smoothly
- [ ] Both user views synchronized
- [ ] Database records created correctly
- [ ] No errors in browser console
- [ ] Ready for production

---

**Test Completed By:** _______________  
**Date:** _______________  
**Notes:** _____________________________________________
