import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "nth-apex-xxctm",
  appId: "1:811527933064:web:f0cb4f631e3f686c35e33d",
  apiKey: "AIzaSyA4F9KtOSMLX8wxAWzmNajDJ2yew5_7EHU",
  authDomain: "nth-apex-xxctm.firebaseapp.com",
  storageBucket: "nth-apex-xxctm.firebasestorage.app",
  messagingSenderId: "811527933064"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-sicmanagementsys-3bdbb6c9-0258-4144-b85a-f1edfb45171c");
export const auth = getAuth(app);
