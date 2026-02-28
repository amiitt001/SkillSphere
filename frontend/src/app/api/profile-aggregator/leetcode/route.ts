/**
 * LeetCode Profile API — Fetches public LeetCode user data
 * Uses LeetCode's public GraphQL endpoint
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { username } = await req.json();
        if (!username) {
            return NextResponse.json({ error: 'LeetCode username is required' }, { status: 400 });
        }

        const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          profile {
            ranking
            reputation
          }
        }
      }
    `;

        const lcRes = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { username } }),
        });

        if (!lcRes.ok) throw new Error(`LeetCode user not found: ${username}`);
        const data = await lcRes.json();
        const user = data?.data?.matchedUser;

        if (!user) throw new Error(`LeetCode user not found: ${username}`);

        const stats = user.submitStatsGlobal?.acSubmissionNum || [];
        const getCount = (d: string) => stats.find((s: Record<string, unknown>) => s.difficulty === d)?.count || 0;

        return NextResponse.json({
            username: user.username,
            totalSolved: getCount('All'),
            easySolved: getCount('Easy'),
            mediumSolved: getCount('Medium'),
            hardSolved: getCount('Hard'),
            acceptanceRate: 0,
            ranking: user.profile?.ranking || 0,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch LeetCode data';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
