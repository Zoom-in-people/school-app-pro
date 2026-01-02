import React, { useState, useMemo } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Plus, Trash2, X, MessageSquare } from 'lucide-react';

// =========================================================================================
// [1] 영구 음력 알고리즘 (만세력 데이터: 1900~2050년 + 메톤 주기 확장)
// =========================================================================================
const LUNAR_BASE_DATA = [
  0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2, // 1900-1909
  0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977, // 1910-1919
  0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970, // 1920-1929
  0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950, // 1930-1939
  0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557, // 1940-1949
  0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0, // 1950-1959
  0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0, // 1960-1969
  0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6, // 1970-1979
  0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570, // 1980-1989
  0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0, // 1990-1999
  0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5, // 2000-2009
  0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930, // 2010-2019
  0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530, // 2020-2029
  0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45, // 2030-2039
  0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0 // 2040-2049
];

function getLunarDate(solarDate) {
  let year = solarDate.getFullYear();
  let month = solarDate.getMonth() + 1;
  let day = solarDate.getDate();

  let effectiveYear = year;
  let offsetYear = 0;

  if (year >= 2050) {
    offsetYear = Math.floor((year - 2000) / 19) * 19;
    effectiveYear = year - offsetYear;
    while (effectiveYear >= 2050) { effectiveYear -= 19; offsetYear += 19; }
  } else if (year < 1900) {
    offsetYear = -Math.ceil((1900 - year) / 19) * 19;
    effectiveYear = year - offsetYear;
    while (effectiveYear < 1900) { effectiveYear += 19; offsetYear -= 19; }
  }

  const baseDate = new Date(1900, 0, 31);
  const targetDate = new Date(effectiveYear, month - 1, day);
  
  let offset = Math.floor((targetDate - baseDate) / 86400000);
  
  let iYear, iMonth, leap = false;
  
  for (iYear = 1900; iYear < 2050 && offset > 0; iYear++) {
    let daysOfYear = 348;
    const info = LUNAR_BASE_DATA[iYear - 1900];
    for (let i = 0; i < 12; i++) {
      daysOfYear += (info & (0x10000 >> i)) ? 1 : 0;
    }
    const leapMonth = info & 0xf;
    if (leapMonth !== 0) daysOfYear += (info & 0x10000) ? 30 : 29;

    if (offset < daysOfYear) break;
    offset -= daysOfYear;
  }

  const info = LUNAR_BASE_DATA[iYear - 1900];
  const leapMonth = info & 0xf;
  
  for (iMonth = 1; iMonth <= 12; iMonth++) {
    let daysOfMonth = (info & (0x10000 >> (iMonth - 1))) ? 30 : 29;
    if (offset < daysOfMonth) break;
    offset -= daysOfMonth;

    if (leapMonth === iMonth) {
      daysOfMonth = (info & 0x10000) ? 30 : 29;
      if (offset < daysOfMonth) {
        leap = true;
        break;
      }
      offset -= daysOfMonth;
    }
  }

  return { year: iYear + offsetYear, month: iMonth, day: offset + 1, isLeap: leap };
}

