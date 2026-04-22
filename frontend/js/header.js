/**
 * Header Management
 * Handles user greeting and login/logout button updates
 */

function updateHeaderWithUserInfo() {
  const userInfo = document.getElementById('userInfo');
  if (!userInfo) return;

  // Get user data from localStorage
  const storedUser = localStorage.getItem('foodExpressUser');
  const username = localStorage.getItem('foodExpressUser');
  const token = localStorage.getItem('foodExpressToken');

  if (token || username) {
    // User is logged in - show username and logout button
    const displayName = storedUser ? JSON.parse(storedUser).username : username;
    userInfo.innerHTML = `
      <span class="user-greeting">Hello, ${displayName}</span>
      <button class="nav-logout" onclick="performLogout()">Logout</button>
    `;
    
    // Update hero section for logged-in users
    updateHeroSection(true);
  } else {
    // User is not logged in - show guest and sign in link
    userInfo.innerHTML = `
      <span class="user-greeting">Hello, Guest</span>
      <a href="login.html" class="nav-login">Sign In</a>
    `;
    
    // Update hero section for non-logged-in users
    updateHeroSection(false);
  }
}

function updateHeroSection(isLoggedIn) {
  const heroPrimaryBtn = document.getElementById('heroPrimaryBtn');
  const heroTitle = document.getElementById('heroTitle');
  const heroText = document.getElementById('heroText');
  
  if (!heroPrimaryBtn || !heroTitle || !heroText) return;
  
  if (isLoggedIn) {
    // Logged in user - show "Order Now"
    heroPrimaryBtn.textContent = 'Order Now';
    heroPrimaryBtn.href = '#menu';
    heroTitle.textContent = 'Hungry? Order now!';
    heroText.textContent = 'Browse our delicious menu and discover your favorite meals from nearby restaurants.';
  } else {
    // Not logged in - show "Sign In"
    heroPrimaryBtn.textContent = 'Sign In';
    heroPrimaryBtn.href = 'login.html';
    heroTitle.textContent = 'Sign in to explore local restaurants and tasty dishes.';
    heroText.textContent = 'Enter your city, district or state to discover nearby restaurants, delivery time estimates and popular districts across India.';
  }
}

function performLogout() {
  // Clear user data from localStorage
  localStorage.removeItem('foodExpressToken');
  localStorage.removeItem('foodExpressUser');
  localStorage.removeItem('foodExpressEmail');
  localStorage.removeItem('foodExpressCart');
  localStorage.removeItem('foodExpressTheme');

  // Redirect to login page
  window.location.href = 'login.html';
}

// Update header when page loads
document.addEventListener('DOMContentLoaded', updateHeaderWithUserInfo);

// Update header when user logs in (listen for storage changes)
window.addEventListener('storage', updateHeaderWithUserInfo);
