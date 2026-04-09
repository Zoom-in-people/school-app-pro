import React, { useState, useEffect } from 'react';
import { Settings, Book, HelpCircle, Database, Info, Grid, X, Search, GraduationCap, Sun, Moon, Monitor, Sparkles, ExternalLink, Save, Trash2 } from 'lucide-react';
import { NEIS_API_KEY, OFFICE_CODES } from '../constants/data';
import { showToast, showConfirm } from '../utils/alerts';
import ExternalApps from './ExternalApps';
import UpdateHistory from './UpdateHistory';
import HowToUse from './HowToUse';
import RealtimeSetup from './RealtimeSetup';

export default function UnifiedSettings({ isOpen, onClose, store, handbook, onUpdateHandbook, onDeleteHandbook }) {
  const [activeTab, setActiveTab] = useState('handbook');

  // 교무수첩 설정 폼 데이터
  const [formData, setFormData] = useState({ 
    title: '', 
    isHomeroom: true,
    schoolInfo: { name: '', code: '', officeCode: '', grade: '1', class: '1' } 
  });
  const [schoolSearchName, setSchoolSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 폰트 사이즈 상태
  const [localFontSize, setLocalFontSize] = useState(16);

  useEffect(() => {
    if (handbook && isOpen) {
      setFormData({
        title: handbook.title || '',
        isHomeroom: handbook.isHomeroom ?? true,
        schoolInfo: {
            name: handbook.schoolInfo?.name || '',
            code: handbook.schoolInfo?.code || '',
            officeCode: handbook.schoolInfo?.officeCode || '',
            grade: String(handbook.schoolInfo?.grade || '1'),
            class: String(handbook.schoolInfo?.class || '1')
        }
      });
      setSchoolSearchName(handbook.schoolInfo?.name || '');
      setSearchResults([]);
    }
    if (isOpen) {
        let size = parseInt(store.fontSize);
        setLocalFontSize(isNaN(size) ? 16 : size);
    }
  }, [handbook, isOpen, store.fontSize]);

  if (!isOpen) return null;

  // NEIS 학교 검색 로직
  const searchSchool = async () => {
    if (schoolSearchName.length < 2) {
      showToast('학교명을 2글자 이상 입력하세요.', 'warning');
      return;
    }
    setIsSearching(true);
    try {
      let allResults = [];
      const officeCodeList = Object.values(OFFICE_CODES);
      const promises = officeCodeList.map(async (officeCode) => {
        try {
          const url = `https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SCHUL_NM=${encodeURIComponent(schoolSearchName)}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.schoolInfo) {
            return data.schoolInfo[1].row.map(s => ({ name: s.SCHUL_NM, code: s.SD_SCHUL_CODE, officeCode: s.ATPT_OFCDC_SC_CODE, address: s.ORG_RDNMA }));
          }
        } catch (e) { return []; }
        return [];
      });
      const results = await Promise.all(promises);
      allResults = results.flat();
      setSearchResults(allResults);
      if (allResults.length === 0) showToast("검색 결과가 없습니다.", 'info');
    } catch (e) { showToast("검색 중 오류가 발생했습니다.", 'error'); } 
    finally { setIsSearching(false); }
  };

  const handleSelectSchool = (school) => {
    setFormData(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, name: school.name, code: school.code, officeCode: school.officeCode } }));
    setSchoolSearchName(school.name);
    setSearchResults([]);
  };

  // 설정 저장
  const handleHandbookSave = (e) => {
    e.preventDefault();
    if (handbook) onUpdateHandbook(handbook.id, formData);
    showToast('설정이 저장되었습니다.');
  };

  // 교무수첩 삭제
  const handleDelete = async () => {
    const isConfirmed = await showConfirm('정말로 삭제하시겠습니까?', '⚠️ 입력한 모든 학생 정보와 상담 기록이 영구적으로 삭제됩니다.', '네, 삭제합니다');
    if (isConfirmed) {
      onDeleteHandbook(handbook.id);
      onClose();
      showToast('교무수첩이 삭제되었습니다.', 'success');
    }
  };

  // 폰트 크기 변경 핸들러
  const handleFontSizeChange = (val) => {
    setLocalFontSize(val); 
    const size = parseInt(val);
    if (!isNaN(size) && size >= 10 && size <= 30) {
      store.setFontSize(size);
    }
  };

  const handleFontSizeBlur = () => {
    let size = parseInt(localFontSize);
    if (isNaN(size) || size < 10) size = 10;
    if (size > 30) size = 30;
    setLocalFontSize(size);
    store.setFontSize(size);
  };

  const tabs = [
    { id: 'handbook', label: '교무수첩/환경 설정', icon: Book },
    { id: 'how_to_use', label: '사용 방법', icon: HelpCircle },
    { id: 'realtime_setup', label: '실시간 버전 만들기', icon: Database },
    { id: 'update_history', label: '업데이트 내역', icon: Info },
    { id: 'apps', label: '다른 교사용 사이트', icon: Grid },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[300] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95">
        
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 shrink-0">
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <Settings className="text-indigo-600"/> 통합 설정
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
            <X size={24} className="text-gray-500 dark:text-gray-400"/>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 px-2 pt-2 sm:px-4 sm:pt-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold transition whitespace-nowrap text-sm sm:text-base border-b-2 ${
                 activeTab === tab.id 
                 ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' 
                 : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
               }`}
             >
               <tab.icon size={18}/> {tab.label}
             </button>
           ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50 relative">
           
           {/* 🔥 기존 교무수첩 설정 + 환경설정 병합 뷰 */}
           {activeTab === 'handbook' && (
              <div className="max-w-2xl mx-auto space-y-8 pb-10">
                <form onSubmit={handleHandbookSave} className="space-y-6">
                   
                   {/* 앱 환경 설정 영역 */}
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                     <h3 className="font-bold text-lg dark:text-white border-b pb-3 dark:border-gray-700">🖥️ 앱 환경 설정</h3>
                     
                     <div className="space-y-3">
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">테마 설정</label>
                       <div className="grid grid-cols-3 gap-3">
                         <button type="button" onClick={() => store.setTheme('light')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${store.theme === 'light' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                           <Sun size={20} className={store.theme === 'light' ? 'text-indigo-600' : ''}/> <span className="text-sm font-bold">라이트</span>
                         </button>
                         <button type="button" onClick={() => store.setTheme('dark')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${store.theme === 'dark' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                           <Moon size={20} className={store.theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : ''}/> <span className="text-sm font-bold">다크</span>
                         </button>
                         <button type="button" onClick={() => store.setTheme('system')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${store.theme === 'system' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                           <Monitor size={20} className={store.theme === 'system' ? 'text-indigo-600' : ''}/> <span className="text-sm font-bold">시스템</span>
                         </button>
                       </div>
                     </div>

                     <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">글자 크기 (1pt 단위)</label>
                       </div>
                       <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                         <input type="range" min="10" max="30" value={localFontSize} onChange={e => handleFontSizeChange(e.target.value)} className="flex-1 accent-indigo-600 cursor-pointer" />
                         <div className="flex items-center gap-1 shrink-0">
                           <input type="number" min="10" max="30" value={localFontSize} onChange={e => handleFontSizeChange(e.target.value)} onBlur={handleFontSizeBlur} className="w-16 p-2 text-lg font-black border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white text-center focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                           <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">pt</span>
                         </div>
                       </div>
                     </div>

                     <div className="space-y-3">
                       <div className="flex justify-between items-center">
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1"><Sparkles className="text-yellow-500" size={16}/> Gemini API Key (선택)</label>
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1">API 키 발급 <ExternalLink size={12}/></a>
                       </div>
                       <input type="password" value={store.apiKey} onChange={(e) => store.setApiKey(e.target.value)} placeholder="AI 기능을 사용하려면 API 키를 입력하세요" className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
                     </div>
                   </div>

                   {/* 교무수첩 설정 영역 */}
                   {handbook && (
                   <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                     <h3 className="font-bold text-lg dark:text-white border-b pb-3 dark:border-gray-700">📘 현재 교무수첩 정보</h3>
                     
                     <div className="space-y-2">
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">교무수첩 이름</label>
                       <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="예: 2026학년도 1학기" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                     </div>

                     <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-600">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300"><GraduationCap size={20}/></div>
                         <div><p className="font-bold text-gray-900 dark:text-white text-sm">담임 선생님이신가요?</p><p className="text-xs text-gray-500 dark:text-gray-400">우리반 관리 기능을 활성화합니다.</p></div>
                       </div>
                       <label className="relative inline-flex items-center cursor-pointer">
                         <input type="checkbox" checked={formData.isHomeroom} onChange={(e) => setFormData({...formData, isHomeroom: e.target.checked})} className="sr-only peer" />
                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                       </label>
                     </div>

                     <div className="space-y-4">
                       <div className="relative">
                         <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학교 설정 (급식/학사일정 연동용)</label>
                         <div className="flex gap-2">
                           <input type="text" value={schoolSearchName} onChange={(e) => setSchoolSearchName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchSchool(); } }} placeholder="학교명 검색 (예: 서울초)" className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                           <button type="button" onClick={searchSchool} disabled={isSearching} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"><Search size={20}/></button>
                         </div>
                         
                         {searchResults.length > 0 && (
                           <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 absolute z-50 w-full shadow-xl custom-scrollbar">
                             {searchResults.map((s, idx) => (
                               <div key={idx} onClick={() => handleSelectSchool(s)} className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-600 last:border-none transition">
                                 <p className="font-bold dark:text-white">{s.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{s.address}</p>
                               </div>
                             ))}
                           </div>
                         )}
                         {formData.schoolInfo.code && <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-bold">✅ 선택됨: {formData.schoolInfo.name}</p>}
                       </div>

                       {formData.isHomeroom && (
                         <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학년</label>
                             <select value={String(formData.schoolInfo.grade)} onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, grade: e.target.value}})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                               {[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={String(g)}>{g}학년</option>)}
                             </select>
                           </div>
                           <div>
                             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">반</label>
                             <select value={String(formData.schoolInfo.class)} onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, class: e.target.value}})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                               {Array.from({length: 20}, (_, i) => i + 1).map(c => <option key={c} value={String(c)}>{c}반</option>)}
                             </select>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                   )}
                   
                   <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2">
                     <Save size={20}/> 모든 설정 저장하기
                   </button>
                </form>

                {handbook && (
                <div className="pt-4 shrink-0">
                  <button type="button" onClick={handleDelete} className="w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-bold border border-transparent hover:border-red-100 dark:hover:border-red-800">
                    <Trash2 size={18}/> 이 교무수첩 삭제하기
                  </button>
                </div>
                )}
              </div>
           )}

           {activeTab === 'how_to_use' && <HowToUse />}
           {activeTab === 'realtime_setup' && <RealtimeSetup />}
           {activeTab === 'update_history' && <UpdateHistory />}
           {activeTab === 'apps' && <ExternalApps />}
        </div>
      </div>
    </div>
  );
}