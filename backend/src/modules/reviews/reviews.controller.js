import { updateReview, getReview, getBookReviews } from "./reviews.service.js";

export async function updateReviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const { userBookId } = req.params;
    const { rating, review } = req.body;
    const result = await updateReview(userId, userBookId, { rating, review });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

export async function getReviewController(req, res, next) {
  try {
    const userId = req.user.id;
    const { userBookId } = req.params;
    const result = await getReview(userId, userBookId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
}

export async function getBookReviewsController(req, res, next) {
  try {
    const { googleBooksId } = req.params;
    if (!googleBooksId) {
      return res
        .status(400)
        .json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "googleBooksId parameter is required.",
          },
        });
    }
    const reviews = await getBookReviews(googleBooksId);
    return res
      .status(200)
      .json({ success: true, data: reviews, total: reviews.length });
  } catch (error) {
    return next(error);
  }
}
