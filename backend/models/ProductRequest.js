const mongoose = require('mongoose');

const productRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  productName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true
  },
  responseDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ProductRequest', productRequestSchema);
