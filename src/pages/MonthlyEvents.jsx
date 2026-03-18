import React, { useState, useMemo } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Trash2, X, MessageSquare } from 'lucide-react';

// 🔥 1번 요청: 안전하고 완벽한 2024~2035 음력 공휴일 하드코딩 (시간대 버그 원천 차단)
const LUNAR_HOLIDAYS = {
  2024: { seol: '2024-02-10', buddha: '2024-05-15', chuseok: '2024-09-17' },
  2025: { seol: '2025-01-29', buddha: '2025-05-05', chuseok: '2025-10-06' },
  2026: { seol: '2026-02-17', buddha: '2026-05-24', chuseok: '2026-09-25' },
  2027: { seol: '2027-02-06', buddha: '2027-05-13', chuseok: '2027-09-15' },
  2028: { seol: '2028-01-26', buddha: '2028-05-02', chuseok: '2028-10-03' },
  2029: { seol: '2029-02-13', buddha: '2029-05-20', chuseok: '2029-09-22' },
  2030: { seol: '2030-02-03', buddha: '2030-05-09', chuseok: '2030-09-12' },
  2031: { seol: '2031-01-23', buddha: '2031-05-28', chuseok: '2031-10-01' },
  2032: { seol: '2032-02-11', buddha: '2032-05-16', chuseok: '2032-09-19' },
  2033: { seol: '2033-01-31', buddha: '2033-05-06', chuseok: '2033-09-08' },
  2034: { seol: '2034-02-19', buddha: '2034-05-25', chuseok: '2034-09-27' },
  2035: { seol: '2035-02-08', buddha: '2035-05-15', chuseok: '2035-09-16' },
};

