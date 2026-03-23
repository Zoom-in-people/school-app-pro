import React from 'react';
import { X, Moon, Sun, Monitor, Type, Key, Save, ExternalLink } from 'lucide-react';
import { showToast } from '../../utils/alerts';

export default function SettingsModal({ isOpen, onClose, settings, setSettings, onOpenSetupWizard }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2"><Settings className="text-indigo-600"/> 환경 설정</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><X size={20} className="text-gray-500 dark:text-gray-400"/></button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2"><Monitor size={16}/> 테마 설정</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSettings.setTheme('light')} className={`p-4 rounded-xl flex flex-col items-center gap-2 transition border-2 ${settings.theme === 'light' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>
                <Sun size={24} className={settings.theme === 'light' ? 'text-indigo-600' : ''}/>
                <span className="font-bold text-sm">라이트 모드</span>
              </button>
              <button onClick={() => setSettings.setTheme('dark')} className={`p-4 rounded-xl flex flex-col items-center gap-2 transition border-2 ${settings.theme === 'dark' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-300'}`}>
                <Moon size={24} className={settings.theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : ''}/>
                <span className="font-bold text-sm">다크 모드</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2"><Type size={16}/> 글자 크기</h3>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
              {[
                { id: 'xsmall', label: '가장작게' },
                { id: 'small', label: '작게' },
                { id: 'normal', label: '보통' },
                { id: 'large', label: '크게' },
                { id: 'xlarge', label: '아주크게' }
              ].map(size => (
                <button key={size.id} onClick={() => setSettings.setFontSize(size.id)} className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-lg transition ${settings.fontSize === size.id ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2"><Key size={16}/> AI 연동</h3>
              {/* 🔥 구글 AI 스튜디오 링크 추가 */}
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 hover:underline font-bold">
                <ExternalLink size={12}/> API 키 발급/확인
              </a>
            </div>
            <div className="space-y-2">
              <input 
                type="password" 
                value={settings.apiKey} 
                onChange={(e) => setSettings.setApiKey(e.target.value)} 
                placeholder="Gemini API Key 입력"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Google Gemini API 키를 입력하면 AI 세특 작성, 내용 요약 등의 스마트 기능을 사용할 수 있습니다.
              </p>
            </div>
            <button onClick={onOpenSetupWizard} className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
              초기 설정 마법사 다시 열기
            </button>
          </div>
        </div>

        <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button onClick={() => { onClose(); showToast('설정이 저장되었습니다.'); }} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm">
            <Save size={18}/> 닫기
          </button>
        </div>
      </div>
    </div>
  );
}