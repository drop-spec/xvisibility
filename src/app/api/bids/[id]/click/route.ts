import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE environment variables on the server');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Missing bid id' }, { status: 400 });
    }

    const { data: currentBid, error: fetchError } = await supabaseAdmin
      .from('bids')
      .select('clicks')
      .eq('id', id)
      .single();

    if (fetchError || !currentBid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    const nextClicks = (currentBid.clicks ?? 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('bids')
      .update({
        clicks: nextClicks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('clicks')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, clicks: data?.clicks ?? nextClicks }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unable to record click' }, { status: 500 });
  }
}
