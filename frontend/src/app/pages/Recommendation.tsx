import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
    fetchRecommendations,
    type RecommendedBook,
    type RecommendationReason,
    type RecommendationsResponse,
    addBookToShelfAPI,
    type ShelfBookData,
} from "../services/api";
import { useBooks } from "../context/BooksContext";
import type { Book } from "../data/initialBooks";

// Types 

type FilterTab = "all" | RecommendationReason;
type Status = "idle" | "loading" | "success" | "error" | "empty";

// Constants 

const TABS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "Top Choices" },
    { id: "cf", label: "Picked for You" },
    { id: "genre", label: "By Genre" },
    { id: "author", label: "By Author" },
];

const REASON_META: Record<
    RecommendationReason,
    { label: string; bg: string; text: string; border: string }
> = {
    cf: {
        label: "Readers like you",
        bg: "#edf7f5",
        text: "#00635d",
        border: "#b2dcd8",
    },
    genre: {
        label: "Matches your genres",
        bg: "#f7f3e9",
        text: "#7b5e3a",
        border: "#ddd0b3",
    },
    author: {
        label: "Author you love",
        bg: "#f3eef7",
        text: "#5e3a7b",
        border: "#cdb3dd",
    },
};

const SECTION_HEADERS: Record<
    RecommendationReason,
    { title: string; subtitle: string }
> = {
    cf: {
        title: "Picked for You",
        subtitle: "Based on your ratings and readers who share your taste",
    },
    genre: {
        title: "More in Your Genres",
        subtitle: "Books in the categories you rate most highly",
    },
    author: {
        title: "More from Your Authors",
        subtitle: "Unread books by authors you've already enjoyed",
    },
};

// Sub-components 

function JimuLoader() {
    return (
        <div className="loader">
            <div className="justify-content-center jimu-primary-loading"></div>
        </div>
    );
}

