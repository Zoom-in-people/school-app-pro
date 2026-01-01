import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, ExternalLink, HelpCircle } from 'lucide-react';

export default function SetupWizardModal({ isOpen, onClose, apiKey, setApiKey }) {
  // 🔥 [핵심 수정] 입력 중인 값은 여기서 따로 관리 (바로 저장되지 않음)
  const [localKey, setLocalKey] = useState("");

  // 모달이 열릴 때 기존 키가 있다면 불러옴
  useEffect(() => {
    if (isOpen) {
      setLocalKey(apiKey || "");
    }
  }, [isOpen, apiKey]);

  // 저장 버튼을 눌렀을 때만 부모(App.jsx)에 알림 -> 이때 모달이 닫힘
  const handleSave = () => {
    if (!localKey.trim()) {
      alert("API 키를 입력해주세요!");
      return;
    }
    setApiKey(localKey.trim());
    // onClose는 App.jsx에서 isOpen={!apiKey} 로직에 의해 자동으로 처리됨
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* 헤더 */}
        <div className="bg-indigo-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Key className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">환영합니다, 선생님!</h2>
          <p className="text-indigo-100 text-sm">AI 비서(Gemini)를 사용하기 위해 초기 설정이 필요합니다.</p>
        </div>

        {/* 본문 */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              Google Gemini API 키 입력
              <div className="group relative">
                <HelpCircle size={16} className="text-gray-400 cursor-help"/>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-10 text-center">
                  구글의 AI를 사용하기 위한 암호입니다. 무료로 발급 가능합니다.
                </div>
              </div>
            </label>
            
            {/* 🔥 [수정] 입력 필드 */}
            <input
              type="text"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="AIzaSy..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
            
            <p className="text-xs text-gray-500 dark:text-gray-400">
              * 키가 없으신가요? 
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline ml-1 inline-flex items-center gap-0.5"
              >
                여기서 무료로 발급받기 <ExternalLink size={10}/>
              </a>
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 items-start">
            <CheckCircle className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20}/>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-bold mb-1">안심하세요!</p>
              <p>입력하신 API 키는 서버로 전송되지 않고, 선생님의 브라우저(내 컴퓨터)에만 안전하게 저장됩니다.</p>
            </div>
          </div>

          {/* 🔥 [수정] 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}