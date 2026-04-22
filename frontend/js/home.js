const categories = ['All', 'Pizza', 'Burger', 'Biryani', 'Tiffins', 'Desserts', 'Beverages', 'Meals', 'Sides'];
let menuItems = [];
let activeCategory = 'All';

function renderCategories() {
  const row = document.getElementById('categoryRow');
  if (!row) return;
  row.innerHTML = categories.map(category => `
    <button class="category-chip ${category === activeCategory ? 'active' : ''}" data-category="${category}">${category}</button>
  `).join('');
  row.querySelectorAll('.category-chip').forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function renderMenu(filteredItems = null) {
  const grid = document.getElementById('foodGrid');
  if (!grid) return;
  const items = filteredItems || menuItems;
  const list = items.filter((item) => activeCategory === 'All' || item.category === activeCategory);
  if (list.length === 0) {
    grid.innerHTML = '<p class="status-message">No items match your search or category.</p>';
    return;
  }
  const cart = getCartItems();
  grid.innerHTML = list.map(item => {
    const cartItem = cart.find(c => c.itemId === item.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    const buttonHTML = quantity === 0 
      ? `<button class="btn btn-tertiary add-to-cart-btn" data-id="${item.id}">Add to Cart</button>`
      : `<div class="quantity-controls">
          <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
          <span class="qty-display">${quantity}</span>
          <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
        </div>`;
    
    return `
    <article class="food-card">
      <img src="${item.image}" alt="${item.name}" />
      <div class="food-card-body">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <div class="food-card-footer">
          <strong class="price">₹${item.price}</strong>
          ${buttonHTML}
        </div>
      </div>
    </article>
  `;
  }).join('');
  
  // Add event listeners for "Add to Cart" buttons
  grid.querySelectorAll('.add-to-cart-btn').forEach((button) => {
    button.addEventListener('click', () => {
      addItemToCart(button.dataset.id);
      renderMenu(filteredItems);
    });
  });
  
  // Add event listeners for quantity controls
  grid.querySelectorAll('.qty-minus').forEach((button) => {
    button.addEventListener('click', () => {
      decreaseQuantity(button.dataset.id);
      renderMenu(filteredItems);
    });
  });
  
  grid.querySelectorAll('.qty-plus').forEach((button) => {
    button.addEventListener('click', () => {
      increaseQuantity(button.dataset.id);
      renderMenu(filteredItems);
    });
  });
}

function createCitySuggestions() {
  const datalist = document.getElementById('citySuggestions');
  const input = document.getElementById('cityInput');
  if (!datalist || !input) return;
  datalist.innerHTML = indiaCities.map(city => `<option value="${city}"></option>`).join('');
}

function setManualLocation() {
  const locationInput = document.getElementById('cityInput');
  const locationInfo = document.getElementById('locationNote');
  if (!locationInput || !locationInfo) return;
  const locationValue = locationInput.value.trim();
  if (!locationValue) {
    locationInfo.textContent = 'Please enter a city name.';
    return;
  }
  locationInfo.textContent = `Location set to ${locationValue}. Showing menu items in your area.`;
}

function requestUserLocation() {
  if (!navigator.geolocation) {
    document.getElementById('locationNote').textContent = 'Geolocation is not supported by your browser.';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    position => {
      document.getElementById('locationNote').textContent = 'Location saved. Showing nearby restaurants.';
    },
    error => {
      document.getElementById('locationNote').textContent = 'Please allow location access to see nearby restaurants.';
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

function addItemToCart(itemId) {
  const item = menuItems.find(i => i.id === itemId);
  if (!item) return;
  const cart = getCartItems();
  const existing = cart.find((product) => product.itemId === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ itemId: item.id, name: item.name, price: item.price, image: item.image, quantity: 1 });
  }
  setCartItems(cart);
  document.getElementById('locationNote').textContent = 'Added to cart. View your cart to checkout.';
}

function increaseQuantity(itemId) {
  const cart = getCartItems();
  const cartItem = cart.find(c => c.itemId === itemId);
  if (cartItem) {
    cartItem.quantity += 1;
    setCartItems(cart);
  }
}

function decreaseQuantity(itemId) {
  const cart = getCartItems();
  const cartItem = cart.find(c => c.itemId === itemId);
  if (cartItem) {
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      setCartItems(cart);
    } else {
      // Remove item if quantity becomes 0
      const index = cart.indexOf(cartItem);
      cart.splice(index, 1);
      setCartItems(cart);
    }
  }
}

async function loadMenu() {
  const grid = document.getElementById('foodGrid');
  if (!grid) return;
  try {
    const response = await apiRequest('/menu');
    menuItems = response.menu;
    renderCategories();
    renderMenu();
  } catch (error) {
    grid.innerHTML = `<p class="status-message">Unable to load menu. ${error.message}</p>`;
  }
}

function filterCategory(category, button) {
  const buttons = document.querySelectorAll('.category-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  if (button) button.classList.add('active');
  activeCategory = category;
  renderMenu();
}

function initializeHome() {
  createCitySuggestions();
  loadMenu();
  const searchButton = document.getElementById('searchButton');
  const searchInput = document.getElementById('foodSearch');
  if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
      const query = searchInput.value.trim().toLowerCase();
      const filtered = menuItems.filter(item => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query));
      renderMenu(filtered);
    });
  }
}

document.addEventListener('DOMContentLoaded', initializeHome);
