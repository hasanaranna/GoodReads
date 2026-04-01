import { useState } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { Book } from "../data/initialBooks";
import { StarRating } from "./StarRating";
import { useBooks } from "../context/BooksContext";

interface BookRowProps { book: Book; viewMode?: "list" | "grid"; selected?: boolean; onSelect?: (id: string) => void; batchMode?: boolean; }

const SL: Record<string, string> = { read: "Read", "currently-reading": "Currently Reading", "want-to-read": "Want to Read" };

export function BookRow({ book, viewMode = "list", selected = false, onSelect, batchMode = false }: BookRowProps) {
  const { updateBook } = useBooks();
  const [showMenu, setShowMenu] = useState(false);
  const pct = book.shelf === "currently-reading" && book.totalPages ? Math.round(((book.pagesCompleted || 0) / book.totalPages) * 100) : null;

  async function changeShelf(s: string) { await updateBook(book.id, { shelf: s as Book["shelf"] }); setShowMenu(false); }

  const getShelfBg = (shelf: string) => `var(--theme-shelf-${shelf === 'currently-reading' ? 'reading' : shelf === 'want-to-read' ? 'want' : 'read'}-bg)`;
  const getShelfText = (shelf: string) => `var(--theme-shelf-${shelf === 'currently-reading' ? 'reading' : shelf === 'want-to-read' ? 'want' : 'read'}-text)`;

  if (viewMode === "grid") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.2s, transform 0.2s', boxShadow: 'var(--theme-shadow-sm)' }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--theme-shadow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--theme-shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {batchMode && <input type="checkbox" checked={selected} onChange={() => onSelect?.(book.id)} />}
        <Link to={`/book/${book.id}/review`}><img src={book.coverUrl} alt="" style={{ width: 85, height: 120, objectFit: 'cover', borderRadius: 8 }} /></Link>
        <div style={{ textAlign: 'center', maxWidth: 100 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--theme-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
          <div style={{ fontSize: 11, color: 'var(--theme-text-muted)' }}>{book.author}</div>
          <StarRating rating={book.rating} showCount size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--theme-border)', transition: 'background-color 0.3s, border-color 0.3s', background: selected ? 'var(--theme-accent-active)' : 'transparent' }}>
      {batchMode && <div style={{ paddingTop: 4 }}><input type="checkbox" checked={selected} onChange={() => onSelect?.(book.id)} style={{ accentColor: 'var(--theme-accent)' }} /></div>}
      <Link to={`/book/${book.id}/review`} style={{ flexShrink: 0 }}><img src={book.coverUrl} alt="" style={{ width: 52, height: 76, objectFit: 'cover', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} /></Link>
      <div style={{ width: 200, flexShrink: 0, paddingTop: 4 }}>
        <Link to={`/book/${book.id}/review`} style={{ textDecoration: 'none', fontSize: 14, fontWeight: 500, color: 'var(--theme-text-main)', transition: 'color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--theme-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--theme-text-main)')}
        >{book.title}</Link>
        <div style={{ fontSize: 12, color: 'var(--theme-text-light)', marginTop: 3 }}>{book.author}</div>
      </div>
      <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <StarRating rating={book.rating} showCount size="sm" />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: getShelfBg(book.shelf), color: getShelfText(book.shelf), transition: 'opacity 0.2s' }}>
            {SL[book.shelf]} <ChevronDown size={10} />
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 10, boxShadow: 'var(--theme-shadow)', minWidth: 160, marginTop: 4, overflow: 'hidden' }}>
              {Object.entries(SL).map(([k, l]) => (
                <button key={k} onClick={() => changeShelf(k)} style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 12, border: 'none', cursor: 'pointer', color: getShelfText(k), background: book.shelf === k ? 'var(--theme-bg-hover)' : 'transparent', fontWeight: book.shelf === k ? 600 : 400, transition: 'background-color 0.1s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = book.shelf === k ? 'var(--theme-bg-hover)' : 'transparent')}
                >{l}</button>
              ))}
            </div>
          )}
        </div>
        {pct !== null && <Link to={`/book/${book.id}/progress`} style={{ fontSize: 11, color: 'var(--theme-accent)', textDecoration: 'none', fontWeight: 500 }}>{pct}% done</Link>}
      </div>
      <div className="hidden md:flex" style={{ flexDirection: 'column', gap: 4, width: 100, flexShrink: 0, fontSize: 12, color: 'var(--theme-text-lighter)', paddingTop: 4 }}>
        <span>{book.dateAdded}</span>{book.dateRead && <span>{book.dateRead}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0, fontSize: 13, paddingTop: 4 }}>
        {book.review ? (
          <div><span style={{ color: 'var(--theme-text-muted)' }}>{book.review}</span> <Link to={`/book/${book.id}/review`} style={{ color: 'var(--theme-accent)', textDecoration: 'none', fontWeight: 500, fontSize: 12 }}>Edit</Link></div>
        ) : (
          <Link to={`/book/${book.id}/review`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 70 }}>
            <MessageSquare size={18} color="var(--theme-border)" /><span style={{ fontSize: 11, color: 'var(--theme-text-lighter)' }}>Review</span>
          </Link>
        )}
      </div>
    </div>
  );
}
