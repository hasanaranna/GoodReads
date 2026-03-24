import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";
import { env } from "../../config/env.js";

export const register = async (req, res, next) => {
  try {
    const { name, username, email, password, date_of_birth } = req.body;

    const errors = [];
    if (!password || password.length < 8) {
      errors.push({ field: "password", message: "Password must be at least 8 characters." });
    }
    if (!name || !username || !email || !date_of_birth) {
       errors.push({ field: "general", message: "Name, username, email, and date of birth are required." });
    }
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "One or more fields failed validation.",
          status: 400,
          details: errors,
        }
      });
    }

    const userExists = await pool.query(
      "SELECT username, email FROM users WHERE username = $1 OR email = $2", 
      [username, email]
    );
    
    if (userExists.rows.length > 0) {
      const conflictField = userExists.rows[0].username === username ? "Username" : "Email";
      return res.status(409).json({
        error: {
          code: "CONFLICT",
          message: `${conflictField} already taken.`,
          status: 409
        }
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    const is_mature = age >= 18;

    const newUser = await pool.query(
      "INSERT INTO users (name, username, email, password, dob) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, dob, created_at",
      [name, username, email, hashedPassword, date_of_birth]
    );

    const user = newUser.rows[0];

    const accessToken = jwt.sign({ id: user.id }, env.jwtAccessSecret, { expiresIn: 3600 });
    const refreshToken = jwt.sign({ id: user.id }, env.jwtRefreshSecret, { expiresIn: "7d" });

    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

    return res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.dob.toISOString().split('T')[0], 
        is_mature: is_mature,
        created_at: user.created_at
      }
    });

  } catch (error) {
    next(error); 
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid username or password.",
          status: 401
        }
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid username or password.",
          status: 401
        }
      });
    }
    const birthDate = new Date(user.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    const is_mature = age >= 18;

    const accessToken = jwt.sign({ id: user.id }, env.jwtAccessSecret, { expiresIn: 3600 });
    const refreshToken = jwt.sign({ id: user.id }, env.jwtRefreshSecret, { expiresIn: "7d" });

    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [refreshToken, user.id]);

    return res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 3600,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        date_of_birth: user.dob.toISOString().split('T')[0], 
        is_mature: is_mature,
        created_at: user.created_at
      }
    });

  } catch (error) {
    next(error); 
  }
};