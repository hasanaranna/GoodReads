import { useEffect, useState } from "react";
import { Search, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, Link } from "react-router";
import { useBooks } from "../context/BooksContext";
import { Sidebar } from "../components/Sidebar";
import { BookRow } from "../components/BookRow";

const SN: Record<string, string> = { "want-to-read": "Want to Read", "currently-reading": "Currently Reading", read: "Read" };
const PER_PAGE = 10;

export function MyBooks() {
  const { shelfId } = useParams();
  const { books } = useBooks();
  const [view, setView] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"title" | "author" | "rating" | "dateAdded">("dateAdded");
  const [batch, setBatch] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const filtered = books.filter((b) => {
    const ms = !shelfId || b.shelf === shelfId;
    const q = search.trim().toLowerCase();
    return ms && (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "author") return a.author.localeCompare(b.author);
    if (sort === "rating") return b.rating - a.rating;
    return 0;
  });
  useEffect(() => setPage(1), [search, shelfId]);
  const tp = Math.ceil(sorted.length / PER_PAGE);
  const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const toggle = (id: string) => setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const label = shelfId ? SN[shelfId] : undefined;

  const Pager = () => tp > 1 ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', fontSize: 12 }}>
      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--theme-text-light)', background: 'none', border: 'none', cursor: 'pointer', opacity: page === 1 ? 0.3 : 1 }}><ChevronLeft size={13} /> prev</button>
      {Array.from({ length: tp }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => setPage(p)} style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: page === p ? 'var(--theme-accent-active)' : 'transparent', color: page === p ? 'var(--theme-accent)' : 'var(--theme-text-lighter)', fontWeight: page === p ? 600 : 400 }}>{p}</button>
      ))}
      <button onClick={() => setPage(p => Math.min(tp, p + 1))} disabled={page === tp} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--theme-text-light)', background: 'none', border: 'none', cursor: 'pointer', opacity: page === tp ? 0.3 : 1 }}>next <ChevronRight size={13} /></button>
    </div>
  ) : null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>
      <div style={{ fontSize: 13, color: 'var(--theme-text-light)', marginBottom: 16, marginTop: 24, transition: 'color 0.3s' }}>
        <Link to="/mybooks" style={{ textDecoration: 'none', color: 'var(--theme-text-light)' }}>My Books</Link>
        {label && <span style={{ color: 'var(--theme-text-lighter)' }}> / {label}</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--theme-bg-input)', borderRadius: 10, padding: '8px 14px', border: '1.5px solid var(--theme-border)', transition: 'background-color 0.3s, border-color 0.3s' }}>
          <Search size={15} color="var(--theme-text-light)" />
          <input type="text" placeholder="Filter books..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--theme-text-main)', width: 180 }} />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
          <button onClick={() => { setBatch(!batch); setSel(new Set()); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: batch ? 'var(--theme-accent)' : 'var(--theme-text-light)', fontWeight: 500 }}>Batch Edit</button>
          <span style={{ color: 'var(--theme-border)' }}>|</span>
          <button onClick={() => setView("list")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: view === 'list' ? 'var(--theme-text-main)' : 'var(--theme-text-lighter)' }}><List size={16} /></button>
          <button onClick={() => setView("grid")} style={{ background: 'none', border: 'none', cursor: 'pointer', color: view === 'grid' ? 'var(--theme-text-main)' : 'var(--theme-text-lighter)' }}><LayoutGrid size={16} /></button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
        <Sidebar />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--theme-text-lighter)', transition: 'color 0.3s' }}>{filtered.length} book{filtered.length !== 1 ? "s" : ""}{label ? ` on ${label}` : ""}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
              <span style={{ color: 'var(--theme-text-lighter)' }}>Sort:</span>
              {(["title", "author", "rating", "dateAdded"] as const).map(s => (
                <button key={s} onClick={() => setSort(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 12, color: sort === s ? 'var(--theme-accent)' : 'var(--theme-text-lighter)', fontWeight: sort === s ? 600 : 400 }}>
                  {s === "dateAdded" ? "Date" : s}
                </button>
              ))}
            </div>
          </div>
          <Pager />
          {view === "list" ? (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '2px solid var(--theme-border)', fontSize: 11, color: 'var(--theme-text-lighter)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 500, transition: 'border-color 0.3s' }}>
                {batch && <div style={{ width: 20 }} />}
                <div style={{ width: 52, flexShrink: 0 }} />
                <div style={{ width: 200, flexShrink: 0 }}>Title</div>
                <div style={{ width: 140, flexShrink: 0, textAlign: 'center' }}>Rating</div>
                <div className="hidden md:block" style={{ width: 100, flexShrink: 0 }}>Date</div>
                <div style={{ flex: 1 }}>Review</div>
              </div>
              {paged.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--theme-text-lighter)', fontSize: 14 }}>No books found. <Link to="/mybooks" style={{ color: 'var(--theme-accent)', textDecoration: 'none' }}>View all</Link></div>
              ) : paged.map(b => <BookRow key={b.id} book={b} viewMode="list" selected={sel.has(b.id)} onSelect={toggle} batchMode={batch} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 12 }}>
              {paged.length === 0 ? <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--theme-text-lighter)', fontSize: 14, width: '100%' }}>No books found.</div>
              : paged.map(b => <BookRow key={b.id} book={b} viewMode="grid" selected={sel.has(b.id)} onSelect={toggle} batchMode={batch} />)}
            </div>
          )}
          <div style={{ marginTop: 16 }}><Pager /></div>
        </div>
      </div>
    </div>
  );
}
