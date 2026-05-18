const express = require("express");
const router  = express.Router();
const verifyToken              = require("../middleware/authMiddleware");
const { saveScore, getLeaderboard } = require("../controllers/scoresController");

// POST /api/scores/save  — must be logged in
router.post("/save", verifyToken, saveScore);

// GET /api/scores/:game_slug/leaderboard  — public
router.get("/:game_slug/leaderboard", getLeaderboard);

module.exports = router;