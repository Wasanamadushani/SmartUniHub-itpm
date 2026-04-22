const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

// Create payment record for a food request
router.post("/create", paymentController.createPayment);

// Confirm cash payment at delivery
router.post("/confirm-cash-payment", paymentController.confirmCashPayment);

// Get payment for a specific request
router.get("/request/:requestId", paymentController.getRequestPayment);

// Get payment details
router.get("/:paymentId", paymentController.getPaymentDetails);

// Get all pending payments for a helper
router.get("/user/helper/:userId", paymentController.getHelperPendingPayments);

// Get all payments for a requester
router.get("/user/requester/:userId", paymentController.getRequesterPayments);

// Cancel a pending payment
router.post("/cancel", paymentController.cancelPayment);

module.exports = router;
