import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { Login } from "./pages/Login";
import { MyBooks } from "./pages/MyBooks";
import { EditReview } from "./pages/EditReview";
import { InputProgress } from "./pages/InputProgress";
import { Recommendation } from "./pages/Recommendation";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      {
        index: true,
        Component: Login,
      },
      {
        Component: ProtectedRoute,
        children: [
          {
            path: "mybooks",
            Component: MyBooks,
          },
          {
            path: "mybooks/shelf/:shelfId",
            Component: MyBooks,
          },
          {
            path: "book/:bookId/review",
            Component: EditReview,
          },
          {
            path: "book/:bookId/progress",
            Component: InputProgress,
          },
          {
            path: "recommendations",
            Component: Recommendation,
          },
        ],
      },
    ],
  },
]);
