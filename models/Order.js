const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  username: { type: String, required: true },
  items: { type: [orderItemSchema], default: [] },
  total: { type: Number, required: true },
  address: { type: String, required: true },
  paymentMethod: { type: String, enum: ['UPI', 'Card', 'COD'], required: true },
  status: { type: String, enum: ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'failed'], default: 'placed' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
