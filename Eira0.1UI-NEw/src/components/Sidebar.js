"use client"

import { useState, useEffect } from "react"
import { FiPlus, FiUser, FiLogOut } from "react-icons/fi"
import "./Sidebar.css"

// Export the Sidebar component before defining it
const Sidebar = ({ onNewSession, onSelectSession, className = "" }) => {
  const [sessions, setSessions] = useState([])
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // Get user info from localStorage
    const email = localStorage.getItem("userEmail") || ""
    const name = localStorage.getItem("userName") || ""

    setUserEmail(email)
    setUserName(name)

    if (email) {
      loadUserSessions(email)
    }
  }, [])

  const loadUserSessions = async (email) => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/list?email=${email}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data)
      }
    } catch (err) {
      console.error("Failed to load sessions:", err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    localStorage.removeItem("lastSessionId")
    window.location.href = "/login"
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today"
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className={`sidebar ${className}`}>
      <div className="user-profile-section">
        <div className="user-avatar">
          <FiUser size={24} />
        </div>
        <div className="user-info">
          <div className="user-name">{userName || "User"}</div>
          <div className="user-email">{userEmail}</div>
        </div>
      </div>

      {/* New Session Button */}
      <div className="sidebar-header">
        <button onClick={onNewSession} className="new-session-btn">
          <FiPlus size={18} />
          <span>New Session</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="sessions-list">
        <div className="sessions-header">
          <h3>Recent Sessions</h3>
        </div>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="session-item" onClick={() => onSelectSession(session.id)}>
              <div className="session-title">{session.title}</div>
              <div className="session-date">{formatDate(session.created_at)}</div>
            </div>
          ))
        ) : (
          <div className="no-sessions">
            <p>No sessions yet</p>
            <p>Start a new conversation to begin</p>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FiLogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

// Export the component at the end
export default Sidebar
