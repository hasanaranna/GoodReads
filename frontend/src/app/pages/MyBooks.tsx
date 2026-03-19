import { useEffect, useMemo, useState } from "react";
import {
  Search,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParams, Link } from "react-router";
import { useBooks } from "../context/BooksContext";
import { Sidebar } from "../components/Sidebar";
import { BookRow } from "../components/BookRow";
import type { Book } from "../data/initialBooks";

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

const SHELF_NAMES: Record<string, string> = {
  "want-to-read": "Want to Read",
  "currently-reading": "Currently Reading",
  read: "Read",
};

const ITEMS_PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:8080";

type BackendSearchSort = "relevance" | "newest";

interface BackendSearchBook {
  id: string;
  title: string;
  subtitle: string | null;
  authors: string[];
  description: string | null;
  publisher: string | null;
  publishedDate: string | null;
  pageCount: number | null;
  categories: string[];
  averageRating: number | null;
  ratingsCount: number;
  coverImage: string | null;
}

interface SearchPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function toLibraryBook(book: BackendSearchBook): Book {
  const dateAdded = new Date()
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .replace(",", "");

  const firstAuthor =
    Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors[0]
      : "Unknown Author";
  const normalizedRating =
    typeof book.averageRating === "number" ? Math.round(book.averageRating) : 0;

  return {
    id: `gb-${book.id}`,
    title: book.title || "Untitled",
    author: firstAuthor,
    coverUrl: book.coverImage || "https://placehold.co/120x180?text=No+Cover",
    rating: Math.max(0, Math.min(5, normalizedRating)),
    shelf: "want-to-read",
    dateAdded,
    review: "",
    totalPages: book.pageCount || undefined,
    pagesCompleted: 0,
  };
}

