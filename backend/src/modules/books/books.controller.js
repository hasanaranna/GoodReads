import { searchBooks } from './books.service.js';

export async function searchBooksController(req, res, next) {
  try {
    const searchParams = req.searchQuery || req.query;
    const result = await searchBooks(searchParams);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
