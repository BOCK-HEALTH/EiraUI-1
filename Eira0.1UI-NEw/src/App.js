import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import logo from "./Eira Text2-01.svg";
import { FiVideo } from "react-icons/fi";
import Sidebar from "./components/Sidebar";

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
const [recording, setRecording] = useState(false);
const [recordedVideo, setRecordedVideo] = useState(null); // ✅ New
const [videoReadyToSend, setVideoReadyToSend] = useState(false);
const [sessionId, setSessionId] = useState(null);
const email = localStorage.getItem("userEmail");
const [hasActiveChat, setHasActiveChat] = useState(false);
const [videoStream, setVideoStream] = useState(null);
const videoRef = useRef(null);
const mediaRecorderRef = useRef(null);
const recordedChunksRef = useRef([]);


const createNewSession = async () => {
  const title = prompt("Title for new session?") || "Untitled";
  try {
    const res = await fetch("http://localhost:5000/api/sessions/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, title }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setSessionId(data.id);
      setMessages([]);
      setHasActiveChat(true);
      return data.id;              // ⟵ ⭐ RETURN the new id
    }
  } catch (err) {
    console.error("Session creation failed:", err);
  }
  return null;                     // fail-safe
};



const loadSessionMessages = async (id) => {
  try {
    const res = await fetch(`http://localhost:5000/api/chat/history?session_id=${id}`);
    const data = await res.json();
    setMessages(data);
    setSessionId(id);
    setHasActiveChat(true);
    localStorage.setItem("lastSessionId", id);  // ✅ persist session ID
  } catch (err) {
    console.error("Failed to load session messages:", err);
  }
};








const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    setVideoStream(stream); // Store stream for later cleanup
    recordedChunksRef.current = [];

    if (videoRef.current) {
        videoRef.current.srcObject = stream;
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const videoURL = URL.createObjectURL(blob);
        
        setRecordedVideo({ blob, url: videoURL });   // ✅ set blob
        setVideoReadyToSend(true);                   // ✅ enable send
        setShowVideoModal(false);                    // ✅ close modal after everything
        stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    setRecording(true);
};

const stopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();  // this triggers onstop later
        setRecording(false);
    }
};

const sendVideoMessage = async () => {
    if (!recordedVideo) return;
let sid = sessionId;
if (!sid) {
  sid = await createNewSession();
  if (!sid) return;
}

    setMessages((prev) => [...prev, { sender: "user", text: "[📹 Video sent]", isVideo: true }]);
    setIsTyping(true);
    setShowVideoModal(false);

    const formData = new FormData();
    formData.append("video", recordedVideo.blob, "recorded-video.webm");

    try {
        const res = await fetch("http://localhost:5000/api/chat/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    session_id: sessionId,   // ✅ this line is CRITICAL
    message: "your text",
    sender: "user"           // or "eira"
  }),
});

        const data = await res.json();
        setIsTyping(false);
        setMessages((prev) => [...prev, { sender: "eira", text: data.text || "🎥 Video response" }]);

        if (data.audio) {
            const audioUrl = `data:audio/mpeg;base64,${data.audio}`;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            audioRef.current = new Audio(audioUrl);
            audioRef.current.play().catch(console.error);
        }
    } catch (err) {
        setIsTyping(false);
        setMessages((prev) => [...prev, { sender: "eira", text: "⚠️ Video upload failed" }]);
    }

    // Clear state
    setRecordedVideo(null);
    setVideoReadyToSend(false);

};


