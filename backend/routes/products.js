const express = require('express');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const { auth, adminAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { search, branch } = req.query;
    let query = { isActive: true };

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (branch) {
      query.branch = branch;
    }

    const products = await Product.find(query)
      .populate('branch', 'name location')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('branch', 'name location');

    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new product (Admin only)
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, originalPrice, description, branchId, stock } = req.body;

    // Check if branch exists
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    const product = new Product({
      name,
      originalPrice: parseFloat(originalPrice),
      description,
      branch: branchId,
      stock: parseInt(stock),
      image: req.file ? req.file.filename : ''
    });

    await product.save();
    await product.populate('branch', 'name location');

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product discount (Admin only)
router.put('/:id/discount', adminAuth, async (req, res) => {
  try {
    const { discountPercentage } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.discountPercentage = parseFloat(discountPercentage);
    await product.save();
    await product.populate('branch', 'name location');

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
