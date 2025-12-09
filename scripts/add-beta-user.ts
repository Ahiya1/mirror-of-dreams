// Script to add beta user with 3 months unlimited access
// Run with: npx tsx scripts/add-beta-user.ts

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load production env
dotenv.config({ path: '.env.production.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addBetaUser() {
  const email = 'ariel.rath2@gmail.com';
  const name = 'Ariel';
  const temporaryPassword = 'MirrorBeta2024!'; // User should change this on first login

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log('User already exists:', existingUser);
    console.log('Updating to unlimited tier with 3 months access...');

    // Calculate 3 months from now
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    const { data, error } = await supabase
      .from('users')
      .update({
        tier: 'unlimited',
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        email_verified: true,
      })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      process.exit(1);
    }

    console.log('User updated successfully:', data);
    return data;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  // Calculate 3 months from now
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 3);

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      tier: 'unlimited',
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
      subscription_started_at: new Date().toISOString(),
      reflection_count_this_month: 0,
      total_reflections: 0,
      current_month_year: new Date().toISOString().slice(0, 7),
      email_verified: true,
      onboarding_completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }

  console.log('Beta user created successfully!');
  console.log('Email:', email);
  console.log('Temporary password:', temporaryPassword);
  console.log('Tier: unlimited');
  console.log('Access expires:', expiresAt.toISOString());
  console.log('User data:', newUser);

  return newUser;
}

addBetaUser().catch(console.error);
