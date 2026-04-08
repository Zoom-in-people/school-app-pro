import React, { useState } from 'react';
import { Users, AlertTriangle, BookOpen, ClipboardList, MessageSquare, CheckCircle, X, Clock, Settings2 } from 'lucide-react';
import LunchWidget from '../components/widgets/LunchWidget';
import MemoLogModal from '../components/modals/MemoLogModal';
import ClassTimetableWidget from '../components/widgets/ClassTimetableWidget';

export default function Dashboard({ students, todos, setActiveView, schoolInfo, isHomeroom, attendanceLog, onUpdateAttendance, onUpdateStudent, lessonGroups, onUpdateLessonGroup, myTimetable, widgets, setWidgets }) {
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [attPopup, setAttPopup] = useState({ isOpen: false, studentId: null, note: "" });
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false); // 🔥 위젯 설정 모달

const currentWidgets = widgets || { attendance: true, tasks: true, timetable: true, classTimetable: true, lunch: true, lessons: true };
  const toggleWidget = (key) => {
    setWidgets({ ...currentWidgets, [key]: !currentWidgets[key] });
  };

  const timetable = myTimetable && myTimetable.length > 0 ? myTimetable[0] : null;

  const getTodayDateString = () => { 
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; 
  };
  const todayStr = getTodayDateString();
  const todayDayName = ['일', '월', '화', '수', '목', '금', '토'][new Date().getDay()];

  const todayClasses = [];
  if (timetable && timetable.type === 'manual' && timetable.settings) {
    for (let i = 1; i <= timetable.settings.totalPeriods; i++) {
      const cls = timetable.schedule?.[`${i}-${todayDayName}`];
      if (cls) todayClasses.push({ period: i, ...cls });
    }
  }

  const getDDayFormat = (dueDate) => {
    if (!dueDate) return { text: '', color: 'text-gray-500' };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diff > 0) return { text: `${diff}일 남음`, color: 'text-blue-500' };
    if (diff < 0) return { text: `${Math.abs(diff)}일 지남`, color: 'text-red-500' };
    return { text: '오늘 마감', color: 'text-orange-500' };
  };

  const openAttPopup = (studentId) => {
    const existing = attendanceLog?.find(l => l.studentId === studentId && l.date === todayStr);
    setAttPopup({ isOpen: true, studentId, note: existing ? (existing.note || "") : "" });
  };

  const saveAttendance = (type) => {
    if (!attPopup.studentId) return;
    const existing = attendanceLog?.find(l => l.studentId === attPopup.studentId && l.date === todayStr);
    const { note } = attPopup;
    const data = type === 'reset' ? null : { studentId: attPopup.studentId, date: todayStr, type, note };
    
    if (type === 'reset' && existing) onUpdateAttendance(existing.id, null);
    else if (existing) onUpdateAttendance(existing.id, { ...existing, type, note });
    else if (!existing && type !== 'reset') onUpdateAttendance(null, data);
    
    setAttPopup({ isOpen: false, studentId: null, note: "" });
  };

  const handleMemoClick = (student) => { setTargetStudent(student); setMemoModalOpen(true); };
  const handleMemoSave = (studentId, updatedFields) => { onUpdateStudent(studentId, updatedFields); setTargetStudent(prev => ({...prev, ...updatedFields})); };

  const handleToggleProgress = (groupId, classId, itemName) => {
    const group = lessonGroups.find(g => g.id === groupId);
    if (!group) return;
    const key = `${classId}_${itemName}`;
    const newStatus = { ...group.status, [key]: group.status[key] ? null : todayStr };
    onUpdateLessonGroup(groupId, { status: newStatus });
  };

  const WidgetCard = ({ children, title, icon: Icon, colorClass = "text-gray-900 dark:text-white" }) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col overflow-hidden transition hover:shadow-md print-break-inside-avoid">
      {title && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
          <h3 className={`font-bold text-lg flex items-center gap-2 ${colorClass}`}>
            {Icon && <Icon size={20} />} {title}
          </h3>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-0 relative print:overflow-visible">
        {children}
      </div>
    </div>
  );

  return (
    <div className="pb-20 w-full print:pb-0">
      
      {/* 상단 툴바: 대시보드 제목 및 위젯 편집 버튼 */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h2 className="text-2xl font-bold dark:text-white">대시보드</h2>
        <button onClick={() => setIsWidgetModalOpen(true)} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 font-bold transition text-gray-700 dark:text-gray-200">
          <Settings2 size={16}/> 위젯 켜기/끄기
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-fr print:block print:space-y-6">
        
        {currentWidgets.attendance && isHomeroom && (
          <div className="lg:col-span-3 h-80 lg:h-96 print:h-auto">
            <WidgetCard title={`오늘 출결 (${todayStr})`} icon={Users} colorClass="text-green-500">
              <div className="flex justify-end px-4 pt-2 no-print"><button onClick={() => setActiveView('students_homeroom')} className="text-xs text-indigo-600 hover:underline font-bold">관리 &gt;</button></div>
              <div className="p-2">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 sticky top-0">
                    <tr><th className="px-3 py-2 rounded-l-lg">이름</th><th className="px-3 py-2 text-center">상태</th><th className="px-3 py-2 text-right rounded-r-lg no-print">메모</th></tr>
                  </thead>
                  <tbody>
                    {students.sort((a,b)=>Number(a.number)-Number(b.number)).map((student) => {
                      const log = attendanceLog?.find(l => l.studentId === student.id && l.date === todayStr);
                      let statusText = "-"; let statusClass = "bg-gray-100 text-gray-500 hover:bg-gray-200"; let hasNote = false;
                      
                      if (log) {
                        hasNote = !!log.note;
                        statusText = log.type.replace('결석','결').replace('지각','지').replace('조퇴','조').replace('결과','과').replace('질병','질').replace('미인정','미').replace('인정','인');
                        if (log.type.includes('결석')) statusClass = "bg-red-100 text-red-700";
                        else if (log.type.includes('지각')) statusClass = "bg-yellow-100 text-yellow-700";
                        else if (log.type.includes('조퇴')) statusClass = "bg-blue-100 text-blue-700";
                        else if (log.type.includes('결과')) statusClass = "bg-orange-100 text-orange-700";
                        else statusClass = "bg-purple-100 text-purple-700";
                      }

                      return (
                        <tr key={student.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                          <td className="px-3 py-3 font-bold dark:text-gray-200"><span className="text-gray-400 text-xs mr-1">{student.number}</span>{student.name}</td>
                          <td className="px-3 py-3 text-center"><button onClick={() => openAttPopup(student.id)} className={`px-2 py-1 rounded text-xs font-bold w-14 ${statusClass} relative shadow-sm`}>{statusText}{hasNote && <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-white"></div>}</button></td>
                          <td className="px-3 py-3 text-right no-print"><button onClick={() => handleMemoClick(student)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-indigo-500 transition"><ClipboardList size={16}/></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </WidgetCard>
          </div>
        )}

        {currentWidgets.tasks && (
          <div className="lg:col-span-3 h-80 lg:h-96 print:h-auto">
            <WidgetCard title="업무 체크" icon={AlertTriangle} colorClass="text-red-500">
              <div className="p-4 space-y-3">
                <div className="flex justify-end mb-2 no-print">
                  <button onClick={() => setActiveView('tasks')} className="text-xs text-gray-400 hover:text-indigo-500 font-bold">전체보기 &gt;</button>
                </div>
                {todos.filter(t => !t.done).slice(0, 5).map(todo => (
                  <div key={todo.id} className="flex items-start gap-3 p-2 rounded-lg transition">
                    <input type="checkbox" checked={todo.done} readOnly className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300"/>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{todo.title}</p>
                      <span className={`text-xs font-bold ${getDDayFormat(todo.dueDate).color}`}>
                        {getDDayFormat(todo.dueDate).text}
                      </span>
                    </div>
                  </div>
                ))}
                {todos.filter(t => !t.done).length === 0 && <div className="text-center text-gray-400 py-10 text-sm">남은 업무가 없습니다. 🎉</div>}
              </div>
            </WidgetCard>
          </div>
        )}

        {currentWidgets.timetable && (
          <div className="lg:col-span-3 h-80 lg:h-96 print:h-auto print-break-inside-avoid">
            <div className="bg-indigo-600 rounded-2xl shadow-lg p-5 text-white h-full flex flex-col overflow-hidden relative group print:bg-gray-50 print:text-black print:border print:border-gray-300 print:shadow-none">
              <div className="flex justify-between items-center mb-4 z-10 shrink-0">
                <h4 className="font-bold flex items-center gap-2 text-lg print:text-indigo-700"><Clock size={20}/> 오늘의 수업 ({todayDayName})</h4>
                <button onClick={() => setActiveView('my_timetable')} className="text-xs font-bold text-indigo-200 hover:text-white transition bg-white/10 px-2 py-1 rounded no-print">설정하기</button>
              </div>
              
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl overflow-y-auto p-4 shadow-inner custom-scrollbar print:overflow-visible print:shadow-none">
                {timetable && timetable.type === 'manual' ? (
                  todayClasses.length > 0 ? (
                    <div className="space-y-3">
                      {todayClasses.map((cls, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50 print:bg-white print:border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm w-12">{cls.period}교시</span>
                            <span className="font-bold text-gray-800 dark:text-gray-100 text-base">{cls.subject}</span>
                          </div>
                          {cls.room && (
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2.5 py-1 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
                              {cls.room}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-10 flex flex-col items-center">
                      <Clock size={32} className="mb-2 opacity-30 text-indigo-500"/>
                      <p className="font-bold text-sm mb-1">오늘은 수업이 없습니다.</p>
                    </div>
                  )
                ) : (
                  <div className="text-center text-gray-400 py-10 flex flex-col items-center h-full justify-center">
                    <BookOpen size={40} className="mb-3 opacity-30 text-indigo-500"/>
                    <p className="font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">수동 시간표가 없습니다.</p>
                    <p className="text-xs opacity-70">상단 '설정하기'를 눌러 시간표를 만들어보세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentWidgets.lunch && (
          <div className="lg:col-span-3 h-80 lg:h-96 print:h-auto">
            <LunchWidget schoolInfo={schoolInfo || {}} />
          </div>
        )}
        {currentWidgets.classTimetable && (
          <div className="lg:col-span-3 h-80 lg:h-96 print:h-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-full overflow-hidden transition hover:shadow-md print-break-inside-avoid p-0">
              <ClassTimetableWidget schoolInfo={schoolInfo} />
            </div>
          </div>
        )}

        {currentWidgets.lessons && (
          <div className="lg:col-span-12 h-96 print:h-auto">
            <WidgetCard title="수업 진도 현황" icon={BookOpen} colorClass="text-purple-500">
              <div className="flex justify-end px-4 pt-2 no-print"><button onClick={() => setActiveView('lessons')} className="text-xs text-indigo-600 hover:underline font-bold">관리 &gt;</button></div>
              <div className="p-4 space-y-4">
                {lessonGroups?.length > 0 ? lessonGroups.map(group => (
                  <div key={group.id} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600 print-break-inside-avoid">
                    <h4 className="font-bold text-sm mb-3 text-indigo-700 dark:text-indigo-300 flex items-center gap-2"><CheckCircle size={14}/> {group.name}</h4>
                    <div className="grid gap-3">
                      {group.classes.map(cls => (
                        <div key={cls.id} className="flex items-center gap-3 py-2 border-b border-dotted border-gray-200 dark:border-gray-600 last:border-0">
                          <span className="dark:text-gray-200 w-16 shrink-0 font-bold text-sm bg-white dark:bg-gray-600 px-1 py-1.5 rounded border border-gray-200 dark:border-gray-500 flex flex-col items-center justify-center leading-tight">
                            {cls.name.split(' ').map((text, i) => <span key={i}>{text}</span>)}
                          </span>
                          <div className="flex-1 flex flex-wrap gap-1.5">
                            {group.progressItems.slice(0, 20).map((item, idx) => (
                              <button 
                                key={idx} onClick={() => handleToggleProgress(group.id, cls.id, item)} 
                                className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                                  group.status[`${cls.id}_${item}`] ? 'bg-green-500 text-white border-green-500 shadow-sm print:bg-gray-300 print:text-black print:border-gray-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                                }`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-20 flex flex-col items-center">
                    <BookOpen size={48} className="mb-2 opacity-20"/>
                    <p>등록된 수업 진도 그룹이 없습니다.</p>
                  </div>
                )}
              </div>
            </WidgetCard>
          </div>
        )}

      </div>

      {/* 위젯 설정 모달 */}
      {isWidgetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm no-print">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Settings2 className="text-indigo-500"/> 대시보드 위젯 설정</h3>
              <button onClick={() => setIsWidgetModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full dark:hover:bg-gray-700 text-gray-400"><X size={20}/></button>
            </div>
            <div className="space-y-3 mb-6">
              {isHomeroom && (
                <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                  <span className="font-bold text-gray-700 dark:text-gray-200">오늘 출결 현황</span>
                  <input type="checkbox" checked={currentWidgets.attendance} onChange={() => toggleWidget('attendance')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
                </label>
              )}
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200">각 반 시간표 (NEIS)</span>
                <input type="checkbox" checked={currentWidgets.classTimetable} onChange={() => toggleWidget('classTimetable')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200">업무 체크리스트</span>
                <input type="checkbox" checked={currentWidgets.tasks} onChange={() => toggleWidget('tasks')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200">오늘의 수업 (시간표)</span>
                <input type="checkbox" checked={currentWidgets.timetable} onChange={() => toggleWidget('timetable')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200">학교 급식 정보</span>
                <input type="checkbox" checked={currentWidgets.lunch} onChange={() => toggleWidget('lunch')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
              <label className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition">
                <span className="font-bold text-gray-700 dark:text-gray-200">수업 진도 현황</span>
                <input type="checkbox" checked={currentWidgets.lessons} onChange={() => toggleWidget('lessons')} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"/>
              </label>
            </div>
            <button onClick={() => setIsWidgetModalOpen(false)} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-sm">설정 완료</button>
          </div>
        </div>
      )}

      {memoModalOpen && targetStudent && <MemoLogModal isOpen={memoModalOpen} onClose={() => setMemoModalOpen(false)} student={targetStudent} onSave={handleMemoSave} />}
      
      {/* 팝업 로직 생략 (기존 동일) */}
    </div>
  );
}