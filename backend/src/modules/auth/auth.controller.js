import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";

function calcAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, date_of_birth } = req.body;

    const errors = [];
    if (!name || !username || !email || !date_of_birth) {
      errors.push({
        field: "general",
        message: "Name, username, email, and date of birth are required.",
      });
    }
    if (!password || password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters.",
      });
    }
    if (errors.length > 0) {
      return res
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "One or more fields failed validation.",
            status: 400,
            details: errors,
          },
        });
    }

    const userExists = await pool.query(
      "SELECT username, email FROM users WHERE username = $1 OR email = $2",
      [username, email],
    );
    if (userExists.rows.length > 0) {
      const conflictField =
        userExists.rows[0].username === username ? "Username" : "Email";
      return res
        .status(409)
        .json({
          error: {
            code: "CONFLICT",
            message: `${conflictField} already taken.`,
            status: 409,
          },
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const is_mature = calcAge(date_of_birth) >= 18;

    const newUser = await pool.query(
      "INSERT INTO users (name, username, email, password, date_of_birth) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, date_of_birth, created_at",
      [name, username, email, hashedPassword, date_of_birth],
    );
    const user = newUser.rows[0];

    // Create Library for user
    const library = await pool.query(
      "INSERT INTO libraries (user_id) VALUES ($1) RETURNING id",
      [user.id],
    );
    const libraryId = library.rows[0].id;

    // Create 3 Bookshelves for the Library
    await pool.query(
      `INSERT INTO bookshelves (library_id, shelf_type) VALUES ($1, 'currently_reading'), ($1, 'completed_reading'), ($1, 'read_later')`,
      [libraryId],
    );

    // Log activity
    await pool.query(
      "INSERT INTO activities (action, by_user_id) VALUES ($1, $2)",
      ["Joined GoodReads", user.id],
    );

    const accessToken = jwt.sign({ id: user.id }, env.jwtAccessSecret, {
      expiresIn: 3600,
    });
    const refreshToken = jwt.sign({ id: user.id }, env.jwtRefreshSecret, {
      expiresIn: "7d",
    });
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    return res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : null,
        is_mature,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);
    const user = result.rows[0];
    if (!user) {
      return res
        .status(401)
        .json({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid username or password.",
            status: 401,
          },
        });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid username or password.",
            status: 401,
          },
        });
    }
    const is_mature = calcAge(user.date_of_birth) >= 18;

    const accessToken = jwt.sign({ id: user.id }, env.jwtAccessSecret, {
      expiresIn: 3600,
    });
    const refreshToken = jwt.sign({ id: user.id }, env.jwtRefreshSecret, {
      expiresIn: "7d",
    });
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    // Log activity
    await pool.query(
      "INSERT INTO activities (action, by_user_id) VALUES ($1, $2)",
      ["Logged in", user.id],
    );

    return res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : null,
        is_mature,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [
      userId,
    ]);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res
        .status(401)
        .json({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired refresh token.",
            status: 401,
          },
        });
    }
    let decoded;
    try {
      decoded = jwt.verify(refresh_token, env.jwtRefreshSecret);
    } catch (err) {
      return res
        .status(401)
        .json({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired refresh token.",
            status: 401,
          },
        });
    }
    const result = await pool.query(
      "SELECT * FROM users WHERE id = $1 AND refresh_token = $2",
      [decoded.id, refresh_token],
    );
    const user = result.rows[0];
    if (!user) {
      return res
        .status(401)
        .json({
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired refresh token.",
            status: 401,
          },
        });
    }
    const is_mature = calcAge(user.date_of_birth) >= 18;
    const newAccessToken = jwt.sign({ id: user.id }, env.jwtAccessSecret, {
      expiresIn: 3600,
    });
    const newRefreshToken = jwt.sign({ id: user.id }, env.jwtRefreshSecret, {
      expiresIn: "7d",
    });
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      newRefreshToken,
      user.id,
    ]);
    return res.status(200).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : null,
        is_mature,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};
