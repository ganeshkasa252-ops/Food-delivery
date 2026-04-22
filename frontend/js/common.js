const API_BASE = 'http://localhost:5000/api';

function getAuthToken() {
  return localStorage.getItem('foodExpressToken');
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem('foodExpressToken', token);
  } else {
    localStorage.removeItem('foodExpressToken');
  }
}

function getUserData() {
  const stored = localStorage.getItem('foodExpressUser');
  return stored ? JSON.parse(stored) : null;
}

function setUserData(user) {
  if (user) {
    localStorage.setItem('foodExpressUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('foodExpressUser');
  }
}

function getCartItems() {
  const stored = localStorage.getItem('foodExpressCart');
  return stored ? JSON.parse(stored) : [];
}

function setCartItems(items) {
  localStorage.setItem('foodExpressCart', JSON.stringify(items));
}

function logout() {
  setAuthToken(null);
  setUserData(null);
  window.location.href = 'login.html';
}

function apiRequest(path, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  });
}

function applyTheme(theme) {
  const body = document.body;
  if (theme === 'dark') {
    body.classList.add('dark-mode');
  } else {
    body.classList.remove('dark-mode');
  }
}

function initializePage() {
  const token = getAuthToken();
  if (token) {
    const theme = localStorage.getItem('foodExpressTheme') || 'light';
    applyTheme(theme);
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('foodExpressTheme', nextTheme);
      const user = getUserData();
      if (user) {
        apiRequest('/auth/theme', 'PATCH', { theme: nextTheme }).catch(() => {});
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initializePage);
