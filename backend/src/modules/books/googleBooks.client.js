import axios from 'axios';

import { env } from '../../config/env.js';

const googleBooksHttp = axios.create({
  baseURL: env.googleBooksBaseUrl,
  timeout: 10000
});

export async function searchGoogleBooks({
  query,
  orderBy,
  startIndex,
  maxResults
}) {
  const params = {
    q: query,
    orderBy,
    startIndex,
    maxResults
  };

  if (env.googleBooksApiKey) {
    params.key = env.googleBooksApiKey;
  }

  try {
    const { data } = await googleBooksHttp.get('/volumes', { params });
    return data;
  } catch (error) {
    const wrappedError = new Error(
      'Failed to fetch data from Google Books API.'
    );
    wrappedError.statusCode = 502;
    wrappedError.code = 'UPSTREAM_GOOGLE_BOOKS_ERROR';
    wrappedError.details = {
      status: error?.response?.status || null,
      message: error?.response?.data?.error?.message || error.message
    };
    throw wrappedError;
  }
}
