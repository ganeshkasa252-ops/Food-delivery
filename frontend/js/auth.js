const userKey = 'foodExpressUser';
const userEmailKey = 'foodExpressEmail';

// ======================== LOGIN FUNCTION (WITHOUT OTP) ========================

async function login() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginMessage = document.getElementById('loginMessage');
    
    if (!usernameInput || !passwordInput || !loginMessage) {
        console.error('❌ Form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log(`🔐 Login - Username: ${username}`);
    
    // Validate
    if (!username) {
        loginMessage.textContent = 'Please enter your username.';
        loginMessage.style.color = '#cc1f1f';
        return;
    }
    
    if (!password) {
        loginMessage.textContent = 'Please enter your password.';
        loginMessage.style.color = '#cc1f1f';
        return;
    }
    
    loginMessage.textContent = 'Logging in...';
    loginMessage.style.color = '#666';
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!response) {
            throw new Error('No response from server');
        }
        
        const data = await response.json();
        console.log(`📧 Server response:`, data);
        
        if (data.success) {
            console.log(`✅ Login successful!`);
            loginMessage.textContent = 'Login successful! Redirecting...';
            loginMessage.style.color = '#1d7a1d';
            
            // Store user info
            localStorage.setItem('foodExpressUser', JSON.stringify({ username, email: data.user.email }));
            localStorage.setItem('foodExpressEmail', data.user.email);
            localStorage.setItem('foodExpressToken', data.token);
            
            if (typeof ensureLocalProfile === 'function') {
                ensureLocalProfile(username, data.email);
            }
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            loginMessage.textContent = data.message || 'Login failed.';
            loginMessage.style.color = '#cc1f1f';
            console.error(`❌ Login failed: ${data.message}`);
        }
    } catch (error) {
        loginMessage.textContent = 'Server error. Make sure backend is running.';
        loginMessage.style.color = '#cc1f1f';
        console.error('❌ Login error:', error);
    }
}

// ======================== REGISTRATION FUNCTIONS ========================

async function sendRegisterOtp() {
    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const regOtpMessage = document.getElementById('regOtpMessage');
    const regOtpInput = document.getElementById('reg-otp');
    
    if (!usernameInput || !emailInput || !passwordInput || !regOtpMessage || !regOtpInput) {
        console.error('❌ Form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    
    console.log(`📝 Send Register OTP - Username: ${username}, Email: ${email}`);
    
    // Validate username
    if (!username) {
        regOtpMessage.textContent = 'Please enter a username.';
        regOtpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Username is empty');
        return;
    }
    
    if (username.length < 3) {
        regOtpMessage.textContent = 'Username must be at least 3 characters.';
        regOtpMessage.style.color = '#cc1f1f';
        return;
    }
    
    // Validate email
    if (!email) {
        regOtpMessage.textContent = 'Please enter your email address.';
        regOtpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Email is empty');
        return;
    }
    
    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        regOtpMessage.textContent = 'Enter a valid email address (e.g., user@example.com)';
        regOtpMessage.style.color = '#cc1f1f';
        console.warn(`⚠️ Invalid email format: ${email}`);
        return;
    }
    
    // Validate password
    if (!password) {
        regOtpMessage.textContent = 'Please enter a password.';
        regOtpMessage.style.color = '#cc1f1f';
        console.warn('⚠️ Password is empty');
        return;
    }
    
    if (password.length < 6) {
        regOtpMessage.textContent = 'Password must be at least 6 characters.';
        regOtpMessage.style.color = '#cc1f1f';
        return;
    }
    
    console.log(`✅ Validation passed, sending OTP request...`);
    regOtpMessage.textContent = 'Sending OTP...';
    regOtpMessage.style.color = '#666';
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });
        
        if (!response) {
            throw new Error('No response from server');
        }
        
        const data = await response.json();
        console.log(`📧 Server response:`, data);
        
        regOtpMessage.textContent = data.message;
        regOtpMessage.style.color = data.success !== false ? '#1d7a1d' : '#cc1f1f';
        
        if (data.success !== false) {
            console.log(`✅ OTP sent successfully to ${email}`);
            regOtpInput.focus();
        }
    } catch (error) {
        regOtpMessage.textContent = 'Server error. Make sure the backend is running on localhost:5000 and reload the page.';
        regOtpMessage.style.color = '#cc1f1f';
        console.error('❌ Fetch error:', error);
    }
}

async function verifyRegisterOtp() {
    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const regOtpInput = document.getElementById('reg-otp');
    const regOtpMessage = document.getElementById('regOtpMessage');
    
    if (!usernameInput || !emailInput || !passwordInput || !regOtpInput || !regOtpMessage) {
        console.error('❌ Form elements not found');
        return;
    }
    
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const otp = regOtpInput.value.trim();
    
    console.log(`🔐 Verify Register OTP - Username: ${username}, Email: ${email}, OTP: ${otp}`);
    
    // Validate all fields
    if (!username || !email || !password || !otp) {
        regOtpMessage.textContent = 'Please fill in all fields.';
        regOtpMessage.style.color = '#cc1f1f';
        return;
    }
    
    if (!/^\d{6}$/.test(otp)) {
        regOtpMessage.textContent = 'OTP must be exactly 6 digits.';
        regOtpMessage.style.color = '#cc1f1f';
        console.warn(`⚠️ Invalid OTP format: ${otp}`);
        return;
    }
    
    console.log(`✅ All validations passed, verifying OTP...`);
    regOtpMessage.textContent = 'Creating account...';
    regOtpMessage.style.color = '#666';
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, otp })
        });
        
        if (!response) {
            throw new Error('No response from server');
        }
        
        const data = await response.json();
        console.log(`📧 Server response:`, data);
        
        regOtpMessage.textContent = data.message;
        regOtpMessage.style.color = data.success ? '#1d7a1d' : '#cc1f1f';
        
        if (data.success) {
            console.log(`✅ Account created successfully!`);
            regOtpMessage.textContent = 'Account created! Redirecting to home...';
            regOtpMessage.style.color = '#1d7a1d';
            
            // Store user info
            if (data.token) {
                localStorage.setItem('foodExpressToken', data.token);
            }
            if (data.user) {
                localStorage.setItem(userKey, data.user.username);
                localStorage.setItem(userEmailKey, data.user.email);
            }
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            console.error(`❌ Registration failed: ${data.message}`);
            regOtpMessage.textContent = `Registration failed: ${data.message}`;
            regOtpMessage.style.color = '#cc1f1f';
        }
    } catch (error) {
        regOtpMessage.textContent = 'Server error. Make sure the backend is running on localhost:5000 and reload the page.';
        regOtpMessage.style.color = '#cc1f1f';
        console.error('❌ Registration error:', error);
    }
}
