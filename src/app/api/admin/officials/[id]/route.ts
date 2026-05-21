import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT /api/admin/officials/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, position, order } = body;

    const { data: official, error } = await supabase
      .from('officials')
      .update({
        name,
        position,
        order: order ?? 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating official:', error);
      throw error;
    }

    return NextResponse.json(official);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update official' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/officials/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('officials')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting official:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Official deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete official' },
      { status: 500 }
    );
  }
}
