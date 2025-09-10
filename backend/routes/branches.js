const express = require('express');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth, adminAuth, employeeAuth } = require('../middleware/auth');

const router = express.Router();

// Get all branches
router.get('/', auth, async (req, res) => {
  try {
    const branches = await Branch.find()
      .populate('employees', 'name email role')
      .sort({ createdAt: -1 });

    res.json(branches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single branch details
router.get('/:id', auth, async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id)
      .populate('employees', 'name email role walletAmount')
      .populate('productRequests.requestedBy', 'name email');

    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    // Get products for this branch
    const products = await Product.find({ branch: req.params.id, isActive: true });

    res.json({
      ...branch.toObject(),
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new branch (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, location } = req.body;

    // Check if branch already exists
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
      return res.status(400).json({ message: 'Branch with this name already exists' });
    }

    const branch = new Branch({
      name,
      location
    });

    await branch.save();
    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Compare branches (Admin only)
router.get('/compare/:id1/:id2', adminAuth, async (req, res) => {
  try {
    const { id1, id2 } = req.params;

    const branch1 = await Branch.findById(id1)
      .populate('employees', 'name email role');
    const branch2 = await Branch.findById(id2)
      .populate('employees', 'name email role');

    if (!branch1 || !branch2) {
      return res.status(404).json({ message: 'One or both branches not found' });
    }

    // Get products count for each branch
    const products1 = await Product.countDocuments({ branch: id1, isActive: true });
    const products2 = await Product.countDocuments({ branch: id2, isActive: true });

    res.json({
      branch1: {
        ...branch1.toObject(),
        productCount: products1
      },
      branch2: {
        ...branch2.toObject(),
        productCount: products2
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit product request (Employee only)
router.post('/:id/product-request', employeeAuth, async (req, res) => {
  try {
    const { productName, quantity, description } = req.body;

    // Check if user is assigned to this branch
    if (req.user.role === 'employee' && req.user.assignedBranch.toString() !== req.params.id) {
      return res.status(403).json({ message: 'You can only submit requests for your assigned branch' });
    }

    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    branch.productRequests.push({
      productName,
      quantity: parseInt(quantity),
      description,
      requestedBy: req.user._id
    });

    await branch.save();
    await branch.populate('productRequests.requestedBy', 'name email');

    res.status(201).json(branch.productRequests[branch.productRequests.length - 1]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all product requests (Admin only)
router.get('/requests/all', adminAuth, async (req, res) => {
  try {
    const branches = await Branch.find({ 'productRequests.0': { $exists: true } })
      .populate('productRequests.requestedBy', 'name email')
      .select('name productRequests');

    const allRequests = [];
    branches.forEach(branch => {
      branch.productRequests.forEach(request => {
        allRequests.push({
          ...request.toObject(),
          branchName: branch.name,
          branchId: branch._id
        });
      });
    });

    res.json(allRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product request status (Admin only)
router.put('/requests/:branchId/:requestId', adminAuth, async (req, res) => {
  try {
    const { branchId, requestId } = req.params;
    const { status } = req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const request = branch.productRequests.id(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await branch.save();

    res.json({ message: 'Request status updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
