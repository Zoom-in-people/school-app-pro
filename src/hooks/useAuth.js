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
      
      // 🔥 [추가] 새로고침 시 Firebase 로그인은 유지되는데 구글 토큰이 없는 경우 체크
      const token = localStorage.getItem('google_access_token');
      if (currentUser && !token) {
        // 유저는 있는데 토큰이 없으면 데이터를 못 불러오므로 강제 로그아웃 시키거나 알림
        // 여기서는 안전하게 로그아웃을 유도하는 편이 데이터 꼬임을 방지함
        // 하지만 사용자 편의를 위해 일단 유지하되, DB 훅에서 에러 처리
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      
      if (token) {
        // 🔥 [수정] sessionStorage -> localStorage로 변경 (새로고침/탭닫기 대응)
        localStorage.setItem('google_access_token', token);
      }

      alert(
        "환영합니다, 선생님! 👋\n\n" +
        "데이터는 선생님의 구글 드라이브에 자동 저장됩니다.\n" +
        "드라이브 내 '교무수첩 데이터' 폴더를 삭제하지 마세요!"
      );

    } catch (error) {
      console.error("Login Failed", error);
      alert("로그인 실패: " + error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      // 🔥 로그아웃 시 토큰 삭제
      localStorage.removeItem('google_access_token');
      sessionStorage.removeItem('google_access_token');
    } catch (error) { console.error(error); }
  };

  return { user, loading, login, logout };
}