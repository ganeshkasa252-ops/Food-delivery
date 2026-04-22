function requireLogin() {
  if (!getAuthToken()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function renderCart() {
  if (!requireLogin()) return;
  const cartItems = getCartItems();
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!container || !totalEl) return;
  if (cartItems.length === 0) {
    container.innerHTML = '<p class="status-message">Your cart is empty. Add items from the home page.</p>';
    totalEl.textContent = '₹0';
    document.getElementById('checkoutButton').setAttribute('disabled', 'disabled');
    return;
  }
  document.getElementById('checkoutButton').removeAttribute('disabled');
  let total = 0;
  container.innerHTML = cartItems.map((item, index) => {
    total += item.price * item.quantity;
    const itemImage = item.image || 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=400&q=80';
    return `
      <article class="food-card">
        <img src="${itemImage}" alt="${item.name}" />
        <div class="food-card-body">
          <h3>${item.name}</h3>
          <div class="cart-item-details">
            <p class="price">₹${item.price}</p>
            <div class="quantity-display">Qty: ${item.quantity}</div>
          </div>
          <div class="food-card-footer" style="margin-top: 12px;">
            <div class="quantity-controls">
              <button type="button" data-action="decrease" data-index="${index}" class="qty-btn qty-minus">−</button>
              <span class="qty-display">${item.quantity}</span>
              <button type="button" data-action="increase" data-index="${index}" class="qty-btn qty-plus">+</button>
            </div>
            <button type="button" data-action="remove" data-index="${index}" class="btn btn-secondary btn-remove">Remove</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
  totalEl.textContent = `₹${total}`;
  container.querySelectorAll('button[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      const index = Number(button.dataset.index);
      updateCartItem(action, index);
    });
  });
}

function updateCartItem(action, index) {
  const cart = getCartItems();
  if (!cart[index]) return;
  if (action === 'remove') {
    cart.splice(index, 1);
  } else if (action === 'increase') {
    cart[index].quantity += 1;
  } else if (action === 'decrease') {
    cart[index].quantity = Math.max(1, cart[index].quantity - 1);
  }
  setCartItems(cart);
  renderCart();
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});
