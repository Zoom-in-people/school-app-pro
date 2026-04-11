import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Users, Calendar, BookOpen, CheckSquare, MessageSquare, Settings, LogOut, ChevronDown, Plus, ClipboardList, Clock, Sparkles, CloudUpload, Loader, Menu, StickyNote } from 'lucide-react'; 
import { backupToGoogleDrive } from '../../hooks/useGoogleDriveDB';
import { useAppStore } from '../../store/useAppStore'; 
import { showToast } from '../../utils/alerts';

export default function Sidebar({ user, logout, handbooks }) {
  const store = useAppStore(); 
  const isSidebarOpen = store.isSidebarOpen;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [isBackingUp, setIsBackingUp] = useState(false); 
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false); }
    document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleManualBackup = async () => { setIsBackingUp(true); const r = await backupToGoogleDrive(); showToast(r.message, r.success?'success':'error'); setIsBackingUp(false); };
  const sortedHandbooks = [...handbooks].sort((a, b) => b.title.localeCompare(a.title));

  const menuGroups = [
    { title: "메인", items: [{ id: 'dashboard', label: '대시보드', icon: LayoutDashboard }, { id: 'monthly', label: '월별행사/출결', icon: Calendar }, { id: 'memos', label: '포스트잇 메모장', icon: StickyNote }] },
    { title: "학급 관리", items: [{ id: 'students_homeroom', label: '학생 명렬표 (우리반)', icon: Users }, { id: 'consultation', label: '상담 일지', icon: MessageSquare }] },
    { title: "수업 관리", items: [{ id: 'students_subject', label: '학생 명렬표 (교과)', icon: Users }, { id: 'lessons', label: '진도 관리', icon: BookOpen }, { id: 'my_timetable', label: '나의 시간표', icon: Clock }] },
    { title: "행정/업무", items: [{ id: 'tasks', label: '업무 체크리스트', icon: CheckSquare }, { id: 'meeting_logs', label: '회의록', icon: ClipboardList }, { id: 'ai_record', label: 'AI세특 작성', icon: Sparkles }] }
  ];

  return (
    <aside className="bg-white dark:bg-gray-800 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 transition-colors">
      <div className={`p-4 border-b border-gray-200 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-3'}`}>
        <div className={`flex items-center gap-3 ${isSidebarOpen ? 'flex-1 min-w-0' : ''}`}><img src={user?.photoURL||'https://www.google.com/favicon.ico'} alt="P" className="w-9 h-9 rounded-full shrink-0" />{isSidebarOpen && <div className="flex-1 min-w-0"><p className="font-bold truncate text-sm">{user?.displayName || '선생님'}</p><p className="text-xs text-gray-500 truncate">{user?.email}</p></div>}</div>
        <button onClick={() => store.setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-gray-100 rounded-lg hidden md:block shrink-0 text-gray-500"><Menu size={20} /></button>
      </div>

      <div className="p-3 shrink-0">
        {isSidebarOpen ? (
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-gray-50 border rounded-lg px-2 py-1.5 text-left"><span className="font-bold text-xs truncate">{store.currentHandbook ? store.currentHandbook.title : '선택'}</span><ChevronDown size={14}/></button>
            {isDropdownOpen && <div className="absolute top-full left-0 w-full pt-1 z-20"><div className="bg-white border rounded-lg shadow-xl"><div className="max-h-60 overflow-y-auto py-1">{sortedHandbooks.map(h => <button key={h.id} onClick={() => { store.selectHandbook(h); setIsDropdownOpen(false); }} className="w-full text-left px-2 py-2 text-xs hover:bg-gray-50">{h.title}</button>)}<button onClick={() => { store.setIsAddHandbookOpen(true); setIsDropdownOpen(false); }} className="w-full text-left px-2 py-2 text-xs text-indigo-600 hover:bg-indigo-50 font-bold"><Plus size={12} className="inline"/> 새 교무수첩</button></div></div></div>}
          </div>
        ) : (<div className="flex justify-center"><button onClick={() => store.setIsSidebarOpen(true)} className="p-2 bg-gray-50 border rounded-lg"><BookOpen size={16} className="text-gray-500"/></button></div>)}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
        {menuGroups.map((group, index) => (
          <React.Fragment key={index}>
            {group.title === "메인" && <div className="mb-6 px-1"><button onClick={handleManualBackup} disabled={isBackingUp} className={`w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-xs font-bold ${isSidebarOpen ? 'px-4' : 'px-0'}`}>{isBackingUp ? <Loader size={16} className="animate-spin shrink-0"/> : <CloudUpload size={16} className="shrink-0"/>}{isSidebarOpen && <span>백업</span>}</button></div>}
            <div>
              {isSidebarOpen && <h3 className="px-3 text-[10px] font-extrabold text-gray-400 mb-1.5">{group.title}</h3>}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = store.activeView === item.id;
                  return <button key={item.id} onClick={() => store.setActiveView(item.id)} title={!isSidebarOpen ? item.label : ''} className={`w-full flex items-center gap-2.5 py-2 rounded-lg font-medium text-sm ${isSidebarOpen ? 'px-3' : 'px-0 justify-center'} ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><item.icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />{isSidebarOpen && <span className="truncate">{item.label}</span>}</button>
                })}
              </div>
            </div>
          </React.Fragment>
        ))}
      </nav>

      <div className="p-3 border-t shrink-0 space-y-2">
        <button onClick={() => store.setActiveView('unified_settings')} title={!isSidebarOpen ? '통합 설정' : ''} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold transition text-sm ${store.activeView === 'unified_settings' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Settings size={18}/>{isSidebarOpen && <span>통합 설정</span>}</button>
      </div>
    </aside>
  );
}