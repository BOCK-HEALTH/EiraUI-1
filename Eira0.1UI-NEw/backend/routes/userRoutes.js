const express = require('express');
const pool = require('../db');
const router = express.Router();

// Update user name route
router.post('/update-name', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Using pool.query for PostgreSQL
    const query = 'UPDATE users SET name = $1 WHERE email = $2 RETURNING *';
    const result = await pool.query(query, [name, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Name updated successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error updating user name:', error);
    res.status(500).json({ error: 'Failed to update name' });
  }
});

// Get or create user route
router.post('/get-or-create', async (req, res) => {
  const { email, name } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = $2
       RETURNING *`,
      [email, name]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error in get-or-create:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;