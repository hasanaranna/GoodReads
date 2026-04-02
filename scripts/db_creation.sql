CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, 
  password VARCHAR(255) NOT NULL,
  dob DATE,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stores book metadata (cached from Google Books API)
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_books_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500),
  author VARCHAR(500) NOT NULL,
  cover_url TEXT,
  page_count INTEGER,
  description TEXT,
  published_date VARCHAR(20),
  categories TEXT[],
  average_rating NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Junction table: which user has which book on which shelf
CREATE TABLE user_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  shelf VARCHAR(20) NOT NULL CHECK (shelf IN ('want-to-read', 'currently-reading', 'read')),
  rating SMALLINT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review TEXT DEFAULT '',
  pages_completed INTEGER DEFAULT 0,
  date_added TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  date_read TIMESTAMPTZ,
  UNIQUE(user_id, book_id)
);

-- Indexes for performance
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_book_id ON user_books(book_id);
CREATE INDEX idx_books_google_id ON books(google_books_id);