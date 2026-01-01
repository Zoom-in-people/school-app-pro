import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXoBZXNhJREag3cz0wpaUCLRJVkcGDLis",
  authDomain: "school-app-pro-e5660.firebaseapp.com",
  projectId: "school-app-pro-e5660",
  storageBucket: "school-app-pro-e5660.firebasestorage.app",
  messagingSenderId: "904262447588",
  appId: "1:904262447588:web:6b91d7e66b15feb3e797f1"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 🔥 [핵심] 이 줄이 꼭 있어야 드라이브에 파일을 올릴 수 있습니다!
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

export const db = getFirestore(app);