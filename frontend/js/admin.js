document.addEventListener('DOMContentLoaded', () => {
  const orderIdInput = document.getElementById('adminOrderId');
  const statusSelect = document.getElementById('adminStatus');
  const updateButton = document.getElementById('updateOrder');
  const message = document.getElementById('adminMessage');

  if (!orderIdInput || !statusSelect || !updateButton || !message) return;

  updateButton.addEventListener('click', async () => {
    const orderId = orderIdInput.value.trim();
    const status = statusSelect.value;
    if (!orderId) {
      message.textContent = 'Please enter a valid order ID.';
      message.style.color = '#cc1f1f';
      return;
    }
    message.textContent = 'Updating order...';
    message.style.color = '#606060';
    try {
      await apiRequest(`/order/update-order/${orderId}`, 'POST', { status });
      message.textContent = `Order status updated to ${status}.`;
      message.style.color = '#1f7a6d';
    } catch (error) {
      message.textContent = error.message;
      message.style.color = '#cc1f1f';
    }
  });
});
