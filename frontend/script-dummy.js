const userKey = 'foodExpressUser';
const userEmailKey = 'foodExpressEmail';
let cart = [];

function updateUserNav() {
    const userInfo = document.getElementById('userInfo');
    if (!userInfo) return;
    const username = localStorage.getItem(userKey);
    const email = localStorage.getItem(userEmailKey);
    const greeting = userInfo.querySelector('.user-greeting');
    const loginLink = userInfo.querySelector('.nav-login');
    if (username && email) {
        greeting.textContent = `Hello, ${username}`;
        loginLink.textContent = 'Logout';
        loginLink.href = '#';
        loginLink.onclick = () => {
            localStorage.removeItem(userKey);
            localStorage.removeItem(userEmailKey);
            cart = [];
            window.location.href = 'login.html';
        };
    } else {
        greeting.textContent = 'Hello, Guest';
        loginLink.textContent = 'Login';
        loginLink.href = 'login.html';
        loginLink.onclick = null;
    }
}

function searchFood() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const query = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.food-card');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        const matches = title.includes(query) || description.includes(query);
        card.style.display = matches ? 'grid' : 'none';
    });
}

function filterCategory(category, button) {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    if (button) button.classList.add('active');
    const cards = document.querySelectorAll('.food-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'All' || cardCategory === category) {
            card.style.display = 'grid';
        } else {
            card.style.display = 'none';
        }
    });
}

async function updateUserProfile() {
    const email = localStorage.getItem(userEmailKey);
    if (!email) return;
    const userId = document.getElementById('userId');
    const userEmail = document.getElementById('userEmail');
    try {
        const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (data.success && data.user) {
            if (userId) userId.textContent = data.user.username;
            if (userEmail) userEmail.textContent = data.user.email;
        }
    } catch (error) {
        console.warn('Unable to load user profile.', error);
    }
}

function getSavedProfile() {
    const raw = localStorage.getItem('foodExpressProfile');
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            localStorage.removeItem('foodExpressProfile');
        }
    }
    const username = localStorage.getItem(userKey) || 'Guest';
    const email = localStorage.getItem(userEmailKey) || 'guest@foodexpress.com';
    const profile = {
        name: username,
        email,
        phone: '',
        avatarUrl: '',
        walletBalance: 0,
        addresses: [],
        orders: [],
        paymentMethods: { cards: [], upis: [], wallets: [] },
        settings: { notifications: true, darkMode: false }
    };
    localStorage.setItem('foodExpressProfile', JSON.stringify(profile));
    return profile;
}

function saveProfile(profile) {
    localStorage.setItem('foodExpressProfile', JSON.stringify(profile));
}

function ensureLocalProfile(name, email) {
    const profile = getSavedProfile();
    if (!profile.name || profile.name === 'Guest') profile.name = name;
    if (!profile.email || profile.email === 'guest@foodexpress.com') profile.email = email;
    saveProfile(profile);
}

function formatCurrency(amount) {
    return `₹${Number(amount || 0).toFixed(0)}`;
}

