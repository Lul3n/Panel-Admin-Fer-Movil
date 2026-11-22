import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDThChX1TPPcVMpG7qA0-WqF917htdcm8M",
  authDomain: "fer-movil.firebaseapp.com",
  projectId: "fer-movil",
  storageBucket: "fer-movil.firebasestorage.app",
  messagingSenderId: "1001525145345",
  appId: "1:1001525145345:web:ac84c48df2c7b8c1463500"

};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);