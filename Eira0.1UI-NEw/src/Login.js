"use client"

// src/Login.js
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logo from "./Eira Text2-01.svg"
import "./Login.css"

function Login() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login"
      const body = isRegister ? { email, password, name } : { email, password }

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        // ✅ Save user info locally
        localStorage.setItem("userEmail", data.user.email)
        localStorage.setItem("userName", data.user.name || name)
        localStorage.setItem("userUid", data.user.uid)

        navigate("/app")
      } else {
        alert(data.error || "Authentication failed")
      }
    } catch (err) {
      console.error("Auth error:", err)
      alert("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={logo || "/placeholder.svg"} alt="Eira Logo" className="login-logo" />
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Create Account" : "Login"}
          </button>
        </form>
        <p onClick={() => !loading && setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  )
}

export default Login
