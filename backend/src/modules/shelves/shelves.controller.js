import {
  getUserBooks,
  getShelfCounts,
  addBookToShelf,
  updateUserBook,
  removeUserBook,
  getUserBook,
} from "./shelves.service.js";

const VALID_SHELVES = ["want-to-read", "currently-reading", "read"];

export async function listBooksController(req, res, next) {
  try {
    const userId = req.user.id;
    const shelf = req.query.shelf || undefined;

    if (shelf && !VALID_SHELVES.includes(shelf)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SHELF",
          message: `Shelf must be one of: ${VALID_SHELVES.join(", ")}.`,
        },
      });
    }

    const books = await getUserBooks(userId, shelf);
    const shelfCounts = await getShelfCounts(userId);

    return res.status(200).json({
      success: true,
      data: books,
      shelfCounts,
    });
  } catch (error) {
    return next(error);
  }
}

export async function addBookController(req, res, next) {
  try {
    const userId = req.user.id;
    const { google_books_id, title, author, cover_url, page_count, shelf, subtitle, description, published_date, categories, average_rating } = req.body;

    // Validation
    const errors = [];
    if (!google_books_id) errors.push("google_books_id is required.");
    if (!title) errors.push("title is required.");
    if (!author) errors.push("author is required.");
    if (!shelf || !VALID_SHELVES.includes(shelf)) {
      errors.push(`shelf must be one of: ${VALID_SHELVES.join(", ")}.`);
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: errors.join(" "),
        },
      });
    }

    const bookData = {
      google_books_id,
      title,
      subtitle,
      author,
      cover_url,
      page_count,
      description,
      published_date,
      categories,
      average_rating,
    };

    const result = await addBookToShelf(userId, bookData, shelf);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateBookController(req, res, next) {
  try {
    const userId = req.user.id;
    const { userBookId } = req.params;
    const { shelf, pages_completed, date_read } = req.body;

    // Validate shelf if provided
    if (shelf && !VALID_SHELVES.includes(shelf)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_SHELF",
          message: `Shelf must be one of: ${VALID_SHELVES.join(", ")}.`,
        },
      });
    }

    const updates = {};
    if (shelf !== undefined) updates.shelf = shelf;
    if (pages_completed !== undefined) updates.pages_completed = pages_completed;
    if (date_read !== undefined) updates.date_read = date_read;

    const result = await updateUserBook(userId, userBookId, updates);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

export async function removeBookController(req, res, next) {
  try {
    const userId = req.user.id;
    const { userBookId } = req.params;

    await removeUserBook(userId, userBookId);

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
}

export async function getBookController(req, res, next) {
  try {
    const userId = req.user.id;
    const { userBookId } = req.params;

    const result = await getUserBook(userId, userBookId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}
