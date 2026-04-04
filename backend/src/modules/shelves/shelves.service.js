import { pool } from '../../config/db.js';

function addProgressMetadata(row) {
  const totalPages = Number.isInteger(row.page_count) && row.page_count > 0 ? row.page_count : null;
  const rawPagesCompleted = Number.isInteger(row.pages_completed) ? row.pages_completed : 0;
  const pagesCompleted = totalPages ? Math.min(Math.max(rawPagesCompleted, 0), totalPages) : Math.max(rawPagesCompleted, 0);

  return {
    ...row,
    pages_completed: pagesCompleted,
    completion_percentage: totalPages
      ? Math.round((pagesCompleted / totalPages) * 100)
      : null
  };
}

/**
 * Find or create a book record from Google Books data.
 * Returns the internal UUID.
 */
async function findOrCreateBook(bookData) {
  const existing = await pool.query(
    'SELECT id FROM books WHERE google_books_id = $1',
    [bookData.google_books_id]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await pool.query(
    `INSERT INTO books (google_books_id, title, subtitle, author, cover_url, page_count, description, published_date, categories, average_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      bookData.google_books_id,
      bookData.title,
      bookData.subtitle || null,
      bookData.author,
      bookData.cover_url || null,
      bookData.page_count || null,
      bookData.description || null,
      bookData.published_date || null,
      bookData.categories || null,
      bookData.average_rating || null
    ]
  );

  return result.rows[0].id;
}

/**
 * Get all books for a user, optionally filtered by shelf.
 */
export async function getUserBooks(userId, shelf) {
  let query = `
    SELECT
      ub.id AS user_book_id,
      ub.shelf,
      ub.rating,
      ub.review,
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
    WHERE ub.user_id = $1
  `;
  const params = [userId];

  if (shelf) {
    query += ' AND ub.shelf = $2';
    params.push(shelf);
  }

  query += ' ORDER BY ub.date_added DESC';

  const result = await pool.query(query, params);
  return result.rows.map(addProgressMetadata);
}

/**
 * Get shelf counts for a user.
 */
export async function getShelfCounts(userId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE shelf = 'want-to-read') AS want_to_read,
       COUNT(*) FILTER (WHERE shelf = 'currently-reading') AS currently_reading,
       COUNT(*) FILTER (WHERE shelf = 'read') AS read,
       COUNT(*) AS all
     FROM user_books
     WHERE user_id = $1`,
    [userId]
  );

  const row = result.rows[0];
  return {
    all: parseInt(row.all, 10),
    wantToRead: parseInt(row.want_to_read, 10),
    currentlyReading: parseInt(row.currently_reading, 10),
    read: parseInt(row.read, 10)
  };
}

/**
 * Add a book to a user's shelf.
 * Upserts the book record, then inserts user_books.
 */
export async function addBookToShelf(userId, bookData, shelf) {
  const bookId = await findOrCreateBook(bookData);

  // Check if user already has this book
  const existing = await pool.query(
    'SELECT id FROM user_books WHERE user_id = $1 AND book_id = $2',
    [userId, bookId]
  );

  if (existing.rows.length > 0) {
    const error = new Error('Book is already on your shelf.');
    error.statusCode = 409;
    error.code = 'CONFLICT';
    throw error;
  }

  const result = await pool.query(
    `INSERT INTO user_books (user_id, book_id, shelf, pages_completed)
     VALUES ($1, $2, $3, $4)
     RETURNING id, shelf, rating, review, pages_completed, date_added, date_read`,
    [userId, bookId, shelf, 0]
  );

  // Return the full record with book data
  const userBook = result.rows[0];
  return {
    user_book_id: userBook.id,
    shelf: userBook.shelf,
    rating: userBook.rating,
    review: userBook.review,
    pages_completed: userBook.pages_completed,
    date_added: userBook.date_added,
    date_read: userBook.date_read,
    book_id: bookId,
    google_books_id: bookData.google_books_id,
    title: bookData.title,
    subtitle: bookData.subtitle || null,
    author: bookData.author,
    cover_url: bookData.cover_url || null,
    page_count: bookData.page_count || null,
    description: bookData.description || null,
    published_date: bookData.published_date || null,
    categories: bookData.categories || null,
    average_rating: bookData.average_rating || null,
    completion_percentage:
      Number.isInteger(bookData.page_count) && bookData.page_count > 0 ? 0 : null
  };
}

/**
 * Update a user_book entry (shelf, pages_completed, date_read).
 */
export async function updateUserBook(userId, userBookId, updates) {
  // Verify ownership
  const ownership = await pool.query(
    `SELECT
      ub.id,
      ub.shelf,
      ub.date_read,
      ub.pages_completed,
      b.page_count
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    WHERE ub.id = $1 AND ub.user_id = $2`,
    [userBookId, userId]
  );

  if (ownership.rows.length === 0) {
    const error = new Error('Book not found on your shelf.');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  const existing = ownership.rows[0];
  const hasPageCount = Number.isInteger(existing.page_count) && existing.page_count > 0;
  const normalizedUpdates = { ...updates };

  if (normalizedUpdates.pages_completed !== undefined) {
    if (
      !Number.isInteger(normalizedUpdates.pages_completed) ||
      normalizedUpdates.pages_completed < 0
    ) {
      const error = new Error('pages_completed must be a non-negative integer.');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    if (hasPageCount) {
      normalizedUpdates.pages_completed = Math.min(
        normalizedUpdates.pages_completed,
        existing.page_count
      );

      if (normalizedUpdates.shelf === undefined) {
        if (normalizedUpdates.pages_completed >= existing.page_count) {
          normalizedUpdates.shelf = 'read';
        } else if (
          normalizedUpdates.pages_completed > 0 &&
          existing.shelf === 'want-to-read'
        ) {
          normalizedUpdates.shelf = 'currently-reading';
        }
      }

      if (normalizedUpdates.date_read === undefined) {
        if (normalizedUpdates.pages_completed >= existing.page_count) {
          normalizedUpdates.date_read = new Date().toISOString();
        } else if (existing.date_read) {
          normalizedUpdates.date_read = null;
        }
      }
    }
  }

  if (normalizedUpdates.shelf === 'read') {
    if (hasPageCount && normalizedUpdates.pages_completed === undefined) {
      normalizedUpdates.pages_completed = existing.page_count;
    }
    if (normalizedUpdates.date_read === undefined) {
      normalizedUpdates.date_read = new Date().toISOString();
    }
  }

  if (
    normalizedUpdates.shelf !== undefined &&
    normalizedUpdates.shelf !== 'read' &&
    normalizedUpdates.date_read === undefined &&
    existing.date_read
  ) {
    normalizedUpdates.date_read = null;
  }

  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  if (normalizedUpdates.shelf !== undefined) {
    setClauses.push(`shelf = $${paramIndex++}`);
    params.push(normalizedUpdates.shelf);
  }

  if (normalizedUpdates.pages_completed !== undefined) {
    setClauses.push(`pages_completed = $${paramIndex++}`);
    params.push(normalizedUpdates.pages_completed);
  }

  if (normalizedUpdates.date_read !== undefined) {
    setClauses.push(`date_read = $${paramIndex++}`);
    params.push(normalizedUpdates.date_read);
  }

  if (setClauses.length === 0) {
    const error = new Error('No valid fields to update.');
    error.statusCode = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  params.push(userBookId, userId);

  const result = await pool.query(
    `UPDATE user_books ub
     SET ${setClauses.join(', ')}
     FROM books b
     WHERE ub.id = $${paramIndex++} AND ub.user_id = $${paramIndex} AND b.id = ub.book_id
     RETURNING
      ub.id AS user_book_id,
      ub.shelf,
      ub.rating,
      ub.review,
      ub.pages_completed,
      ub.date_added,
      ub.date_read,
      b.page_count`,
    params
  );

  return addProgressMetadata(result.rows[0]);
}

/**
 * Remove a book from user's shelves.
 */
export async function removeUserBook(userId, userBookId) {
  const result = await pool.query(
    'DELETE FROM user_books WHERE id = $1 AND user_id = $2 RETURNING id',
    [userBookId, userId]
  );

  if (result.rows.length === 0) {
    const error = new Error('Book not found on your shelf.');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return true;
}

/**
 * Get a single user_book with full book details.
 */
export async function getUserBook(userId, userBookId) {
  const result = await pool.query(
    `SELECT
      ub.id AS user_book_id,
      ub.shelf,
      ub.rating,
      ub.review,
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
    const error = new Error('Book not found on your shelf.');
    error.statusCode = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return addProgressMetadata(result.rows[0]);
}
