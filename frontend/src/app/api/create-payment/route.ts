// Placeholder — payment integration not yet implemented
export const dynamic = 'force-dynamic';

export async function POST() {
    return new Response(JSON.stringify({ error: 'Payment not implemented' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' },
    });
}