// 자동 공휴일 계산기 (대체공휴일 포함)
function getHolidays(year) {
  const holidays = {};
  const addHoliday = (dateObj, name, allowSub = false, isSeolChuseok = false) => {
    const key = `${dateObj.getFullYear()}-${dateObj.getMonth() + 1}-${dateObj.getDate()}`;
    holidays[key] = { name, type: 'public', allowSub, isSeolChuseok, date: dateObj };
  };

  addHoliday(new Date(year, 0, 1), '신정');
  addHoliday(new Date(year, 2, 1), '삼일절', true);
  addHoliday(new Date(year, 4, 5), '어린이날', true);
  addHoliday(new Date(year, 5, 6), '현충일', true);
  addHoliday(new Date(year, 7, 15), '광복절', true);
  addHoliday(new Date(year, 9, 3), '개천절', true);
  addHoliday(new Date(year, 9, 9), '한글날', true);
  addHoliday(new Date(year, 11, 25), '크리스마스', true);

  const seol = lunarToSolar(year, 1, 1);
  if (seol) {
    const p = new Date(seol); p.setDate(seol.getDate() - 1);
    const n = new Date(seol); n.setDate(seol.getDate() + 1);
    addHoliday(p, '설날 연휴', true, true); addHoliday(seol, '설날', true, true); addHoliday(n, '설날 연휴', true, true);
  }

  const buddha = lunarToSolar(year, 4, 8);
  if (buddha) addHoliday(buddha, '부처님오신날', true);

  const chuseok = lunarToSolar(year, 8, 15);
  if (chuseok) {
    const p = new Date(chuseok); p.setDate(chuseok.getDate() - 1);
    const n = new Date(chuseok); n.setDate(chuseok.getDate() + 1);
    addHoliday(p, '추석 연휴', true, true); addHoliday(chuseok, '추석', true, true); addHoliday(n, '추석 연휴', true, true);
  }

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

// 헬퍼: 음력->양력 변환기 (위 알고리즘과 연결)
function lunarToSolar(year, m, d) {
  // 1. 대략적인 양력 날짜 추정 (음력은 양력보다 보통 20~50일 늦음)
  // 정밀 계산을 위해 해당 연도의 1월 1일부터 순회하며 음력 매칭
  // (최적화를 위해 근사치에서 시작)
  let date = new Date(year, 0, 1);
  // 최대 2년치 스캔 (안전하게)
  for(let i=0; i<730; i++) {
    const l = getLunarDate(date);
    if (!l.isLeap && l.month === m && l.day === d) return date;
    date.setDate(date.getDate() + 1);
  }
  return null;
}

// =========================================================================================
// [2] 메인 컴포넌트 (선생님 기존 로직 완벽 복구)
// =========================================================================================
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

  // 🔥 [핵심] 공휴일 자동 계산
  const holidayMap = useMemo(() => getHolidays(currentYear), [currentYear]);
  const getHolidayInfo = (day) => holidayMap[`${currentYear}-${currentMonth}-${day}`];

  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // 일정 필터
  const currentEvents = events ? events.filter(e => {
    const eStart = new Date(e.startDate);
    const eEnd = new Date(e.endDate);
    const mStart = new Date(currentYear, currentMonth - 1, 1);
    const mEnd = new Date(currentYear, currentMonth, 0);
    return (eStart <= mEnd && eEnd >= mStart);
  }) : [];

  const getEventsForDay = (day) => {
    const targetDate = new Date(currentYear, currentMonth - 1, day);
    return currentEvents.filter(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0,0,0,0); end.setHours(0,0,0,0); targetDate.setHours(0,0,0,0);
      return targetDate >= start && targetDate <= end;
    });
  };

  // --- 출결 로직 (기존 완벽 복구) ---
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

  // 모달 핸들러
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold dark:text-white flex items-center gap-2"><CalIcon className="text-indigo-500" /> 월별 일정</h3>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1.5 rounded-lg">
          <button onClick={() => setSelectedMonthIndex(Math.max(0, selectedMonthIndex - 1))} disabled={selectedMonthIndex === 0} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded disabled:opacity-30"><ChevronLeft size={20}/></button>
          <select value={selectedMonthIndex} onChange={(e) => setSelectedMonthIndex(Number(e.target.value))} className="bg-transparent font-bold text-lg text-center dark:text-white appearance-none cursor-pointer outline-none px-2 py-1 hover:bg-white/50 dark:hover:bg-gray-600/50 rounded transition" style={{ textAlignLast: 'center' }}>
            {months.map((m, idx) => (<option key={idx} value={idx} className="dark:bg-gray-800">{m.getFullYear()}년 {m.getMonth() + 1}월</option>))}
          </select>
          <button onClick={() => setSelectedMonthIndex(Math.min(months.length - 1, selectedMonthIndex + 1))} disabled={selectedMonthIndex === months.length - 1} className="p-1.5 hover:bg-white dark:hover:bg-gray-600 rounded disabled:opacity-30"><ChevronRight size={20}/></button>
        </div>
        <button onClick={() => openAddEvent(1)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"><Plus size={18}/> 일정 추가</button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden flex flex-col mb-8">
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (<div key={day} className={`p-3 text-center font-bold text-sm ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>{day}</div>))}
        </div>
        <div className="grid grid-cols-7 bg-white dark:bg-gray-800">
          {emptyDays.map(i => <div key={`empty-${i}`} className="border-b border-r border-gray-100 dark:border-gray-700/50 bg-gray-50/30 dark:bg-gray-900/20"></div>)}
          {daysArray.map(day => {
            const dayEvents = getEventsForDay(day);
            const attSummary = isHomeroom ? getAttendanceSummary(day) : null;
            const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
            const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
            
            // 🔥 공휴일 체크
            const holidayInfo = getHolidayInfo(day);
            const isRedDay = isSunday || !!holidayInfo;

            return (
              <div key={day} onClick={() => openAddEvent(day)} className="min-h-[100px] border-b border-r border-gray-100 dark:border-gray-700 p-1 relative hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col items-start">
                    <span className={`text-sm font-bold p-1 rounded-full w-7 h-7 flex items-center justify-center ${isRedDay ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'dark:text-gray-300'}`}>{day}</span>
                    {holidayInfo && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1 rounded truncate max-w-[70px]" title={holidayInfo.name}>{holidayInfo.name}</span>}
                  </div>
                  {attSummary && <span className="text-[10px] font-bold text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-200 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-500 shadow-sm mr-1">{attSummary}</span>}
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
                    // 🔥 공휴일이면 헤더 배경색 변경
                    return <th key={d} rowSpan="2" className={`p-1 border border-gray-200 dark:border-gray-600 min-w-[24px] ${isSunday || isHoliday ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}>{d}</th>
                  })}
                  <th colSpan="4" className="p-1 border border-gray-200 dark:border-gray-600 bg-red-50 text-red-600 font-bold border-l-2 border-red-200">결석</th>
                  <th colSpan="4" className="p-1 border border-gray-200 dark:border-gray-600 bg-yellow-50 text-yellow-600 font-bold border-l-2 border-yellow-200">지각</th>
                  <th colSpan="4" className="p-1 border border-gray-200 dark:border-gray-600 bg-blue-50 text-blue-600 font-bold border-l-2 border-blue-200">조퇴</th>
                  <th rowSpan="2" className="p-1 border border-gray-200 dark:border-gray-600 bg-purple-50 text-purple-700 font-bold border-l-2 border-purple-200">기타</th>
                </tr>
                <tr>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-red-100 text-red-800 font-bold border-l-2 border-red-200">계</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-red-50 text-red-600">병</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-red-50 text-red-600">미</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-red-50 text-red-600">인</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-yellow-100 text-yellow-800 font-bold border-l-2 border-yellow-200">계</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-yellow-50 text-yellow-600">병</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-yellow-50 text-yellow-600">미</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-yellow-50 text-yellow-600">인</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-blue-100 text-blue-800 font-bold border-l-2 border-blue-200">계</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-blue-50 text-blue-600">병</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-blue-50 text-blue-600">미</th>
                  <th className="p-1 border border-gray-200 dark:border-gray-600 bg-blue-50 text-blue-600">인</th>
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
                        let colorClass = "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer";
                        let hasNote = false;

                        // 공휴일 셀 배경색 처리
                        const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
                        const isHoliday = getHolidayName(day);
                        if (isSunday || isHoliday) colorClass = "bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30";

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
                            title={hasNote ? log.note : (isHoliday ? isHoliday : "")}
                          >
                            {content}
                            {hasNote && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                          </td>
                        );
                      })}
                      <td className="border border-gray-200 dark:border-gray-600 font-bold text-red-800 bg-red-100 border-l-2 border-red-200">{totalAbsence || ''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-red-600">{stats['병결']||''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-red-600">{stats['미결']||''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-red-600">{stats['인결']||''}</td>
                      
                      <td className="border border-gray-200 dark:border-gray-600 font-bold text-yellow-800 bg-yellow-100 border-l-2 border-yellow-200">{totalLateness || ''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-yellow-600">{stats['병지']||''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-yellow-600">{stats['미지']||''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-yellow-600">{stats['인지']||''}</td>

                      <td className="border border-gray-200 dark:border-gray-600 font-bold text-blue-800 bg-blue-100 border-l-2 border-blue-200">{totalEarly || ''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-blue-600">{stats['병조']||''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-blue-600">{stats['미조']||''}</td>
                      <td className="border border-gray-200 dark:border-gray-600 text-blue-600">{stats['인조']||''}</td>

                      <td className="border border-gray-200 dark:border-gray-600 font-bold text-purple-700 bg-purple-50 border-l-2 border-purple-200">{stats['기타']||''}</td>
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
                <div className="text-center font-bold text-red-500 col-span-3 pb-1 border-b">결석</div><button onClick={() => saveAttendance('병결')} className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded">병결</button><button onClick={() => saveAttendance('미결')} className="p-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인결')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button>
                <div className="text-center font-bold text-yellow-500 col-span-3 pb-1 border-b mt-2">지각</div><button onClick={() => saveAttendance('병지')} className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded">병지</button><button onClick={() => saveAttendance('미지')} className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인지')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button>
                <div className="text-center font-bold text-blue-500 col-span-3 pb-1 border-b mt-2">조퇴</div><button onClick={() => saveAttendance('병조')} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded">병조</button><button onClick={() => saveAttendance('미조')} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인조')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button>
                <div className="text-center font-bold text-purple-500 col-span-3 pb-1 border-b mt-2">기타</div><button onClick={() => saveAttendance('기타')} className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded col-span-3">기타 사유</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}