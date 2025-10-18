// Test Dashboard Analytics Endpoints
// Run with: node testDashboardAnalytics.js

const BASE_URL = 'http://localhost:5001';

async function testAnalytics() {
  console.log('🧪 Testing Dashboard Analytics Endpoints\n');
  console.log('='.repeat(60));

  // Test 1: Main Analytics Endpoint
  console.log('\n📊 Test 1: Main Analytics Endpoint');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics?period=this-month`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS: Analytics data retrieved');
      console.log(`   - Attendance Trends: ${data.data.attendanceTrends?.length || 0} entries`);
      console.log(`   - Revenue Trends: ${data.data.revenueTrends?.length || 0} entries`);
      console.log(`   - Enrollment Data: ${data.data.enrollmentData?.length || 0} entries`);
      console.log(`   - Payment Status: ${JSON.stringify(data.data.paymentStatus)}`);
      console.log(`   - Complaint Stats: ${JSON.stringify(data.data.complaintStats)}`);
      console.log(`   - Subscriptions: ${data.data.subscriptionBreakdown?.length || 0} plans`);
      console.log(`   - Staff Performance: ${data.data.staffPerformance?.length || 0} staff`);
      console.log(`   - Peak Hours: ${data.data.peakHours?.length || 0} hours`);
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  // Test 2: Attendance Trends
  console.log('\n\n📅 Test 2: Attendance Trends');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics/attendance?period=this-week`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS: Attendance trends retrieved');
      if (data.data && data.data.length > 0) {
        console.log('   Sample data:');
        data.data.slice(0, 3).forEach(trend => {
          console.log(`   - ${trend.date}: ${trend.checkIns} check-ins, ${trend.checkOuts} check-outs`);
        });
      } else {
        console.log('   ⚠️  No attendance data found');
      }
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  // Test 3: Revenue Trends
  console.log('\n\n💰 Test 3: Revenue Trends');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics/revenue?period=this-month`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS: Revenue trends retrieved');
      if (data.data && data.data.length > 0) {
        console.log('   Sample data:');
        data.data.slice(0, 3).forEach(trend => {
          console.log(`   - ${trend.month}: Revenue ${trend.revenue}, Profit ${trend.profit}`);
        });
      } else {
        console.log('   ⚠️  No revenue data found');
      }
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  // Test 4: Payment Status
  console.log('\n\n💳 Test 4: Payment Status');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics/payments`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS: Payment status retrieved');
      console.log(`   - Paid: ${data.data.paid}`);
      console.log(`   - Unpaid: ${data.data.unpaid}`);
      console.log(`   - Overdue: ${data.data.overdue}`);
      console.log(`   - Total: ${data.data.total}`);
      
      if (data.data.total > 0) {
        const paidPercentage = ((data.data.paid / data.data.total) * 100).toFixed(1);
        console.log(`   - Collection Rate: ${paidPercentage}%`);
      }
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  // Test 5: Complaint Statistics
  console.log('\n\n📝 Test 5: Complaint Statistics');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics/complaints`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS: Complaint statistics retrieved');
      console.log(`   - Pending: ${data.data.pending}`);
      console.log(`   - In Progress: ${data.data.inProgress}`);
      console.log(`   - Resolved: ${data.data.resolved}`);
      console.log(`   - Total: ${data.data.total}`);
      
      if (data.data.total > 0) {
        const resolvedPercentage = ((data.data.resolved / data.data.total) * 100).toFixed(1);
        console.log(`   - Resolution Rate: ${resolvedPercentage}%`);
      }
    } else {
      console.log('❌ FAILED:', data.message);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  // Test 6: Different Periods
  console.log('\n\n🗓️  Test 6: Different Time Periods');
  console.log('-'.repeat(60));
  const periods = ['this-week', 'this-month', 'last-month', 'this-year'];
  
  for (const period of periods) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics?period=${period}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${period}: Success (${data.data.attendanceTrends?.length || 0} attendance records)`);
      } else {
        console.log(`❌ ${period}: Failed - ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${period}: Error - ${error.message}`);
    }
  }

  // Test 7: Invalid Period
  console.log('\n\n⚠️  Test 7: Invalid Period (should fail gracefully)');
  console.log('-'.repeat(60));
  try {
    const response = await fetch(`${BASE_URL}/api/admin/dashboard/analytics?period=invalid-period`);
    const data = await response.json();
    
    if (!data.success) {
      console.log('✅ Correctly rejected invalid period');
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('⚠️  Should have rejected invalid period');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Testing Complete!\n');
}

// Run the tests
testAnalytics().catch(console.error);
