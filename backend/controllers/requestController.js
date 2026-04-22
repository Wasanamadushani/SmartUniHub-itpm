const Request = require('../models/Request');
const User = require('../models/User');
const FoodItem = require('../models/FoodItem');

// Create a new food request
exports.createRequest = async (req, res) => {
  try {
    const { requesterId, foodId, quantity, message, canteen, serviceCharge } = req.body;

    if (!requesterId || !foodId || !quantity) {
      return res.status(400).json({ message: 'requesterId, foodId, and quantity are required' });
    }

    // Check if food item exists and is in stock
    const foodItem = await FoodItem.findById(foodId);
    if (!foodItem) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    if (!foodItem.inStock || foodItem.quantity < quantity) {
      return res.status(400).json({ message: 'Food item is out of stock or insufficient quantity' });
    }

    const request = await Request.create({
      foodId,
      requesterId,
      quantity,
      message: message || '',
      canteen: canteen || '',
      serviceCharge: serviceCharge || 0,
      status: 'pending'
    });

    // Populate the response
    const populatedRequest = await Request.findById(request._id)
      .populate('foodId', 'name price image')
      .populate('requesterId', 'name email');

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get all requests for a user
exports.getUserRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const requests = await Request.find({ requesterId: userId })
      .populate('foodId', 'name price image')
      .populate('helperId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all pending requests (for helpers to see)
exports.getPendingRequests = async (req, res) => {
  try {
    const { canteen } = req.query;
    const filter = { status: 'pending' };

    if (canteen) {
      filter.canteen = canteen;
    }

    const requests = await Request.find(filter)
      .populate('foodId', 'name price image canteen')
      .populate('requesterId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, helperId } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Validate status transition
    const validStatuses = ['pending', 'assigned', 'in_progress', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // If assigning a helper, update helperId
    if (status === 'assigned' && helperId) {
      request.helperId = helperId;
    }

    request.status = status;
    await request.save();

    const updatedRequest = await Request.findById(id)
      .populate('foodId', 'name price image')
      .populate('requesterId', 'name email')
      .populate('helperId', 'name email');

    res.json(updatedRequest);
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get request by ID
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await Request.findById(id)
      .populate('foodId', 'name price image canteen')
      .populate('requesterId', 'name email')
      .populate('helperId', 'name email');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete request
exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Only allow requester to delete their own requests
    if (String(request.requesterId) !== String(userId)) {
      return res.status(403).json({ message: 'Not authorized to delete this request' });
    }

    // Only allow deletion of pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete requests that are already assigned or in progress' });
    }

    await Request.findByIdAndDelete(id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ message: error.message });
  }
};