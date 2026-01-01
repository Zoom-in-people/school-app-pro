import React from 'react';
import { X, Moon, Sun, Monitor, Key } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, setSettings, onOpenSetupWizard }) {
  if (!isOpen) return null;

  const { apiKey, theme, fontSize } = settings;
  const { setTheme, setFontSize } = setSettings;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">환경 설정</h2>
          <button onClick={onClose}><X className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* 1. API 키 설정 (버튼형) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Gemini API 키</label>
            <button 
              onClick={onOpenSetupWizard}
              className={`w-full p-4 border rounded-xl flex items-center justify-between group transition ${apiKey ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${apiKey ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-200' : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}>
                  <Key size={20}/>
                </div>
                <div className="text-left">
                  <p className={`font-bold text-sm ${apiKey ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {apiKey ? "API 키가 등록됨" : "API 키 등록하기"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {apiKey ? "클릭하여 수정하거나 확인할 수 있습니다." : "AI 기능을 사용하려면 키를 등록하세요."}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-white dark:bg-gray-800 border px-2 py-1 rounded text-gray-500 group-hover:text-indigo-600 transition">
                설정 &gt;
              </span>
            </button>
          </div>

          <hr className="dark:border-gray-700"/>

          {/* 2. 테마 설정 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">화면 테마</label>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {['light', 'dark', 'system'].map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition ${theme === t ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {t === 'light' && <><Sun size={14}/> 라이트모드</>}
                  {t === 'dark' && <><Moon size={14}/> 다크모드</>}
                  {t === 'system' && <><Monitor size={14}/> 시스템</>}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 글자 크기 (5단계 복구) */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">글자 크기</label>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {['xsmall', 'small', 'normal', 'large', 'xlarge'].map(s => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition ${fontSize === s ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  {s === 'xsmall' && '아주작게'}
                  {s === 'small' && '작게'}
                  {s === 'normal' && '보통'}
                  {s === 'large' && '크게'}
                  {s === 'xlarge' && '아주크게'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}