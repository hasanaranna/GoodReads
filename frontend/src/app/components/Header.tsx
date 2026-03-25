import { useEffect, useMemo, useState, useRef } from "react";
import {
  Bell,
  MessageSquare,
  Users,
  Menu,
  Search,
  ChevronDown,
  X,
  User,
  LogOut,
} from "lucide-react";
import { Link } from "react-router";
import { useBooks } from "../context/BooksContext";
import { Book } from "../data/initialBooks";

const SEARCH_DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 8;
const API_BASE_URL =
  (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:8080";

interface BackendSearchBook {
  id: string;
  title: string;
  authors: string[];
  pageCount: number | null;
  averageRating: number | null;
  coverImage: string | null;
}

function toLibraryBook(book: BackendSearchBook): Book {
  const dateAdded = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const normalizedRating =
    typeof book.averageRating === "number" ? Math.round(book.averageRating) : 0;

  return {
    id: `gb-${book.id}`,
    title: book.title || "Untitled",
    author:
      Array.isArray(book.authors) && book.authors.length > 0
        ? book.authors[0]
        : "Unknown Author",
    coverUrl: book.coverImage || "https://placehold.co/120x180?text=No+Cover",
    rating: Math.max(0, Math.min(5, normalizedRating)),
    shelf: "want-to-read",
    dateAdded,
    review: "",
    totalPages: book.pageCount || undefined,
    pagesCompleted: 0,
  };
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<BackendSearchBook[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { books, addBook, userName } = useBooks();

  const existingBookIds = useMemo(
    () => new Set(books.map((book) => book.id)),
    [books],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
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
        q: debouncedSearchQuery,
        sort: "relevance",
        page: "1",
        limit: String(SEARCH_LIMIT),
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
  }, [debouncedSearchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleResults = results.filter(
    (book) => !existingBookIds.has(`gb-${book.id}`),
  );

  function handleAddBook(book: BackendSearchBook) {
    const mappedBook = toLibraryBook(book);
    if (existingBookIds.has(mappedBook.id)) {
      return;
    }

    addBook({
      ...mappedBook,
    });

    setSearchQuery("");
    setDebouncedSearchQuery("");
    setResults([]);
    setShowResults(false);
  }

  return (
    <header className="bg-[#f4f0e6] border-b border-[#d8d0bb]">
      <div className="max-w-[1100px] mx-auto px-4 h-[58px] flex items-center gap-5">
        {/* Logo */}
        <Link
          to="/"
          className="text-[#382110] no-underline shrink-0"
          style={{
            fontFamily: "Lora, serif",
            fontSize: "28px",
            fontWeight: 700,
          }}
        >
          goodreads
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-4 text-[13px] text-[#382110]">
          <Link to="/" className="hover:underline no-underline text-[#382110]">
            Home
          </Link>
          <Link
            to="/mybooks"
            className="hover:underline no-underline text-[#382110]"
          >
            My Books
          </Link>
          <button className="flex items-center gap-0.5 text-[#382110] hover:underline text-[13px]">
            Browse <ChevronDown size={12} />
          </button>
          <button className="flex items-center gap-0.5 text-[#382110] hover:underline text-[13px]">
            Community <ChevronDown size={12} />
          </button>
        </nav>

        {/* Right side: Search + Icons */}
        <div className="flex items-center gap-[1.5vw] ml-auto text-[#382110]">
          {/* Search */}
          <div className="relative w-[280px]" style={{ marginRight: "15%" }}>
            <div 
              className="flex items-center bg-[#ffffff] border border-[#c9bfb0] rounded-full w-full h-[42px] gap-2"
              style={{ paddingLeft: "15px", paddingRight: "15px" }}
            >
              <input
                type="text"
                placeholder="Search books, authors..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="flex-1 appearance-none outline-none border-0 shadow-none text-[13px] text-gray-700 bg-transparent"
              />
              {searchQuery ? (
                <X
                  size={14}
                  className="text-gray-400 cursor-pointer"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                    setResults([]);
                    setSearchError("");
                  }}
                />
              ) : (
                <Search size={14} className="text-gray-400" />
              )}
            </div>
            {showResults && (searchQuery.trim().length > 1 || isSearching) && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] border border-[#ddd] rounded shadow-lg z-50">
                {isSearching && (
                  <div className="px-3 py-2 text-[12px] text-gray-500">
                    Searching...
                  </div>
                )}

                {!isSearching && searchError && (
                  <div className="px-3 py-2 text-[12px] text-[#b42318]">
                    {searchError}
                  </div>
                )}

                {!isSearching &&
                  !searchError &&
                  visibleResults.length === 0 && (
                    <div className="px-3 py-2 text-[12px] text-gray-500">
                      No books found.
                    </div>
                  )}

                {!isSearching &&
                  !searchError &&
                  visibleResults.length > 0 &&
                  visibleResults.map((book) => {
                    const mappedBook = toLibraryBook(book);

                    return (
                      <button
                        key={book.id}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f4f0e6] text-left"
                        onMouseDown={() => handleAddBook(book)}
                      >
                        <img
                          src={mappedBook.coverUrl}
                          alt={mappedBook.title}
                          className="w-8 h-10 object-cover rounded"
                        />
                        <div>
                          <div className="text-[13px] text-[#382110]">
                            {mappedBook.title}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {mappedBook.author}
                          </div>
                        </div>
                        <span className="ml-auto text-[11px] text-[#00635d] border border-[#00635d] px-1.5 py-0.5 rounded">
                          + Add
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Icons */}
          <button className="bg-transparent appearance-none outline-none border-0 shadow-none hover:text-[#00635d]">
            <Bell size={18} />
          </button>
          <button className="bg-transparent appearance-none outline-none border-0 shadow-none hover:text-[#00635d]">
            <MessageSquare size={18} />
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button 
              className="bg-transparent appearance-none outline-none border-0 shadow-none hover:text-[#00635d]"
              onClick={() => userName && setShowProfileMenu(!showProfileMenu)}
            >
              <Users size={18} />
            </button>
            
            {showProfileMenu && userName && (
              <div 
                className="absolute top-full mt-2 bg-[#ffffff] border border-[#d8d0bb] rounded-md shadow-lg z-50 flex flex-col pt-2 pb-2 left-1/2 -translate-x-1/2"
                style={{ width: "20vw", minWidth: "280px" }}
              >
                <div className="flex flex-col items-center gap-4 p-8 border-b border-[#d8d0bb] bg-[#f4f0e6]">
                  <div className="w-16 h-16 rounded-full bg-[#e8e0d0] flex items-center justify-center text-[#382110]">
                    <User size={32} />
                  </div>
                  <span className="text-[16px] font-semibold text-[#382110] truncate w-full text-center">
                    {userName}
                  </span>
                </div>
                <div className="p-3">
                  <button 
                    className="flex items-center justify-center gap-2 w-full p-3 text-[15px] font-medium text-[#382110] hover:bg-[#f4f0e6] transition-colors rounded-sm"
                    onClick={() => {
                      // Logout logic goes here later
                      setShowProfileMenu(false);
                    }}
                  >
                    <LogOut size={18} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="bg-transparent appearance-none outline-none border-0 shadow-none hover:text-[#00635d]">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
