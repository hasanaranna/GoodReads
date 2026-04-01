import { Router } from "express";
import {
  updateReviewController,
  getReviewController,
} from "./reviews.controller.js";

const reviewsRouter = Router();

// These routes are all protected (auth middleware applied in app.js)
reviewsRouter.get("/:userBookId", getReviewController);
reviewsRouter.put("/:userBookId", updateReviewController);

export default reviewsRouter;
