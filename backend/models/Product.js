const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalPrice: {
    type: Number,
    required: true
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  discountPercentage: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  return this.discountPrice > 0 ? this.discountPrice : this.originalPrice;
});

// Calculate discount price when discount percentage is set
productSchema.pre('save', function(next) {
  if (this.discountPercentage > 0) {
    this.discountPrice = this.originalPrice - (this.originalPrice * this.discountPercentage / 100);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
