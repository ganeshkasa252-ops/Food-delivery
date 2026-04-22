// Contact form handler with timestamp logging
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contactForm');
  const contactMessageOutput = document.getElementById('contactMessageOutput');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const message = document.getElementById('contactMessageText').value.trim();

      if (!name || !email || !message) {
        contactMessageOutput.textContent = 'Please fill in all required fields';
        contactMessageOutput.style.color = '#e74c3c';
        contactMessageOutput.style.display = 'block';
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        contactMessageOutput.textContent = 'Please enter a valid email address';
        contactMessageOutput.style.color = '#e74c3c';
        contactMessageOutput.style.display = 'block';
        return;
      }

      try {
        const sendTime = getFormattedDateTime();
        contactMessageOutput.textContent = `Sending your message at ${sendTime}...`;
        contactMessageOutput.style.color = '#3498db';
        contactMessageOutput.style.display = 'block';

        // Send message to backend
        fetch('http://localhost:5000/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            message
          })
        })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              const successTime = getFormattedDateTime();
              contactMessageOutput.innerHTML = `
                <strong>✓ Message sent successfully!</strong><br>
                <small>Sent at: ${successTime}</small><br>
                <small>Your message with name, email, and phone has been stored with timestamp.</small>
              `;
              contactMessageOutput.style.color = '#27ae60';
              
              // Store message with timestamp in browser storage for reference
              storeMessageLocally({
                name,
                email,
                phone,
                message,
                timestamp: successTime
              });
              
              // Clear form
              contactForm.reset();
              
              // Hide message after 4 seconds
              setTimeout(() => {
                contactMessageOutput.textContent = '';
                contactMessageOutput.style.display = 'none';
              }, 4000);
            } else {
              throw new Error(data.message || 'Failed to send message');
            }
          })
          .catch(error => {
            console.error('Error sending message:', error);
            contactMessageOutput.textContent = error.message || 'Error sending message. Please try again.';
            contactMessageOutput.style.color = '#e74c3c';
            contactMessageOutput.style.display = 'block';
          });
      } catch (error) {
        console.error('Error sending message:', error);
        contactMessageOutput.textContent = 'Error sending message. Please try again.';
        contactMessageOutput.style.color = '#e74c3c';
        contactMessageOutput.style.display = 'block';
      }
    });
  }
});

/**
 * Get formatted date and time
 * Format: MM/DD/YYYY, HH:MM:SS AM/PM
 */
function getFormattedDateTime() {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Store message in browser's local storage for reference
 * Format: Messages array with timestamps
 */
function storeMessageLocally(messageData) {
  try {
    let storedMessages = [];
    const existing = localStorage.getItem('contactMessages');
    
    if (existing) {
      try {
        storedMessages = JSON.parse(existing);
      } catch (e) {
        storedMessages = [];
      }
    }
    
    // Add new message with unique ID
    const newMessage = {
      ...messageData,
      id: `msg_${Date.now()}`,
      storedAt: new Date().toISOString()
    };
    
    storedMessages.push(newMessage);
    localStorage.setItem('contactMessages', JSON.stringify(storedMessages));
    
    console.log('Message stored locally:', newMessage);
    console.log('Total stored messages:', storedMessages.length);
  } catch (error) {
    console.warn('Could not store message locally:', error);
  }
}
