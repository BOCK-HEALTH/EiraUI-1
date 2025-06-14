"use client"

import { useState, useEffect, useRef } from "react"
import "./App.css"
import logo from "./Eira Text2-01.svg"
import { FiVideo, FiMic, FiPlus, FiFile, FiImage, FiFileText, FiMusic, FiX, FiDownload, FiMenu } from "react-icons/fi"
import Sidebar from "./components/Sidebar"
import UserMenu from "./components/UserMenu"

// Update the App component to properly handle sidebar state
function App() {
  // Keep all existing state variables
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const messagesEndRef = useRef(null)
  const audioRef = useRef(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState(null)
  const [videoReadyToSend, setVideoReadyToSend] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const email = localStorage.getItem("userEmail")
  const [hasActiveChat, setHasActiveChat] = useState(false)
  const [videoStream, setVideoStream] = useState(null)
  const videoRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const fileInputRef = useRef(null)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [filesReadyToSend, setFilesReadyToSend] = useState(false)
  const [audioRecording, setAudioRecording] = useState(null)
  const [videoRecording, setVideoRecording] = useState(null)
  const mediaRecorderAudioRef = useRef(null)
  const audioChunksRef = useRef([])
  const [audioStream, setAudioStream] = useState(null)
  const [showFileViewer, setShowFileViewer] = useState(false)
  const [currentFile, setCurrentFile] = useState(null)
  const [fileViewerType, setFileViewerType] = useState(null)
  const [fileDataStore, setFileDataStore] = useState(new Map())
  const [showSidebar, setShowSidebar] = useState(false) // New state for sidebar visibility

  const createNewSession = async () => {
    const title = prompt("Title for new session?") || "Untitled"
    try {
      const res = await fetch("http://localhost:5000/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, title }),
      })
      const data = await res.json()
      if (res.ok && data.id) {
        setSessionId(data.id)
        setMessages([])
        setHasActiveChat(true)
        localStorage.setItem("lastSessionId", data.id)

        // Trigger sidebar refresh by calling a callback if provided
        if (window.refreshSidebar) {
          window.refreshSidebar()
        }

        return data.id
      }
    } catch (err) {
      console.error("Session creation failed:", err)
    }
    return null
  }

  const loadSessionMessages = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/chat/history?session_id=${id}`)
      if (!res.ok) {
        throw new Error("Failed to fetch session messages")
      }
      const data = await res.json()

      // Map the backend response format to frontend format
      const formattedMessages = data.map((msg) => ({
        sender: msg.sender,
        text: msg.message, // Backend returns 'message', frontend expects 'text'
        timestamp: msg.created_at,
      }))

      setMessages(formattedMessages)
      setSessionId(id)
      setHasActiveChat(true)
      localStorage.setItem("lastSessionId", id)
    } catch (err) {
      console.error("Failed to load session messages:", err)
      // Set empty messages array to avoid showing previous chat data
      setMessages([])
    }
  }

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    setVideoStream(stream)
    recordedChunksRef.current = []

    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" })
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
      const videoFile = new File([blob], "video-recording.webm", { type: "video/webm" })

      setVideoRecording(videoFile)
      setFilesReadyToSend(true)
      setShowVideoModal(false)
      stream.getTracks().forEach((track) => track.stop())
    }

    mediaRecorder.start()
    setRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
      // Store file data for later viewing
      files.forEach((file) => {
        const fileUrl = URL.createObjectURL(file)
        setFileDataStore((prev) => new Map(prev.set(file.name, { file, url: fileUrl, type: file.type })))
      })

      setUploadedFiles((prevFiles) => [...prevFiles, ...files])
      setFilesReadyToSend(true)
    }
  }

  const handlePlusClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = (index, type = "file") => {
    if (type === "audio") {
      setAudioRecording(null)
    } else if (type === "video") {
      setVideoRecording(null)
    } else {
      const fileToRemove = uploadedFiles[index]
      if (fileToRemove) {
        // Clean up file URL
        const fileData = fileDataStore.get(fileToRemove.name)
        if (fileData?.url) {
          URL.revokeObjectURL(fileData.url)
        }
        setFileDataStore((prev) => {
          const newMap = new Map(prev)
          newMap.delete(fileToRemove.name)
          return newMap
        })
      }
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    // Check if any items remain
    const remainingFiles = uploadedFiles.filter((_, i) => i !== index)
    if (remainingFiles.length === 0 && !audioRecording && !videoRecording) {
      setFilesReadyToSend(false)
    }
  }

  const sendVideoMessage = async () => {
    if (!recordedVideo) return
    let sid = sessionId
    if (!sid) {
      sid = await createNewSession()
      if (!sid) return
    }

    setMessages((prev) => [...prev, { sender: "user", text: "[📹 Video sent]", isVideo: true }])
    setIsTyping(true)
    setShowVideoModal(false)

    const formData = new FormData()
    formData.append("video", recordedVideo.blob, "recorded-video.webm")

    try {
      const res = await fetch("http://localhost:5000/api/chat/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          session_id: sessionId,
          message: "Video message sent",
          sender: "user",
        }),
      })

      const data = await res.json()
      setIsTyping(false)
      setMessages((prev) => [...prev, { sender: "eira", text: data.text || "🎥 Video response" }])

      if (data.audio) {
        const audioUrl = `data:audio/mpeg;base64,${data.audio}`
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        audioRef.current = new Audio(audioUrl)
        audioRef.current.play().catch(console.error)
      }
    } catch (err) {
      setIsTyping(false)
      setMessages((prev) => [...prev, { sender: "eira", text: "⚠️ Video upload failed" }])
    }

    setRecordedVideo(null)
    setVideoReadyToSend(false)
  }

  const sendFilesMessage = async () => {
    if (uploadedFiles.length === 0) return
    let sid = sessionId
    if (!sid) {
      sid = await createNewSession()
      if (!sid) return
    }

    const fileNames = uploadedFiles.map((file) => file.name).join(", ")
    setMessages((prev) => [...prev, { sender: "user", text: `📄 Files uploaded: ${fileNames}` }])
    setIsTyping(true)

    const formData = new FormData()
    uploadedFiles.forEach((file, index) => {
      formData.append(`file_${index}`, file)
    })

    try {
      const res = await fetch("http://localhost:5000/api/chat/upload-files", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      setIsTyping(false)
      setMessages((prev) => [...prev, { sender: "eira", text: data.text || "📄 Files processed successfully" }])

      // Save message to database
      await fetch("http://localhost:5000/api/chat/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          session_id: sid,
          message: `Files uploaded: ${fileNames}`,
          sender: "user",
        }),
      })
    } catch (err) {
      setIsTyping(false)
      setMessages((prev) => [...prev, { sender: "eira", text: "⚠️ File upload failed" }])
    }

    setUploadedFiles([])
    setFilesReadyToSend(false)
  }

  const handleVideoClick = () => setShowVideoModal(true)
  const closeVideoModal = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop())
    }
    setShowVideoModal(false)
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setAudioStream(stream)
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderAudioRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        const audioFile = new File([blob], "voice-recording.webm", { type: "audio/webm" })

        // Store audio recording data
        const audioUrl = URL.createObjectURL(blob)
        setFileDataStore(
          (prev) => new Map(prev.set("Voice Recording", { file: audioFile, url: audioUrl, type: "audio/webm" })),
        )

        setAudioRecording(audioFile)
        setFilesReadyToSend(true)
        stream.getTracks().forEach((track) => track.stop())
        setAudioStream(null)
      }

      mediaRecorder.start()
      setIsRecordingAudio(true)
    } catch (err) {
      console.error("Error starting audio recording:", err)
      alert("Could not access microphone. Please check your permissions.")
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderAudioRef.current && mediaRecorderAudioRef.current.state === "recording") {
      mediaRecorderAudioRef.current.stop()
      setIsRecordingAudio(false)
    }
  }

  const toggleVoiceInput = () => {
    if (isRecordingAudio) {
      stopAudioRecording()
    } else {
      startAudioRecording()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAllUploadedItems = () => {
    const items = [...uploadedFiles]
    if (audioRecording) items.push(audioRecording)
    if (videoRecording) items.push(videoRecording)
    return items
  }

  const getFileIcon = (file) => {
    if (file.name.includes("voice-recording")) return <FiMic className="file-icon" />
    if (file.name.includes("video-recording")) return <FiVideo className="file-icon" />
    if (file.type?.startsWith("image/")) return <FiImage className="file-icon" />
    if (file.type?.startsWith("audio/")) return <FiMusic className="file-icon" />
    if (file.type?.includes("pdf") || file.type?.includes("document")) return <FiFileText className="file-icon" />
    return <FiFile className="file-icon" />
  }

  const getFileName = (file) => {
    if (file.name.includes("voice-recording")) return "Voice Recording"
    if (file.name.includes("video-recording")) return "Video Recording"
    return file.name
  }

  const getFileIconForMessage = (fileName) => {
    if (fileName.includes("Voice Recording")) return <FiMic className="attachment-icon" />
    if (fileName.includes("Video Recording")) return <FiVideo className="attachment-icon" />
    if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) return <FiImage className="attachment-icon" />
    if (fileName.match(/\.(mp3|wav|ogg|m4a|webm)$/i)) return <FiMusic className="attachment-icon" />
    if (fileName.match(/\.(pdf|doc|docx|txt)$/i)) return <FiFileText className="attachment-icon" />
    return <FiFile className="attachment-icon" />
  }

  const parseMessageWithAttachments = (messageText) => {
    // Check if message contains attachments
    const attachmentMatch = messageText.match(/Attachments:\s*(.+)$/s)
    if (!attachmentMatch) {
      return { text: messageText, attachments: [] }
    }

    const textPart = messageText.replace(/\n\nAttachments:\s*(.+)$/s, "").trim()
    const attachmentsPart = attachmentMatch[1]

    // Parse individual attachments
    const attachments = attachmentsPart.split(", ").map((item) => {
      const cleanItem = item.trim().replace(/^[🎤📹📄]\s*/u, "")
      return cleanItem
    })

    return { text: textPart, attachments }
  }

  const getFileType = (fileName) => {
    if (fileName.includes("Voice Recording")) return "audio"
    if (fileName.includes("Video Recording")) return "video"
    if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) return "image"
    if (fileName.match(/\.(mp3|wav|ogg|m4a|webm)$/i)) return "audio"
    if (fileName.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i)) return "video"
    if (fileName.match(/\.(pdf)$/i)) return "pdf"
    if (fileName.match(/\.(txt|md|json|xml|csv)$/i)) return "text"
    return "file"
  }

  const handleAttachmentClick = (fileName) => {
    const fileData = fileDataStore.get(fileName)
    if (fileData) {
      setCurrentFile({ name: fileName, ...fileData })
      setFileViewerType(getFileType(fileName))
      setShowFileViewer(true)
    } else {
      // If file data not found, try to download or show error
      console.warn("File data not found for:", fileName)
      alert("File preview not available. The file may have been uploaded in a previous session.")
    }
  }

  const closeFileViewer = () => {
    setShowFileViewer(false)
    setCurrentFile(null)
    setFileViewerType(null)
  }

  const downloadFile = () => {
    if (currentFile) {
      const link = document.createElement("a")
      link.href = currentFile.url
      link.download = currentFile.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const sendMessage = async () => {
    const allItems = getAllUploadedItems()

    if (!input.trim() && allItems.length === 0) return

    let sid = sessionId
    if (!sid) {
      sid = await createNewSession()
      if (!sid) return
    }

    setIsTyping(true)
    const userInput = input
    setInput("")

    // Store video recording data if exists
    if (videoRecording) {
      const videoUrl = URL.createObjectURL(videoRecording)
      setFileDataStore(
        (prev) =>
          new Map(prev.set("Video Recording", { file: videoRecording, url: videoUrl, type: videoRecording.type })),
      )
    }

    // Create message content
    let messageContent = userInput
    if (allItems.length > 0) {
      const itemNames = allItems
        .map((item) => {
          if (item.name.includes("voice-recording")) return "Voice Recording"
          if (item.name.includes("video-recording")) return "Video Recording"
          return item.name
        })
        .join(", ")
      messageContent = userInput ? `${userInput}\n\nAttachments: ${itemNames}` : `Attachments: ${itemNames}`
    }

    setMessages((prev) => [...prev, { sender: "user", text: messageContent }])

    try {
      // Handle file uploads if any
      if (allItems.length > 0) {
        const formData = new FormData()
        allItems.forEach((item, index) => {
          formData.append(`file_${index}`, item)
        })

        // Send files first
        await fetch("http://localhost:5000/api/chat/upload-files", {
          method: "POST",
          body: formData,
        })
      }

      // Send text message
      const response = await fetch("http://localhost:5000/api/chat/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          session_id: sid,
          message: messageContent,
          sender: "user",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "API request failed")
      }

      const data = await response.json()

      const botMessage = {
        sender: "eira",
        text: data.text || "🔊 Response received",
      }

      setIsTyping(false)
      setMessages((prev) => [...prev, botMessage])
      setHasActiveChat(true)

      // Save bot response
      await fetch("http://localhost:5000/api/chat/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          session_id: sid,
          message: botMessage.text,
          sender: "eira",
        }),
      })

      if (data.audio) {
        const audioUrl = `data:audio/mpeg;base64,${data.audio}`
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
        }
        audioRef.current = new Audio(audioUrl)
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error)
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setIsTyping(false)
      setMessages((prev) => [...prev, { sender: "eira", text: "⚠️ Error: " + error.message }])
    }

    // Clear all uploaded items
    setUploadedFiles([])
    setAudioRecording(null)
    setVideoRecording(null)
    setFilesReadyToSend(false)
    setVideoReadyToSend(false)
  }

  useEffect(() => {
    const lastSession = localStorage.getItem("lastSessionId")
    if (lastSession && email) {
      loadSessionMessages(lastSession)
    }
  }, [email])

  // Cleanup audio stream on component unmount
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop())
      }
      // Cleanup file URLs
      fileDataStore.forEach((fileData) => {
        if (fileData.url) {
          URL.revokeObjectURL(fileData.url)
        }
      })
    }
  }, [audioStream])

  // Add this useEffect after the existing useEffects, around line 200
  useEffect(() => {
    // Add or remove class to body based on sidebar state
    if (showSidebar) {
      document.body.classList.add("sidebar-open")
    } else {
      document.body.classList.remove("sidebar-open")
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove("sidebar-open")
    }
  }, [showSidebar])

  // Update the return statement to include the new header layout
  return (
    <div className={`app-layout ${showSidebar ? "sidebar-is-open" : ""}`}>
      {/* Header with sidebar toggle and user menu */}
      <div className="app-header">
        <button className="sidebar-toggle-btn" onClick={() => setShowSidebar(!showSidebar)}>
          <FiMenu size={20} />
        </button>
        <UserMenu />
      </div>

      {/* Sidebar */}
      <Sidebar
        onNewSession={createNewSession}
        onSelectSession={loadSessionMessages}
        className={showSidebar ? "open" : "collapsed"}
        onSessionDeleted={() => {
          // Clear current chat if the deleted session was active
          const currentSessionId = localStorage.getItem("lastSessionId")
          if (!currentSessionId) {
            setMessages([])
            setHasActiveChat(false)
            setSessionId(null)
          }
        }}
      />

      <div className={`app-container ${!showSidebar ? "sidebar-collapsed" : ""}`}>
        <div className="chat-container">
          {/* Rest of your chat container content */}
          {!hasActiveChat || messages.length === 0 ? (
            <div className="welcome-container">
              <div className="welcome-message">
                <div className="logo-container">
                  <img src={logo || "/placeholder.svg"} alt="Eira Logo" className="welcome-logo" />
                </div>
                <p className="subtitle">Eira - Your AI Health Assistant</p>

                <div className="capabilities">
                  <div className="capability">
                    <div className="capability-icon">🏥</div>
                    <div className="capability-title">Medical Assistance</div>
                    <div className="capability-desc">Get reliable medical information and health guidance</div>
                  </div>

                  <div className="capability">
                    <div className="capability-icon">💊</div>
                    <div className="capability-title">Medication Info</div>
                    <div className="capability-desc">Learn about medications, dosages, and potential interactions</div>
                  </div>

                  <div className="capability">
                    <div className="capability-icon">🧬</div>
                    <div className="capability-title">Health Analysis</div>
                    <div className="capability-desc">Understand symptoms and get preliminary health insights</div>
                  </div>

                  <div className="capability">
                    <div className="capability-icon">❤️</div>
                    <div className="capability-title">Wellness Tips</div>
                    <div className="capability-desc">Receive personalized wellness and lifestyle recommendations</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-flow">
              {messages.map((msg, i) => {
                const { text, attachments } = parseMessageWithAttachments(msg.text)

                return (
                  <div key={i} className={`message-wrapper ${msg.sender}`}>
                    <div className="message-container">
                      {msg.sender === "eira" ? (
                        <div className="message-avatar eira">
                          <img src="health.png" alt="Eira" className="avatar-logo" />
                        </div>
                      ) : (
                        <div className="message-avatar user">U</div>
                      )}
                      <div className="message-content">
                        <div className={`message-sender ${msg.sender}`}>
                          {msg.sender === "user" ? "You" : "Eira 0.1"}
                        </div>

                        {/* Main message text */}
                        {text && <div className={`message ${msg.sender}`}>{text}</div>}

                        {/* Attachments display */}
                        {attachments.length > 0 && (
                          <div className="message-attachments">
                            {attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="attachment-item"
                                onClick={() => handleAttachmentClick(attachment)}
                              >
                                {getFileIconForMessage(attachment)}
                                <span className="attachment-name">{attachment}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {isTyping && (
                <div className="message-wrapper eira">
                  <div className="message-container">
                    <div className="message-avatar eira">
                      <img src="health.png" alt="Eira" className="avatar-logo" />
                    </div>
                    <div className="message-content">
                      <div className="message-sender eira">Eira 0.1</div>
                      <div className="message eira typing">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Update the gemini-input-container class */}
        <div className={`gemini-input-container`}>
          <div className={`input-wrapper-gemini ${getAllUploadedItems().length > 0 ? "has-files" : ""}`}>
            {/* File Chips Section */}
            {getAllUploadedItems().length > 0 && (
              <div className="file-chips-container">
                {uploadedFiles.map((file, index) => (
                  <div key={`file-${index}`} className="file-chip-inline">
                    {getFileIcon(file)}
                    <span className="file-name-inline">{getFileName(file)}</span>
                    <button className="remove-file-btn-inline" onClick={() => removeFile(index, "file")}>
                      ×
                    </button>
                  </div>
                ))}

                {audioRecording && (
                  <div className="file-chip-inline">
                    <FiMic className="file-icon" />
                    <span className="file-name-inline">Voice Recording</span>
                    <button className="remove-file-btn-inline" onClick={() => removeFile(0, "audio")}>
                      ×
                    </button>
                  </div>
                )}

                {videoRecording && (
                  <div className="file-chip-inline">
                    <FiVideo className="file-icon" />
                    <span className="file-name-inline">Video Recording</span>
                    <button className="remove-file-btn-inline" onClick={() => removeFile(0, "video")}>
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Input Row */}
            <div className="input-row">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Start typing a prompt"
                className="message-input-gemini"
              />
              <div className="input-actions">
                <button onClick={handlePlusClick} className="action-button plus-button" title="Upload files">
                  <FiPlus size={20} />
                </button>
                <button
                  onClick={sendMessage}
                  className="send-button-gemini"
                  disabled={!input.trim() && getAllUploadedItems().length === 0}
                  title="Send message"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 2L15 22L11 13L2 9L22 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="bottom-actions">
            <button
              onClick={toggleVoiceInput}
              className={`action-button-large ${isRecordingAudio ? "listening" : ""}`}
              title={isRecordingAudio ? "Stop Recording" : "Start Voice Recording"}
            >
              <FiMic size={20} />
              <span>{isRecordingAudio ? "Stop Recording" : "Talk"}</span>
            </button>

            <button onClick={handleVideoClick} className="action-button-large" title="Webcam">
              <FiVideo size={20} />
              <span>Webcam</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.mp4,.mp3,.wav"
        style={{ display: "none" }}
      />

      {/* Video Modal */}
      {showVideoModal && (
        <div className="video-overlay">
          <div className="video-modal">
            {recordedVideo ? (
              <video className="recorded-playback" src={recordedVideo.url} controls />
            ) : (
              <video ref={videoRef} className="video-preview" autoPlay muted playsInline />
            )}

            <div className="controls">
              {!recordedVideo ? (
                <>
                  {!recording ? (
                    <button className="record-btn" onClick={startRecording}>
                      Start Recording
                    </button>
                  ) : (
                    <button className="record-btn recording" onClick={stopRecording}>
                      Stop Recording
                    </button>
                  )}
                  <button className="close-btn" onClick={closeVideoModal}>
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button className="send-video-btn" onClick={sendVideoMessage}>
                    Send Video
                  </button>
                  <button className="close-btn" onClick={closeVideoModal}>
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {showFileViewer && currentFile && (
        <div className="file-viewer-overlay">
          <div className="file-viewer-modal">
            <div className="file-viewer-header">
              <div className="file-viewer-title">
                <span className="file-viewer-name">{currentFile.name}</span>
                <span className="file-viewer-type">{fileViewerType.toUpperCase()}</span>
              </div>
              <div className="file-viewer-actions">
                <button onClick={downloadFile} className="file-viewer-btn download-btn" title="Download">
                  <FiDownload size={18} />
                </button>
                <button onClick={closeFileViewer} className="file-viewer-btn close-btn" title="Close">
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className="file-viewer-content">
              {fileViewerType === "image" && (
                <img src={currentFile.url || "/placeholder.svg"} alt={currentFile.name} className="file-viewer-image" />
              )}

              {fileViewerType === "video" && <video src={currentFile.url} controls className="file-viewer-video" />}

              {fileViewerType === "audio" && (
                <div className="file-viewer-audio-container">
                  <div className="audio-icon">
                    <FiMusic size={64} />
                  </div>
                  <audio src={currentFile.url} controls className="file-viewer-audio" />
                  <p className="audio-filename">{currentFile.name}</p>
                </div>
              )}

              {fileViewerType === "pdf" && (
                <iframe src={currentFile.url} className="file-viewer-pdf" title={currentFile.name} />
              )}

              {fileViewerType === "text" && (
                <div className="file-viewer-text-container">
                  <div className="text-file-icon">
                    <FiFileText size={64} />
                  </div>
                  <p>Text file preview not available</p>
                  <button onClick={downloadFile} className="download-text-btn">
                    Download to view content
                  </button>
                </div>
              )}

              {fileViewerType === "file" && (
                <div className="file-viewer-generic-container">
                  <div className="generic-file-icon">
                    <FiFile size={64} />
                  </div>
                  <p className="generic-filename">{currentFile.name}</p>
                  <p className="generic-message">Preview not available for this file type</p>
                  <button onClick={downloadFile} className="download-generic-btn">
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
