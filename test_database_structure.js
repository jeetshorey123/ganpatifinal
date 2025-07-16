const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://pngzkvczhcuwwowztvcb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ3prdmN6aGN1d3dvd3p0dmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzY5NzksImV4cCI6MjA2NzkxMjk3OX0.j0eHLlyXuySaZG41QH0pXA-iW1vT0HD-eiE99dwiF8w'
);

async function testDatabaseStructure() {
  console.log('Testing database structure...');
  
  try {
    // Get current record structure
    const { data: currentData, error: currentError } = await supabase
      .from('donations')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('Error fetching current data:', currentError);
      return;
    }
    
    console.log('Current database columns:');
    if (currentData && currentData.length > 0) {
      const columns = Object.keys(currentData[0]);
      columns.forEach(col => console.log(`  - ${col}`));
    }
    
    // Test a simple insert without problematic columns
    console.log('\nTesting simple insert...');
    
    const testData = {
      name: 'Test User Simple',
      phone: '9999999998',
      wing: 'A',
      flat: '998',
      building: 'Test Building',
      payment_method: 'Cash',
      payment_status: 'Completed',
      total_amount: 100,
      amount_paid: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      payment_id: null
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('donations')
      .insert([testData])
      .select();
    
    if (insertError) {
      console.error('Insert test failed:', insertError);
    } else {
      console.log('✅ Simple insert successful!');
      console.log('Inserted record:', insertData[0]);
      
      // Clean up test record
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertData[0].id);
      console.log('Test record cleaned up.');
    }
    
  } catch (error) {
    console.error('Error testing database:', error);
  }
}

testDatabaseStructure();