function formatOrderDate(timestamp) {
    const date = timestamp ? new Date(timestamp) : new Date();
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function renderAccountPage() {
    const profile = getSavedProfile();
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileAvatar = document.getElementById('profileAvatar');
    const walletBalance = document.getElementById('walletBalance');
    const notificationToggle = document.getElementById('notificationToggle');
    const darkModeToggle = document.getElementById('darkModeToggle');

    if (profileName) profileName.textContent = profile.name || 'Guest';
    if (profileEmail) profileEmail.textContent = profile.email || 'guest@foodexpress.com';
    if (profilePhone) profilePhone.textContent = profile.phone ? `Phone: ${profile.phone}` : 'Phone number not added';
    if (profileAvatar) profileAvatar.textContent = profile.name ? profile.name.slice(0, 2).toUpperCase() : 'FE';
    if (walletBalance) walletBalance.textContent = formatCurrency(profile.walletBalance);
    if (notificationToggle) notificationToggle.textContent = profile.settings.notifications ? 'On' : 'Off';
    if (darkModeToggle) darkModeToggle.textContent = profile.settings.darkMode ? 'On' : 'Off';
    if (profile.settings.darkMode) document.body.classList.add('dark-mode');
    renderAddresses();
    renderOrderHistory();
    renderPaymentMethods();
}

function renderAddresses() {
    const profile = getSavedProfile();
    const container = document.getElementById('addressList');
    if (!container) return;
    container.innerHTML = '';
    if (!profile.addresses.length) {
        container.innerHTML = '<p class="cart-empty">No saved address yet. Add your home or office address.</p>';
        return;
    }
    profile.addresses.forEach((address, index) => {
        const item = document.createElement('div');
        item.className = 'address-item';
        item.innerHTML = `
            <strong>${address.label}</strong>
            <div>${address.details}</div>
            <div>${address.city}, ${address.state}</div>
            <div>${address.pin}</div>
            <div>
                <button class="btn btn-tertiary" type="button" onclick="editAddress(${index})">Edit</button>
                <button class="btn btn-secondary" type="button" onclick="deleteAddress(${index})">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function addAddress() {
    const profile = getSavedProfile();
    const label = prompt('Address label (Home, Work, Campus):', 'Home');
    if (!label) return;
    const details = prompt('Enter address details, street and building name:');
    if (!details) return;
    const city = prompt('City:', 'Silchar');
    if (!city) return;
    const state = prompt('State:', 'Assam');
    if (!state) return;
    const pin = prompt('PIN code:', '788010');
    if (!pin) return;
    profile.addresses.push({ label, details, city, state, pin });
    saveProfile(profile);
    renderAddresses();
}

function editAddress(index) {
    const profile = getSavedProfile();
    const address = profile.addresses[index];
    if (!address) return;
    const label = prompt('Edit address label:', address.label) || address.label;
    const details = prompt('Edit address details:', address.details) || address.details;
    const city = prompt('City:', address.city) || address.city;
    const state = prompt('State:', address.state) || address.state;
    const pin = prompt('PIN code:', address.pin) || address.pin;
    profile.addresses[index] = { label, details, city, state, pin };
    saveProfile(profile);
    renderAddresses();
}

function deleteAddress(index) {
    const profile = getSavedProfile();
    if (!confirm('Delete this saved address?')) return;
    profile.addresses.splice(index, 1);
    saveProfile(profile);
    renderAddresses();
}

function renderOrderHistory() {
    const profile = getSavedProfile();
    const container = document.getElementById('orderHistory');
    if (!container) return;
    container.innerHTML = '';
    if (!profile.orders.length) {
        container.innerHTML = '<p class="cart-empty">No previous orders yet. Your recent orders appear here after checkout.</p>';
        return;
    }
    profile.orders.slice().reverse().forEach((order, index) => {
        const item = document.createElement('div');
        item.className = 'order-item';
        const itemsHtml = Array.isArray(order.items)
            ? `<ul class="order-items">${order.items.map(item => `<li>${item}</li>`).join('')}</ul>`
            : `<div class="order-items">${order.items}</div>`;
        item.innerHTML = `
            <strong>${order.title || 'Order #' + (profile.orders.length - index)}</strong>
            ${itemsHtml}
            <div>${formatOrderDate(order.time)}</div>
            <div>Price: ${formatCurrency(order.total)}</div>
            <div>Payment: ${order.paymentMethod || 'N/A'}</div>
            <span class="order-status">${order.status}</span>
            <button class="btn btn-tertiary" type="button" onclick="reorder(${profile.orders.length - 1 - index})">Reorder</button>
        `;
        container.appendChild(item);
    });
}

function reorder(index) {
    const profile = getSavedProfile();
    const order = profile.orders[index];
    if (!order) return;
    alert(`Reorder placed for ${order.items}. This is a demo reorder action.`);
}

function renderPaymentMethods() {
    const profile = getSavedProfile();
    const cards = document.getElementById('savedCards');
    const upis = document.getElementById('savedUpis');
    const wallets = document.getElementById('savedWallets');
    if (cards) cards.innerHTML = '';
    if (upis) upis.innerHTML = '';
    if (wallets) wallets.innerHTML = '';
    if (profile.paymentMethods.cards.length === 0) {
        cards.innerHTML = '<p class="cart-empty">No saved cards yet.</p>';
    } else {
        profile.paymentMethods.cards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'method-row';
            item.innerHTML = `<strong>${card.name}</strong><div>${card.number}</div>`;
            cards.appendChild(item);
        });
    }
    if (profile.paymentMethods.upis.length === 0) {
        upis.innerHTML = '<p class="cart-empty">No UPI IDs saved yet.</p>';
    } else {
        profile.paymentMethods.upis.forEach(upi => {
            const item = document.createElement('div');
            item.className = 'method-row';
            item.innerHTML = `<strong>${upi.name}</strong><div>${upi.id}</div>`;
            upis.appendChild(item);
        });
    }
    if (profile.paymentMethods.wallets.length === 0) {
        wallets.innerHTML = '<p class="cart-empty">No wallet accounts added yet.</p>';
    } else {
        profile.paymentMethods.wallets.forEach(wallet => {
            const item = document.createElement('div');
            item.className = 'method-row';
            item.innerHTML = `<strong>${wallet.name}</strong><div>${wallet.details}</div>`;
            wallets.appendChild(item);
        });
    }
}

function addPaymentMethod() {
    const profile = getSavedProfile();
    const type = prompt('Add payment type: card, upi or wallet').trim().toLowerCase();
    if (!type || !['card', 'upi', 'wallet'].includes(type)) return;
    if (type === 'card') {
        const name = prompt('Card label (e.g. Visa, MasterCard):');
        const number = prompt('Card number (last 4 digits):');
        if (!name || !number) return;
        profile.paymentMethods.cards.push({ name, number });
    } else if (type === 'upi') {
        const name = prompt('UPI label (e.g. PhonePe, Google Pay):');
        const id = prompt('UPI ID:');
        if (!name || !id) return;
        profile.paymentMethods.upis.push({ name, id });
    } else {
        const name = prompt('Wallet name (e.g. Paytm, PhonePe):');
        const details = prompt('Wallet phone or ID:');
        if (!name || !details) return;
        profile.paymentMethods.wallets.push({ name, details });
    }
    saveProfile(profile);
    renderPaymentMethods();
}

function addWalletMoney() {
    const profile = getSavedProfile();
    const amount = parseFloat(prompt('Enter amount to add to wallet:', '100'));
    if (!amount || amount <= 0) return;
    profile.walletBalance = Number(profile.walletBalance || 0) + amount;
    saveProfile(profile);
    renderAccountPage();
}

function updateProfileInfo() {
    const profile = getSavedProfile();
    const name = prompt('Name:', profile.name) || profile.name;
    const phone = prompt('Phone number:', profile.phone) || profile.phone;
    const avatarUrl = prompt('Profile picture URL (optional):', profile.avatarUrl) || profile.avatarUrl;
    profile.name = name;
    profile.phone = phone;
    profile.avatarUrl = avatarUrl;
    saveProfile(profile);
    renderAccountPage();
}

function changePassword() {
    const current = prompt('Enter your current password (demo only):');
    if (current === null) return;
    const next = prompt('Enter a new password:');
    if (!next) return;
    alert('Password changed successfully (demo mode).');
}

function toggleNotification() {
    const profile = getSavedProfile();
    profile.settings.notifications = !profile.settings.notifications;
    saveProfile(profile);
    renderAccountPage();
}

function toggleDarkMode() {
    const profile = getSavedProfile();
    profile.settings.darkMode = !profile.settings.darkMode;
    saveProfile(profile);
    if (profile.settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    renderAccountPage();
}

function contactSupport() {
    alert('Contact support at support@foodexpress.example or call +91 00000 00000.');
}

function openFaq() {
    alert('FAQ: Add your saved addresses, payment methods, and use the reorder button for past orders.');
}

function reportIssue() {
    const issue = prompt('Describe the issue you are facing:');
    if (!issue) return;
    alert('Thank you. Our support team will review your issue shortly.');
}

function logoutFromAccount() {
    localStorage.removeItem(userKey);
    localStorage.removeItem(userEmailKey);
    window.location.href = 'login.html';
}

function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

async function loadCartFromServer() {
    const email = localStorage.getItem(userEmailKey);
    if (!email) return;
    try {
        const response = await fetch(`/api/cart?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (data.success) {
            cart = Array.isArray(data.cart) ? data.cart : [];
        }
    } catch {
        cart = [];
    }
    renderCart();
}

async function saveCartToServer() {
    const email = localStorage.getItem(userEmailKey);
    if (!email) return;
    
    try {
        // Convert cart object to array format expected by Node.js backend
        const cartArray = Object.entries(cart).map(([name, quantity]) => ({
            name: name,
            quantity: quantity,
            price: 0 // Price will be looked up or stored separately
        }));
        
        const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cart: cartArray })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Cart saved successfully');
        } else {
            console.warn('⚠️ Failed to save cart:', data.message);
        }
    } catch (error) {
        console.warn('Unable to save cart to server.', error);
    }
}

async function fetchReviews() {
    try {
        const response = await fetch('/api/reviews');
        const data = await response.json();
        if (data.success) {
            renderReviews(data.reviews);
        }
    } catch (error) {
        console.warn('Unable to load reviews.', error);
    }
}

function renderReviews(reviews) {
    const reviewList = document.getElementById('reviewList');
    if (!reviewList) return;
    reviewList.innerHTML = '';
    if (!Array.isArray(reviews) || reviews.length === 0) {
        reviewList.innerHTML = '<p class="cart-empty">No reviews yet. Be the first to review!</p>';
        return;
    }
    reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        reviewCard.innerHTML = `
            <p class="review-text">${review.comment}</p>
            <p class="review-meta"><strong>${review.username}</strong> • ${review.email}</p>
        `;
        reviewList.appendChild(reviewCard);
    });
}

async function addToCart(itemName, price) {
    const email = localStorage.getItem(userEmailKey);
    if (!email) {
        window.location.href = 'login.html';
        return;
    }
    const existingItem = cart.find(item => item.name === itemName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name: itemName, price, quantity: 1 });
    }

    cart[itemName] = 1;

    updateUI(itemName);

    renderCart();
    await saveCartToServer();
}
let cart = {};


function updateUI(itemName) {
    let container = document.getElementById(`cart-${itemName}`);

    container.innerHTML = `
        <div class="quantity-control">
            <button onclick="decrease('${itemName}')">-</button>
            <span id="qty-${itemName}">1</span>
            <button onclick="increase('${itemName}')">+</button>
        </div>
    `;
}

function increase(itemName) {
    cart[itemName]++;
    document.getElementById(`qty-${itemName}`).innerText = cart[itemName];
}

function decrease(itemName) {
    cart[itemName]--;

    if (cart[itemName] <= 0) {
        delete cart[itemName];

        // Back to Add to Cart button
        document.getElementById(`cart-${itemName}`).innerHTML = `
            <button class="btn btn-tertiary"
            onclick="addToCart('${itemName}', 0)">
            Add to Cart
            </button>
        `;
    } else {
        document.getElementById(`qty-${itemName}`).innerText = cart[itemName];
    }
}

