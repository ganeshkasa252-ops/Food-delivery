function requireLogin() {
  if (!getAuthToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function generateQRCode(text) {
  // Using QR Server API for QR code generation
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
}

function updatePaymentOptions() {
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  const qrCodeSection = document.getElementById('qrCodeSection');
  
  if (paymentMethod && paymentMethod.value === 'upi') {
    // Show QR code for UPI
    const upiQrCode = document.getElementById('upiQrCode');
    const upiString = 'upi://pay?pa=dummy@paytm&pn=FoodExpress&am=100&tn=Order%20Payment';
    upiQrCode.src = generateQRCode(upiString);
    qrCodeSection.style.display = 'block';
  } else {
    qrCodeSection.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin()) return;
  const payNow = document.getElementById('payNow');
  const message = document.getElementById('paymentMessage');
  const checkoutData = JSON.parse(localStorage.getItem('foodExpressCheckout') || 'null');
  const cartItems = getCartItems();
  
  if (!checkoutData || cartItems.length === 0) {
    if (message) {
      message.textContent = 'No checkout data available. Return to your cart and try again.';
      message.style.color = '#cc1f1f';
    }
    payNow.disabled = true;
    return;
  }

  payNow.addEventListener('click', async () => {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    
    if (!paymentMethod) {
      message.textContent = 'Please select a payment method';
      message.style.color = '#cc1f1f';
      return;
    }

    const selectedMethod = paymentMethod.value;
    
    if (selectedMethod === 'online' || selectedMethod === 'upi') {
      // Online payment with QR code
      await processDummyOnlinePayment(selectedMethod);
    } else if (selectedMethod === 'cod') {
      // Cash on Delivery
      await processCashOnDelivery();
    }
  });

  async function processDummyOnlinePayment(method) {
    try {
      message.textContent = 'Processing your payment...';
      message.style.color = '#3498db';
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate QR code for UPI
      const upiString = 'upi://pay?pa=dummy@paytm&pn=FoodExpress&am=100&tn=Order%20Payment';
      const qrCodeUrl = generateQRCode(upiString);
      
      // Create order with payment details
      const orderData = {
        items: cartItems,
        total: checkoutData.total,
        address: checkoutData.address,
        paymentMethod: method === 'online' ? 'Card' : 'UPI',
        razorpayOrderId: `dummy_order_${Date.now()}`,
        razorpayPaymentId: `dummy_payment_${Date.now()}`,
        razorpaySignature: 'dummy_signature_' + Math.random().toString(36).substr(2, 9),
        qrCode: qrCodeUrl
      };

      const response = await fetch('http://localhost:5000/api/order/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Failed to create order');

      const result = await response.json();

      if (result.success) {
        setCartItems([]);
        localStorage.removeItem('foodExpressCheckout');
        message.textContent = 'Order placed successfully!';
        message.style.color = '#27ae60';
        
        // Store QR code in session for order tracking
        sessionStorage.setItem('orderQrCode', qrCodeUrl);
        
        setTimeout(() => {
          window.location.href = `order-tracking.html?orderId=${result.orderId}`;
        }, 1500);
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      message.textContent = error.message;
      message.style.color = '#cc1f1f';
    }
  }

  async function processCashOnDelivery() {
    try {
      message.textContent = 'Confirming your Cash on Delivery order...';
      message.style.color = '#3498db';
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate QR code for COD (same as UPI for tracking purposes)
      const upiString = 'upi://pay?pa=dummy@paytm&pn=FoodExpress&am=100&tn=Order%20Payment';
      const qrCodeUrl = generateQRCode(upiString);
      
      // Create order with COD payment
      const orderData = {
        items: cartItems,
        total: checkoutData.total,
        address: checkoutData.address,
        paymentMethod: 'Cash on Delivery',
        razorpayOrderId: `dummy_order_${Date.now()}`,
        razorpayPaymentId: `dummy_payment_${Date.now()}`,
        razorpaySignature: 'dummy_signature_' + Math.random().toString(36).substr(2, 9),
        qrCode: qrCodeUrl
      };

      const response = await fetch('http://localhost:5000/api/order/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) throw new Error('Failed to create order');

      const result = await response.json();

      if (result.success) {
        setCartItems([]);
        localStorage.removeItem('foodExpressCheckout');
        message.textContent = 'Order confirmed! Pay when your order arrives.';
        message.style.color = '#27ae60';
        
        // Store order data for COD success page
        const orderData = {
          orderId: result.orderId,
          total: checkoutData.total,
          address: checkoutData.address
        };
        sessionStorage.setItem('codOrderData', JSON.stringify(orderData));
        
        setTimeout(() => {
          window.location.href = 'payment-success.html';
        }, 1500);
      } else {
        throw new Error(result.error || 'Order creation failed');
      }
    } catch (error) {
      message.textContent = error.message;
      message.style.color = '#cc1f1f';
    }
  }
});
