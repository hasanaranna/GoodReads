import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BooksProvider } from "../context/BooksContext";
import { ThemeProvider } from "../context/ThemeContext";

export function Root() {
  return (
    <ThemeProvider>
      <BooksProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--theme-bg-main)', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: 'var(--theme-text-main)', transition: 'background-color 0.3s, color 0.3s' }}>
          <Header />
          <main style={{ flex: 1 }}>
            <Outlet />
          </main>
          <Footer />
        </div>
      </BooksProvider>
    </ThemeProvider>
  );
}
