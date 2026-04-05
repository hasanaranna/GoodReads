import {
  ALLOWED_SORTS,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  MAX_LIMIT,
  MIN_LIMIT,
  MIN_PAGE
} from '../../constants/search.constants.js';
import { formatBook } from '../../utils/formatBook.js';
import { searchGoogleBooks } from './googleBooks.client.js';

const ALLOWED_SEARCH_TYPES = ['title', 'author'];
const DEFAULT_SEARCH_TYPE = 'title';

export function toPositiveInteger(value, fallback, min, max) {
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

export function normalizeInput({ q, sort, page, limit, searchType }) {
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

  const normalizedSearchType =
    typeof searchType === 'string' &&
    ALLOWED_SEARCH_TYPES.includes(searchType.toLowerCase())
      ? searchType.toLowerCase()
      : DEFAULT_SEARCH_TYPE;

  return {
    q: query,
    sort: normalizedSort,
    page: toPositiveInteger(page, DEFAULT_PAGE, MIN_PAGE),
    limit: toPositiveInteger(limit, DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT),
    searchType: normalizedSearchType
  };
}

/**
 * Build a Google Books query using the appropriate prefix
 * based on the searchType:
 *   - title  → intitle:<q>
 *   - author → inauthor:<q>
 *   - both   → intitle:<q>+inauthor:<q>
 */
function buildGoogleQuery({ q, searchType }) {
  if (searchType === 'author') {
    return `inauthor:${q}`;
  }
  return `intitle:${q}`;
}

export async function searchBooks(params) {
  const normalizedInput = normalizeInput(params);
  const { q, sort, page, limit, searchType } = normalizedInput;

  const startIndex = (page - 1) * limit;
  const query = buildGoogleQuery({ q, searchType });

  const rawResponse = await searchGoogleBooks({
    query,
    orderBy: sort,
    startIndex,
    maxResults: limit
  });

  const items = Array.isArray(rawResponse?.items) ? rawResponse.items : [];
  const normalizedBooks = items.map((item) => formatBook(item));

  const totalItems = Number.isInteger(rawResponse?.totalItems)
    ? rawResponse.totalItems
    : 0;

  return {
    success: true,
    data: normalizedBooks,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: totalItems > 0 ? Math.ceil(totalItems / limit) : 0,
      hasNextPage: startIndex + limit < totalItems,
      hasPreviousPage: page > 1
    },
    query: {
      q,
      searchType,
      sort
    }
  };
}
