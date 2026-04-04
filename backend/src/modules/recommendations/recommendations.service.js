import { pool } from "../../config/db.js";

// helpers 

/** Normalise a raw score array to [0, 1] */
function normalise(items, key) {
    const max = Math.max(...items.map((i) => i[key]), 0.0001);
    return items.map((i) => ({ ...i, [key]: i[key] / max }));
}

/** Deduplicate by book_id, keeping the highest score */
function dedupe(items) {
    const map = new Map();
    for (const item of items) {
        const existing = map.get(item.book_id);
        if (!existing || item.score > existing.score) map.set(item.book_id, item);
    }
    return [...map.values()];
}

/** Format a raw DB book row for the API response */
function formatBook(row, score, reason) {
    return {
        id: row.id,
        googleBooksId: row.google_books_id,
        title: row.title,
        subtitle: row.subtitle || null,
        author: row.author,
        coverUrl: row.cover_url || null,
        description: row.description || null,
        pageCount: row.page_count || null,
        publishedDate: row.published_date || null,
        categories: row.categories || [],
        averageRating: parseFloat(row.average_rating) || 0,
        score: parseFloat(score.toFixed(4)),
        reason,
    };
}

// 1. COLLABORATIVE FILTERING (weight: 50%)
// Find users who rated the same books as the target user, compute cosine-like
// similarity, then surface their highly-rated unread books.
// This is the "people like you" signal. The SQL logic in three stages:
// **Stage 1 — find your rating vector.
//      Pull every (book_id, rating) pair where you've given a score.
//      This is your taste fingerprint.
// **Stage 2 — find similar users.
//      Look at every other user who has rated at least 2 of the same books you have. 
//      For each of them, compute cosine similarity against your ratings:
//
//      similarity = (your_ratings · their_ratings) / (|your_ratings| × |their_ratings|)
//
//      Cosine similarity gives a score between 0 and 1. 
//      A user who rated all the same books the same way as you scores 1.0. 
//      Someone who rated them oppositely scores near 0. The query keeps the top 30 most similar users.
//
// **Stage 3 — score candidate books.
//      For every book those similar users rated ≥ 4 that you haven't read,
//      compute a weighted average score:
//
//      cf_score = Σ(similarity × their_rating) / Σ|similarity|
//
//      Books that many highly-similar users loved rise to the top. 
//      A book loved by one very-similar user can outscore a book mildly liked by ten weakly-similar users.

async function getCollaborativeRecs(userId, limit = 20) {
    const query = `
    WITH
    -- Books the target user has rated (rating > 0)
    target_ratings AS (
      SELECT book_id, rating
      FROM   user_books
      WHERE  user_id = $1 AND rating > 0
    ),

    -- Users who share at least 2 rated books with the target user
    -- similarity = dot-product / (norm_a * norm_b)  →  cosine similarity
    similar_users AS (
      SELECT
        ub.user_id,
        SUM(ub.rating::FLOAT * tr.rating::FLOAT)
          / (
              SQRT(SUM(ub.rating::FLOAT ^ 2)) *
              SQRT(SUM(tr.rating::FLOAT ^ 2))
            ) AS similarity
      FROM   user_books ub
      JOIN   target_ratings tr ON tr.book_id = ub.book_id
      WHERE  ub.user_id <> $1
        AND  ub.rating  > 0
      GROUP  BY ub.user_id
      HAVING COUNT(*) >= 2
      ORDER  BY similarity DESC
      LIMIT  30
    ),

    -- Books those similar users rated highly that target user has NOT touched
    candidate_scores AS (
      SELECT
        ub.book_id,
        SUM(su.similarity * ub.rating::FLOAT) /
          NULLIF(SUM(ABS(su.similarity)), 0)     AS cf_score,
        COUNT(DISTINCT ub.user_id)               AS supporter_count
      FROM   user_books ub
      JOIN   similar_users su ON su.user_id = ub.user_id
      WHERE  ub.book_id NOT IN (SELECT book_id FROM user_books WHERE user_id = $1)
        AND  ub.rating >= 4
      GROUP  BY ub.book_id
      ORDER  BY cf_score DESC
      LIMIT  $2
    )

    SELECT
      b.*,
      cs.cf_score AS raw_score
    FROM   candidate_scores cs
    JOIN   books b ON b.id = cs.book_id
    ORDER  BY cs.cf_score DESC;
  `;

    const { rows } = await pool.query(query, [userId, limit]);
    const normalised = normalise(
        rows.map((r) => ({ book_id: r.id, raw_score: parseFloat(r.raw_score), row: r })),
        "raw_score"
    );
    return normalised.map(({ row, raw_score }) => formatBook(row, raw_score, "cf"));
}

