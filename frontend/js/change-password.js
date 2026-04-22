let changePasswordState = {
    username: null,
    email: null,
    otp: null,
    otpExpiry: null
};

function showStep(stepNumber) {
    document.getElementById('step1-verify').style.display = stepNumber === 1 ? 'block' : 'none';
    document.getElementById('step2-otp').style.display = stepNumber === 2 ? 'block' : 'none';
    document.getElementById('step3-password').style.display = stepNumber === 3 ? 'block' : 'none';
}

function updateMessage(stepNumber, text, color = '#666') {
    const messageId = `step${stepNumber}Message`;
    const message = document.getElementById(messageId);
    if (message) {
        message.textContent = text;
        message.style.color = color;
    }
}

async function sendPasswordResetOtp() {
    const username = document.getElementById('cp-username').value.trim();
    const email = document.getElementById('cp-email').value.trim().toLowerCase();

    console.log(`📝 Send Password Reset OTP - Username: ${username}, Email: ${email}`);

    // Validate
    if (!username) {
        updateMessage(1, 'Please enter your username.', '#cc1f1f');
        return;
    }

    if (!email) {
        updateMessage(1, 'Please enter your email address.', '#cc1f1f');
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        updateMessage(1, 'Enter a valid email address.', '#cc1f1f');
        return;
    }

    updateMessage(1, 'Sending OTP...', '#3498db');

    try {
        const response = await fetch('http://localhost:5000/api/auth/send-password-reset-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });

        if (!response) {
            throw new Error('No response from server');
        }

        const data = await response.json();
        console.log(`📧 Server response:`, data);

        if (data.success) {
            changePasswordState.username = username;
            changePasswordState.email = email;
            updateMessage(1, '✅ OTP sent to your email!', '#27ae60');
            setTimeout(() => {
                showStep(2);
                document.getElementById('cp-otp').focus();
            }, 1000);
        } else {
            updateMessage(1, data.message || 'Failed to send OTP.', '#cc1f1f');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        updateMessage(1, 'Server error. Please check your internet connection.', '#cc1f1f');
    }
}

async function resendPasswordResetOtp() {
    if (!changePasswordState.username || !changePasswordState.email) {
        updateMessage(2, 'Please go back and enter your details again.', '#cc1f1f');
        return;
    }

    updateMessage(2, 'Resending OTP...', '#3498db');

    try {
        const response = await fetch('http://localhost:5000/api/auth/send-password-reset-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: changePasswordState.username,
                email: changePasswordState.email
            })
        });

        const data = await response.json();

        if (data.success) {
            updateMessage(2, '✅ OTP resent to your email!', '#27ae60');
        } else {
            updateMessage(2, data.message || 'Failed to resend OTP.', '#cc1f1f');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        updateMessage(2, 'Server error. Please try again.', '#cc1f1f');
    }
}

async function verifyPasswordResetOtp() {
    const otp = document.getElementById('cp-otp').value.trim();

    console.log(`🔐 Verify Password Reset OTP: ${otp}`);

    if (!otp) {
        updateMessage(2, 'Please enter the OTP.', '#cc1f1f');
        return;
    }

    if (!/^\d{6}$/.test(otp)) {
        updateMessage(2, 'OTP must be exactly 6 digits.', '#cc1f1f');
        return;
    }

    updateMessage(2, 'Verifying OTP...', '#3498db');

    try {
        const response = await fetch('http://localhost:5000/api/auth/verify-password-reset-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: changePasswordState.username,
                email: changePasswordState.email,
                otp
            })
        });

        const data = await response.json();
        console.log(`📧 Server response:`, data);

        if (data.success) {
            changePasswordState.otp = otp;
            updateMessage(2, '✅ OTP verified! Now set your new password.', '#27ae60');
            setTimeout(() => {
                showStep(3);
                document.getElementById('cp-new-password').focus();
            }, 1000);
        } else {
            updateMessage(2, data.message || 'Invalid OTP.', '#cc1f1f');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        updateMessage(2, 'Server error. Please try again.', '#cc1f1f');
    }
}

async function updatePassword() {
    const newPassword = document.getElementById('cp-new-password').value;
    const confirmPassword = document.getElementById('cp-confirm-password').value;

    console.log(`🔐 Update Password`);

    if (!newPassword) {
        updateMessage(3, 'Please enter a new password.', '#cc1f1f');
        return;
    }

    if (newPassword.length < 6) {
        updateMessage(3, 'Password must be at least 6 characters.', '#cc1f1f');
        return;
    }

    if (newPassword !== confirmPassword) {
        updateMessage(3, 'Passwords do not match.', '#cc1f1f');
        return;
    }

    updateMessage(3, 'Updating password...', '#3498db');

    try {
        const response = await fetch('http://localhost:5000/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: changePasswordState.username,
                email: changePasswordState.email,
                otp: changePasswordState.otp,
                newPassword
            })
        });

        const data = await response.json();
        console.log(`📧 Server response:`, data);

        if (data.success) {
            updateMessage(3, '✅ Password updated successfully! Redirecting to login...', '#27ae60');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            updateMessage(3, data.message || 'Failed to update password.', '#cc1f1f');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        updateMessage(3, 'Server error. Please try again.', '#cc1f1f');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showStep(1);
});
