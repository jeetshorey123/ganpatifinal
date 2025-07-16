const { createClient } = require('@supabase/supabase-js');

// Test Supabase connection
const supabaseUrl = 'https://pngzkvczhcuwwowztvcb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ3prdmN6aGN1d3dvd3p0dmNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzY5NzksImV4cCI6MjA2NzkxMjk3OX0.j0eHLlyXuySaZG41QH0pXA-iW1vT0HD-eiE99dwiF8w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test connection by checking if we can access the service
    const { data, error } = await supabase.from('donations').select('*').limit(1);
    
    if (error) {
      console.error('Error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('❌ Table "donations" does not exist. You need to run the database setup SQL first.');
      } else {
        console.log('❌ Connection failed:', error.message);
      }
    } else {
      console.log('✅ Connected to Supabase successfully!');
      console.log('✅ Table "donations" exists and is accessible.');
      console.log('Data sample:', data);
    }
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
  }
}

testConnection();
