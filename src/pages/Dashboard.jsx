import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { 
  Users, CheckSquare, Clock, Settings2, 
  LayoutDashboard, X, GripHorizontal, Calendar, BookOpen, AlertCircle
} from 'lucide-react';
import LunchWidget from '../components/widgets/LunchWidget';
import ClassTimetableWidget from '../components/widgets/ClassTimetableWidget'; 
import SchoolScheduleWidget from '../components/widgets/SchoolScheduleWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard({ 
  students, todos, setActiveView, schoolInfo, isHomeroom, 
  attendanceLog, myTimetable, lessonGroups, widgets, setWidgets 
}) {
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false); 
  
  const currentWidgets = widgets || { attendance: true, tasks: true, timetable: true, classTimetable: true, lunch: true, lessons: true, schoolSchedule: true };

  const defaultLayouts = {
    lg: [
      { i: 'attendance', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
      { i: 'tasks', x: 0, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'timetable', x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'classTimetable', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'lunch', x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'schoolSchedule', x: 4, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      { i: 'lessons', x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 }
    ],
    md: [
      { i: 'attendance', x: 0, y: 0, w: 10, h: 2, minW: 5, minH: 2 },
      { i: 'tasks', x: 0, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'timetable', x: 5, y: 2, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'classTimetable', x: 0, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'lunch', x: 5, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'schoolSchedule', x: 0, y: 10, w: 5, h: 4, minW: 3, minH: 3 },
      { i: 'lessons', x: 5, y: 10, w: 5, h: 4, minW: 3, minH: 3 }
    ],
    sm: [
      { i: 'attendance', x: 0, y: 0, w: 6, h: 2 },
      { i: 'tasks', x: 0, y: 2, w: 6, h: 4 },
      { i: 'timetable', x: 0, y: 6, w: 6, h: 4 },
      { i: 'classTimetable', x: 0, y: 10, w: 6, h: 4 },
      { i: 'lunch', x: 0, y: 14, w: 6, h: 4 },
      { i: 'schoolSchedule', x: 0, y: 18, w: 6, h: 4 }, 
      { i: 'lessons', x: 0, y: 22, w: 6, h: 4 }
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
  };

  const toggleWidget = (key) => setWidgets({ ...currentWidgets, [key]: !currentWidgets[key] });

  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const todayDay = days[d.getDay()];

  const todayLogs = attendanceLog?.filter(log => log.date === todayStr) || [];
  const absentCount = todayLogs.filter(l => l.type?.includes('결')).length;
  const lateCount = todayLogs.filter(l => l.type?.includes('지')).length;
  const earlyCount = todayLogs.filter(l => l.type?.includes('조')).length;
  const otherCount = todayLogs.filter(l => l.type === '기타').length;

  const pendingTasks = todos?.filter(t => !t.done) || [];

  const currentTimetable = Array.isArray(myTimetable) && myTimetable.length > 0 ? myTimetable[0] : (myTimetable || null);
  const todayTimetable = [];
  if (currentTimetable?.schedule) {
    for (let i = 1; i <= 10; i++) {
      const key = `${i}-${todayDay}`;
      if (currentTimetable.schedule[key]) todayTimetable.push({ period: i, ...currentTimetable.schedule[key] });
    }
  }

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
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0 mb-4 z-10">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-indigo-600"/> 대시보드
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            위젯 상단의 타이틀바를 끌어 배치하거나 우측 하단을 당겨 크기를 조절하세요.
          </p>
        </div>
        <button onClick={() => setIsWidgetModalOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl transition font-bold shadow-sm">
          <Settings2 size={18}/> 설정
        </button>
      </div>

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
          
          {isHomeroom && currentWidgets.attendance && (
            <div key="attendance" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="우리 반 출결 현황 (오늘)" icon={<Users size={16}/>} colorClass="text-indigo-500" linkAction={() => setActiveView('monthly')} linkText="출결 관리 가기" />
              <div className="flex-1 p-4 flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 mb-1">총 인원</p>
                  <p className="text-2xl font-black text-indigo-600">{students?.length || 0}</p>
                </div>
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 mb-1">결석</p>
                  <p className={`text-2xl font-black ${absentCount > 0 ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}>{absentCount}</p>
                </div>
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 mb-1">지각</p>
                  <p className={`text-2xl font-black ${lateCount > 0 ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}>{lateCount}</p>
                </div>
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 mb-1">조퇴</p>
                  <p className={`text-2xl font-black ${earlyCount > 0 ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}>{earlyCount}</p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs font-bold text-gray-500 mb-1">기타</p>
                  <p className={`text-2xl font-black ${otherCount > 0 ? 'text-purple-500' : 'text-gray-300 dark:text-gray-600'}`}>{otherCount}</p>
                </div>
              </div>
            </div>
          )}

          {currentWidgets.tasks && (
            <div key="tasks" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 업무 (${pendingTasks.length}개 남음)`} icon={<CheckSquare size={16}/>} colorClass="text-green-500" linkAction={() => setActiveView('tasks')} linkText="전체보기" />
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {pendingTasks.length > 0 ? pendingTasks.map(t => (
                  <div key={t.id} className="p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2 shadow-sm hover:border-green-300 transition">
                    <div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div> <span className="truncate">{t.title}</span>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <CheckSquare size={32} className="opacity-20"/>
                    <p className="text-sm font-bold">남은 업무가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentWidgets.timetable && (
            <div key="timetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 수업 (${todayDay}요일)`} icon={<Clock size={16}/>} colorClass="text-blue-500" linkAction={() => setActiveView('my_timetable')} linkText="시간표로" />
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {todayTimetable.length > 0 ? todayTimetable.map(cls => (
                  <div key={cls.period} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 transition shadow-sm min-w-0">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 w-12 shrink-0 text-center whitespace-nowrap">{cls.period}교시</span>
                    <div className="flex-1 font-bold text-gray-800 dark:text-gray-200 truncate min-w-0">{cls.subject}</div>
                    {cls.room && <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-600 shrink-0 whitespace-nowrap">{cls.room}</span>}
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <Clock size={32} className="opacity-20"/>
                    <p className="text-sm font-bold">오늘은 수업이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentWidgets.classTimetable && (
            <div key="classTimetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center shrink-0 border-b border-indigo-800 group">
                <h3 className="font-bold flex items-center gap-2 text-white text-sm"><Calendar size={16}/> 각 반 시간표 (NEIS)</h3>
                <GripHorizontal size={16} className="text-white/50 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 h-full relative">
                <ClassTimetableWidget schoolInfo={schoolInfo} />
              </div>
            </div>
          )}

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

          {/* 🔥 학사일정 위젯의 타이틀바 디자인 적용 */}
          {currentWidgets.schoolSchedule && (
            <div key="schoolSchedule" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-teal-50 dark:bg-teal-900/30 px-4 py-3 flex justify-between items-center shrink-0 border-b border-teal-100 dark:border-teal-800/50 group">
                <h3 className="font-bold flex items-center gap-2 text-teal-700 dark:text-teal-400 text-sm"><Calendar size={16}/> 이번 달 학사일정</h3>
                <GripHorizontal size={16} className="text-teal-400/50 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="flex-1 h-full relative">
                <SchoolScheduleWidget schoolInfo={schoolInfo} />
              </div>
            </div>
          )}

          {currentWidgets.lessons && (
            <div key="lessons" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="진도 현황 요약" icon={<BookOpen size={16}/>} colorClass="text-pink-500" linkAction={() => setActiveView('lessons')} linkText="전체보기" />
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2 custom-scrollbar">
                {lessonGroups?.length > 0 ? lessonGroups.map(grp => (
                  <div key={grp.id} className="p-3 bg-white dark:bg-gray-700/30 rounded-xl border border-pink-100 dark:border-pink-900/30 shadow-sm flex flex-col gap-2 hover:border-pink-300 transition">
                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate border-b border-gray-100 dark:border-gray-600 pb-2">{grp.name}</span>
                    <div className="space-y-2 mt-1">
                      {grp.classes?.map(cls => {
                        const completedIdx = [...grp.progressItems].reverse().findIndex(item => grp.status[`${cls.id}_${item}`]);
                        const lastCompleted = completedIdx >= 0 ? grp.progressItems[grp.progressItems.length - 1 - completedIdx] : '없음';
                        const firstPendingIdx = grp.progressItems.findIndex(item => !grp.status[`${cls.id}_${item}`]);
                        const nextPending = firstPendingIdx >= 0 ? grp.progressItems[firstPendingIdx] : '모두 완료';
                        return (
                          <div key={cls.id} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate w-16">{cls.name}</span>
                            <div className="flex items-center gap-2 flex-1 justify-end truncate">
                              <span className="text-gray-500 dark:text-gray-400 shrink-0">완료: <span className="font-bold text-pink-600 dark:text-pink-400">{lastCompleted}</span></span>
                              <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                              <span className="text-gray-500 dark:text-gray-400 shrink-0">예정: <span className="font-bold text-indigo-600 dark:text-indigo-400">{nextPending}</span></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <BookOpen size={32} className="opacity-20"/>
                    <p className="text-sm font-bold">등록된 진도 그룹이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </ResponsiveGridLayout>
      </div>

      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings2 className="text-indigo-500"/> 위젯 설정</h3>
              <button onClick={() => setIsWidgetModalOpen(false)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition"><X size={20}/></button>
            </div>

            <div className="mb-4 shrink-0">
              <button onClick={handleResetLayout} className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                <AlertCircle size={16}/> 크기 및 배치 초기화하기
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
                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><Calendar size={16} className="text-teal-500"/> 이번 달 학사일정</span>
                <input type="checkbox" checked={currentWidgets.schoolSchedule} onChange={() => toggleWidget('schoolSchedule')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
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