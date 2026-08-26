import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Bid = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string | null;
  amount: number;
  clicks: number;
  created_at: string;
  updated_at: string;
};

export type NewBid = {
  title: string;
  description?: string;
  url?: string;
  category?: string;
  amount: number;
};
