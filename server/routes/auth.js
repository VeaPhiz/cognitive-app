const express = require("express");
const router = express.Router();
const { register, login, googleAuth } = require("../controllers/authController");

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google  -- accept Google ID token from client
router.post("/google", googleAuth);

module.exports = router;