// 2. Genre Match (30% weight) 
//  Finds your top 10 categories from books you rated ≥ 4, weighted by how frequently they appear
//  Scores unread books by how much their categories overlap with yours,
//  with a small popularity boost (average_rating × 0.3)
//  **Step 1 — build your genre profile.
//       Unnest the categories array for every book you've rated ≥ 4 and count frequency.
//       If you've loved 6 fantasy books and 2 historical fiction books,
//       "Fantasy" gets weight 6, "Historical Fiction" gets weight 2. 
//       The top 10 categories are kept.

// **Step 2 — score every unread book.** For each candidate book the user hasn't touched:
// 
//         Score = ∑Matched Category Frequencies
//                 + (Average Rating×0.3) (small popularity nudge)

async function getGenreRecs(userId, limit = 20) {
    const query = `
    WITH
    -- Frequency-weighted favourite categories from the user's highly-rated books
    fav_categories AS (
      SELECT UNNEST(b.categories) AS category, COUNT(*) AS freq
      FROM   user_books ub
      JOIN   books b ON b.id = ub.book_id
      WHERE  ub.user_id = $1 AND ub.rating >= 4
      GROUP  BY category
      ORDER  BY freq DESC
      LIMIT  10
    ),

    candidates AS (
      SELECT
        b.id AS book_id,
        (
          SELECT COALESCE(SUM(fc.freq), 0)
          FROM   fav_categories fc
          WHERE  fc.category = ANY(b.categories)
        )::FLOAT                              AS category_score,
        COALESCE(b.average_rating, 0)::FLOAT  AS popularity_boost
      FROM books b
      WHERE b.id NOT IN (SELECT book_id FROM user_books WHERE user_id = $1)
        AND EXISTS (
          SELECT 1 FROM fav_categories fc WHERE fc.category = ANY(b.categories)
        )
    )

    SELECT
      b.*,
      (c.category_score + c.popularity_boost * 0.3) AS raw_score
    FROM   candidates c
    JOIN   books b ON b.id = c.book_id
    ORDER  BY raw_score DESC
    LIMIT  $2;
  `;

    const { rows } = await pool.query(query, [userId, limit]);
    const normalised = normalise(
        rows.map((r) => ({ book_id: r.id, raw_score: parseFloat(r.raw_score), row: r })),
        "raw_score"
    );
    return normalised.map(({ row, raw_score }) => formatBook(row, raw_score, "genre"));
}

// Engine 3 — Author Match (weight: 20%)
// The "more from authors you love" signal. Cleanly separated from genre so the two don't blur.
// **Step 1 — build your author profile.
//      For every author whose books you've rated ≥ 3, compute your personal average rating for that author. 
//      Keep the top 10 authors.

// **Step 2 — score unread books by those authors:
//
//      author_score = your_avg_rating_for_author × book.average_rating
// 
//      Multiplying the two together means both dimensions matter. 
//      An author you rate 5/5 who wrote a poorly-regarded book still gets pulled down by that book's quality. 
//      A book you'd probably love from an author you only mildly like also gets appropriately discounted. The top 20 are returned.


async function getAuthorRecs(userId, limit = 20) {
    const query = `
    WITH
    -- Authors the user has rated, with their personal avg rating per author
    fav_authors AS (
      SELECT
        b.author,
        AVG(ub.rating)::FLOAT AS user_avg_rating,
        COUNT(*)              AS rated_count
      FROM   user_books ub
      JOIN   books b ON b.id = ub.book_id
      WHERE  ub.user_id = $1 AND ub.rating >= 3
      GROUP  BY b.author
      ORDER  BY user_avg_rating DESC, rated_count DESC
      LIMIT  10
    )

    SELECT
      b.*,
      (fa.user_avg_rating * COALESCE(b.average_rating, 3.0)::FLOAT) AS raw_score
    FROM   fav_authors fa
    JOIN   books b ON b.author = fa.author
    WHERE  b.id NOT IN (SELECT book_id FROM user_books WHERE user_id = $1)
    ORDER  BY raw_score DESC
    LIMIT  $2;
  `;

    const { rows } = await pool.query(query, [userId, limit]);
    const normalised = normalise(
        rows.map((r) => ({ book_id: r.id, raw_score: parseFloat(r.raw_score), row: r })),
        "raw_score"
    );
    return normalised.map(({ row, raw_score }) => formatBook(row, raw_score, "author"));
}

