import { getRecommendations } from './recommendations.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export async function getRecommendationsHandler(req, res) {
  try {
    const userId = req.user.id;                            // set by auth.middleware
    const page = Math.max(1, parseInt(req.query.page ?? 1, 10));
    const perPage = Math.min(20, parseInt(req.query.perPage ?? 10, 10));
    const reason = req.query.reason ?? null;               // 'cf'|'genre'|'author'|null

    const validReasons = ['cf', 'genre', 'author'];
    if (reason && !validReasons.includes(reason)) {
      return res.status(400).json(
        errorResponse('Invalid reason filter. Use: cf, genre, or author')
      );
    }

    const result = await getRecommendations(userId, { page, perPage, reason });

    return res.status(200).json(
      successResponse('Recommendations fetched successfully', {
        books: result.books,
        total: result.total,
        hasMore: result.hasMore,
        page,
        perPage,
        isColdStart: result.isColdStart
      })
    );
  } catch (err) {
    console.error('[Recommendations] Error:', err);
    return res.status(500).json(errorResponse('Failed to fetch recommendations'));
  }
}