import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, Save, CheckCircle, ExternalLink, Code } from 'lucide-react';

export default function RealtimeSetup() {
  const [configText, setConfigText] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const existingConfig = localStorage.getItem('custom_firebase_config');
    if (existingConfig) {
      setConfigText(existingConfig);
    }
  }, []);

  const handleSave = () => {
    if (configText.trim() === '') {
      if (window.confirm('설정을 비우고 저장하시면 기본 모드(구글 드라이브)로 돌아갑니다. 진행하시겠습니까?')) {
        localStorage.removeItem('custom_firebase_config');
        alert('기본 모드로 돌아갑니다. 새로고침 됩니다.');
        window.location.reload();
      }
      return;
    }

    if (!configText.includes('apiKey') || !configText.includes('projectId')) {
      alert('입력하신 텍스트에 올바른 Firebase 설정(apiKey, projectId 등)이 포함되어 있지 않습니다.');
      return;
    }

    localStorage.setItem('custom_firebase_config', configText);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    
    if (window.confirm('Firebase 설정이 저장되었습니다! 실시간 통신 모드를 적용하기 위해 새로고침 하시겠습니까?')) {
      window.location.reload();
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Database className="text-indigo-600"/> 실시간 버전 만들기 (Pro)
        </h2>
        <p className="text-gray-500 dark:text-gray-400">나만의 개인 Firebase 데이터베이스를 연결하여 완벽한 실시간 동기화를 구축합니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 좌측: 안내 및 경고 영역 */}
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0" size={28} />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-300 text-lg mb-2">경고: 이 방법은 다소 어렵습니다.</h3>
              <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                이 방법은 PC와 스마트폰 등 여러 기기에서 <strong>0.1초 단위로 완벽하게 실시간 동기화</strong>되는 수첩을 만들어주지만, 
                선생님께서 직접 구글 클라우드(Firebase) 프로젝트를 생성해야 하므로 컴퓨터에 익숙하지 않으시다면 설정을 권장하지 않습니다.<br/><br/>
                * 설정을 하지 않아도 기본 제공되는 '구글 드라이브 연동 모드'로 훌륭하게 작동합니다.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20}/> Firebase 구축 가이드
            </h3>
            <ol className="space-y-6 text-sm text-gray-700 dark:text-gray-300 relative border-l-2 border-indigo-100 dark:border-gray-700 ml-3 pl-6">
              <li className="relative">
                <span className="absolute -left-[35px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">1</span>
                <p className="font-bold text-base mb-1 text-gray-900 dark:text-gray-100">Firebase 콘솔 접속 및 프로젝트 생성</p>
                <p className="mb-2">아래 링크로 접속하여 새 프로젝트를 만듭니다. (구글 애널리틱스 활성화 해제 권장)</p>
                <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-bold bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-lg">
                  Firebase Console 열기 <ExternalLink size={14}/>
                </a>
              </li>
              <li className="relative">
                <span className="absolute -left-[35px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">2</span>
                <p className="font-bold text-base mb-1 text-gray-900 dark:text-gray-100">Firestore Database 생성</p>
                <p>왼쪽 메뉴에서 <strong>Firestore Database</strong>를 클릭하고 <strong>'데이터베이스 만들기'</strong>를 누릅니다.<br/>보안 규칙은 <strong>'테스트 모드에서 시작'</strong>을 선택하고 위치는 <strong>'asia-northeast3 (Seoul)'</strong>로 설정합니다.</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[35px] bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm">3</span>
                <p className="font-bold text-base mb-1 text-gray-900 dark:text-gray-100">웹 앱 추가 및 설정 복사</p>
                <p>프로젝트 개요(홈)로 돌아와서 <strong>&lt;/&gt; (웹)</strong> 아이콘을 클릭해 앱을 등록합니다.<br/>나타나는 코드 중에서 <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-red-500 font-mono">const firebaseConfig = &#123; ... &#125;;</code> 부분을 복사합니다.</p>
              </li>
            </ol>
          </div>
        </div>

        {/* 우측: 설정 입력 영역 */}
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700 flex flex-col h-full">
          <h3 className="font-bold text-xl mb-2 dark:text-white flex items-center gap-2">
            <Code className="text-indigo-600" size={24}/> 나의 Firebase 설정 입력
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">가이드 3번에서 복사한 <code className="font-mono text-xs">firebaseConfig</code> 안의 내용을 아래에 그대로 붙여넣어 주세요.</p>
          
          <div className="flex-1 flex flex-col relative group">
            <textarea 
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={`{\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app-123",\n  storageBucket: "my-app-123.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef..."\n}`}
              className="w-full flex-1 p-5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-inner"
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              * 입력하신 정보는 선생님의 브라우저에만 안전하게 보관됩니다.
            </p>
            <button 
              onClick={handleSave} 
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${isSaved ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {isSaved ? <><CheckCircle size={20}/> 저장 완료!</> : <><Save size={20}/> 설정 저장 및 적용</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}