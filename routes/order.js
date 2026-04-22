const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { authMiddleware } = require('./auth');
const router = express.Router();

// Initialize Razorpay client only if keys are configured
let razorpayClient = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayClient = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

const statusSteps = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];

async function updateOrderStatus(orderId, status) {
  return Order.findByIdAndUpdate(orderId, { status }, { new: true });
}

function scheduleStatusProgression(orderId) {
  setTimeout(async () => {
    await updateOrderStatus(orderId, 'confirmed');
    setTimeout(async () => {
      await updateOrderStatus(orderId, 'preparing');
      setTimeout(async () => {
        await updateOrderStatus(orderId, 'out_for_delivery');
        setTimeout(async () => {
          await updateOrderStatus(orderId, 'delivered');
        }, 15000);
      }, 10000);
    }, 5000);
  }, 2000);
}

router.post('/create-payment-order', authMiddleware.authenticate(), async (req, res) => {
  const { amount, currency = 'INR', receiptId } = req.body;
  if (!amount || !receiptId) {
    return res.status(400).json({ success: false, message: 'Amount and receiptId are required.' });
  }
  if (!razorpayClient || !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ success: false, message: 'Razorpay API keys are not configured.' });
  }
  try {
    const order = await razorpayClient.orders.create({ amount, currency, receipt: receiptId, payment_capture: 1 });
    res.json({ success: true, order: { ...order, key_id: process.env.RAZORPAY_KEY_ID } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create Razorpay order.', error: error.message });
  }
});

router.post('/verify-payment', authMiddleware.authenticate(), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, total, address, paymentMethod } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !Array.isArray(items) || !address || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Incomplete payment details.' });
  }
  const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + '|' + razorpay_payment_id)
    .digest('hex');
  const isValid = generatedSignature === razorpay_signature;
  const status = isValid ? 'Confirmed' : 'Failed';
  try {
    const order = await Order.create({
      userEmail: req.user.email.toLowerCase(),
      username: req.user.username,
      items,
      total,
      address,
      paymentMethod,
      status,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });
    if (isValid) {
      await Cart.findOneAndDelete({ userEmail: req.user.email.toLowerCase() });
      scheduleStatusProgression(order._id);
    }
    res.json({ success: isValid, orderId: order._id, status, message: isValid ? 'Payment verified and order confirmed.' : 'Payment verification failed.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to save order.' });
  }
});

router.post('/create-order', authMiddleware.authenticate(), async (req, res) => {
  const { items, address, paymentMethod } = req.body;
  if (!Array.isArray(items) || items.length === 0 || !address || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Incomplete order details.' });
  }
  
  try {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const order = await Order.create({
      userEmail: req.user.email.toLowerCase(),
      username: req.user.username,
      items,
      total,
      address,
      paymentMethod,
      status: 'placed'
    });
    
    // Clear cart after order creation
    await Cart.findOneAndDelete({ userEmail: req.user.email.toLowerCase() });
    
    // Schedule status progression for COD orders
    if (paymentMethod === 'COD') {
      scheduleStatusProgression(order._id);
    }
    
    res.json({ success: true, orderId: order._id, message: 'Order created successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to create order.', error: error.message });
  }
});

router.get('/:id', authMiddleware.authenticate(), async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userEmail: req.user.email.toLowerCase() });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch order.' });
  }
});

router.post('/update-order/:id', authMiddleware.authenticate(), async (req, res) => {
  const { status } = req.body;
  if (!status || !statusSteps.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid order status.' });
  }
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, userEmail: req.user.email.toLowerCase() },
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to update order.' });
  }
});

router.get('/', authMiddleware.authenticate(), async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.user.email.toLowerCase() }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to fetch orders.' });
  }
});

module.exports = router;
