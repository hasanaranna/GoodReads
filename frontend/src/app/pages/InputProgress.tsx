import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBooks } from "../context/BooksContext";

const EXPLORE_BOOKS = [
  {
    id: "e1",
    title: "Educated",
    author: "Tara Westover",
    rating: 4.33,
    coverUrl:
      "https://images.unsplash.com/photo-1735050873394-5f07cca72d70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
  },
  {
    id: "e2",
    title: "The Glass Castle",
    author: "Jeannette Walls",
    rating: 4.33,
    coverUrl:
      "https://images.unsplash.com/photo-1755541608494-5c02cf56e1f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
  },
  {
    id: "e3",
    title: "Pather Panchali",
    author: "Bibhutibhushan Bandyopadhyay",
    rating: 4.5,
    coverUrl:
      "https://images.unsplash.com/photo-1676747484510-755c231ae83e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
  },
  {
    id: "e4",
    title: "Durbin",
    author: "Shirshendu Mukhopadhyay",
    rating: 4.33,
    coverUrl:
      "https://images.unsplash.com/photo-1772976811682-465df3b8c735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
  },
  {
    id: "e5",
    title: "Brishti Bilas",
    author: "Humayun Ahmed",
    rating: 4.33,
    coverUrl:
      "https://images.unsplash.com/photo-1727044113262-b96af5546da2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
  },
];

