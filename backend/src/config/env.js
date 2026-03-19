import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 8080;
const DEFAULT_GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1";

const parsedPort = Number.parseInt(process.env.PORT || "", 10);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number.isNaN(parsedPort) ? DEFAULT_PORT : parsedPort,
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY || "",
  googleBooksBaseUrl:
    process.env.GOOGLE_BOOKS_BASE_URL || DEFAULT_GOOGLE_BOOKS_BASE_URL,
};
