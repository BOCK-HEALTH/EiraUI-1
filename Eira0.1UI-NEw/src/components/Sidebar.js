// src/components/Sidebar.js
import React, { useEffect, useState } from "react";
import "./Sidebar.css";

function Sidebar({ onSelectSession, onNewSession }) {
  const [sessions, setSessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/sessions/list?email=${email}`);
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const handleRename = async (id) => {
    try {
      await fetch("http://localhost:5000/api/sessions/rename", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, newTitle: editedTitle })
      });
      setEditingId(null);
      setEditedTitle("");
      await fetchSessions();
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    try {
      await fetch(`http://localhost:5000/api/sessions/${id}`, { method: "DELETE" });
      await fetchSessions();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="sidebar">
      <h3>Sessions</h3>
      <button
        className="new-session"
        onClick={async () => {
          const newId = await onNewSession();
          if (newId) {
            await fetchSessions();
            onSelectSession(newId);
          }
        }}
      >
        + New Chat
      </button>

      <ul>
        {sessions.map(s => (
          <li key={s.id}>
            {editingId === s.id ? (
              <div className="edit-session">
                <input
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleRename(s.id)}
                />
                <button className="action-btn">✔</button>
                <button className="action-btn" onClick={() => setEditingId(null)}>✖</button>
              </div>
            ) : (
              <div className="session-item">
                <span onClick={() => onSelectSession(s.id)}>{s.title}</span>
                <div className="session-actions">
                  <button className="action-btn" onClick={() => { setEditingId(s.id); setEditedTitle(s.title); }}>✏️</button>
                  <button className="action-btn" onClick={() => handleDelete(s.id)}>🗑️</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sidebar;
