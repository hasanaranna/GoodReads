import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Search, ChevronDown, BookOpen, LogOut, User, Plus, X, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useBooks } from "../context/BooksContext";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URL =
  (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || "http://localhost:8080";

interface BackendSearchBook {
  id: string; title: string; subtitle?: string; authors: string[]; coverImage: string;
  publishedDate: string; pageCount: number; categories: string[];
  averageRating: number; description: string;
}

function toLibraryBook(book: BackendSearchBook) {
  return {
    localBook: {
      id: "", bookId: "", googleBooksId: book.id, title: book.title, subtitle: book.subtitle,
      author: book.authors?.join(", ") || "Unknown", coverUrl: book.coverImage || "",
      totalPages: book.pageCount || 0, pagesCompleted: 0, rating: 0, review: "",
      shelf: "want-to-read", dateAdded: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    },
    shelfData: {
      google_books_id: book.id, title: book.title, subtitle: book.subtitle,
      author: book.authors?.join(", ") || "Unknown", cover_url: book.coverImage || "",
      page_count: book.pageCount || 0, description: book.description || "",
      published_date: book.publishedDate || "", categories: book.categories || [],
      average_rating: book.averageRating || 0,
    },
  };
}

export function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { books, addBook, userName, setUserName } = useBooks();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [results, setResults] = useState<BackendSearchBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const existingGoogleIds = useMemo(() => new Set(books.map((b) => b.googleBooksId)), [books]);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [searchQuery]);

  const fetchBooks = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), maxResults: "8" });
      const response = await fetch(`${API_BASE_URL}/api/books/search?${params.toString()}`);
      const payload = await response.json();
      setResults(payload.data || []); setShowResults(true);
    } catch { setResults([]); } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchBooks(debouncedSearchQuery); }, [debouncedSearchQuery, fetchBooks]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setShowProfileMenu(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleResults = results.filter((b) => !existingGoogleIds.has(b.id));

  async function handleAddBook(book: BackendSearchBook) {
    const { localBook, shelfData } = toLibraryBook(book);
    if (existingGoogleIds.has(book.id)) return;
    try {
      // Need to cast localBook locally because Book type is strict
      await addBook(localBook as any, shelfData);
    } catch {}
    setSearchQuery(""); setDebouncedSearchQuery(""); setResults([]); setShowResults(false);
  }

  async function handleLogout() {
    const token = localStorage.getItem("access_token");
    try { await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }); } catch {}
    localStorage.removeItem("access_token"); setUserName(""); navigate("/");
  }

  return (
    <header style={{ background: 'var(--theme-bg-card)', borderBottom: '1px solid var(--theme-border)', position: 'sticky', top: 0, zIndex: 40, transition: 'background-color 0.3s, border-color 0.3s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Logo */}
        <Link to="/mybooks" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--theme-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s' }}>
            <BookOpen size={16} color="white" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--theme-text-main)', letterSpacing: '-0.3px', transition: 'color 0.3s' }}>GoodReads</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
          {[{ label: 'Home', to: '/mybooks' }, { label: 'My Books', to: '/mybooks' }].map((item) => (
            <Link key={item.label} to={item.to}
              style={{ textDecoration: 'none', color: 'var(--theme-text-muted)', fontSize: 14, fontWeight: 500, padding: '6px 14px', borderRadius: 8, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-bg-hover)'; e.currentTarget.style.color = 'var(--theme-text-main)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-text-muted)'; }}
            >{item.label}</Link>
          ))}
        </nav>

        {/* Search */}
        <div ref={searchRef} style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--theme-bg-input)', borderRadius: 10, padding: '8px 14px', border: '1.5px solid transparent', transition: 'border-color 0.2s, background-color 0.3s' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--theme-accent)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
          >
            <Search size={16} color="var(--theme-text-light)" />
            <input type="text" placeholder="Search books to add..." value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value.trim()) { setResults([]); setShowResults(false); } }}
              onFocus={() => results.length > 0 && setShowResults(true)}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: 'var(--theme-text-main)' }} />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setResults([]); setShowResults(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--theme-text-lighter)', padding: 0, display: 'flex' }}>
                <X size={15} />
              </button>
            )}
          </div>

          {showResults && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: 'var(--theme-bg-card)', borderRadius: 14, boxShadow: 'var(--theme-shadow)', border: '1px solid var(--theme-border)', maxHeight: 400, overflowY: 'auto', zIndex: 50 }}>
              {isLoading && <div style={{ padding: '16px 18px', fontSize: 13, color: 'var(--theme-text-light)' }}>Searching...</div>}
              {!isLoading && visibleResults.length === 0 && searchQuery.trim() && (
                <div style={{ padding: '24px 18px', fontSize: 13, color: 'var(--theme-text-lighter)', textAlign: 'center' }}>No new books found</div>
              )}
              {visibleResults.map((book) => (
                <div key={book.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--theme-border)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <img src={book.coverImage || "https://via.placeholder.com/40x56?text=No+Cover"} alt="" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--theme-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--theme-text-light)', marginTop: 2 }}>{book.authors?.join(", ")}</div>
                    {book.averageRating > 0 && <div style={{ fontSize: 11, color: 'var(--theme-accent-star)', marginTop: 3 }}>★ {book.averageRating}</div>}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleAddBook(book); }}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--theme-accent)', color: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--theme-accent)')}
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
          {/* Theme Toggle */}
          <button onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: 'var(--theme-bg-input)', border: '1px solid var(--theme-border)', cursor: 'pointer', color: 'var(--theme-text-muted)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--theme-text-main)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--theme-text-muted)')}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Profile */}
          <div ref={profileMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, cursor: 'pointer', border: '1.5px solid var(--theme-border)', background: 'var(--theme-bg-card)', transition: 'border-color 0.15s, background-color 0.3s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--theme-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--theme-border)')}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--theme-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s' }}>
                <User size={14} color="white" />
              </div>
              <span className="hidden sm:inline" style={{ fontSize: 13, color: 'var(--theme-text-muted)', fontWeight: 500, transition: 'color 0.3s' }}>{userName || "User"}</span>
              <ChevronDown size={14} color="var(--theme-text-lighter)" />
            </button>
            {showProfileMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, background: 'var(--theme-bg-card)', borderRadius: 12, boxShadow: 'var(--theme-shadow)', border: '1px solid var(--theme-border)', minWidth: 180, overflow: 'hidden', zIndex: 50 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--theme-border)' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-main)' }}>{userName || "User"}</div>
                </div>
                <button onClick={handleLogout}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
