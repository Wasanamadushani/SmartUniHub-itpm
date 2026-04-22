#!/usr/bin/env node
/**
 * Diagnostic script to test admin flow endpoints
 * Run after starting the backend server
 */

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing Admin Flow Endpoints...\n');

  const tests = [
    {
      name: 'Fetch Pending Arrivals',
      method: 'GET',
      url: `${API_BASE}/bookings/pending-arrivals`,
    },
    {
      name: 'Fetch Unpaid Fines',
      method: 'GET',
      url: `${API_BASE}/fines/unpaid`,
    },
  ];

  for (const test of tests) {
    try {
      console.log(`📡 ${test.method} ${test.url}`);
      const response = await fetch(test.url);
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`   Data: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`❌ Status: ${response.status}`);
        console.log(`   Error: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

testEndpoints();
