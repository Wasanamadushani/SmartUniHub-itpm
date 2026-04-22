# Canteen Request Lifecycle

The request flow in this branch is organized around a few simple states:

1. `OPEN`
2. `ASSIGNED`
3. `PICKED`
4. `DELIVERED`
5. `COMPLETED`

Important expectations:

- the requester creates the food request
- helpers can submit offers
- the requester selects a helper
- the helper confirms and shares tracking updates
- payment happens only after delivery
