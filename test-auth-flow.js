const UserService = require('./services/UserService');
require('dotenv').config();

async function testAuthFlow() {
  console.log('🧪 Testing Auth Flow...\n');
  
  const userService = new UserService();
  
  try {
    // Test 1: Signup
    console.log('1️⃣ Test 1: Creating new user via signup...');
    const signupResult = await userService.signup({
      username: 'testuser123',
      email: 'test.user123@gmail.com',
      password: 'password123'
    });
    console.log('✅ Signup Result:', signupResult);
    console.log('');
    
    // Test 2: Login with correct credentials
    console.log('2️⃣ Test 2: Login with username and password...');
    const loginResult = await userService.login({
      username: 'testuser123',
      password: 'password123'
    });
    console.log('✅ Login Result:', {
      success: true,
      message: 'Login successful',
      user: loginResult.user,
      token: loginResult.token ? '✅ Token generated' : '❌ No token'
    });
    console.log('');
    
    // Test 3: Login with wrong password
    console.log('3️⃣ Test 3: Login with wrong password...');
    try {
      const wrongPasswordResult = await userService.login({
        username: 'testuser123',
        password: 'wrongpassword'
      });
      console.log('❌ Should have failed!');
    } catch (error) {
      console.log('✅ Correctly rejected wrong password:', error.message);
    }
    console.log('');
    
    // Test 4: Login with non-existent user
    console.log('4️⃣ Test 4: Login with non-existent user...');
    try {
      const nonExistentResult = await userService.login({
        username: 'nonexistent',
        password: 'password123'
      });
      console.log('❌ Should have failed!');
    } catch (error) {
      console.log('✅ Correctly rejected non-existent user:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAuthFlow();
