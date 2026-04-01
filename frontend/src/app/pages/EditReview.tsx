import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ChevronDown, User, Trash2 } from "lucide-react";
import { useBooks } from "../context/BooksContext";
import { StarRating } from "../components/StarRating";
import { Book } from "../data/initialBooks";
import { fetchBookReviewsAPI, PublicReview } from "../services/api";

const SL: Record<string, string> = { read: "Read", "currently-reading": "Currently Reading", "want-to-read": "Want to Read" };

export function EditReview() {
  const { bookId } = useParams();
  const { getBook, updateBook, updateReview, removeBook } = useBooks();
  const navigate = useNavigate();
  const book = getBook(bookId!);
  const [rating, setRating] = useState(book?.rating || 0);
  const [shelf, setShelf] = useState<Book["shelf"]>(book?.shelf || "want-to-read");
  const [reviewText, setReviewText] = useState(book?.review || "");
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loadingR, setLoadingR] = useState(false);

  useEffect(() => {
    if (!book?.googleBooksId) return;
    setLoadingR(true);
    fetchBookReviewsAPI(book.googleBooksId).then(r => setReviews(r.data)).catch(() => {}).finally(() => setLoadingR(false));
  }, [book?.googleBooksId]);

  if (!book) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--theme-text-light)', marginBottom: 12 }}>Book not found.</p>
      <Link to="/mybooks" style={{ color: 'var(--theme-accent)', textDecoration: 'none' }}>Back to My Books</Link>
    </div>
  );

  async function handlePost() {
    setSaving(true);
    try {
      if (shelf !== book!.shelf) await updateBook(book!.id, { shelf });
      await updateReview(book!.id, { rating, review: reviewText });
      navigate("/mybooks");
    } catch (e) { console.error(e); } finally { setSaving(false); }
  }

  const getShelfBg = (s: string) => `var(--theme-shelf-${s === 'currently-reading' ? 'reading' : s === 'want-to-read' ? 'want' : 'read'}-bg)`;
  const getShelfText = (s: string) => `var(--theme-shelf-${s === 'currently-reading' ? 'reading' : s === 'want-to-read' ? 'want' : 'read'}-text)`;

  const others = reviews.filter(r => r.user_book_id !== book.id);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ fontSize: 12, color: 'var(--theme-text-lighter)', marginBottom: 24, transition: 'color 0.3s' }}>
        <Link to="/mybooks" style={{ color: 'var(--theme-text-light)', textDecoration: 'none' }}>My Books</Link> / <span style={{ color: 'var(--theme-text-muted)' }}>{book.title}</span>
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 32, padding: 20, borderRadius: 16, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', boxShadow: 'var(--theme-shadow-sm)', transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s' }}>
        <img src={book.coverUrl} alt="" style={{ width: 90, height: 130, objectFit: 'cover', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--theme-text-main)', lineHeight: 1.3, marginBottom: 4 }}>
            {book.title}{book.subtitle && <span style={{ color: 'var(--theme-text-light)', fontWeight: 400 }}>: {book.subtitle}</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--theme-text-muted)' }}>by {book.author}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
        <span style={{ fontSize: 14, color: 'var(--theme-text-muted)', fontWeight: 500 }}>My Rating</span>
        <StarRating rating={rating} interactive size="lg" onChange={setRating} />
        {rating > 0 && <button onClick={() => setRating(0)} style={{ fontSize: 12, color: 'var(--theme-text-lighter)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
        <span style={{ fontSize: 14, color: 'var(--theme-text-muted)', fontWeight: 500 }}>Shelf</span>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: getShelfBg(shelf), color: getShelfText(shelf) }}>
            {SL[shelf]} <ChevronDown size={12} />
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', borderRadius: 12, boxShadow: 'var(--theme-shadow)', minWidth: 180, marginTop: 6, overflow: 'hidden' }}>
              {Object.entries(SL).map(([k, l]) => (
                <button key={k} onClick={() => { setShelf(k as Book["shelf"]); setShowMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, border: 'none', cursor: 'pointer', color: getShelfText(k), background: shelf === k ? 'var(--theme-bg-hover)' : 'transparent', fontWeight: shelf === k ? 600 : 400 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = shelf === k ? 'var(--theme-bg-hover)' : 'transparent')}
                >{shelf === k && "✓ "}{l}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
        <div style={{ fontSize: 15, color: 'var(--theme-text-muted)', marginBottom: 12, fontWeight: 500 }}>What did you think?</div>
        <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Share your thoughts..."
          style={{ width: '100%', borderRadius: 12, padding: 16, fontSize: 14, color: 'var(--theme-text-main)', border: '1.5px solid var(--theme-border)', outline: 'none', resize: 'vertical', minHeight: 140, background: 'var(--theme-bg-input)', boxSizing: 'border-box', transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' }}
          onFocus={e => e.target.style.borderColor = 'var(--theme-accent)'} onBlur={e => e.target.style.borderColor = 'var(--theme-border)'} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', borderBottom: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
        <button onClick={handlePost} disabled={saving}
          style={{ padding: '10px 28px', background: 'var(--theme-accent)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: saving ? 0.6 : 1, transition: 'background-color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--theme-accent)')}
        >
          {saving ? "Saving..." : "Save Review"}
        </button>
        <button onClick={async () => { if (confirm("Remove this book?")) { await removeBook(book.id); navigate("/mybooks"); } }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}>
          <Trash2 size={14} /> Remove
        </button>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--theme-text-main)', margin: 0, transition: 'color 0.3s' }}>Community Reviews</h2>
          <span style={{ fontSize: 13, color: 'var(--theme-text-lighter)', transition: 'color 0.3s' }}>{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
        </div>

        {loadingR && <div style={{ fontSize: 13, color: 'var(--theme-text-lighter)', padding: '24px 0' }}>Loading...</div>}

        {!loadingR && others.length === 0 && (
          <div style={{ borderRadius: 14, padding: 32, textAlign: 'center', background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', transition: 'background-color 0.3s, border-color 0.3s' }}>
            <p style={{ fontSize: 14, color: 'var(--theme-text-lighter)', margin: '0 0 4px' }}>No community reviews yet.</p>
            <p style={{ fontSize: 12, color: 'var(--theme-text-lighter)', margin: 0, opacity: 0.7 }}>Be the first to share your thoughts!</p>
          </div>
        )}

        {!loadingR && others.map(r => (
          <div key={r.user_book_id} style={{ padding: '20px 0', borderBottom: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--theme-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} color="white" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--theme-text-main)' }}>{r.user_name}</span>
                  <span style={{ fontSize: 12, color: 'var(--theme-text-lighter)' }}>@{r.username}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {r.rating > 0 && <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? 'var(--theme-accent-star)' : 'var(--theme-border)' }}>★</span>)}</div>}
                  <span style={{ fontSize: 11, color: 'var(--theme-text-lighter)' }}>· {new Date(r.date_added).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
              </div>
            </div>
            {r.review && <p style={{ marginLeft: 48, fontSize: 14, color: 'var(--theme-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 0 48px' }}>{r.review}</p>}
            {!r.review && r.rating > 0 && <p style={{ marginLeft: 48, fontSize: 12, color: 'var(--theme-text-lighter)', fontStyle: 'italic', margin: '0 0 0 48px' }}>Rated {r.rating}/5 stars</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
