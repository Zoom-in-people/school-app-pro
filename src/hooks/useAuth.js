import { useState, useEffect } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
              uid: userInfo.sub, 
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
    // 🔥 5,6번 요청 해결: 전체 초기화(clear) 대신, 로그인 관련 키값만 핀셋으로 제거하여 위젯/카테고리 설정은 영구 보존!
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_user_info');
    localStorage.removeItem('cached_file_id');
    localStorage.removeItem('cached_folder_id');
    localStorage.removeItem('school_app_local_db');
    localStorage.removeItem('db_last_modified');
    
    setUser(null);
    window.location.reload();
  };

  return { user, loading, login, logout };
}
