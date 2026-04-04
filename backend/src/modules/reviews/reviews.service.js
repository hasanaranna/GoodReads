import { pool } from "../../config/db.js";

export async function updateReview(userId, bookshelfBookId, updates) {
  // Verify ownership and get book_id
  const ownership = await pool.query(
    `SELECT bb.book_id
     FROM bookshelf_books bb
     JOIN bookshelves bs ON bb.bookshelf_id = bs.id
     JOIN libraries l ON bs.library_id = l.id
     WHERE bb.id = $1 AND l.user_id = $2`,
    [bookshelfBookId, userId],
  );
  if (ownership.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  const bookId = ownership.rows[0].book_id;

  if (updates.rating !== undefined) {
    if (
      typeof updates.rating !== "number" ||
      updates.rating < 0 ||
      updates.rating > 5
    ) {
      const error = new Error("Rating must be a number between 0 and 5.");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
  }

  if (updates.rating === undefined && updates.review === undefined) {
    const error = new Error(
      "No valid fields to update. Provide 'rating' and/or 'review'.",
    );
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  // Get current values
  const currentReview = await pool.query(
    "SELECT id, rating, review_comment FROM reviews WHERE about_book_id = $1 AND by_user_id = $2",
    [bookId, userId],
  );
  const currentRating =
    currentReview.rows.length > 0
      ? parseFloat(currentReview.rows[0].rating)
      : 0;
  const currentComment =
    currentReview.rows.length > 0 ? currentReview.rows[0].review_comment : "";
  const newRating =
    updates.rating !== undefined ? updates.rating : currentRating;
  const newComment =
    updates.review !== undefined ? updates.review : currentComment;

  const result = await pool.query(
    `INSERT INTO reviews (about_book_id, by_user_id, rating, review_comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (about_book_id, by_user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       review_comment = EXCLUDED.review_comment,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id AS review_id, rating, review_comment AS review, created_at, updated_at`,
    [bookId, userId, newRating, newComment],
  );

  // Update book average_rating
  const avgResult = await pool.query(
    `SELECT AVG(rating) AS avg_rating FROM reviews WHERE about_book_id = $1 AND rating > 0`,
    [bookId],
  );
  const avgRating = avgResult.rows[0].avg_rating
    ? parseFloat(avgResult.rows[0].avg_rating).toFixed(2)
    : null;
  await pool.query(`UPDATE books SET average_rating = $1 WHERE id = $2`, [
    avgRating,
    bookId,
  ]);

  return result.rows[0];
}

export async function getReview(userId, bookshelfBookId) {
  const result = await pool.query(
    `SELECT
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
    WHERE bb.id = $1 AND l.user_id = $2`,
    [bookshelfBookId, userId],
  );
  if (result.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }
  return result.rows[0];
}

export async function getBookReviews(googleBooksId) {
  const result = await pool.query(
    `SELECT
      r.id AS review_id,
      r.rating,
      r.review_comment AS review,
      r.created_at AS date_added,
      u.id AS user_id,
      u.name AS user_name,
      u.username,
      b.title,
      b.authors,
      b.cover_url,
      b.google_books_id,
      (
        SELECT bs2.shelf_type
        FROM bookshelf_books bb2
        JOIN bookshelves bs2 ON bb2.bookshelf_id = bs2.id
        JOIN libraries l2 ON bs2.library_id = l2.id
        WHERE l2.user_id = r.by_user_id AND bb2.book_id = b.id
        LIMIT 1
      ) AS shelf
    FROM reviews r
    JOIN books b ON r.about_book_id = b.id
    JOIN users u ON r.by_user_id = u.id
    WHERE b.google_books_id = $1
      AND (r.rating > 0 OR (r.review_comment IS NOT NULL AND r.review_comment != ''))
    ORDER BY r.created_at DESC`,
    [googleBooksId],
  );
  return result.rows;
}
