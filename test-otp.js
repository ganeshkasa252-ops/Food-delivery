const UserService = require('./services/UserService');
const EmailService = require('./services/EmailService');
require('dotenv').config();

async function testOTP() {
  console.log('🧪 Testing OTP functionality...\n');
  
  const emailService = new EmailService();
  const userService = new UserService();
  
  try {
    // Test 1: Send OTP
    console.log('📧 Test 1: Sending OTP...');
    const result = await userService.sendOtp({
      username: 'testuser',
      email: 'ganeshkasa252@gmail.com'
    });
    console.log('✅ OTP Result:', result);
    console.log('');
    
    // Test 2: Check if OTP is stored
    console.log('🔍 Test 2: Checking OTP storage...');
    console.log('OTP Store:', userService.otpStore);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOTP();
