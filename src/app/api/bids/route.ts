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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, url, category, amount } = body;

    if (!title || typeof amount !== 'number' || amount < 500) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Generate an id server-side to avoid null id violations and rely less on DB defaults
    const id = (globalThis as any).crypto?.randomUUID?.() || require('crypto').randomUUID();
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin.from('bids').insert({
      id,
      title: title.trim(),
      description: description ? description.trim() : null,
      url: url ? url.trim() : null,
      category: category || null,
      amount,
      created_at: now,
      updated_at: now,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [{ data: bids, error: bidsError, count }, { data: poolData, error: poolError }, { data: recent, error: recentError }] = await Promise.all([
      supabaseAdmin.from('bids').select('*', { count: 'exact' }).order('amount', { ascending: false }).range(from, to),
      supabaseAdmin.from('bids').select('amount'),
      supabaseAdmin.from('bids').select('*').order('created_at', { ascending: false }).limit(5),
    ]);

    if (bidsError || poolError || recentError) {
      const msg = (bidsError || poolError || recentError)?.message || 'Error fetching bids';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const totalPool = (poolData || []).reduce((sum: number, b: any) => sum + (b.amount || 0), 0);

    return NextResponse.json({ bids, count, totalPool, recent }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
