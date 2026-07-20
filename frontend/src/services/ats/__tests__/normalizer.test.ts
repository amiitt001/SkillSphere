/**
 * Normalizer Tests
 * Tests for synonym resolution, Jaro-Winkler fuzzy matching, and normalization pipeline.
 */

import {
  normalize,
  normalizeAll,
  jaroWinkler,
  fuzzyIncludes,
  fuzzyFind,
  fuzzyIntersect,
  SYNONYM_MAP,
} from '../normalizer';

// ─── normalize ────────────────────────────────────────────────────────────────

describe('normalize()', () => {
  test('lowercases input', () => {
    expect(normalize('PYTHON')).toBe('python');
    expect(normalize('TypeScript')).toBe('typescript');
  });

  test('trims whitespace', () => {
    expect(normalize('  python  ')).toBe('python');
  });

  test('resolves known synonyms', () => {
    expect(normalize('nodejs')).toBe('node.js');
    expect(normalize('js')).toBe('javascript');
    expect(normalize('ml')).toBe('machine learning');
    expect(normalize('k8s')).toBe('kubernetes');
    expect(normalize('cpp')).toBe('c++');
    expect(normalize('ts')).toBe('typescript');
    expect(normalize('golang')).toBe('go');
    expect(normalize('containerization')).toBe('docker');
  });

  test('passes through unknown terms unchanged (lowercased)', () => {
    expect(normalize('react')).toBe('react');
    expect(normalize('graphql')).toBe('graphql');
    expect(normalize('postgresql')).toBe('postgresql');
  });

  test('handles empty string', () => {
    expect(normalize('')).toBe('');
  });

  test('all SYNONYM_MAP values are lowercase', () => {
    for (const [, value] of Object.entries(SYNONYM_MAP)) {
      expect(value).toBe(value.toLowerCase());
    }
  });
});

// ─── normalizeAll ─────────────────────────────────────────────────────────────

describe('normalizeAll()', () => {
  test('deduplicates after normalization', () => {
    const result = normalizeAll(['nodejs', 'Node.js', 'node js']);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('node.js');
  });

  test('handles empty array', () => {
    expect(normalizeAll([])).toEqual([]);
  });

  test('normalizes all terms', () => {
    const result = normalizeAll(['js', 'ml', 'k8s']);
    expect(result).toContain('javascript');
    expect(result).toContain('machine learning');
    expect(result).toContain('kubernetes');
  });
});

// ─── jaroWinkler ──────────────────────────────────────────────────────────────

describe('jaroWinkler()', () => {
  test('identical strings return 1.0', () => {
    expect(jaroWinkler('react', 'react')).toBe(1);
    expect(jaroWinkler('python', 'python')).toBe(1);
  });

  test('completely different strings return low score', () => {
    expect(jaroWinkler('react', 'golang')).toBeLessThan(0.5);
    expect(jaroWinkler('abc', 'xyz')).toBeLessThan(0.5);
  });

  test('very similar strings return high score', () => {
    expect(jaroWinkler('javascript', 'javasript')).toBeGreaterThan(0.85);
    expect(jaroWinkler('kubernetes', 'kubernetse')).toBeGreaterThan(0.85);
  });

  test('is symmetric', () => {
    const s1 = jaroWinkler('react', 'recat');
    const s2 = jaroWinkler('recat', 'react');
    expect(Math.abs(s1 - s2)).toBeLessThan(0.01);
  });

  test('handles empty strings', () => {
    expect(jaroWinkler('', '')).toBe(1);
    expect(jaroWinkler('react', '')).toBe(0);
    expect(jaroWinkler('', 'react')).toBe(0);
  });

  test('prefix similarity bonus', () => {
    const withPrefix = jaroWinkler('javascript', 'javascrip');
    const withoutPrefix = jaroWinkler('javascript', 'tjavascri');
    expect(withPrefix).toBeGreaterThan(withoutPrefix);
  });
});

// ─── fuzzyIncludes ────────────────────────────────────────────────────────────

describe('fuzzyIncludes()', () => {
  test('returns true for exact match', () => {
    expect(fuzzyIncludes('react', ['react', 'vue', 'angular'])).toBe(true);
  });

  test('returns false when no match', () => {
    expect(fuzzyIncludes('svelte', ['react', 'vue', 'angular'])).toBe(false);
  });

  test('returns true for near-match above threshold', () => {
    expect(fuzzyIncludes('kubernetes', ['kuberentes', 'docker'])).toBe(true);
  });

  test('returns false for near-match below threshold', () => {
    expect(fuzzyIncludes('python', ['java', 'golang'], 0.9)).toBe(false);
  });

  test('normalizes both sides before comparison', () => {
    // 'nodejs' normalizes to 'node.js', 'Node.js' normalizes to 'node.js'
    expect(fuzzyIncludes('nodejs', ['Node.js'])).toBe(true);
  });

  test('handles empty list', () => {
    expect(fuzzyIncludes('react', [])).toBe(false);
  });
});

// ─── fuzzyIntersect ───────────────────────────────────────────────────────────

describe('fuzzyIntersect()', () => {
  test('finds all matching skills', () => {
    const resume = ['React', 'TypeScript', 'Node.js', 'Python'];
    const job = ['react', 'typescript', 'ruby'];

    const { matched, missing } = fuzzyIntersect(resume, job);
    expect(matched).toContain('react');
    expect(matched).toContain('typescript');
    expect(missing).toContain('ruby');
  });

  test('handles synonym matches', () => {
    const resume = ['nodejs'];
    const job = ['node.js'];
    const { matched } = fuzzyIntersect(resume, job);
    expect(matched.length).toBeGreaterThan(0);
  });

  test('returns empty matched for no overlap', () => {
    const { matched } = fuzzyIntersect(['python', 'java'], ['rust', 'go']);
    expect(matched).toHaveLength(0);
  });
});
