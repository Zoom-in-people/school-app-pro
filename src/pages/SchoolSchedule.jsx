import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader, AlertTriangle } from 'lucide-react';
import { fetchNeisSchedule } from '../utils/neisApi';

export default function SchoolSchedule({ handbook }) {
  const schoolInfo = handbook?.schoolInfo;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      if (!schoolInfo?.code) return;
      setIsLoading(true);
      
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const fromDate = `${year}${month}01`;
      const lastDay = new Date(year, currentDate.getMonth() + 1, 0).getDate();
      const toDate = `${year}${month}${lastDay}`;

      const data = await fetchNeisSchedule(schoolInfo.officeCode, schoolInfo.code, fromDate, toDate);
      setEvents(data);
      setIsLoading(false);
    };

    loadSchedule();
  }, [currentDate, schoolInfo?.code]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // 달력 렌더링용 날짜 배열 계산
  const { year, month, firstDayOfMonth, daysInMonth, emptyDays, daysArray } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const fd = new Date(y, m, 1).getDay();
    const dim = new Date(y, m + 1, 0).getDate();
    return {
      year: y, month: m, firstDayOfMonth: fd, daysInMonth: dim,
      emptyDays: Array.from({ length: fd }, (_, i) => i),
      daysArray: Array.from({ length: dim }, (_, i) => i + 1)
    };
  }, [currentDate]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-indigo-600" size={28}/> 우리 학교 학사일정
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">NEIS 연동을 통해 학교의 공식 학사일정을 달력으로 조회합니다.</p>
        </div>
      </div>

      {!schoolInfo?.code && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 font-bold shadow-sm shrink-0">
          <AlertTriangle size={20} />
          <span>교무수첩 설정에서 [학교 설정]을 먼저 완료해주세요.</span>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden min-h-[600px]">
        {/* 달력 컨트롤러 */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition shadow-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"><ChevronLeft size={20}/></button>
            <h3 className="font-black text-xl text-gray-800 dark:text-white w-32 text-center">{year}년 {month + 1}월</h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition shadow-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"><ChevronRight size={20}/></button>
          </div>
          <div className="flex items-center gap-3">
             {isLoading && <Loader className="animate-spin text-indigo-500" size={20} />}
             <button onClick={handleToday} className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition text-sm shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400 dark:border dark:border-indigo-800">이번 달</button>
          </div>
        </div>

        {/* 달력 그리드 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-100 dark:bg-gray-700/80 border-b border-gray-200 dark:border-gray-600 shrink-0">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={day} className={`p-3 text-center font-black text-sm ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-gray-50/50 dark:bg-gray-900/30">
            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="border-b border-r border-gray-100 dark:border-gray-700/50 bg-gray-100/50 dark:bg-gray-800/30"></div>
            ))}
            
            {daysArray.map(day => {
              const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              
              const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
              const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
              const hasHoliday = dayEvents.some(e => e.holiday);
              
              // 오늘 날짜 하이라이트
              const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;

              let textColorClass = 'text-gray-700 dark:text-gray-300';
              if (isSunday || hasHoliday) textColorClass = 'text-red-500';
              else if (isSaturday) textColorClass = 'text-blue-500';

              return (
                <div key={day} className="border-b border-r border-gray-100 dark:border-gray-700 p-1.5 md:p-2 relative bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : textColorClass}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.map((evt, idx) => (
                      <div key={idx} className={`text-[11px] md:text-xs px-2 py-1.5 rounded-lg leading-tight shadow-sm font-bold truncate transition hover:whitespace-normal hover:z-10 relative ${evt.holiday ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:border-red-800/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50'}`}>
                        {evt.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* 남은 빈 칸 채우기 */}
            {Array.from({ length: Math.max(0, 35 - (emptyDays.length + daysArray.length)) }, (_, i) => (
              <div key={`fill-${i}`} className="border-b border-r border-gray-100 dark:border-gray-700/50 bg-gray-100/50 dark:bg-gray-800/30"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}