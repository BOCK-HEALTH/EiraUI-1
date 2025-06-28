"use client"

import { useState, useEffect } from "react"
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiMessageSquare } from "react-icons/fi"
import "./Sidebar.css"

// Export the Sidebar component before defining it
const Sidebar = ({ onNewSession, onSelectSession, className = "", onSessionDeleted }) => {
  const [sessions, setSessions] = useState([])
  const [userEmail, setUserEmail] = useState("")
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editingTitle, setEditingTitle] = useState("")

  useEffect(() => {
    // Get user info from localStorage
    const email = localStorage.getItem("userEmail") || ""
    setUserEmail(email)

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

  const handleEditSession = (sessionId, currentTitle) => {
    setEditingSessionId(sessionId)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = async (sessionId) => {
    if (!editingTitle.trim()) return

    try {
      const res = await fetch("http://localhost:5000/api/sessions/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, newTitle: editingTitle.trim() }),
      })

      if (res.ok) {
        // Update the local sessions list
        setSessions(
          sessions.map((session) => (session.id === sessionId ? { ...session, title: editingTitle.trim() } : session)),
        )
        setEditingSessionId(null)
        setEditingTitle("")
      }
    } catch (err) {
      console.error("Failed to rename session:", err)
    }
  }

  const handleCancelEdit = () => {
    setEditingSessionId(null)
    setEditingTitle("")
  }

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        // Remove the session from local state
        setSessions(sessions.filter((session) => session.id !== sessionId))

        // Check if this was the current session
        const currentSessionId = localStorage.getItem("lastSessionId")
        if (currentSessionId === sessionId.toString()) {
          localStorage.removeItem("lastSessionId")
          // Call the callback to clear the current chat
          if (onSessionDeleted) {
            onSessionDeleted()
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err)
    }
  }

  const refreshSessions = () => {
    if (userEmail) {
      loadUserSessions(userEmail)
    }
  }

  // Expose refresh function globally for the main app to call
  useEffect(() => {
    window.refreshSidebar = refreshSessions
    return () => {
      delete window.refreshSidebar
    }
  }, [userEmail])

  return (
    <div className={`sidebar ${className}`}>
      {/* New Session Button */}
      <div className="sidebar-header">
        <button onClick={onNewSession} className="new-session-btn">
          <FiPlus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="sessions-list">
        <div className="sessions-header">
          <FiMessageSquare size={16} />
          <h3>Chat History</h3>
        </div>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <div key={session.id} className="session-item">
              {editingSessionId === session.id ? (
                <div className="session-edit-mode">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="session-edit-input"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(session.id)
                      if (e.key === "Escape") handleCancelEdit()
                    }}
                    autoFocus
                  />
                  <div className="session-edit-actions">
                    <button
                      onClick={() => handleSaveEdit(session.id)}
                      className="session-action-btn save-btn"
                      title="Save"
                    >
                      <FiCheck size={14} />
                    </button>
                    <button onClick={handleCancelEdit} className="session-action-btn cancel-btn" title="Cancel">
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="session-content" onClick={() => onSelectSession(session.id)}>
                  <div className="session-info">
                    <div className="session-title">{session.title}</div>
                    <div className="session-date">{formatDate(session.created_at)}</div>
                  </div>
                  <div className="session-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditSession(session.id, session.title)
                      }}
                      className="session-action-btn edit-btn"
                      title="Edit name"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteSession(session.id)
                      }}
                      className="session-action-btn delete-btn"
                      title="Delete chat"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="no-sessions">
            <p>No chats yet</p>
            <p>Start a new conversation to begin</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Export the component at the end
export default Sidebar
