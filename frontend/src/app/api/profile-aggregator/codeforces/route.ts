/**
 * Codeforces Profile API — Fetches public Codeforces user data
 * Uses official Codeforces API (no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { handle } = await req.json();
        if (!handle) {
            return NextResponse.json({ error: 'Codeforces handle is required' }, { status: 400 });
        }

        // Fetch user info
        const userRes = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
        if (!userRes.ok) throw new Error(`Codeforces user not found: ${handle}`);
        const userData = await userRes.json();

        if (userData.status !== 'OK' || !userData.result?.length) {
            throw new Error(`Codeforces user not found: ${handle}`);
        }

        const user = userData.result[0];

        // Fetch rating history
        const ratingRes = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
        const ratingData = ratingRes.ok ? await ratingRes.json() : { result: [] };
        const ratingHistory = (ratingData.result || []).slice(-12).map((r: Record<string, unknown>) => ({
            contestName: r.contestName,
            rating: r.newRating,
            date: new Date((r.ratingUpdateTimeSeconds as number) * 1000).toISOString(),
        }));

        // Fetch submission stats
        const subsRes = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10000`);
        const subsData = subsRes.ok ? await subsRes.json() : { result: [] };
        const uniqueSolved = new Set<string>();
        for (const sub of subsData.result || []) {
            if (sub.verdict === 'OK' && sub.problem) {
                uniqueSolved.add(`${sub.problem.contestId}-${sub.problem.index}`);
            }
        }

        return NextResponse.json({
            handle: user.handle,
            rating: user.rating || 0,
            maxRating: user.maxRating || 0,
            rank: user.rank || 'unrated',
            maxRank: user.maxRank || 'unrated',
            problemsSolved: uniqueSolved.size,
            ratingHistory,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch Codeforces data';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
