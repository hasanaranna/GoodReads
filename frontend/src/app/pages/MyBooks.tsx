import { useEffect, useState } from "react";
import {
  Search,
  List,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParams, Link } from "react-router";
import { useBooks } from "../context/BooksContext";
import { Sidebar } from "../components/Sidebar";
import { BookRow } from "../components/BookRow";

const SHELF_NAMES: Record<string, string> = {
  "want-to-read": "Want to Read",
  "currently-reading": "Currently Reading",
  read: "Read",
};

const ITEMS_PER_PAGE = 10;

export function MyBooks() {
  const { shelfId } = useParams();
  const { books } = useBooks();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "title" | "author" | "rating" | "dateAdded"
  >("dateAdded");
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = books.filter((b) => {
    const matchesShelf = !shelfId || b.shelf === shelfId;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query);

    return matchesShelf && matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "title")
      return a.title.localeCompare(b.title);
    if (sortBy === "author") return a.author.localeCompare(b.author);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, shelfId]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(paginated.map((b) => b.id)));
  }

  const shelfLabel = shelfId ? SHELF_NAMES[shelfId] : undefined;

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="text-[13px] text-[#382110] mb-2" style={{ marginTop: "24px" }}>
        <Link
          to="/mybooks"
          className="no-underline text-[#382110] hover:underline"
        >
          My Books
        </Link>
        {shelfLabel && (
          <span className="text-gray-500 ml-1">&gt;&gt; {shelfLabel}</span>
        )}
      </div>

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search and add books */}
        <div className="flex items-center border border-[#ccc] rounded-full px-3 py-1 bg-[#f4f0e6] gap-2 text-[12px]">
          <input
            type="text"
            placeholder="Search in My Books"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="outline-none bg-transparent text-[#382110] w-[180px]"
          />
          <Search size={13} className="text-[#888]" />
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-[1.5em] text-[1em]">
          <button
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedIds(new Set());
            }}
            className={`outline-none border-none bg-transparent shadow-none font-semibold hover:underline ${batchMode ? "text-[#00635d]" : "text-[#382110]"}`}
          >
            Batch Edit
          </button>
          {batchMode && (
            <>
              <button
                onClick={selectAll}
                className="outline-none border-none bg-transparent shadow-none text-[#00635d] hover:underline text-[0.9em]"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="outline-none border-none bg-transparent shadow-none text-[#00635d] hover:underline text-[0.9em]"
              >
                Clear
              </button>
            </>
          )}
          <button className="outline-none border-none bg-transparent shadow-none font-semibold text-[#382110] hover:underline">
            *Settings
          </button>
          <button className="outline-none border-none bg-transparent shadow-none font-semibold text-[#382110] hover:underline">
            *Stats
          </button>
          <button className="outline-none border-none bg-transparent shadow-none font-semibold text-[#382110] hover:underline">
            *Print
          </button>
          <span className="text-[#ccc]">|</span>
          <button
            onClick={() => setViewMode("list")}
            className={`outline-none border-none bg-transparent shadow-none ${
              viewMode === "list"
                ? "text-[#382110]"
                : "text-[#aaa] hover:text-[#382110]"
            }`}
          >
            <List size="1.2em" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`outline-none border-none bg-transparent shadow-none ${
              viewMode === "grid"
                ? "text-[#382110]"
                : "text-[#aaa] hover:text-[#382110]"
            }`}
          >
            <LayoutGrid size="1.2em" />
          </button>
        </div>
      </div>

      <div className="flex" style={{ gap: "64px" }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-3" style={{ marginTop: "24px" }}>
            <div className="text-[0.9em] text-gray-500">
              {filtered.length} book{filtered.length !== 1 ? "s" : ""}
              {shelfLabel ? ` on ${shelfLabel}` : ""}
            </div>
            <div className="flex items-center gap-[1em] text-[0.9em]">
              <span className="text-gray-500">Sort by:</span>
              {(["title", "author", "rating", "dateAdded"] as const).map(
                (s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`outline-none border-none bg-transparent shadow-none capitalize hover:underline ${
                      sortBy === s
                        ? "text-[#382110] underline"
                        : "text-[#00635d]"
                    }`}
                  >
                    {s === "dateAdded" ? "Date Added" : s}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Pagination top */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-[12px] text-[#00635d] justify-end mb-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                <ChevronLeft size={13} /> previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-1 hover:underline ${
                    currentPage === p
                      ? "text-[#382110] underline"
                      : "text-[#00635d]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                next <ChevronRight size={13} />
              </button>
            </div>
          )}

          {/* Book list or grid */}
          {viewMode === "list" ? (
            <div>
              {/* Header row */}
              <div className="flex items-center gap-3 py-2 border-b-2 border-[#382110] text-[12px] text-gray-500">
                {batchMode && <div className="w-5" />}
                <div className="w-[60px] shrink-0" />
                <div className="w-[200px] shrink-0" style={{ margin: "0 16px" }}>Title</div>
                <div className="w-[130px] shrink-0">Rating / Shelf</div>
                <div className="hidden md:block w-[110px] shrink-0">
                  Date Added / Read
                </div>
                <div className="flex-1">Review</div>
              </div>

              {paginated.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-[14px]">
                  No books found.{" "}
                  <Link
                    to="/mybooks"
                    className="text-[#00635d] hover:underline no-underline"
                  >
                    View all books
                  </Link>
                </div>
              ) : (
                paginated.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    viewMode="list"
                    selected={selectedIds.has(book.id)}
                    onSelect={toggleSelect}
                    batchMode={batchMode}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 pt-2">
              {paginated.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-[14px] w-full">
                  No books found.
                </div>
              ) : (
                paginated.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    viewMode="grid"
                    selected={selectedIds.has(book.id)}
                    onSelect={toggleSelect}
                    batchMode={batchMode}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination bottom */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-[12px] text-[#00635d] justify-end mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                <ChevronLeft size={13} /> previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-1 hover:underline ${
                    currentPage === p
                      ? "text-[#382110] underline"
                      : "text-[#00635d]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="disabled:opacity-40 hover:underline flex items-center"
              >
                next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
