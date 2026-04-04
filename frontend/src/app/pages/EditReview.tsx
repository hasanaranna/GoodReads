import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ChevronDown, ChevronUp, X, User } from "lucide-react";
import { useBooks } from "../context/BooksContext";
import { StarRating } from "../components/StarRating";
import { Book } from "../data/initialBooks";
import { fetchBookReviewsAPI, PublicReview } from "../services/api";

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

function ReviewStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-[14px] ${star <= rating ? "text-[#d4a017]" : "text-gray-300"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function EditReview() {
  const { bookId } = useParams();
  const { getBook, updateBook, updateReview, removeBook } = useBooks();
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
  const [isSaving, setIsSaving] = useState(false);

  // Community reviews state
  const [communityReviews, setCommunityReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fetch community reviews when the book is loaded
  useEffect(() => {
    if (!book?.googleBooksId) return;

    async function loadReviews() {
      setLoadingReviews(true);
      try {
        const response = await fetchBookReviewsAPI(book!.googleBooksId);
        setCommunityReviews(response.data);
      } catch (err) {
        console.error("Failed to load community reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    loadReviews();
  }, [book?.googleBooksId]);

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

  async function handlePost() {
    setIsSaving(true);
    try {
      if (shelf !== book!.shelf) {
        const shelfUpdates: Partial<Book> = { shelf };
        if (shelf === "currently-reading") {
          shelfUpdates.pagesCompleted = 0;
        }
        await updateBook(book!.id, shelfUpdates);
      }
      await updateReview(book!.id, { rating, review: reviewText });
      navigate("/mybooks");
    } catch (err) {
      console.error("Failed to save review:", err);
    } finally {
      setIsSaving(false);
    }
  }

  function addReadDate() {
    if (readDates.length >= 1) return;
    setReadDates((prev) => [
      ...prev,
      { id: Date.now().toString(), started: "", finished: "" },
    ]);
  }

  // Filter out current user's review from community reviews
  const otherReviews = communityReviews.filter(
    (r) => r.user_book_id !== book.id,
  );

  return (
    <div className="max-w-[860px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="text-[12px] mb-4 leading-relaxed">
        {/* <Link
          to={`/book/${book.id}/progress`}
          className="text-[#00635d] no-underline hover:underline"
        >
          {book.title}
        </Link> */}
        <span className="text-[#00635d]">
          {book.title}
        </span>
        <span className="text-[#00635d]"> &gt; Review &gt; Edit</span>
      </div>

      {/* Book info */}
      <div className="flex" style={{ gap: "16px", marginBottom: "16px" }}>
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-[95px] h-[135px] object-cover shadow"
        />
        <div>
          <div className="text-[14px] text-[#382110] leading-snug mb-1">
            {book.title}
            {book.subtitle && <span>: {book.subtitle}</span>}
          </div>
          <div className="text-[13px] text-gray-600">
            by{" "}
            <a href="#" className="text-[#382110] hover:underline no-underline">
              {book.author}
            </a>
          </div>
        </div>
      </div>

      <a
        href="#"
        className="text-[12px] text-[#00635d] hover:underline no-underline block"
        style={{ marginBottom: "16px" }}
      >
        Change Edition
      </a>

      <div className="border-t border-[#ddd]" />

      {/* Rating */}
      <div className="flex flex-wrap items-center border-b border-[#ddd]" style={{ paddingTop: "16px", paddingBottom: "16px", gap: "16px" }}>
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
      <div className="flex flex-wrap items-center border-b border-[#ddd]" style={{ paddingTop: "16px", paddingBottom: "16px", gap: "16px" }}>
        <span className="text-[14px] text-[#382110]">Bookshelves/tags:</span>
        <div className="relative">
          <button
            onClick={() => setShowShelfMenu(!showShelfMenu)}
            className="flex items-center gap-1 text-[13px] border border-[#aaa] px-4 py-1.5 bg-[#ffffff] hover:bg-[#f4f0e6] text-[#382110] rounded"
          >
            Choose shelves… <ChevronDown size={12} />
          </button>
          {showShelfMenu && (
            <div className="absolute top-full left-0 z-20 bg-[#ffffff] border border-[#ddd] rounded shadow-md min-w-[180px]">
              {Object.entries(SHELF_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f4f0e6] ${shelf === key
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
      <div className="border-b border-[#ddd]" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between" style={{ marginBottom: "8px", gap: "8px" }}>
          <span className="text-[15px] text-[#382110]">
            What did you think?
          </span>
          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#00635d]">
            <button className="hover:underline" style={{ padding: 0, backgroundColor: "transparent", minHeight: "auto", border: "none", color: "inherit" }}>Formatting tips</button>
            <span className="text-[#00635d]">|</span>
            <button className="hover:underline" style={{ padding: 0, backgroundColor: "transparent", minHeight: "auto", border: "none", color: "inherit" }}>Insert book/author</button>
            <span className="text-[#00635d]">|</span>
            <button className="hover:underline" style={{ padding: 0, backgroundColor: "transparent", minHeight: "auto", border: "none", color: "inherit" }}>Enlarge text field</button>
          </div>
        </div>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Enter your review (optional)"
          className="w-full border border-[#ccc] rounded p-3 text-[13px] text-[#382110] focus:outline-none focus:border-[#00635d] resize-y min-h-[180px]"
        />
        <div className="flex items-center" style={{ marginTop: "8px", gap: "12px" }}>
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
      <div className="border-b border-[#ddd]" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
        <div className="text-[16px] text-[#382110]" style={{ marginBottom: "8px" }}>Dates read</div>
        <div className="text-[13px] text-[#382110]" style={{ marginBottom: "8px" }}>Rereading?</div>
        <div className="text-[12px] text-gray-500" style={{ marginBottom: "8px" }}>
          Now you can track all the times you have read a book. Make sure to
          fill in the year finished to have it added to your Reading Challenge!
        </div>

        {readDates.map((rd) => (
          <div key={rd.id} className="flex flex-wrap items-center gap-3 mb-2 mt-4 text-[13px]">
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

        {readDates.length === 0 && (
          <div style={{ marginTop: "8px", marginBottom: "8px" }}>
            <button
              onClick={addReadDate}
              className="text-[12px] bg-[#f4f0e6] border border-[#ccc] px-4 py-2 text-[#382110] hover:bg-[#e8e2d0] rounded"
            >
              Add read data
            </button>
          </div>
        )}

        <div style={{ marginTop: "16px", paddingBottom: "16px" }}>
          <button
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="text-[12px] text-[#382110] flex items-center gap-1 hover:underline bg-[#f4f0e6] border border-[#ccc] px-4 py-2 rounded"
          >
            More details{" "}
            {showMoreDetails ? (
              <ChevronUp size={13} />
            ) : (
              <ChevronDown size={13} />
            )}
          </button>
          {showMoreDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 text-[13px] text-[#382110]" style={{ marginTop: "8px", gap: "16px" }}>
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
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
        <button
          onClick={handlePost}
          disabled={isSaving}
          className="bg-[#f4f0e6] border border-[#999] px-6 py-2 text-[13px] text-[#382110] hover:bg-[#e8e2d0] rounded disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Post"}
        </button>
        <div className="flex flex-wrap items-center gap-4 sm:ml-auto text-[12px]">
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
      <div className="text-[12px] flex items-center gap-2 pb-4 border-b border-[#ddd]">
        <a href="#" className="text-[#00635d] hover:underline no-underline">
          Preview
        </a>
        <span className="text-gray-300">|</span>
        <button
          onClick={async () => {
            if (confirm("Remove this book from your shelves?")) {
              await removeBook(book.id);
              navigate("/mybooks");
            }
          }}
          className="text-[#00635d] hover:underline"
        >
          Remove from my books
        </button>
      </div>

      {/* ===== Community Reviews Section ===== */}
      <div className="py-6" style={{ paddingBottom: "64px" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-medium text-[#382110]">
            Community Reviews
          </h2>
          <span className="text-[13px] text-gray-500">
            {communityReviews.length}{" "}
            {communityReviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        {loadingReviews && (
          <div className="text-[13px] text-gray-500 py-4">
            Loading reviews...
          </div>
        )}

        {!loadingReviews && otherReviews.length === 0 && (
          <div className="bg-[#f9f7f2] border border-[#e8e0d0] rounded-lg p-6 text-center">
            <p className="text-[14px] text-gray-500 mb-1">
              No community reviews yet.
            </p>
            <p className="text-[12px] text-gray-400">
              Be the first to share your thoughts about this book!
            </p>
          </div>
        )}

        {!loadingReviews && otherReviews.length > 0 && (
          <div className="space-y-0 divide-y divide-[#e8e0d0]">
            {otherReviews.map((review) => (
              <div key={review.user_book_id} className="py-4">
                {/* Reviewer header */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-[#e8e0d0] flex items-center justify-center text-[#382110] shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium text-[#382110]">
                        {review.user_name}
                      </span>
                      <span className="text-[12px] text-gray-400">
                        @{review.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {review.rating > 0 && (
                        <ReviewStars rating={review.rating} />
                      )}
                      <span className="text-[11px] text-gray-400">
                        {review.shelf && SHELF_LABELS[review.shelf]
                          ? `· ${SHELF_LABELS[review.shelf]}`
                          : ""}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        ·{" "}
                        {new Date(review.date_added).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review text */}
                {review.review && (
                  <div className="sm:ml-12 ml-0 mt-1">
                    <p className="text-[13px] text-[#382110] leading-relaxed whitespace-pre-wrap">
                      {review.review}
                    </p>
                  </div>
                )}

                {/* Rating only (no text) */}
                {!review.review && review.rating > 0 && (
                  <div className="sm:ml-12 ml-0 mt-1">
                    <p className="text-[12px] text-gray-400 italic">
                      Rated this book {review.rating} out of 5 stars
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