async function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    await saveCartToServer();
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    if (!cartList || !cartTotal || !cartCount) return;
    cartList.innerHTML = '';
    if (cart.length === 0) {
        cartList.innerHTML = '<p class="cart-empty">Your cart is empty. Add something tasty!</p>';
        cartTotal.textContent = '₹0';
        cartCount.textContent = '0 items';
        renderPaymentOptions();
        return;
    }
    let total = 0;
    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        const itemNode = document.createElement('div');
        itemNode.className = 'cart-item';
        itemNode.innerHTML = `
            <div class="cart-item-details">
                <span class="cart-item-title">${item.name}</span>
                <span class="cart-item-meta">₹${item.price} × ${item.quantity}</span>
            </div>
            <button class="remove-btn" type="button" onclick="removeFromCart(${index})">Remove</button>
        `;
        cartList.appendChild(itemNode);
    });
    cartTotal.textContent = `₹${total}`;
    cartCount.textContent = `${cart.length} item${cart.length === 1 ? '' : 's'}`;
    renderPaymentOptions();
}

const locationData = [
    {
        id: 'bangalore',
        label: 'Bangalore, Karnataka',
        lat: 12.9716,
        lng: 77.5946,
        restaurants: [
            {
                name: 'MTR 1924',
                address: 'Church Street, Bangalore',
                cuisine: 'South Indian',
                rating: 4.5,
                menu: [
                    { name: 'Masala Dosa', price: 180, description: 'Crispy dosa with potato masala.' },
                    { name: 'Rava Idli', price: 120, description: 'Soft rava idlis with chutney.' },
                    { name: 'Kesari Bath', price: 90, description: 'Sweet semolina dessert.' }
                ]
            },
            {
                name: 'Empire Restaurant',
                address: 'Koramangala, Bangalore',
                cuisine: 'North Indian',
                rating: 4.4,
                menu: [
                    { name: 'Butter Chicken', price: 325, description: 'Creamy chicken curry with naan.' },
                    { name: 'Veg Biryani', price: 255, description: 'Aromatic vegetable biryani.' },
                    { name: 'Paneer Tikka', price: 269, description: 'Grilled paneer with spices.' }
                ]
            },
            {
                name: 'McDonald\'s',
                address: 'Indiranagar, Bangalore',
                cuisine: 'Fast Food',
                rating: 4.2,
                menu: [
                    { name: 'McAloo Tikki Burger', price: 119, description: 'Potato patty burger with fresh veggies.' },
                    { name: 'Veg Pizza McPuff', price: 99, description: 'Spicy veg puff with cheesy filling.' },
                    { name: 'McFlurry', price: 119, description: 'Creamy ice cream with mix-ins.' }
                ]
            }
        ]
    },
    {
        id: 'mumbai',
        label: 'Mumbai, Maharashtra',
        lat: 19.0760,
        lng: 72.8777,
        restaurants: [
            {
                name: 'Sardar Pav Bhaji',
                address: 'Tardeo, Mumbai',
                cuisine: 'Street Food',
                rating: 4.3,
                menu: [
                    { name: 'Pav Bhaji', price: 180, description: 'Spiced veg mash with buttered pav.' },
                    { name: 'Paneer Pav Bhaji', price: 220, description: 'Pav bhaji topped with paneer cubes.' },
                    { name: 'Masala Soda', price: 45, description: 'Refreshing spice flavored soda.' }
                ]
            },
            {
                name: 'Theobroma',
                address: 'Bandra, Mumbai',
                cuisine: 'Bakery',
                rating: 4.4,
                menu: [
                    { name: 'Chocolate Brownie', price: 175, description: 'Fudgy chocolate brownie.' },
                    { name: 'Red Velvet Cake Slice', price: 225, description: 'Creamy red velvet cake.' },
                    { name: 'Oreo Cheesecake', price: 249, description: 'Classic cheesecake with oreo.' }
                ]
            }
        ]
    },
    {
        id: 'delhi',
        label: 'Delhi',
        lat: 28.7041,
        lng: 77.1025,
        restaurants: [
            {
                name: 'Karim\'s',
                address: 'Jama Masjid, Delhi',
                cuisine: 'Mughlai',
                rating: 4.6,
                menu: [
                    { name: 'Mutton Korma', price: 420, description: 'Rich mutton curry with spices.' },
                    { name: 'Chicken Biryani', price: 340, description: 'Aromatic biryani with chicken.' },
                    { name: 'Seekh Kebab', price: 260, description: 'Juicy spiced lamb kebab.' }
                ]
            },
            {
                name: 'Haldiram\'s',
                address: 'Connaught Place, Delhi',
                cuisine: 'North Indian',
                rating: 4.2,
                menu: [
                    { name: 'Chole Bhature', price: 170, description: 'Spicy chickpeas with fried bread.' },
                    { name: 'Paneer Butter Masala', price: 260, description: 'Creamy paneer curry with rice.' },
                    { name: 'Gulab Jamun', price: 120, description: 'Sweet syrup soaked dumplings.' }
                ]
            }
        ]
    },
    {
        id: 'hyderabad',
        label: 'Hyderabad, Telangana',
        lat: 17.3850,
        lng: 78.4867,
        restaurants: [
            {
                name: 'Paradise Biryani',
                address: 'Banjara Hills, Hyderabad',
                cuisine: 'Biryani',
                rating: 4.5,
                menu: [
                    { name: 'Hyderabadi Chicken Biryani', price: 355, description: 'Signature biryani with layered rice.' },
                    { name: 'Mirchi Ka Salan', price: 165, description: 'Spicy curry with green chillies.' },
                    { name: 'Double Ka Meetha', price: 130, description: 'Sweet bread pudding.' }
                ]
            },
            {
                name: 'Chutneys',
                address: 'Banjara Hills, Hyderabad',
                cuisine: 'South Indian',
                rating: 4.3,
                menu: [
                    { name: 'Paper Masala Dosa', price: 185, description: 'Large crispy dosa with potato.' },
                    { name: 'Set Dosa', price: 155, description: 'Soft set dosas with chutney.' },
                    { name: 'Filter Coffee', price: 90, description: 'Strong South Indian coffee.' }
                ]
            }
        ]
    },
    {
        id: 'chennai',
        label: 'Chennai, Tamil Nadu',
        lat: 13.0827,
        lng: 80.2707,
        restaurants: [
            {
                name: 'Saravana Bhavan',
                address: 'T. Nagar, Chennai',
                cuisine: 'South Indian',
                rating: 4.4,
                menu: [
                    { name: 'Idli Sambhar', price: 160, description: 'Soft idlis with sambhar and chutney.' },
                    { name: 'Masala Dosa', price: 185, description: 'Crispy dosa with masala filling.' },
                    { name: 'Payasam', price: 90, description: 'Sweet rice pudding.' }
                ]
            },
            {
                name: 'Adyar Anandha Bhavan',
                address: 'Besant Nagar, Chennai',
                cuisine: 'Snacks',
                rating: 4.2,
                menu: [
                    { name: 'Uttapam', price: 145, description: 'Thick savory pancake with veggies.' },
                    { name: 'Samosa', price: 55, description: 'Crispy potato filled pastry.' },
                    { name: 'Badam Milk', price: 95, description: 'Almond flavored milk drink.' }
                ]
            }
        ]
    },
    {
        id: 'pune',
        label: 'Pune, Maharashtra',
        lat: 18.5204,
        lng: 73.8567,
        restaurants: [
            {
                name: 'Vaishali',
                address: 'FC Road, Pune',
                cuisine: 'Cafe',
                rating: 4.4,
                menu: [
                    { name: 'Aloo Tikki Burger', price: 135, description: 'Crispy patty burger with chutney.' },
                    { name: 'Cheese Sandwich', price: 140, description: 'Grilled sandwich with cheese.' },
                    { name: 'Cold Coffee', price: 110, description: 'Creamy iced coffee.' }
                ]
            },
            {
                name: 'Good Luck Cafe',
                address: 'Camp, Pune',
                cuisine: 'Maharashtrian',
                rating: 4.2,
                menu: [
                    { name: 'Mutton Thali', price: 315, description: 'Hearty mutton curry with rice.' },
                    { name: 'Chicken Fry', price: 260, description: 'Spicy fried chicken.' },
                    { name: 'Sol Kadhi', price: 95, description: 'Coconut tamarind drink.' }
                ]
            }
        ]
    },
    {
        id: 'kolkata',
        label: 'Kolkata, West Bengal',
        lat: 22.5726,
        lng: 88.3639,
        restaurants: [
            {
                name: 'Arsalan',
                address: 'Park Street, Kolkata',
                cuisine: 'Biryani',
                rating: 4.3,
                menu: [
                    { name: 'Mutton Biryani', price: 335, description: 'Spiced mutton biryani with raita.' },
                    { name: 'Chicken Chaap', price: 305, description: 'Tender chicken in rich gravy.' },
                    { name: 'Khubani Ka Meetha', price: 145, description: 'Apricot dessert.' }
                ]
            },
            {
                name: 'Keventers',
                address: 'Park Street, Kolkata',
                cuisine: 'Cafe',
                rating: 4.1,
                menu: [
                    { name: 'Blueberry Muffin', price: 129, description: 'Soft muffin with blueberry topping.' },
                    { name: 'Chicken Wrap', price: 189, description: 'Grilled chicken wrap with sauce.' },
                    { name: 'Falooda', price: 150, description: 'Sweet milk dessert drink.' }
                ]
            }
        ]
    },
    {
        id: 'ahmedabad',
        label: 'Ahmedabad, Gujarat',
        lat: 23.0225,
        lng: 72.5714,
        restaurants: [
            {
                name: 'Agashiye',
                address: 'Gujarat College, Ahmedabad',
                cuisine: 'Gujarati',
                rating: 4.6,
                menu: [
                    { name: 'Khandvi', price: 120, description: 'Soft gram flour rolls with sesame.' },
                    { name: 'Dhokla', price: 95, description: 'Steamed savory cake with chutney.' },
                    { name: 'Undhiyu', price: 220, description: 'Mixed vegetable specialty with spices.' }
                ]
            },
            {
                name: 'Gordhan Thal',
                address: 'Ambawadi Circle, Ahmedabad',
                cuisine: 'Thali',
                rating: 4.4,
                menu: [
                    { name: 'Vegetarian Thali', price: 255, description: 'Gujarati thali with rice and rotis.' },
                    { name: 'Fafda Jalebi', price: 110, description: 'Crispy snack with sweet jalebi.' },
                    { name: 'Doodhpak', price: 90, description: 'Sweet rice pudding.' }
                ]
            }
        ]
    },
    {
        id: 'jaipur',
        label: 'Jaipur, Rajasthan',
        lat: 26.9124,
        lng: 75.7873,
        restaurants: [
            {
                name: 'Laxmi Misthan Bhandar',
                address: 'Johari Bazaar, Jaipur',
                cuisine: 'Rajasthani',
                rating: 4.5,
                menu: [
                    { name: 'Dal Baati Churma', price: 275, description: 'Signature Rajasthani thali with chutney.' },
                    { name: 'Laal Maas', price: 345, description: 'Spicy mutton curry with rice.' },
                    { name: 'Malpua', price: 130, description: 'Sweet pancake dessert.' }
                ]
            },
            {
                name: 'Rawat Mishthan Bhandar',
                address: 'Station Road, Jaipur',
                cuisine: 'Street Food',
                rating: 4.3,
                menu: [
                    { name: 'Pyaz Kachori', price: 90, description: 'Flaky pastry with onion filling.' },
                    { name: 'Raj Kachori', price: 145, description: 'Chaat with sev, chutneys, and yogurt.' },
                    { name: 'Chai', price: 40, description: 'Masala tea with milk.' }
                ]
            }
        ]
    },
    {
        id: 'lucknow',
        label: 'Lucknow, Uttar Pradesh',
        lat: 26.8467,
        lng: 80.9462,
        restaurants: [
            {
                name: 'Tunday Kababi',
                address: 'Old Lucknow, Lucknow',
                cuisine: 'Awadhi',
                rating: 4.7,
                menu: [
                    { name: 'Galouti Kebab', price: 310, description: 'Soft minced meat kebabs with spices.' },
                    { name: 'Sheermal', price: 95, description: 'Sweet saffron naan.' },
                    { name: 'Kakori Kebab', price: 345, description: 'Delicate Awadhi kebab.' }
                ]
            },
            {
                name: 'Royal Cafe',
                address: 'Hazratganj, Lucknow',
                cuisine: 'Cafe',
                rating: 4.2,
                menu: [
                    { name: 'Chicken Roll', price: 160, description: 'Spiced chicken rolled in flour bread.' },
                    { name: 'Tea', price: 50, description: 'Strong masala tea.' },
                    { name: 'Biryani', price: 220, description: 'Hyderabadi-style biryani with raita.' }
                ]
            }
        ]
    },
    {
        id: 'patna',
        label: 'Patna, Bihar',
        lat: 25.5941,
        lng: 85.1376,
        restaurants: [
            {
                name: 'Pind Balluchi',
                address: 'Boring Road, Patna',
                cuisine: 'North Indian',
                rating: 4.3,
                menu: [
                    { name: 'Butter Chicken', price: 280, description: 'Creamy tomato-based chicken curry.' },
                    { name: 'Naan', price: 45, description: 'Soft Indian bread.' },
                    { name: 'Kulfi', price: 120, description: 'Indian ice cream dessert.' }
                ]
            },
            {
                name: 'Mithila Bhojanalay',
                address: 'Kankarbagh, Patna',
                cuisine: 'Bihari',
                rating: 4.1,
                menu: [
                    { name: 'Litti Chokha', price: 170, description: 'Roasted wheat balls with vegetable mash.' },
                    { name: 'Sattu Paratha', price: 95, description: 'Stuffed flatbread with spiced gram flour.' },
                    { name: 'Makhana Kheer', price: 110, description: 'Lotus seed pudding with milk.' }
                ]
            }
        ]
    },
    {
        id: 'bhopal',
        label: 'Bhopal, Madhya Pradesh',
        lat: 23.2599,
        lng: 77.4126,
        restaurants: [
            {
                name: 'Manohar Dairy',
                address: 'MP Nagar, Bhopal',
                cuisine: 'Fast Food',
                rating: 4.4,
                menu: [
                    { name: 'Poha', price: 90, description: 'Light spiced rice flakes with peanuts.' },
                    { name: 'Dabeli', price: 120, description: 'Spicy potato sandwich with chutneys.' },
                    { name: 'Jalebi', price: 85, description: 'Sweet fried spirals.' }
                ]
            },
            {
                name: '56 Dukan',
                address: 'Gufa Pahad Road, Bhopal',
                cuisine: 'Street Food',
                rating: 4.2,
                menu: [
                    { name: 'Kebab Platter', price: 280, description: 'Mixed grilled kebabs with chutney.' },
                    { name: 'Nihari', price: 260, description: 'Slow-cooked spiced stew.' },
                    { name: 'Butter Naan', price: 65, description: 'Soft naan bread.' }
                ]
            }
        ]
    },
    {
        id: 'kochi',
        label: 'Kochi, Kerala',
        lat: 9.9312,
        lng: 76.2673,
        restaurants: [
            {
                name: 'Dhe Puttu',
                address: 'Fort Kochi, Kochi',
                cuisine: 'Kerala',
                rating: 4.5,
                menu: [
                    { name: 'Puttu', price: 145, description: 'Steamed rice cake with coconut.' },
                    { name: 'Kadala Curry', price: 155, description: 'Black chickpea curry.' },
                    { name: 'Pazham Pori', price: 95, description: 'Banana fritters.' }
                ]
            },
            {
                name: 'The Rice Boat',
                address: 'Willingdon Island, Kochi',
                cuisine: 'Seafood',
                rating: 4.4,
                menu: [
                    { name: 'Fish Curry', price: 320, description: 'Spicy Kerala-style fish curry.' },
                    { name: 'Appam', price: 110, description: 'Soft rice pancakes.' },
                    { name: 'Meen Pollichathu', price: 360, description: 'Grilled fish wrapped in banana leaf.' }
                ]
            }
        ]
    },
    {
        id: 'guwahati',
        label: 'Guwahati, Assam',
        lat: 26.1445,
        lng: 91.7362,
        restaurants: [
            {
                name: 'Bamboo Hut',
                address: 'GS Road, Guwahati',
                cuisine: 'Assamese',
                rating: 4.3,
                menu: [
                    { name: 'Assam Laksa', price: 210, description: 'Tangy noodle soup with fish.' },
                    { name: 'Khaar', price: 170, description: 'Traditional alkaline curry.' },
                    { name: 'Duck Curry', price: 320, description: 'Spicy duck gravy with rice.' }
                ]
            },
            {
                name: 'Paradise Cafe',
                address: 'Paltan Bazaar, Guwahati',
                cuisine: 'Cafe',
                rating: 4.1,
                menu: [
                    { name: 'Tea', price: 45, description: 'Strong Assam tea.' },
                    { name: 'Samosa', price: 55, description: 'Crispy snack with potato filling.' },
                    { name: 'Paneer Wrap', price: 165, description: 'Fresh paneer with veggies and sauce.' }
                ]
            }
        ]
    },
    {
        id: 'silchar',
        label: 'Silchar, Assam',
        lat: 24.8333,
        lng: 92.7786,
        restaurants: [
            {
                name: 'NIT Silchar Mess',
                address: 'NIT Silchar Campus, Silchar',
                cuisine: 'Local Indian',
                rating: 4.2,
                menu: [
                    { name: 'Chicken Thali', price: 210, description: 'Mixed platter with rice, curry, and sides.' },
                    { name: 'Veg Thali', price: 180, description: 'Seasonal vegetable curry with rice and roti.' },
                    { name: 'Tea', price: 40, description: 'Hot masala tea.' }
                ]
            },
            {
                name: 'Silchar Street Eats',
                address: 'Barak Valley Road, Silchar',
                cuisine: 'Street Food',
                rating: 4.1,
                menu: [
                    { name: 'Kebab Roll', price: 120, description: 'Spiced kebab wrapped in paratha.' },
                    { name: 'Chai', price: 35, description: 'Strong Assam tea.' },
                    { name: 'Jalebi', price: 70, description: 'Sweet fried dessert.' }
                ]
            }
        ]
    },
    {
        id: 'chandigarh',
        label: 'Chandigarh',
        lat: 30.7333,
        lng: 76.7794,
        restaurants: [
            {
                name: 'Blackberrys',
                address: 'Sector 17, Chandigarh',
                cuisine: 'Indian',
                rating: 4.4,
                menu: [
                    { name: 'Paneer Butter Masala', price: 265, description: 'Creamy paneer curry with naan.' },
                    { name: 'Chole Bhature', price: 180, description: 'Spiced chickpeas with fried bread.' },
                    { name: 'Lassi', price: 95, description: 'Sweet yogurt drink.' }
                ]
            },
            {
                name: 'Pal Dhaba',
                address: 'Sector 28, Chandigarh',
                cuisine: 'Punjabi',
                rating: 4.3,
                menu: [
                    { name: 'Dal Makhani', price: 220, description: 'Slow-cooked lentils with butter.' },
                    { name: 'Tandoori Chicken', price: 360, description: 'Marinated grilled chicken.' },
                    { name: 'Butter Naan', price: 65, description: 'Soft baked bread.' }
                ]
            }
        ]
    }
];

