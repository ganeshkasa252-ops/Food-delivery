/**
 * Storage Service Class
 * Handles all localStorage operations with type safety
 * Demonstrates: Encapsulation, Data Persistence, Type Validation
 */
class StorageService {
  constructor() {
    this.PREFIX = 'foodExpress_';
  }

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setItem(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.PREFIX + key, serialized);
    } catch (error) {
      console.error(`Failed to save ${key} to storage:`, error);
    }
  }

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {any} defaultValue - Default value if not found
   * @returns {any} Stored value or default
   */
  getItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to retrieve ${key} from storage:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   */
  removeItem(key) {
    localStorage.removeItem(this.PREFIX + key);
  }

  /**
   * Clear all localStorage items with this prefix
   */
  clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  hasItem(key) {
    return localStorage.getItem(this.PREFIX + key) !== null;
  }

  // ============ DOMAIN-SPECIFIC METHODS ============

  /**
   * Save user data
   * @param {User} user - User object
   */
  saveUser(user) {
    this.setItem('user', user.toJSON());
  }

  /**
   * Get user data
   * @returns {Object|null} User data
   */
  getUser() {
    return this.getItem('user');
  }

  /**
   * Save cart data
   * @param {Cart} cart - Cart object
   */
  saveCart(cart) {
    this.setItem('cart', cart.toJSON());
  }

  /**
   * Get cart data
   * @returns {Object|null} Cart data
   */
  getCart() {
    return this.getItem('cart');
  }

  /**
   * Save orders
   * @param {Array} orders - Array of orders
   */
  saveOrders(orders) {
    this.setItem('orders', orders);
  }

  /**
   * Get orders
   * @returns {Array} Orders
   */
  getOrders() {
    return this.getItem('orders', []);
  }

  /**
   * Save theme preference
   * @param {string} theme - Theme value
   */
  setTheme(theme) {
    this.setItem('theme', theme);
  }

  /**
   * Get theme preference
   * @returns {string} Theme
   */
  getTheme() {
    return this.getItem('theme', 'light');
  }

  /**
   * Save authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.setItem('token', token);
  }

  /**
   * Get authentication token
   * @returns {string|null} Token
   */
  getToken() {
    return this.getItem('token');
  }

  /**
   * Clear authentication (logout)
   */
  logout() {
    this.removeItem('user');
    this.removeItem('token');
  }
}

// Export as a singleton instance
const storageService = new StorageService();

module.exports = { StorageService, storageService };
