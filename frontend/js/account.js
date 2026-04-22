document.addEventListener('DOMContentLoaded', async () => {
  if (!getAuthToken()) {
    window.location.href = 'login.html';
    return;
  }
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileTheme = document.getElementById('profileTheme');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const logoutButton = document.getElementById('logoutButton');
  const accountMessage = document.getElementById('accountMessage');

  const user = getUserData();
  if (!user) {
    logout();
    return;
  }
  try {
    const response = await apiRequest('/auth/profile');
    if (profileName) profileName.textContent = response.user.username;
    if (profileEmail) profileEmail.textContent = response.user.email;
    if (profileTheme) profileTheme.textContent = response.user.theme;
    if (darkModeToggle) {
      darkModeToggle.checked = response.user.theme === 'dark';
    }
  } catch (error) {
    if (accountMessage) {
      accountMessage.textContent = 'Unable to load profile. Please login again.';
      accountMessage.style.color = '#cc1f1f';
    }
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', async () => {
      const nextTheme = darkModeToggle.checked ? 'dark' : 'light';
      applyTheme(nextTheme);
      localStorage.setItem('foodExpressTheme', nextTheme);
      try {
        await apiRequest('/auth/theme', 'PATCH', { theme: nextTheme });
        if (profileTheme) profileTheme.textContent = nextTheme;
      } catch (error) {
        if (accountMessage) {
          accountMessage.textContent = 'Unable to save theme. Please try again.';
          accountMessage.style.color = '#cc1f1f';
        }
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => logout());
  }

  // Load past orders
  loadPastOrders();

  // Settings handlers
  setupPasswordForm();
  setupAddressForm();
  setupOrderUpdatesToggle();
});

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusLabel(status) {
  const labels = {
    placed: 'Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    failed: 'Failed'
  };
  return labels[status] || status;
}

async function loadPastOrders() {
  const tableBody = document.getElementById('ordersTableBody');
  const ordersMessage = document.getElementById('ordersMessage');

  if (!tableBody) return;

  try {
    const response = await apiRequest('/order');
    const orders = response.orders || [];

    if (orders.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="5" class="status-message">No orders yet. Start ordering!</td></tr>';
      return;
    }

    tableBody.innerHTML = orders.map(order => `
      <tr>
        <td class="order-id">#${order._id.substring(0, 8)}</td>
        <td class="bill-amount">₹${order.total}</td>
        <td>${formatDate(order.createdAt)}</td>
        <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
        <td><button class="view-more-btn" onclick="openOrderModal('${order._id}')">View More</button></td>
      </tr>
    `).join('');
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="5" class="status-message">Unable to load orders. Please try again.</td></tr>';
    if (ordersMessage) {
      ordersMessage.textContent = error.message || 'Failed to load orders';
      ordersMessage.style.color = '#cc1f1f';
    }
  }
}

async function openOrderModal(orderId) {
  const modal = document.getElementById('orderModal');
  if (!modal) return;

  try {
    const response = await apiRequest(`/order/${orderId}`);
    const order = response.order;

    document.getElementById('modalOrderId').textContent = `#${order._id.substring(0, 8)}`;
    document.getElementById('modalOrderDate').textContent = `${formatDate(order.createdAt)} at ${formatTime(order.createdAt)}`;
    document.getElementById('modalOrderStatus').textContent = getStatusLabel(order.status);
    document.getElementById('modalOrderStatus').className = `status-badge status-${order.status}`;
    document.getElementById('modalPaymentMethod').textContent = order.paymentMethod || 'N/A';
    document.getElementById('modalAddress').textContent = order.address || 'N/A';
    document.getElementById('modalTotalPrice').textContent = `₹${order.total}`;

    const foodItemsContainer = document.getElementById('modalFoodItems');
    foodItemsContainer.innerHTML = order.items.map(item => `
      <div class="food-item-row">
        <div class="food-item-info">
          <div class="food-item-name">${item.name}</div>
          <div class="food-item-qty">Quantity: ${item.quantity}</div>
        </div>
        <div class="food-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
      </div>
    `).join('');

    modal.classList.add('show');
  } catch (error) {
    alert('Unable to load order details. Please try again.');
  }
}

function closeOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('orderModal');
  const closeButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
  
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeOrderModal();
      }
    });
  }

  closeButtons.forEach(btn => {
    btn.addEventListener('click', closeOrderModal);
  });
});

// Settings Handlers

// Password method state
let passwordChangeState = {
  method: null,           // 'oldpassword' or 'otp'
  otpSent: false,
  otpVerified: false,
  passwordVerified: false,
  userEmail: null,
  username: null,
  otp: null
};

function selectPasswordMethod(method) {
  passwordChangeState.method = method;
  console.log(`📝 Selected password change method: ${method}`);
}

async function proceedWithPasswordMethod() {
  const message = document.getElementById('methodMessage');
  const method = passwordChangeState.method;

  if (!method) {
    message.textContent = 'Please select a verification method';
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
    return;
  }

  try {
    // Get user profile for email and username
    const userResponse = await apiRequest('/auth/profile');
    passwordChangeState.userEmail = userResponse.user.email;
    passwordChangeState.username = userResponse.user.username;

    // Hide method selection
    document.getElementById('passwordStep0').style.display = 'none';

    if (method === 'oldpassword') {
      // Show step 1A: Current password verification
      document.getElementById('passwordStep1A').style.display = 'block';
      document.getElementById('currentPassword').focus();
    } else if (method === 'otp') {
      // Show step 1B: Send OTP
      document.getElementById('passwordStep1B').style.display = 'block';
    }
  } catch (error) {
    message.textContent = 'Error: ' + error.message;
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
  }
}

function backToMethodSelection() {
  // Reset to method selection step
  document.getElementById('passwordStep0').style.display = 'block';
  document.getElementById('passwordStep1A').style.display = 'none';
  document.getElementById('passwordStep1B').style.display = 'none';
  document.getElementById('passwordStep2').style.display = 'none';
  document.getElementById('passwordStep3').style.display = 'none';
  
  // Clear form fields
  document.getElementById('currentPassword').value = '';
  document.getElementById('passwordOtp').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  
  // Clear messages
  document.getElementById('methodMessage').textContent = '';
  document.getElementById('passwordMessage').textContent = '';
  document.getElementById('otpSendMessage').textContent = '';
  document.getElementById('otpMessage').textContent = '';
  document.getElementById('newPasswordMessage').textContent = '';
  
  // Reset state
  passwordChangeState.otpSent = false;
  passwordChangeState.otpVerified = false;
  passwordChangeState.passwordVerified = false;
  passwordChangeState.otp = null;
}

async function verifyCurrentPassword() {
  const currentPassword = document.getElementById('currentPassword').value.trim();
  const message = document.getElementById('passwordMessage');

  if (!currentPassword) {
    message.textContent = 'Please enter your current password';
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
    return;
  }

  if (currentPassword.length < 6) {
    message.textContent = 'Password must be at least 6 characters';
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
    return;
  }

  try {
    message.textContent = 'Verifying password...';
    message.style.color = '#3498db';
    message.style.display = 'block';

    // Verify current password
    const response = await fetch('http://localhost:5000/api/auth/verify-current-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ currentPassword })
    });

    const data = await response.json();

    if (data.success) {
      passwordChangeState.passwordVerified = true;
      message.textContent = '✅ Password verified! Now set your new password';
      message.style.color = '#27ae60';

      // Move to step 3
      setTimeout(() => {
        document.getElementById('passwordStep1A').style.display = 'none';
        document.getElementById('passwordStep3').style.display = 'block';
        document.getElementById('newPassword').focus();
      }, 500);
    } else {
      message.textContent = data.message || 'Current password is incorrect';
      message.style.color = '#cc1f1f';
    }
  } catch (error) {
    message.textContent = 'Error: ' + error.message;
    message.style.color = '#cc1f1f';
  }
}

