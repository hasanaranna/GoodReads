import { pool } from "../../config/db.js";

function addProgressMetadata(row) {
  const totalPages =
    Number.isInteger(row.page_count) && row.page_count > 0
      ? row.page_count
      : null;
  const rawPages = Number.isInteger(row.pages_completed)
    ? row.pages_completed
    : 0;
  const pagesCompleted = totalPages
    ? Math.min(Math.max(rawPages, 0), totalPages)
    : Math.max(rawPages, 0);
  return {
    ...row,
    pages_completed: pagesCompleted,
    completion_percentage: totalPages
      ? Math.round((pagesCompleted / totalPages) * 100)
      : null,
  };
}

async function getUserBookshelfId(userId, shelfType) {
  const result = await pool.query(
    `SELECT bs.id FROM bookshelves bs
     JOIN libraries l ON bs.library_id = l.id
     WHERE l.user_id = $1 AND bs.shelf_type = $2`,
    [userId, shelfType],
  );
  if (result.rows.length === 0) {
    const error = new Error(
      "Bookshelf not found. User library may not be set up.",
    );
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return result.rows[0].id;
}

async function findOrCreateBook(bookData) {
  const existing = await pool.query(
    "SELECT id FROM books WHERE google_books_id = $1",
    [bookData.google_books_id],
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const result = await pool.query(
    `INSERT INTO books (google_books_id, title, subtitle, authors, cover_url, page_count, description, publish_date, genres, isbn, language, alternate_titles, maturity_rating, average_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING id`,
    [
      bookData.google_books_id,
      bookData.title,
      bookData.subtitle || null,
      bookData.authors || [],
      bookData.cover_url || null,
      bookData.page_count || null,
      bookData.description || null,
      bookData.published_date || null,
      bookData.genres || null,
      bookData.isbn || null,
      bookData.language || null,
      bookData.alternate_titles || null,
      bookData.maturity_rating || null,
      bookData.average_rating || null,
    ],
  );
  return result.rows[0].id;
}

const BASE_SELECT = `
  SELECT
    bb.id AS user_book_id,
    bs.shelf_type AS shelf,
    COALESCE(r.rating, 0) AS rating,
    COALESCE(r.review_comment, '') AS review,
    COALESCE(rp.curr_page, 0) AS pages_completed,
    bb.date_added,
    bb.completed_at AS date_read,
    b.id AS book_id,
    b.google_books_id,
    b.title,
    b.subtitle,
    b.authors,
    b.cover_url,
    b.page_count,
    b.description,
    b.genres,
    b.isbn,
    b.language,
    b.maturity_rating,
    b.alternate_titles,
    b.average_rating
  FROM bookshelf_books bb
  JOIN bookshelves bs ON bb.bookshelf_id = bs.id
  JOIN libraries l ON bs.library_id = l.id
  JOIN books b ON bb.book_id = b.id
  LEFT JOIN reading_progress rp ON rp.book_id = b.id AND rp.user_id = l.user_id
  LEFT JOIN reviews r ON r.about_book_id = b.id AND r.by_user_id = l.user_id
`;

export async function getUserBooks(userId, shelf) {
  let query = BASE_SELECT + ` WHERE l.user_id = $1`;
  const params = [userId];
  if (shelf) {
    query += ` AND bs.shelf_type = $2`;
    params.push(shelf);
  }
  query += ` ORDER BY bb.date_added DESC`;
  const result = await pool.query(query, params);
  return result.rows.map(addProgressMetadata);
}

export async function getShelfCounts(userId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE bs.shelf_type = 'read_later') AS read_later,
       COUNT(*) FILTER (WHERE bs.shelf_type = 'currently_reading') AS currently_reading,
       COUNT(*) FILTER (WHERE bs.shelf_type = 'completed_reading') AS completed_reading,
       COUNT(*) AS all
     FROM bookshelf_books bb
     JOIN bookshelves bs ON bb.bookshelf_id = bs.id
     JOIN libraries l ON bs.library_id = l.id
     WHERE l.user_id = $1`,
    [userId],
  );
  const row = result.rows[0];
  return {
    all: parseInt(row.all, 10),
    readLater: parseInt(row.read_later, 10),
    currentlyReading: parseInt(row.currently_reading, 10),
    completedReading: parseInt(row.completed_reading, 10),
  };
}

export async function addBookToShelf(userId, bookData, shelfType) {
  const bookshelfId = await getUserBookshelfId(userId, shelfType);
  const bookId = await findOrCreateBook(bookData);

  // Check if book is already in ANY shelf for this user
  const existing = await pool.query(
    `SELECT bb.id FROM bookshelf_books bb
     JOIN bookshelves bs ON bb.bookshelf_id = bs.id
     JOIN libraries l ON bs.library_id = l.id
     WHERE l.user_id = $1 AND bb.book_id = $2`,
    [userId, bookId],
  );
  if (existing.rows.length > 0) {
    const error = new Error("Book is already on your shelf.");
    error.statusCode = 409;
    error.code = "CONFLICT";
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO bookshelf_books (bookshelf_id, book_id) VALUES ($1, $2) RETURNING id, date_added, completed_at`,
    [bookshelfId, bookId],
  );
  const bb = result.rows[0];

  // Create empty reading progress
  await pool.query(
    `INSERT INTO reading_progress (user_id, book_id, curr_page) VALUES ($1, $2, 0)
     ON CONFLICT (user_id, book_id) DO NOTHING`,
    [userId, bookId],
  );

  // Log activity
  await pool.query(
    `INSERT INTO activities (action, by_user_id) VALUES ($1, $2)`,
    [`Added "${bookData.title}" to ${shelfType.replace(/_/g, " ")}`, userId],
  );

  return {
    user_book_id: bb.id,
    shelf: shelfType,
    rating: 0,
    review: "",
    pages_completed: 0,
    date_added: bb.date_added,
    date_read: null,
    book_id: bookId,
    google_books_id: bookData.google_books_id,
    title: bookData.title,
    subtitle: bookData.subtitle || null,
    authors: bookData.authors || [],
    cover_url: bookData.cover_url || null,
    page_count: bookData.page_count || null,
    description: bookData.description || null,
    genres: bookData.genres || null,
    isbn: bookData.isbn || null,
    language: bookData.language || null,
    alternate_titles: bookData.alternate_titles || null,
    maturity_rating: bookData.maturity_rating || null,
    average_rating: bookData.average_rating || null,
    completion_percentage:
      bookData.page_count && bookData.page_count > 0 ? 0 : null,
  };
}

