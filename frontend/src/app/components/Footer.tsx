import { BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{ background: 'var(--theme-bg-card)', borderTop: '1px solid var(--theme-border)', marginTop: 'auto', transition: 'background-color 0.3s, border-color 0.3s' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, fontSize: 13 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--theme-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.3s' }}>
                <BookOpen size={14} color="white" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--theme-text-main)' }}>GoodReads</span>
            </div>
            <p style={{ color: 'var(--theme-text-light)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>Discover, track, and share<br/>your reading journey.</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--theme-text-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Company</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {['About', 'Careers', 'Terms', 'Privacy', 'Help'].map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ textDecoration: 'none', color: 'var(--theme-text-muted)', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--theme-text-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--theme-text-muted)')}
                  >{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--theme-text-light)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Resources</div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {['Authors', 'Advertise', 'Blog', 'API'].map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ textDecoration: 'none', color: 'var(--theme-text-muted)', transition: 'color 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--theme-text-main)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--theme-text-muted)')}
                  >{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 12, color: 'var(--theme-text-lighter)', margin: 0, marginTop: 8 }}>© 2026 GoodReads</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
