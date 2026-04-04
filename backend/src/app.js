import cors from 'cors';
import express from 'express';

import {
  errorMiddleware,
  notFoundMiddleware
} from './middleware/error.middleware.js';
import { authenticate } from './middleware/auth.middleware.js';
import booksRouter from './modules/books/books.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import shelvesRouter from './modules/shelves/shelves.routes.js';
import { getBookReviewsController } from './modules/reviews/reviews.controller.js';
import reviewsRouter from './modules/reviews/reviews.routes.js';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: 'Backend is running.' });
});

app.use('/api/books', booksRouter);
app.use('/api/auth', authRoutes);
app.use('/api/shelves', authenticate, shelvesRouter);

// Public reviews route (no auth) — must be registered BEFORE the protected reviews routes
app.get('/api/reviews/book/:googleBooksId', getBookReviewsController);

// Protected reviews routes (auth required)
app.use('/api/reviews', authenticate, reviewsRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
