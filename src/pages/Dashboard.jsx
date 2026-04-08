import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { 
  Users, CheckSquare, Clock, Settings2, 
  LayoutDashboard, X, GripHorizontal, Calendar, BookOpen 
} from 'lucide-react';
import LunchWidget from '../components/widgets/LunchWidget';
import ClassTimetableWidget from '../components/widgets/ClassTimetableWidget'; 

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard({ 
  students, todos, setActiveView, schoolInfo, isHomeroom, 
  myTimetable, lessonGroups, widgets, setWidgets 
}) {
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false); 
  const currentWidgets = widgets || { attendance: true, tasks: true, timetable: true, classTimetable: true, lunch: true, lessons: true };

  // 화면 크기별 위젯 기본 배치 및 최소 크기 설정
  const defaultLayouts = {
    lg: [
      { i: 'attendance', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
      { i: 'tasks', x: 0, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'timetable', x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'classTimetable', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'lunch', x: 0, y: 6, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'lessons', x: 6, y: 6, w: 6, h: 4, minW: 4, minH: 3 }
    ],
    md: [
      { i: 'attendance', x: 0, y: 0, w: 10, h: 2, minW: 5, minH: 2 },
      { i: 'tasks', x: 0, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'timetable', x: 5, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'classTimetable', x: 0, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'lunch', x: 5, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'lessons', x: 0, y: 10, w: 10, h: 4, minW: 4, minH: 3 }
    ],
    sm: [
      { i: 'attendance', x: 0, y: 0, w: 6, h: 2 },
      { i: 'tasks', x: 0, y: 2, w: 6, h: 4 },
      { i: 'timetable', x: 0, y: 6, w: 6, h: 4 },
      { i: 'classTimetable', x: 0, y: 10, w: 6, h: 4 },
      { i: 'lunch', x: 0, y: 14, w: 6, h: 4 },
      { i: 'lessons', x: 0, y: 18, w: 6, h: 4 }
    ]
  };

  const [layouts, setLayouts] = useState(() => {
    const saved = localStorage.getItem('dashboardLayouts');
    return saved ? JSON.parse(saved) : defaultLayouts;
  });

  const handleLayoutChange = (layout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts));
  };

  const handleResetLayout = () => {
    localStorage.removeItem('dashboardLayouts');
    setLayouts(defaultLayouts);
    showToast('위젯 배치가 초기화되었습니다.');
  };

  const toggleWidget = (key) => setWidgets({ ...currentWidgets, [key]: !currentWidgets[key] });

  // ------------------ 데이터 처리 ------------------
  const getTodayInfo = () => {
    const d = new Date();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return { day: days[d.getDay()] };
  };
  const today = getTodayInfo();
  const todayTasks = todos?.filter(t => !t.completed) || [];
  const todayTimetable = [];
  if (myTimetable?.schedule) {
    for (let i = 1; i <= 10; i++) {
      const key = `${i}-${today.day}`;
      if (myTimetable.schedule[key]) todayTimetable.push({ period: i, ...myTimetable.schedule[key] });
    }
  }

  // ------------------ 위젯 헤더(드래그 손잡이) ------------------
  const WidgetHeader = ({ title, icon, colorClass, linkAction, linkText }) => (
    <div className="drag-handle cursor-move bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0 group">
      <h3 className="font-bold flex items-center gap-2 text-gray-800 dark:text-white text-sm">
        <span className={colorClass}>{icon}</span> {title}
      </h3>
      <div className="flex items-center gap-3">
        {linkAction && (
          <button onClick={(e) => { e.stopPropagation(); linkAction(); }} className="text-xs text-gray-500 hover:text-indigo-600 font-bold transition">
            {linkText}
          </button>
        )}
        <GripHorizontal size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 🔹 상단 헤더 */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0 mb-4 z-10">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-indigo-600"/> 대시보드
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            위젯 상단의 회색 타이틀바를 잡고 끌어 배치하거나 우측 하단을 당겨 크기를 조절하세요.
          </p>
        </div>
        <button onClick={() => setIsWidgetModalOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl transition font-bold shadow-sm">
          <Settings2 size={18}/> 설정
        </button>
      </div>

      {/* 🔹 드래그 & 리사이즈 위젯 영역 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-20">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60} 
          onLayoutChange={handleLayoutChange}
          draggableHandle=".drag-handle" 
          margin={[16, 16]}
        >
          
          {/* 출결 위젯 */}
          {isHomeroom && currentWidgets.attendance && (
            <div key="attendance" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="우리 반 출결 현황 (오늘)" icon={<Users size={16}/>} colorClass="text-indigo-500" />
              <div className="flex-1 p-4 overflow-y-auto flex items-center justify-center">
                <div className="w-full flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                   <span className="font-bold text-indigo-800 dark:text-indigo-300 text-lg">총원: {students?.length || 0}명</span>
                   <button onClick={() => setActiveView('monthly')} className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition">출결 관리 가기</button>
                </div>
              </div>
            </div>
          )}

          {/* 나의 업무 위젯 */}
          {currentWidgets.tasks && (
            <div key="tasks" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="해야 할 업무" icon={<CheckSquare size={16}/>} colorClass="text-green-500" linkAction={() => setActiveView('tasks')} linkText="전체보기" />
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {todayTasks.length > 0 ? todayTasks.map(t => (
                  <div key={t.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div> {t.title}
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-6 mt-2">오늘의 업무가 없습니다.</p>}
              </div>
            </div>
          )}

          {/* 나의 수업 위젯 */}
          {currentWidgets.timetable && (
            <div key="timetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 수업 (${today.day})`} icon={<Clock size={16}/>} colorClass="text-blue-500" linkAction={() => setActiveView('my_timetable')} linkText="시간표로" />
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {todayTimetable.length > 0 ? todayTimetable.map(cls => (
                  <div key={cls.period} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 w-10 shrink-0">{cls.period}교시</span>
                    <div className="flex-1 font-bold text-gray-800 dark:text-gray-200 truncate">{cls.subject}</div>
                    {cls.room && <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-600 shrink-0">{cls.room}</span>}
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-6 mt-2">오늘은 수업이 없습니다!</p>}
              </div>
            </div>
          )}

          {/* 각 반 시간표 위젯 */}
          {currentWidgets.classTimetable && (
            <div key="classTimetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              {/* 위젯 자체에 드래그 핸들을 내장하도록 타이틀바 구현 */}
              <div className="drag-handle cursor-move bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center shrink-0 border-b border-indigo-800 group">
                <h3 className="font-bold flex items-center gap-2 text-white text-sm"><Calendar size={16}/> 각 반 시간표 (NEIS)</h3>
                <GripHorizontal size={16} className="text-white/50 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 h-full relative">
                <ClassTimetableWidget schoolInfo={schoolInfo} />
              </div>
            </div>
          )}

          {/* 오늘의 급식 위젯 */}
          {currentWidgets.lunch && (
            <div key="lunch" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-orange-50 dark:bg-orange-900/30 px-4 py-3 flex justify-between items-center shrink-0 border-b border-orange-100 dark:border-orange-800/50 group">
                <h3 className="font-bold flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm">🍽️ 오늘의 급식</h3>
                <GripHorizontal size={16} className="text-orange-400/50 group-hover:text-orange-600 transition-colors" />
              </div>
              <div className="flex-1 h-full relative p-2">
                <LunchWidget schoolInfo={schoolInfo} />
              </div>
            </div>
          )}

          {/* 진도 현황 위젯 */}
          {currentWidgets.lessons && (
            <div key="lessons" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="진도 현황" icon={<BookOpen size={16}/>} colorClass="text-pink-500" linkAction={() => setActiveView('lessons')} linkText="전체보기" />
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2 custom-scrollbar">
                {lessonGroups?.length > 0 ? lessonGroups.map(grp => (
                  <div key={grp.id} className="p-3 bg-pink-50 dark:bg-pink-900/10 rounded-xl border border-pink-100 dark:border-pink-800/30 flex justify-between items-center">
                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{grp.name}</span>
                    <span className="text-xs font-bold bg-white dark:bg-gray-700 px-2 py-1 rounded text-pink-600 dark:text-pink-400 shadow-sm border dark:border-gray-600 shrink-0">진도 확인</span>
                  </div>
                )) : <p className="text-sm text-gray-400 text-center py-6 mt-2">등록된 진도 그룹이 없습니다.</p>}
              </div>
            </div>
          )}

        </ResponsiveGridLayout>
      </div>

      {/* 🔹 위젯 설정 모달 */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings2 className="text-indigo-500"/> 위젯 설정</h3>
              <button onClick={() => setIsWidgetModalOpen(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition"><X size={20}/></button>
            </div>

            {/* 🔥 초기화 버튼 강조 (맨 위로 올림) */}
            <div className="mb-4 shrink-0">
              <button onClick={handleResetLayout} className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition shadow-sm">
                ⚠️ 크기 및 배치 초기화하기
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-1.5">위젯이 겹치거나 화면 밖으로 나갔을 때 눌러주세요.</p>
            </div>
            
            <div className="space-y-3 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-1 border-t border-gray-100 dark:border-gray-700 pt-4">
              {isHomeroom && (
                <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                  <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Users size={16} className="text-indigo-500"/> 우리 반 출결</span>
                  <input type="checkbox" checked={currentWidgets.attendance} onChange={() => toggleWidget('attendance')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                </label>
              )}
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><CheckSquare size={16} className="text-green-500"/> 나의 업무</span>
                <input type="checkbox" checked={currentWidgets.tasks} onChange={() => toggleWidget('tasks')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Clock size={16} className="text-blue-500"/> 나의 수업</span>
                <input type="checkbox" checked={currentWidgets.timetable} onChange={() => toggleWidget('timetable')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Calendar size={16} className="text-indigo-600"/> 각 반 시간표 (NEIS)</span>
                <input type="checkbox" checked={currentWidgets.classTimetable} onChange={() => toggleWidget('classTimetable')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><BookOpen size={16} className="text-orange-500"/> 오늘의 급식</span>
                <input type="checkbox" checked={currentWidgets.lunch} onChange={() => toggleWidget('lunch')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><LayoutDashboard size={16} className="text-pink-500"/> 진도 현황</span>
                <input type="checkbox" checked={currentWidgets.lessons} onChange={() => toggleWidget('lessons')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
            </div>
            
            <div className="shrink-0 flex flex-col gap-2">
              <button onClick={() => setIsWidgetModalOpen(false)} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md">
                설정 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}