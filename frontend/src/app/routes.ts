import { createBrowserRouter, redirect } from 'react-router';
import { Root } from './pages/Root';
import { MyBooks } from './pages/MyBooks';
import { EditReview } from './pages/EditReview';
import { InputProgress } from './pages/InputProgress';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        loader: () => redirect('/mybooks'),
      },
      {
        path: 'mybooks',
        Component: MyBooks,
      },
      {
        path: 'mybooks/shelf/:shelfId',
        Component: MyBooks,
      },
      {
        path: 'book/:bookId/review',
        Component: EditReview,
      },
      {
        path: 'book/:bookId/progress',
        Component: InputProgress,
      },
    ],
  },
]);
