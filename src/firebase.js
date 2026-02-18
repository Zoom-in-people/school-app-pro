import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // 이미지 업로드용

const firebaseConfig = {
  // 🔥 Firebase 콘솔 -> 프로젝트 설정 -> 내 앱 -> SDK 설정 및 구성 에서 복사해오세요
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
export const db = getFirestore(app);
export const storage = getStorage(app);