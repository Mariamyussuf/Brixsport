export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    console.log('[API] user-engagement received', {
      ...payload,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API] user-engagement error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process user engagement' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}