const locationKeywordMap = {
    bangalore: ['bangalore', 'bengaluru', 'karnataka', 'koramangala', 'indiranagar', 'whitefield', 'electronic city', 'jayanagar'],
    mumbai: ['mumbai', 'maharashtra', 'bandra', 'colaba', 'andheri', 'powai', 'dadar', 'thane', 'navi mumbai'],
    delhi: ['delhi', 'new delhi', 'ncr', 'gurgaon', 'gurugram', 'noida', 'ghaziabad', 'faridabad', 'connaught', 'karol', 'chandni'],
    hyderabad: ['hyderabad', 'telangana', 'banjara hills', 'gachibowli', 'hitech city', 'jubilee hills', 'secunderabad'],
    chennai: ['chennai', 'tamil nadu', 't nagar', 'adyar', 'anna nagar', 'velachery', 'omr', 'guindy'],
    pune: ['pune', 'maharashtra', 'fc road', 'camp', 'wadgaon', 'hinjewadi', 'pimpri', 'chinchwad', 'viman nagar'],
    kolkata: ['kolkata', 'west bengal', 'park street', 'salt lake', 'behala', 'howrah', 'sealdah', 'dumdum'],
    ahmedabad: ['ahmedabad', 'gujarat', 'gandhinagar', 'satellite', 'maninagar', 'sg highway'],
    jaipur: ['jaipur', 'rajasthan', 'amer', 'jhotwara', 'malviya nagar'],
    lucknow: ['lucknow', 'uttar pradesh', 'gomti nagar', 'hazratganj', 'indira nagar'],
    patna: ['patna', 'bihar', 'kankarbagh', 'new market'],
    bhopal: ['bhopal', 'madhya pradesh', 'mp', 'kolar road', 'habibganj'],
    kochi: ['kochi', 'kerala', 'ernakulam', 'fort kochi', 'alappuzha', 'maradu'],
    guwahati: ['guwahati', 'assam', 'dispur', 'japorigog', 'umiam'],
    silchar: ['silchar', 'barak valley', 'assam', 'nit silchar', 'sadar', 'karimganj'],
    chandigarh: ['chandigarh', 'punjab', 'haryana', 'panchkula', 'mohali']
};

