import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

import { Book } from "../data/initialBooks";
import {
  fetchUserBooks,
  addBookToShelfAPI,
  updateUserBookAPI,
  removeUserBookAPI,
  updateReviewAPI,
  UserBookRow,
  ShelfBookData,
} from "../services/api";

interface BooksContextType {
  books: Book[];
  loading: boolean;
  error: string | null;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  addBook: (book: Book, bookData: ShelfBookData) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
  getBook: (id: string) => Book | undefined;
  shelfCounts: {
    all: number;
    read: number;
    currentlyReading: number;
    wantToRead: number;
  };
  userName: string;
  setUserName: (name: string) => void;
  refreshBooks: () => Promise<void>;
  updateReview: (
    id: string,
    updates: { rating?: number; review?: string },
  ) => Promise<void>;
}

function calculateCompletionPercentage(
  pagesCompleted: number,
  totalPages?: number,
): number | undefined {
  if (!totalPages || totalPages <= 0) return undefined;
  const safePages = Math.min(Math.max(pagesCompleted, 0), totalPages);
  return Math.floor((safePages / totalPages) * 100);
}

function mapRowToBook(row: UserBookRow): Book {
  const dateAdded = row.date_added
    ? new Date(row.date_added).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const dateRead = row.date_read
    ? new Date(row.date_read).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : undefined;

  const normalizedPagesCompleted =
    row.page_count && row.page_count > 0
      ? Math.min(Math.max(row.pages_completed, 0), row.page_count)
      : Math.max(row.pages_completed, 0);

  const completionPercentage =
    row.completion_percentage ??
    calculateCompletionPercentage(
      normalizedPagesCompleted,
      row.page_count || undefined,
    );

  return {
    id: row.user_book_id,
    bookId: row.book_id,
    googleBooksId: row.google_books_id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    author: row.author,
    coverUrl: row.cover_url || "https://placehold.co/120x180?text=No+Cover",
    rating: row.rating,
    shelf: row.shelf,
    dateAdded,
    dateRead,
    review: row.review || "",
    pagesCompleted: normalizedPagesCompleted,
    totalPages: row.page_count || undefined,
    completionPercentage,
    description: row.description || undefined,
  };
}

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string>(
    () => localStorage.getItem("user_name") || "",
  );

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    if (name) {
      localStorage.setItem("user_name", name);
    } else {
      localStorage.removeItem("user_name");
    }
  }, []);
  const [shelfCounts, setShelfCounts] = useState({
    all: 0,
    read: 0,
    currentlyReading: 0,
    wantToRead: 0,
  });

  const refreshBooks = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setBooks([]);
      setShelfCounts({ all: 0, read: 0, currentlyReading: 0, wantToRead: 0 });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchUserBooks();
      const mappedBooks = response.data.map(mapRowToBook);
      setBooks(mappedBooks);
      setShelfCounts(response.shelfCounts);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load books.";
      setError(message);
      console.error("Failed to fetch books:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load books when a user is logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      refreshBooks();
    }
  }, [userName, refreshBooks]);

  const addBook = useCallback(
    async (book: Book, bookData: ShelfBookData) => {
      // Optimistic update
      setBooks((prev) => [...prev, book]);
      setShelfCounts((prev) => ({
        ...prev,
        all: prev.all + 1,
        wantToRead:
          book.shelf === "want-to-read" ? prev.wantToRead + 1 : prev.wantToRead,
        currentlyReading:
          book.shelf === "currently-reading"
            ? prev.currentlyReading + 1
            : prev.currentlyReading,
        read: book.shelf === "read" ? prev.read + 1 : prev.read,
      }));

      try {
        const response = await addBookToShelfAPI(bookData, book.shelf);
        // Replace the optimistic entry with the real data
        const realBook = mapRowToBook(response.data);
        setBooks((prev) =>
          prev.map((b) =>
            b.googleBooksId === realBook.googleBooksId ? realBook : b,
          ),
        );
      } catch (err) {
        // Rollback optimistic update
        setBooks((prev) =>
          prev.filter((b) => b.googleBooksId !== book.googleBooksId),
        );
        console.error("Failed to add book:", err);
        // Refresh to get actual state
        await refreshBooks();
      }
    },
    [refreshBooks],
  );

  const updateBook = useCallback(
    async (id: string, updates: Partial<Book>) => {
      // Optimistic update
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;

          const nextBook: Book = { ...b, ...updates };
          if (nextBook.pagesCompleted !== undefined) {
            const safePages = Math.max(nextBook.pagesCompleted, 0);
            nextBook.pagesCompleted =
              nextBook.totalPages && nextBook.totalPages > 0
                ? Math.min(safePages, nextBook.totalPages)
                : safePages;

            nextBook.completionPercentage = calculateCompletionPercentage(
              nextBook.pagesCompleted,
              nextBook.totalPages,
            );
          }

          return nextBook;
        }),
      );

      try {
        const apiUpdates: Record<string, unknown> = {};
        if (updates.shelf !== undefined) apiUpdates.shelf = updates.shelf;
        if (updates.pagesCompleted !== undefined)
          apiUpdates.pages_completed = updates.pagesCompleted;
        if (updates.dateRead !== undefined)
          apiUpdates.date_read = updates.dateRead || null;

        if (Object.keys(apiUpdates).length > 0) {
          await updateUserBookAPI(
            id,
            apiUpdates as {
              shelf?: string;
              pages_completed?: number;
              date_read?: string | null;
            },
          );
        }

        // Refresh counts
        await refreshBooks();
      } catch (err) {
        console.error("Failed to update book:", err);
        await refreshBooks();
      }
    },
    [refreshBooks],
  );

  const updateReview = useCallback(
    async (id: string, updates: { rating?: number; review?: string }) => {
      // Optimistic update
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      );

      try {
        await updateReviewAPI(id, updates);
      } catch (err) {
        console.error("Failed to update review:", err);
        await refreshBooks();
      }
    },
    [refreshBooks],
  );

  const removeBook = useCallback(
    async (id: string) => {
      const bookToRemove = books.find((b) => b.id === id);
      // Optimistic update
      setBooks((prev) => prev.filter((b) => b.id !== id));

      try {
        await removeUserBookAPI(id);
        await refreshBooks();
      } catch (err) {
        // Rollback
        if (bookToRemove) {
          setBooks((prev) => [...prev, bookToRemove]);
        }
        console.error("Failed to remove book:", err);
        await refreshBooks();
      }
    },
    [books, refreshBooks],
  );

  const getBook = useCallback(
    (id: string) => books.find((b) => b.id === id),
    [books],
  );

  return (
    <BooksContext.Provider
      value={{
        books,
        loading,
        error,
        updateBook,
        addBook,
        removeBook,
        getBook,
        shelfCounts,
        userName,
        setUserName,
        refreshBooks,
        updateReview,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error("useBooks must be used within BooksProvider");
  return ctx;
}
