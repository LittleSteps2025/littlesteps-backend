// Simple test script to verify admin payments endpoint
import fetch from 'node-fetch';

async function testEndpoint() {
  try {
    console.log('Testing GET /api/admin/payments...\n');
    
    const response = await fetch('http://localhost:5001/api/admin/payments');
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Endpoint is working correctly.');
      console.log(`Found ${data.data?.length || 0} payments.`);
    } else {
      console.log('\n❌ ERROR! Endpoint returned an error.');
    }
  } catch (error) {
    console.log('\n❌ FAILED TO CONNECT!');
    console.error('Error:', error.message);
  }
}

testEndpoint();