export function InputProgress() {
  const { bookId } = useParams();
  const { getBook, updateBook, removeBook } = useBooks();
  const navigate = useNavigate();
  const book = getBook(bookId!);

  const [editingField, setEditingField] = useState<"pages" | "pct" | null>(
    null,
  );
  const [pagesCompleted, setPagesCompleted] = useState(
    book?.pagesCompleted || 0,
  );
  const [pagesInput, setPagesInput] = useState(
    String(book?.pagesCompleted || 0),
  );
  const [totalPages, setTotalPages] = useState(book?.totalPages || 0);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [readDates, setReadDates] = useState<
    { id: string; started: string; finished: string }[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!book) {
    return (
      <div className="max-w-[860px] mx-auto px-4 py-10 text-center">
        <p className="text-gray-500">Book not found.</p>
        <Link
          to="/mybooks"
          className="text-[#00635d] hover:underline no-underline"
        >
          Back to My Books
        </Link>
      </div>
    );
  }

  useEffect(() => {
    if (totalPages > 0) {
      setPagesCompleted((prev) => Math.min(Math.max(prev, 0), totalPages));
    }
  }, [totalPages]);

  const normalizedPagesCompleted =
    totalPages > 0
      ? Math.min(Math.max(pagesCompleted, 0), totalPages)
      : Math.max(pagesCompleted, 0);

  const pct =
    totalPages > 0
      ? Math.floor((normalizedPagesCompleted / totalPages) * 100)
      : 0;

  async function handleUpdate() {
    setIsSaving(true);
    try {
      await updateBook(book!.id, { pagesCompleted: normalizedPagesCompleted });
      navigate("/mybooks");
    } catch (err) {
      console.error("Failed to update progress:", err);
    } finally {
      setIsSaving(false);
    }
  }

  function handlePctEdit(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n) && totalPages > 0) {
      const boundedPercent = Math.min(Math.max(n, 0), 100);
      const pages = Math.round((boundedPercent / 100) * totalPages);
      setPagesCompleted(Math.min(pages, totalPages));
    }
  }

  return (
    <div className="max-w-[860px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <div className="text-[12px] mb-4 leading-relaxed">
        {/* <Link
          to="/mybooks"
          className="text-[#00635d] no-underline hover:underline"
        >
          {book.title}
          {book.subtitle && `: ${book.subtitle}`}
        </Link> */}
        <span className="text-[#00635d]">
          {book.title}
          {book.subtitle && `: ${book.subtitle}`}
        </span>
        <span className="text-[#00635d]"> &gt; Reading Progress &gt; Edit</span>
      </div>

      {/* Book info */}
      <div className="flex gap-4 mb-4">
        <img
          src={book.coverUrl}
          alt={book.title}
          className="w-[75px] h-[105px] object-cover shadow shrink-0"
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
        className="text-[12px] text-[#00635d] hover:underline no-underline mb-4 block"
      >
        Change Edition
      </a>

      <div className="border-t border-[#ddd]" />

      {/* Progress fields */}
      <div className="py-4 border-b border-[#ddd]">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] text-gray-500">Reading progress</span>
            <span className="text-[12px] text-[#382110]">{pct}%</span>
          </div>
          <div className="w-full bg-[#e8e0d0] rounded-full h-2">
            <div
              className="bg-[#00635d] h-2 rounded-full transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Pages Completed */}
        <div className="flex items-center gap-4 py-2 border-b border-[#eee]">
          <div className="w-[160px] text-[13px] text-[#382110]">
            Pages Completed
          </div>
          {editingField === "pages" ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={pagesInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "");
                  if (raw === "") {
                    setPagesInput("");
                    setPagesCompleted(0);
                    return;
                  }
                  const num = parseInt(raw, 10);
                  const capped =
                    totalPages > 0 ? Math.min(num, totalPages) : num;
                  setPagesInput(String(capped));
                  setPagesCompleted(capped);
                }}
                className="border border-[#00635d] rounded px-2 py-0.5 text-[13px] w-[90px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setEditingField(null)}
                className="text-[12px] bg-[#00635d] text-white px-2 py-0.5 rounded hover:bg-[#004d3d]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setPagesCompleted(book.pagesCompleted || 0);
                  setPagesInput(String(book.pagesCompleted || 0));
                  setEditingField(null);
                }}
                className="text-[12px] text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#382110] w-[80px]">
                {pagesCompleted}
              </span>
              <button
                onClick={() => {
                  setPagesInput(String(pagesCompleted));
                  setEditingField("pages");
                }}
                className="text-[12px] text-[#00635d] hover:underline"
              >
                [Edit]
              </button>
            </div>
          )}
        </div>

        {/* Total Pages */}
        <div className="flex items-center gap-4 py-2 border-b border-[#eee]">
          <div className="w-[160px] text-[13px] text-[#382110]">
            Total Pages
          </div>
          {editingField === "total" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={totalPages}
                onChange={(e) =>
                  setTotalPages(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="border border-[#00635d] rounded px-2 py-0.5 text-[13px] w-[90px] focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setEditingField(null)}
                className="text-[12px] bg-[#00635d] text-white px-2 py-0.5 rounded hover:bg-[#004d3d]"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setTotalPages(book.totalPages || 0);
                  setEditingField(null);
                }}
                className="text-[12px] text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#382110] w-[80px]">
                {totalPages}
              </span>
              <button
                onClick={() => setEditingField("total")}
                className="text-[12px] text-[#00635d] hover:underline"
              >
                [Edit]
              </button>
            </div>
          )}
        </div>

        {/* Percentage */}
        <div className="flex items-center gap-4 py-2">
          <div className="w-[160px] text-[13px] text-[#382110]">Percentage</div>
          {editingField === "pct" ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                defaultValue={pct}
                onBlur={(e) => handlePctEdit(e.target.value)}
                className="border border-[#00635d] rounded px-2 py-0.5 text-[13px] w-[80px] focus:outline-none"
                autoFocus
                min={0}
                max={100}
              />
              <span className="text-[13px] text-[#382110]">%</span>
              <button
                onClick={() => setEditingField(null)}
                className="text-[12px] bg-[#00635d] text-white px-2 py-0.5 rounded hover:bg-[#004d3d]"
              >
                Save
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="text-[12px] text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[#382110] w-[80px]">
                {pct} %
              </span>
              <button
                onClick={() => setEditingField("pct")}
                className="text-[12px] text-[#00635d] hover:underline"
              >
                [Edit]
              </button>
            </div>
          )}
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
          </div>
        ))}

        <button
          onClick={() =>
            setReadDates((prev) => [
              ...prev,
              { id: Date.now().toString(), started: "", finished: "" },
            ])
          }
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
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">
                  Owned?
                </label>
                <select className="border border-[#ccc] rounded px-2 py-1 text-[12px] w-full">
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-gray-500 mb-1">
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

      {/* Update button */}
      <div className="py-4 border-b border-[#ddd] flex items-center gap-4">
        <button
          onClick={handleUpdate}
          disabled={isSaving}
          className="bg-[#f4f0e6] border border-[#999] px-5 py-1.5 text-[13px] text-[#382110] hover:bg-[#e8e2d0] rounded disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Update"}
        </button>
      </div>

      {/* Footer links */}
      <div className="text-[12px] flex items-center gap-2 py-3 border-b border-[#ddd]">
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

      {/* Explore more */}
      <div className="pt-6">
        <div className="text-[16px] text-[#382110] mb-4">Explore more</div>
        <div className="flex gap-5 overflow-x-auto pb-2">
          {EXPLORE_BOOKS.map((eb) => (
            <div
              key={eb.id}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[100px]"
            >
              <img
                src={eb.coverUrl}
                alt={eb.title}
                className="w-[80px] h-[110px] object-cover shadow hover:shadow-md transition-shadow cursor-pointer"
              />
              <div className="text-[12px] text-[#382110] text-center w-full truncate">
                {eb.title}
              </div>
              <div className="text-[11px] text-gray-500 text-center w-full truncate">
                {eb.author}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[#d4a017]">★</span>
                <span className="text-[11px] text-gray-500">{eb.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
