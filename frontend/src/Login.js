"use client"

// src/Login.js
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { auth } from "./firebase"
import logo from "./Eira Text2-01.svg"
import "./Login.css"

function Login() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }

      // ✅ Send user info to backend
      await fetch("http://localhost:5000/api/users/get-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      })

      // ✅ Save info locally
      localStorage.setItem("userEmail", email)
      localStorage.setItem("userName", name)

      navigate("/app")
    } catch (err) {
      console.error("Auth error:", err)
      alert(err.message)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo || "/placeholder.svg"} alt="Eira Logo" className="login-logo" />
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <form onSubmit={handleAuth}>
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">{isRegister ? "Create Account" : "Login"}</button>
        </form>
        <p onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  )
}

export default Login