async function sendPasswordOtp() {
  const message = document.getElementById('otpSendMessage');

  try {
    message.textContent = 'Sending OTP to your email...';
    message.style.color = '#3498db';
    message.style.display = 'block';

    // Request OTP from backend
    const response = await fetch('http://localhost:5000/api/auth/send-password-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: passwordChangeState.username,
        email: passwordChangeState.userEmail
      })
    });

    const data = await response.json();

    if (data.success) {
      passwordChangeState.otpSent = true;
      message.textContent = '✅ OTP sent to ' + passwordChangeState.userEmail;
      message.style.color = '#27ae60';

      // Move to step 2
      setTimeout(() => {
        document.getElementById('passwordStep1B').style.display = 'none';
        document.getElementById('passwordStep2').style.display = 'block';
        document.getElementById('passwordOtp').focus();
      }, 800);
    } else {
      throw new Error(data.message || 'Failed to send OTP');
    }
  } catch (error) {
    message.textContent = error.message;
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
  }
}

async function verifyPasswordOtp() {
  const otp = document.getElementById('passwordOtp').value.trim();
  const message = document.getElementById('otpMessage');

  if (!otp) {
    message.textContent = 'Please enter the OTP';
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    message.textContent = 'OTP must be exactly 6 digits';
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
    return;
  }

  try {
    message.textContent = 'Verifying OTP...';
    message.style.color = '#3498db';
    message.style.display = 'block';

    // Verify OTP with backend
    const response = await fetch('http://localhost:5000/api/auth/verify-password-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: passwordChangeState.username,
        email: passwordChangeState.userEmail,
        otp
      })
    });

    const data = await response.json();

    if (data.success) {
      passwordChangeState.otp = otp;
      passwordChangeState.otpVerified = true;
      message.textContent = '✅ OTP verified! Now set your new password';
      message.style.color = '#27ae60';

      // Move to step 3
      setTimeout(() => {
        document.getElementById('passwordStep2').style.display = 'none';
        document.getElementById('passwordStep3').style.display = 'block';
        document.getElementById('newPassword').focus();
      }, 500);
    } else {
      throw new Error(data.message || 'Invalid OTP');
    }
  } catch (error) {
    message.textContent = error.message;
    message.style.color = '#cc1f1f';
    message.style.display = 'block';
  }
}

async function resendPasswordOtp() {
  const message = document.getElementById('otpMessage');

  try {
    message.textContent = 'Resending OTP...';
    message.style.color = '#3498db';
    message.style.display = 'block';

    const response = await fetch('http://localhost:5000/api/auth/send-password-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: passwordChangeState.username,
        email: passwordChangeState.userEmail
      })
    });

    const data = await response.json();

    if (data.success) {
      message.textContent = '✅ OTP resent to your email';
      message.style.color = '#27ae60';
    } else {
      throw new Error(data.message || 'Failed to resend OTP');
    }
  } catch (error) {
    message.textContent = error.message;
    message.style.color = '#cc1f1f';
  }
}

