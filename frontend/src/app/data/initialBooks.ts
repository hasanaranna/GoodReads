export interface Book {
  id: string; // user_book_id (bookshelf_books.id)
  bookId: string; // books.id
  googleBooksId: string; // Google Books ID
  title: string;
  subtitle?: string;
  authors: string[]; // CHANGED: was author: string
  coverUrl: string;
  rating: number; // 0-5 (double)
  shelf: "read_later" | "currently_reading" | "completed_reading"; // CHANGED
  dateAdded: string;
  dateRead?: string;
  review?: string;
  pagesCompleted?: number;
  totalPages?: number;
  completionPercentage?: number;
  description?: string;
  isbn?: string; // NEW
  language?: string; // NEW
  genres?: string[]; // NEW (was categories)
  alternateTitles?: string[]; // NEW
  maturityRating?: string; // NEW
}
