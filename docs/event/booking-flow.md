# Event Booking Flow

Indoor event booking in this branch follows a staged path:

1. load the booking summary
2. confirm seat availability
3. create the booking with payment details
4. upload the payment receipt
5. wait for admin verification

This keeps seat limits and payment review tied to the booking record.
