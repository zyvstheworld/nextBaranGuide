#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { demographicsData } from '../src/lib/demographicsData';

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedDemographics() {
  try {
    console.log('Starting demographics data seeding...');

    // First, delete all existing records
    const { error: deleteError } = await supabase
      .from('demographics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error deleting existing demographics:', deleteError);
      throw deleteError;
    }

    console.log('Existing demographics cleared');

    // Insert new data
    const { data, error } = await supabase
      .from('demographics')
      .insert(demographicsData)
      .select();

    if (error) {
      console.error('Error inserting demographics:', error);
      throw error;
    }

    console.log(`✅ Successfully seeded ${data.length} demographics records`);
    console.log('Data:', data);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDemographics();
