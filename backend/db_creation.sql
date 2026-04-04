-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Books table (per UML: authors[], isbn, genres, language, alternate_titles, maturity_rating)
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_books_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  authors TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  isbn VARCHAR(50),
  genres TEXT[],
  publish_date VARCHAR(20),
  page_count INTEGER,
  language VARCHAR(50),
  alternate_titles TEXT[],
  maturity_rating VARCHAR(100),
  cover_url TEXT,
  average_rating NUMERIC(4,2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Libraries (one per user, per UML User has 1 Library)
CREATE TABLE libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Bookshelves (3 per library per UML: currently_reading, completed_reading, read_later)
CREATE TABLE bookshelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  shelf_type VARCHAR(30) NOT NULL CHECK (shelf_type IN ('currently_reading', 'completed_reading', 'read_later')),
  is_public BOOLEAN DEFAULT FALSE,
  UNIQUE(library_id, shelf_type)
);

-- Bookshelf books junction (Bookshelf content: Book[])
CREATE TABLE bookshelf_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookshelf_id UUID NOT NULL REFERENCES bookshelves(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  date_added TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);

-- Reading progress (per UML: ReadingProgress has book + currPage)
CREATE TABLE reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  curr_page INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id)
);

-- Reviews (per UML: Review has reviewComment, rating double, aboutBook, byUser)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_comment TEXT DEFAULT '',
  rating NUMERIC(4,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  about_book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(about_book_id, by_user_id)
);

-- Activities (per UML: Activity has action, timestamp, byUser)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(1000) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_libraries_user_id ON libraries(user_id);
CREATE INDEX idx_bookshelves_library_id ON bookshelves(library_id);
CREATE INDEX idx_bookshelf_books_bookshelf_id ON bookshelf_books(bookshelf_id);
CREATE INDEX idx_bookshelf_books_book_id ON bookshelf_books(book_id);
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX idx_reading_progress_book_id ON reading_progress(book_id);
CREATE INDEX idx_reviews_about_book_id ON reviews(about_book_id);
CREATE INDEX idx_reviews_by_user_id ON reviews(by_user_id);
CREATE INDEX idx_activities_by_user_id ON activities(by_user_id);
CREATE INDEX idx_books_google_id ON books(google_books_id);
