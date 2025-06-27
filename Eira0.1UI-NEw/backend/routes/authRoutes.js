const express = require("express")
const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth")
const { auth } = require("../firebase")
const router = express.Router()

// Register endpoint
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Create user in database
    await fetch("http://localhost:5000/api/users/get-or-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    })

    res.status(201).json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: name,
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
})

// Login endpoint
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Get user info from database
    const response = await fetch("http://localhost:5000/api/users/get-or-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const userData = await response.json()

    res.status(200).json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        name: userData.name || "",
      },
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
  }
})

module.exports = router
