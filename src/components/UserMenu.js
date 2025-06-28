"use client"

import { useState, useRef, useEffect } from "react"
import { FiLogOut, FiChevronDown, FiEdit2, FiCheck, FiX } from "react-icons/fi"
import "./UserMenu.css"

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)
  const [editingName, setEditingName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const menuRef = useRef(null)
  const editInputRef = useRef(null)

  // CORRECTION 1: Fetch user data from the database on component mount.
  useEffect(() => {
    const fetchUserData = async (email) => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/get-user?email=${email}`)
        if (!response.ok) {
          // If user not found in DB, fall back to localStorage or default
          throw new Error("User not found in database")
        }
        const userData = await response.json()
        
        // Update state with data from the database (the source of truth)
        setUserName(userData.name)
        setUserEmail(userData.email)

        // Sync localStorage with the fresh data from the database
        localStorage.setItem("userName", userData.name)
        localStorage.setItem("userEmail", userData.email)

      } catch (error) {
        console.error("Failed to fetch user data:", error.message)
        // If fetching fails, use what's in localStorage as a fallback
        const localName = localStorage.getItem("userName") || ""
        const localEmail = localStorage.getItem("userEmail") || ""
        setUserName(localName)
        setUserEmail(localEmail)
      }
    }

    const emailFromStorage = localStorage.getItem("userEmail")
    if (emailFromStorage) {
      fetchUserData(emailFromStorage)
    }
  }, []) // The empty dependency array ensures this runs only once on mount.


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
        if (isEditingName) {
          setIsEditingName(false)
          setEditingName("")
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEditingName])

  useEffect(() => {
    if (isEditingName && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditingName])

  const handleLogout = () => {
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    localStorage.removeItem("lastSessionId")
    window.location.href = "/"
  }

  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleEditName = () => {
    setEditingName(userName)
    setIsEditingName(true)
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditingName("")
  }

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      alert("Name cannot be empty")
      return
    }
    if (editingName.trim() === userName) {
      setIsEditingName(false)
      return
    }
    setIsUpdating(true)
    try {
      const response = await fetch("http://localhost:5000/api/users/update-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, name: editingName.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update name")
      }

      const data = await response.json()

      // CORRECTION 2: Use the response from the server to update state.
      // This ensures consistency with the database.
      setUserName(data.user.name)
      localStorage.setItem("userName", data.user.name)

      setIsEditingName(false)
      setEditingName("")

      console.log("Name updated successfully:", data.message)
    } catch (error) {
      console.error("Error updating name:", error)
      alert("Failed to update name: " + error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSaveName()
    } else if (e.key === "Escape") {
      handleCancelEdit()
    }
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-menu-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar-menu">{getInitials(userName)}</div>
        {/* You can re-add the chevron if you adjust the CSS, or keep it clean like this */}
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-header">
            <div className="user-avatar-large">{getInitials(userName)}</div>
            <div className="user-details">
              {isEditingName ? (
                <div className="name-edit-container">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="name-edit-input"
                    placeholder="Enter your name"
                    disabled={isUpdating}
                  />
                  <div className="name-edit-actions">
                    <button
                      onClick={handleSaveName}
                      className="name-action-btn save-btn"
                      disabled={isUpdating}
                      title="Save"
                    >
                      <FiCheck size={14} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="name-action-btn cancel-btn"
                      disabled={isUpdating}
                      title="Cancel"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="name-display-container">
                  <div className="user-name-large">{userName || "User"}</div>
                  <button onClick={handleEditName} className="edit-name-btn" title="Edit name">
                    <FiEdit2 size={14} />
                  </button>
                </div>
              )}
              <div className="user-email-large">{userEmail}</div>
            </div>
          </div>

          <div className="user-menu-divider"></div>

          <button className="user-menu-item logout-item" onClick={handleLogout}>
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default UserMenu
