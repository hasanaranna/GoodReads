import {
  ALLOWED_SORTS,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  MAX_LIMIT,
  MIN_LIMIT,
  MIN_PAGE,
} from "../../constants/search.constants.js";
import { formatBook } from "../../utils/formatBook.js";
import { searchGoogleBooks } from "./googleBooks.client.js";

function toPositiveInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  if (parsed < min) {
    return min;
  }

  if (typeof max === "number" && parsed > max) {
    return max;
  }

  return parsed;
}

function normalizeInput({ q, genre, sort, page, limit }) {
  const query = typeof q === "string" ? q.trim() : "";
  if (!query) {
    const error = new Error("Query parameter 'q' is required.");
    error.statusCode = 400;
    error.code = "INVALID_QUERY";
    throw error;
  }

  const normalizedSort =
    typeof sort === "string" && ALLOWED_SORTS.includes(sort.toLowerCase())
      ? sort.toLowerCase()
      : DEFAULT_SORT;

  return {
    q: query,
    sort: normalizedSort,
    page: toPositiveInteger(page, DEFAULT_PAGE, MIN_PAGE),
    limit: toPositiveInteger(limit, DEFAULT_LIMIT, MIN_LIMIT, MAX_LIMIT),
    genre: typeof genre === "string" && genre.trim() ? genre.trim() : undefined,
  };
}

function buildGoogleQuery({ q, genre }) {
  if (!genre) {
    return q;
  }

  // Add genre as a subject hint while keeping the original query term.
  return `${q} subject:${genre}`;
}

function applyGenreHintFilter(books, genre) {
  if (!genre) {
    return books;
  }

  const loweredGenre = genre.toLowerCase();

  return books.filter((book) => {
    const categories = Array.isArray(book.categories) ? book.categories : [];
    if (!categories.length) {
      return true;
    }

    return categories.some((category) =>
      category.toLowerCase().includes(loweredGenre),
    );
  });
}

export async function searchBooks(params) {
  const normalizedInput = normalizeInput(params);
  const { q, sort, page, limit, genre } = normalizedInput;

  const startIndex = (page - 1) * limit;
  const query = buildGoogleQuery({ q, genre });

  const rawResponse = await searchGoogleBooks({
    query,
    orderBy: sort,
    startIndex,
    maxResults: limit,
  });

  const items = Array.isArray(rawResponse?.items) ? rawResponse.items : [];
  const normalizedBooks = applyGenreHintFilter(
    items.map((item) => formatBook(item)),
    genre,
  );

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
      hasPreviousPage: page > 1,
    },
    query: {
      q,
      genre: genre || null,
      sort,
    },
  };
}
