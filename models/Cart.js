const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 }
});

const cartSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
