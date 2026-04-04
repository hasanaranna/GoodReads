import { describe, it, expect } from '@jest/globals';
import { normalizeInput, toPositiveInteger } from '../../src/modules/books/books.service.js';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  MAX_LIMIT,
  MIN_LIMIT,
  MIN_PAGE
} from '../../src/constants/search.constants.js';

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

  it('should accept "newest" as a valid sort', () => {
    const result = normalizeInput({ q: 'test', sort: 'newest' });
    expect(result.sort).toBe('newest');
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

  it('should set error statusCode to 400 and code to INVALID_QUERY', () => {
    try {
      normalizeInput({ q: '' });
    } catch (err) {
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('INVALID_QUERY');
    }
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

  it('should return fallback for empty string', () => {
    expect(toPositiveInteger('', 10, 1, 100)).toBe(10);
  });

  it('should return fallback for null', () => {
    expect(toPositiveInteger(null, 5, 1, 100)).toBe(5);
  });
});
