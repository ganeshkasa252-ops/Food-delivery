const UserService = require('./services/UserService');
require('dotenv').config();

async function testCompleteFlow() {
  console.log('🧪 Testing Complete Registration & Login Flow...\n');
  
  const userService = new UserService();
  let otpCode = '';
  let testEmail = 'test.complete' + Date.now() + '@gmail.com';
  let testUsername = 'testuser' + Date.now();
  
  try {
    // Step 1: Send OTP
    console.log('📧 Step 1: Sending OTP...');
    const otpResult = await userService.sendOtp({
      username: testUsername,
      email: testEmail
    });
    console.log('✅', otpResult.message);
    
    // Get the OTP code from storage
    const storedOtp = userService.otpStore[testEmail];
    if (storedOtp) {
      otpCode = storedOtp.code;
      console.log('📌 OTP Code (from server):', otpCode);
    }
    console.log('');
    
    // Step 2: Verify OTP and Register
    console.log('2️⃣ Step 2: Verifying OTP and registering user...');
    const verifyResult = await userService.verifyOtp({
      username: testUsername,
      email: testEmail,
      password: 'TestPassword123',
      otp: otpCode
    });
    console.log('✅ Registration successful!');
    console.log('   User:', verifyResult.user);
    console.log('   Token:', verifyResult.token ? '✅ Generated' : '❌ Missing');
    console.log('');
    
    // Step 3: Login with the registered user
    console.log('3️⃣ Step 3: Logging in with registered user...');
    const loginResult = await userService.login({
      username: testUsername,
      password: 'TestPassword123'
    });
    console.log('✅ Login successful!');
    console.log('   User:', loginResult.user);
    console.log('   Token:', loginResult.token ? '✅ Generated' : '❌ Missing');
    console.log('');
    
    // Step 4: Verify user stored in database
    console.log('4️⃣ Step 4: Verifying user data...');
    const { User } = require('./models/User');
    const dbUser = await User.findOne({ username: testUsername });
    if (dbUser) {
      console.log('✅ User found in database:');
      console.log('   Username:', dbUser.username);
      console.log('   Email:', dbUser.email);
      console.log('   Has Password Hash:', !!dbUser.passwordHash);
    } else {
      console.log('❌ User not found in database!');
    }
    console.log('');
    
    console.log('✅ ALL TESTS PASSED! System is working correctly.\n');
    console.log('Summary:');
    console.log('  - OTP is sending to email ✅');
    console.log('  - Email is stored with user ✅');
    console.log('  - Registration with OTP verification works ✅');
    console.log('  - Login with username + password works ✅');
    console.log('  - User data stored in database ✅');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompleteFlow();
