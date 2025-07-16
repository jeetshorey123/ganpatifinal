const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://pngzkvczhcuwwowztvcb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ3prdmN6aGN1d3dvd3p0dmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzY5NzksImV4cCI6MjA2NzkxMjk3OX0.j0eHLlyXuySaZG41QH0pXA-iW1vT0HD-eiE99dwiF8w'
);

async function updateDatabaseColumns() {
  console.log('Updating database columns...');
  
  try {
    // Test current record structure
    const { data: currentData, error: currentError } = await supabase
      .from('donations')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.error('Error fetching current data:', currentError);
      return;
    }
    
    console.log('Current record structure:', Object.keys(currentData[0] || {}));
    
    // Since we can't run DDL commands through the client, let's create a test insert
    console.log('Testing insert with email and resident_type fields...');
    
    const testData = {
      name: 'Test User',
      phone: '9999999999',
      email: 'test@example.com',
      resident_type: 'Sankalp Resident',
      wing: 'A',
      flat: '999',
      building: 'Test Building',
      payment_method: 'Cash',
      payment_status: 'Completed',
      total_amount: 100,
      amount_paid: 100,
      balance_amount: 0,
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
      console.log('This means email and resident_type columns are missing.');
      console.log('Please run the following SQL commands in your Supabase SQL editor:');
      console.log('');
      console.log('-- Add email column');
      console.log('ALTER TABLE donations ADD COLUMN IF NOT EXISTS email VARCHAR(255) NOT NULL DEFAULT \'\';');
      console.log('');
      console.log('-- Add resident_type column');
      console.log('ALTER TABLE donations ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50) NOT NULL DEFAULT \'Sankalp Resident\';');
      console.log('');
      console.log('-- Make address fields nullable');
      console.log('ALTER TABLE donations ALTER COLUMN wing DROP NOT NULL;');
      console.log('ALTER TABLE donations ALTER COLUMN flat DROP NOT NULL;');
      console.log('ALTER TABLE donations ALTER COLUMN building DROP NOT NULL;');
    } else {
      console.log('✅ Test insert successful! All columns are present.');
      console.log('New record:', insertData[0]);
      
      // Clean up test record
      await supabase
        .from('donations')
        .delete()
        .eq('id', insertData[0].id);
      console.log('Test record cleaned up.');
    }
    
  } catch (error) {
    console.error('Error updating database:', error);
  }
}

updateDatabaseColumns();