function getHolidays(year) {
  const holidays = {};
  const addHoliday = (dateObj, name, allowSub = false, isSeolChuseok = false) => {
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
    holidays[key] = { name, type: 'public', allowSub, isSeolChuseok, date: new Date(dateObj) };
  };

  addHoliday(new Date(year, 0, 1), '신정');
  addHoliday(new Date(year, 2, 1), '삼일절', true);
  addHoliday(new Date(year, 4, 5), '어린이날', true);
  addHoliday(new Date(year, 5, 6), '현충일', true);
  addHoliday(new Date(year, 7, 15), '광복절', true);
  addHoliday(new Date(year, 9, 3), '개천절', true);
  addHoliday(new Date(year, 9, 9), '한글날', true);
  addHoliday(new Date(year, 11, 25), '크리스마스', true);

  const hData = LUNAR_HOLIDAYS[year];
  if (hData) {
    const parseH = (dStr) => new Date(dStr + "T00:00:00");
    const seol = parseH(hData.seol);
    const pSeol = new Date(seol); pSeol.setDate(seol.getDate() - 1);
    const nSeol = new Date(seol); nSeol.setDate(seol.getDate() + 1);
    addHoliday(pSeol, '설날 연휴', true, true); addHoliday(seol, '설날', true, true); addHoliday(nSeol, '설날 연휴', true, true);
    
    addHoliday(parseH(hData.buddha), '부처님오신날', true);

    const chuseok = parseH(hData.chuseok);
    const pChu = new Date(chuseok); pChu.setDate(chuseok.getDate() - 1);
    const nChu = new Date(chuseok); nChu.setDate(chuseok.getDate() + 1);
    addHoliday(pChu, '추석 연휴', true, true); addHoliday(chuseok, '추석', true, true); addHoliday(nChu, '추석 연휴', true, true);
  }

  // 대체공휴일 처리
  const tempHolidays = { ...holidays };
  Object.values(tempHolidays).forEach(h => {
    if (!h.allowSub) return;
    const day = h.date.getDay(); 
    let needsSub = false;
    if (h.isSeolChuseok) { if (day === 0) needsSub = true; }
    else { if (day === 0 || day === 6) needsSub = true; }

    if (needsSub) {
      let next = new Date(h.date); next.setDate(next.getDate() + 1);
      while (true) {
        const nextKey = `${next.getFullYear()}-${next.getMonth() + 1}-${next.getDate()}`;
        if (!holidays[nextKey]) { holidays[nextKey] = { name: `대체공휴일(${h.name})`, type: 'sub', date: next }; break; }
        next.setDate(next.getDate() + 1);
      }
    }
  });
  return holidays;
}

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

  const [attPopup, setAttPopup] = useState({ isOpen: false, studentId: null, date: null, note: "" });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [targetEvent, setTargetEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", startDate: "", endDate: "" });

  if (!handbook) return <div className="p-10 text-center text-gray-500">학기 정보가 없습니다.</div>;
  if (months.length === 0) return <div className="p-10 text-center text-red-500">기간 설정 오류</div>;

  const currentMonthDate = months[selectedMonthIndex] || new Date();
  const currentYear = currentMonthDate.getFullYear();
  const currentMonth = currentMonthDate.getMonth() + 1;

  const holidayMap = useMemo(() => getHolidays(currentYear), [currentYear]);
  const getHolidayInfo = (day) => holidayMap[`${currentYear}-${currentMonth}-${day}`];

  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // 🔥 5번 요청 해결: 31일 등 월말 날짜가 조건식에서 탈락하지 않도록 23시 59분으로 강제 지정
  const currentEvents = events ? events.filter(e => {
    const eStart = new Date(e.startDate); eStart.setHours(0,0,0,0);
    const eEnd = new Date(e.endDate); eEnd.setHours(23,59,59,999);
    const mStart = new Date(currentYear, currentMonth - 1, 1);
    const mEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    return (eStart <= mEnd && eEnd >= mStart);
  }) : [];

  const getEventsForDay = (day) => {
    const targetDate = new Date(currentYear, currentMonth - 1, day);
    return currentEvents.filter(e => {
      const start = new Date(e.startDate); start.setHours(0,0,0,0);
      const end = new Date(e.endDate); end.setHours(23,59,59,999); 
      targetDate.setHours(12,0,0,0); // 안전한 비교를 위해 정오로 설정
      return targetDate >= start && targetDate <= end;
    });
  };

  const getLog = (studentId, day) => {
    if (!attendanceLog) return null;
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendanceLog.find(l => l.studentId === studentId && l.date === dateStr);
  };

  // 🔥 4번 요청 해결: 출결 통계 및 화면 출력 축약어 통일
  const calculateStats = (studentId) => {
    const stats = { '질병결석':0, '미인정결석':0, '인정결석':0, '질병지각':0, '미인정지각':0, '인정지각':0, '질병조퇴':0, '미인정조퇴':0, '인정조퇴':0, '질병결과':0, '미인정결과':0, '인정결과':0, '기타': 0 };
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
  const handleSaveEvent = () => { if (!eventForm.title) return alert("내용 입력"); if (targetEvent) onUpdateEvent(targetEvent.id, eventForm); else onUpdateEvent(null, eventForm); setIsEventModalOpen(false); };
  const handleDeleteEvent = (id) => { if(window.confirm("삭제?")) onUpdateEvent(id, null); };

  const openAttPopup = (studentId, day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingLog = attendanceLog?.find(l => l.studentId === studentId && l.date === dateStr);
    setAttPopup({ isOpen: true, studentId, date: dateStr, note: existingLog ? (existingLog.note || "") : "" });
  };
  const saveAttendance = (type) => {
    const { studentId, date, note } = attPopup;
    if (!studentId || !date) return;
    const existing = attendanceLog?.find(l => l.studentId === studentId && l.date === date);
    if (type === 'reset') { if (existing) onUpdateAttendance(existing.id, null); }
    else { const data = { studentId, date, type, note }; if (existing) onUpdateAttendance(existing.id, { ...existing, type, note }); else onUpdateAttendance(null, data); }
    setAttPopup({ isOpen: false, studentId: null, date: null, note: "" });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px] flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h3 className="text-xl md:text-2xl font-bold dark:text-white flex items-center gap-2">
          <CalIcon className="text-indigo-500 w-6 h-6 md:w-8 md:h-8" /> 
          월별 일정
        </h3>
        
        <div className="flex items-center gap-2 w-full sm:w-auto bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
          <button onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))} disabled={selectedMonthIndex === 0} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded disabled:opacity-30"><ChevronLeft size={20}/></button>
          <select value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(Number(e.target.value))} className="bg-transparent font-bold text-base md:text-lg text-center dark:text-white appearance-none cursor-pointer outline-none px-2 py-1 hover:bg-white/50 dark:hover:bg-gray-600/50 rounded transition flex-1 sm:flex-none" style={{ textAlignLast: 'center' }}>
            {months.map((m, idx) => (<option key={idx} value={idx} className="dark:bg-gray-800">{m.getFullYear()}년 {m.getMonth() + 1}월</option>))}
          </select>
          <button onClick={() => setSelectedMonthIndex(Math.min(months.length - 1, selectedMonthIndex + 1))} disabled={selectedMonthIndex === months.length - 1} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded disabled:opacity-30"><ChevronRight size={20}/></button>
        </div>
        
        <button onClick={() => openAddEvent(1)} className="bg-indigo-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base font-bold hover:bg-indigo-700 flex items-center gap-2 shrink-0">
          <Plus size={18}/> <span className="hidden sm:inline">일정 추가</span><span className="sm:hidden">추가</span>
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
            const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
            const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
            const holidayInfo = getHolidayInfo(day);
            const isRedDay = isSunday || !!holidayInfo;

            return (
              <div key={day} onClick={() => openAddEvent(day)} className="min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1 relative hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-bold p-1 rounded-full w-7 h-7 flex items-center justify-center ${isRedDay ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'dark:text-gray-300'}`}>{day}</span>
                    {holidayInfo && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1 rounded truncate max-w-[70px]" title={holidayInfo.name}>{holidayInfo.name}</span>}
                  </div>
                </div>
                <div className="mt-1 space-y-1">
                  {dayEvents.map(evt => (
                    <div key={evt.id} onClick={(e) => openEditEvent(evt, e)} className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded truncate hover:opacity-80 flex justify-between items-center group/evt">
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
          <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-700">
            <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th rowSpan="2" className="p-2 border border-gray-200 dark:border-gray-600 sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 w-20 shadow-sm">이름</th>
                  {daysArray.map(d => {
                    const isSunday = (firstDayOfMonth + d - 1) % 7 === 0;
                    const isHoliday = !!getHolidayInfo(d);
                    return <th key={d} rowSpan="2" className={`p-1 border border-gray-200 dark:border-gray-600 min-w-[24px] ${isSunday || isHoliday ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}>{d}</th>
                  })}
                  <th colSpan="4" className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 font-bold border-l-2 border-red-200">결석</th>
                  <th colSpan="4" className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 font-bold border-l-2 border-yellow-200">지각</th>
                  <th colSpan="4" className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-200">조퇴</th>
                  <th rowSpan="2" className="p-1 border dark:border-gray-600 bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-200">기타</th>
                </tr>
                <tr>
                  <th className="p-1 border dark:border-gray-600 bg-red-100 text-red-800 font-bold border-l-2 border-red-200">계</th>
                  <th className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 border-red-200">질</th>
                  <th className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 border-red-200">미</th>
                  <th className="p-1 border dark:border-gray-600 bg-red-50 text-red-600 border-red-200">인</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-100 text-yellow-800 font-bold border-l-2 border-yellow-200">계</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 border-yellow-200">질</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 border-yellow-200">미</th>
                  <th className="p-1 border dark:border-gray-600 bg-yellow-50 text-yellow-600 border-yellow-200">인</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-100 text-blue-800 font-bold border-l-2 border-blue-200">계</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 border-blue-200">질</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 border-blue-200">미</th>
                  <th className="p-1 border dark:border-gray-600 bg-blue-50 text-blue-600 border-blue-200">인</th>
                </tr>
              </thead>
              <tbody>
                {students && students.length > 0 ? students.sort((a,b)=> Number(a.number)-Number(b.number)).map(student => {
                  const stats = calculateStats(student.id);
                  const totalAbsence = (stats['질병결석']||0) + (stats['미인정결석']||0) + (stats['인정결석']||0);
                  const totalLateness = (stats['질병지각']||0) + (stats['미인정지각']||0) + (stats['인정지각']||0);
                  const totalEarly = (stats['질병조퇴']||0) + (stats['미인정조퇴']||0) + (stats['인정조퇴']||0);

                  return (
                    <tr key={student.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                      <td className="p-2 border border-gray-200 dark:border-gray-600 font-bold sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-sm">{student.number}.{student.name}</td>
                      {daysArray.map(day => {
                        const log = getLog(student.id, day);
                        let content = ""; 
                        let colorClass = "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";
                        let hasNote = false;

                        const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
                        const holidayInfo = getHolidayInfo(day);
                        if (isSunday || holidayInfo) colorClass = "bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30";

                        // 🔥 4번 요청 해결: 축약어 규칙 '질결', '미지' 등 2글자로 완벽 통일
                        if (log && log.type) { 
                          hasNote = !!log.note;
                          const shortType = log.type.replace('결석','결').replace('지각','지').replace('조퇴','조').replace('결과','과').replace('질병','질').replace('미인정','미').replace('인정','인');
                          content = shortType;
                          
                          if (log.type.includes('결석')) colorClass = "bg-red-50 text-red-600 font-bold border-red-100";
                          else if (log.type.includes('지각')) colorClass = "bg-yellow-50 text-yellow-600 font-bold border-yellow-100";
                          else if (log.type.includes('조퇴')) colorClass = "bg-blue-50 text-blue-600 font-bold border-blue-100";
                          else if (log.type.includes('결과')) colorClass = "bg-orange-50 text-orange-600 font-bold border-orange-100";
                          else if (log.type === '기타') colorClass = "bg-purple-50 text-purple-700 font-bold border-purple-100";
                        }
                        
                        return (
                          <td 
                            key={day} 
                            className={`border border-gray-100 dark:border-gray-700 ${colorClass} relative`} 
                            onClick={() => openAttPopup(student.id, day)}
                            title={hasNote ? log.note : (holidayInfo ? holidayInfo.name : "")}
                          >
                            <span className="text-[10px] sm:text-xs">{content}</span>
                            {hasNote && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                          </td>
                        );
                      })}
                      <td className="border dark:border-gray-600 font-bold text-red-800 bg-red-100 border-l-2 border-red-200">{totalAbsence || ''}</td>
                      <td className="border dark:border-gray-600 text-red-600 border-red-200">{stats['질병결석']||''}</td>
                      <td className="border dark:border-gray-600 text-red-600 border-red-200">{stats['미인정결석']||''}</td>
                      <td className="border dark:border-gray-600 text-red-600 border-red-200">{stats['인정결석']||''}</td>
                      
                      <td className="border dark:border-gray-600 font-bold text-yellow-800 bg-yellow-100 border-l-2 border-yellow-200">{totalLateness || ''}</td>
                      <td className="border dark:border-gray-600 text-yellow-600 border-yellow-200">{stats['질병지각']||''}</td>
                      <td className="border dark:border-gray-600 text-yellow-600 border-yellow-200">{stats['미인정지각']||''}</td>
                      <td className="border dark:border-gray-600 text-yellow-600 border-yellow-200">{stats['인정지각']||''}</td>

                      <td className="border dark:border-gray-600 font-bold text-blue-800 bg-blue-100 border-l-2 border-blue-200">{totalEarly || ''}</td>
                      <td className="border dark:border-gray-600 text-blue-600 border-blue-200">{stats['질병조퇴']||''}</td>
                      <td className="border dark:border-gray-600 text-blue-600 border-blue-200">{stats['미인정조퇴']||''}</td>
                      <td className="border dark:border-gray-600 text-blue-600 border-blue-200">{stats['인정조퇴']||''}</td>

                      <td className="border dark:border-gray-600 font-bold text-purple-700 bg-purple-50 border-l-2 border-purple-200">{stats['기타']||''}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={daysInMonth + 14} className="p-4 text-gray-400">학생 명부가 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4 dark:text-white">{targetEvent ? "일정 수정" : "일정 추가"}</h3>
            <div className="space-y-3">
              <input type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} placeholder="일정 내용" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/>
              <div className="flex gap-2">
                 <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">시작일</label><input type="date" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/></div>
                 <div className="flex-1"><label className="text-xs text-gray-500 block mb-1">종료일</label><input type="date" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsEventModalOpen(false)} className="px-4 py-2 text-gray-500">취소</button>
              <button onClick={handleSaveEvent} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">저장</button>
            </div>
          </div>
        </div>
      )}

      {attPopup.isOpen && (
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center" onClick={() => setAttPopup({isOpen: false, studentId: null, date: null, note: ""})}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl w-72" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><h4 className="font-bold dark:text-white">출결 / 메모 입력</h4><button onClick={() => setAttPopup({isOpen: false, studentId: null, date: null, note: ""})}><X size={16}/></button></div>
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1 text-xs font-bold text-gray-500 dark:text-gray-400"><MessageSquare size={12}/> 사유 (선택)</div>
              <input type="text" value={attPopup.note} onChange={(e) => setAttPopup({...attPopup, note: e.target.value})} placeholder="예: 독감, 체험학습" className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
            </div>
            <div className="space-y-3">
              <button onClick={() => saveAttendance('reset')} className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold">출석 (초기화)</button>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center font-bold text-red-500 col-span-3 pb-1 border-b">결석</div><button onClick={() => saveAttendance('질병결석')} className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded">질병</button><button onClick={() => saveAttendance('미인정결석')} className="p-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인정결석')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button>
                <div className="text-center font-bold text-yellow-500 col-span-3 pb-1 border-b mt-2">지각</div><button onClick={() => saveAttendance('질병지각')} className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded">질병</button><button onClick={() => saveAttendance('미인정지각')} className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인정지각')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button>
                <div className="text-center font-bold text-blue-500 col-span-3 pb-1 border-b mt-2">조퇴</div><button onClick={() => saveAttendance('질병조퇴')} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded">질병</button><button onClick={() => saveAttendance('미인정조퇴')} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인정조퇴')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button>
                <div className="text-center font-bold text-purple-500 col-span-3 pb-1 border-b mt-2">기타</div><button onClick={() => saveAttendance('기타')} className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded col-span-3">기타 사유</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}