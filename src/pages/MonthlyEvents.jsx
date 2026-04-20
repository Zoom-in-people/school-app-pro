import React, { useState, useMemo, useEffect } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Trash2, X, MessageSquare, Clock } from 'lucide-react';
import { showToast, showConfirm } from '../utils/alerts';
import { fetchNeisSchedule } from '../utils/neisApi';

const StatusButton = ({ label, value, current, onClick, color, span }) => {
  const isSelected = current === value;
  let baseClass = "p-2 rounded font-bold transition text-xs ";
  if (span === 3) baseClass += "col-span-3 ";
  
  if (isSelected) {
    if (color === 'red') baseClass += "bg-red-500 text-white shadow-md";
    if (color === 'yellow') baseClass += "bg-yellow-500 text-white shadow-md";
    if (color === 'green') baseClass += "bg-green-500 text-white shadow-md";
    if (color === 'blue') baseClass += "bg-blue-500 text-white shadow-md";
    if (color === 'purple') baseClass += "bg-purple-500 text-white shadow-md";
  } else {
    if (color === 'red') baseClass += "bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-100 dark:border-red-800";
    if (color === 'yellow') baseClass += "bg-yellow-50 hover:bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-800";
    if (color === 'green') baseClass += "bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800";
    if (color === 'blue') baseClass += "bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800";
    if (color === 'purple') baseClass += "bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-100 dark:border-purple-800";
  }
  return <button onClick={() => onClick(value)} className={baseClass}>{label}</button>;
};

