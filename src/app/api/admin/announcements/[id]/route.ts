import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT - Update an announcement
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { title, content, is_active, image_url } = body;

    const announcementData: any = {
      title,
      content,
      is_active,
      updated_at: new Date().toISOString(),
    };
    announcementData.image_url = image_url || null;

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update(announcementData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an announcement
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
