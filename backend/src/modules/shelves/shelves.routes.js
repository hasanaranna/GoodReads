import { Router } from 'express';
import {
  listBooksController,
  addBookController,
  updateBookController,
  removeBookController,
  getBookController
} from './shelves.controller.js';

const shelvesRouter = Router();

shelvesRouter.get('/', listBooksController);
shelvesRouter.post('/', addBookController);
shelvesRouter.get('/:userBookId', getBookController);
shelvesRouter.put('/:userBookId', updateBookController);
shelvesRouter.delete('/:userBookId', removeBookController);

export default shelvesRouter;
