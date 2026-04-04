import { useState } from "react";
import { MessageSquare, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { Book } from "../data/initialBooks";
import { StarRating } from "./StarRating";
import { useBooks } from "../context/BooksContext";

interface BookRowProps {
  book: Book;
  viewMode?: "list" | "grid";
  selected?: boolean;
  onSelect?: (id: string) => void;
  batchMode?: boolean;
  isShelfMenuOpen?: boolean;
  onToggleShelfMenu?: () => void;
}

const SHELF_LABELS: Record<string, string> = {
  read: "Read",
  "currently-reading": "Currently Reading",
  "want-to-read": "Want to Read",
};

export function BookRow({
  book,
  viewMode = "list",
  selected = false,
  onSelect,
  batchMode = false,
  isShelfMenuOpen,
  onToggleShelfMenu,
}: BookRowProps) {
  const { updateBook } = useBooks();
  const [internalShelfMenuOpen, setInternalShelfMenuOpen] = useState(false);

  const showShelfMenu =
    isShelfMenuOpen !== undefined ? isShelfMenuOpen : internalShelfMenuOpen;
  const toggleShelfMenu =
    onToggleShelfMenu || (() => setInternalShelfMenuOpen(!internalShelfMenuOpen));

  const progress = (() => {
    if (book.totalPages && book.totalPages > 0) {
      return Math.min(
        100,
        Math.floor(((book.pagesCompleted || 0) / book.totalPages) * 100),
      );
    }

    if (typeof book.completionPercentage === "number") {
      return Math.floor(Math.min(Math.max(book.completionPercentage, 0), 100));
    }

    return null;
  })();

  const showProgress = book.shelf === "currently-reading";

  async function handleShelfChange(newShelf: string) {
    const updates: Partial<Book> = { shelf: newShelf as Book["shelf"] };
    if (
      newShelf === "currently-reading" &&
      book.shelf !== "currently-reading"
    ) {
      updates.pagesCompleted = 0;
    }
    await updateBook(book.id, updates);
    if (isShelfMenuOpen !== undefined && onToggleShelfMenu) {
      if (isShelfMenuOpen) onToggleShelfMenu();
    } else {
      setInternalShelfMenuOpen(false);
    }
  }

  if (viewMode === "grid") {
    return (
      <div className="flex flex-col items-center gap-3 p-3">
        {batchMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(book.id)}
            className="mb-1"
          />
        )}
        {/* <Link to={`/book/${book.id}/review`}>
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-[104px] h-[148px] object-cover shadow-md hover:shadow-lg transition-shadow"
          />
        </Link> */}
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-[104px] h-[148px] object-cover shadow-md"
        />
        <div className="text-center max-w-[120px] ">
          <div className="text-[14px] text-[#382110] truncate">
            {book.title}
          </div>
          <div className="text-[12px] text-gray-500 truncate">
            {book.author}
          </div>
          <StarRating rating={book.rating} showCount size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-4 py-5 mb-2 border-b border-[#e8e0d0] ${
        selected ? "bg-[#fffbf0]" : "bg-[#ffffff] hover:bg-[#fafaf8]"
      } transition-colors`}
    >
      {batchMode && (
        <div className="pt-1 shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(book.id)}
            className="w-4 h-4 accent-[#382110]"
          />
        </div>
      )}

      {/* Cover */}
      {/* <Link to={`/book/${book.id}/review`} className="shrink-0">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-[84px] h-[120px] object-cover shadow hover:shadow-md transition-shadow"
        />
      </Link> */}
      <img
        src={book.coverUrl}
        alt={book.title}
        className="w-[120px] h-[180px] object-cover shadow"
      />

      {/* Title + Author */}
      <div className="w-[300px] shrink-0" style={{ margin: "8px 18px" }}>
        {/* <Link to={`/book/${book.id}/review`} className="no-underline">
          <div className="text-[17px] text-[#382110] hover:underline leading-snug">
            {book.title}
          </div>
        </Link> */}
        <div className="text-[17px] text-[#382110] hover:underline leading-snug">
          {book.title}
        </div>
        <div className="text-[14px] text-gray-600 mt-1">{book.author}</div>
      </div>

      {/* Rating + Shelf */}
      <div
        className="w-[170px] shrink-0 flex flex-col items-center gap-4"
        style={{ padding: "18px 0" }}
      >
        <StarRating rating={book.rating} showCount size="sm" />
        <div className="relative w-[140px] mt-2">
          <button
            onClick={toggleShelfMenu}
            className="flex items-center justify-between w-full text-[13px] text-[#382110] border border-[#ccc] rounded px-3 py-1.5 bg-[#f4f0e6] hover:bg-[#e8e2d0]"
          >
            <span className="truncate text-left">{SHELF_LABELS[book.shelf]}</span>
            <ChevronDown size={14} className="shrink-0 ml-1" />
          </button>
          {showShelfMenu && (
            <div className="absolute top-full left-0 z-20 bg-[#ffffff] border border-[#ddd] rounded shadow-md min-w-[180px]">
              {Object.entries(SHELF_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f4f0e6] ${
                    book.shelf === key
                      ? "font-semibold text-[#382110]"
                      : "text-[#382110]"
                  }`}
                  onClick={() => handleShelfChange(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {showProgress && (
          <div className="w-[112px]">
            <Link
              to={`/book/${book.id}/progress`}
              className="text-[12px] text-[#00635d] no-underline hover:underline"
            >
              {progress ?? 0}% [Edit]
            </Link>
            <div className="w-full bg-[#e8e0d0] rounded-full h-1.5 mt-1">
              <div
                className="bg-[#00635d] h-1.5 rounded-full transition-all"
                style={{ width: `${progress ?? 0}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dates */}
      <div className="hidden md:flex flex-col gap-1.5 w-[150px] shrink-0 text-[14px] text-gray-600">
        <span>{book.dateAdded}</span>
        {book.dateRead && <span>{book.dateRead}</span>}
      </div>

      {/* Review */}
      <div className="flex-1 min-w-0 text-[14px]" style={{ padding: "18px 0" }}>
        {book.review ? (
          <div>
            <span className="text-gray-700">{book.review}</span>{" "}
            <Link
              to={`/book/${book.id}/review`}
              className="text-[#00635d] no-underline hover:underline"
            >
              [Edit]
            </Link>
          </div>
        ) : (
          <Link
            to={`/book/${book.id}/review`}
            className="flex flex-col items-center gap-1.5 w-[110px] text-[#382110] no-underline hover:text-[#00635d] group"
          >
            <MessageSquare
              size={26}
              className="text-[#555] group-hover:text-[#00635d]"
            />
            <span className="text-[12px]">Post a review</span>
          </Link>
        )}
      </div>
    </div>
  );
}
