/**
 * API Service Class
 * Handles all HTTP communication with the backend
 * Demonstrates: Encapsulation, Abstraction, Error Handling, Separation of Concerns
 */
class APIService {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.token = this.getStoredToken();
  }

  /**
   * Make HTTP request
   * @private
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const options = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new APIError(
          responseData.message || `HTTP ${response.status}`,
          response.status,
          responseData
        );
      }

      return responseData;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(error.message || 'Network request failed', 500);
    }
  }

  // ============ AUTH ENDPOINTS ============

  /**
   * Signup user
   * @param {string} username - Username
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<Object>} User data and token
   */
  async signup(username, email, password) {
    const response = await this.request('/auth/signup', 'POST', {
      username,
      email,
      password
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  /**
   * Login user
   * @param {string} email - Email
   * @param {string} password - Password
   * @returns {Promise<Object>} User data and token
   */
  async login(email, password) {
    const response = await this.request('/auth/login', 'POST', {
      email,
      password
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  /**
   * Get user profile
   * @returns {Promise<Object>} User profile
   */
  async getProfile() {
    return this.request('/auth/profile', 'GET');
  }

  /**
   * Update theme
   * @param {string} theme - Theme preference
   * @returns {Promise<Object>} Updated theme
   */
  async updateTheme(theme) {
    return this.request('/auth/theme', 'PATCH', { theme });
  }

  // ============ CART ENDPOINTS ============

  /**
   * Get user's cart
   * @returns {Promise<Object>} Cart data
   */
  async getCart() {
    return this.request('/cart', 'GET');
  }

  /**
   * Add item to cart
   * @param {Object} item - Item to add
   * @returns {Promise<Object>} Updated cart
   */
  async addToCart(item) {
    return this.request('/cart/add', 'POST', item);
  }

  /**
   * Update cart item quantity
   * @param {string} itemId - Item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} Updated cart
   */
  async updateCartItem(itemId, quantity) {
    return this.request('/cart/update', 'PATCH', {
      itemId,
      quantity
    });
  }

  /**
   * Remove item from cart
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Updated cart
   */
  async removeFromCart(itemId) {
    return this.request('/cart/remove', 'POST', { itemId });
  }

  /**
   * Clear cart
   * @returns {Promise<Object>} Empty cart
   */
  async clearCart() {
    return this.request('/cart/clear', 'POST');
  }

  // ============ ORDER ENDPOINTS ============

  /**
   * Create order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(orderData) {
    return this.request('/order/create', 'POST', orderData);
  }

  /**
   * Get user's orders
   * @returns {Promise<Object>} User orders
   */
  async getUserOrders() {
    return this.request('/order/user', 'GET');
  }

  /**
   * Get order details
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderDetails(orderId) {
    return this.request(`/order/${orderId}`, 'GET');
  }

  /**
   * Update order status (admin)
   * @param {string} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated order
   */
  async updateOrderStatus(orderId, status) {
    return this.request('/order/status', 'POST', {
      orderId,
      status
    });
  }

  /**
   * Update payment details
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Updated order
   */
  async updatePayment(orderId, paymentData) {
    return this.request('/order/payment', 'POST', {
      orderId,
      ...paymentData
    });
  }

  // ============ TOKEN MANAGEMENT ============

  /**
   * Set authentication token
   * @private
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('foodExpressToken', token);
  }

  /**
   * Get stored authentication token
   * @private
   * @returns {string|null} JWT token or null
   */
  getStoredToken() {
    return localStorage.getItem('foodExpressToken');
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('foodExpressToken');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.token;
  }
}

/**
 * Custom API Error Class
 * Demonstrates: Custom Exception Handling
 */
class APIError extends Error {
  constructor(message, statusCode, responseData = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

// Export as a singleton instance for use across the app
const apiService = new APIService();

module.exports = { APIService, APIError, apiService };
