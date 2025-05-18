// sessionRoutes.js (Express routes for full sidebar functionality)
const express = require("express");
const router = express.Router();
const pool = require("../db"); // assuming you use pg Pool

// ✅ Create a new session
router.post("/create", async (req, res) => {
  const { email, title } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO chat_sessions (user_email, title) VALUES ($1, $2) RETURNING *`,
      [email, title || "Untitled Session"]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all sessions for a user
router.get("/list", async (req, res) => {
  const { email } = req.query;
  try {
    const result = await pool.query(
      `SELECT id, title, created_at FROM chat_sessions WHERE user_email = $1 ORDER BY created_at DESC`,
      [email]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Rename a session
router.put("/rename", async (req, res) => {
  const { sessionId, newTitle } = req.body;
  try {
    await pool.query(
      `UPDATE chat_sessions SET title = $1 WHERE id = $2`,
      [newTitle, sessionId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a session
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM chat_sessions WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
