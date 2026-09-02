import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const GENERATION_LIMIT = 50;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

const SYSTEM_PROMPT = `You are writing replies to posts on X/Twitter for a builder/indie hacker/tech-focused personal brand.

Your goal is NOT to summarize the post or blindly agree with it. Write a short reply that adds an original thought, observation, question, or useful counterpoint.

Style:
- 1–4 short sentences.
- Sound like a real person, not a marketing account.
- Conversational, concise, and intelligent.
- Use simple language.
- Avoid corporate/AI-sounding phrases.
- Don't over-explain.
- Don't restate the entire original post.
- Don't use generic responses like "Great insights!", "So true!", "This is huge!", or "Couldn't agree more."
- Don't force a contrarian opinion if there isn't one.
- If the post already makes a strong point, add a second-order observation instead.
- Occasionally use lowercase for a casual tone.
- Emojis are optional and should be rare.

Preferred reply categories:
1. Contrarian
2. Informative / Insightful
3. Curious
4. Personal / Relatable
5. Skeptical / Analytical
6. Encouraging

Important:
Choose the category that best fits the specific post. Don't force every reply to be contrarian.

For startup, AI, SaaS, marketing, distribution, indie hacking, and building-in-public posts, prioritize:
1. Contrarian
2. Insightful
3. Skeptical
4. Curious
The reply should feel like something a smart founder would naturally type into the replies — not something generated to maximize engagement.

Output:
Return ONLY the reply. No explanation. No category label. No quotation marks.`;

function buildFallbackReply(postText: string, tone: string, category: string) {
  const text = (postText || '').trim() || 'this is a pretty good point.';
  const cleaned = text.length > 180 ? `${text.slice(0, 180).trim()}…` : text;

  const tonePhrases: Record<string, string[]> = {
    casual: [
      'this is the part people miss.',
      'not bad, but the deeper issue is this.',
      'fair point — the real angle is this.',
    ],
    sharp: [
      'the obvious takeaway is too easy.',
      'the more interesting part is the second-order effect.',
      'that sounds right, but it misses the real constraint.',
    ],
    warm: [
      'I like this because it gets to the part people skip.',
      'this is a useful frame for people actually building.',
      'good call — the real lesson is a bit less obvious.',
    ],
    analytical: [
      'the useful question is whether this holds up outside the happy path.',
      'the signal is interesting, but the bigger risk is this.',
      'it works in theory, but I wonder how it scales in practice.',
    ],
  };

  const categoryPhrases: Record<string, string[]> = {
    contrarian: [
      'Most people treat this like a distribution problem, but the product still has to earn the attention it gets.',
      'I think the real leverage is not the channel itself, but whether the product compounds once people show up.',
      'Distribution helps, but a weak product still collapses under its own weight.',
    ],
    insightful: [
      'The deeper lesson is that the real bottleneck is usually the mismatch between the platform and the behavior you are trying to create.',
      'The interesting part is not the launch itself — it is the pattern that makes so many attempts fail for the same reason.',
      'The real takeaway is that most people optimize for attention, but the durable win is the system behind it.',
    ],
    curious: [
      'Now I am curious whether this changes retention, or just makes the first interaction feel smoother.',
      'I wonder if the real gain is in the workflow, or just in how it feels at first.',
      'I am interested in whether this still holds once the novelty fades.',
    ],
    relatable: [
      'This is the part nobody talks about after shipping. Building the product is one milestone; getting people to actually use it is the real test.',
      'The hard part is not making the thing, it is making it feel worth the attention in a crowded feed.',
      'The launch is the easy part. The boring, repeated work of making it useful is where the real story starts.',
    ],
    skeptical: [
      'That sounds great at the acquisition stage, but I wonder how it holds up once the business needs predictable revenue.',
      'I like the framing, but the harder test is whether it still works when the team is trying to scale without chaos.',
      'It is a good story early on, but the real question is whether it still makes sense under pressure.',
    ],
    encouraging: [
      'The interesting part is not the growth number. It is finding a model that is useful enough to keep improving and actually hold up over time.',
      'This is the kind of signal that matters more than the headline. The real win is building something people can trust and reuse.',
      'I like this because it focuses on the actual loop, not just the excitement around it.',
    ],
  };

  const opener = tonePhrases[tone]?.[Math.floor(Math.random() * tonePhrases[tone].length)] ?? tonePhrases.sharp[0];
  const pattern = categoryPhrases[category]?.[Math.floor(Math.random() * categoryPhrases[category].length)] ?? categoryPhrases.insightful[0];

  return `${opener.charAt(0).toUpperCase() + opener.slice(1)} ${pattern} ${cleaned}`;
}

function getClientIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
}

function hashIp(ip: string) {
  const salt = process.env.REPLY_RATE_LIMIT_SALT ?? 'reply-rate-limit-v1';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

async function consumeGeneration(ip: string) {
  if (!supabaseAdmin) {
    throw new Error('Reply rate limiting is not configured on the server.');
  }

  const { data, error } = await supabaseAdmin.rpc('consume_reply_generation', {
    p_ip_hash: hashIp(ip),
    p_limit: GENERATION_LIMIT,
  });

  if (error) {
    throw new Error(`Unable to check generation limit: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;
  return { allowed: Boolean(result?.allowed), remaining: Number(result?.remaining ?? 0) };
}

async function getRemainingGenerations(ip: string) {
  if (!supabaseAdmin) {
    throw new Error('Reply rate limiting is not configured on the server.');
  }

  const { data, error } = await supabaseAdmin.rpc('get_remaining_reply_generations', {
    p_ip_hash: hashIp(ip),
    p_limit: GENERATION_LIMIT,
  });

  if (error) {
    throw new Error(`Unable to load generation limit: ${error.message}`);
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
    const { postText, tone, category } = await request.json();
    const limit = await consumeGeneration(getClientIp(request));

    if (!limit.allowed) {
      return NextResponse.json(
        { error: `You have reached the ${GENERATION_LIMIT}-reply limit for this IP address.` },
        { status: 429 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-v4-flash-0731';

    if (!apiKey) {
      return NextResponse.json({
        reply: buildFallbackReply(postText || '', tone || 'casual', category || 'insightful'),
        remainingGenerations: limit.remaining,
      });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
        'X-Title': 'X AI Reply Generator',
        'X-OpenRouter-Metadata': 'enabled',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `TONE: ${tone}\nCATEGORY: ${category}\nPOST:\n${postText}`,
          },
        ],
        temperature: 0.9,
        max_tokens: 180,
        reasoning: { enabled: false },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: `OpenRouter request failed: ${errorText}`,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    const reply = typeof data?.choices?.[0]?.message?.content === 'string'
      ? data.choices[0].message.content.trim()
      : '';

    if (!reply) {
      console.error('OpenRouter returned no reply text:', {
        model: data?.model ?? model,
        finishReason: data?.choices?.[0]?.finish_reason,
      });
      return NextResponse.json({ error: 'No reply content returned from OpenRouter.' }, { status: 500 });
    }

    return NextResponse.json({
      reply,
      model: data?.model ?? model,
      remainingGenerations: limit.remaining,
    });
  } catch (error) {
    console.error('Failed to generate reply:', error);
    return NextResponse.json(
      {
        error: 'Unable to generate a reply right now.',
      },
      { status: 500 },
    );
  }
}
