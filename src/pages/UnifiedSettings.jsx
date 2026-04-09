import React, { useState } from 'react';
import { Settings, Book, HelpCircle, Database, Info, Grid } from 'lucide-react';
import ExternalApps from './ExternalApps';
import UpdateHistory from './UpdateHistory';
import HowToUse from './HowToUse';
import RealtimeSetup from './RealtimeSetup';

export default function UnifiedSettings({ store }) {
  const [activeTab, setActiveTab] = useState('handbook');

  const tabs = [
    { id: 'handbook', label: '교무수첩 설정', icon: Book },
    { id: 'how_to_use', label: '사용 방법', icon: HelpCircle },
    { id: 'realtime_setup', label: '실시간 버전 만들기', icon: Database },
    { id: 'update_history', label: '업데이트 내역', icon: Info },
    { id: 'apps', label: '다른 교사용 사이트', icon: Grid },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 animate-in fade-in duration-300">
      {/* 상단 탭 네비게이션 */}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-2 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
         {tabs.map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition whitespace-nowrap text-sm sm:text-base ${
               activeTab === tab.id 
               ? 'bg-indigo-600 text-white shadow-md' 
               : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
             }`}
           >
             <tab.icon size={18}/> {tab.label}
           </button>
         ))}
      </div>
      
      {/* 탭 내용 영역 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/20">
         {activeTab === 'handbook' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-lg mx-auto">
               <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                 <Settings size={48} className="text-indigo-500 dark:text-indigo-400"/>
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">교무수첩 상세 설정</h2>
                 <p className="text-gray-500 dark:text-gray-400">학기 이름, 시작/종료일, 학교 정보(NEIS 연동) 등은 기존의 팝업 창에서 안전하게 설정하실 수 있습니다.</p>
               </div>
               <button 
                 onClick={() => store.setIsHandbookSettingsOpen(true)} 
                 className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg hover:shadow-xl flex items-center gap-2"
               >
                 <Book size={20}/> 교무수첩 설정창 열기
               </button>
            </div>
         )}
         {activeTab === 'how_to_use' && <HowToUse />}
         {activeTab === 'realtime_setup' && <RealtimeSetup />}
         {activeTab === 'update_history' && <UpdateHistory />}
         {activeTab === 'apps' && <ExternalApps />}
      </div>
    </div>
  );
}