// 4. Cold Start Check
//  The very first thing the service does is count how many books you've rated (rating > 0) in user_books.
//  If it's fewer than 3, the entire personalisation stack is skipped and you get a cold-start fallback
//  globally popular books ranked by a Bayesian average. The frontend shows the yellow rate more books banner in this case.
//  Once you have 3+ ratings, all three engines fire inn parallel via Promise.all, then their results get blended.
//  Weighted Score=(Average Rating×Number of Ratings)​/(Number of Ratings+Confidence Constant)

async function getColdStartRecs(userId, limit = 20) {
    const query = `
    SELECT b.*,
      (b.average_rating * COUNT(ub.id)::FLOAT / NULLIF(COUNT(ub.id) + 5, 0))
        AS raw_score
    FROM   books b
    LEFT JOIN user_books ub ON ub.book_id = b.id AND ub.rating > 0
    WHERE  b.id NOT IN (SELECT book_id FROM user_books WHERE user_id = $1)
      AND  b.average_rating IS NOT NULL
    GROUP  BY b.id
    ORDER  BY raw_score DESC
    LIMIT  $2;
  `;

    const { rows } = await pool.query(query, [userId, limit]);
    // Cold-start books are tagged "cf" so they still render on the page
    return rows.map((r) => formatBook(r, parseFloat(r.raw_score) || 0, "cf"));
}

// MAIN EXPORT 

/**
 * getRecommendations
 * ------------------
 * @param {string} userId  - UUID of the requesting user
 * @param {object} options
 *   @param {number}        options.page    - 1-indexed page
 *   @param {number}        options.perPage - results per page
 *   @param {string|null}   options.reason  - filter: 'cf' | 'genre' | 'author' | null
 * @returns {{ books: BookResult[], total: number, hasMore: boolean, isColdStart: boolean }}
 */
async function getRecommendations(userId, { page = 1, perPage = 10, reason = null } = {}) {
    // Check how many ratings the user has (cold-start guard)
    const { rows: ratingCount } = await pool.query(
        `SELECT COUNT(*) AS cnt FROM user_books WHERE user_id = $1 AND rating > 0`,
        [userId]
    );
    const totalRatings = parseInt(ratingCount[0].cnt, 10);
    const isColdStart = totalRatings < 5;

    let allBooks = [];

    if (isColdStart) {
        allBooks = await getColdStartRecs(userId, 40);
    } else {
        // Run all three engines in parallel
        const [cfBooks, genreBooks, authorBooks] = await Promise.all([
            getCollaborativeRecs(userId, 25),
            getGenreRecs(userId, 25),
            getAuthorRecs(userId, 20),
        ]);

        //  Hybrid blend: weighted score per reason 
        const WEIGHTS = { cf: 0.50, genre: 0.30, author: 0.20 };

        const weighted = [
            ...cfBooks.map((b) => ({ ...b, score: b.score * WEIGHTS.cf })),
            ...genreBooks.map((b) => ({ ...b, score: b.score * WEIGHTS.genre })),
            ...authorBooks.map((b) => ({ ...b, score: b.score * WEIGHTS.author })),
        ];

        // Deduplicate: keep highest blended score per book
        allBooks = dedupe(
            weighted.map((b) => ({ ...b, book_id: b.id }))
        ).sort((a, b) => b.score - a.score);
    }

    // Filter by reason if requested 
    const filtered = reason ? allBooks.filter((b) => b.reason === reason) : allBooks;

    // Paginate 
    const total = filtered.length;
    const start = (page - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);
    const hasMore = start + perPage < total;

    return { books: slice, total, hasMore, isColdStart };
}

export { getRecommendations };