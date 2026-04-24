# Admin Guide: How to Approve Drivers

## Quick Start

### Step 1: Access Admin Dashboard
1. Login with your admin account
2. You'll see the Admin Dashboard with multiple tabs

### Step 2: Navigate to Transport Control
1. Click on the **"Transport Control"** tab (🚗 icon)
2. Scroll down to find the **"Driver Management"** section

### Step 3: Review Driver Information

Each driver card shows:
- **Driver Name** (e.g., "John Doe")
- **Email** (e.g., "john@example.com")
- **Phone** (e.g., "+94 77 123 4567")
- **Vehicle Info** (e.g., "Toyota Corolla • ABC-1234")
- **Rating** (e.g., "⭐ 4.5")
- **Status Badge**:
  - 🟠 **"⏳ Pending"** - Needs approval
  - 🟢 **"✅ Approved"** - Already approved

### Step 4: Approve a Pending Driver

For drivers with **"⏳ Pending"** status:

1. Review the driver's information
2. Click the **"Approve"** button
3. ✅ Success notification appears: "Driver [name] approved successfully"
4. Badge changes to **"✅ Approved"**
5. Button changes to **"Suspend"**
6. Driver can now accept ride requests immediately

### Step 5: Suspend an Approved Driver (if needed)

For drivers with **"✅ Approved"** status:

1. Click the **"Suspend"** button
2. ⚠️ Confirmation dialog appears: "Are you sure you want to suspend this driver?"
3. Click **"OK"** to confirm
4. ℹ️ Notification appears: "Driver [name] suspended"
5. Badge changes back to **"⏳ Pending"**
6. Button changes back to **"Approve"**
7. Driver loses access to ride requests

## What Happens After Approval?

### For the Driver:
- ✅ Can see pending ride requests
- ✅ Can accept ride requests
- ✅ Can start earning money
- ✅ "Pending Approval" message disappears

### For the System:
- ✅ Driver appears in "Active Drivers" list
- ✅ Driver can be assigned to rides
- ✅ Driver's availability status becomes active
- ✅ Ride requests become visible to the driver

## What Happens After Suspension?

### For the Driver:
- ❌ Cannot see ride requests
- ❌ Cannot accept new rides
- ⚠️ Sees "Pending Approval" message again
- ℹ️ Existing active rides can be completed

### For the System:
- ❌ Driver removed from active pool
- ❌ No new ride assignments
- ℹ️ Driver data preserved
- ℹ️ Can be re-approved anytime

## Driver Management Section Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🚗 Driver Management                                        │
│ Approve, suspend, or manage drivers                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ John Doe                              ⏳ Pending     │   │
│ │ 📧 john@example.com • 📞 +94 77 123 4567            │   │
│ │ 🚗 Toyota Corolla • ABC-1234 • ⭐ 4.5               │   │
│ │                                    [Approve Button]  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Jane Smith                            ✅ Approved    │   │
│ │ 📧 jane@example.com • 📞 +94 77 987 6543            │   │
│ │ 🚗 Honda Civic • XYZ-5678 • ⭐ 4.8                  │   │
│ │                                    [Suspend Button]  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Notifications You'll See

### Success Notifications (Green):
- ✅ "Driver [name] approved successfully"
- ✅ "Driver account reactivated"

### Info Notifications (Blue):
- ℹ️ "Driver [name] suspended"
- ℹ️ "Status updated successfully"

### Warning Notifications (Orange):
- ⚠️ "Pending driver approval required"

### Error Notifications (Red):
- ❌ "Error approving driver: [reason]"
- ❌ "Error suspending driver: [reason]"

## Best Practices

### Before Approving:
1. ✅ Verify driver's name and contact information
2. ✅ Check vehicle details are complete
3. ✅ Ensure license number is provided
4. ✅ Review any previous ratings (if applicable)

### When to Suspend:
- ⚠️ Multiple customer complaints
- ⚠️ Safety violations
- ⚠️ Fraudulent activity
- ⚠️ Expired documents
- ⚠️ Vehicle issues

### When to Re-approve:
- ✅ Issues resolved
- ✅ Documents updated
- ✅ Driver completed training
- ✅ Suspension period ended

## Frequently Asked Questions

### Q: How many drivers can I approve at once?
**A:** You need to approve each driver individually by clicking their "Approve" button.

### Q: Can I undo an approval?
**A:** Yes, click the "Suspend" button to revoke approval. You'll need to confirm the action.

### Q: What happens to active rides when I suspend a driver?
**A:** The driver can complete their current active ride, but cannot accept new requests.

### Q: Can a suspended driver re-register?
**A:** No need to re-register. Just click "Approve" again to reactivate their account.

### Q: How do I know if a driver is currently active?
**A:** Check the "Active Rides Monitor" section in the Transport Control tab.

### Q: Can drivers see why they were suspended?
**A:** Currently, drivers only see "Pending Approval" message. Consider contacting them directly.

## Keyboard Shortcuts

- **Tab** - Navigate between buttons
- **Enter** - Click focused button
- **Esc** - Close confirmation dialog

## Mobile Access

The driver management interface is fully responsive:
- ✅ Works on tablets
- ✅ Works on mobile phones
- ✅ Touch-friendly buttons
- ✅ Scrollable driver list

## Troubleshooting

### Issue: Approve button doesn't respond
**Solution**: Refresh the page and try again. Check your internet connection.

### Issue: Driver list is empty
**Solution**: No drivers have registered yet. Wait for driver registrations.

### Issue: Changes don't save
**Solution**: Ensure backend server is running. Check browser console for errors.

### Issue: Notification doesn't appear
**Solution**: The action may have failed. Check the driver's status manually.

## Need Help?

If you encounter any issues:
1. Refresh the page
2. Check your internet connection
3. Verify backend server is running
4. Contact technical support

---

**Remember**: Approving drivers is an important responsibility. Only approve drivers who meet your platform's standards and requirements.
