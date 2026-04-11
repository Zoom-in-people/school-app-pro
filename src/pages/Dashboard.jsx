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
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0 mb-4 z-10">
        <div><h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><LayoutDashboard className="text-indigo-600"/> 대시보드</h2><p className="text-sm text-gray-500 mt-1">위젯을 자유롭게 배치해보세요.</p></div>
        <button onClick={() => setIsWidgetModalOpen(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2.5 rounded-xl font-bold shadow-sm"><Settings2 size={18}/> 설정</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-20">
        <ResponsiveGridLayout className="layout" layouts={layouts} breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }} cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }} rowHeight={60} onLayoutChange={handleLayoutChange} draggableHandle=".drag-handle" margin={[16, 16]}>
          
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
              <div className="flex-1 p-2 sm:p-4 flex items-center justify-between overflow-x-auto custom-scrollbar">
                <div className="flex-1 text-center border-r border-gray-100"><p className="text-[10px] sm:text-xs font-bold text-gray-500">총원</p><p className="text-lg sm:text-2xl font-black text-indigo-600">{students?.length || 0}</p></div>
                <div className="flex-1 text-center border-r border-gray-100"><p className="text-[10px] sm:text-xs font-bold text-gray-500">결석</p><p className={`text-lg sm:text-2xl font-black ${absentCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>{absentCount}</p></div>
                <div className="flex-1 text-center border-r border-gray-100"><p className="text-[10px] sm:text-xs font-bold text-gray-500">지각</p><p className={`text-lg sm:text-2xl font-black ${lateCount > 0 ? 'text-yellow-500' : 'text-gray-300'}`}>{lateCount}</p></div>
                <div className="flex-1 text-center"><p className="text-[10px] sm:text-xs font-bold text-gray-500">조퇴</p><p className={`text-lg sm:text-2xl font-black ${earlyCount > 0 ? 'text-blue-500' : 'text-gray-300'}`}>{earlyCount}</p></div>
              </div>
            </div>
          )}

          {currentWidgets.tasks && (
            <div key="tasks" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 업무 (${pendingTasks.length})`} icon={<CheckSquare size={16}/>} colorClass="text-green-500" linkAction={() => setActiveView('tasks')} linkText="전체보기" />
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {pendingTasks.length > 0 ? pendingTasks.map(t => (<div key={t.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-medium flex items-center gap-2 shadow-sm"><div className="w-2 h-2 rounded-full bg-green-500 shrink-0"></div> <span className="truncate">{t.title}</span></div>)) : <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><CheckSquare size={32} className="opacity-20"/><p className="text-sm font-bold">남은 업무가 없습니다.</p></div>}
              </div>
            </div>
          )}

          {currentWidgets.timetable && (
            <div key="timetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              <WidgetHeader title={`나의 수업 (${todayDay}요일)`} icon={<Clock size={16}/>} colorClass="text-blue-500" linkAction={() => setActiveView('my_timetable')} linkText="시간표로" />
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {todayTimetable.length > 0 ? todayTimetable.map(cls => (<div key={cls.period} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100"><span className="font-extrabold text-blue-600 w-12 shrink-0 text-center">{cls.period}교시</span><div className="flex-1 font-bold text-gray-800 truncate">{cls.subject}</div></div>)) : <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><Clock size={32} className="opacity-20"/><p className="text-sm font-bold">오늘은 수업이 없습니다.</p></div>}
              </div>
            </div>
          )}

          {currentWidgets.classTimetable && (
            <div key="classTimetable" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 flex justify-between items-center group"><h3 className="font-bold flex items-center gap-2 text-white text-sm"><Calendar size={16}/> 각 반 시간표 (NEIS)</h3><GripHorizontal size={16} className="text-white/50 group-hover:text-white" /></div>
              <div className="flex-1 h-full relative"><ClassTimetableWidget schoolInfo={schoolInfo} /></div>
            </div>
          )}

          {currentWidgets.lunch && (
            <div key="lunch" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-orange-50 px-4 py-3 flex justify-between items-center border-b border-orange-100 group"><h3 className="font-bold flex items-center gap-2 text-orange-700 text-sm">🍽️ 오늘의 급식</h3><GripHorizontal size={16} className="text-orange-400/50 group-hover:text-orange-600" /></div>
              <div className="flex-1 h-full p-2"><LunchWidget schoolInfo={schoolInfo} /></div>
            </div>
          )}

          {/* 🔥 학사일정 + 월별행사 통합 위젯 사용 */}
          {currentWidgets.schoolSchedule && (
            <div key="schoolSchedule" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden relative">
              <div className="drag-handle cursor-move bg-teal-50 px-4 py-3 flex justify-between items-center border-b border-teal-100 group"><h3 className="font-bold flex items-center gap-2 text-teal-700 text-sm"><Calendar size={16}/> 이번 달 학사일정/행사</h3><GripHorizontal size={16} className="text-teal-400/50 group-hover:text-teal-600" /></div>
              <div className="flex-1 h-full"><MonthlyWidget schoolInfo={schoolInfo} customEvents={events} /></div>
            </div>
          )}

          {currentWidgets.lessons && (
            <div key="lessons" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
              <WidgetHeader title="진도 현황 요약" icon={<BookOpen size={16}/>} colorClass="text-pink-500" linkAction={() => setActiveView('lessons')} linkText="전체보기" />
              <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 gap-2 custom-scrollbar">
                {lessonGroups?.length > 0 ? lessonGroups.map(grp => (<div key={grp.id} className="p-3 bg-white rounded-xl border border-pink-100 shadow-sm flex flex-col gap-2"><span className="font-bold text-gray-800 truncate border-b border-gray-100 pb-2">{grp.name}</span></div>)) : <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2"><BookOpen size={32} className="opacity-20"/><p className="text-sm font-bold">등록된 진도 그룹 없음.</p></div>}
              </div>
            </div>
          )}

        </ResponsiveGridLayout>
      </div>

      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0"><h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings2 className="text-indigo-500"/> 위젯 설정</h3><button onClick={() => setIsWidgetModalOpen(false)}><X/></button></div>
            <button onClick={() => { localStorage.removeItem('dashboardLayouts'); window.location.reload(); }} className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl mb-4">크기 및 배치 초기화하기</button>
            <div className="space-y-3 mb-6 overflow-y-auto custom-scrollbar flex-1 pr-1 border-t pt-4">
              {[
                { key: 'weather', icon: CloudSun, color: 'text-sky-500', label: '오늘의 날씨 (구글 연동)' },
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
                <label key={w.key} className="flex items-center justify-between p-4 border rounded-xl cursor-pointer">
                  <span className="font-bold flex items-center gap-2"><w.icon size={16} className={w.color}/> {w.label}</span>
                  <input type="checkbox" checked={currentWidgets[w.key] ?? false} onChange={() => toggleWidget(w.key)} className="w-5 h-5"/>
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