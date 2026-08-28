import { NextResponse } from 'next/server';

const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, '');
const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

export async function POST() {
  try {
    if (!posthogHost || !posthogProjectId || !posthogApiKey) {
      return NextResponse.json(
        { error: 'PostHog visitor count is not configured on the server' },
        { status: 503 },
      );
    }

    const response = await fetch(`${posthogHost}/api/projects/${posthogProjectId}/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${posthogApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          kind: 'HogQLQuery',
          query: "SELECT count(DISTINCT distinct_id) FROM events WHERE event = '$pageview'",
        },
      }),
      cache: 'no-store',
    });
    const json = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: json.detail || json.error || 'Unable to query PostHog' },
        { status: 502 },
      );
    }

    return NextResponse.json({ totalVisitors: Number(json.results?.[0]?.[0] || 0) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to record visitor' },
      { status: 500 },
    );
  }
}