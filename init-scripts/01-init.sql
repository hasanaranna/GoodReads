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