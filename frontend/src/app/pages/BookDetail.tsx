import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { User, BookOpen, ChevronDown } from "lucide-react";
import { useBooks } from "../context/BooksContext";
import { StarRating } from "../components/StarRating";
import { fetchBookReviewsAPI, PublicReview, addBookToShelfAPI, ShelfBookData } from "../services/api";
import type { Book } from "../data/initialBooks";

const SHELF_LABELS: Record<string, string> = {
  read: "Read",
  "currently-reading": "Currently Reading",
  "want-to-read": "Want to Read",
};

// ─── Fractional star renderer (matching Recommendation.tsx) ─────────────────

function FractionalStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating * 10) / 10;
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rounded - i));
        const pct = Math.round(fill * 100);
        const id = `bd-star-${i}-${pct}`;
        return (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24">
            <defs>
              <clipPath id={id}>
                <rect x="0" y="0" width={`${pct}%`} height="24" />
              </clipPath>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#d4c5b0"
            />
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#e07d4f"
              clipPath={`url(#${id})`}
            />
          </svg>
        );
      })}
    </span>
  );
}

// ─── Review card ─────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: PublicReview }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.review && review.review.length > 300;

  return (
    <div className="py-4 border-b border-[#e8e0d0]">
      <div className="flex items-start gap-3" style={{ marginBottom: "8px" }}>
        <div className="w-9 h-9 rounded-full bg-[#e8e0d0] flex items-center justify-center text-[#382110] shrink-0">
          <User size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium text-[#382110]">{review.user_name}</span>
            <span className="text-[12px] text-gray-400">@{review.username}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {review.rating > 0 && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className={`text-[13px] ${s <= review.rating ? "text-[#d4a017]" : "text-gray-300"}`}>★</span>
                ))}
              </div>
            )}
            {review.shelf && SHELF_LABELS[review.shelf] && (
              <span className="text-[11px] text-gray-400">· {SHELF_LABELS[review.shelf]}</span>
            )}
            <span className="text-[11px] text-gray-400">
              · {new Date(review.date_added).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {review.review && (
        <div className="ml-12">
          <p className={`text-[13px] text-[#382110] leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? "line-clamp-4" : ""}`}>
            {review.review}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[12px] text-[#00635d] hover:underline mt-1"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {!review.review && review.rating > 0 && (
        <p className="ml-12 text-[12px] text-gray-400 italic">
          Rated this book {review.rating} out of 5 stars
        </p>
      )}
    </div>
  );
}

// ─── Shelf dropdown ───────────────────────────────────────────────────────────

interface ShelfPickerProps {
  currentShelf: string | null;
  onSelect: (shelf: "want-to-read" | "currently-reading" | "read") => void;
}

