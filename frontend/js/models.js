/**
 * User Model Class
 * Represents a user in the application
 * Demonstrates: Encapsulation, Data Validation, State Management
 */
class User {
  constructor(email, username, theme = 'light') {
    this.email = email;
    this.username = username;
    this.theme = theme;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.email && !!this.username;
  }

  /**
   * Toggle theme between light and dark
   * @returns {string} New theme
   */
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    return this.theme;
  }

  /**
   * Get user display name
   * @returns {string}
   */
  getDisplayName() {
    return this.username || 'Guest';
  }

  /**
   * Convert to JSON for storage
   * @returns {Object}
   */
  toJSON() {
    return {
      email: this.email,
      username: this.username,
      theme: this.theme
    };
  }
}

/**
 * Cart Item Model Class
 * Represents a single item in the shopping cart
 * Demonstrates: Encapsulation, Calculation Methods
 */
class CartItem {
  constructor(itemId, name, price, quantity = 1) {
    this.itemId = itemId;
    this.name = name;
    this.price = price;
    this.quantity = Math.max(1, quantity);
  }

  /**
   * Get total price for this item
   * @returns {number}
   */
  getTotal() {
    return this.price * this.quantity;
  }

  /**
   * Update quantity with validation
   * @param {number} newQuantity - New quantity value
   */
  setQuantity(newQuantity) {
    this.quantity = Math.max(1, Math.min(newQuantity, 100));
  }

  /**
   * Increase quantity
   */
  increment() {
    this.setQuantity(this.quantity + 1);
  }

  /**
   * Decrease quantity
   */
  decrement() {
    if (this.quantity > 1) {
      this.setQuantity(this.quantity - 1);
    }
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      itemId: this.itemId,
      name: this.name,
      price: this.price,
      quantity: this.quantity
    };
  }
}

/**
 * Cart Model Class
 * Manages shopping cart operations
 * Demonstrates: Inheritance, Composition, Business Logic
 */
class Cart {
  constructor() {
    this.items = [];
  }

  /**
   * Add or update item in cart
   * @param {CartItem} cartItem - Item to add
   */
  addItem(cartItem) {
    const existingItem = this.items.find(item => item.itemId === cartItem.itemId);
    if (existingItem) {
      existingItem.increment();
    } else {
      this.items.push(cartItem);
    }
  }

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID to remove
   */
  removeItem(itemId) {
    this.items = this.items.filter(item => item.itemId !== itemId);
  }

  /**
   * Get item by ID
   * @param {string} itemId - Item ID
   * @returns {CartItem|null}
   */
  getItem(itemId) {
    return this.items.find(item => item.itemId === itemId) || null;
  }

  /**
   * Calculate total cart value
   * @returns {number}
   */
  getTotal() {
    return this.items.reduce((sum, item) => sum + item.getTotal(), 0);
  }

  /**
   * Get item count
   * @returns {number}
   */
  getItemCount() {
    return this.items.length;
  }

  /**
   * Check if cart is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.items.length === 0;
  }

  /**
   * Clear entire cart
   */
  clear() {
    this.items = [];
  }

  /**
   * Get all items
   * @returns {Array<CartItem>}
   */
  getItems() {
    return [...this.items];
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      items: this.items.map(item => item.toJSON()),
      total: this.getTotal(),
      itemCount: this.getItemCount()
    };
  }
}

/**
 * Order Model Class
 * Represents a customer order
 * Demonstrates: State Management, Validation, Data Structure
 */
class Order {
  constructor(orderId, items, address, paymentMethod, status = 'placed') {
    this.orderId = orderId;
    this.items = items;
    this.address = address;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.createdAt = new Date();
    this.total = this.calculateTotal();
  }

  /**
   * Calculate order total
   * @returns {number}
   */
  calculateTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  /**
   * Update order status
   * @param {string} newStatus - New status
   */
  updateStatus(newStatus) {
    const validStatuses = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'failed'];
    if (validStatuses.includes(newStatus)) {
      this.status = newStatus;
    }
  }

  /**
   * Get status display text
   * @returns {string}
   */
  getStatusDisplay() {
    const statusMap = {
      'placed': 'Order Placed',
      'confirmed': 'Order Confirmed',
      'preparing': 'Preparing',
      'out_for_delivery': 'Out for Delivery',
      'delivered': 'Delivered',
      'failed': 'Payment Failed'
    };
    return statusMap[this.status] || this.status;
  }

  /**
   * Check if order is delivered
   * @returns {boolean}
   */
  isDelivered() {
    return this.status === 'delivered';
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      orderId: this.orderId,
      items: this.items,
      address: this.address,
      paymentMethod: this.paymentMethod,
      status: this.status,
      total: this.total,
      createdAt: this.createdAt.toISOString(),
      statusDisplay: this.getStatusDisplay()
    };
  }
}

module.exports = { User, CartItem, Cart, Order };
