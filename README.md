# 🧠 Eira 0.1 – Your AI Health Assistant

**Eira** is an intelligent chatbot-based health assistant designed to provide medical guidance, symptom analysis, and wellness recommendations. It supports video and voice inputs, and maintains personalized chat sessions per user. Built using React, Node.js, Firebase, and PostgreSQL (Neon DB).

---

## 🚀 Features

- 💬 **AI Chat Support**: Ask health-related queries in natural language.
- 🎙️ **Voice Recognition**: Speak your message using built-in speech-to-text.
- 📹 **Video Messages**: Record and send video queries to the assistant.
- 🧠 **Contextual AI Responses**: Receives answers from an intelligent backend.
- 📂 **Session History**: Automatically stores each user's chat history in Neon DB.
- 🔐 **Google Authentication**: Secure login via Google OAuth.
- 📑 **Sidebar with Chat Sessions**:
  - Rename or delete sessions
  - Switch between different session histories

---

## 🛠️ Tech Stack

### Frontend:
- React
- React Router
- ViewBinding + Context API
- CSS (custom styling)
- GSAP (animations)

### Backend:
- Node.js
- Express.js
- Firebase (for Google Auth)
- PostgreSQL (Neon DB)
- Multer (for handling video uploads)

---

## 📁 Folder Structure

```
Eira/
├── backend/               # Node.js Express server
│   ├── routes/
│   ├── controllers/
│   ├── db/
│   └── index.js
├── src/                   # React frontend
│   ├── components/
│   │   ├── Sidebar.js
│   ├── App.js
│   └── firebase.js
├── public/
│   └── index.html
├── .env
├── package.json
└── README.md
```

---

## 🧪 Local Setup

### Prerequisites:
- Node.js (v18+)
- PostgreSQL or [Neon DB](https://neon.tech/)
- Firebase project (for Google OAuth)

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/eira-ai.git
cd eira-ai
```

### 2. Install Dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Configure Environment
Create a `.env` file in the backend root with:

```
PORT=5000
DATABASE_URL=your_postgres_connection_string
```

Update Firebase config in `src/firebase.js`.

---

### 🔧 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Navigate to **Authentication > Sign-in method**
4. Enable **Google** sign-in and set your app domain (`localhost` for dev)
5. Go to **Project Settings > General**, get your Firebase config
6. Paste it into `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  projectId: "YOUR_APP_ID",
  ...
};
```

---

### 4. Start the Servers

#### Backend:
```bash
cd backend
node index.js
```

#### Frontend:
```bash
cd frontend
npm start
```

---

## ✅ How to Use

1. **Login** via Google on the login page.
2. Click **+ New Chat** in the sidebar to start a session.
3. Type, speak, or record your message using the provided input controls.
4. View responses in real-time and interact naturally.
5. Use the **Sidebar** to:
   - Rename a chat session
   - Delete unnecessary conversations
   - Revisit old sessions

---

## 🛡️ Security

- All video and voice content is processed securely.
- Only the logged-in user's data is stored and retrieved.
- No PII is stored unless explicitly entered by the user.

---

## 📈 Future Enhancements

- 🔍 Symptom-based diagnosis engine
- 📄 PDF export of session logs
- 👨‍⚕️ Human-in-the-loop escalation
- 🌐 Multilingual support

---

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/chat-title`)
3. Commit your changes (`git commit -m 'Add chat title editing'`)
4. Push to the branch (`git push origin feature/chat-title`)
5. Open a Pull Request

---


## 📄 License

This project is licensed under the MIT License.
