import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, contactIds, payload } = body;

    if (!action || !contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (action === 'assign') {
      const { owner_id } = payload || {};
      const { error } = await supabase
        .from('contacts')
        .update({ owner_id: owner_id || null })
        .in('id', contactIds)
        .eq('user_id', user.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', contactIds)
        .eq('user_id', user.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'tag') {
      const { tag_id, operation } = payload || {}; // operation: 'add' | 'remove'
      if (!tag_id || !operation) {
        return NextResponse.json({ error: 'tag_id and operation (add/remove) are required' }, { status: 400 });
      }

      if (operation === 'add') {
        const inserts = contactIds.map(cid => ({
          contact_id: cid,
          tag_id,
        }));
        
        const { error } = await supabase
          .from('contact_tags')
          .insert(inserts);

        // Ignore duplicate key errors if already tagged
        if (error && !error.message.includes('duplicate key')) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (operation === 'remove') {
        const { error } = await supabase
          .from('contact_tags')
          .delete()
          .in('contact_id', contactIds)
          .eq('tag_id', tag_id);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in bulk operations:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