const EMPTY_SEARCH_PAGINATION: SearchPagination = {
  page: 1,
  limit: ITEMS_PER_PAGE,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function MyBooks() {
  const { shelfId } = useParams();
  const { books, addBook } = useBooks();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("");
  const [searchSort, setSearchSort] = useState<BackendSearchSort>("relevance");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<BackendSearchBook[]>([]);
  const [searchPagination, setSearchPagination] = useState<SearchPagination>(
    EMPTY_SEARCH_PAGINATION,
  );
  const [sortBy, setSortBy] = useState<
    "title" | "author" | "rating" | "dateAdded"
  >("dateAdded");
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const isSearchMode = debouncedSearchQuery.length > 0;

  const existingBookIds = useMemo(
    () => new Set(books.map((b) => b.id)),
    [books],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!debouncedSearchQuery) {
      setIsSearching(false);
      setSearchError("");
      setSearchResults([]);
      setSearchPagination(EMPTY_SEARCH_PAGINATION);
      return;
    }

    const controller = new AbortController();

    async function fetchSearchResults() {
      setIsSearching(true);
      setSearchError("");

      const query = new URLSearchParams({
        q: debouncedSearchQuery,
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
        sort: searchSort,
      });

      const trimmedGenre = genreQuery.trim();
      if (trimmedGenre) {
        query.set("genre", trimmedGenre);
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/books/search?${query.toString()}`,
          {
            signal: controller.signal,
          },
        );

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error?.message || "Search request failed.");
        }

        const items = Array.isArray(payload?.data)
          ? (payload.data as BackendSearchBook[])
          : [];
        const pagination = payload?.pagination || {};

        setSearchResults(items);
        setSearchPagination({
          page: Number.isInteger(pagination.page)
            ? pagination.page
            : currentPage,
          limit: Number.isInteger(pagination.limit)
            ? pagination.limit
            : ITEMS_PER_PAGE,
          totalItems: Number.isInteger(pagination.totalItems)
            ? pagination.totalItems
            : items.length,
          totalPages: Number.isInteger(pagination.totalPages)
            ? pagination.totalPages
            : 0,
          hasNextPage: Boolean(pagination.hasNextPage),
          hasPreviousPage: Boolean(pagination.hasPreviousPage),
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to fetch search results.";
        setSearchError(message);
        setSearchResults([]);
        setSearchPagination(EMPTY_SEARCH_PAGINATION);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    }

    fetchSearchResults();

    return () => controller.abort();
  }, [debouncedSearchQuery, genreQuery, searchSort, currentPage]);

  function addSearchResult(book: BackendSearchBook) {
    const mapped = toLibraryBook(book);
    if (existingBookIds.has(mapped.id)) {
      return;
    }

    addBook(mapped);
  }

  const filtered = books.filter((b) => {
    const matchesShelf = !shelfId || b.shelf === shelfId;
    return matchesShelf;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "title")
      return (a.titleLocal || a.title).localeCompare(b.titleLocal || b.title);
    if (sortBy === "author") return a.author.localeCompare(b.author);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const totalPages = isSearchMode
    ? searchPagination.totalPages
    : Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(paginated.map((b) => b.id)));
  }

  const shelfLabel = shelfId ? SHELF_NAMES[shelfId] : undefined;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="text-[13px] text-[#382110] mb-2">
        <Link
          to="/mybooks"
          className="no-underline text-[#382110] hover:underline"
        >
          My Books
        </Link>
        {shelfLabel && (
          <span className="text-gray-500 ml-1">&gt;&gt; {shelfLabel}</span>
        )}
      </div>

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search and add books */}
        <div className="flex items-center border border-[#ccc] rounded-full px-3 py-1 bg-[#f4f0e6] gap-2 text-[12px]">
          <input
            type="text"
            placeholder="Search Google Books"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="outline-none bg-transparent text-[#382110] w-[180px]"
          />
          <Search size={13} className="text-[#888]" />
        </div>

        <input
          type="text"
          placeholder="Genre (optional)"
          value={genreQuery}
          onChange={(e) => {
            setGenreQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-[#ccc] rounded-full px-3 py-1 bg-[#f4f0e6] text-[12px] text-[#382110] outline-none w-[150px]"
        />

        <select
          value={searchSort}
          onChange={(e) => {
            setSearchSort(e.target.value as BackendSearchSort);
            setCurrentPage(1);
          }}
          className="border border-[#ccc] rounded-full px-3 py-1 bg-[#f4f0e6] text-[12px] text-[#382110] outline-none"
        >
          <option value="relevance">Relevance</option>
          <option value="newest">Newest</option>
        </select>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-3 text-[13px]">
          {!isSearchMode && (
            <button
              onClick={() => {
                setBatchMode(!batchMode);
                setSelectedIds(new Set());
              }}
              className={`font-semibold hover:underline ${batchMode ? "text-[#00635d]" : "text-[#382110]"}`}
            >
              Batch Edit
            </button>
          )}
          {!isSearchMode && batchMode && (
            <>
              <button
                onClick={selectAll}
                className="text-[#00635d] hover:underline text-[12px]"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[#00635d] hover:underline text-[12px]"
              >
                Clear
              </button>
            </>
          )}
          <button className="font-semibold text-[#382110] hover:underline">
            Settings
          </button>
          <button className="font-semibold text-[#382110] hover:underline">
            Stats
          </button>
          <button className="font-semibold text-[#382110] hover:underline">
            Print
          </button>
          <span className="text-[#ccc]">|</span>
          <button
            onClick={() => setViewMode("list")}
            className={
              viewMode === "list"
                ? "text-[#382110]"
                : "text-[#aaa] hover:text-[#382110]"
            }
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={
              viewMode === "grid"
                ? "text-[#382110]"
                : "text-[#aaa] hover:text-[#382110]"
            }
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] text-gray-500">
              {isSearchMode
                ? `${searchPagination.totalItems} result${searchPagination.totalItems !== 1 ? "s" : ""} for "${debouncedSearchQuery}"`
                : `${filtered.length} book${filtered.length !== 1 ? "s" : ""}${shelfLabel ? ` on ${shelfLabel}` : ""}`}
            </div>
            {!isSearchMode && (
              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-gray-500">Sort by:</span>
                {(["title", "author", "rating", "dateAdded"] as const).map(
                  (s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`capitalize hover:underline ${
                        sortBy === s
                          ? "text-[#382110] underline"
                          : "text-[#00635d]"
                      }`}
                    >
                      {s === "dateAdded" ? "Date Added" : s}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {isSearchMode && (
            <div className="text-[12px] text-gray-500 mb-3">
              {isSearching
                ? "Searching books..."
                : "Search results are powered by Google Books via backend proxy."}
            </div>
          )}

          {/* Pagination top */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-[12px] text-[#00635d] justify-end mb-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                <ChevronLeft size={13} /> previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-1 hover:underline ${
                    currentPage === p
                      ? "text-[#382110] underline"
                      : "text-[#00635d]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                next <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Book list or grid */}
          {isSearchMode ? (
            viewMode === "list" ? (
              <div>
                <div className="flex items-center gap-3 py-2 border-b-2 border-[#382110] text-[12px] text-gray-500">
                  <div className="w-[60px] shrink-0" />
                  <div className="w-[260px] shrink-0">Title / Author</div>
                  <div className="hidden md:block w-[220px] shrink-0">
                    Genre
                  </div>
                  <div className="w-[90px] shrink-0">Rating</div>
                  <div className="flex-1">Action</div>
                </div>

                {searchError ? (
                  <div className="py-12 text-center text-[#b42318] text-[14px]">
                    {searchError}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-[14px]">
                    {isSearching
                      ? "Loading search results..."
                      : "No books found for this search."}
                  </div>
                ) : (
                  searchResults.map((book) => {
                    const candidate = toLibraryBook(book);
                    const alreadyAdded = existingBookIds.has(candidate.id);

                    return (
                      <div
                        key={book.id}
                        className="flex items-start gap-3 py-4 border-b border-[#e8e0d0] bg-white hover:bg-[#fafaf8] transition-colors"
                      >
                        <img
                          src={candidate.coverUrl}
                          alt={candidate.title}
                          className="w-[60px] h-[85px] object-cover shadow"
                        />

                        <div className="w-[260px] shrink-0">
                          <div className="text-[14px] text-[#382110] leading-snug">
                            {candidate.title}
                          </div>
                          <div className="text-[12px] text-gray-600 mt-0.5">
                            {candidate.author}
                          </div>
                          {book.publishedDate && (
                            <div className="text-[11px] text-gray-500 mt-1">
                              {book.publishedDate}
                            </div>
                          )}
                        </div>

                        <div className="hidden md:block w-[220px] shrink-0 text-[12px] text-gray-600">
                          {book.categories.length > 0
                            ? book.categories.join(", ")
                            : "N/A"}
                        </div>

                        <div className="w-[90px] shrink-0 text-[12px] text-gray-600">
                          {typeof book.averageRating === "number"
                            ? `${book.averageRating.toFixed(1)} / 5`
                            : "No rating"}
                        </div>

                        <div className="flex-1">
                          <button
                            onClick={() => addSearchResult(book)}
                            disabled={alreadyAdded}
                            className="text-[12px] border border-[#ccc] rounded px-3 py-1 bg-[#f4f0e6] text-[#382110] hover:bg-[#e8e2d0] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {alreadyAdded
                              ? "Added to My Books"
                              : "Add to My Books"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 pt-2">
                {searchError ? (
                  <div className="py-12 text-center text-[#b42318] text-[14px] w-full">
                    {searchError}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-[14px] w-full">
                    {isSearching
                      ? "Loading search results..."
                      : "No books found for this search."}
                  </div>
                ) : (
                  searchResults.map((book) => {
                    const candidate = toLibraryBook(book);
                    const alreadyAdded = existingBookIds.has(candidate.id);

                    return (
                      <div
                        key={book.id}
                        className="w-[150px] border border-[#e8e0d0] rounded bg-white p-2 flex flex-col items-center"
                      >
                        <img
                          src={candidate.coverUrl}
                          alt={candidate.title}
                          className="w-[90px] h-[130px] object-cover shadow"
                        />
                        <div className="text-center mt-2 w-full">
                          <div
                            className="text-[12px] text-[#382110] truncate"
                            title={candidate.title}
                          >
                            {candidate.title}
                          </div>
                          <div
                            className="text-[11px] text-gray-500 truncate"
                            title={candidate.author}
                          >
                            {candidate.author}
                          </div>
                          <button
                            onClick={() => addSearchResult(book)}
                            disabled={alreadyAdded}
                            className="mt-2 text-[11px] border border-[#ccc] rounded px-2 py-1 bg-[#f4f0e6] text-[#382110] hover:bg-[#e8e2d0] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {alreadyAdded ? "Added" : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )
          ) : viewMode === "list" ? (
            <div>
              {/* Header row */}
              <div className="flex items-center gap-3 py-2 border-b-2 border-[#382110] text-[12px] text-gray-500">
                {batchMode && <div className="w-5" />}
                <div className="w-[60px] shrink-0" />
                <div className="w-[200px] shrink-0">Title</div>
                <div className="w-[130px] shrink-0">Rating / Shelf</div>
                <div className="hidden md:block w-[110px] shrink-0">
                  Date Added / Read
                </div>
                <div className="flex-1">Review</div>
              </div>

              {paginated.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-[14px]">
                  No books found.{" "}
                  <Link
                    to="/mybooks"
                    className="text-[#00635d] hover:underline no-underline"
                  >
                    View all books
                  </Link>
                </div>
              ) : (
                paginated.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    viewMode="list"
                    selected={selectedIds.has(book.id)}
                    onSelect={toggleSelect}
                    batchMode={batchMode}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 pt-2">
              {paginated.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-[14px] w-full">
                  No books found.
                </div>
              ) : (
                paginated.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    viewMode="grid"
                    selected={selectedIds.has(book.id)}
                    onSelect={toggleSelect}
                    batchMode={batchMode}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination bottom */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-[12px] text-[#00635d] justify-end mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                <ChevronLeft size={13} /> previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-1 hover:underline ${
                    currentPage === p
                      ? "text-[#382110] underline"
                      : "text-[#00635d]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