const handleVideoClick = () => setShowVideoModal(true);
const closeVideoModal = () => {
    if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
    }
    setShowVideoModal(false);
};

    useEffect(() => {
        if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput((prevInput) => prevInput + transcript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleVoiceInput = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition is not supported in your browser");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

   const sendMessage = async () => {
    if (!input.trim()) return;
let sid = sessionId;
if (!sid) {
  sid = await createNewSession();   // auto-create if needed
  if (!sid) return;                 // bail on failure
}

    setIsTyping(true);
    const userInput = input;
    setInput("");
    
    // Add user message to the UI immediately
    setMessages(prev => [...prev, { sender: "user", text: userInput }]);
    
    try {
        // First, send the user message to the API
        const response = await fetch("http://localhost:5000/api/chat/add", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    session_id: sessionId,   // ✅ this line is CRITICAL
    message: "your text",
    sender: "user"           // or "eira"
  }),
});

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "API request failed");
        }

        // Get response from the API
        const data = await response.json();
        
        // Create the bot message object
        const botMessage = {
            sender: "eira",
            text: data.text || "🔊 Audio response"
        };

        // Update UI to show bot's response
        setIsTyping(false);
        setMessages(prev => [...prev, botMessage]);
        setHasActiveChat(true);

        // Add bot's message to the API
        await fetch("http://localhost:5000/api/chat/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email,
                session_id: sid,
                message: botMessage.text,
                sender: "eira",
            }),
        });

        // Handle audio playback from base64 data
        if (data.audio) {
            const audioUrl = `data:audio/mpeg;base64,${data.audio}`;
            
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            
            audioRef.current = new Audio(audioUrl);
            audioRef.current.play().catch(error => {
                console.error("Audio playback failed:", error);
            });
        }

    } catch (error) {
        console.error("Error:", error);
        setIsTyping(false);
        setMessages(prev => [
            ...prev,
            { sender: "eira", text: "⚠️ Error: " + error.message },
        ]);
    }
};
    
useEffect(() => {
  const lastSession = localStorage.getItem("lastSessionId");
  if (lastSession) {
    loadSessionMessages(lastSession);
  }
}, []);

    return (
         <div className="app-layout">
       <Sidebar
  onNewSession={createNewSession}
  onSelectSession={loadSessionMessages}
/>
        <div className="app-container">
            <div className="chat-container">
               {(!hasActiveChat || messages.length === 0) ? (
  <div className="welcome-container">
    <div className="welcome-message">
      <div className="logo-container">
        <img src={logo} alt="Eira Logo" className="welcome-logo" />
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
    {messages.map((msg, i) => (
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
            <div className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          </div>
        </div>
      </div>
    ))}

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

            <div className="input-container">
                <div className="input-wrapper">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Ask Eira..."
                        className="message-input"
                    />
                    <button
                        onClick={toggleVoiceInput}
                        className={`voice-button ${isListening ? "listening" : ""}`}
                        aria-label="Voice input"
                        title="Click to speak"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 1C11.2044 1 10.4413 1.31607 9.87868 1.87868C9.31607 2.44129 9 3.20435 9 4V12C9 12.7956 9.31607 13.5587 9.87868 14.1213C10.4413 14.6839 11.2044 15 12 15C12.7956 15 13.5587 14.6839 14.1213 14.1213C14.6839 13.5587 15 12.7956 15 12V4C15 3.20435 14.6839 2.44129 14.1213 1.87868C13.5587 1.31607 12.7956 1 12 1Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 19V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 23H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                    <button
   
   
  onClick={handleVideoClick}
  className="video-button"
  title="Record a video"
>



    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="7" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="2"/>
                                <path d="M16 9.5L21 7V17L16 14.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                            </svg>
 
</button>

                    <button
                        onClick={videoReadyToSend ? sendVideoMessage : sendMessage}
  className="send-button"
  disabled={!input.trim() && !videoReadyToSend}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
            {showVideoModal && (
    <div className="video-overlay">
        <div className="video-modal">
            {recordedVideo ? (
                <video
                    className="recorded-playback"
                    src={recordedVideo.url}
                    controls
                />
            ) : (
                <video
                    ref={videoRef}
                    className="video-preview"
                    autoPlay
                    muted
                    playsInline
                />
            )}

            <div className="controls">
                {!recordedVideo ? (
    <>
        {!recording ? (
            <button
                className="record-btn"
                onClick={startRecording}
            >
                Start Recording
            </button>
        ) : (
            <button
                className="record-btn recording"
                onClick={stopRecording}
            >
                Stop Recording
            </button>
        )}
        <button className="close-btn" onClick={closeVideoModal}>Close</button>
    </>
) : (
    <>
        <video
            className="recorded-playback"
            src={recordedVideo.url}
            controls
        />
        <button className="send-video-btn" onClick={sendVideoMessage}>
            Send Video
        </button>
        <button className="close-btn" onClick={closeVideoModal}>Close</button>
    </>
)}

            </div>
        </div>
    </div>
)}


        </div>
        </div>
    );
    
}

export default App;