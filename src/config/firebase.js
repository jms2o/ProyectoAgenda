import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuración Firebase: usa variables de entorno en producción (Hostinger)
// y mantiene fallback para desarrollo local.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB9aYG60tL-mPy1wtKB0iDRvYDgIaCsduI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "qdsi-2a155.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "qdsi-2a155",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "qdsi-2a155.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "516348072486",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:516348072486:web:093157c2c884363c74cce7"
};

// Inicializamos la aplicación de Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
