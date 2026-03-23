import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Check, X, ExternalLink } from 'lucide-react';

export default function SetupWizardModal({ isOpen, onClose, apiKey, setApiKey }) {
  const [localApiKey, setLocalApiKey] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setLocalApiKey(apiKey || '');
      setStep(1);
    }
  }, [isOpen, apiKey]);

  const handleNext = () => {
    if (step === 1) setStep(2);
    else handleComplete();
  };

  const handleComplete = () => {
    if (localApiKey.trim()) {
      setApiKey(localApiKey.trim());
    }
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center relative">
          <button onClick={handleSkip} className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition">
            <X size={20}/>
          </button>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-inner">
            <Sparkles className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">교무수첩 Pro 환영합니다!</h2>
          <p className="text-indigo-100 text-sm">스마트한 학교 업무의 시작, 몇 가지 설정만 완료해주세요.</p>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                AI 도우미 설정 (선택)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                Google의 최신 AI, <strong className="text-indigo-600 dark:text-indigo-400">Gemini</strong>를 연결하여 
                <b>학생 세특 자동 생성, 상담 내용 요약</b> 등의 놀라운 기능을 사용해보세요.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Gemini API Key</label>
                  {/* 🔥 구글 AI 스튜디오 링크 추가 */}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 hover:underline font-bold">
                    <ExternalLink size={12}/> API 키 발급/확인
                  </a>
                </div>
                <input 
                  type="password" 
                  value={localApiKey} 
                  onChange={(e) => setLocalApiKey(e.target.value)} 
                  placeholder="AIzaSy..."
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition font-mono text-sm"
                />
                <p className="text-xs text-gray-400 flex items-start gap-1">
                  <span className="text-red-400">*</span> 
                  입력하신 키는 안전하게 선생님의 브라우저(Local Storage)에만 암호화되어 저장됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center py-6">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="text-green-500" size={48} />
              </div>
              <h3 className="font-bold text-2xl text-gray-800 dark:text-white">모든 준비가 끝났습니다!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                이제 좌측 메뉴에서 '새 교무수첩 만들기'를 눌러<br/>이번 학기 수첩을 생성해주세요.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          {step === 1 && (
            <button onClick={handleSkip} className="flex-1 py-3.5 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition">
              나중에 하기
            </button>
          )}
          <button onClick={handleNext} className="flex-[2] py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
            {step === 1 ? (localApiKey ? '다음 단계로' : '건너뛰고 다음으로') : '시작하기'} <ArrowRight size={18}/>
          </button>
        </div>
      </div>
    </div>
  );
}