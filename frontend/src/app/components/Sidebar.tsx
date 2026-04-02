import { Link, useParams } from "react-router";
import { useBooks } from "../context/BooksContext";

export function Sidebar() {
  const { shelfId } = useParams();
  const { shelfCounts } = useBooks();

  const shelves = [
    { id: "all", label: "All", count: shelfCounts.all, path: "/mybooks" },
    {
      id: "want-to-read",
      label: "Want to Read",
      count: shelfCounts.wantToRead,
      path: "/mybooks/shelf/want-to-read",
    },
    {
      id: "currently-reading",
      label: "Currently Reading",
      count: shelfCounts.currentlyReading,
      path: "/mybooks/shelf/currently-reading",
    },
    {
      id: "read",
      label: "Read",
      count: shelfCounts.read,
      path: "/mybooks/shelf/read",
    },
  ];

  const activeShelf = shelfId || "all";

  return (
    <aside
      className="w-[210px] shrink-0 text-[15px] lg:-ml-6"
      style={{ marginTop: "24px" }}
    >
      {/* Bookshelves */}
      <div className="mb-8">
        <div className="mb-3 border-b border-[#ddd] pb-2">
          <span
            className="text-[#382110] text-[17px]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Bookshelves
          </span>{" "}
          <a
            href="#"
            className="text-[#00635d] text-[13px] hover:underline no-underline"
          >
            (Edit)
          </a>
        </div>
        <ul className="space-y-1">
          {shelves.map((shelf) => (
            <li key={shelf.id}>
              <Link
                to={shelf.path}
                className={`no-underline flex justify-between items-center py-1 ${
                  activeShelf === shelf.id
                    ? "text-[#382110] font-semibold"
                    : "text-[#382110] hover:underline"
                }`}
              >
                <span>{shelf.label}</span>
                <span className="text-gray-500">({shelf.count})</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[#ddd] pt-5 mb-8">
        <div
          className="mb-3 text-[17px] text-[#382110]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Your reading activity
        </div>
        <ul className="space-y-1.5">
          {[
            "*Review Drafts",
            "*Kindle Notes & Highlights",
            "*Reading Challenge",
            "*Year in Books",
            "*Reading stats",
          ].map((item) => (
            <li key={item}>
              <a
                href="#"
                className="text-[#00635d] hover:underline no-underline text-[15px]"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[#ddd] pt-5 mb-8">
        <div
          className="mb-3 text-[17px] text-[#382110]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Add books
        </div>
        <ul className="space-y-1.5">
          {["*Recommendations", "*Explore"].map((item) => (
            <li key={item}>
              <a
                href="#"
                className="text-[#382110] hover:underline no-underline text-[15px]"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[#ddd] pt-5">
        <div
          className="mb-3 text-[17px] text-[#382110]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Tools
        </div>
        <ul className="space-y-1.5">
          {["*Find duplicates", "*Widgets", "*Import and exports"].map(
            (item) => (
              <li key={item}>
                <a
                  href="#"
                  className="text-[#382110] hover:underline no-underline text-[15px]"
                >
                  {item}
                </a>
              </li>
            ),
          )}
        </ul>
      </div>
    </aside>
  );
}
