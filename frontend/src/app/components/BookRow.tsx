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
}: BookRowProps) {
  const { updateBook } = useBooks();
  const [showShelfMenu, setShowShelfMenu] = useState(false);

  const progress =
    book.shelf === "currently-reading" && book.totalPages && book.totalPages > 0
      ? Math.round(((book.pagesCompleted || 0) / book.totalPages) * 100)
      : null;

  if (viewMode === "grid") {
    return (
      <div className="flex flex-col items-center gap-2 p-2">
        {batchMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(book.id)}
            className="mb-1"
          />
        )}
        <Link to={`/book/${book.id}/review`}>
          <img
            src={book.coverUrl}
            alt={book.titleLocal || book.title}
            className="w-[80px] h-[110px] object-cover shadow-md hover:shadow-lg transition-shadow"
          />
        </Link>
        <div className="text-center max-w-[90px]">
          <div className="text-[12px] text-[#382110] truncate">
            {book.titleLocal || book.title}
          </div>
          <div className="text-[11px] text-gray-500 truncate">
            {book.author}
          </div>
          <StarRating rating={book.rating} showCount size="sm" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 py-4 border-b border-[#e8e0d0] ${
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
      <Link to={`/book/${book.id}/review`} className="shrink-0">
        <img
          src={book.coverUrl}
          alt={book.titleLocal || book.title}
          className="w-[60px] h-[85px] object-cover shadow hover:shadow-md transition-shadow"
        />
      </Link>

      {/* Title + Author */}
      <div className="w-[200px] shrink-0" style={{ margin: "5px 16px" }}>
        <Link to={`/book/${book.id}/review`} className="no-underline">
          <div className="text-[14px] text-[#382110] hover:underline leading-snug">
            {book.titleLocal || book.title}
          </div>
        </Link>
        <div className="text-[12px] text-gray-600 mt-0.5">{book.author}</div>
      </div>

      {/* Rating + Shelf */}
      <div className="w-[130px] shrink-0 flex flex-col items-center gap-1" style={{ padding: "15px 0" }}>
        <StarRating rating={book.rating} showCount size="sm" />
        <div className="relative">
          <button
            onClick={() => setShowShelfMenu(!showShelfMenu)}
            className="flex items-center gap-1 text-[11px] text-[#382110] border border-[#ccc] rounded px-2 py-0.5 bg-[#f4f0e6] hover:bg-[#e8e2d0]"
          >
            {SHELF_LABELS[book.shelf]} <ChevronDown size={10} />
          </button>
          {showShelfMenu && (
            <div className="absolute top-full left-0 z-20 bg-[#ffffff] border border-[#ddd] rounded shadow-md min-w-[150px]">
              {Object.entries(SHELF_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-[#f4f0e6] ${
                    book.shelf === key
                      ? "font-semibold text-[#382110]"
                      : "text-[#382110]"
                  }`}
                  onClick={() => {
                    updateBook(book.id, { shelf: key as Book["shelf"] });
                    setShowShelfMenu(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        {progress !== null && (
          <Link
            to={`/book/${book.id}/progress`}
            className="text-[11px] text-[#00635d] no-underline hover:underline"
          >
            {progress}% [Edit]
          </Link>
        )}
      </div>

      {/* Dates */}
      <div className="hidden md:flex flex-col gap-1 w-[110px] shrink-0 text-[12px] text-gray-600">
        <span>{book.dateAdded}</span>
        {book.dateRead && <span>{book.dateRead}</span>}
      </div>

      {/* Review */}
      <div className="flex-1 min-w-0 text-[12px]">
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
            className="flex flex-col items-center gap-1 w-[90px] text-[#382110] no-underline hover:text-[#00635d] group"
          >
            <MessageSquare
              size={22}
              className="text-[#555] group-hover:text-[#00635d]"
            />
            <span className="text-[11px]">Post a review</span>
          </Link>
        )}
      </div>
    </div>
  );
}
