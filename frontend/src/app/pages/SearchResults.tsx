import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useBooks } from "../context/BooksContext";
import { API_BASE_URL } from "../../config";
import { ShelfBookData } from "../services/api";
import { Book } from "../data/initialBooks";

const SEARCH_PAGE_LIMIT = 40;
const DESCRIPTION_PREVIEW_LENGTH = 180;

type Shelf = "want-to-read" | "currently-reading" | "read";

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

function toLibraryBook(
  book: BackendSearchBook,
  shelf: Shelf,
): { localBook: Book; shelfData: ShelfBookData } {
  const dateAdded = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const normalizedRating =
    typeof book.averageRating === "number" ? Math.round(book.averageRating) : 0;

  const author =
    Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors[0]
      : "Unknown Author";

  const localBook: Book = {
    id: `temp-gb-${book.id}`,
    bookId: "",
    googleBooksId: book.id,
    title: book.title || "Untitled",
    subtitle: book.subtitle || undefined,
    author,
    coverUrl: book.coverImage || "https://placehold.co/120x180?text=No+Cover",
    rating: Math.max(0, Math.min(5, normalizedRating)),
    shelf,
    dateAdded,
    review: "",
    totalPages: book.pageCount || undefined,
    pagesCompleted: 0,
    description: book.description || undefined,
  };

  const shelfData: ShelfBookData = {
    google_books_id: book.id,
    title: book.title || "Untitled",
    subtitle: book.subtitle,
    author,
    cover_url: book.coverImage || undefined,
    page_count: book.pageCount || undefined,
    description: book.description || undefined,
    published_date: book.publishedDate || undefined,
    categories: book.categories || undefined,
    average_rating: book.averageRating || undefined,
  };

  return { localBook, shelfData };
}

function stripHtml(value?: string) {
  return (value || "").replace(/<[^>]+>/g, "").trim();
}

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const { books, addBook } = useBooks();

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<BackendSearchBook[]>([]);
  const [selectedShelves, setSelectedShelves] = useState<Record<string, Shelf>>(
    {},
  );
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());

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

  function getSelectedShelf(bookId: string): Shelf {
    return selectedShelves[bookId] || "want-to-read";
  }

  function setSelectedShelf(bookId: string, shelf: Shelf) {
    setSelectedShelves((prev) => ({ ...prev, [bookId]: shelf }));
  }

  async function handleAddBook(book: BackendSearchBook) {
    if (existingGoogleIds.has(book.id)) {
      return;
    }

    const shelf = getSelectedShelf(book.id);
    const { localBook, shelfData } = toLibraryBook(book, shelf);

    setAddingIds((prev) => new Set(prev).add(book.id));
    try {
      await addBook(localBook, shelfData);
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
    }
  }

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
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>

          {results.length === 0 ? (
            <p className="mt-4 text-[15px] text-gray-500">No books found.</p>
          ) : (
            <div className="mt-5 border border-[#ddd] rounded-md overflow-hidden bg-white">
              {results.map((book) => {
                const author =
                  Array.isArray(book.authors) && book.authors.length > 0
                    ? book.authors[0]
                    : "Unknown Author";
                const ratingText =
                  typeof book.averageRating === "number"
                    ? `${book.averageRating.toFixed(1)} / 5`
                    : "No rating";
                const cleanDescription = stripHtml(book.description);
                const shortDescription = cleanDescription
                  ? cleanDescription.length > DESCRIPTION_PREVIEW_LENGTH
                    ? `${cleanDescription.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`
                    : cleanDescription
                  : "No description available.";
                const isAdded = existingGoogleIds.has(book.id);
                const isAdding = addingIds.has(book.id);

                return (
                  <div
                    key={book.id}
                    className="flex gap-4 px-4 py-3 border-b border-[#f0ebe0] last:border-b-0 hover:bg-[#faf7f0]"
                  >
                    <img
                      src={book.coverImage || "https://placehold.co/120x180?text=No+Cover"}
                      alt={book.title || "Book cover"}
                      className="w-12 h-16 object-cover rounded shadow-sm ring-1 ring-black/10"
                    />
                    <div className="min-w-0 flex-1">
                      <Link to={`/book/${book.id}`} className="no-underline">
                        <p className="text-[15px] font-medium text-[#1c1208] leading-snug hover:underline">
                          {book.title || "Untitled"}
                        </p>
                      </Link>
                      <p className="text-[13px] text-[#8b7355] mt-0.5">{author}</p>
                      <p className="text-[12px] text-gray-500 mt-1">Rating: {ratingText}</p>
                      <p className="text-[13px] text-[#4a4a4a] mt-1 leading-relaxed">
                        {shortDescription}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <select
                        value={getSelectedShelf(book.id)}
                        onChange={(e) =>
                          setSelectedShelf(book.id, e.target.value as Shelf)
                        }
                        disabled={isAdded || isAdding}
                        className="text-[12px] border border-[#c9bfb0] rounded px-2 py-1 bg-white text-[#382110]"
                      >
                        <option value="want-to-read">Want to Read</option>
                        <option value="currently-reading">Currently Reading</option>
                        <option value="read">Read</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => void handleAddBook(book)}
                        disabled={isAdded || isAdding}
                        className="text-[12px] border border-[#00635d]/50 rounded px-2.5 py-1 text-[#00635d] hover:bg-[#00635d] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isAdded ? "In My Books" : isAdding ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}