import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Calendar, BookOpen, CheckSquare, 
  MessageSquare, FileText, Settings, LogOut, ChevronDown, Plus, FolderOpen 
} from 'lucide-react';

export default function Sidebar({ 
  activeView, setActiveView, onOpenSettings, user, logout, 
  handbooks, currentHandbook, onSelectHandbook, onOpenAddHandbook, onOpenHandbookSettings 
}) {
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 화면 클릭 시 드롭다운 닫기
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

  // 교무수첩 정렬 (최신순)
  const sortedHandbooks = [...handbooks].sort((a, b) => {
    return b.title.localeCompare(a.title);
  });

  // 메뉴 카테고리
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
        { id: 'lessons', label: '수업 시간표', icon: BookOpen },
      ]
    },
    {
      title: "행정/업무",
      items: [
        { id: 'tasks', label: '업무 체크리스트', icon: CheckSquare },
        { id: 'schedule', label: '학사일정', icon: Calendar },
        { id: 'edu_plan', label: '교육계획서 분석', icon: FileText },
        { id: 'materials', label: '자료함 (드라이브)', icon: FolderOpen },
      ]
    },
    // 🔥 [추가] 설정 메뉴를 최하단에 배치
    {
      title: "설정",
      items: [
        // id를 'handbook_settings'로 지정하여 클릭 시 모달이 열리게 함
        { id: 'handbook_settings', label: '교무수첩 설정', icon: Settings },
      ]
    }
  ];

  // 메뉴 클릭 핸들러
  const handleMenuClick = (itemId) => {
    if (itemId === 'handbook_settings') {
      onOpenHandbookSettings(); // 설정 모달 열기
    } else {
      setActiveView(itemId); // 화면 전환
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 h-full flex flex-col border-r border-gray-200 dark:border-gray-700 transition-colors duration-300">
      {/* 프로필 영역 */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
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
        {/* 전체 앱 설정(테마 등) 버튼 */}
        <button onClick={onOpenSettings} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
          <Settings size={16} />
        </button>
      </div>

      {/* 교무수첩 선택 영역 (깔끔하게 정리됨) */}
      <div className="p-3">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 border rounded-lg px-3 py-2.5 text-left transition shadow-sm ${isDropdownOpen ? 'border-indigo-500 ring-1 ring-indigo-200 dark:ring-indigo-900' : 'border-gray-200 dark:border-gray-600 hover:border-indigo-500'}`}
          >
            <span className="font-bold text-sm text-gray-700 dark:text-gray-200 truncate">
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
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition ${currentHandbook?.id === handbook.id ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-700 dark:text-gray-300'}`}
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
                    className="w-full text-left px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold flex items-center gap-2"
                  >
                    <Plus size={12}/> 새 교무수첩 만들기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {menuGroups.map((group, index) => (
          <div key={index}>
            <h3 className="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeView === item.id;
                // 설정 메뉴는 뷰가 활성화되는 것이 아니므로 스타일 처리를 약간 다르게 할 수도 있으나 통일성 유지
                // 'handbook_settings'는 active 상태가 될 수 없으므로(모달이라서) 항상 기본 스타일
                const isSettingsItem = item.id === 'handbook_settings';
                const highlight = !isSettingsItem && isActive;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm ${
                      highlight 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' 
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

      {/* 하단 로그아웃 */}
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