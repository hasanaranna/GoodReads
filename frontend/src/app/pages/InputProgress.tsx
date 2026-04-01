import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Trash2 } from 'lucide-react';
import { useBooks } from '../context/BooksContext';

export function InputProgress() {
  const { bookId } = useParams();
  const { getBook, updateBook, removeBook } = useBooks();
  const navigate = useNavigate();
  const book = getBook(bookId!);
  const [editing, setEditing] = useState<'pages' | 'total' | 'pct' | null>(null);
  const [pages, setPages] = useState(book?.pagesCompleted || 0);
  const [total, setTotal] = useState(book?.totalPages || 0);
  const [saving, setSaving] = useState(false);

  if (!book) return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--theme-text-light)' }}>Book not found.</p>
      <Link to="/mybooks" style={{ color: 'var(--theme-accent)', textDecoration: 'none' }}>Back to My Books</Link>
    </div>
  );

  const pct = total > 0 ? Math.round((pages / total) * 100) : 0;
  async function handleUpdate() {
    setSaving(true);
    try { await updateBook(book!.id, { pagesCompleted: pages }); navigate('/mybooks'); }
    catch (e) { console.error(e); } finally { setSaving(false); }
  }
  function setPct(v: string) { const n = parseInt(v); if (!isNaN(n) && total > 0) setPages(Math.min(Math.round((n/100)*total), total)); }

  const inputStyle = { background: 'var(--theme-bg-input)', border: '1.5px solid var(--theme-border)', borderRadius: 8, padding: '6px 12px', fontSize: 13, color: 'var(--theme-text-main)', outline: 'none', width: 90, boxSizing: 'border-box' as const, transition: 'border-color 0.2s, background-color 0.3s, color 0.3s' };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ fontSize: 12, color: 'var(--theme-text-lighter)', marginBottom: 24, transition: 'color 0.3s' }}>
        <Link to="/mybooks" style={{ color: 'var(--theme-text-light)', textDecoration: 'none' }}>My Books</Link> / <span style={{ color: 'var(--theme-text-muted)' }}>{book.title}</span> / Progress
      </div>

      {/* Book card */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 32, padding: 20, borderRadius: 16, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', boxShadow: 'var(--theme-shadow-sm)', transition: 'background-color 0.3s, border-color 0.3s, box-shadow 0.3s' }}>
        <img src={book.coverUrl} alt="" style={{ width: 80, height: 115, objectFit: 'cover', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--theme-text-main)', lineHeight: 1.3, marginBottom: 4 }}>
            {book.title}{book.subtitle && <span style={{ color: 'var(--theme-text-light)', fontWeight: 400 }}>: {book.subtitle}</span>}
          </div>
          <div style={{ fontSize: 14, color: 'var(--theme-text-muted)' }}>by {book.author}</div>
        </div>
      </div>

      {/* Progress bar card */}
      <div style={{ padding: 24, borderRadius: 16, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', boxShadow: 'var(--theme-shadow-sm)', marginBottom: 24, transition: 'background-color 0.3s, border-color 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--theme-text-muted)', fontWeight: 500 }}>Reading Progress</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--theme-accent)' }}>{pct}%</span>
        </div>
        <div style={{ width: '100%', borderRadius: 99, height: 8, background: 'var(--theme-bg-main)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 99, background: 'var(--theme-accent)', transition: 'width 0.5s ease, background-color 0.3s' }} />
        </div>
      </div>

      {/* Edit fields card */}
      <div style={{ borderRadius: 16, background: 'var(--theme-bg-card)', border: '1px solid var(--theme-border)', overflow: 'hidden', boxShadow: 'var(--theme-shadow-sm)', marginBottom: 24, transition: 'background-color 0.3s, border-color 0.3s' }}>
        {[
          { label: 'Pages Completed', key: 'pages' as const, val: pages, set: (v: string) => setPages(Math.max(0, parseInt(v) || 0)) },
          { label: 'Total Pages', key: 'total' as const, val: total, set: (v: string) => setTotal(Math.max(1, parseInt(v) || 1)) },
          { label: 'Percentage', key: 'pct' as const, val: `${pct}%`, set: setPct },
        ].map((f, i) => (
          <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: i < 2 ? '1px solid var(--theme-border)' : 'none', transition: 'border-color 0.3s' }}>
            <span style={{ fontSize: 14, color: 'var(--theme-text-muted)' }}>{f.label}</span>
            {editing === f.key ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" defaultValue={typeof f.val === 'number' ? f.val : pct} onChange={e => f.set(e.target.value)} style={inputStyle} autoFocus
                  onFocus={e => e.target.style.borderColor = 'var(--theme-accent)'} onBlur={e => e.target.style.borderColor = 'var(--theme-border)'} />
                {f.key === 'pct' && <span style={{ fontSize: 13, color: 'var(--theme-text-light)' }}>%</span>}
                <button onClick={() => setEditing(null)} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--theme-accent)', color: '#fff', fontWeight: 600, transition: 'background-color 0.2s' }}>Done</button>
              </div>
            ) : (
              <button onClick={() => setEditing(f.key)} style={{ fontSize: 14, color: 'var(--theme-text-main)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {f.val} <span style={{ fontSize: 11, color: 'var(--theme-text-lighter)', marginLeft: 4 }}>Edit</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={handleUpdate} disabled={saving}
          style={{ padding: '10px 28px', background: 'var(--theme-accent)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', opacity: saving ? 0.6 : 1, transition: 'background-color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--theme-accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--theme-accent)')}
        >
          {saving ? "Saving..." : "Update Progress"}
        </button>
        <button onClick={async () => { if (confirm('Remove this book?')) { await removeBook(book.id); navigate('/mybooks'); } }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.8 }}>
          <Trash2 size={14} /> Remove
        </button>
      </div>
    </div>
  );
}
