import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, Calendar, Users, CheckSquare, FileText, 
  Monitor, BookOpen, UserCog, LogOut, ChevronDown, PlusCircle, LayoutGrid, Cog, FileSearch
} from 'lucide-react';

function SidebarItem({ icon, label, active, onClick, rightElement }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
        active 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {rightElement}
    </button>
  );
}

export default function Sidebar({ 
  activeView, setActiveView, onOpenSettings, user, logout,
  handbooks, currentHandbook, onSelectHandbook, onOpenAddHandbook,
  onOpenHandbookSettings
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (hb) => { onSelectHandbook(hb); setIsDropdownOpen(false); };
  const handleOpenAdd = () => { onOpenAddHandbook(); setIsDropdownOpen(false); };

  const MenuHeader = ({ label }) => (
    <div className="text-xs font-bold text-gray-400 px-4 py-2 mt-4 uppercase tracking-wider">
      {label}
    </div>
  );

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 flex flex-col h-full hidden md:flex transition-colors duration-300 border-r border-gray-200 dark:border-gray-700">
      
      {/* 상단 헤더 */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">교무수첩 Pro</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border transition ${isDropdownOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 dark:border-gray-600 hover:border-indigo-500'}`}>
            <span className="font-bold text-sm text-gray-800 dark:text-white truncate">{currentHandbook ? currentHandbook.title : "수첩을 선택하세요"}</span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}/>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="max-h-48 overflow-y-auto">
                {handbooks.length > 0 ? handbooks.map(hb => (<button key={hb.id} onClick={() => handleSelect(hb)} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${currentHandbook?.id === hb.id ? 'text-indigo-600 font-bold bg-indigo-50 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'}`}>{hb.title}</button>)) : <div className="px-4 py-3 text-xs text-gray-400 text-center">생성된 수첩이 없습니다</div>}
              </div>
              <button onClick={handleOpenAdd} className="w-full text-left px-4 py-3 text-sm text-indigo-600 font-bold hover:bg-indigo-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2"><PlusCircle size={16}/> 새 수첩 만들기</button>
            </div>
          )}
        </div>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar flex flex-col">
        {currentHandbook ? (
          <>
            {/* 0. 공통 상단 */}
            <SidebarItem icon={<Monitor size={20}/>} label="대시보드" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
            <SidebarItem icon={<Calendar size={20}/>} label="월별 일정" active={activeView === 'monthly'} onClick={() => setActiveView('monthly')} />

            {/* 1. 학급 (담임일 때만) */}
            {currentHandbook.isHomeroom && (
              <>
                <MenuHeader label="학급" />
                <SidebarItem icon={<Users size={20}/>} label="학생관리 (담임)" active={activeView === 'students_homeroom'} onClick={() => setActiveView('students_homeroom')} />
                <SidebarItem icon={<UserCog size={20}/>} label="상담 일지" active={activeView === 'consultation'} onClick={() => setActiveView('consultation')} />
              </>
            )}

            {/* 2. 수업 */}
            <MenuHeader label="수업" />
            <SidebarItem icon={<BookOpen size={20}/>} label="학생관리 (수업)" active={activeView === 'students_subject'} onClick={() => setActiveView('students_subject')} />
            <SidebarItem icon={<FileText size={20}/>} label="수업 진도" active={activeView === 'lessons'} onClick={() => setActiveView('lessons')} />
            {/* 비담임일 경우 상담일지가 여기로 이동 */}
            {!currentHandbook.isHomeroom && (
              <SidebarItem icon={<UserCog size={20}/>} label="상담 일지" active={activeView === 'consultation'} onClick={() => setActiveView('consultation')} />
            )}

            {/* 3. 업무 */}
            <MenuHeader label="업무" />
            <SidebarItem icon={<CheckSquare size={20}/>} label="업무 체크" active={activeView === 'tasks'} onClick={() => setActiveView('tasks')} />
            <SidebarItem icon={<FileSearch size={20}/>} label="교육계획서 분석" active={activeView === 'edu_plan'} onClick={() => setActiveView('edu_plan')} />

            {/* 4. 기타 */}
            <MenuHeader label="기타" />
            <SidebarItem icon={<Calendar size={20}/>} label="학사 일정(전체)" active={activeView === 'schedule'} onClick={() => setActiveView('schedule')} />
            <SidebarItem icon={<FileText size={20}/>} label="자료실" active={activeView === 'materials'} onClick={() => setActiveView('materials')} />

            <div className="mt-auto pt-4">
               <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
               <SidebarItem icon={<Cog size={20}/>} label="교무수첩 설정" active={false} onClick={onOpenHandbookSettings} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-4">
            <LayoutGrid size={48} className="mb-4 opacity-20"/>
            <p className="text-sm mb-4">선택된 교무수첩이 없습니다.</p>
            <button onClick={handleOpenAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition">+ 새 수첩 만들기</button>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {user && (
          <div className="flex items-center gap-3 mb-4 bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
            {user.photoURL ? <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{user.displayName ? user.displayName[0] : "T"}</div>}
            <div className="flex-1 overflow-hidden"><p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.displayName}</p><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p></div>
            <button onClick={onOpenSettings} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-600 rounded-lg transition" title="앱 설정"><Settings size={20} /></button>
          </div>
        )}
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-bold"><LogOut size={16} /> 로그아웃</button>
      </div>
    </aside>
  );
}