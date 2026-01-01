import React from 'react';
import { Settings, X, Moon, Sun, Monitor, Type, Key } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, setSettings }) {
  if (!isOpen) return null;

  const { apiKey, theme, fontSize } = settings;
  const { setApiKey, setTheme, setFontSize } = setSettings;

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col transform transition-all">
        
        {/* 헤더 */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-900 dark:text-white">
            <Settings size={20} className="text-indigo-600" /> 환경 설정
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition">
            <X size={20}/>
          </button>
        </div>

        {/* 내용 스크롤 영역 */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* 1. Gemini API Key 설정 */}
          <section>
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Key size={16} /> AI 연동 설정
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
              <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-200">Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={e => setApiKey(e.target.value)} 
                className="w-full p-3 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="sk-..."
              />
            </div>
          </section>

          {/* 2. 화면 테마 (다크 모드) */}
          <section>
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Monitor size={16} /> 화면 테마
            </h4>
            <div className="flex gap-3">
              <button 
                onClick={() => setTheme('light')} 
                className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-50'}`}
              > 
                <Sun size={24}/> 
                <span className="font-medium">라이트 모드</span>
              </button>
              <button 
                onClick={() => setTheme('dark')} 
                className={`flex-1 p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-gray-700 text-indigo-300 ring-2 ring-indigo-900' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-50'}`}
              > 
                <Moon size={24}/> 
                <span className="font-medium">다크 모드</span>
              </button>
            </div>
          </section>

          {/* 3. 글자 크기 (업데이트됨) */}
          <section>
            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
              <Type size={16} /> 글자 크기
            </h4>
            <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-xl">
              {[
                { val: 'xsmall', label: '아주 작게' },
                { val: 'small', label: '작게' },
                { val: 'normal', label: '기본' }, 
                { val: 'large', label: '크게' }, 
                { val: 'xlarge', label: '아주 크게' }
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={() => setFontSize(opt.val)}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${fontSize === opt.val ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}