function StarRating({ rating }: { rating: number }) {
    const stars = 5;
    // Round to nearest 0.1
    const rounded = Math.round(rating * 10) / 10;

    return (
        <span className="inline-flex gap-0.5" aria-label={`${rounded} out of 5 stars`}>
            {Array.from({ length: stars }, (_, i) => {
                const fill = Math.min(1, Math.max(0, rounded - i)); // 0 to 1 for this star
                const pct = Math.round(fill * 100);
                const id = `star-${i}-${pct}`;

                return (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24">
                        <defs>
                            <clipPath id={id}>
                                <rect x="0" y="0" width={`${pct}%`} height="24" />
                            </clipPath>
                        </defs>
                        {/* Empty star */}
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="#d4c5b0"
                        />
                        {/* Filled portion */}
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

function ReasonBadge({ reason }: { reason: RecommendationReason }) {
    const m = REASON_META[reason];
    return (
        <span
            className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
            style={{ background: m.bg, color: m.text, borderColor: m.border }}
        >
            {m.label}
        </span>
    );
}

interface BookCardProps {
    book: RecommendedBook;
    onWantToRead: (bookId: string, shelf: 'want-to-read' | 'read' | 'currently-reading') => void;
    shelvedIds: Set<string>;
}

function BookCard({ book, onWantToRead, shelvedIds }: BookCardProps) {
    const shelved = shelvedIds.has(book.id);
    const navigate = useNavigate();

    return (
        <article className="flex border-b border-[#e8e0d0] group cursor-pointer hover:bg-[#faf7f0] transition-colors" style={{ gap: "16px", paddingTop: "16px", paddingBottom: "16px" }}
        onClick={(e) => {
            if ((e.target as HTMLElement).closest('select')) return;
            navigate(`/book/${book.googleBooksId}`);
        }}>
            {/* Cover */}
            <Link 
                to={`/book/${book.googleBooksId}`} 
                onClick={(e) => { e.preventDefault(); navigate(`/book/${book.googleBooksId}`); }}
                className="flex-shrink-0 no-underline text-inherit"
            >
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-[60px] h-[90px] object-cover rounded shadow-sm group-hover:shadow transition-shadow"
                    />
                ) : (
                    <div
                        className="w-[60px] h-[90px] rounded flex items-center justify-center text-[#7b5e3a] text-xs text-center px-1 leading-tight shadow-sm"
                        style={{ background: "#ece7da", fontFamily: "Georgia, serif" }}
                    >
                        {book.title}
                    </div>
                )}
            </Link>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 justify-between">
                    <div className="min-w-0">
                        <Link
                            to={`/book/${book.googleBooksId}`}
                            onClick={(e) => { e.preventDefault(); navigate(`/book/${book.googleBooksId}`); }}
                            className="no-underline text-[#382110] font-semibold text-[15px] hover:underline leading-snug block"
                            style={{ fontFamily: "Georgia, serif" }}
                        >
                            {book.title}
                            {book.subtitle && (
                                <span className="font-normal text-[13px] text-[#888]">
                                    {" "}— {book.subtitle}
                                </span>
                            )}
                        </Link>
                        <p className="text-[13px] text-[#7b5e3a] mt-0.5">
                            by <span className="text-[#00635d]">{book.author}</span>
                        </p>
                    </div>

                    {/* Rating & Action */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        {book.averageRating > 0 && (
                            <>
                                <StarRating rating={book.averageRating} />
                                <span className="text-[11px] text-[#aaa]">
                                    avg {book.averageRating.toFixed(2)}
                                </span>
                            </>
                        )}
                        {shelved ? (
                            <span className="inline-flex items-center gap-1 text-[14px] text-[#00635d] font-medium">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                                Added
                            </span>
                        ) : (
                            <select
                                onChange={(e) => onWantToRead(book.id, e.target.value as 'want-to-read' | 'read' | 'currently-reading')}
                                className="text-[13px] border border-[#ccc] px-2 py-1 bg-[#f4f0e6] text-[#382110] outline-none cursor-pointer hover:bg-[#e8e0d0] transition-colors"                                defaultValue=""
                            >
                                <option value="" disabled>Add to shelf</option>
                                <option value="want-to-read">Want to Read</option>
                                <option value="currently-reading">Currently Reading</option>
                                <option value="read">Read</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                    <ReasonBadge reason={book.reason} />
                    {book.categories.slice(0, 3).map((cat) => (
                        <span
                            key={cat}
                            className="inline-block text-[11px] text-[#888] bg-[#f4f0e6] border border-[#e0d8c8] px-2 py-0.5 rounded-full"
                        >
                            {cat}
                        </span>
                    ))}
                </div>

                {/* Description */}
                {book.description && (
                    <p className="text-[13px] text-[#555] mt-2 leading-relaxed line-clamp-2">
                        {book.description}
                    </p>
                )}
            </div>
        </article>
    );
}

function SectionDivider({
    reason,
}: {
    reason: RecommendationReason;
}) {
    const { title, subtitle } = SECTION_HEADERS[reason];
    return (
        <div className="border-b border-[#e8e0d0]" style={{ paddingTop: "24px", paddingBottom: "8px" }}>
            <h2
                className="text-[19px] font-bold text-[#382110]"
                style={{ fontFamily: "Georgia, serif" }}
            >
                {title}
            </h2>
            <p className="text-[12px] text-[#999] mt-0.5">{subtitle}</p>
        </div>
    );
}

function ColdStartBanner() {
    return (
        <div className="bg-[#f7f3e9] border border-[#e0d8c8] rounded-lg p-4 mb-6 flex gap-3">            <span className="text-[#e07d4f] text-xl mt-0.5">📚</span>
            <div>
                <p className="text-[#382110] text-[14px] font-semibold">
                    Rate more books for better recommendations
                </p>
                <p className="text-[#777] text-[13px] mt-0.5">
                    These are our most popular picks. Rate at least 5 books and we'll
                    personalise these for your taste.
                </p>
                <Link
                    to="/mybooks"
                    className="inline-block mt-2 text-[13px] text-[#00635d] hover:underline font-medium"
                >
                    Go rate some books →
                </Link>

            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-[#f4f0e6] rounded-lg px-8 py-12 text-center" style={{ marginTop: "16px" }}>
            <p className="text-[#382110] text-[18px] font-semibold mb-2" style={{ fontFamily: "Georgia, serif" }}>
                Nothing to show here yet
            </p>
            <p className="text-[#888] text-[14px] mb-6 max-w-sm mx-auto">
                Start rating books you've read and we'll find ones you'll love.
            </p>
            <Link
                to="/mybooks"
                className="inline-block bg-[#00635d] hover:bg-[#004d48] text-white text-[14px] px-6 py-2.5 rounded font-medium transition-colors"
            >
                Go to My Books
            </Link>
        </div>
    );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="bg-[#fff5f5] border border-[#f5c6c6] rounded-lg p-8 text-center" style={{ marginTop: "16px" }}>
            <p className="text-[#c0392b] text-[15px] font-semibold mb-1">
                Couldn't load recommendations
            </p>
            <p className="text-[#888] text-[13px] mb-4">
                Something went wrong on our end. Please try again.
            </p>
            <button
                onClick={onRetry}
                className="bg-[#382110] hover:bg-[#5a3a1a] text-white text-[13px] px-5 py-2 rounded transition-colors"
            >
                Try again
            </button>
        </div>
    );
}

// Main page 

export function Recommendation() {
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [status, setStatus] = useState<Status>("idle");
    const [books, setBooks] = useState<RecommendedBook[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isColdStart, setIsColdStart] = useState(false);
    const [shelvedIds, setShelvedIds] = useState<Set<string>>(new Set());
    const { addBook } = useBooks();

    // Fetch 
    const load = useCallback(
        async (pageNum: number, tab: FilterTab, replace: boolean) => {
            setStatus("loading");
            try {
                const result: RecommendationsResponse = await fetchRecommendations({
                    page: pageNum,
                    perPage: 10,
                    reason: tab === "all" ? null : tab,
                });

                setIsColdStart(result.isColdStart);

                if (result.books.length === 0 && pageNum === 1) {
                    setStatus("empty");
                    return;
                }

                setBooks((prev) => (replace ? result.books : [...prev, ...result.books]));
                setHasMore(result.hasMore);
                setStatus("success");
            } catch {
                setStatus("error");
            }
        },
        []
    );

    // Reset + fetch when tab changes
    useEffect(() => {
        setPage(1);
        setBooks([]);
        load(1, activeTab, true);
    }, [activeTab, load]);

    function loadMore() {
        const next = page + 1;
        setPage(next);
        load(next, activeTab, false);
    }

    function handleWantToRead(bookId: string, shelf: 'want-to-read' | 'read' | 'currently-reading') {
        setShelvedIds((prev) => new Set(prev).add(bookId));
        // Find the book and add to want-to-read shelf
        const book = books.find(b => b.id === bookId);
        if (book) {
            // Create temporary Book object for optimistic update
            const tempBook: Book = {
                id: `temp-${book.id}`, // Temporary ID, will be replaced by real one
                bookId: book.googleBooksId, // Use googleBooksId as bookId for now
                googleBooksId: book.googleBooksId,
                title: book.title,
                subtitle: book.subtitle || undefined,
                author: book.author,
                coverUrl: book.coverUrl || "https://placehold.co/120x180?text=No+Cover",
                rating: 0, // No user rating yet
                shelf: shelf,
                dateAdded: new Date().toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                }),
                review: "",
                pagesCompleted: 0,
                totalPages: book.pageCount || undefined,
                description: book.description || undefined,
            };

            const shelfData: ShelfBookData = {
                google_books_id: book.googleBooksId,
                title: book.title,
                subtitle: book.subtitle || undefined,
                author: book.author,
                cover_url: book.coverUrl || undefined,
                page_count: book.pageCount || undefined,
                description: book.description || undefined,
                published_date: book.publishedDate || undefined,
                categories: book.categories,
                average_rating: book.averageRating,
            };

            // Use BooksContext's addBook method for proper state management
            addBook(tempBook, shelfData).catch(console.error);
        }
    }

    // Group by reason for "all" tab 
    const grouped = books.reduce<Record<string, RecommendedBook[]>>((acc, b) => {
        (acc[b.reason] ??= []).push(b);
        return acc;
    }, {});

    const reasonOrder: RecommendationReason[] = ["cf", "genre", "author"];

    //  Render 
    return (
        <div className="max-w-[860px] mx-auto px-4 py-5">
            {/* Breadcrumb */}
            <nav className="text-[12px] mb-4 leading-relaxed" aria-label="breadcrumb">
                <Link to="/mybooks" className="text-[#00635d] hover:underline">
                    My Books
                </Link>
                <span className="text-[#00635d]"> › Recommendations</span>
            </nav>

            {/* Header */}
            <header style={{ marginBottom: "16px" }}>
                <h1
                    className="text-[32px] font-bold text-[#382110] mb-1"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    Recommendations
                </h1>
                <p className="text-[14px] text-[#777]">
                    Personalised picks based on your ratings and reading history.
                </p>
            </header>

            {/* Cold-start banner */}
            {isColdStart && (status === "success" || status === "empty") && (
                <div style={{ marginBottom: "16px" }}>
                    <ColdStartBanner />
                </div>
            )}

            {/* Filter tabs */}
            <div
                className="flex border-b border-[#e8e0d0]"
                style={{ marginBottom: "8px", gap: 0 }}
                role="tablist"
                aria-label="Recommendation filters"
            >
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={[
                            "px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 -mb-px",
                            activeTab === tab.id
                                ? "border-[#382110] text-[#382110]"
                                : "border-transparent text-[#888] hover:text-[#382110]",
                        ].join(" ")}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* States */}
            <div className="max-h-[600px] overflow-y-auto pr-4">

            {status === "error" && (
                <ErrorState onRetry={() => load(1, activeTab, true)} />
            )}

            {/* Loader (first load) */}
            {status === "loading" && books.length === 0 && (
                <JimuLoader />
            )}

            {/* Book lists  */}

            {status !== "error" && (
                <>
                    {/* Grouped view (All tab) */}
                    {activeTab === "all" &&
                        reasonOrder.map((reason) => {
                            const group = grouped[reason];
                            if (!group?.length) return null;
                            return (
                                <section key={reason} aria-labelledby={`section-${reason}`}>
                                    {/* On cold start, show cf books but relabel as "Popular Picks" */}
                                    {reason === "cf" && isColdStart ? (
                                        <div className="border-b border-[#e8e0d0]" style={{ paddingTop: "24px", paddingBottom: "8px" }}>
                                            <h2
                                                className="text-[19px] font-bold text-[#382110]"
                                                style={{ fontFamily: "Georgia, serif" }}
                                            >
                                                Popular Picks
                                            </h2>
                                            <p className="text-[12px] text-[#999] mt-0.5">
                                                Most loved books across all readers
                                            </p>
                                        </div>
                                    ) : (
                                        <SectionDivider reason={reason} />
                                    )}
                                    {group.map((book) => (
                                        <BookCard
                                            key={book.id}
                                            book={book}
                                            onWantToRead={handleWantToRead}
                                            shelvedIds={shelvedIds}
                                        />
                                    ))}
                                </section>
                            );
                        })}

                    {/* Flat view (filtered tabs) */}
                    {activeTab !== "all" && (
                        <>
                            {isColdStart ? (
                                <div className="bg-[#f4f0e6] rounded-lg px-8 py-12 text-center" style={{ marginTop: "16px" }}>
                                    <p className="text-[#382110] text-[18px] font-semibold mb-2" style={{ fontFamily: "Georgia, serif" }}>
                                        Not enough data yet
                                    </p>
                                    <p className="text-[#888] text-[14px] mb-6 max-w-sm mx-auto">
                                        Rate at least 5 books and we'll find personalised picks based on readers who share your taste.
                                    </p>
                                    <Link
                                        to="/mybooks"
                                        className="inline-block bg-[#00635d] hover:bg-[#004d48] text-white text-[14px] px-6 py-2.5 rounded font-medium transition-colors"
                                    >
                                        Go rate some books
                                    </Link>
                                </div>
                            ) : status === "empty" ? (
                                <EmptyState />
                            ) : (
                                books.map((book) => (
                                    <BookCard
                                        key={book.id}
                                        book={book}
                                        onWantToRead={handleWantToRead}
                                        shelvedIds={shelvedIds}
                                    />
                                ))
                            )}
                        </>
                    )}

                    {/* Loading more inline */}
                    {status === "loading" && books.length > 0 && (
                        <div className="py-6 text-center text-[13px] text-[#aaa]">
                            Loading more…
                        </div>
                    )}

                    {/* Load more button */}
                    {status === "success" && hasMore && (
                        <div className="text-center" style={{ marginTop: "32px" }}>
                            <button
                                onClick={loadMore}
                                className="border border-[#c9b99a] text-[#7b5e3a] text-[14px] px-8 py-2.5 rounded hover:bg-[#f4f0e6] transition-colors"
                            >
                                Load more
                            </button>
                        </div>
                    )}

                    {/* All loaded */}
                    {status === "success" && !hasMore && books.length > 0 && (
                        <p className="text-center text-[12px] text-[#bbb]" style={{ marginTop: "32px", paddingBottom: "16px" }}>
                            You've seen all recommendations for now.
                        </p>
                    )}
                </>
            )}
            </div>
        </div>
    );
}
