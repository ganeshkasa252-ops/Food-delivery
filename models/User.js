const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  orderUpdates: { type: Boolean, default: true },
  address: { type: String, default: '' },
  location: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
