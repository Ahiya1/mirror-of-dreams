#!/usr/bin/env node
// Script to create admin user: ahiya.butman@gmail.com / dream_lake

require('dotenv').config({ path: '.env.local' });

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54331';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('   Check your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🔐 Creating admin user...\n');

  const email = 'ahiya.butman@gmail.com';
  const password = 'dream_lake';
  const name = 'Ahiya Butman';

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, is_admin, tier')
      .eq('email', email)
      .single();

    if (existing) {
      console.log('✅ User already exists:', existing.email);
      console.log('   Updating permissions...\n');

      // Update to admin
      const { data, error } = await supabase
        .from('users')
        .update({
          is_admin: true,
          is_creator: true,
          tier: 'premium',
          subscription_status: 'active',
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        process.exit(1);
      }

      console.log('✅ Admin user updated successfully!');
      console.log('   Email:', data.email);
      console.log('   Name:', data.name);
      console.log('   Tier:', data.tier);
      console.log('   Admin:', data.is_admin);
      console.log('   Creator:', data.is_creator);
      return;
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Create new admin user
    console.log('👤 Creating new user...');
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        tier: 'premium',
        subscription_status: 'active',
        is_admin: true,
        is_creator: true,
        email_verified: true,
        reflection_count_this_month: 0,
        total_reflections: 0,
        current_month_year: new Date().toISOString().slice(0, 7),
        last_sign_in_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating user:', error);
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('   Email:', data.email);
    console.log('   Name:', data.name);
    console.log('   Tier:', data.tier);
    console.log('   Admin:', data.is_admin);
    console.log('   Creator:', data.is_creator);
    console.log('\n🎉 You can now sign in with:');
    console.log('   Email:', email);
    console.log('   Password:', password);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

createAdminUser();
