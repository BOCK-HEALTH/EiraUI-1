const express = require("express")
const pool = require("../db")
const router = express.Router()

// Update user name route
router.post("/update-name", async (req, res) => {
  try {
    const { email, name } = req.body

    if (!email || !name) {
      return res.status(400).json({ error: "Email and name are required" })
    }

    // Validate name length
    if (name.trim().length < 1) {
      return res.status(400).json({ error: "Name cannot be empty" })
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: "Name is too long (max 100 characters)" })
    }

    // Using pool.query for PostgreSQL
    const query = "UPDATE users SET name = $1 WHERE email = $2 RETURNING *"
    const result = await pool.query(query, [name.trim(), email])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({
      success: true,
      message: "Name updated successfully",
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Error updating user name:", error)
    res.status(500).json({ error: "Failed to update name" })
  }
})

// Get user by email route
router.get("/get-user", async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const query = "SELECT * FROM users WHERE email = $1"
    const result = await pool.query(query, [email])

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error getting user:", error)
    res.status(500).json({ error: "Failed to get user" })
  }
})

// Get or create user route
router.post("/get-or-create", async (req, res) => {
  const { email, name } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO users (email, name)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET 
       name = CASE 
         WHEN users.name IS NULL OR users.name = '' THEN $2
         ELSE users.name
       END
       RETURNING *`,
      [email, name || "User"],
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error("Error in get-or-create:", err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
