// src/firebase.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAX64rzy9c_DHDjfg3h4yIjd7yfNeJfo8k",
  authDomain: "eira-4026b.firebaseapp.com",
  projectId: "eira-4026b",
  storageBucket: "eira-4026b.firebasestorage.app",
  messagingSenderId: "481687418209",
  appId: "1:481687418209:web:00519379504bf2071ec120",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
