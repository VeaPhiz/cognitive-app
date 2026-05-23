const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const pool = require("../config/db");

const SALT_ROUNDS = 12;

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ── Register ─────────────────────────────────────────────────────────────────

const register = async (req, res) => {
  const { username, email, password } = req.body;

  // 1. Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters." });
  }

  try {
    // 2. Check for duplicate email or username
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1",
      [email, username]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: "Email or username already in use." });
    }

    // 3. Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Insert user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, password_hash]
    );

    // 5. Return token immediately (auto-login after register)
    const newUser = { id: result.insertId, username, email };
    const token = generateToken(newUser);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: newUser,
    });
  } catch (err) {
    console.error("[register]", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
  const { email, password } = req.body;

  // 1. Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    // 2. Look up user
    const [rows] = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (rows.length === 0) {
      // Deliberately vague to prevent user enumeration
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // 4. Generate and return token
    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ── Google OAuth (ID token verification) ───────────────────────────────────
const googleAuth = async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) return res.status(400).json({ message: "id_token is required." });

  try {
    // Verify token with Google's tokeninfo endpoint
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`
    );
    const payload = response.data;

    // Basic checks
    const email = payload.email;
    const email_verified = payload.email_verified === "true" || payload.email_verified === true;
    if (!email || !email_verified) {
      return res.status(400).json({ message: "Google account email not verified." });
    }

    // Find or create user by email
    const [rows] = await pool.query(
      "SELECT id, username, email FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    let user;
    if (rows.length === 0) {
      // Create a username from the name or email local-part
      const base = (payload.name || email.split("@")[0]).replace(/\s+/g, "").slice(0, 32);
      let username = base || `user${Date.now()}`;
      let suffix = 0;
      while (true) {
        const [ex] = await pool.query("SELECT id FROM users WHERE username = ? LIMIT 1", [username]);
        if (ex.length === 0) break;
        suffix += 1;
        username = `${base}${suffix}`;
      }

      const [result] = await pool.query(
        "INSERT INTO users (username, email) VALUES (?, ?)",
        [username, email]
      );
      user = { id: result.insertId, username, email };
    } else {
      user = rows[0];
    }

    const token = generateToken(user);
    return res.status(200).json({ message: "Login successful.", token, user });
  } catch (err) {
    console.error("[googleAuth]", err?.response?.data || err);
    return res.status(500).json({ message: "Google authentication failed." });
  }
};

module.exports = { register, login, googleAuth };