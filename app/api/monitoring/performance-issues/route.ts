export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    console.warn('[API] performance-issue reported', {
      ...payload,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API] performance-issues error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process performance issue' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}