const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  }
});

const receiptSchema = new mongoose.Schema({
  storeName: {
    type: String,
    default: 'Unknown Store'
  },
  date: {
    type: Date,
    default: Date.now
  },
  items: [itemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Receipt', receiptSchema);