const stateToLocationId = {
    'karnataka': 'bangalore',
    'maharashtra': 'mumbai',
    'tamil nadu': 'chennai',
    'telangana': 'hyderabad',
    'west bengal': 'kolkata',
    'gujarat': 'ahmedabad',
    'rajasthan': 'jaipur',
    'uttar pradesh': 'lucknow',
    'bihar': 'patna',
    'madhya pradesh': 'bhopal',
    'kerala': 'kochi',
    'assam': 'guwahati',
    'punjab': 'chandigarh',
    'haryana': 'chandigarh',
    'chandigarh': 'chandigarh',
    'goa': 'mumbai',
    'odisha': 'kolkata',
    'jharkhand': 'patna',
    'chhattisgarh': 'bhopal',
    'uttarakhand': 'delhi',
    'himachal pradesh': 'delhi',
    'jammu and kashmir': 'delhi',
    'jammu': 'delhi',
    'andhra pradesh': 'hyderabad',
    'arunachal pradesh': 'guwahati',
    'meghalaya': 'guwahati',
    'manipur': 'guwahati',
    'mizoram': 'guwahati',
    'nagaland': 'guwahati',
    'sikkim': 'kolkata',
    'tripura': 'kolkata',
    'andaman and nicobar islands': 'chennai',
    'dadra and nagar haveli': 'mumbai',
    'daman and diu': 'mumbai',
    'puducherry': 'chennai',
    'lakshadweep': 'kochi'
};

