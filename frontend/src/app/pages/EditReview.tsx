import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useBooks } from "../context/BooksContext";
import { StarRating } from "../components/StarRating";
import { Book } from "../data/initialBooks";

const SHELF_LABELS: Record<string, string> = {
  read: "Read",
  "currently-reading": "Currently Reading",
  "want-to-read": "Want to Read",
};

interface ReadDate {
  id: string;
  started?: string;
  finished?: string;
}

export function EditReview() {
  const { bookId } = useParams();
  const { getBook, updateBook, removeBook } = useBooks();
  const navigate = useNavigate();
  const book = getBook(bookId!);

  const [rating, setRating] = useState(book?.rating || 0);
  const [shelf, setShelf] = useState<Book["shelf"]>(
    book?.shelf || "want-to-read",
  );
  const [reviewText, setReviewText] = useState(book?.review || "");
  const [hideSpoilers, setHideSpoilers] = useState(false);
  const [postToBlog, setPostToBlog] = useState(false);
  const [addToFeed, setAddToFeed] = useState(true);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [readDates, setReadDates] = useState<ReadDate[]>([]);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  if (!book) {
    return (
      <div className="max-w-[860px] mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">Book not found.</p>
        <Link to="/mybooks" className="text-[#00635d] hover:underline">
          Back to My Books
        </Link>
      </div>
    );
  }

  function handlePost() {
    updateBook(book!.id, { rating, shelf, review: reviewText });
    navigate("/mybooks");
  }

  function addReadDate() {
    setReadDates((prev) => [
      ...prev,
      { id: Date.now().toString(), started: "", finished: "" },
    ]);
  }

  const bookFullTitle = `${book.title}${book.title !== "The Hard Things About Hard Things" ? "" : ": Building a Business When There Are No Easy Answers"}`;

  return (
    <div className="max-w-[860px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="text-[12px] mb-4 leading-relaxed">
        <Link
          to={`/book/${book.id}/progress`}
          className="text-[#00635d] no-underline hover:underline"
        >
          {book.titleLocal ? `${book.titleLocal} (${book.title})` : book.title}
        </Link>
        <span className="text-[#00635d]"> &gt; Review &gt; Edit</span>
      </div>

      {/* Book info */}
      <div className="flex gap-4 mb-6">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-[75px] h-[105px] object-cover shadow"
        />
        <div>
          <div className="text-[14px] text-[#382110] leading-snug mb-1">
            {book.title}
            {book.id === "5" && (
              <span>
                : Building a Business When There Are No Easy Answers - Straight
                Talk on the Challenges of Entrepreneurship <em>(Hardcover)</em>
              </span>
            )}
          </div>
          <div className="text-[13px] text-gray-600">
            by{" "}
            <a href="#" className="text-[#382110] hover:underline no-underline">
              {book.author}
            </a>
            {book.id === "5" && (
              <span className="text-gray-400"> (Goodreads Author)</span>
            )}
          </div>
        </div>
      </div>

      <a
        href="#"
        className="text-[12px] text-[#00635d] hover:underline no-underline mb-6 block"
      >
        Change Edition
      </a>

      <div className="border-t border-[#ddd]" />

      {/* Rating */}
      <div className="py-4 flex items-center gap-3 border-b border-[#ddd]">
        <span className="text-[14px] text-[#382110]">My Rating:</span>
        <StarRating
          rating={rating}
          interactive
          size="lg"
          onChange={setRating}
        />
        {rating > 0 && (
          <button
            onClick={() => setRating(0)}
            className="text-[12px] text-[#00635d] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Shelves */}
      <div className="py-4 flex items-center gap-3 border-b border-[#ddd]">
        <span className="text-[14px] text-[#382110]">Bookshelves/tags:</span>
        <div className="relative">
          <button
            onClick={() => setShowShelfMenu(!showShelfMenu)}
            className="flex items-center gap-1 text-[13px] border border-[#aaa] px-2 py-0.5 bg-[#ffffff] hover:bg-[#f4f0e6] text-[#382110]"
          >
            Choose shelves… <ChevronDown size={12} />
          </button>
          {showShelfMenu && (
            <div className="absolute top-full left-0 z-20 bg-[#ffffff] border border-[#ddd] rounded shadow-md min-w-[180px]">
              {Object.entries(SHELF_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f4f0e6] ${
                    shelf === key
                      ? "font-semibold text-[#382110]"
                      : "text-[#382110]"
                  }`}
                  onClick={() => {
                    setShelf(key as Book["shelf"]);
                    setShowShelfMenu(false);
                  }}
                >
                  {shelf === key && "✓ "}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[#00635d] text-[13px]">
          {SHELF_LABELS[shelf]}
        </span>
      </div>

      {/* Review */}
      <div className="py-4 border-b border-[#ddd]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[15px] text-[#382110]">
            What did you think?
          </span>
          <div className="flex items-center gap-2 text-[12px] text-[#00635d]">
            <button className="hover:underline">Formatting tips</button>
            <span>|</span>
            <button className="hover:underline">Insert book/author</button>
            <span>|</span>
            <button className="hover:underline">Enlarge text field</button>
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Enter your review (optional)"
          className="w-full border border-[#ccc] rounded p-3 text-[13px] text-[#382110] focus:outline-none focus:border-[#00635d] resize-y min-h-[180px]"
        />
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="spoilers"
            checked={hideSpoilers}
            onChange={(e) => setHideSpoilers(e.target.checked)}
            className="accent-[#382110]"
          />
          <label
            htmlFor="spoilers"
            className="text-[12px] text-[#382110] cursor-pointer"
          >
            Hide entire review because of spoilers
          </label>
        </div>
      </div>

      {/* Dates read */}
      <div className="py-4 border-b border-[#ddd]">
        <div className="text-[16px] text-[#382110] mb-2">Dates read</div>
        <div className="text-[13px] text-[#382110] mb-1">Rereading?</div>
        <div className="text-[12px] text-gray-500 mb-3">
          Now you can track all the times you have read a book. Make sure to
          fill in the year finished to have it added to your Reading Challenge!
        </div>

        {readDates.map((rd) => (
          <div key={rd.id} className="flex items-center gap-3 mb-2 text-[13px]">
            <div className="flex items-center gap-2">
              <label className="text-gray-500 text-[12px]">Started:</label>
              <input
                type="date"
                value={rd.started}
                onChange={(e) =>
                  setReadDates((prev) =>
                    prev.map((d) =>
                      d.id === rd.id ? { ...d, started: e.target.value } : d,
                    ),
                  )
                }
                className="border border-[#ccc] rounded px-2 py-0.5 text-[12px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-gray-500 text-[12px]">Finished:</label>
              <input
                type="date"
                value={rd.finished}
                onChange={(e) =>
                  setReadDates((prev) =>
                    prev.map((d) =>
                      d.id === rd.id ? { ...d, finished: e.target.value } : d,
                    ),
                  )
                }
                className="border border-[#ccc] rounded px-2 py-0.5 text-[12px]"
              />
            </div>
            <button
              onClick={() =>
                setReadDates((prev) => prev.filter((d) => d.id !== rd.id))
              }
              className="text-gray-400 hover:text-red-400"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={addReadDate}
          className="text-[12px] bg-[#f4f0e6] border border-[#ccc] px-3 py-1 text-[#382110] hover:bg-[#e8e2d0] rounded"
        >
          Add read data
        </button>

        <div className="mt-3">
          <button
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="text-[12px] text-[#382110] flex items-center gap-1 hover:underline"
          >
            More details{" "}
            {showMoreDetails ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>
          {showMoreDetails && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-[13px] text-[#382110]">
              <div>
                <label className="block text-gray-500 text-[11px] mb-1">
                  Owned?
                </label>
                <select className="border border-[#ccc] rounded px-2 py-1 text-[12px] w-full">
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-500 text-[11px] mb-1">
                  Format
                </label>
                <select className="border border-[#ccc] rounded px-2 py-1 text-[12px] w-full">
                  <option value="">—</option>
                  <option value="hardcover">Hardcover</option>
                  <option value="paperback">Paperback</option>
                  <option value="ebook">E-book</option>
                  <option value="audiobook">Audiobook</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post button */}
      <div className="py-4 flex flex-wrap items-center gap-4">
        <button
          onClick={handlePost}
          className="bg-[#f4f0e6] border border-[#999] px-5 py-1.5 text-[13px] text-[#382110] hover:bg-[#e8e2d0] rounded"
        >
          Post
        </button>
        <div className="flex items-center gap-4 ml-auto text-[12px]">
          <label className="flex items-center gap-1.5 cursor-pointer text-[#382110]">
            <input
              type="checkbox"
              checked={postToBlog}
              onChange={(e) => setPostToBlog(e.target.checked)}
              className="accent-[#382110]"
            />
            Post to blog
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-[#382110]">
            <input
              type="checkbox"
              checked={addToFeed}
              onChange={(e) => setAddToFeed(e.target.checked)}
              className="accent-[#382110]"
            />
            Add to my update feed
          </label>
        </div>
      </div>

      {/* Footer links */}
      <div className="text-[12px] flex items-center gap-2 pb-4">
        <a href="#" className="text-[#00635d] hover:underline no-underline">
          Preview
        </a>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => {
            if (confirm("Remove this book from your shelves?")) {
              removeBook(book.id);
              navigate("/mybooks");
            }
          }}
          className="text-[#00635d] hover:underline"
        >
          Remove from my books
        </button>
      </div>
    </div>
  );
}
