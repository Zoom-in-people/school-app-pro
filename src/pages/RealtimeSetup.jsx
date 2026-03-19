import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, Save, CheckCircle, ExternalLink, Code, Loader, Edit2, Trash2, X } from 'lucide-react';
import { backupToGoogleDrive } from '../hooks/useGoogleDriveDB';
import { showToast, showAlert, showConfirm } from '../utils/alerts'; // 🔥 알림창 가져오기

export default function RealtimeSetup() {
  const [configText, setConfigText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const existingConfig = localStorage.getItem('custom_firebase_config');
    if (existingConfig) setHasExistingConfig(true);
  }, []);

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
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${searchData.files[0].id}?uploadType=media`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: file });
      } else {
        const metadata = { name: 'firebase_config.json', parents: [folderId] };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);
        await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      }
    } catch (e) { console.error('Drive sync failed', e); }
  };

  const handleSave = async () => {
    if (configText.trim() === '') {
      showToast('Firebase 설정 코드를 입력해주세요.', 'warning');
      return;
    }

    if (!configText.includes('apiKey') || !configText.includes('projectId')) {
      showAlert('설정 오류', '입력하신 텍스트에 올바른 Firebase 설정(apiKey, projectId 등)이 포함되어 있지 않습니다.', 'error');
      return;
    }

    setIsSaving(true);
    await syncConfigToDrive(configText); 
    localStorage.setItem('custom_firebase_config', configText);
    
    setIsSaved(true);
    setIsSaving(false);
    setHasExistingConfig(true);
    setIsEditing(false);
    setTimeout(() => setIsSaved(false), 3000);
    
    // 🔥 예쁜 Confirm 창 적용
    const isConfirmed = await showConfirm('적용 완료!', '실시간 모드를 즉시 적용하기 위해 새로고침 하시겠습니까?', '새로고침', false);
    if (isConfirmed) window.location.reload();
  };

  const handleRemoveConfig = async () => {
    // 🔥 예쁜 Confirm 창 적용
    const isConfirmed = await showConfirm(
      '설정을 제거하시겠습니까?', 
      '제거하기 전 현재 데이터를 구글 드라이브에 안전하게 백업합니다.', 
      '네, 제거합니다'
    );
    
    if (isConfirmed) {
      setIsSaving(true);
      try {
        const result = await backupToGoogleDrive();
        if (!result.success) {
           showToast(result.message, 'warning');
        }
        await syncConfigToDrive(''); 
        localStorage.removeItem('custom_firebase_config');
        
        await showAlert('제거 완료', '구글 드라이브 백업 및 설정 제거가 완료되었습니다. 기본 모드로 돌아갑니다.', 'success');
        window.location.reload();
      } catch(e) {
        showToast('오류가 발생했습니다.', 'error');
        setIsSaving(false);
      }
    }
  };

  const handleEdit = () => { setIsEditing(true); setConfigText(''); };
  const handleCancelEdit = () => { setIsEditing(false); setConfigText(''); };

  // 아래 return 구문은 기존과 완전히 동일합니다!
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
            <Code className="text-indigo-600" size={24}/> 나의 Firebase 설정 관리
          </h3>
          
          {hasExistingConfig && !isEditing ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-10">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle className="text-green-500" size={40} />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Firebase 설정 적용 중</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  현재 실시간 통신 모드가 완벽하게 작동하고 있습니다.<br/>보안을 위해 입력하신 코드는 가림 처리되었습니다.
                </p>
              </div>
              <div className="flex w-full gap-3 mt-8">
                <button onClick={handleEdit} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2">
                  <Edit2 size={18} /> 수정
                </button>
                <button onClick={handleRemoveConfig} disabled={isSaving} className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                  설정 제거
                </button>
              </div>
            </div>
          ) : (
            <>
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
                <div className="flex w-full gap-3">
                  {isEditing && (
                    <button onClick={handleCancelEdit} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2">
                      <X size={20} /> 취소
                    </button>
                  )}
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`flex-[2] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md text-lg disabled:opacity-70 ${isSaved ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  >
                    {isSaving ? <><Loader className="animate-spin" size={24}/> 적용 중...</> : isSaved ? <><CheckCircle size={24}/> 저장 완료!</> : <><Save size={24}/> 설정 저장 및 적용하기</>}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  * 설정은 구글 드라이브를 통해 스마트폰으로 <strong>자동 전달</strong>됩니다.<br/>언제든 지우고 기본 모드로 돌아갈 수 있습니다.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}