export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);

    console.error('[API] errors received', {
      ...payload,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[API] errors route handler failure', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to process error report' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}