#!/usr/bin/env node
/**
 * Verify Local Development Environment
 *
 * This script checks that all required services and configurations are working.
 * Run with: node scripts/verify-setup.js
 */

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

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

async function verifyEnvironment() {
  log('\n🔍 Verifying Local Development Environment...', 'bright');
  log('==========================================\n', 'blue');

  let allChecks = true;

  // 1. Check environment variables
  log('📋 Checking environment variables...', 'blue');
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'ANTHROPIC_API_KEY',
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      log(`  ✓ ${envVar}`, 'green');
    } else {
      log(`  ✗ ${envVar} - MISSING!`, 'red');
      allChecks = false;
    }
  }

  // 2. Check Supabase connection
  log('\n🗄️  Checking Supabase connection...', 'blue');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    if (error) {
      log(`  ✗ Supabase connection failed: ${error.message}`, 'red');
      allChecks = false;
    } else {
      log(`  ✓ Supabase connected successfully`, 'green');
    }
  } catch (error) {
    log(`  ✗ Supabase connection error: ${error.message}`, 'red');
    allChecks = false;
  }

  // 3. Check database tables
  log('\n📊 Checking database tables...', 'blue');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const tables = ['users', 'reflections', 'evolution_reports', 'usage_tracking'];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        log(`  ✗ Table '${table}' - ${error.message}`, 'red');
        allChecks = false;
      } else {
        log(`  ✓ Table '${table}' exists`, 'green');
      }
    }
  } catch (error) {
    log(`  ✗ Database table check failed: ${error.message}`, 'red');
    allChecks = false;
  }

  // 4. Check test users
  log('\n👥 Checking test users...', 'blue');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const testEmails = [
      'free@test.com',
      'essential@test.com',
      'premium@test.com',
      'creator@test.com',
    ];

    for (const email of testEmails) {
      const { data, error } = await supabase
        .from('users')
        .select('email, tier, is_creator')
        .eq('email', email)
        .single();

      if (error || !data) {
        log(`  ✗ User '${email}' not found`, 'red');
        allChecks = false;
      } else {
        const creatorBadge = data.is_creator ? ' (creator)' : '';
        log(`  ✓ ${email} - ${data.tier}${creatorBadge}`, 'green');
      }
    }
  } catch (error) {
    log(`  ✗ Test user check failed: ${error.message}`, 'red');
    allChecks = false;
  }

  // 5. Check Anthropic API
  log('\n🤖 Checking Anthropic API...', 'blue');
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Make a minimal API call to verify the key works
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    if (message && message.content) {
      log(`  ✓ Anthropic API connected successfully`, 'green');
      log(`    Model: claude-sonnet-4-20250514`, 'green');
    } else {
      log(`  ✗ Unexpected API response`, 'red');
      allChecks = false;
    }
  } catch (error) {
    log(`  ✗ Anthropic API error: ${error.message}`, 'red');
    allChecks = false;
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  if (allChecks) {
    log('✅ All checks passed! Environment is ready.', 'green');
    log('\n📍 Quick links:', 'blue');
    log(`   Supabase Studio: http://127.0.0.1:54323`, 'yellow');
    log(`   Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres`, 'yellow');
    log('\n🚀 You can now run:', 'blue');
    log(`   npm run dev         - Start backend dev server`, 'yellow');
    log(`   npm run dev:react   - Start React frontend`, 'yellow');
    log(`   npm run dev:full    - Start both (if configured)\n`, 'yellow');
  } else {
    log('❌ Some checks failed. Please review errors above.', 'red');
    process.exit(1);
  }
}

verifyEnvironment().catch((error) => {
  log(`\n❌ Verification failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
