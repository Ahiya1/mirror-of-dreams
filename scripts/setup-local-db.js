#!/usr/bin/env node
/**
 * Setup Local Database with Test Users
 *
 * This script creates test users for all tier levels in your local Supabase instance.
 * Run with: node scripts/setup-local-db.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function setupLocalDatabase() {
  log('\n🗄️  Setting up local database with test users...', 'bright');
  log('================================================\n', 'blue');

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    log('❌ ERROR: Missing Supabase environment variables', 'red');
    log('Make sure .env.local has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    process.exit(1);
  }

  // Initialize Supabase client with service role key (bypasses RLS)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  log('✓ Connected to Supabase', 'green');

  // Define test users for each tier
  const testUsers = [
    {
      email: 'free@test.com',
      password: 'password123',
      name: 'Free Tier User',
      tier: 'free',
      is_creator: false
    },
    {
      email: 'essential@test.com',
      password: 'password123',
      name: 'Essential User',
      tier: 'essential',
      is_creator: false
    },
    {
      email: 'optimal@test.com',
      password: 'password123',
      name: 'Optimal User',
      tier: 'optimal',
      is_creator: false
    },
    {
      email: 'premium@test.com',
      password: 'password123',
      name: 'Premium User',
      tier: 'premium',
      is_creator: false
    },
    {
      email: 'creator@test.com',
      password: 'password123',
      name: 'Creator (Ahiya)',
      tier: 'premium',
      is_creator: true
    }
  ];

  log('\n📝 Creating test users...', 'blue');

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existing) {
        log(`⚠️  User ${userData.email} already exists, skipping`, 'yellow');
        continue;
      }

      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 12);

      // Create user
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash,
          name: userData.name,
          tier: userData.tier,
          is_creator: userData.is_creator,
          subscription_status: 'active',
          reflection_count_this_month: 0,
          total_reflections: 0,
          current_month_year: new Date().toISOString().slice(0, 7),
          email_verified: true
        })
        .select('id, email, name, tier')
        .single();

      if (error) {
        log(`❌ Error creating ${userData.email}: ${error.message}`, 'red');
      } else {
        log(`✅ Created: ${userData.email} (${userData.tier})`, 'green');
      }
    } catch (error) {
      log(`❌ Error creating ${userData.email}: ${error.message}`, 'red');
    }
  }

  log('\n📊 Database summary:', 'blue');

  // Get total user count
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  log(`Total users: ${count}`, 'green');

  // Get user count by tier
  const { data: tiers } = await supabase
    .from('users')
    .select('tier')
    .order('tier');

  const tierCounts = {};
  tiers?.forEach(u => {
    tierCounts[u.tier] = (tierCounts[u.tier] || 0) + 1;
  });

  Object.entries(tierCounts).forEach(([tier, count]) => {
    log(`  ${tier}: ${count} user(s)`, 'green');
  });

  log('\n✨ Local database setup complete!', 'bright');
  log('\n📝 Test credentials:', 'blue');
  log('  Email: free@test.com, essential@test.com, optimal@test.com, premium@test.com, creator@test.com');
  log('  Password: password123 (for all test users)\n');
  log('🌐 Access Supabase Studio at: http://127.0.0.1:54323\n', 'yellow');
}

// Run the setup
setupLocalDatabase()
  .then(() => process.exit(0))
  .catch(error => {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
