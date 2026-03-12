import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Book, initialBooks } from '../data/initialBooks';

type Action =
  | { type: 'UPDATE_BOOK'; payload: Partial<Book> & { id: string } }
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'REMOVE_BOOK'; payload: string };

interface BooksContextType {
  books: Book[];
  updateBook: (id: string, updates: Partial<Book>) => void;
  addBook: (book: Book) => void;
  removeBook: (id: string) => void;
  getBook: (id: string) => Book | undefined;
  shelfCounts: { all: number; read: number; currentlyReading: number; wantToRead: number };
}

function booksReducer(state: Book[], action: Action): Book[] {
  switch (action.type) {
    case 'UPDATE_BOOK':
      return state.map((b) => (b.id === action.payload.id ? { ...b, ...action.payload } : b));
    case 'ADD_BOOK':
      return [...state, action.payload];
    case 'REMOVE_BOOK':
      return state.filter((b) => b.id !== action.payload);
    default:
      return state;
  }
}

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const stored = localStorage.getItem('goodreads_books');
  const init = stored ? (JSON.parse(stored) as Book[]) : initialBooks;
  const [books, dispatch] = useReducer(booksReducer, init);

  useEffect(() => {
    localStorage.setItem('goodreads_books', JSON.stringify(books));
  }, [books]);

  const updateBook = (id: string, updates: Partial<Book>) => {
    dispatch({ type: 'UPDATE_BOOK', payload: { id, ...updates } });
  };

  const addBook = (book: Book) => {
    dispatch({ type: 'ADD_BOOK', payload: book });
  };

  const removeBook = (id: string) => {
    dispatch({ type: 'REMOVE_BOOK', payload: id });
  };

  const getBook = (id: string) => books.find((b) => b.id === id);

  const shelfCounts = {
    all: books.length,
    read: books.filter((b) => b.shelf === 'read').length,
    currentlyReading: books.filter((b) => b.shelf === 'currently-reading').length,
    wantToRead: books.filter((b) => b.shelf === 'want-to-read').length,
  };

  return (
    <BooksContext.Provider value={{ books, updateBook, addBook, removeBook, getBook, shelfCounts }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks must be used within BooksProvider');
  return ctx;
}
