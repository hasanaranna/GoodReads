import express from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { getRecommendationsHandler } from './recommendations.controller.js';

const router = express.Router();

// GET /api/recommendations?page=1&perPage=10&reason=cf
router.get('/', authenticate, getRecommendationsHandler);

export default router;