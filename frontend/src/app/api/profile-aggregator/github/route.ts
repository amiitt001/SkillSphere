/**
 * GitHub Profile API — Fetches public GitHub user data
 * Uses GitHub REST API (no auth required for public data)
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { username } = await req.json();
        if (!username) {
            return NextResponse.json({ error: 'GitHub username is required' }, { status: 400 });
        }

        // Fetch user profile
        const userRes = await fetch(`https://api.github.com/users/${username}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
        });
        if (!userRes.ok) throw new Error(`GitHub user not found: ${username}`);
        const user = await userRes.json();

        // Fetch repos (sorted by stars)
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=30&direction=desc`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
        });
        const repos = reposRes.ok ? await reposRes.json() : [];

        // Calculate language breakdown
        const langMap: Record<string, number> = {};
        let totalStars = 0;
        for (const repo of repos) {
            if (repo.language) {
                langMap[repo.language] = (langMap[repo.language] || 0) + 1;
            }
            totalStars += repo.stargazers_count || 0;
        }

        const topLanguages = Object.entries(langMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count]) => ({
                name,
                percentage: Math.round((count / repos.length) * 100),
            }));

        const topRepos = repos.slice(0, 10).map((r: Record<string, unknown>) => ({
            name: r.name,
            stars: r.stargazers_count,
            language: r.language || 'Unknown',
            description: r.description || '',
            updatedAt: r.updated_at,
        }));

        return NextResponse.json({
            username: user.login,
            avatarUrl: user.avatar_url,
            publicRepos: user.public_repos,
            followers: user.followers,
            totalStars,
            topLanguages,
            contributionsLastYear: 0, // Requires GraphQL API
            repos: topRepos,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch GitHub data';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
