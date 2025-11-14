export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    // Minimal server-side logging for diagnostics
    console.log('[API] web-vitals received', {
      name: payload?.name,
      value: payload?.value,
      rating: payload?.rating,
      url: payload?.url,
      userAgent: payload?.userAgent,
      timestamp: payload?.timestamp,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API] web-vitals error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process web vitals' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}