const pool = require("../config/db");

// POST /api/scores/save  (protected)
const saveScore = async (req, res) => {
  const { game_slug, value } = req.body;
  const user_id = req.user.id;

  if (!game_slug || value === undefined || value === null) {
    return res.status(400).json({ message: "game_slug and value are required." });
  }
  if (typeof value !== "number" || value <= 0) {
    return res.status(400).json({ message: "Value must be a positive number." });
  }

  try {
    // Resolve game_id from slug
    const [games] = await pool.query(
      "SELECT id FROM games WHERE slug = ? LIMIT 1",
      [game_slug]
    );
    if (games.length === 0) {
      return res.status(404).json({ message: "Game not found." });
    }
    const game_id = games[0].id;

    // Insert score
    const [result] = await pool.query(
      "INSERT INTO scores (user_id, game_id, value) VALUES (?, ?, ?)",
      [user_id, game_id, value]
    );

    return res.status(201).json({
      message: "Score saved.",
      score: { id: result.insertId, game_slug, value, user_id },
    });
  } catch (err) {
    console.error("[saveScore]", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/scores/:game_slug/leaderboard  (public)
const getLeaderboard = async (req, res) => {
  const { game_slug } = req.params;

  try {
    // Resolve game
    const [games] = await pool.query(
      "SELECT id, unit FROM games WHERE slug = ? LIMIT 1",
      [game_slug]
    );
    if (games.length === 0) {
      return res.status(404).json({ message: "Game not found." });
    }
    const { id: game_id, unit } = games[0];

    // Explicit scoring rules per game.
    // This avoids guessing from units and keeps leaderboard behavior predictable.
    const scoreRules = {
      "reaction-time": { aggregate: "MIN", order: "ASC" },
      "memory-matrix": { aggregate: "MAX", order: "DESC" },
    };

    const { aggregate, order } = scoreRules[game_slug] ??
      (unit === "ms"
        ? { aggregate: "MIN", order: "ASC" }
        : { aggregate: "MAX", order: "DESC" });

    const [rows] = await pool.query(
      `SELECT
         u.username,
         ${aggregate}(s.value) AS best_score,
         COUNT(s.id)       AS attempts,
         MAX(s.recorded_at) AS last_played
       FROM scores s
       JOIN users u ON u.id = s.user_id
       WHERE s.game_id = ?
       GROUP BY s.user_id, u.username
       ORDER BY best_score ${order}
       LIMIT 10`,
      [game_id]
    );

    return res.status(200).json({ leaderboard: rows, unit });
  } catch (err) {
    console.error("[getLeaderboard]", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// GET /api/scores/:game_slug/my-history  (protected)
const getMyHistory = async (req, res) => {
  const { game_slug } = req.params;
  const user_id = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const [games] = await pool.query(
      "SELECT id FROM games WHERE slug = ? LIMIT 1", [game_slug]
    );
    if (games.length === 0)
      return res.status(404).json({ message: "Game not found." });

    const [rows] = await pool.query(
      `SELECT value, recorded_at FROM scores
       WHERE user_id = ? AND game_id = ?
       ORDER BY recorded_at DESC LIMIT ?`,
      [user_id, games[0].id, limit]
    );
    return res.status(200).json({ scores: rows });
  } catch (err) {
    console.error("[getMyHistory]", err);
    return res.status(500).json({ message: "Server error." });
  }
};

module.exports = { saveScore, getLeaderboard, getMyHistory };
