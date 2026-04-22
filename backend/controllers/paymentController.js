const Payment = require("../models/Payment");
const User = require("../models/User");
const FoodRequest = require("../models/FoodRequest");

// Helper function to generate transaction ID
const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// POST /api/payments/create
// Create a payment record when food request is ready for delivery
exports.createPayment = async (req, res) => {
  try {
    const { requestId, requesterId } = req.body;

    if (!requestId) {
      return res.status(400).json({ message: "requestId is required" });
    }

    const foodRequest = await FoodRequest.findById(requestId)
      .populate("requester", "name phoneNumber")
      .populate("selectedHelper", "name phoneNumber itNumber");

    if (!foodRequest) {
      return res.status(404).json({ message: "Food request not found" });
    }

    if (requesterId && String(foodRequest.requester?._id || foodRequest.requester) !== String(requesterId)) {
      return res.status(403).json({ message: "Only the requester can initiate payment" });
    }

    if (foodRequest.status !== "DELIVERED") {
      return res.status(400).json({ message: "Payment can only be initiated after request is DELIVERED" });
    }

    if (!foodRequest.helperAccepted) {
      return res.status(400).json({ message: "Helper must confirm request before payment initiation" });
    }

    if (foodRequest.paymentId) {
      const existingPayment = await Payment.findById(foodRequest.paymentId);
      if (existingPayment) {
        return res.json({
          success: true,
          message: "Payment already created for this request",
          payment: {
            _id: existingPayment._id,
            transactionId: existingPayment.transactionId,
            totalPrice: existingPayment.amount,
            itemPrice: existingPayment.itemDetails?.itemPrice || 0,
            serviceCharge: existingPayment.serviceCharge || 0,
            status: existingPayment.status,
          },
        });
      }
    }

    if (!foodRequest.selectedHelper) {
      return res.status(400).json({ message: "Helper not assigned yet" });
    }

    // Calculate total: item price + service charge
    const itemPrice = foodRequest.itemPrice || 0;
    const serviceCharge = foodRequest.selectedServiceCharge || 0;
    const totalPrice = itemPrice + serviceCharge;

    // Create payment record
    const payment = await Payment.create({
      transactionId: generateTransactionId(),
      foodRequest: requestId,
      requester: foodRequest.requester._id,
      helper: foodRequest.selectedHelper._id,
      amount: totalPrice,
      status: "PENDING",
      paymentMethod: "CASH",
      itemDetails: {
        itemName: foodRequest.foodItem,
        quantity: foodRequest.quantity,
        itemPrice: itemPrice,
      },
      serviceCharge: serviceCharge,
      description: `Cash payment for: ${foodRequest.foodItem} (Qty: ${foodRequest.quantity})`,
    });

    // Update food request with payment info
    foodRequest.paymentId = payment._id;
    foodRequest.totalPrice = totalPrice;
    foodRequest.paymentStatus = "PENDING";
    await foodRequest.save();

    res.status(201).json({
      success: true,
      message: "Payment record created",
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        totalPrice: totalPrice,
        itemPrice: itemPrice,
        serviceCharge: serviceCharge,
        status: payment.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/confirm-cash-payment
// Confirm cash payment at delivery (mark as paid)
exports.confirmCashPayment = async (req, res) => {
  try {
    const { paymentId, helperId, helperConfirmed = false } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }

    if (!helperId) {
      return res.status(400).json({ message: "helperId is required" });
    }

    const payment = await Payment.findById(paymentId)
      .populate("requester", "name phoneNumber")
      .populate("helper", "name phoneNumber");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (String(payment.helper?._id || payment.helper) !== String(helperId)) {
      return res.status(403).json({ message: "Only the selected helper can confirm this payment" });
    }

    if (payment.status === "COMPLETED") {
      const existingRequest = await FoodRequest.findById(payment.foodRequest);
      if (existingRequest && existingRequest.status === "DELIVERED") {
        existingRequest.status = "COMPLETED";
        existingRequest.completedMarkedByHelperAt = existingRequest.completedMarkedByHelperAt || new Date();
        await existingRequest.save();
      }

      return res.json({
        success: true,
        message: "Payment already completed",
        payment: {
          _id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      });
    }

    // Mark payment as completed
    payment.status = "COMPLETED";
    payment.paidAt = new Date();
    await payment.save();

    // Update food request payment status
    const foodRequest = await FoodRequest.findById(payment.foodRequest);
    if (foodRequest) {
      foodRequest.paymentStatus = "COMPLETED";
      foodRequest.paidAt = new Date();
      if (foodRequest.status === "DELIVERED") {
        foodRequest.status = "COMPLETED";
        foodRequest.completedMarkedByHelperAt = foodRequest.completedMarkedByHelperAt || new Date();
      }
      await foodRequest.save();
    }

    res.json({
      success: true,
      message: "Cash payment confirmed",
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/request/:requestId
// Get payment details for a specific request
exports.getRequestPayment = async (req, res) => {
  try {
    const { requestId } = req.params;

    const payment = await Payment.findOne({ foodRequest: requestId })
      .populate("requester", "name email phoneNumber")
      .populate("helper", "name email phoneNumber itNumber");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this request" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/:paymentId
// Get payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("requester", "name email phoneNumber")
      .populate("helper", "name email phoneNumber itNumber")
      .populate("foodRequest");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/user/helper/:userId
// Get all pending cash payments for a helper
exports.getHelperPendingPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = "PENDING", limit = 20, skip = 0 } = req.query;

    const payments = await Payment.find({
      helper: userId,
      status: status,
    })
      .populate("requester", "name phoneNumber")
      .populate("foodRequest", "foodItem quantity")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Payment.countDocuments({
      helper: userId,
      status: status,
    });

    res.json({
      payments,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/payments/user/requester/:userId
// Get all payments for a requester
exports.getRequesterPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, skip = 0 } = req.query;

    const filter = { requester: userId };
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate("helper", "name phoneNumber itNumber")
      .populate("foodRequest", "foodItem quantity")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/payments/cancel
// Cancel a pending payment
exports.cancelPayment = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "PENDING") {
      return res.status(400).json({
        message: `Cannot cancel payment with status: ${payment.status}`,
      });
    }

    payment.status = "CANCELLED";
    payment.notes = reason || "Cancelled by user";
    await payment.save();

    // Update food request
    const foodRequest = await FoodRequest.findById(payment.foodRequest);
    if (foodRequest) {
      foodRequest.paymentStatus = "CANCELLED";
      await foodRequest.save();
    }

    res.json({
      success: true,
      message: "Payment cancelled",
      payment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

