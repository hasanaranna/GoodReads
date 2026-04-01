import { Link, useParams } from 'react-router';
import { useBooks } from '../context/BooksContext';
import { BookOpen, BarChart3, Sparkles } from 'lucide-react';

export function Sidebar() {
  const { shelfId } = useParams();
  const { shelfCounts } = useBooks();

  const shelves = [
    { id: 'all', label: 'All', count: shelfCounts.all, path: '/mybooks' },
    { id: 'want-to-read', label: 'Want to Read', count: shelfCounts.wantToRead, path: '/mybooks/shelf/want-to-read' },
    { id: 'currently-reading', label: 'Currently Reading', count: shelfCounts.currentlyReading, path: '/mybooks/shelf/currently-reading' },
    { id: 'read', label: 'Read', count: shelfCounts.read, path: '/mybooks/shelf/read' },
  ];

  const activeShelf = shelfId || 'all';

  return (
    <aside style={{ width: 200, flexShrink: 0, marginTop: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
          <BookOpen size={15} color="var(--theme-accent)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-main)', transition: 'color 0.3s' }}>Bookshelves</span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {shelves.map((shelf) => {
            const isActive = activeShelf === shelf.id;
            return (
              <li key={shelf.id}>
                <Link to={shelf.path}
                  style={{
                    textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 8, fontSize: 13, transition: 'all 0.15s', marginBottom: 2,
                    color: isActive ? 'var(--theme-accent)' : 'var(--theme-text-muted)', fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--theme-accent-active)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--theme-bg-hover)'; e.currentTarget.style.color = 'var(--theme-text-main)'; } }}
                  onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-text-muted)'; } }}
                >
                  <span>{shelf.label}</span>
                  <span style={{ fontSize: 11, color: isActive ? 'var(--theme-accent)' : 'var(--theme-text-lighter)', background: isActive ? 'transparent' : 'var(--theme-bg-hover)', padding: '2px 7px', borderRadius: 6, fontWeight: 500 }}>
                    {shelf.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ paddingTop: 16, borderTop: '1px solid var(--theme-border)', marginBottom: 28, transition: 'border-color 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <BarChart3 size={15} color="var(--theme-accent-star)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-main)', transition: 'color 0.3s' }}>Activity</span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {['Reading Challenge', 'Year in Books', 'Reading Stats'].map((item) => (
            <li key={item}>
              <a href="#" style={{ textDecoration: 'none', color: 'var(--theme-text-light)', fontSize: 13, padding: '7px 12px', display: 'block', borderRadius: 8, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-bg-hover)'; e.currentTarget.style.color = 'var(--theme-text-main)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-text-light)'; }}
              >{item}</a>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ paddingTop: 16, borderTop: '1px solid var(--theme-border)', transition: 'border-color 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={15} color="var(--theme-accent)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--theme-text-main)', transition: 'color 0.3s' }}>Discover</span>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {['Recommendations', 'Explore'].map((item) => (
            <li key={item}>
              <a href="#" style={{ textDecoration: 'none', color: 'var(--theme-text-light)', fontSize: 13, padding: '7px 12px', display: 'block', borderRadius: 8, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--theme-bg-hover)'; e.currentTarget.style.color = 'var(--theme-text-main)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--theme-text-light)'; }}
              >{item}</a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
