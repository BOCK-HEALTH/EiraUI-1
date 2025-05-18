// backend/routes/chatRoutes.js
const express = require('express');
const pool = require('../db');
const router = express.Router();

// Add a message (user or bot), linked to a session_id
router.post('/add', async (req, res) => {
  const { email, session_id, message, sender } = req.body;

  try {
    await pool.query(
      `INSERT INTO chat_history (user_email, session_id, message, sender)
       VALUES ($1, $2, $3, $4)`,
      [email, session_id, message, sender]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all messages for a given session_id
router.get('/history', async (req, res) => {
  const { session_id } = req.query;

  try {
    const result = await pool.query(
      `SELECT message, sender, created_at
       FROM chat_history
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [session_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