export async function updateUserBook(userId, bookshelfBookId, updates) {
  const ownership = await pool.query(
    `SELECT
      bb.id, bb.bookshelf_id, bb.book_id, bb.completed_at,
      bs.shelf_type,
      l.user_id,
      b.page_count,
      COALESCE(rp.curr_page, 0) AS curr_page
    FROM bookshelf_books bb
    JOIN bookshelves bs ON bb.bookshelf_id = bs.id
    JOIN libraries l ON bs.library_id = l.id
    JOIN books b ON bb.book_id = b.id
    LEFT JOIN reading_progress rp ON rp.book_id = bb.book_id AND rp.user_id = l.user_id
    WHERE bb.id = $1 AND l.user_id = $2`,
    [bookshelfBookId, userId],
  );

  if (ownership.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const existing = ownership.rows[0];
  const bookId = existing.book_id;
  const hasPageCount =
    Number.isInteger(existing.page_count) && existing.page_count > 0;
  const normalizedUpdates = { ...updates };

  // Handle pages_completed update
  if (normalizedUpdates.pages_completed !== undefined) {
    if (
      !Number.isInteger(normalizedUpdates.pages_completed) ||
      normalizedUpdates.pages_completed < 0
    ) {
      const error = new Error(
        "pages_completed must be a non-negative integer.",
      );
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    if (hasPageCount) {
      normalizedUpdates.pages_completed = Math.min(
        normalizedUpdates.pages_completed,
        existing.page_count,
      );
      if (normalizedUpdates.shelf === undefined) {
        if (normalizedUpdates.pages_completed >= existing.page_count) {
          normalizedUpdates.shelf = "completed_reading";
        } else if (
          normalizedUpdates.pages_completed > 0 &&
          existing.shelf_type === "read_later"
        ) {
          normalizedUpdates.shelf = "currently_reading";
        }
      }
    }
    // Update reading_progress
    await pool.query(
      `INSERT INTO reading_progress (user_id, book_id, curr_page)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, book_id) DO UPDATE SET curr_page = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, bookId, normalizedUpdates.pages_completed],
    );
  }

  // Handle shelf change
  if (
    normalizedUpdates.shelf !== undefined &&
    normalizedUpdates.shelf !== existing.shelf_type
  ) {
    const newBookshelfId = await getUserBookshelfId(
      userId,
      normalizedUpdates.shelf,
    );
    let completedAt = existing.completed_at;

    if (normalizedUpdates.shelf === "completed_reading") {
      completedAt = new Date().toISOString();
      if (hasPageCount && normalizedUpdates.pages_completed === undefined) {
        await pool.query(
          `INSERT INTO reading_progress (user_id, book_id, curr_page)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, book_id) DO UPDATE SET curr_page = $3, updated_at = CURRENT_TIMESTAMP`,
          [userId, bookId, existing.page_count],
        );
      }
    } else {
      completedAt = null;
    }

    await pool.query(
      `UPDATE bookshelf_books SET bookshelf_id = $1, completed_at = $2 WHERE id = $3`,
      [newBookshelfId, completedAt, bookshelfBookId],
    );
  } else if (normalizedUpdates.date_read !== undefined) {
    await pool.query(
      `UPDATE bookshelf_books SET completed_at = $1 WHERE id = $2`,
      [normalizedUpdates.date_read, bookshelfBookId],
    );
  }

  // Return updated row
  const updatedResult = await pool.query(
    BASE_SELECT + ` WHERE bb.id = $1 AND l.user_id = $2`,
    [bookshelfBookId, userId],
  );
  return addProgressMetadata(updatedResult.rows[0]);
}

export async function removeUserBook(userId, bookshelfBookId) {
  const existing = await pool.query(
    `SELECT bb.book_id, b.title
     FROM bookshelf_books bb
     JOIN bookshelves bs ON bb.bookshelf_id = bs.id
     JOIN libraries l ON bs.library_id = l.id
     JOIN books b ON bb.book_id = b.id
     WHERE bb.id = $1 AND l.user_id = $2`,
    [bookshelfBookId, userId],
  );
  if (existing.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  const { title } = existing.rows[0];
  await pool.query("DELETE FROM bookshelf_books WHERE id = $1", [
    bookshelfBookId,
  ]);
  await pool.query(
    `INSERT INTO activities (action, by_user_id) VALUES ($1, $2)`,
    [`Removed "${title}" from shelf`, userId],
  );
  return true;
}

export async function getUserBook(userId, bookshelfBookId) {
  const result = await pool.query(
    BASE_SELECT + ` WHERE bb.id = $1 AND l.user_id = $2`,
    [bookshelfBookId, userId],
  );
  if (result.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return addProgressMetadata(result.rows[0]);
}
