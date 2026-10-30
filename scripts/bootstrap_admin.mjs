#!/usr/bin/env node
/**
 * EduTrack — Secure Platform Administrator Bootstrap Script
 *
 * Provisions the permanent Super Administrator account in Supabase Auth & profiles table.
 * Zero hardcoded passwords or secrets.
 *
 * Usage:
 *   node scripts/bootstrap_admin.mjs <admin_email> <admin_password> <admin_name>
 * Or reads environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, PLATFORM_ADMIN_BOOTSTRAP_SECRET
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load local .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = process.argv[2] || process.env.ADMIN_EMAIL;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;
const fullName = process.argv[4] || process.env.ADMIN_NAME || 'Platform Administrator';

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required to run the administrator bootstrap.');
  console.log('Provide SUPABASE_SERVICE_ROLE_KEY in .env.local or environment.');
  process.exit(1);
}

if (!email || !password) {
  console.log('Usage: node scripts/bootstrap_admin.mjs <admin_email> <admin_password> [admin_name]');
  process.exit(1);
}

async function runBootstrap() {
  console.log(`\n🔒 Bootstrapping EduTrack Platform Administrator: ${email}...`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Create or retrieve auth user
  const { data: userResp, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  let userId = userResp?.user?.id;

  if (createErr) {
    if (createErr.message.includes('already exists') || createErr.message.includes('unique')) {
      console.log('ℹ️ User already exists in auth.users, retrieving ID...');
      const { data: listData } = await supabase.auth.admin.listUsers();
      const existingUser = listData?.users?.find((u) => u.email === email);
      if (!existingUser) {
        console.error('❌ Could not locate existing user:', createErr.message);
        process.exit(1);
      }
      userId = existingUser.id;
    } else {
      console.error('❌ Failed to provision user in auth:', createErr.message);
      process.exit(1);
    }
  }

  // 2. Upsert profile with platform_role = 'platform_admin'
  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    name: fullName,
    email: email,
    role: 'owner', // Default fallback role
    platform_role: 'platform_admin',
    account_status: 'active',
    updated_at: new Date().toISOString(),
  });

  if (profileErr) {
    console.error('❌ Error updating profile with platform_role:', profileErr.message);
    process.exit(1);
  }

  console.log('✅ Platform Administrator successfully bootstrapped!');
  console.log(`   User ID: ${userId}`);
  console.log(`   Email:   ${email}`);
  console.log(`   Role:    platform_admin`);
}

runBootstrap().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
