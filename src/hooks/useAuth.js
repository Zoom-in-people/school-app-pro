import { useState, useEffect } from 'react';

// Vercel 환경변수에 등록할 클라이언트 ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 자동 로그인 처리
    const token = localStorage.getItem('google_access_token');
    const userInfo = localStorage.getItem('google_user_info');
    if (token && userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = () => {
    if (!GOOGLE_CLIENT_ID) {
      alert("관리자가 구글 클라이언트 ID를 설정하지 않았습니다.");
      return;
    }
    
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      callback: async (response) => {
        if (response.access_token) {
          localStorage.setItem('google_access_token', response.access_token);
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${response.access_token}` }
            });
            const userInfo = await res.json();
            const userData = {
              uid: userInfo.sub, // 구글 고유 ID
              email: userInfo.email,
              displayName: userInfo.name,
              photoURL: userInfo.picture
            };
            localStorage.setItem('google_user_info', JSON.stringify(userData));
            setUser(userData);
          } catch (e) {
            console.error("유저 정보 가져오기 실패", e);
          }
        }
      },
    });
    client.requestAccessToken();
  };

  const logout = () => {
    localStorage.clear(); // 로그인 정보 및 캐시 완벽 초기화
    setUser(null);
    window.location.reload();
  };

  return { user, loading, login, logout };
}