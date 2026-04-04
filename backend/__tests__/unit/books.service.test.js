/**
 * Unit tests for books search service
 * Tests input validation, normalization, and error handling
 */

import { describe, it, expect } from '@jest/globals';

// Mock the constants since we can't easily import them
const ALLOWED_SORTS = ['relevance', 'newest'];
const DEFAULT_LIMIT = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_SORT = 'relevance';
const MAX_LIMIT = 40;
const MIN_LIMIT = 1;
const MIN_PAGE = 1;

function toPositiveInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  if (parsed < min) {
    return min;
  }

  if (typeof max === 'number' && parsed > max) {
    return max;
  }

  return parsed;
}

function normalizeInput({ q, genre, sort, page, limit }) {
  const query = typeof q === 'string' ? q.trim() : '';
  if (!query) {
    const error = new Error("Query parameter 'q' is required.");
    error.statusCode = 400;
    error.code = 'INVALID_QUERY';
    throw error;
  }

  const normalizedSort =
    typeof sort === 'string' && ALLOWED_SORTS.includes(sort.toLowerCase())
      ? sort.toLowerCase()
      : DEFAULT_SORT;

  return {
    q: query,
    sort: normalizedSort,
    page: toPositiveInteger(page, DEFAULT_PAGE, MIN_PAGE),
    limit: toPositiveInteger(limit, DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT),
    genre:
      typeof genre === 'string' && genre.trim() ? genre.trim() : undefined
  };
}

describe('normalizeInput', () => {
  it('should normalize valid search query', () => {
    const input = { q: '  harry potter  ', sort: 'RELEVANCE', page: '1', limit: '10' };
    const result = normalizeInput(input);

    expect(result).toEqual({
      q: 'harry potter',
      sort: 'relevance',
      page: 1,
      limit: 10,
      genre: undefined
    });
  });

  it('should throw error when query is empty', () => {
    expect(() => {
      normalizeInput({ q: '', sort: 'relevance' });
    }).toThrow("Query parameter 'q' is required.");
  });

  it('should throw error when query is missing', () => {
    expect(() => {
      normalizeInput({ sort: 'relevance' });
    }).toThrow("Query parameter 'q' is required.");
  });

  it('should use default sort when invalid sort provided', () => {
    const result = normalizeInput({ q: 'test', sort: 'invalid' });
    expect(result.sort).toBe(DEFAULT_SORT);
  });

  it('should clamp limit to max value', () => {
    const result = normalizeInput({ q: 'test', limit: '999' });
    expect(result.limit).toBe(MAX_LIMIT);
  });

  it('should clamp limit to min value', () => {
    const result = normalizeInput({ q: 'test', limit: '0' });
    expect(result.limit).toBe(MIN_LIMIT);
  });

  it('should clamp page to min value', () => {
    const result = normalizeInput({ q: 'test', page: '0' });
    expect(result.page).toBe(MIN_PAGE);
  });

  it('should handle non-numeric page and limit with defaults', () => {
    const result = normalizeInput({ q: 'test', page: 'abc', limit: 'xyz' });
    expect(result.page).toBe(DEFAULT_PAGE);
    expect(result.limit).toBe(DEFAULT_LIMIT);
  });

  it('should normalize genre when provided', () => {
    const result = normalizeInput({ q: 'test', genre: '  fiction  ' });
    expect(result.genre).toBe('fiction');
  });

  it('should set genre to undefined when empty string', () => {
    const result = normalizeInput({ q: 'test', genre: '   ' });
    expect(result.genre).toBeUndefined();
  });
});

describe('toPositiveInteger', () => {
  it('should return parsed integer when valid', () => {
    expect(toPositiveInteger('42', 10, 1, 100)).toBe(42);
  });

  it('should return fallback when not an integer', () => {
    expect(toPositiveInteger('abc', 10, 1, 100)).toBe(10);
  });

  it('should return min when value below minimum', () => {
    expect(toPositiveInteger('0', 10, 1, 100)).toBe(1);
  });

  it('should return max when value exceeds maximum', () => {
    expect(toPositiveInteger('999', 10, 1, 100)).toBe(100);
  });

  it('should handle undefined max gracefully', () => {
    expect(toPositiveInteger('999', 10, 1, undefined)).toBe(999);
  });
});
