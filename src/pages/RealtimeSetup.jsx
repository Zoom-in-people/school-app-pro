import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, Save, CheckCircle, ExternalLink, Code, Loader } from 'lucide-react';

export default function RealtimeSetup() {
  const [configText, setConfigText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // 로딩 상태 추가

  useEffect(() => {
    const existingConfig = localStorage.getItem('custom_firebase_config');
    if (existingConfig) {
      setConfigText(existingConfig);
    }
  }, []);

  // 🔥 구글 드라이브를 통해 다른 기기(스마트폰)로 설정 코드를 배달하는 기능
  const syncConfigToDrive = async (text) => {
    const token = localStorage.getItem('google_access_token');
    const folderId = localStorage.getItem('cached_folder_id');
    if (!token || !folderId) return;

    try {
      const q = `'${folderId}' in parents and name='firebase_config.json' and trashed=false`;
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
      const searchData = await searchRes.json();
      const file = new Blob([text], { type: 'application/json' });

      if (searchData.files && searchData.files.length > 0) {
        // 기존 설정 파일 덮어쓰기
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${searchData.files[0].id}?uploadType=media`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: file
        });
      } else {
        // 새 설정 파일 만들기
        const metadata = { name: 'firebase_config.json', parents: [folderId] };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      }
    } catch (e) {
      console.error('Drive sync failed', e);
    }
  };

  const handleSave = async () => {
    if (configText.trim() === '') {
      if (window.confirm('설정을 비우고 저장하시면 기본 모드(구글 드라이브)로 돌아갑니다. 진행하시겠습니까?')) {
        setIsSaving(true);
        await syncConfigToDrive(''); // 빈 내용으로 덮어써서 폰에서도 지워지게 만듦
        localStorage.removeItem('custom_firebase_config');
        alert('기본 모드로 돌아갑니다. 새로고침 됩니다.');
        window.location.reload();
      }
      return;
    }

    if (!configText.includes('apiKey') || !configText.includes('projectId')) {
      alert('입력하신 텍스트에 올바른 Firebase 설정(apiKey, projectId 등)이 포함되어 있지 않습니다. 가이드 5번을 다시 확인해주세요.');
      return;
    }

    setIsSaving(true);
    await syncConfigToDrive(configText); // 드라이브에 비밀 편지 저장
    localStorage.setItem('custom_firebase_config', configText);
    
    setIsSaved(true);
    setIsSaving(false);
    setTimeout(() => setIsSaved(false), 3000);
    
    if (window.confirm('설정이 저장되었으며 스마트폰으로 자동 전달됩니다! 실시간 모드를 적용하기 위해 새로고침 하시겠습니까?')) {
      window.location.reload();
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Database className="text-indigo-600"/> 실시간 버전 만들기 (Pro)
        </h2>
        <p className="text-gray-500 dark:text-gray-400">나만의 개인 데이터베이스를 연결하여 완벽한 0.1초 실시간 동기화를 구축합니다.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-bold text-red-800 dark:text-red-300 text-lg mb-2">경고: 반드시 필요한 분만 진행해주세요.</h3>
              <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">
                이 방법은 PC와 스마트폰 양쪽에서 <strong>동시에 데이터를 수정해도 0.1초 만에 완벽하게 동기화</strong>되는 수첩을 만들어줍니다. 
                하지만 선생님께서 직접 구글 클라우드 시스템을 만들어야 하므로 과정이 다소 복잡할 수 있습니다.<br/><br/>
                <span className="font-bold">* 이 설정을 하지 않으셔도 기본 제공되는 '구글 드라이브 동기화 모드'로 모든 기능을 훌륭하게 사용하실 수 있습니다!</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20}/> 초보자를 위한 Firebase 완벽 가이드
            </h3>
            
            <ol className="space-y-8 text-sm text-gray-700 dark:text-gray-300 relative border-l-2 border-indigo-100 dark:border-gray-700 ml-3 pl-6">
              <li className="relative">
                <span className="absolute -left-[37px] bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md">1</span>
                <p className="font-bold text-base mb-2 text-gray-900 dark:text-gray-100">Firebase 사이트 접속 및 로그인</p>
                <p className="mb-3 leading-relaxed">아래 파란색 버튼을 눌러 Firebase 사이트에 접속한 뒤, 우측 상단의 <strong>[로그인]</strong> 버튼을 눌러 평소 사용하는 구글 계정으로 로그인합니다.</p>
                <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold transition shadow-sm">
                  Firebase 사이트 열기 <ExternalLink size={16}/>
                </a>
              </li>
              <li className="relative">
                <span className="absolute -left-[37px] bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md">2</span>
                <p className="font-bold text-base mb-2 text-gray-900 dark:text-gray-100">새 프로젝트 만들기</p>
                <ul className="list-disc pl-4 space-y-2 leading-relaxed">
                  <li>화면 중앙에 보이는 하얀색 <strong>[프로젝트 추가]</strong> 또는 <strong>[프로젝트 만들기]</strong> 버튼을 누릅니다.</li>
                  <li>프로젝트 이름(예: <code className="bg-gray-100 dark:bg-gray-700 text-pink-600 px-1.5 py-0.5 rounded">my-school-app</code>)을 자유롭게 적고 <strong>[계속]</strong>을 누릅니다.</li>
                  <li>'Google 애널리틱스' 창이 나오면 파란색 스위치를 한 번 눌러 <strong>사용 안함(회색)</strong>으로 끄고 <strong>[프로젝트 만들기]</strong>를 누릅니다. (과정이 훨씬 쉬워집니다.)</li>
                  <li>로딩이 끝나면 <strong>[계속]</strong>을 누릅니다.</li>
                </ul>
              </li>
              <li className="relative">
                <span className="absolute -left-[37px] bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md">3</span>
                <p className="font-bold text-base mb-2 text-gray-900 dark:text-gray-100">데이터베이스(저장소) 개통하기</p>
                <ul className="list-disc pl-4 space-y-2 leading-relaxed">
                  <li>왼쪽 짙은 회색 메뉴 모음에서 <strong>[빌드]</strong>를 누른 뒤, 아래로 열리는 메뉴 중 <strong>[Firestore Database]</strong>를 클릭합니다.</li>
                  <li>화면 중앙의 주황색 <strong>[데이터베이스 만들기]</strong> 버튼을 누릅니다.</li>
                  <li>보안 규칙 창이 뜨면 두 번째에 있는 <strong>[테스트 모드에서 시작]</strong>을 꼭! 체크하고 <strong>[다음]</strong>을 누릅니다.</li>
                  <li>위치 설정 창이 뜨면 목록에서 <strong>[asia-northeast3 (Seoul)]</strong>을 찾아 선택하고 <strong>[사용 설정]</strong>을 누릅니다.</li>
                </ul>
              </li>
              <li className="relative">
                <span className="absolute -left-[37px] bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md">4</span>
                <p className="font-bold text-base mb-2 text-gray-900 dark:text-gray-100">내 앱(수첩) 연결하기</p>
                <ul className="list-disc pl-4 space-y-2 leading-relaxed">
                  <li>왼쪽 메뉴 맨 위에 있는 집 모양 아이콘 <strong>[프로젝트 개요]</strong>를 클릭합니다.</li>
                  <li>화면 중앙에 보이는 여러 동그란 아이콘 중, 세 번째에 있는 <strong>&lt;/&gt; (웹 아이콘)</strong>을 클릭합니다.</li>
                  <li>앱 닉네임 칸에 자유롭게 이름(예: <code className="bg-gray-100 dark:bg-gray-700 text-pink-600 px-1.5 py-0.5 rounded">수첩</code>)을 적고 <strong>[앱 등록]</strong> 버튼을 누릅니다. (밑에 있는 Firebase 호스팅 체크박스는 무시하세요.)</li>
                </ul>
              </li>
              <li className="relative">
                <span className="absolute -left-[37px] bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md">5</span>
                <p className="font-bold text-base mb-2 text-gray-900 dark:text-gray-100">설정 코드 복사 후 붙여넣기</p>
                <ul className="list-disc pl-4 space-y-2 leading-relaxed">
                  <li>잠시 기다리면 화면에 영어로 된 코드가 잔뜩 나타납니다.</li>
                  <li>중간쯤에 있는 <code className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-mono px-2 py-1 rounded font-bold">const firebaseConfig = &#123; ... &#125;;</code> 부분을 찾습니다.</li>
                  <li>중괄호 <strong className="text-red-500 text-lg">&#123;</strong> 부터 <strong className="text-red-500 text-lg">&#125;</strong> 까지 안에 들어있는 영어와 숫자들을 마우스로 드래그해서 <strong>복사(Ctrl+C)</strong>합니다.</li>
                  <li>이제 우측에 있는 빈칸에 <strong>붙여넣기(Ctrl+V)</strong> 한 뒤, 파란색 <strong>[저장]</strong> 버튼을 누르면 완성입니다! 🎉</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700 flex flex-col h-full lg:sticky lg:top-4">
          <h3 className="font-bold text-xl mb-2 dark:text-white flex items-center gap-2">
            <Code className="text-indigo-600" size={24}/> 나의 Firebase 설정 입력
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            가이드 <strong>5번</strong>에서 복사한 코드의 중괄호 <code className="font-bold text-lg">&#123; ... &#125;</code> 내용을 포함하여 아래에 그대로 붙여넣어 주세요.
          </p>
          
          <div className="flex-1 flex flex-col relative group min-h-[300px]">
            <textarea 
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              placeholder={`{\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-app-123",\n  storageBucket: "my-app-123.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef..."\n}`}
              className="w-full flex-1 p-5 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-sm sm:text-base focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none shadow-inner transition-all"
            />
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md text-lg disabled:opacity-70 ${isSaved ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
            >
              {isSaving ? <><Loader className="animate-spin" size={24}/> 클라우드에 연동 중...</> : isSaved ? <><CheckCircle size={24}/> 저장 완료!</> : <><Save size={24}/> 설정 저장 및 적용하기</>}
            </button>
            <p className="text-xs text-gray-400 text-center">
              * 설정은 구글 드라이브를 통해 스마트폰으로 <strong>자동 전달</strong>됩니다.<br/>언제든 지우고 기본 모드로 돌아갈 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}