const additionalLocationSuggestions = [
    'Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata',
    'Ahmedabad', 'Jaipur', 'Lucknow', 'Patna', 'Bhopal', 'Kochi', 'Guwahati', 'Chandigarh',
    'Bengaluru', 'Thiruvananthapuram', 'Visakhapatnam', 'Nagpur', 'Surat', 'Indore', 'Kanpur',
    'Varanasi', 'Agra', 'Mysore', 'Coimbatore', 'Madurai', 'Jammu', 'Leh', 'Gangtok', 'Imphal',
    'Silchar', 'Barak Valley',
    'Aizawl', 'Kohima', 'Shimla', 'Dehradun', 'Panaji', 'Bhubaneswar', 'Ranchi', 'Raipur',
    'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat', 'Rajasthan',
    'Uttar Pradesh', 'Bihar', 'Madhya Pradesh', 'Kerala', 'Assam', 'Punjab', 'Haryana',
    'Odisha', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand', 'Himachal Pradesh', 'Jammu and Kashmir',
    'Andhra Pradesh', 'Arunachal Pradesh', 'Meghalaya', 'Manipur', 'Mizoram', 'Nagaland',
    'Sikkim', 'Tripura', 'Goa', 'Puducherry', 'Dadra and Nagar Haveli', 'Daman and Diu',
    'Andaman and Nicobar Islands', 'Lakshadweep'
];

const restaurantLocations = [
    {
        name: 'Food Express Central Kitchen',
        address: 'NIT Silchar Campus, Silchar',
        lat: 12.9716,
        lng: 77.5946,
        rating: 4.9,
        cuisine: 'Mixed Indian & Fast Food',
        menu: [
            { name: 'Margherita Pizza', price: 299, description: 'Classic cheese pizza with basil.' },
            { name: 'Paneer Biryani', price: 299, description: 'Spiced paneer with saffron rice.' },
            { name: 'Chocolate Lava Cake', price: 179, description: 'Warm molten chocolate delight.' }
        ]
    },
    {
        name: 'City Center Pizza House',
        address: '220 Spice Street, Downtown',
        lat: 12.9728,
        lng: 77.5894,
        rating: 4.7,
        cuisine: 'Pizza & Italian',
        menu: [
            { name: 'Pepperoni Pizza', price: 349, description: 'Spicy pepperoni and extra cheese.' },
            { name: 'Garlic Breadsticks', price: 129, description: 'Buttery garlic toast with herbs.' },
            { name: 'Chocolate Brownie', price: 149, description: 'Rich brownie with vanilla ice cream.' }
        ]
    },
    {
        name: 'Biryani Express',
        address: '18 Curry Avenue, Market Area',
        lat: 12.9682,
        lng: 77.5975,
        rating: 4.8,
        cuisine: 'Indian Biryani',
        menu: [
            { name: 'Chicken Biryani', price: 319, description: 'Fragrant rice with tender chicken.' },
            { name: 'Veg Biryani', price: 279, description: 'Aromatic vegetables and spices.' },
            { name: 'Gulab Jamun', price: 149, description: 'Sweet syrup-soaked dumplings.' }
        ]
    },
    {
        name: 'Sweet Treats Bakery',
        address: '45 Dessert Road, Food Park',
        lat: 12.9753,
        lng: 77.6009,
        rating: 4.6,
        cuisine: 'Desserts & Snacks',
        menu: [
            { name: 'Fruit Parfait', price: 159, description: 'Layered yogurt, berries and granola.' },
            { name: 'Strawberry Cheesecake', price: 199, description: 'Creamy cheesecake with fresh berries.' },
            { name: 'Vanilla Cupcake', price: 119, description: 'Soft cupcake with buttercream frosting.' }
        ]
    }
];

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
    const earthRadiusKm = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
        * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

function formatDistance(distanceKm) {
    if (distanceKm < 1) {
        return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
}

function estimateDeliveryMinutes(distanceKm) {
    const speedKmh = 30;
    const travelMinutes = distanceKm / (speedKmh / 60);
    return Math.max(10, Math.round(travelMinutes + 5));
}

function updateNearbyStatus(message, isError = false) {
    const statusElement = document.getElementById('nearbyStatus');
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.style.color = isError ? '#cc1f1f' : '#4a4a4a';
}

function updateLocationMessage(message, isError = false) {
    const statusElement = document.getElementById('locationMessage');
    if (!statusElement) return;
    statusElement.textContent = message;
    statusElement.style.color = isError ? '#cc1f1f' : '#4a4a4a';
}

function getSavedLocation() {
    const lat = localStorage.getItem('foodExpressLat');
    const lng = localStorage.getItem('foodExpressLng');
    if (!lat || !lng) return null;
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
}

function saveUserLocation(lat, lng) {
    localStorage.setItem('foodExpressLat', lat);
    localStorage.setItem('foodExpressLng', lng);
}

function populateLocationSuggestions() {
    const datalist = document.getElementById('locationSuggestions');
    if (!datalist) return;
    datalist.innerHTML = '';
    const suggestionValues = new Set();
    locationData.forEach(location => {
        suggestionValues.add(location.label);
        suggestionValues.add(location.label.split(',')[0]);
    });
    Object.values(locationKeywordMap).forEach(aliasList => {
        aliasList.forEach(alias => suggestionValues.add(alias));
    });
    additionalLocationSuggestions.forEach(value => suggestionValues.add(value));
    suggestionValues.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        datalist.appendChild(option);
    });
}

function findLocationData(value) {
    const text = String(value).trim().toLowerCase();
    if (!text) return null;

    const exactMatch = locationData.find(location => location.label.toLowerCase() === text || location.id === text);
    if (exactMatch) return exactMatch;

    for (const [locationId, aliases] of Object.entries(locationKeywordMap)) {
        if (aliases.some(alias => text.includes(alias))) {
            const matchedLocation = locationData.find(location => location.id === locationId);
            if (matchedLocation) return matchedLocation;
        }
    }

    for (const [stateName, locationId] of Object.entries(stateToLocationId)) {
        if (text.includes(stateName)) {
            const matchedLocation = locationData.find(location => location.id === locationId);
            if (matchedLocation) return matchedLocation;
        }
    }

    return null;
}

function setManualLocation() {
    const locationInput = document.getElementById('locationInput');
    const locationInfo = document.getElementById('locationInfo');
    if (!locationInput || !locationInfo) return;
    const locationValue = locationInput.value.trim();
    if (!locationValue) {
        locationInfo.textContent = 'Please enter a location name or address.';
        locationInfo.style.color = '#cc1f1f';
        return;
    }
    const resolvedLocation = findLocationData(locationValue);
    if (resolvedLocation) {
        saveUserLocation(resolvedLocation.lat, resolvedLocation.lng);
        locationInfo.textContent = `Location set to ${resolvedLocation.label}. Nearby restaurants are now available.`;
        locationInfo.style.color = '#4a4a4a';
        renderNearbyRestaurants(resolvedLocation.lat, resolvedLocation.lng, resolvedLocation.restaurants);
    } else {
        locationInfo.textContent = `We couldn't match "${locationValue}" to a city yet. Showing nearby restaurants from Bangalore as fallback.`;
        locationInfo.style.color = '#4a4a4a';
        const fallback = locationData.find(location => location.id === 'bangalore');
        if (fallback) {
            saveUserLocation(fallback.lat, fallback.lng);
            renderNearbyRestaurants(fallback.lat, fallback.lng, fallback.restaurants);
        }
    }
}

