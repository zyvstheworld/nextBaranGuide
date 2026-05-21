import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Demographic {
  id: string;
  category: string;
  label: string;
  value: number;
  icon: string;
  order: number;
}

// GET - Fetch all demographics
export async function GET() {
  try {
    const { data: demographics, error } = await supabase
      .from('demographics')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching demographics:', error);
      throw error;
    }

    return NextResponse.json(demographics);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demographics' },
      { status: 500 }
    );
  }
}

// POST - Create or bulk insert demographics
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If it's an array, insert multiple
    const dataToInsert = Array.isArray(body) ? body : [body];

    const { data: result, error } = await supabase
      .from('demographics')
      .insert(dataToInsert)
      .select();

    if (error) {
      console.error('Error creating demographics:', error);
      throw error;
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create demographics' },
      { status: 500 }
    );
  }
}

// DELETE - Delete all demographics and reinitialize
export async function DELETE() {
  try {
    // Delete all existing records
    const { error: deleteError } = await supabase
      .from('demographics')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error deleting demographics:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({ message: 'All demographics deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete demographics' },
      { status: 500 }
    );
  }
}