async function setupPasswordForm() {
  const form = document.getElementById('passwordForm');
  const message = document.getElementById('newPasswordMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!newPassword) {
      message.textContent = 'Please enter a new password';
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
      return;
    }

    if (newPassword.length < 6) {
      message.textContent = 'Password must be at least 6 characters';
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent = 'New passwords do not match';
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
      return;
    }

    // Check which verification method was used
    const isOtpMethod = passwordChangeState.method === 'otp';
    const isPasswordMethod = passwordChangeState.method === 'oldpassword';

    if (!isOtpMethod && !isPasswordMethod) {
      message.textContent = 'Invalid verification method';
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
      return;
    }

    if (isOtpMethod && !passwordChangeState.otpVerified) {
      message.textContent = 'Please verify OTP first';
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
      return;
    }

    if (isPasswordMethod && !passwordChangeState.passwordVerified) {
      message.textContent = 'Please verify your current password first';
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
      return;
    }

    try {
      message.textContent = 'Updating password...';
      message.style.color = '#3498db';
      message.style.display = 'block';

      let response;

      if (isOtpMethod) {
        // Change password using OTP verification
        response = await fetch('http://localhost:5000/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: passwordChangeState.username,
            email: passwordChangeState.userEmail,
            otp: passwordChangeState.otp,
            newPassword
          })
        });
      } else if (isPasswordMethod) {
        // Change password using current password verification
        response = await fetch('http://localhost:5000/api/auth/change-password-with-current', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({ newPassword })
        });
      }

      const data = await response.json();

      if (data.success) {
        message.textContent = '✅ Password updated successfully! Redirecting to home...';
        message.style.color = '#27ae60';
        form.reset();

        // Reset state
        passwordChangeState = {
          method: null,
          otpSent: false,
          otpVerified: false,
          passwordVerified: false,
          userEmail: null,
          username: null,
          otp: null
        };

        setTimeout(() => {
          window.location.href = 'home.html';
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to update password');
      }
    } catch (error) {
      message.textContent = error.message;
      message.style.color = '#cc1f1f';
      message.style.display = 'block';
    }
  });
}

async function setupAddressForm() {
  const form = document.getElementById('addressForm');
  const message = document.getElementById('addressMessage');
  const addressField = document.getElementById('deliveryAddress');
  const locationField = document.getElementById('deliveryLocation');

  if (!form || !addressField || !locationField) return;

  // Load saved address
  try {
    const response = await apiRequest('/auth/profile');
    if (response.user.address) addressField.value = response.user.address;
    if (response.user.location) locationField.value = response.user.location;
  } catch (error) {
    console.error('Failed to load address');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const address = addressField.value.trim();
    const location = locationField.value.trim();

    if (!address || !location) {
      message.textContent = 'Please fill in all fields';
      message.style.color = '#e74c3c';
      message.style.display = 'block';
      return;
    }

    try {
      message.textContent = 'Saving address...';
      message.style.color = '#3498db';
      message.style.display = 'block';

      const response = await apiRequest('/auth/update-preferences', 'POST', {
        address,
        location
      });

      if (response.success) {
        message.textContent = 'Address saved successfully!';
        message.style.color = '#27ae60';

        setTimeout(() => {
          message.textContent = '';
          message.style.display = 'none';
        }, 3000);
      } else {
        throw new Error(response.error || 'Failed to save address');
      }
    } catch (error) {
      message.textContent = error.message;
      message.style.color = '#e74c3c';
      message.style.display = 'block';
    }
  });
}

async function setupOrderUpdatesToggle() {
  const toggle = document.getElementById('orderUpdates');
  const message = document.getElementById('updateMessage');

  if (!toggle) return;

  // Load current setting
  try {
    const response = await apiRequest('/auth/profile');
    toggle.checked = response.user.orderUpdates !== false;
  } catch (error) {
    console.error('Failed to load preferences');
  }

  toggle.addEventListener('change', async () => {
    try {
      message.textContent = 'Updating preferences...';
      message.style.color = '#3498db';
      message.style.display = 'block';

      const response = await apiRequest('/auth/update-preferences', 'POST', {
        orderUpdates: toggle.checked
      });

      if (response.success) {
        message.textContent = toggle.checked ? 'Notifications enabled' : 'Notifications disabled';
        message.style.color = '#27ae60';

        setTimeout(() => {
          message.textContent = '';
          message.style.display = 'none';
        }, 2000);
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      toggle.checked = !toggle.checked;
      message.textContent = error.message;
      message.style.color = '#e74c3c';
      message.style.display = 'block';
    }
  });
}
