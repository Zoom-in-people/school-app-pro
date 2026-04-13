import React, { useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Users, CheckSquare, Clock, Settings2, LayoutDashboard, X, GripHorizontal, Calendar, BookOpen, AlertCircle, CloudSun, Target, StickyNote } from 'lucide-react';
import LunchWidget from '../components/widgets/LunchWidget';
import ClassTimetableWidget from '../components/widgets/ClassTimetableWidget'; 
import MonthlyWidget from '../components/widgets/MonthlyWidget';
import WeatherWidget from '../components/widgets/WeatherWidget';
import DdayWidget from '../components/widgets/DdayWidget';
import MemoWidget from '../components/widgets/MemoWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard({ students, todos, setActiveView, schoolInfo, isHomeroom, attendanceLog, myTimetable, lessonGroups, events, widgets, setWidgets }) {
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false); 
  const currentWidgets = widgets || { attendance: true, tasks: true, timetable: true, classTimetable: true, lunch: true, lessons: true, schoolSchedule: true, weather: true, dday: true, memo: true };

  const defaultLayouts = {
    lg: [
      { i: 'weather', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
      { i: 'dday', x: 2, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'memo', x: 5, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      { i: 'attendance', x: 8, y: 0, w: 4, h: 2, minW: 4, minH: 2 },
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

  const [layouts, setLayouts] = useState(() => { const saved = localStorage.getItem('dashboardLayouts'); return saved ? JSON.parse(saved) : defaultLayouts; });
  const handleLayoutChange = (layout, allLayouts) => { setLayouts(allLayouts); localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts)); };
  const toggleWidget = (key) => setWidgets({ ...currentWidgets, [key]: !currentWidgets[key] });

  const d = new Date(); const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const days = ['일', '월', '화', '수', '목', '금', '토']; const todayDay = days[d.getDay()];

  const todayLogs = attendanceLog?.filter(log => log.date === todayStr) || [];
  const absentCount = todayLogs.filter(l => l.type?.includes('결')).length;
  const lateCount = todayLogs.filter(l => l.type?.includes('지')).length;
  const earlyCount = todayLogs.filter(l => l.type?.includes('조')).length;

  const pendingTasks = todos?.filter(t => !t.done) || [];
  const currentTimetable = Array.isArray(myTimetable) && myTimetable.length > 0 ? myTimetable[0] : (myTimetable || null);
  const todayTimetable = [];
  if (currentTimetable?.schedule) { for (let i = 1; i <= 10; i++) { const key = `${i}-${todayDay}`; if (currentTimetable.schedule[key]) todayTimetable.push({ period: i, ...currentTimetable.schedule[key] }); } }

  const WidgetHeader = ({ title, icon, colorClass, linkAction, linkText }) => (
    <div className="drag-handle cursor-move bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0 group">
      <h3 className="font-bold flex items-center gap-2 text-gray-800 dark:text-white text-sm"><span className={colorClass}>{icon}</span> {title}</h3>
      <div className="flex items-center gap-3">{linkAction && <button onClick={(e) => { e.stopPropagation(); linkAction(); }} className="text-xs text-gray-500 hover:text-indigo-600 font-bold transition">{linkText}</button>} <GripHorizontal size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" /></div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0 mb-3 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold dark:text-white flex items-center gap-2"><LayoutDashboard className="text-indigo-600" size={20}/> 대시보드</h2>
          <p className="text-xs text-gray-500 hidden sm:block mt-0.5">위젯을 자유롭게 배치해보세요.</p>
        </div>
        <button onClick={() => setIsWidgetModalOpen(true)} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition"><Settings2 size={16}/> 설정</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-20">
        <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={60} onLayoutChange={handleLayoutChange} draggableHandle=".drag-handle" margin={[16, 16]} measureBeforeMount={true} >
          
          {currentWidgets.weather && (
            <div key="weather" className="rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden relative">
              <div className="drag-handle cursor-move absolute top-2 right-2 z-50 p-1 bg-black/20 hover:bg-black/40 text-white rounded opacity-0 group-hover:opacity-100 transition"><GripHorizontal size={14} /></div>
              <WeatherWidget schoolInfo={schoolInfo} />
            </div>
          )}

          {currentWidgets.dday && (
            <div key="dday" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-gray-50 dark:bg-gray-700/50 px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center group"><h3 className="font-bold flex items-center gap-1.5 text-red-500 text-xs"><Target size={14}/> D-Day</h3><GripHorizontal size={14} className="text-gray-400 group-hover:text-red-400" /></div>
              <DdayWidget />
            </div>
          )}

          {currentWidgets.memo && (
            <div key="memo" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-gray-50 dark:bg-gray-700/50 px-3 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center group"><h3 className="font-bold flex items-center gap-1.5 text-yellow-600 text-xs"><StickyNote size={14}/> 포스트잇 메모</h3><GripHorizontal size={14} className="text-gray-400 group-hover:text-yellow-500" /></div>
              <MemoWidget setActiveView={setActiveView} />
            </div>
          )}

          {isHomeroom && currentWidgets.attendance && (
            <div key="attendance" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="우리 반 출결 현황 (오늘)" icon={<Users size={16}/>} colorClass="text-indigo-500" linkAction={() => setActiveView('monthly')} linkText="출결 관리 가기" />
              {/* 🔥 원클릭 화면 전환 기능 적용 */}
              <div onClick={() => setActiveView('monthly')} className="flex-1 p-2 sm:p-4 flex items-center justify-between overflow-x-auto custom-scrollbar cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700"><p className="text-[10px] sm:text-xs font-bold text-gray-500">총원</p><p className="text-lg sm:text-2xl font-black text-indigo-600">{students?.length || 0}</p></div>
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700"><p className="text-[10px] sm:text-xs font-bold text-gray-500">결석</p><p className={`text-lg sm:text-2xl font-black ${absentCount > 0 ? 'text-red-500' : 'text-gray-300 dark:text-gray-600'}`}>{absentCount}</p></div>
                <div className="flex-1 text-center border-r border-gray-100 dark:border-gray-700"><p className="text-[10px] sm:text-xs font-bold text-gray-500">지각</p><p className={`text-lg sm:text-2xl font-black ${lateCount > 0 ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}>{lateCount}</p></div>
                <div className="flex-1 text-center"><p className="text-[10px] sm:text-xs font-bold text-gray-500">조퇴</p><p className={`text-lg sm:text-2xl font-black ${earlyCount > 0 ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}>{earlyCount}</p></div>
              </div>
            </div>
          )}

          {currentWidgets.tasks && (
            <div key="tasks" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 업무 (${pendingTasks.length})`} icon={<CheckSquare size={16}/>} colorClass="text-green-500" linkAction={() => setActiveView('tasks')} linkText="전체보기" />
              {/* 🔥 원클릭 화면 전환 기능 적용 */}
              <div onClick={() => setActiveView('tasks')} className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                {pendingTasks.length > 0 ? pendingTasks.map(t => (<div key={t.id} className="p-3 bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"><div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div> <span className="truncate">{t.title}</span></div>)) : <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><CheckSquare size={32} className="opacity-20"/><p className="text-sm font-bold">남은 업무가 없습니다.</p></div>}
              </div>
            </div>
          )}

          {currentWidgets.timetable && (
            <div key="timetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 수업 (${todayDay}요일)`} icon={<Clock size={16}/>} colorClass="text-blue-500" linkAction={() => setActiveView('my_timetable')} linkText="시간표로" />
              {/* 🔥 원클릭 화면 전환 기능 적용 */}
              <div onClick={() => setActiveView('my_timetable')} className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                {todayTimetable.length > 0 ? todayTimetable.map(cls => (<div key={cls.period} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50"><span className="font-extrabold text-blue-600 dark:text-blue-400 w-12 shrink-0 text-center">{cls.period}교시</span><div className="flex-1 font-bold text-gray-800 dark:text-gray-200 truncate">{cls.subject}</div></div>)) : <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><Clock size={32} className="opacity-20"/><p className="text-sm font-bold">오늘은 수업이 없습니다.</p></div>}
              </div>
            </div>
          )}

          {currentWidgets.classTimetable && (
            <div key="classTimetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center group"><h3 className="font-bold flex items-center gap-2 text-white text-sm"><Calendar size={16}/> 각 반 시간표 (NEIS)</h3><GripHorizontal size={16} className="text-white/50 group-hover:text-white" /></div>
              <div className="flex-1 h-full relative"><ClassTimetableWidget schoolInfo={schoolInfo} /></div>
            </div>
          )}

          {currentWidgets.lunch && (
            <div key="lunch" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-orange-50 dark:bg-orange-900/30 px-4 py-3 flex justify-between items-center border-b border-orange-100 dark:border-orange-800/50 group"><h3 className="font-bold flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm">🍽️ 오늘의 급식</h3><GripHorizontal size={16} className="text-orange-400/50 group-hover:text-orange-600" /></div>
              <div className="flex-1 h-full p-2"><LunchWidget schoolInfo={schoolInfo} /></div>
            </div>
          )}

          {currentWidgets.schoolSchedule && (
            <div key="schoolSchedule" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-teal-50 dark:bg-teal-900/30 px-4 py-3 flex justify-between items-center border-b border-teal-100 dark:border-teal-800/50 group"><h3 className="font-bold flex items-center gap-2 text-teal-700 dark:text-teal-400 text-sm"><Calendar size={16}/> 이번 달 학사일정/행사</h3><GripHorizontal size={16} className="text-teal-400/50 group-hover:text-teal-600" /></div>
              {/* 🔥 원클릭 화면 전환 기능 적용 */}
              <div onClick={() => setActiveView('monthly')} className="flex-1 h-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"><MonthlyWidget schoolInfo={schoolInfo} customEvents={events} /></div>
            </div>
          )}

          {currentWidgets.lessons && (
            <div key="lessons" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="진도 현황 요약" icon={<BookOpen size={16}/>} colorClass="text-pink-500" linkAction={() => setActiveView('lessons')} linkText="전체보기" />
              {/* 🔥 원클릭 화면 전환 기능 적용 */}
              <div onClick={() => setActiveView('lessons')} className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2 custom-scrollbar cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                {lessonGroups?.length > 0 ? lessonGroups.map(grp => (
                  <div key={grp.id} className="p-3 bg-white dark:bg-gray-700/30 rounded-xl border border-pink-100 dark:border-pink-900/30 shadow-sm flex flex-col gap-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate border-b border-gray-100 dark:border-gray-600 pb-2">{grp.name}</span>
                    <div className="space-y-2 mt-1">
                      {grp.classes?.map(cls => {
                        const completedIdx = [...grp.progressItems].reverse().findIndex(item => grp.status[`${cls.id}_${item}`]);
                        const lastCompleted = completedIdx >= 0 ? grp.progressItems[grp.progressItems.length - 1 - completedIdx] : '없음';
                        const firstPendingIdx = grp.progressItems.findIndex(item => !grp.status[`${cls.id}_${item}`]);
                        const nextPending = firstPendingIdx >= 0 ? grp.progressItems[firstPendingIdx] : '모두 완료';
                        return (
                          <div key={cls.id} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate w-40 text-center shrink-0">{cls.name}</span>
                            <div className="flex items-center gap-2 flex-1 justify-end truncate ml-2">
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
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
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
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0"><h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings2 className="text-indigo-500"/> 위젯 설정</h3><button onClick={() => setIsWidgetModalOpen(false)} className="text-gray-400"><X/></button></div>
            <button onClick={() => { localStorage.removeItem('dashboardLayouts'); window.location.reload(); }} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl mb-4">크기 및 배치 초기화하기</button>
            <div className="space-y-3 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-1 border-t border-gray-100 dark:border-gray-700 pt-4">
              {[
                { key: 'weather', icon: CloudSun, color: 'text-sky-500', label: '실시간 날씨 및 대기질' },
                { key: 'dday', icon: Target, color: 'text-red-500', label: 'D-Day 디데이' },
                { key: 'memo', icon: StickyNote, color: 'text-yellow-600', label: '포스트잇 메모 모음' },
                { key: 'attendance', icon: Users, color: 'text-indigo-500', label: '우리 반 출결' },
                { key: 'tasks', icon: CheckSquare, color: 'text-green-500', label: '나의 업무' },
                { key: 'timetable', icon: Clock, color: 'text-blue-500', label: '나의 수업' },
                { key: 'classTimetable', icon: Calendar, color: 'text-indigo-600', label: '각 반 시간표 (NEIS)' },
                { key: 'lunch', icon: BookOpen, color: 'text-orange-500', label: '오늘의 급식' },
                { key: 'schoolSchedule', icon: Calendar, color: 'text-teal-500', label: '이번 달 일정 달력' },
                { key: 'lessons', icon: LayoutDashboard, color: 'text-pink-500', label: '진도 현황' },
              ].map(w => (
                <label key={w.key} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-600 rounded-xl cursor-pointer">
                  <span className="font-bold flex items-center gap-2 dark:text-gray-200"><w.icon size={16} className={w.color}/> {w.label}</span>
                  <input type="checkbox" checked={currentWidgets[w.key] ?? false} onChange={() => toggleWidget(w.key)} className="w-5 h-5 accent-indigo-600"/>
                </label>
              ))}
            </div>
            <button onClick={() => setIsWidgetModalOpen(false)} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}