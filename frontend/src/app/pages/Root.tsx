import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { BooksProvider } from "../context/BooksContext";

export function Root() {
  return (
    <BooksProvider>
      <div className="min-h-screen flex flex-col bg-[#ffffff]">
        <Header />
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <Footer />
      </div>
    </BooksProvider>
  );
}