function ShelfPicker({ currentShelf, onSelect }: ShelfPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[13px] border border-[#aaa] px-4 py-2 bg-[#f4f0e6] hover:bg-[#e8e2d0] text-[#382110] rounded"
      >
        {currentShelf ? SHELF_LABELS[currentShelf] : "Add to shelf"}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-20 bg-white border border-[#ddd] rounded shadow-md min-w-[180px]">
          {(Object.entries(SHELF_LABELS) as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f4f0e6] ${currentShelf === key ? "font-semibold text-[#382110]" : "text-[#382110]"}`}
              onClick={() => {
                onSelect(key as "want-to-read" | "currently-reading" | "read");
                setOpen(false);
              }}
            >
              {currentShelf === key && "✓ "}{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function BookDetail() {
  const { googleBooksId } = useParams<{ googleBooksId: string }>();
  const { books, getBook, updateBook, updateReview, addBook } = useBooks();
  const navigate = useNavigate();

  // Find the book in the user's shelf by googleBooksId
  const shelfBook = books.find((b) => b.googleBooksId === googleBooksId);

  const [communityReviews, setCommunityReviews] = useState<PublicReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userRating, setUserRating] = useState(shelfBook?.rating ?? 0);
  const [currentShelf, setCurrentShelf] = useState<string | null>(shelfBook?.shelf ?? null);
  const [isSavingShelf, setIsSavingShelf] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const [fetchedBook, setFetchedBook] = useState<any>(null);

  // If book is on shelf, keep rating/shelf in sync
  useEffect(() => {
    if (shelfBook) {
      setUserRating(shelfBook.rating);
      setCurrentShelf(shelfBook.shelf);
    }
  }, [shelfBook]);

  // Fetch community reviews and book details from Google Books
  useEffect(() => {
    if (!googleBooksId) return;

    // Fetch Google Books info for description, cover, etc if not fully locally cached
    fetch(`https://www.googleapis.com/books/v1/volumes/${googleBooksId}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch Google Books data");
      })
      .then((data) => {
        if (data.volumeInfo) {
          setFetchedBook(data.volumeInfo);
        }
      })
      .catch(console.error);

    setLoadingReviews(true);
    fetchBookReviewsAPI(googleBooksId)
      .then((res) => setCommunityReviews(res.data))
      .catch(console.error)
      .finally(() => setLoadingReviews(false));
  }, [googleBooksId]);

  // Pick the best available source for book metadata
  // (shelf book has full data; community reviews expose title/author/cover)
  const firstReview = communityReviews[0];
  const fetchedCover = fetchedBook?.imageLinks?.thumbnail || fetchedBook?.imageLinks?.smallThumbnail;
  const httpsCover = fetchedCover ? fetchedCover.replace("http:", "https:") : null;

  const title = shelfBook?.title ?? fetchedBook?.title ?? firstReview?.title ?? "Unknown Book";
  const author = shelfBook?.author ?? (fetchedBook?.authors?.[0]) ?? firstReview?.author ?? "";
  const coverUrl = shelfBook?.coverUrl ?? httpsCover ?? firstReview?.cover_url ?? null;
  const description = shelfBook?.description ?? fetchedBook?.description ?? null;
  const totalPages = shelfBook?.totalPages ?? fetchedBook?.pageCount;

  // Average rating
  const rated = communityReviews.filter((r) => r.rating > 0);
  const communityAvg = rated.length > 0 ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
  const avgRating = communityAvg > 0 ? communityAvg : (fetchedBook?.averageRating ?? 0);
  const ratingCount = communityAvg > 0 ? communityReviews.length : (fetchedBook?.ratingsCount ?? 0);

  async function handleShelfChange(shelf: "want-to-read" | "currently-reading" | "read") {
    setIsSavingShelf(true);
    try {
      if (shelfBook) {
        await updateBook(shelfBook.id, { shelf });
      } else if (googleBooksId) {
        // Build a minimal Book + ShelfBookData from whatever we know
        const tempBook: Book = {
          id: `temp-${googleBooksId}`,
          bookId: googleBooksId,
          googleBooksId,
          title,
          author,
          coverUrl: coverUrl ?? "https://placehold.co/120x180?text=No+Cover",
          rating: 0,
          shelf,
          dateAdded: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          review: "",
          pagesCompleted: 0,
        };
        const shelfData: ShelfBookData = {
          google_books_id: googleBooksId,
          title,
          author,
          cover_url: coverUrl ?? undefined,
        };
        await addBook(tempBook, shelfData);
      }
      setCurrentShelf(shelf);
    } catch (err) {
      console.error("Failed to change shelf:", err);
    } finally {
      setIsSavingShelf(false);
    }
  }

  async function handleRatingChange(newRating: number) {
    setUserRating(newRating);
    if (shelfBook) {
      try {
        await updateReview(shelfBook.id, { rating: newRating });
      } catch (err) {
        console.error("Failed to save rating:", err);
      }
    }
  }

  const descRaw = description ?? "";
  const desc = descRaw.replace(/<[^>]+>/g, "");
  const isLongDesc = desc.length > 500;
  const displayDesc = isLongDesc && !showFullDesc ? desc.slice(0, 500) + "…" : desc;

  const otherReviews = communityReviews.filter((r) =>
    shelfBook ? r.user_book_id !== shelfBook.id : true
  );

  return (
    <div className="max-w-[860px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="text-[12px] mb-4 leading-relaxed">
        <Link to="/mybooks" className="text-[#00635d] hover:underline no-underline">
          My Books
        </Link>
        <span className="text-[#00635d]"> › {title}</span>
      </div>

      {/* ── Book hero ─────────────────────────────────────────────────── */}
      <div className="flex border-b border-[#ddd]" style={{ gap: "24px", paddingBottom: "20px", marginBottom: "0" }}>
        {/* Cover */}
        <div className="shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-[120px] h-[180px] object-cover shadow-md"
            />
          ) : (
            <div
              className="w-[120px] h-[180px] flex items-center justify-center text-[#7b5e3a] text-xs text-center px-2 shadow-md"
              style={{ background: "#ece7da", fontFamily: "Georgia, serif" }}
            >
              {title}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-[26px] font-bold text-[#382110] leading-snug mb-1"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {title}
          </h1>
          <p className="text-[14px] text-[#7b5e3a] mb-3">
            by <span className="text-[#382110] font-medium">{author}</span>
          </p>

          {/* Community avg rating */}
          {avgRating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <FractionalStars rating={avgRating} />
              <span className="text-[12px] text-gray-500">
                {avgRating.toFixed(2)} avg · {ratingCount} rating{ratingCount !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {totalPages && (
            <div className="flex items-center gap-1 text-[13px] text-gray-500 mb-4">
              <BookOpen size={14} />
              <span>{totalPages} pages</span>
            </div>
          )}

          {/* User actions */}
          <div className="flex flex-wrap items-center gap-3">
            <ShelfPicker currentShelf={currentShelf} onSelect={handleShelfChange} />
            {isSavingShelf && <span className="text-[12px] text-gray-400">Saving…</span>}
            {shelfBook && (
              <Link
                to={`/book/${shelfBook.id}/review`}
                className="no-underline text-[13px] border border-[#aaa] px-4 py-2 bg-[#ffffff] hover:bg-[#f4f0e6] text-[#382110] rounded"
              >
                Write a review
              </Link>
            )}
          </div>

          {/* User rating */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[13px] text-[#382110]">My rating:</span>
            <StarRating
              rating={userRating}
              interactive={!!shelfBook}
              size="md"
              onChange={handleRatingChange}
            />
            {userRating > 0 && shelfBook && (
              <button
                onClick={() => handleRatingChange(0)}
                className="text-[12px] text-[#00635d] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Description ───────────────────────────────────────────────── */}
      {desc && (
        <div className="border-b border-[#ddd]" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
          <h2 className="text-[15px] font-semibold text-[#382110] mb-2">About this book</h2>
          <p className="text-[14px] text-[#555] leading-relaxed whitespace-pre-wrap">
            {displayDesc}
          </p>
          {isLongDesc && (
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-[12px] text-[#00635d] hover:underline mt-1"
            >
              {showFullDesc ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* ── Community Reviews ─────────────────────────────────────────── */}
      <div style={{ paddingTop: "16px", paddingBottom: "64px" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-medium text-[#382110]">Community Reviews</h2>
          <span className="text-[13px] text-gray-500">
            {communityReviews.length} {communityReviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>

        {loadingReviews && (
          <div className="loader">
            <div className="justify-content-center jimu-primary-loading"></div>
          </div>
        )}

        {!loadingReviews && otherReviews.length === 0 && (
          <div className="bg-[#f9f7f2] border border-[#e8e0d0] rounded-lg p-6 text-center">
            <p className="text-[14px] text-gray-500 mb-1">No community reviews yet.</p>
            <p className="text-[12px] text-gray-400">Be the first to share your thoughts!</p>
          </div>
        )}

        {!loadingReviews && otherReviews.length > 0 && (
          <div className="max-h-[500px] overflow-y-auto pr-4">
            {otherReviews.map((r) => (
              <ReviewCard key={r.user_book_id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
