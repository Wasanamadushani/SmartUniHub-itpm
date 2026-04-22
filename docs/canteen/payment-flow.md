# Canteen Payment Flow

The canteen branch uses a cash-on-delivery style completion path.

Flow summary:

- requester marks the order as delivered
- requester initiates the payment record
- helper confirms cash collection
- the request moves to completed after payment confirmation

This keeps request completion aligned with actual handoff instead of only status updates.
