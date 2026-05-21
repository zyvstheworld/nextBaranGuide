import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Official {
  id?: string;
  name: string;
  position: string;
  order?: number;
}

// GET /api/admin/officials
export async function GET() {
  try {
    const { data: officials, error } = await supabase
      .from('officials')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching officials:', error);
      throw error;
    }

    return NextResponse.json(officials);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch officials' },
      { status: 500 }
    );
  }
}

// POST /api/admin/officials
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Support bulk insert when an array is posted, or single object
    if (Array.isArray(body)) {
      const { data: createdOfficials, error } = await supabase
        .from('officials')
        .insert(body)
        .select();

      if (error) {
        console.error('Error creating officials (bulk):', error);
        throw error;
      }

      return NextResponse.json(createdOfficials, { status: 201 });
    }

    const official = {
      name: body.name,
      position: body.position,
      order: body.order ?? 0,
    };

    const { data: createdOfficial, error } = await supabase
      .from('officials')
      .insert([official])
      .select();

    if (error) {
      console.error('Error creating official:', error);
      throw error;
    }

    return NextResponse.json(createdOfficial, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create official' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/officials
export async function DELETE() {
  try {
    const { error } = await supabase
      .from('officials')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error deleting officials:', error);
      throw error;
    }

    return NextResponse.json({ message: 'All officials deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete officials' },
      { status: 500 }
    );
  }
}
