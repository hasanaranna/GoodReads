import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useBooks } from "../context/BooksContext";
import { API_BASE_URL } from "../../config";
import { ShelfBookData } from "../services/api";
import { Book } from "../data/initialBooks";
import { Sidebar } from "../components/Sidebar";
import { StarRating } from "../components/StarRating";

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
    <div className="max-w-[1320px] mx-auto px-2 md:px-4 py-7">
      <div
        className="text-[15px] text-[#382110] mb-4"
        style={{ marginTop: "24px" }}
      >
        <Link
          to="/mybooks"
          className="no-underline text-[#382110] hover:underline"
        >
          My Books
        </Link>
        <span className="text-gray-500 ml-1">&gt;&gt; Search results</span>
      </div>

      <div className="flex items-start" style={{ gap: "48px" }}>
        <Sidebar />

        <div className="flex-1 min-w-0">
          <div
            className="flex items-center justify-between mb-4"
            style={{ marginTop: "24px" }}
          >
            <div>
              <h1
                className="text-[#382110] text-[26px] leading-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                Search results
              </h1>
              <p className="text-[14px] text-gray-500 mt-1">for “{query || "-"}”</p>
            </div>
            <div className="text-[14px] text-gray-500">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b-2 border-[#382110] text-[14px] text-gray-500">
            <div className="w-[84px] shrink-0" />
            <div className="w-[350px] shrink-0" style={{ margin: "0 18px" }}>
              Title
            </div>
            <div className="w-[170px] shrink-0">Rating / Shelf</div>
            <div className="flex-1">Description</div>
            <div className="w-[120px] shrink-0 text-right">Action</div>
          </div>

          <div className="max-h-[600px] overflow-y-auto pr-2">
            {query.length < 2 && (
              <div className="py-14 text-center text-gray-400 text-[16px]">
                Enter at least 2 characters in search.
              </div>
            )}

            {query.length >= 2 && isSearching && (
              <div className="py-14 text-center text-gray-400 text-[16px]">
                Searching books...
              </div>
            )}

            {query.length >= 2 && !isSearching && searchError && (
              <div className="py-14 text-center text-[#b42318] text-[15px]">
                {searchError}
              </div>
            )}

            {query.length >= 2 && !isSearching && !searchError && results.length === 0 && (
              <div className="py-14 text-center text-gray-400 text-[16px]">
                No books found.
              </div>
            )}

            {query.length >= 2 &&
              !isSearching &&
              !searchError &&
              results.map((book) => {
                const author =
                  Array.isArray(book.authors) && book.authors.length > 0
                    ? book.authors[0]
                    : "Unknown Author";
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
                    className={`flex items-start gap-4 py-5 mb-2 border-b border-[#e8e0d0] ${
                      isAdded ? "bg-[#fafaf8]" : "bg-[#ffffff] hover:bg-[#fafaf8]"
                    } transition-colors`}
                  >
                    <Link to={`/book/${book.id}`} className="shrink-0">
                      <img
                        src={book.coverImage || "https://placehold.co/120x180?text=No+Cover"}
                        alt={book.title || "Book cover"}
                        className="w-[84px] h-[120px] object-cover shadow hover:shadow-md transition-shadow"
                      />
                    </Link>

                    <div className="w-[300px] shrink-0" style={{ margin: "8px 18px" }}>
                      <Link to={`/book/${book.id}`} className="no-underline">
                        <div className="text-[17px] text-[#382110] hover:underline leading-snug">
                          {book.title || "Untitled"}
                        </div>
                      </Link>
                      <div className="text-[14px] text-gray-600 mt-1">{author}</div>
                    </div>

                    <div
                      className="w-[170px] shrink-0 flex flex-col items-center gap-3"
                      style={{ padding: "18px 0" }}
                    >
                      <StarRating
                        rating={
                          typeof book.averageRating === "number"
                            ? Math.max(0, Math.min(5, Math.round(book.averageRating)))
                            : 0
                        }
                        showCount
                        size="sm"
                      />
                      <select
                        value={getSelectedShelf(book.id)}
                        onChange={(e) =>
                          setSelectedShelf(book.id, e.target.value as Shelf)
                        }
                        disabled={isAdded || isAdding}
                        className="w-[140px] text-[13px] text-[#382110] border border-[#ccc] rounded px-3 py-1.5 bg-[#f4f0e6] hover:bg-[#e8e2d0] disabled:opacity-60"
                      >
                        <option value="want-to-read">Want to Read</option>
                        <option value="currently-reading">Currently Reading</option>
                        <option value="read">Read</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-0 text-[14px] text-gray-700" style={{ padding: "18px 0" }}>
                      <span>{shortDescription}</span>
                    </div>

                    <div className="w-[120px] shrink-0 flex justify-end" style={{ padding: "18px 0" }}>
                      <button
                        type="button"
                        onClick={() => void handleAddBook(book)}
                        disabled={isAdded || isAdding}
                        className="text-[13px] font-semibold text-[#00635d] hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        {isAdded ? "In My Books" : isAdding ? "Adding..." : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}