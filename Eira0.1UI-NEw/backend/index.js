const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sessionRoutes = require("./routes/sessionRoutes");
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require("./routes/chatRoutes"); // ✅ correct

const PORT = process.env.PORT || 5000;
 // ✅ This is crucial

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use("/api/chat", chatRoutes);

app.use("/api/sessions", sessionRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
