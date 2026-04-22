const statusSteps = [
  { key: 'placed', label: 'Placed', icon: '🟢' },
  { key: 'confirmed', label: 'Confirmed', icon: '✔' },
  { key: 'preparing', label: 'Preparing', icon: '👩‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚴' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' }
];

const statusLabels = {
  placed: 'Order placed successfully.',
  confirmed: 'Your order has been confirmed by the restaurant.',
  preparing: 'Your meal is being prepared.',
  out_for_delivery: 'Your delivery partner is on the way.',
  delivered: 'Order delivered. Enjoy your meal!'
};

const statusEta = {
  placed: '25 mins',
  confirmed: '20 mins',
  preparing: '15 mins',
  out_for_delivery: '8 mins',
  delivered: 'Arrived'
};

function getOrderIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('orderId');
}

function showMessage(text, color = '#606060') {
  const message = document.getElementById('trackingMessage');
  if (!message) return;
  message.textContent = text;
  message.style.color = color;
}

function setOrderVisible(order) {
  const orderDetails = document.getElementById('orderDetails');
  const detailOrderId = document.getElementById('detailOrderId');
  const detailTotal = document.getElementById('detailTotal');
  const detailStatus = document.getElementById('detailStatus');
  const detailEta = document.getElementById('detailEta');
  const qrCodeDisplay = document.getElementById('qrCodeDisplay');
  const displayQrCode = document.getElementById('displayQrCode');
  const qrDescription = document.getElementById('qrDescription');
  
  if (!orderDetails || !detailOrderId || !detailTotal || !detailStatus || !detailEta) return;

  orderDetails.classList.remove('hidden');
  detailOrderId.textContent = order._id;
  detailTotal.textContent = `₹${order.total}`;
  detailStatus.textContent = statusLabels[order.status] || order.status;
  detailEta.textContent = statusEta[order.status] || 'Updating...';
  
  // Display QR code if available
  if (qrCodeDisplay && displayQrCode) {
    if (order.qrCode) {
      displayQrCode.src = order.qrCode;
      qrDescription.textContent = order.paymentMethod === 'Cash on Delivery' 
        ? 'Show this QR code to the delivery partner for verification.' 
        : 'Use this QR code for UPI payment.';
      qrCodeDisplay.style.display = 'block';
    } else {
      qrCodeDisplay.style.display = 'none';
    }
  }
}

function renderSteps(currentStatus) {
  const stepsContainer = document.getElementById('trackingSteps');
  if (!stepsContainer) return;
  stepsContainer.innerHTML = statusSteps.map(step => {
    const isComplete = statusSteps.findIndex(s => s.key === step.key) <= statusSteps.findIndex(s => s.key === currentStatus);
    const isActive = step.key === currentStatus;
    return `
      <div class="progress-step ${isComplete ? 'complete' : ''} ${isActive ? 'active' : ''}">
        <span class="step-icon">${step.icon}</span>
        <span class="step-label">${step.label}</span>
      </div>
    `;
  }).join('');
}

function renderItemList(items) {
  const itemList = document.getElementById('orderItems');
  if (!itemList) return;
  itemList.innerHTML = items.map(item => `
    <div class="tracking-item">
      <div>
        <strong>${item.name}</strong>
        <p>Qty ${item.quantity}</p>
      </div>
      <span>₹${item.price * item.quantity}</span>
    </div>
  `).join('');
}

async function fetchOrder(orderId) {
  try {
    const response = await apiRequest(`/order/${orderId}`);
    if (!response.success) {
      throw new Error(response.message || 'Unable to load order.');
    }
    return response.order;
  } catch (error) {
    showMessage(error.message, '#cc1f1f');
    return null;
  }
}

async function refreshOrder(orderId) {
  const order = await fetchOrder(orderId);
  if (!order) return;
  setOrderVisible(order);
  renderSteps(order.status);
  renderItemList(order.items);
  showMessage(statusLabels[order.status], '#1f7a6d');
}

function initializeTracking() {
  const orderIdInput = document.getElementById('trackingOrderId');
  const loadButton = document.getElementById('loadOrder');
  let orderId = getOrderIdFromUrl();
  let pollingInterval = null;

  const startPolling = (id) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    pollingInterval = setInterval(() => refreshOrder(id), 5000);
  };

  if (orderIdInput && orderId) {
    orderIdInput.value = orderId;
    refreshOrder(orderId);
    startPolling(orderId);
  }

  if (loadButton && orderIdInput) {
    loadButton.addEventListener('click', () => {
      orderId = orderIdInput.value.trim();
      if (!orderId) {
        showMessage('Please enter a valid order ID.', '#cc1f1f');
        return;
      }
      refreshOrder(orderId);
      startPolling(orderId);
    });
  }
}

document.addEventListener('DOMContentLoaded', initializeTracking);
