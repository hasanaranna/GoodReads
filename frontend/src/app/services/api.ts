import { API_BASE_URL } from "../../config";

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

async function authFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  return response;
}

// ========== Shelves API ==========

export interface ShelfBookData {
  google_books_id: string;
  title: string;
  subtitle?: string;
  authors: string[]; // CHANGED: was author: string
  cover_url?: string;
  page_count?: number;
  description?: string;
  published_date?: string;
  genres?: string[]; // CHANGED: was categories
  isbn?: string; // NEW
  language?: string; // NEW
  alternate_titles?: string[]; // NEW
  maturity_rating?: string; // NEW
  average_rating?: number;
}

export interface UserBookRow {
  user_book_id: string;
  shelf: "read_later" | "currently_reading" | "completed_reading"; // CHANGED
  rating: number;
  review: string;
  pages_completed: number;
  date_added: string;
  date_read: string | null;
  book_id: string;
  google_books_id: string;
  title: string;
  subtitle: string | null;
  authors: string[]; // CHANGED: was author
  cover_url: string | null;
  page_count: number | null;
  description: string | null;
  genres: string[] | null; // CHANGED: was categories
  isbn: string | null; // NEW
  language: string | null; // NEW
  maturity_rating: string | null; // NEW
  alternate_titles: string[] | null; // NEW
  average_rating: number | null;
  completion_percentage: number | null;
}

export interface ShelfCounts {
  all: number;
  readLater: number; // CHANGED: was wantToRead
  currentlyReading: number;
  completedReading: number; // CHANGED: was read
}

export interface ShelvesResponse {
  success: boolean;
  data: UserBookRow[];
  shelfCounts: ShelfCounts;
}

export async function fetchUserBooks(shelf?: string): Promise<ShelvesResponse> {
  const params = shelf ? `?shelf=${encodeURIComponent(shelf)}` : "";
  const response = await authFetch(`/api/shelves${params}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to fetch books.");
  }
  return payload;
}

export async function addBookToShelfAPI(
  bookData: ShelfBookData,
  shelf: string,
) {
  const response = await authFetch("/api/shelves", {
    method: "POST",
    body: JSON.stringify({ ...bookData, shelf }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to add book.");
  }
  return payload;
}

export async function updateUserBookAPI(
  userBookId: string,
  updates: {
    shelf?: string;
    pages_completed?: number;
    date_read?: string | null;
  },
) {
  const response = await authFetch(`/api/shelves/${userBookId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to update book.");
  }
  return payload;
}

export async function removeUserBookAPI(userBookId: string) {
  const response = await authFetch(`/api/shelves/${userBookId}`, {
    method: "DELETE",
  });
  if (!response.ok && response.status !== 204) {
    const payload = await response.json();
    throw new Error(payload?.error?.message || "Failed to remove book.");
  }
  return true;
}

// ========== Reviews API ==========

export async function updateReviewAPI(
  userBookId: string,
  updates: { rating?: number; review?: string },
) {
  const response = await authFetch(`/api/reviews/${userBookId}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to update review.");
  }
  return payload;
}

export async function fetchReviewAPI(userBookId: string) {
  const response = await authFetch(`/api/reviews/${userBookId}`);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to fetch review.");
  }
  return payload;
}

// ========== Public Book Reviews API ==========

export interface PublicReview {
  review_id: string; // CHANGED: was user_book_id
  rating: number;
  review: string;
  shelf: string | null;
  date_added: string;
  user_id: string;
  user_name: string;
  username: string;
  title: string;
  authors: string[]; // CHANGED: was author
  cover_url: string | null;
  google_books_id: string;
}

export async function fetchBookReviewsAPI(
  googleBooksId: string,
): Promise<{ success: boolean; data: PublicReview[]; total: number }> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/book/${encodeURIComponent(googleBooksId)}`,
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Failed to fetch book reviews.");
  }
  return payload;
}