function updateHomeHero(loggedIn) {
    const title = document.getElementById('heroTitle');
    const text = document.getElementById('heroText');
    const primary = document.getElementById('heroPrimaryBtn');
    const secondary = document.getElementById('heroSecondaryBtn');
    if (!title || !text || !primary || !secondary) return;
    if (loggedIn) {
        title.textContent = 'Welcome back to Food Express';
        text.textContent = 'Your account home is ready. Browse nearby restaurants, tiffins, lunch, dinner and desserts.';
        primary.textContent = 'Browse Menu';
        primary.href = '#menu';
        secondary.textContent = 'View Nearby';
        secondary.href = '#nearby';
    } else {
        title.textContent = 'Sign in to explore local restaurants and tasty dishes.';
        text.textContent = 'Enter your location or use your browser location to discover nearby food picks, popular categories, and new menu choices.';
        primary.textContent = 'Sign In';
        primary.href = 'login.html';
        secondary.textContent = 'See popular dishes';
        secondary.href = '#featured';
    }
    setHeroCardContent(loggedIn);
}

function setHeroCardContent(loggedIn) {
    const heroCardText = document.getElementById('heroCardText');
    const heroCardBadge = document.getElementById('heroCardBadge');
    if (!heroCardText || !heroCardBadge) return;
    if (loggedIn) {
        const username = localStorage.getItem(userKey) || 'Friend';
        heroCardText.textContent = `${username}, reserve your favorite meals for tiffins, lunch, dinner, and desserts.`;
        heroCardBadge.innerHTML = `<button class="btn btn-primary" type="button" onclick="window.location.href='#menu'">Order Now</button>`;
    } else {
        heroCardText.textContent = 'Sign in to reserve your favorite meals for tiffins, lunch, dinner, and desserts.';
        heroCardBadge.textContent = 'Sign In & Order';
    }
}

function renderRestaurantMenu(menuItems) {
    return menuItems.map(item => `
        <li>${item.name} — ₹${item.price}<span>: ${item.description}</span></li>
    `).join('');
}

function renderPaymentOptions() {
    const paymentSection = document.getElementById('paymentSection');
    const paymentMessage = document.getElementById('paymentMessage');
    if (!paymentSection || !paymentMessage) return;
    if (cart.length === 0) {
        paymentSection.innerHTML = '';
        paymentMessage.textContent = 'Choose a payment method after adding items to your cart.';
        return;
    }
    paymentSection.innerHTML = `
        <div class="payment-options">
            <label><input type="radio" name="paymentMethod" value="upi" checked> UPI</label>
            <label><input type="radio" name="paymentMethod" value="card"> Credit / Debit Card</label>
            <label><input type="radio" name="paymentMethod" value="cod"> Cash on Delivery</label>
        </div>
    `;
    paymentMessage.textContent = 'Select your payment method and click Checkout to place the order.';
}

function renderNearbyRestaurants(userLat, userLng, restaurants = restaurantLocations) {
    const restaurantList = document.getElementById('restaurantList');
    if (!restaurantList) return;

    const nearby = restaurants
        .map((restaurant, index) => {
            const restaurantLat = restaurant.lat ?? (userLat + 0.004 * (index + 1));
            const restaurantLng = restaurant.lng ?? (userLng + 0.003 * (index + 1));
            const distanceKm = calculateDistanceKm(userLat, userLng, restaurantLat, restaurantLng);
            return {
                ...restaurant,
                distanceKm,
                distanceText: formatDistance(distanceKm),
                etaMinutes: estimateDeliveryMinutes(distanceKm)
            };
        })
        .filter(restaurant => restaurant.distanceKm <= 10)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    if (nearby.length === 0) {
        updateNearbyStatus('No restaurants found within 10 km. Showing popular nearby restaurants instead.');
        const fallback = restaurantLocations
            .map(restaurant => ({
                ...restaurant,
                distanceKm: calculateDistanceKm(userLat, userLng, restaurant.lat, restaurant.lng),
                distanceText: formatDistance(calculateDistanceKm(userLat, userLng, restaurant.lat, restaurant.lng)),
                etaMinutes: estimateDeliveryMinutes(calculateDistanceKm(userLat, userLng, restaurant.lat, restaurant.lng))
            }))
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 3);
        restaurantList.innerHTML = '';
        fallback.forEach(restaurant => {
            const card = document.createElement('article');
            card.className = 'restaurant-card';
            card.innerHTML = `
                <h3>${restaurant.name}</h3>
                <p>${restaurant.address}</p>
                <p>${restaurant.cuisine}</p>
                <div class="restaurant-meta">
                    <span>${restaurant.distanceText} away</span>
                    <span>ETA ${restaurant.etaMinutes} min</span>
                    <span>Rating ${restaurant.rating.toFixed(1)}</span>
                </div>
                <ul class="restaurant-menu">
                    ${renderRestaurantMenu(restaurant.menu)}
                </ul>
            `;
            restaurantList.appendChild(card);
        });
        return;
    }

    updateNearbyStatus('Nearby restaurants within 10 km are listed below.');
    restaurantList.innerHTML = '';
    nearby.forEach(restaurant => {
        const card = document.createElement('article');
        card.className = 'restaurant-card';
        card.innerHTML = `
            <h3>${restaurant.name}</h3>
            <p>${restaurant.address}</p>
            <p>${restaurant.cuisine}</p>
            <div class="restaurant-meta">
                <span>${restaurant.distanceText} away</span>
                <span>ETA ${restaurant.etaMinutes} min</span>
                <span>Rating ${restaurant.rating.toFixed(1)}</span>
            </div>
            <ul class="restaurant-menu">
                ${renderRestaurantMenu(restaurant.menu)}
            </ul>
        `;
        restaurantList.appendChild(card);
    });
}

function requestUserLocation() {
    const locationMessage = document.getElementById('locationMessage');
    if (!navigator.geolocation) {
        updateLocationMessage('Geolocation is not supported by your browser.', true);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            saveUserLocation(position.coords.latitude, position.coords.longitude);
            updateLocationMessage('Location saved. Nearby restaurants will appear after login.');
        },
        error => {
            updateLocationMessage('Please allow location access to see nearby restaurants after login.', true);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
        }
    );
}

function requestNearbyRestaurants() {
    const existingLocation = getSavedLocation();
    if (existingLocation) {
        const matchedLocation = locationData.find(location => calculateDistanceKm(existingLocation.lat, existingLocation.lng, location.lat, location.lng) <= 20);
        renderNearbyRestaurants(existingLocation.lat, existingLocation.lng, matchedLocation ? matchedLocation.restaurants : restaurantLocations);
        return;
    }

    const restaurantList = document.getElementById('restaurantList');
    if (!navigator.geolocation) {
        updateNearbyStatus('Geolocation is not supported by your browser.');
        if (restaurantList) {
            restaurantList.innerHTML = '<p class="cart-empty">Your browser does not support location services.</p>';
        }
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            saveUserLocation(position.coords.latitude, position.coords.longitude);
            const matchedLocation = locationData.find(location => {
                const distance = calculateDistanceKm(position.coords.latitude, position.coords.longitude, location.lat, location.lng);
                return distance <= 20;
            });
            if (matchedLocation) {
                renderNearbyRestaurants(matchedLocation.lat, matchedLocation.lng, matchedLocation.restaurants);
            } else {
                renderNearbyRestaurants(position.coords.latitude, position.coords.longitude);
            }
        },
        error => {
            updateNearbyStatus('Enable location access to find nearby restaurants.', true);
            if (restaurantList) {
                restaurantList.innerHTML = '<p class="cart-empty">Location access denied. Allow location to show nearby restaurants.</p>';
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000
        }
    );
}

