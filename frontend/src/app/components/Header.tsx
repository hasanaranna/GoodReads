import { useState } from 'react';
import { Bell, MessageSquare, Users, Menu, Search, ChevronDown, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useBooks } from '../context/BooksContext';
import { Book } from '../data/initialBooks';

const SEARCHABLE_BOOKS: Omit<Book, 'shelf' | 'dateAdded'>[] = [
  {
    id: 'search-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl:
      'https://images.unsplash.com/photo-1621944190310-e3cca1564bd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 0,
    totalPages: 320,
    pagesCompleted: 0,
  },
  {
    id: 'search-2',
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    coverUrl:
      'https://images.unsplash.com/photo-1735050873394-5f07cca72d70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 0,
    totalPages: 443,
    pagesCompleted: 0,
  },
  {
    id: 'search-3',
    title: 'Zero to One',
    author: 'Peter Thiel',
    coverUrl:
      'https://images.unsplash.com/photo-1772976811682-465df3b8c735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200',
    rating: 0,
    totalPages: 224,
    pagesCompleted: 0,
  },
];

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const { books, addBook } = useBooks();
  const navigate = useNavigate();

  const results = searchQuery.length > 1
    ? SEARCHABLE_BOOKS.filter(
        (b) =>
          !books.find((existing) => existing.id === b.id) &&
          (b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  function handleAddBook(book: Omit<Book, 'shelf' | 'dateAdded'>) {
    addBook({
      ...book,
      shelf: 'want-to-read',
      dateAdded: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    });
    setSearchQuery('');
    setShowResults(false);
  }

  return (
    <header className="bg-[#f4f0e6] border-b border-[#d8d0bb]">
      <div className="max-w-[1100px] mx-auto px-4 h-[58px] flex items-center gap-5">
        {/* Logo */}
        <Link
          to="/"
          className="text-[#382110] no-underline shrink-0"
          style={{ fontFamily: 'Lora, serif', fontSize: '28px', fontWeight: 700 }}
        >
          goodreads
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-4 text-[13px] text-[#382110]">
          <Link to="/" className="hover:underline no-underline text-[#382110]">
            Home
          </Link>
          <Link to="/mybooks" className="hover:underline no-underline text-[#382110]">
            My Books
          </Link>
          <button className="flex items-center gap-0.5 text-[#382110] hover:underline text-[13px]">
            Browse <ChevronDown size={12} />
          </button>
          <button className="flex items-center gap-0.5 text-[#382110] hover:underline text-[13px]">
            Community <ChevronDown size={12} />
          </button>
        </nav>

        {/* Search */}
        <div className="flex-1 mx-2 relative max-w-[340px]">
          <div className="flex items-center bg-white border border-[#c9bfb0] rounded-full h-[32px] px-3 gap-2">
            <input
              type="text"
              placeholder="Search books, authors..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="flex-1 outline-none text-[13px] text-gray-700 bg-transparent"
            />
            {searchQuery ? (
              <X size={14} className="text-gray-400 cursor-pointer" onClick={() => setSearchQuery('')} />
            ) : (
              <Search size={14} className="text-gray-400" />
            )}
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ddd] rounded shadow-lg z-50">
              {results.map((book) => (
                <button
                  key={book.id}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#f4f0e6] text-left"
                  onMouseDown={() => handleAddBook(book)}
                >
                  <img src={book.coverUrl} alt={book.title} className="w-8 h-10 object-cover rounded" />
                  <div>
                    <div className="text-[13px] text-[#382110]">{book.title}</div>
                    <div className="text-[11px] text-gray-500">{book.author}</div>
                  </div>
                  <span className="ml-auto text-[11px] text-[#00635d] border border-[#00635d] px-1.5 py-0.5 rounded">
                    + Add
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3 ml-auto text-[#382110]">
          <button className="hover:text-[#00635d]">
            <Bell size={18} />
          </button>
          <button className="hover:text-[#00635d]">
            <MessageSquare size={18} />
          </button>
          <button className="hover:text-[#00635d]">
            <Users size={18} />
          </button>
          <button className="hover:text-[#00635d]">
            <Menu size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
