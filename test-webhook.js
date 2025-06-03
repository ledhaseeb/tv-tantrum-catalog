// Quick test script to verify webhook endpoint
const fetch = require('node-fetch');

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint...');
    
    const response = await fetch('http://localhost:5000/api/ghl-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: 'TestWebhook',
        email: 'testwebhook@example.com'
      })
    });
    
    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

testWebhook();