import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      if (token) sessionStorage.setItem('google_access_token', token);

      // 🔥 [핵심] 로그인 성공 안내 메시지
      alert(
        "환영합니다, 선생님! 👋\n\n" +
        "1. 모든 자료와 데이터는 선생님의 [구글 드라이브]에 안전하게 저장됩니다.\n" +
        "2. 드라이브 내 '교무수첩 데이터' 폴더나 파일을 삭제하시면 앱 내용이 사라지니 주의해주세요!\n" +
        "3. 파일 업로드가 많아지면 드라이브 용량을 확인해주세요."
      );

    } catch (error) {
      console.error("Login Failed", error);
      alert("로그인 실패: " + error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('google_access_token');
    } catch (error) { console.error(error); }
  };

  return { user, loading, login, logout };
}