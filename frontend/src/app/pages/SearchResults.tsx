import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useBooks } from "../context/BooksContext";
import { API_BASE_URL } from "../../config";

const SEARCH_PAGE_LIMIT = 40;

interface BackendSearchBook {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  pageCount: number | null;
  averageRating: number | null;
  coverImage: string | null;
  description?: string;
  publishedDate?: string;
  categories?: string[];
}

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const { books } = useBooks();

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<BackendSearchBook[]>([]);

  const existingGoogleIds = useMemo(
    () => new Set(books.map((book) => book.googleBooksId)),
    [books],
  );

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setSearchError("");
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();

    async function runSearch() {
      setIsSearching(true);
      setSearchError("");

      const params = new URLSearchParams({
        q: query,
        sort: "relevance",
        page: "1",
        limit: String(SEARCH_PAGE_LIMIT),
      });

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/books/search?${params.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message || "Search request failed.");
        }

        const remoteBooks = Array.isArray(payload?.data)
          ? (payload.data as BackendSearchBook[])
          : [];

        setResults(remoteBooks);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unable to fetch books.";
        setSearchError(message);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }

    runSearch();

    return () => controller.abort();
  }, [query]);

  const visibleResults = results.filter((book) => !existingGoogleIds.has(book.id));

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-8">
      <h1 className="text-[26px] font-semibold text-[#382110]">Search results</h1>
      <p className="text-[15px] text-[#6b5d4a] mt-1">Query: “{query || "-"}”</p>

      {query.length < 2 && (
        <p className="mt-6 text-[15px] text-gray-500">
          Enter at least 2 characters in search.
        </p>
      )}

      {isSearching && (
        <p className="mt-6 text-[15px] text-gray-500">Searching books...</p>
      )}

      {!isSearching && searchError && (
        <p className="mt-6 text-[15px] text-[#b42318]">{searchError}</p>
      )}

      {!isSearching && !searchError && query.length >= 2 && (
        <>
          <p className="mt-4 text-[14px] text-[#6b5d4a]">
            {visibleResults.length} result{visibleResults.length !== 1 ? "s" : ""} found
          </p>

          {visibleResults.length === 0 ? (
            <p className="mt-4 text-[15px] text-gray-500">No books found.</p>
          ) : (
            <div className="mt-5 border border-[#ddd] rounded-md overflow-hidden bg-white">
              {visibleResults.map((book) => {
                const author =
                  Array.isArray(book.authors) && book.authors.length > 0
                    ? book.authors[0]
                    : "Unknown Author";

                return (
                  <Link
                    key={book.id}
                    to={`/book/${book.id}`}
                    className="flex gap-4 px-4 py-3 border-b border-[#f0ebe0] last:border-b-0 hover:bg-[#faf7f0] no-underline"
                  >
                    <img
                      src={book.coverImage || "https://placehold.co/120x180?text=No+Cover"}
                      alt={book.title || "Book cover"}
                      className="w-12 h-16 object-cover rounded shadow-sm ring-1 ring-black/10"
                    />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#1c1208] leading-snug">
                        {book.title || "Untitled"}
                      </p>
                      <p className="text-[13px] text-[#8b7355] mt-0.5">{author}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}