export default function MonthlyEvents({ handbook, isHomeroom, students, attendanceLog, onUpdateAttendance, events, onUpdateEvent }) {
  const getMonthsInRange = (startDate, endDate) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
    const ms = [];
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (current <= last) { ms.push(new Date(current)); current.setMonth(current.getMonth() + 1); }
    return ms;
  };

  const months = useMemo(() => {
    if (!handbook) return [];
    return getMonthsInRange(handbook.startDate, handbook.endDate);
  }, [handbook]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    const now = new Date();
    if (months.length === 0) return 0;
    const idx = months.findIndex(m => m.getFullYear() === now.getFullYear() && m.getMonth() === now.getMonth());
    return idx >= 0 ? idx : 0;
  });

  const [attPopup, setAttPopup] = useState({ isOpen: false, studentId: null, date: null, note: "", period: "", type: "" });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", startDate: "", endDate: "" });

  const [neisEvents, setNeisEvents] = useState([]);

  const currentMonthDate = months[selectedMonthIndex] || new Date();
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth() + 1;

  useEffect(() => {
    const loadNeis = async () => {
      if (!handbook?.schoolInfo?.code) return;
      const fromDate = `${currentYear}${String(currentMonth).padStart(2, '0')}01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      const toDate = `${currentYear}${String(currentMonth).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;
      const data = await fetchNeisSchedule(handbook.schoolInfo.officeCode, handbook.schoolInfo.code, fromDate, toDate);
      setNeisEvents(data);
    };
    loadNeis();
  }, [currentYear, currentMonth, handbook?.schoolInfo?.code]);

  if (!handbook) return <div className="p-10 text-center text-gray-500">학기 정보가 없습니다.</div>;
  if (months.length === 0) return <div className="p-10 text-center text-red-500">기간 설정 오류</div>;

  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const currentEvents = events ? events.filter(e => {
    const eStart = new Date(e.startDate + 'T00:00:00');
    const eEnd = new Date(e.endDate + 'T23:59:59');
    const mStart = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
    const mEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    return (eStart <= mEnd && eEnd >= mStart);
  }) : [];

  const getEventsForDay = (day) => {
    const targetDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const targetDate = new Date(targetDateStr + 'T12:00:00');
    return currentEvents.filter(e => {
      const start = new Date(e.startDate + 'T00:00:00');
      const end = new Date(e.endDate + 'T23:59:59');
      return targetDate >= start && targetDate <= end;
    });
  };

  const getNeisEventsForDay = (day) => {
    const targetDateStr = `${currentYear}${String(currentMonth).padStart(2, '0')}${String(day).padStart(2, '0')}`;
    return neisEvents.filter(e => e.date === targetDateStr);
  };

  const getLog = (studentId, day) => {
    if (!attendanceLog) return null;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceLog.find(l => l.studentId === studentId && l.date === dateStr);
  };

  const getAttendanceSummary = (day) => {
    if (!attendanceLog) return null;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const logs = attendanceLog.filter(l => l.date === dateStr);
    if (logs.length === 0) return null;
    const counts = { '결석': 0, '지각': 0, '조퇴': 0, '인정': 0, '기타': 0 };
    logs.forEach(l => { 
      if (!l.type) return;
      if (l.type === '기타') counts['기타']++;
      else if (l.type.includes('결')) counts['결석']++;
      else if (l.type.includes('지')) counts['지각']++;
      else if (l.type.includes('조')) counts['조퇴']++;
      else if (l.type.includes('인')) counts['인정']++;
    });
    const summary = [];
    if(counts['결석']) summary.push(`결${counts['결석']}`);
    if(counts['지각']) summary.push(`지${counts['지각']}`);
    if(counts['조퇴']) summary.push(`조${counts['조퇴']}`);
    if(counts['인정']) summary.push(`인${counts['인정']}`);
    if(counts['기타']) summary.push(`기${counts['기타']}`);
    return summary.length > 0 ? summary.join(' ') : null;
  };

  const calculateStats = (studentId) => {
    const stats = { '병결':0, '미결':0, '인결':0, '병지':0, '미지':0, '인지':0, '병조':0, '미조':0, '인조':0, '기타': 0 };
    if (!attendanceLog) return stats;
    attendanceLog.forEach(log => {
      const logDate = new Date(log.date);
      if (log.studentId === studentId && logDate.getMonth() + 1 === currentMonth && logDate.getFullYear() === currentYear) {
        if (log.type && stats[log.type] !== undefined) stats[log.type]++;
      }
    });
    return stats;
  };

  const openAddEvent = (day = 1) => {
    setTargetEvent(null);
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setEventForm({ title: "", startDate: dateStr, endDate: dateStr });
    setIsEventModalOpen(true);
  };
  const openEditEvent = (evt, e) => { e.stopPropagation(); setTargetEvent(evt); setEventForm({ title: evt.title, startDate: evt.startDate, endDate: evt.endDate }); setIsEventModalOpen(true); };
  
  const handleSaveEvent = () => { 
    if (!eventForm.title) return showToast("일정 내용을 입력해주세요.", "warning"); 
    if (targetEvent) onUpdateEvent(targetEvent.id, eventForm); 
    else onUpdateEvent(null, eventForm); 
    setIsEventModalOpen(false); 
    showToast('일정이 저장되었습니다.');
  };
  
  const handleDeleteEvent = async (id) => { 
    if(await showConfirm("일정을 삭제하시겠습니까?", "선택한 일정이 달력에서 제거됩니다.")) {
      onUpdateEvent(id, null); 
      showToast('삭제되었습니다.');
    }
  };

  const openAttPopup = (studentId, day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingLog = attendanceLog?.find(l => l.studentId === studentId && l.date === dateStr);
    
    let parsedNote = existingLog ? (existingLog.note || "") : "";
    let parsedPeriod = "";
    const match = parsedNote.match(/^\[(.*?)\]\s*(.*)$/);
    if (match && match[1].includes('교시')) {
      parsedPeriod = match[1];
      parsedNote = match[2];
    }

    setAttPopup({ 
      isOpen: true, 
      studentId, 
      date: dateStr, 
      note: parsedNote, 
      period: parsedPeriod,
      type: existingLog ? (existingLog.type || "") : ""
    });
  };

  const saveAttendance = (typeAction) => {
    const { studentId, date, note, period, type } = attPopup;
    if (!studentId || !date) return;
    const existing = attendanceLog?.find(l => l.studentId === studentId && l.date === date);
    
    let finalNote = note.trim();
    if (period) {
      finalNote = `[${period}] ${finalNote}`.trim();
    }

    if (typeAction === 'reset') { 
      if (existing) onUpdateAttendance(existing.id, null); 
      showToast('출결이 초기화되었습니다.');
    } else { 
      const finalType = typeAction || type;
      if (!finalType) {
        showToast("출결 상태(결석/지각/조퇴 등)를 선택해주세요.", "warning");
        return;
      }
      const data = { studentId, date, type: finalType, note: finalNote }; 
      if (existing) onUpdateAttendance(existing.id, { ...existing, type: finalType, note: finalNote }); 
      else onUpdateAttendance(null, data); 
      showToast('저장되었습니다.');
    }
    setAttPopup({ isOpen: false, studentId: null, date: null, note: "", period: "", type: "" });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px] flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h3 className="text-xl md:text-2xl font-bold dark:text-white flex items-center gap-2">
          <CalIcon className="text-indigo-500 w-6 h-6 md:w-8 md:h-8" /> 월별행사 / 학사일정
        </h3>
        
        <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))} disabled={selectedMonthIndex === 0} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded disabled:opacity-30"><ChevronLeft size={20}/></button>
          <select value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(Number(e.target.value))} className="bg-transparent font-bold text-base md:text-lg text-center dark:text-white appearance-none cursor-pointer outline-none px-2 py-1 hover:bg-white/50 dark:hover:bg-gray-600/50 rounded transition flex-1 sm:flex-none" style={{ textAlignLast: 'center' }}>
            {months.map((m, idx) => (<option key={idx} value={idx} className="dark:bg-gray-800">{m.getFullYear()}년 {m.getMonth() + 1}월</option>))}
          </select>
          <button onClick={() => setSelectedMonthIndex(Math.min(months.length - 1, selectedMonthIndex + 1))} disabled={selectedMonthIndex === months.length - 1} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded disabled:opacity-30"><ChevronRight size={20}/></button>
        </div>
        
        <button onClick={() => openAddEvent(1)} className="bg-indigo-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold hover:bg-indigo-700 flex items-center gap-2 shrink-0">
          <Plus size={18}/> <span className="hidden sm:inline">행사 직접 추가</span><span className="sm:hidden">추가</span>
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col mb-8">
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (<div key={day} className={`p-3 text-center font-bold text-sm ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>{day}</div>))}
        </div>
        <div className="grid grid-cols-7 bg-white dark:bg-gray-800">
          {emptyDays.map(i => <div key={`empty-${i}`} className="border-b border-r border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/20"></div>)}
          {daysArray.map(day => {
            const dayEvents = getEventsForDay(day);
            const dayNeisEvents = getNeisEventsForDay(day);
            const attSummary = isHomeroom ? getAttendanceSummary(day) : null;
            const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
            const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
            
            const isRedDay = isSunday || dayNeisEvents.some(e => e.holiday); 
            
            // 🔥 '오늘 날짜' 강조 효과 적용
            const today = new Date();
            const isToday = (currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1 && day === today.getDate());
            
            let bgClass = 'bg-white dark:bg-gray-800';
            if (isToday) {
               bgClass = 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-500 ring-inset shadow-sm z-10';
            }

            return (
              <div key={day} onClick={() => openAddEvent(day)} className={`min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1 relative hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer group flex flex-col ${bgClass}`}>
                <div className="flex justify-between items-start mb-1 shrink-0">
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-bold p-1 rounded-full w-7 h-7 flex items-center justify-center ${isToday ? 'bg-indigo-500 text-white shadow-md' : isRedDay ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'dark:text-gray-300'}`}>{day}</span>
                  </div>
                  {attSummary && <span className="text-[10px] font-bold text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-500 shadow-sm mr-1">{attSummary}</span>}
                </div>
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                  
                  {dayNeisEvents.map((evt, idx) => (
                    <div key={`neis-${idx}`} className={`text-[11px] font-bold px-1.5 py-1 rounded truncate ${evt.holiday ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:border-red-800/50' : 'bg-teal-50 text-teal-700 border border-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50'}`}>
                      🏛️ {evt.name}
                    </div>
                  ))}

                  {dayEvents.map(evt => (
                    <div key={evt.id} onClick={(e) => openEditEvent(evt, e)} className="text-[11px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-1.5 py-1 rounded truncate hover:opacity-80 flex justify-between items-center group/evt">
                      <span className="truncate">{evt.title}</span><button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(evt.id); }} className="opacity-0 group-hover/evt:opacity-100 text-indigo-900 dark:text-indigo-100"><Trash2 size={10}/></button>
                    </div>
                  ))}
                  
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isHomeroom && (
        <div className="flex-1 flex flex-col mt-4 border-t pt-6 dark:border-gray-700">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white"><div className="w-2 h-6 bg-indigo-500 rounded"></div>우리 반 출결 현황 ({currentMonth}월)</h4>
          <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-700 custom-scrollbar">
            <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th rowSpan="2" className="p-2 border border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 w-20 shadow-sm">이름</th>
                  {daysArray.map(d => {
                    const isSunday = (firstDayOfMonth + d - 1) % 7 === 0;
                    const isSaturday = (firstDayOfMonth + d - 1) % 7 === 6;
                    const dayNeisEvents = getNeisEventsForDay(d);
                    const isRedDay = isSunday || dayNeisEvents.some(e => e.holiday);
                    
                    const today = new Date();
                    const isToday = (currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1 && d === today.getDate());

                    let headerClass = '';
                    if (isToday) headerClass = 'text-indigo-700 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 font-extrabold';
                    else if (isRedDay) headerClass = 'text-red-500 bg-red-50 dark:bg-red-900/20';
                    else if (isSaturday) headerClass = 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';

                    return <th key={d} rowSpan="2" className={`p-1 border border-gray-200 dark:border-gray-600 min-w-[24px] ${headerClass}`}>{d}</th>
                  })}
                  <th colSpan="4" className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 font-bold border-l-2 border-red-200">결석</th>
                  <th colSpan="4" className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 font-bold border-l-2 border-yellow-200">지각</th>
                  <th colSpan="4" className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-200">조퇴</th>
                  <th rowSpan="2" className="p-1 border dark:border-gray-600 bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-200">기타</th>
                </tr>
                <tr>
                  <th className="p-1 border dark:border-gray-600 bg-red-100 text-red-800 font-bold border-l-2 border-red-200">계</th>
                  <th className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 border-red-200">병</th>
                  <th className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 border-red-200">미</th>
                  <th className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 border-red-200">인</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-100 text-yellow-800 font-bold border-l-2 border-yellow-200">계</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 border-yellow-200">병</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 border-yellow-200">미</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 border-yellow-200">인</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-100 text-blue-800 font-bold border-l-2 border-blue-200">계</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 border-blue-200">병</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 border-blue-200">미</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 border-blue-200">인</th>
                </tr>
              </thead>
              <tbody>
                {students && students.length > 0 ? students.sort((a,b)=> Number(a.number)-Number(b.number)).map(student => {
                  const stats = calculateStats(student.id);
                  const totalAbsence = (stats['병결']||0) + (stats['미결']||0) + (stats['인결']||0);
                  const totalLateness = (stats['병지']||0) + (stats['미지']||0) + (stats['인지']||0);
                  const totalEarly = (stats['병조']||0) + (stats['미조']||0) + (stats['인조']||0);

                  return (
                    <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="p-2 border border-gray-200 dark:border-gray-600 font-bold sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-sm">{student.number}.{student.name}</td>
                      {daysArray.map(day => {
                        const log = getLog(student.id, day);
                        let content = ""; 
                        
                        const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
                        const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
                        const dayNeisEvents = getNeisEventsForDay(day);
                        const isRedDay = isSunday || dayNeisEvents.some(e => e.holiday);
                        
                        const today = new Date();
                        const isToday = (currentYear === today.getFullYear() && currentMonth === today.getMonth() + 1 && day === today.getDate());
                        
                        let colorClass = "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";
                        if (isToday) colorClass = "bg-indigo-50 dark:bg-indigo-900/30 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-x-indigo-200 dark:border-x-indigo-800";
                        else if (isRedDay) colorClass = "bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30";
                        else if (isSaturday) colorClass = "bg-blue-50/50 dark:bg-blue-900/10 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30";

                        let hasNote = false;

                        if (log && log.type) { 
                          content = log.type.slice(0, 1);
                          hasNote = !!log.note;
                          if (log.type.includes('결')) colorClass = "bg-red-50 text-red-600 font-bold border-red-100";
                          if (log.type.includes('지')) colorClass = "bg-yellow-50 text-yellow-600 font-bold border-yellow-100";
                          if (log.type.includes('조')) colorClass = "bg-blue-50 text-blue-600 font-bold border-blue-100";
                          if (log.type === '기타') colorClass = "bg-purple-50 text-purple-700 font-bold border-purple-100";
                        }
                        
                        return (
                          <td 
                            key={day} 
                            className={`border border-gray-100 dark:border-gray-700 ${colorClass} relative`} 
                            onClick={() => openAttPopup(student.id, day)}
                            title={hasNote ? log.note : (dayNeisEvents.some(e=>e.holiday) ? dayNeisEvents.find(e=>e.holiday).name : "")}
                          >
                            {content}
                            {hasNote && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                          </td>
                        );
                      })}
                      <td className="border dark:border-gray-600 font-bold text-red-800 bg-red-100 border-l-2 border-red-200">{totalAbsence || ''}</td>
                      <td className="border dark:border-gray-600 text-red-600 border-red-200">{stats['병결']||''}</td>
                      <td className="border dark:border-gray-600 text-red-600 border-red-200">{stats['미결']||''}</td>
                      <td className="border dark:border-gray-600 text-red-600 border-red-200">{stats['인결']||''}</td>
                      
                      <td className="border dark:border-gray-600 font-bold text-yellow-800 bg-yellow-100 border-l-2 border-yellow-200">{totalLateness || ''}</td>
                      <td className="border dark:border-gray-600 text-yellow-600 border-yellow-200">{stats['병지']||''}</td>
                      <td className="border dark:border-gray-600 text-yellow-600 border-yellow-200">{stats['미지']||''}</td>
                      <td className="border dark:border-gray-600 text-yellow-600 border-yellow-200">{stats['인지']||''}</td>

                      <td className="border dark:border-gray-600 font-bold text-blue-800 bg-blue-100 border-l-2 border-blue-200">{totalEarly || ''}</td>
                      <td className="border dark:border-gray-600 text-blue-600 border-blue-200">{stats['병조']||''}</td>
                      <td className="border dark:border-gray-600 text-blue-600 border-blue-200">{stats['미조']||''}</td>
                      <td className="border dark:border-gray-600 text-blue-600 border-blue-200">{stats['인조']||''}</td>

                      <td className="border dark:border-gray-600 font-bold text-purple-700 bg-purple-50 border-l-2 border-purple-200">{stats['기타']||''}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={daysInMonth + 14} className="p-4 text-gray-400">학생 명부가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ... (나머지 팝업 코드는 생략) */}

      {/* 이벤트 입력 팝업 */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4 dark:text-white">{targetEvent ? "일정 수정" : "일정 추가"}</h3>
            <div className="space-y-3">
              <input type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="일정 내용" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"/>
              <div className="flex gap-2">
                 <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">시작일</label><input type="date" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white outline-none"/></div>
                 <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">종료일</label><input type="date" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white outline-none"/></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition font-bold">취소</button>
              <button onClick={handleSaveEvent} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-sm">저장</button>
            </div>
          </div>
        </div>
      )}

      {/* 출결 입력 팝업 */}
      {attPopup.isOpen && (
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center" onClick={() => setAttPopup({isOpen: false, studentId: null, date: null, note: "", period: "", type: ""})}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl w-72" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><h4 className="font-bold dark:text-white">출결 / 메모 입력</h4><button onClick={() => setAttPopup({isOpen: false, studentId: null, date: null, note: "", period: "", type: ""})} className="text-gray-400 hover:text-gray-700"><X size={16}/></button></div>
            
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-gray-500" />
              <select 
                value={attPopup.period} 
                onChange={(e) => setAttPopup({...attPopup, period: e.target.value})} 
                className="flex-1 p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">관련 교시 (선택)</option>
                {[1, 2, 3, 4, 5, 6, 7].map(p => (
                  <option key={p} value={`${p}교시 이후`}>{p}교시 이후</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1 text-xs font-bold text-gray-500 dark:text-gray-400"><MessageSquare size={12}/> 사유 (선택)</div>
              <input type="text" value={attPopup.note} onChange={(e) => setAttPopup({...attPopup, note: e.target.value})} placeholder="예: 독감, 병원 진료" className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"/>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center font-bold text-red-500 col-span-3 pb-1 border-b">결석</div>
                <StatusButton label="병결" value="병결" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="red" />
                <StatusButton label="미인정" value="미결" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="red" />
                <StatusButton label="인정" value="인결" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="green" />
                
                <div className="text-center font-bold text-yellow-500 col-span-3 pb-1 border-b mt-2">지각</div>
                <StatusButton label="병지" value="병지" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="yellow" />
                <StatusButton label="미인정" value="미지" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="yellow" />
                <StatusButton label="인정" value="인지" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="green" />
                
                <div className="text-center font-bold text-blue-500 col-span-3 pb-1 border-b mt-2">조퇴</div>
                <StatusButton label="병조" value="병조" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="blue" />
                <StatusButton label="미인정" value="미조" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="blue" />
                <StatusButton label="인정" value="인조" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="green" />
                
                <div className="text-center font-bold text-purple-500 col-span-3 pb-1 border-b mt-2">기타</div>
                <StatusButton label="기타 사유" value="기타" current={attPopup.type} onClick={(v) => setAttPopup({...attPopup, type: v})} color="purple" span={3} />
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t dark:border-gray-700">
              <button onClick={() => saveAttendance('reset')} className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 font-bold transition text-xs">초기화</button>
              <button onClick={() => setAttPopup({isOpen: false, studentId: null, date: null, note: "", period: "", type: ""})} className="flex-1 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 font-bold transition text-xs">취소</button>
              <button onClick={() => saveAttendance()} className="flex-[2] p-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-bold transition text-xs shadow-sm">확인(저장)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}