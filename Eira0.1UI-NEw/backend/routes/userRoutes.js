const express = require('express');
const pool = require('../db');
const router = express.Router();

router.post('/get-or-create', async (req, res) => {
  const { email, name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING *`,
      [email, name]
    );
    res.json(result.rows[0] || { email, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
