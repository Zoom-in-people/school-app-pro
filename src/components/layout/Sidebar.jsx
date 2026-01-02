import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, BookOpen, CheckSquare, 
  MessageSquare, FileText, Settings, LogOut, ChevronDown, Plus, FolderOpen, ClipboardList, Clock 
} from 'lucide-react';

export default function Sidebar({ 
  activeView, setActiveView, onOpenSettings, user, logout, 
  handbooks, currentHandbook, onSelectHandbook, onOpenAddHandbook, onOpenHandbookSettings 
}) {
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, loading, loaded, saving, saved
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // 상태 리스너 (저장 완료 & 로딩 완료 처리)
  useEffect(() => {
    const handleSaveStatus = (e) => {
      setSaveStatus(e.detail);
      // 'saved' 또는 'loaded' 상태는 2초 뒤에 자연스럽게 사라지게 함
      if (e.detail === 'saved' || e.detail === 'loaded') {
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    };
    window.addEventListener('db-save-status', handleSaveStatus);
    return () => window.removeEventListener('db-save-status', handleSaveStatus);
  }, []);

  const sortedHandbooks = [...handbooks].sort((a, b) => {
    return b.title.localeCompare(a.title);
  });

  const menuGroups = [
    {
      title: "메인",
      items: [
        { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
        { id: 'monthly', label: '월간행사/일정', icon: Calendar },
      ]
    },
    {
      title: "학급 관리",
      items: [
        { id: 'students_homeroom', label: '학생 명렬표 (우리반)', icon: Users },
        { id: 'consultation', label: '상담 일지', icon: MessageSquare },
      ]
    },
    {
      title: "수업 관리",
      items: [
        { id: 'students_subject', label: '학생 명렬표 (교과)', icon: Users },
        { id: 'lessons', label: '진도 관리', icon: BookOpen },
        { id: 'my_timetable', label: '나의 시간표', icon: Clock }, // [신규]
      ]
    },
    {
      title: "행정/업무",
      items: [
        { id: 'tasks', label: '업무 체크리스트', icon: CheckSquare },
        { id: 'meeting_logs', label: '회의록', icon: ClipboardList }, // [신규]
        { id: 'schedule', label: '학사일정', icon: Calendar },
        { id: 'edu_plan', label: '교육계획서 분석', icon: FileText },
        { id: 'materials', label: '자료함 (드라이브)', icon: FolderOpen },
      ]
    },
    {
      title: "설정",
      items: [
        { id: 'handbook_settings', label: '교무수첩 설정', icon: Settings },
      ]
    }
  ];

  const handleMenuClick = (itemId) => {
    if (itemId === 'handbook_settings') {
      onOpenHandbookSettings(); 
    } else {
      setActiveView(itemId); 
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
            {user?.email?.[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 dark:text-white truncate text-sm">{user?.displayName || '선생님'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
        </div>
        <button onClick={onOpenSettings} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
          <Settings size={16} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 border rounded-lg px-2 py-1.5 text-left transition shadow-sm ${isDropdownOpen ? 'border-indigo-500 ring-1 ring-indigo-200 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-600 hover:border-indigo-500'}`}
          >
            <span className="font-bold text-xs text-gray-700 dark:text-gray-200 truncate">
              {currentHandbook ? currentHandbook.title : '교무수첩 선택'}
            </span>
            <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full pt-1 z-20">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2 overflow-hidden">
                <div className="max-h-60 overflow-y-auto py-1">
                  {sortedHandbooks.map((handbook) => (
                    <button
                      key={handbook.id}
                      onClick={() => {
                        onSelectHandbook(handbook);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition ${currentHandbook?.id === handbook.id ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {handbook.title}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button 
                    onClick={() => {
                      onOpenAddHandbook();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-2 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold flex items-center gap-2"
                  >
                    <Plus size={12}/> 새 교무수첩 만들기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 상태 표시바 */}
        <div className="h-6 mt-1 flex flex-col justify-center">
          {saveStatus === 'loading' && (
            <div className="w-full animate-in fade-in duration-300">
              <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold mb-0.5 px-1">
                <span>데이터 로딩중...</span>
              </div>
              <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gray-400 dark:bg-gray-500 animate-pulse w-full origin-left scale-x-50"></div>
              </div>
            </div>
          )}
          {saveStatus === 'loaded' && (
            <div className="px-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
              <span>✓ 데이터 로딩 완료!</span>
            </div>
          )}
          {saveStatus === 'saving' && (
            <div className="w-full animate-in fade-in duration-300">
              <div className="flex justify-between items-center text-[10px] text-indigo-500 font-bold mb-0.5 px-1">
                <span>저장중...</span>
              </div>
              <div className="h-0.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 animate-pulse w-full origin-left scale-x-50"></div>
              </div>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="px-1 text-[10px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-300">
              <span>✓ 저장 완료</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {menuGroups.map((group, index) => (
          <div key={index}>
            <h3 className="px-3 text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeView === item.id;
                const isSettings = item.id === 'handbook_settings';
                const highlight = !isSettings && isActive;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                      highlight 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <item.icon size={18} className={highlight ? 'text-white' : 'text-gray-500 dark:text-gray-400'} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition text-sm"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </aside>
  );
}