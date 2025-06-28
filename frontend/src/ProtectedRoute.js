"use client"

import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { auth } from "./firebase"

export default function ProtectedRoute({ children }) {
  const [checked, setChecked] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setLoggedIn(!!user)
      setChecked(true)
    })
    return unsub
  }, [])

  if (!checked) return <p>Loading…</p>
  return loggedIn ? children : <Navigate to="/" replace />
}
