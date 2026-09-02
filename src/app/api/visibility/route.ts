import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const GENERATION_LIMIT = 10; // Example limit
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

const schema = z.object({
  website: z.string().url(),
});

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

function hashIp(ip: string) {
  const salt = process.env.VISIBILITY_RATE_LIMIT_SALT ?? 'visibility-rate-limit-v1';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

async function consumeGeneration(ip: string) {
  if (!supabaseAdmin) {
    // If Supabase isn't configured, we'll allow the request but log a warning.
    console.warn('Visibility rate limiting is not configured on the server. Allowing request.');
    return { allowed: true, remaining: GENERATION_LIMIT };
  }

  const { data, error } = await supabaseAdmin.rpc('consume_visibility_generation', {
    p_ip_hash: hashIp(ip),
    p_limit: GENERATION_LIMIT,
  });

  if (error) {
    // Log the error but don't block the request if the RPC fails.
    console.error(`Unable to check generation limit: ${error.message}`);
    return { allowed: true, remaining: GENERATION_LIMIT };
  }

  const result = Array.isArray(data) ? data[0] : data;
  return { allowed: Boolean(result?.allowed), remaining: Number(result?.remaining ?? 0) };
}

async function getRemainingGenerations(ip: string) {
  if (!supabaseAdmin) {
    return GENERATION_LIMIT;
  }

  const { data, error } = await supabaseAdmin.rpc('get_remaining_visibility_generations', {
    p_ip_hash: hashIp(ip),
    p_limit: GENERATION_LIMIT,
  });

  if (error) {
    console.error(`Unable to load generation limit: ${error.message}`);
    return GENERATION_LIMIT;
  }

  return Number(data ?? GENERATION_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      remainingGenerations: await getRemainingGenerations(getClientIp(request)),
    });
  } catch (error) {
    console.error('Failed to load generation limit:', error);
    return NextResponse.json({ error: 'Unable to load remaining generations.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }

    const { website } = parsed.data;
    console.log(`[AI Visibility] Starting scan for ${website}`);

    const limit = await consumeGeneration(getClientIp(request));

    if (!limit.allowed) {
      return NextResponse.json(
        { error: `You have reached the ${GENERATION_LIMIT}-scan limit for this IP address.` },
        { status: 429 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const models = process.env.AI_VISIBILITY_MODELS ?? 'google/gemini-3.7-flash,openai/gpt-5.6-luna';
    const useMock = process.env.AI_VISIBILITY_MOCK === 'true';

    console.log(`[AI Visibility] OPENROUTER_API_KEY: ${apiKey ? 'found' : 'not found'}`);
    console.log(`[AI Visibility] AI_VISIBILITY_MODELS: ${models}`);
    console.log(`[AI Visibility] AI_VISIBILITY_MOCK: ${useMock}`);

    if (useMock) {
      console.log('[AI Visibility] Using mock data');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return NextResponse.json({
        score: 78,
        metrics: [
          ['Mention rate', '72%'],
          ['Recommendation rate', '54%'],
          ['Average position', '2.4'],
          ['Share of voice', '31%'],
          ['Positive sentiment', '89%'],
        ],
        competitors: [['Your brand', 78], ['Competitor A', 71], ['Competitor B', 64], ['Competitor C', 59]],
        citations: [['reddit.com', '31%'], ['forbes.com', '18%'], ['yourwebsite.com', '12%'], ['g2.com', '9%']],
        responses: [
          { query: 'What is the best software for this category?', response: 'Mentioned · Recommended · #2' },
          { query: 'Which tools are worth paying for?', response: '31% share of response' },
        ],
        remainingGenerations: limit.remaining,
      });
    }

    if (!apiKey) {
      console.error('[AI Visibility] Missing OPENROUTER_API_KEY');
      return NextResponse.json({ error: 'AI analysis is temporarily unavailable. Please try again.' }, { status: 500 });
    }

    console.log(`[AI Visibility] Models: ${models}`);

    // TODO: Fetch and analyze the website to extract brand name, category, etc.
    const analysis = {
      brandName: 'Your Brand',
      category: 'Software',
      products: ['Product A', 'Product B'],
      targetAudience: 'Developers',
      competitors: ['Competitor A', 'Competitor B'],
      topics: ['Topic 1', 'Topic 2'],
    };

    // TODO: Generate realistic AI-search queries based on the website analysis
    const queries = [
      `What is the best ${analysis.category} for ${analysis.targetAudience}?`,
      `Compare ${analysis.brandName} with ${analysis.competitors.join(' and ')}`,
      `Reviews of ${analysis.products.join(' and ')}`,
    ];

    const modelList = models.split(',').map(m => m.trim()).filter(Boolean);
    const modelResponses = [];

    for (const model of modelList) {
      for (const query of queries) {
        console.log(`[AI Visibility] Calling OpenRouter: ${model} for query: "${query}"`);
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: query }],
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[AI Visibility] Error from OpenRouter for model ${model}: ${response.status} ${response.statusText}`, errorBody);
            continue; // Skip to the next query/model on failure
          }

          const data = await response.json();
          console.log(`[AI Visibility] Received response from ${model}`);
          const content = data.choices?.[0]?.message?.content ?? '';
          modelResponses.push({ model, query, response: content });

        } catch (e) {
            console.error(`[AI Visibility] Network error calling OpenRouter for model ${model}:`, e);
        }
      }
    }

    console.log('[AI Visibility] Evaluating responses');
    // TODO: Evaluate the actual responses and extract measurable visibility information.
    const evaluation = {
      mentionRate: '75%',
      recommendationRate: '60%',
      averagePosition: '2.1',
      shareOfVoice: '35%',
      positiveSentiment: '92%',
    };

    console.log('[AI Visibility] Calculating final score');
    // TODO: Calculate the final 0–100 score in application code.
    const score = 82;

    return NextResponse.json({
      score,
      metrics: [
        ['Mention rate', evaluation.mentionRate],
        ['Recommendation rate', evaluation.recommendationRate],
        ['Average position', evaluation.averagePosition],
        ['Share of voice', evaluation.shareOfVoice],
        ['Positive sentiment', evaluation.positiveSentiment],
      ],
      competitors: [['Your brand', 82], ['Competitor A', 75], ['Competitor B', 68], ['Competitor C', 62]],
      citations: [['reddit.com', '28%'], ['forbes.com', '22%'], ['yourwebsite.com', '15%'], ['g2.com', '11%']],
      responses: modelResponses.map(r => ({ query: r.query, response: r.response.substring(0, 100) + '...' })),
      remainingGenerations: limit.remaining,
    });

  } catch (error) {
    console.error('[AI Visibility] Unhandled error during scan:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}