"use client"

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
        const userData = localStorage.getItem("user")

        // Check if user data exists and is valid
        if (isLoggedIn && userData) {
          const user = JSON.parse(userData)
          if (user && user.uid && user.email) {
            setLoggedIn(true)
          } else {
            // Invalid user data, clear localStorage
            localStorage.removeItem("isLoggedIn")
            localStorage.removeItem("user")
            setLoggedIn(false)
          }
        } else {
          setLoggedIn(false)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        // Clear potentially corrupted data
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("user")
        setLoggedIn(false)
      } finally {
        setChecked(true)
      }
    }

    checkAuthStatus()

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e) => {
      if (e.key === "isLoggedIn" || e.key === "user") {
        checkAuthStatus()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  if (!checked) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    )
  }

  return loggedIn ? children : <Navigate to="/" replace />
}
