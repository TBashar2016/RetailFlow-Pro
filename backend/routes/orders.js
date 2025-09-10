const express = require('express');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create order from cart
router.post('/create', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'branch');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Prepare order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      branch: item.product.branch
    }));

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount: cart.totalAmount,
      paymentMethod: 'cash_on_delivery'
    });

    await order.save();

    // Update branch sales
    const branchSales = {};
    orderItems.forEach(item => {
      const branchId = item.branch.toString();
      if (!branchSales[branchId]) {
        branchSales[branchId] = 0;
      }
      branchSales[branchId] += item.price * item.quantity;
    });

    // Update each branch's total sales
    for (const [branchId, salesAmount] of Object.entries(branchSales)) {
      await Branch.findByIdAndUpdate(
        branchId,
        { $inc: { totalSales: salesAmount } }
      );
    }

    // Clear cart
    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    await order.populate('items.product', 'name image');
    await order.populate('items.branch', 'name location');

    res.status(201).json({ 
      message: 'Order placed successfully',
      order 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name image')
      .populate('items.branch', 'name location')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.id,
      user: req.user._id 
    })
    .populate('items.product', 'name image originalPrice discountPrice')
    .populate('items.branch', 'name location');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
