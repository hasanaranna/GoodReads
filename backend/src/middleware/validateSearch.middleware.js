import {
  ALLOWED_SORTS,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  MAX_LIMIT,
  MIN_LIMIT,
  MIN_PAGE
} from '../constants/search.constants.js';

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) {
    return NaN;
  }

  return parsed;
}

function isGenreValid(genre) {
  if (typeof genre !== 'string') {
    return false;
  }

  const trimmed = genre.trim();
  if (trimmed.length < 2 || trimmed.length > 60) {
    return false;
  }

  return /^[a-zA-Z0-9\s\-&,.'/:]+$/.test(trimmed);
}

export function validateSearchQuery(req, res, next) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const sort =
    typeof req.query.sort === 'string'
      ? req.query.sort.trim().toLowerCase()
      : DEFAULT_SORT;
  const genre =
    typeof req.query.genre === 'string' ? req.query.genre.trim() : undefined;

  const page = parsePositiveInteger(req.query.page, DEFAULT_PAGE);
  const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT);

  if (!q) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: "Query parameter 'q' is required."
      }
    });
  }

  if (!Number.isInteger(page) || page < MIN_PAGE) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAGE',
        message: `Query parameter 'page' must be an integer >= ${MIN_PAGE}.`
      }
    });
  }

  if (!Number.isInteger(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_LIMIT',
        message: `Query parameter 'limit' must be between ${MIN_LIMIT} and ${MAX_LIMIT}.`
      }
    });
  }

  if (!ALLOWED_SORTS.includes(sort)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SORT',
        message: `Query parameter 'sort' must be one of: ${ALLOWED_SORTS.join(
          ', '
        )}.`
      }
    });
  }

  if (genre && !isGenreValid(genre)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GENRE',
        message:
          "Query parameter 'genre' must be 2-60 characters and contain only letters, numbers, spaces, and basic punctuation."
      }
    });
  }

  req.searchQuery = {
    q,
    sort,
    page,
    limit,
    genre: genre || undefined
  };

  return next();
}
