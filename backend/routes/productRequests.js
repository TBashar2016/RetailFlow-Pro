const express = require('express');
const ProductRequest = require('../models/ProductRequest');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { auth, adminAuth, employeeAuth } = require('../middleware/auth');

const router = express.Router();

// Create a new product request (Employee only)
router.post('/', employeeAuth, async (req, res) => {
  try {
    const { productName, quantity, category, description, urgencyLevel } = req.body;

    // Get employee details
    const employee = await User.findById(req.user._id).populate('assignedBranch');
    
    if (!employee.assignedBranch) {
      return res.status(400).json({ message: 'Employee not assigned to any branch' });
    }

    const productRequest = new ProductRequest({
      requestedBy: req.user._id,
      branch: employee.assignedBranch._id,
      productName,
      quantity,
      category,
      description,
      urgencyLevel
    });

    await productRequest.save();
    
    await productRequest.populate([
      { path: 'requestedBy', select: 'name email' },
      { path: 'branch', select: 'name location' }
    ]);

    res.status(201).json(productRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all product requests for employee's branch (Employee only)
router.get('/my-requests', employeeAuth, async (req, res) => {
  try {
    const employee = await User.findById(req.user._id);
    
    if (!employee.assignedBranch) {
      return res.status(400).json({ message: 'Employee not assigned to any branch' });
    }

    const requests = await ProductRequest.find({ 
      requestedBy: req.user._id 
    })
      .populate('branch', 'name location')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all product requests (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { status, branch, urgency } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (branch) filter.branch = branch;
    if (urgency) filter.urgencyLevel = urgency;

    const requests = await ProductRequest.find(filter)
      .populate('requestedBy', 'name email')
      .populate('branch', 'name location')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update request status (Admin only)
router.put('/:requestId/status', adminAuth, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    
    const request = await ProductRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    if (adminResponse) {
      request.adminResponse = adminResponse;
      request.responseDate = new Date();
    }

    await request.save();
    
    await request.populate([
      { path: 'requestedBy', select: 'name email' },
      { path: 'branch', select: 'name location' }
    ]);

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get request statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalRequests = await ProductRequest.countDocuments();
    const pendingRequests = await ProductRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await ProductRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await ProductRequest.countDocuments({ status: 'rejected' });
    const fulfilledRequests = await ProductRequest.countDocuments({ status: 'fulfilled' });

    // Get requests by urgency
    const highUrgency = await ProductRequest.countDocuments({ urgencyLevel: 'high', status: 'pending' });
    const mediumUrgency = await ProductRequest.countDocuments({ urgencyLevel: 'medium', status: 'pending' });
    const lowUrgency = await ProductRequest.countDocuments({ urgencyLevel: 'low', status: 'pending' });

    // Get recent requests
    const recentRequests = await ProductRequest.find()
      .populate('requestedBy', 'name')
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      fulfilledRequests,
      urgencyBreakdown: {
        high: highUrgency,
        medium: mediumUrgency,
        low: lowUrgency
      },
      recentRequests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
