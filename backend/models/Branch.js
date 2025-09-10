const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  productRequests: [{
    productName: String,
    quantity: Number,
    description: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    requestDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Branch', branchSchema);