async function checkoutCart() {
    if (cart.length === 0) {
        alert('Add items to cart before checkout.');
        return;
    }
    const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'upi';
    const username = localStorage.getItem(userKey) || 'Guest';
    const methodLabel = paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI';
    alert(`Thank you, ${username}! Your ${methodLabel} order for ${cart.length} item${cart.length === 1 ? '' : 's'} has been placed.`);
    const profile = getSavedProfile();
    const orderItems = cart.map(item => `${item.quantity}× ${item.name}`);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    profile.orders.push({
        title: `Order #${profile.orders.length + 1}`,
        items: orderItems,
        total,
        time: Date.now(),
        status: 'Confirmed',
        paymentMethod: methodLabel
    });
    saveProfile(profile);
    cart = [];
    renderCart();
    renderPaymentOptions();
    await saveCartToServer();
}

async function sendOtp() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const otpMessage = document.getElementById('otpMessage');
    const otpInput = document.getElementById('otp');
    
    if (!usernameInput || !emailInput || !otpMessage || !otpInput) {
        console.error('❌ Form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    
    console.log(`📝 Send OTP - Username: ${username}, Email: ${email}`);
    
    // Validate username
    if (!username) {
        otpMessage.textContent = 'Please enter your username.';
        otpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Username is empty');
        return;
    }
    
    // Validate email
    if (!email) {
        otpMessage.textContent = 'Please enter your email address.';
        otpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Email is empty');
        return;
    }
    
    // Better email regex validation
    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        otpMessage.textContent = 'Enter a valid email address (e.g., user@example.com)';
        otpMessage.style.color = '#cc1f1f';
        console.warn(`⚠️ Invalid email format: ${email}`);
        return;
    }
    
    console.log(`✅ Validation passed, sending OTP request...`);
    otpMessage.textContent = 'Sending OTP...';
    otpMessage.style.color = '#666';
    
    try {
        const response = await fetch('/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
        
        if (!response) {
            throw new Error('No response from server');
        }
        
        const data = await response.json();
        console.log(`📧 Server response:`, data);
        
        otpMessage.textContent = data.message;
        otpMessage.style.color = data.success ? '#1d7a1d' : '#cc1f1f';
        
        if (data.success) {
            console.log(`✅ OTP sent successfully to ${email}`);
            otpInput.focus();
        } else {
            console.error(`❌ OTP sending failed: ${data.message}`);
        }
    } catch (error) {
        otpMessage.textContent = 'Server unavailable. Make sure the backend is running and reload the page.';
        otpMessage.style.color = '#cc1f1f';
        console.error('❌ Fetch error:', error);
    }
}

async function verifyOtp() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const otpInput = document.getElementById('otp');
    const otpMessage = document.getElementById('otpMessage');
    
    if (!usernameInput || !emailInput || !passwordInput || !otpInput || !otpMessage) {
        console.error('❌ Form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const otp = otpInput.value.trim();
    
    console.log(`🔐 Verify OTP - Username: ${username}, Email: ${email}, OTP: ${otp}`);
    
    // Validate all fields
    if (!username) {
        otpMessage.textContent = 'Please enter your username.';
        otpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Username is empty');
        return;
    }
    
    if (!email) {
        otpMessage.textContent = 'Please enter your email address.';
        otpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Email is empty');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        otpMessage.textContent = 'Enter a valid email address.';
        otpMessage.style.color = '#cc1f1f';
        console.warn(`⚠️ Invalid email format: ${email}`);
        return;
    }
    
    if (!password) {
        otpMessage.textContent = 'Please enter your password.';
        otpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Password is empty');
        return;
    }
    
    // Validate OTP is 6 digits
    if (!/^\d{6}$/.test(otp)) {
        otpMessage.textContent = 'OTP must be exactly 6 digits.';
        otpMessage.style.color = '#cc1f1f';
        console.warn(`⚠️ Invalid OTP format: ${otp}`);
        return;
    }
    
    console.log(`✅ All validations passed, verifying OTP...`);
    otpMessage.textContent = 'Verifying OTP...';
    otpMessage.style.color = '#666';
    
    try {
        const response = await fetch('/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, otp })
        });
        
        if (!response) {
            throw new Error('No response from server');
        }
        
        const data = await response.json();
        console.log(`📧 Server response:`, data);
        
        otpMessage.textContent = data.message;
        otpMessage.style.color = data.success ? '#1d7a1d' : '#cc1f1f';
        
        if (data.success) {
            console.log(`✅ OTP verified and login successful!`);
            otpMessage.textContent = 'Login successful! Redirecting...';
            otpMessage.style.color = '#1d7a1d';
            
            // Store user info in localStorage
            localStorage.setItem(userKey, username);
            localStorage.setItem(userEmailKey, email);
            ensureLocalProfile(username, email);
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            console.error(`❌ Login failed: ${data.message}`);
            otpMessage.textContent = `Login failed: ${data.message}`;
            otpMessage.style.color = '#cc1f1f';
        }
    } catch (error) {
        otpMessage.textContent = 'Server error. Make sure the backend is running on localhost:3000 and reload the page.';
        otpMessage.style.color = '#cc1f1f';
        console.error('❌ OTP verification error:', error);
    }
}

async function submitReview() {
    const reviewInput = document.getElementById('reviewText');
    const reviewMessage = document.getElementById('reviewMessage');
    const username = localStorage.getItem(userKey);
    const email = localStorage.getItem(userEmailKey);
    
    if (!reviewInput || !reviewMessage || !username || !email) {
        return;
    }
    
    const comment = reviewInput.value.trim();
    if (!comment) {
        reviewMessage.textContent = 'Please write your review before submitting.';
        reviewMessage.style.color = '#cc1f1f';
        return;
    }
    
    reviewMessage.textContent = 'Submitting review...';
    reviewMessage.style.color = '#666';
    
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, comment })
        });
        
        const data = await response.json();
        
        if (data.success) {
            reviewMessage.textContent = '✅ Review submitted successfully!';
            reviewMessage.style.color = '#1d7a1d';
            reviewInput.value = '';
            fetchReviews();
        } else {
            reviewMessage.textContent = `Failed to submit review: ${data.message}`;
            reviewMessage.style.color = '#cc1f1f';
        }
    } catch (error) {
        reviewMessage.textContent = 'Unable to submit review. Make sure backend is running.';
        reviewMessage.style.color = '#cc1f1f';
        console.error('Review submission error:', error);
    }
}

async function initPage() {
    updateUserNav();
    const loggedIn = Boolean(localStorage.getItem(userKey));
    const path = window.location.pathname.toLowerCase();
    const isHome = path === '/' || path.endsWith('/index.html');
    const isLogin = path.endsWith('/login.html');
    const isAccount = path.endsWith('/account.html');
    populateLocationSuggestions();
    if (isHome) {
        updateHomeHero(loggedIn);
        if (loggedIn) {
            await updateUserProfile();
            await loadCartFromServer();
            await fetchReviews();
            requestNearbyRestaurants();
        } else {
            const existingLocation = getSavedLocation();
            if (existingLocation) {
                renderNearbyRestaurants(existingLocation.lat, existingLocation.lng);
            } else {
                updateNearbyStatus('Enter your location or use your browser location to find nearby restaurants.');
                const locationInfo = document.getElementById('locationInfo');
                if (locationInfo) {
                    locationInfo.textContent = 'Enter your location or use browser location to see nearby restaurant options.';
                    locationInfo.style.color = '#4a4a4a';
                }
            }
        }
        renderPaymentOptions();
    }
    if (isAccount) {
        if (!loggedIn) {
            window.location.href = 'login.html';
            return;
        }
        ensureLocalProfile(localStorage.getItem(userKey) || 'Guest', localStorage.getItem(userEmailKey) || 'guest@foodexpress.com');
        renderAccountPage();
    }
    if (isLogin) {
        if (loggedIn) {
            window.location.href = 'index.html';
            return;
        }
        requestUserLocation();
    }
}

document.addEventListener('DOMContentLoaded', initPage);
