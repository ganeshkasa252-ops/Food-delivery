/**
 * Test/Demo file for MessageLogger and FileStorageService
 * Run with: node backend/test-file-storage.js
 */

const MessageLogger = require('./services/MessageLogger');

async function runDemo() {
  console.log('='.repeat(70));
  console.log('OOP-BASED MESSAGE STORAGE SYSTEM - DEMO');
  console.log('='.repeat(70));

  try {
    // ============================================
    // 1. JSON FORMAT STORAGE
    // ============================================
    console.log('\n1. STORING MESSAGES IN JSON FORMAT');
    console.log('-'.repeat(70));

    const jsonLogger = new MessageLogger('json');

    // Sample contact messages
    const sampleContacts = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-234-567-8900',
        message: 'I would like to order pizza with extra cheese'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-987-654-3210',
        message: 'Great service! Can I get early morning delivery?'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+1-555-123-4567',
        message: 'Issue with my last order. Order ID: 12345'
      }
    ];

    // Save each contact message
    for (const contact of sampleContacts) {
      console.log(`Saving message from ${contact.name}...`);
      const result = await jsonLogger.logContactMessage(contact);
      console.log(`✓ Message saved with ID: ${result.id}`);
    }

    // Retrieve all messages
    console.log('\n2. RETRIEVING ALL STORED MESSAGES');
    console.log('-'.repeat(70));
    const allMessages = await jsonLogger.getAllMessages();
    console.log(`Total messages stored: ${allMessages.length}`);
    console.log('\nFirst message details:');
    console.log(JSON.stringify(allMessages[0], null, 2));

    // ============================================
    // 3. TEXT FORMAT STORAGE
    // ============================================
    console.log('\n3. STORING MESSAGES IN TEXT FORMAT');
    console.log('-'.repeat(70));

    const textLogger = new MessageLogger('text');

    const textContact = {
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      phone: '+1-777-888-9999',
      message: 'Love your food! Best delivery app in town'
    };

    console.log(`Saving text format message from ${textContact.name}...`);
    const textResult = await textLogger.logContactMessage(textContact);
    console.log(`✓ Message saved with ID: ${textResult.id}`);

    // Read text file content
    const textContent = await textLogger.fileStorage.handler.read();
    console.log('\nText file content (first 500 characters):');
    console.log(textContent.substring(0, 500) + '...');

    // ============================================
    // 4. LOGGING OTHER MESSAGE TYPES
    // ============================================
    console.log('\n4. LOGGING DIFFERENT MESSAGE TYPES');
    console.log('-'.repeat(70));

    // Log order message
    console.log('Logging order message...');
    await jsonLogger.logOrderMessage({
      orderId: 'ORD-2026-001',
      customerId: 'CUST-123',
      status: 'PENDING',
      details: 'Pizza and sides - Total: $25.99'
    });
    console.log('✓ Order message logged');

    // Log review message
    console.log('Logging review message...');
    await jsonLogger.logReviewMessage({
      reviewId: 'REV-001',
      userId: 'USER-456',
      rating: 5,
      comment: 'Excellent food quality and fast delivery!'
    });
    console.log('✓ Review message logged');

    // ============================================
    // 5. FILTERING BY DATE
    // ============================================
    console.log('\n5. FILTERING MESSAGES BY DATE');
    console.log('-'.repeat(70));

    const today = new Date();
    const todayFormatted = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;
    
    console.log(`Filtering messages from date: ${todayFormatted}`);
    const todayMessages = await jsonLogger.getMessagesByDate(todayFormatted);
    console.log(`Messages found for today: ${todayMessages.length}`);

    // ============================================
    // 6. CURRENT TIMESTAMP
    // ============================================
    console.log('\n6. TIMESTAMP INFORMATION');
    console.log('-'.repeat(70));

    const timestamp = jsonLogger.getCurrentTimestamp();
    console.log(`Current timestamp: ${timestamp}`);

    // ============================================
    // 7. CUSTOM MESSAGE LOGGING
    // ============================================
    console.log('\n7. LOGGING CUSTOM MESSAGE');
    console.log('-'.repeat(70));

    const customMessage = {
      type: 'COMPLAINT',
      username: 'Tom Brown',
      category: 'LATE_DELIVERY',
      severity: 'HIGH',
      description: 'Order arrived 45 minutes late'
    };

    console.log('Logging custom message...');
    await jsonLogger.logCustomMessage(customMessage);
    console.log('✓ Custom message logged');

    // Final retrieval
    console.log('\n8. FINAL MESSAGE COUNT');
    console.log('-'.repeat(70));

    const finalMessages = await jsonLogger.getAllMessages();
    console.log(`Total messages in JSON storage: ${finalMessages.length}`);

    console.log('\n' + '='.repeat(70));
    console.log('DEMO COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));

    console.log('\n📂 Storage locations:');
    console.log('  JSON format: backend/storage/messages/messages.json');
    console.log('  Text format: backend/storage/messages/messages.txt');

    console.log('\n📚 OOP Concepts Demonstrated:');
    console.log('  ✓ Abstraction - BaseFileHandler defines interface');
    console.log('  ✓ Inheritance - JSONFileHandler, TextFileHandler extend base');
    console.log('  ✓ Polymorphism - Different save() implementations');
    console.log('  ✓ Encapsulation - Private file operations');
    console.log('  ✓ Composition - FileStorageService contains handler');
    console.log('  ✓ Factory Pattern - FileStorageService creates handlers');
    console.log('  ✓ Single Responsibility - MessageLogger focuses on logging');

  } catch (error) {
    console.error('❌ Error during demo:', error.message);
    console.error(error);
  }
}

// Run the demo
runDemo();
