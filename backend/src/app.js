import cors from "cors";
import express from "express";

import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware.js";
import booksRouter from "./modules/books/books.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Backend is running." });
});

app.use("/api/books", booksRouter);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
