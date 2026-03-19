import { Router } from "express";

import { validateSearchQuery } from "../../middleware/validateSearch.middleware.js";
import { searchBooksController } from "./books.controller.js";

const booksRouter = Router();

booksRouter.get("/search", validateSearchQuery, searchBooksController);

export default booksRouter;
