import { pool } from "../../config/db.js";

/**
 * Update review and/or rating for a user_book.
 */
export async function updateReview(userId, userBookId, updates) {
  // Verify ownership
  const ownership = await pool.query(
    "SELECT id FROM user_books WHERE id = $1 AND user_id = $2",
    [userBookId, userId]
  );

  if (ownership.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  if (updates.rating !== undefined) {
    if (!Number.isInteger(updates.rating) || updates.rating < 0 || updates.rating > 5) {
      const error = new Error("Rating must be an integer between 0 and 5.");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    setClauses.push(`rating = $${paramIndex++}`);
    params.push(updates.rating);
  }

  if (updates.review !== undefined) {
    setClauses.push(`review = $${paramIndex++}`);
    params.push(updates.review);
  }

  if (setClauses.length === 0) {
    const error = new Error("No valid fields to update. Provide 'rating' and/or 'review'.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  params.push(userBookId, userId);

  const result = await pool.query(
    `UPDATE user_books
     SET ${setClauses.join(", ")}
     WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
     RETURNING id AS user_book_id, shelf, rating, review, pages_completed, date_added, date_read`,
    params
  );

  return result.rows[0];
}

/**
 * Get review details for a user_book (includes book data).
 */
export async function getReview(userId, userBookId) {
  const result = await pool.query(
    `SELECT
      ub.id AS user_book_id,
      ub.rating,
      ub.review,
      ub.shelf,
      ub.pages_completed,
      ub.date_added,
      ub.date_read,
      b.id AS book_id,
      b.google_books_id,
      b.title,
      b.subtitle,
      b.author,
      b.cover_url,
      b.page_count,
      b.description,
      b.published_date,
      b.categories,
      b.average_rating
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    WHERE ub.id = $1 AND ub.user_id = $2`,
    [userBookId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error("Book not found on your shelf.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  return result.rows[0];
}

/**
 * Get all reviews for a book by its google_books_id.
 * Returns reviews from ALL users (public).
 * Only includes entries where rating > 0 or review is non-empty.
 */
export async function getBookReviews(googleBooksId) {
  const result = await pool.query(
    `SELECT
      ub.id AS user_book_id,
      ub.rating,
      ub.review,
      ub.shelf,
      ub.date_added,
      u.id AS user_id,
      u.name AS user_name,
      u.username,
      b.title,
      b.author,
      b.cover_url,
      b.google_books_id
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    JOIN users u ON ub.user_id = u.id
    WHERE b.google_books_id = $1
      AND (ub.rating > 0 OR (ub.review IS NOT NULL AND ub.review != ''))
    ORDER BY ub.date_added DESC`,
    [googleBooksId]
  );

  return result.rows;
}
