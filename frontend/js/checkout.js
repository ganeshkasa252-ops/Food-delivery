function requireLogin() {
  if (!getAuthToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function renderCheckout() {
  if (!requireLogin()) return;
  const cartItems = getCartItems();
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalEl = document.getElementById('checkoutTotal');
  if (totalEl) {
    totalEl.textContent = `₹${total}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderCheckout();
  const form = document.getElementById('checkoutForm');
  const message = document.getElementById('checkoutMessage');
  const paymentModeModal = document.getElementById('paymentModeModal');
  const codBtn = document.getElementById('codBtn');
  const onlineBtn = document.getElementById('onlineBtn');
  const modalClose = document.querySelector('.modal-close');
  
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    if (!address || !phone) {
      if (message) {
        message.textContent = 'Please enter your delivery address and phone number.';
        message.style.color = '#cc1f1f';
      }
      return;
    }
    const cartItems = getCartItems();
    if (cartItems.length === 0) {
      if (message) {
        message.textContent = 'Add items to cart before checking out.';
        message.style.color = '#cc1f1f';
      }
      return;
    }
    
    // Store checkout details
    const checkoutData = {
      address,
      phone,
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      items: cartItems
    };
    localStorage.setItem('foodExpressCheckout', JSON.stringify(checkoutData));
    
    // Show payment mode modal
    if (paymentModeModal) {
      paymentModeModal.classList.add('show');
    }
  });

  // Handle COD button click
  if (codBtn) {
    codBtn.addEventListener('click', async () => {
      await createOrderWithCOD();
    });
  }

  // Handle Online Payment button click
  if (onlineBtn) {
    onlineBtn.addEventListener('click', () => {
      if (paymentModeModal) {
        paymentModeModal.classList.remove('show');
      }
      window.location.href = 'payment.html';
    });
  }

  // Close modal on X button
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      if (paymentModeModal) {
        paymentModeModal.classList.remove('show');
      }
    });
  }

  // Close modal on outside click
  if (paymentModeModal) {
    paymentModeModal.addEventListener('click', (event) => {
      if (event.target === paymentModeModal) {
        paymentModeModal.classList.remove('show');
      }
    });
  }
});

async function createOrderWithCOD() {
  const checkoutData = JSON.parse(localStorage.getItem('foodExpressCheckout'));
  const cartItems = getCartItems();
  
  if (!checkoutData || !cartItems.length) {
    alert('Order data not found. Please try again.');
    return;
  }

  try {
    console.log('Creating COD order...', { checkoutData, cartItems });
    
    const orderPayload = {
      items: cartItems,
      address: checkoutData.address,
      paymentMethod: 'COD'
    };

    const response = await apiRequest('/order/create-order', 'POST', orderPayload);
    console.log('Order response:', response);
    
    if (response && response.success && response.order) {
      console.log('Order created successfully:', response.order);
      
      // Hide payment mode modal
      const paymentModeModal = document.getElementById('paymentModeModal');
      if (paymentModeModal) {
        paymentModeModal.classList.remove('show');
      }
      
      // Get success modal elements
      const successModal = document.getElementById('successModal');
      const orderSuccessMessage = document.getElementById('orderSuccessMessage');
      const successCloseBtn = document.getElementById('successCloseBtn');
      
      // Update order details
      if (orderSuccessMessage && response.order._id) {
        orderSuccessMessage.textContent = `Order ID: #${response.order._id.substring(0, 8)} | Payment method: Cash on Delivery`;
      }
      
      // Show success modal
      if (successModal) {
        console.log('Showing success modal now');
        successModal.classList.add('show');
      }

      // Clear cart after successful order
      setCartItems([]);
      
      // Handle close button
      if (successCloseBtn) {
        successCloseBtn.onclick = function() {
          console.log('Redirecting to home');
          window.location.href = 'home.html';
        };
      }
    } else {
      console.error('Order creation response error:', response);
      alert(`Order creation failed: ${response?.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error creating order:', error);
    alert(`Error creating order: ${error.message}`);
  }
}
