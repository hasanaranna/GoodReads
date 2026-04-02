export interface Book {
  id: string;            // user_book_id from backend
  bookId: string;        // internal book UUID
  googleBooksId: string; // Google Books ID
  title: string;
  subtitle?: string;
  titleLocal?: string;
  author: string;
  coverUrl: string;
  rating: number; // 0-5
  shelf: 'read' | 'currently-reading' | 'want-to-read';
  dateAdded: string;
  dateRead?: string;
  review?: string;
  pagesCompleted?: number;
  totalPages?: number;
  completionPercentage?: number;
  description?: string;
}
