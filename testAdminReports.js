// Test script for Admin Reports API
// Run with: node testAdminReports.js

const BASE_URL = 'http://localhost:5001';
const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

// Test 1: Get Quick Stats
async function testQuickStats() {
  console.log('\n📊 Testing Quick Stats...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reports/quick-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Quick Stats Test Passed');
    } else {
      console.log('❌ Quick Stats Test Failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 2: Get Report History
async function testReportHistory() {
  console.log('\n📋 Testing Report History...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reports/history?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Report History Test Passed');
      console.log(`Found ${data.data.length} reports`);
    } else {
      console.log('❌ Report History Test Failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 3: Generate Report
async function testGenerateReport() {
  console.log('\n🔨 Testing Report Generation...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reports/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reportType: 'attendance',
        dateRange: {
          start: '2025-10-01',
          end: '2025-10-17'
        },
        format: 'csv',
        groupBy: 'daily'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Report Generation Test Passed');
      console.log('Report ID:', data.data.admin_report_id);
      console.log('Download URL:', data.data.download_url);
      return data.data.admin_report_id;
    } else {
      console.log('❌ Report Generation Test Failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  return null;
}

// Test 4: Download Report
async function testDownloadReport(adminReportId) {
  if (!adminReportId) {
    console.log('\n⚠️ Skipping Download Test (no report ID)');
    return;
  }
  
  console.log('\n⬇️ Testing Report Download...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reports/download/${adminReportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Content-Length:', response.headers.get('content-length'));
    
    if (response.ok) {
      console.log('✅ Report Download Test Passed');
    } else {
      const data = await response.json();
      console.log('❌ Report Download Test Failed');
      console.log('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test 5: Test without authentication
async function testUnauthorized() {
  console.log('\n🔒 Testing Unauthorized Access...');
  try {
    const response = await fetch(`${BASE_URL}/api/admin/reports/quick-stats`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ Unauthorized Test Passed (properly blocked)');
    } else {
      console.log('⚠️ Warning: Endpoint may not be properly secured');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Admin Reports API Tests');
  console.log('====================================');
  
  if (token === 'YOUR_JWT_TOKEN_HERE') {
    console.log('\n⚠️ WARNING: Please replace YOUR_JWT_TOKEN_HERE with an actual token');
    console.log('Some tests may fail without authentication\n');
  }
  
  await testQuickStats();
  await testReportHistory();
  
  const reportId = await testGenerateReport();
  await testDownloadReport(reportId);
  
  await testUnauthorized();
  
  console.log('\n====================================');
  console.log('🏁 Tests Complete!');
}

// Run tests
runAllTests().catch(console.error);
