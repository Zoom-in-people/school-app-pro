import React, { useState, useEffect } from 'react';
import { Settings, Book, HelpCircle, Database, Info, Grid, Search, GraduationCap, Sun, Moon, Monitor, Sparkles, ExternalLink, Save, Trash2, ChevronDown, UserCircle, LogOut } from 'lucide-react';
import { NEIS_API_KEY, OFFICE_CODES } from '../constants/data';
import { showToast, showConfirm } from '../utils/alerts';
import ExternalApps from './ExternalApps';
import UpdateHistory from './UpdateHistory';
import HowToUse from './HowToUse';
import RealtimeSetup from './RealtimeSetup';

export default function UnifiedSettings({ store, handbook, onUpdateHandbook, onDeleteHandbook, user, logout }) {
  const [activeTab, setActiveTab] = useState('handbook');

  const [formData, setFormData] = useState({ 
    title: '', isHomeroom: true,
    schoolInfo: { name: '', code: '', officeCode: '', grade: '1', class: '1', address: '' } 
  });
  const [schoolSearchName, setSchoolSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [localFontSize, setLocalFontSize] = useState(16);

  useEffect(() => {
    if (handbook) {
      setFormData({
        title: handbook.title || '', isHomeroom: handbook.isHomeroom ?? true,
        schoolInfo: {
            name: handbook.schoolInfo?.name || '', code: handbook.schoolInfo?.code || '',
            officeCode: handbook.schoolInfo?.officeCode || '', grade: String(handbook.schoolInfo?.grade || '1'), class: String(handbook.schoolInfo?.class || '1'), address: handbook.schoolInfo?.address || ''
        }
      });
      setSchoolSearchName(handbook.schoolInfo?.name || '');
      setSearchResults([]);
    }
    setLocalFontSize(isNaN(parseInt(store.fontSize)) ? 16 : parseInt(store.fontSize));
  }, [handbook, store.fontSize]);

  const searchSchool = async () => {
    if (schoolSearchName.length < 2) return showToast('학교명을 2글자 이상 입력하세요.', 'warning');
    setIsSearching(true);
    try {
      let allResults = [];
      const officeCodeList = Object.values(OFFICE_CODES);
      const promises = officeCodeList.map(async (officeCode) => {
        try {
          const res = await fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SCHUL_NM=${encodeURIComponent(schoolSearchName)}`);
          const data = await res.json();
          if (data.schoolInfo) return data.schoolInfo[1].row.map(s => ({ name: s.SCHUL_NM, code: s.SD_SCHUL_CODE, officeCode: s.ATPT_OFCDC_SC_CODE, address: s.ORG_RDNMA }));
        } catch (e) { return []; } return [];
      });
      allResults = (await Promise.all(promises)).flat();
      setSearchResults(allResults);
      if (allResults.length === 0) showToast("검색 결과가 없습니다.", 'info');
    } catch (e) { showToast("검색 중 오류가 발생했습니다.", 'error'); } finally { setIsSearching(false); }
  };

  const handleSelectSchool = (school) => {
    setFormData(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, name: school.name, code: school.code, officeCode: school.officeCode, address: school.address } }));
    setSchoolSearchName(school.name); setSearchResults([]);
  };

  const handleHandbookSave = (e) => { e.preventDefault(); if (handbook) onUpdateHandbook(handbook.id, formData); showToast('설정이 저장되었습니다.'); };
  const handleDelete = async () => {
    if (await showConfirm('정말로 삭제하시겠습니까?', '모든 정보가 영구 삭제됩니다.', '삭제')) { onDeleteHandbook(handbook.id); }
  };

  const handleFontSizeChange = (val) => { setLocalFontSize(val); const size = parseInt(val); if (!isNaN(size) && size >= 10 && size <= 30) store.setFontSize(size); };
  const handleFontSizeBlur = () => { let size = parseInt(localFontSize); if (isNaN(size) || size < 10) size = 10; if (size > 30) size = 30; setLocalFontSize(size); store.setFontSize(size); };

  const tabs = [
    { id: 'handbook', label: '환경/교무수첩 설정', icon: Book },
    { id: 'account', label: '계정 및 연동 관리', icon: UserCircle },
    { id: 'qa', label: '자주 묻는 질문 (Q&A)', icon: HelpCircle },
    { id: 'realtime_setup', label: '실시간 버전 안내', icon: Database },
    { id: 'update_history', label: '업데이트 내역', icon: Info },
    { id: 'apps', label: '다른 교사용 사이트', icon: Grid },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Settings className="text-indigo-600"/> 통합 설정</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 px-4 sm:px-6 pt-2 sm:pt-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 overflow-x-auto custom-scrollbar shrink-0">
         {tabs.map(tab => (
           <button 
             key={tab.id} onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition whitespace-nowrap text-sm sm:text-base border-b-2 ${
               activeTab === tab.id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
             }`}
           >
             <tab.icon size={18}/> {tab.label}
           </button>
         ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
         
         {activeTab === 'handbook' && (
            <div className="w-full space-y-8 pb-10 animate-in slide-in-from-bottom-4">
              <form onSubmit={handleHandbookSave} className="space-y-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                   <h3 className="font-bold text-lg dark:text-white border-b pb-3 dark:border-gray-700">🖥️ 앱 환경 설정</h3>
                   <div className="space-y-3">
                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">테마 설정</label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       <button type="button" onClick={() => store.setTheme('light')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${store.theme === 'light' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Sun size={20} className={store.theme === 'light' ? 'text-indigo-600' : ''}/> <span className="text-sm font-bold">라이트</span></button>
                       <button type="button" onClick={() => store.setTheme('dark')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${store.theme === 'dark' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:text-indigo-400 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Moon size={20} className={store.theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : ''}/> <span className="text-sm font-bold">다크</span></button>
                       <button type="button" onClick={() => store.setTheme('system')} className={`py-3 rounded-xl flex flex-col items-center gap-1 transition border-2 ${store.theme === 'system' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}><Monitor size={20} className={store.theme === 'system' ? 'text-indigo-600' : ''}/> <span className="text-sm font-bold">시스템</span></button>
                     </div>
                   </div>
                   <div className="space-y-3">
                     <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">글자 크기 (1pt 단위)</label>
                     <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                       <input type="range" min="10" max="30" value={localFontSize} onChange={e => handleFontSizeChange(e.target.value)} className="flex-1 accent-indigo-600 cursor-pointer" />
                       <div className="flex items-center gap-1 shrink-0">
                         <input type="number" min="10" max="30" value={localFontSize} onChange={e => handleFontSizeChange(e.target.value)} onBlur={handleFontSizeBlur} className="w-16 p-2 text-lg font-black border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white text-center focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                         <span className="text-gray-500 font-bold text-sm">pt</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {handbook && (
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                   <h3 className="font-bold text-lg dark:text-white border-b pb-3 dark:border-gray-700">📘 현재 교무수첩 정보</h3>
                   <div className="space-y-2"><label className="block text-sm font-bold text-gray-700 dark:text-gray-300">교무수첩 이름</label><input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" /></div>
                   <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex items-center justify-between border dark:border-gray-600">
                     <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300"><GraduationCap size={20}/></div><div><p className="font-bold text-sm dark:text-white">담임 선생님이신가요?</p><p className="text-xs text-gray-500 dark:text-gray-400">우리반 관리 기능을 활성화합니다.</p></div></div>
                     <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={formData.isHomeroom} onChange={(e) => setFormData({...formData, isHomeroom: e.target.checked})} className="sr-only peer" /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div></label>
                   </div>
                   <div className="space-y-4">
                     <div className="relative">
                       <label className="block text-sm font-bold mb-1 dark:text-white">학교 설정 (급식/학사일정/날씨 연동용)</label>
                       <div className="flex gap-2"><input type="text" value={schoolSearchName} onChange={(e) => setSchoolSearchName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchSchool(); } }} placeholder="학교명 검색 (예: 서울초)" className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" /><button type="button" onClick={searchSchool} disabled={isSearching} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50"><Search size={20}/></button></div>
                       {searchResults.length > 0 && (<div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 absolute z-50 w-full shadow-xl custom-scrollbar">{searchResults.map((s, idx) => (<div key={idx} onClick={() => handleSelectSchool(s)} className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-b dark:border-gray-600 transition"><p className="font-bold dark:text-white">{s.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{s.address}</p></div>))}</div>)}
                       {formData.schoolInfo.code && <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-bold">✅ 선택됨: {formData.schoolInfo.name} ({formData.schoolInfo.address})</p>}
                     </div>
                     {formData.isHomeroom && (
                       <div className="grid grid-cols-2 gap-4">
                         <div><label className="block text-sm font-bold mb-1 dark:text-white">학년</label><select value={String(formData.schoolInfo.grade)} onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, grade: e.target.value}})} className="w-full p-3 border rounded-xl outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none">{[1,2,3,4,5,6].map(g=><option key={g} value={String(g)}>{g}학년</option>)}</select></div>
                         <div><label className="block text-sm font-bold mb-1 dark:text-white">반</label><select value={String(formData.schoolInfo.class)} onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, class: e.target.value}})} className="w-full p-3 border rounded-xl outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white appearance-none">{Array.from({length: 20}, (_, i) => i + 1).map(c=><option key={c} value={String(c)}>{c}반</option>)}</select></div>
                       </div>
                     )}
                   </div>
                 </div>
                 )}
                 <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center gap-2"><Save size={20}/> 모든 설정 저장하기</button>
              </form>
              {handbook && (<div className="pt-4 shrink-0"><button type="button" onClick={handleDelete} className="w-full flex justify-center gap-2 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition"><Trash2 size={18}/> 이 교무수첩 삭제하기</button></div>)}
            </div>
         )}

         {activeTab === 'account' && (
           <div className="w-full space-y-8 pb-10 animate-in slide-in-from-bottom-4">
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center">
               {user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full border-4 border-indigo-100 dark:border-indigo-900/50 mx-auto mb-4 shadow-sm" />
               ) : (
                 <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-3xl mx-auto mb-4 shadow-sm">
                   {user?.email?.[0].toUpperCase()}
                 </div>
               )}
               <h3 className="font-black text-xl text-gray-800 dark:text-white mb-1">{user?.displayName || '선생님'}</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{user?.email}</p>
               <button onClick={logout} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition flex items-center justify-center gap-2 mx-auto shadow-sm">
                 <LogOut size={18}/> 시스템 로그아웃
               </button>
             </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
               <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
                 <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Sparkles className="text-yellow-500" size={18}/> Gemini API Key 설정</h3>
                 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 hover:underline font-bold">API 키 발급 <ExternalLink size={12}/></a>
               </div>
               <input type="password" value={store.apiKey} onChange={(e) => store.setApiKey(e.target.value)} placeholder="AI 기능을 사용하려면 API 키를 입력하세요" className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-yellow-500 outline-none" />
               <p className="text-xs text-gray-500 dark:text-gray-400">명렬표의 AI 세특 생성 기능 등에 사용됩니다. (키는 브라우저에만 안전하게 저장됩니다.)</p>
             </div>
           </div>
         )}

         {activeTab === 'qa' && <QnASection />}
         {activeTab === 'how_to_use' && <HowToUse />}
         {activeTab === 'realtime_setup' && <RealtimeSetup />}
         {activeTab === 'update_history' && <UpdateHistory />}
         {activeTab === 'apps' && <ExternalApps />}
      </div>
    </div>
  );
}

function QnASection() {
  const faqs = [
    { q: "대시보드 위젯이 화면 밖으로 나갔어요!", a: "대시보드 우측 상단의 [설정] 버튼을 누른 뒤, 빨간색 글씨로 된 [크기 및 배치 초기화하기] 버튼을 누르시면 처음 예쁜 상태로 돌아옵니다." },
    { q: "AI 세특 자동 작성은 어떻게 쓰나요?", a: "통합 설정 > 계정 관리 탭에서 발급받은 'Gemini API Key'를 입력하신 후, 학생 명렬표에서 학생의 '태그'나 '특기사항'을 입력하고 우측 하단의 [AI 세특] 버튼을 누르시면 3문장으로 깔끔하게 요약해 줍니다." },
    { q: "학사일정 달력에 NEIS 일정이 안 떠요.", a: "통합 설정 > 교무수첩 설정 탭에서 '학교 설정' 검색을 통해 소속 학교를 정확히 선택하고 저장해 주셔야 NEIS 서버에서 데이터를 가져올 수 있습니다." },
    { q: "앱 데이터를 다른 컴퓨터로 옮길 수 있나요?", a: "네! 사이드바 좌측 하단의 [드라이브 백업] 버튼을 누르시면 선생님의 Google Drive에 데이터가 안전하게 저장됩니다. 다른 컴퓨터에서 로그인 후 동일하게 백업을 불러오실 수 있습니다." },
    { q: "시간표 엑셀 연동이 자꾸 실패합니다.", a: "나이스에서 시간표를 다운로드하실 때 반드시 '교사별 시간표 조회' 메뉴에서 다운로드하신 기본 엑셀(XLSX) 양식을 그대로 올려주셔야 합니다. 양식을 임의로 수정하시면 인식이 어렵습니다." },
    { q: "동네 날씨가 이상하게 나와요.", a: "학교 설정 시 '주소'가 포함된 학교를 명확히 선택하시면 해당 주소를 기반으로 정확한 동네 날씨를 찾아옵니다. (주소가 없으면 교육청 소재지 기준)" }
  ];
  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-4">
      <h3 className="font-bold text-2xl mb-2 dark:text-white flex items-center gap-2"><HelpCircle className="text-indigo-500"/> 무엇을 도와드릴까요?</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">자주 묻는 질문들을 모아두었습니다. 클릭해서 답변을 확인해보세요!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faqs.map((faq, idx) => (
          <details key={idx} className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer h-fit">
            <summary className="font-bold p-5 flex justify-between items-start text-gray-800 dark:text-white outline-none">
              <span className="flex gap-2 leading-snug"><span className="text-indigo-500 font-black">Q.</span> {faq.q}</span>
              <ChevronDown size={18} className="text-gray-400 group-open:rotate-180 transition-transform shrink-0 mt-0.5 ml-2"/>
            </summary>
            <div className="p-5 bg-indigo-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
              <span className="font-bold text-indigo-500 mr-2">A.</span>{faq.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}