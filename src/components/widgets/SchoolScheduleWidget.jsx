import React, { useState, useEffect, useMemo } from 'react';
import { Loader, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchNeisSchedule } from '../../utils/neisApi';

export default function SchoolScheduleWidget({ schoolInfo }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  useEffect(() => {
    loadSchedule();
  }, [currentDate, schoolInfo?.code]);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

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

  if (!schoolInfo?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center bg-white dark:bg-gray-800">
        <p className="text-sm">교무수첩 설정에서<br/>학교 정보를 먼저 등록해주세요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 relative">
      {/* 🔹 미니 달력 상단 네비게이션 */}
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-gray-500 dark:text-gray-400"><ChevronLeft size={16}/></button>
        <span className="font-bold text-xs text-gray-800 dark:text-gray-200 w-16 text-center">{year}. {month + 1}</span>
        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition text-gray-500 dark:text-gray-400"><ChevronRight size={16}/></button>
        <div className="flex-1"></div>
        <button onClick={loadSchedule} className="text-gray-400 hover:text-teal-500 transition p-1">
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* 🔹 미니 달력 본문 */}
      <div className="flex-1 flex flex-col p-1 sm:p-2 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
            <Loader className="animate-spin text-teal-500" size={24}/>
          </div>
        )}
        
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-1 shrink-0">
          {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
            <div key={day} className={`text-center text-[10px] font-bold ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-0.5 sm:gap-1">
          {emptyDays.map(i => (
            <div key={`empty-${i}`} className="rounded bg-gray-50/50 dark:bg-gray-900/20 border border-transparent"></div>
          ))}
          
          {daysArray.map(day => {
            const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isSunday = (firstDayOfMonth + day - 1) % 7 === 0;
            const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
            const hasHoliday = dayEvents.some(e => e.holiday);
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;

            let textColorClass = 'text-gray-700 dark:text-gray-300';
            if (isSunday || hasHoliday) textColorClass = 'text-red-500';
            else if (isSaturday) textColorClass = 'text-blue-500';

            return (
              <div key={day} className={`flex flex-col p-0.5 rounded border ${isToday ? 'border-teal-400 bg-teal-50/30 dark:bg-teal-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'} overflow-hidden transition-colors hover:bg-gray-50 dark:hover:bg-gray-700`}>
                <span className={`text-[9px] sm:text-[10px] font-bold leading-none mb-0.5 ${isToday ? 'text-teal-600 dark:text-teal-400' : textColorClass}`}>
                  {day}
                </span>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5">
                  {dayEvents.map((evt, idx) => (
                    <div key={idx} className={`text-[8px] leading-tight px-0.5 py-0.5 rounded truncate font-medium ${evt.holiday ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'}`} title={evt.name}>
                      {evt.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* 빈 칸 채우기 */}
          {Array.from({ length: Math.max(0, 35 - (emptyDays.length + daysArray.length)) }, (_, i) => (
            <div key={`fill-${i}`} className="rounded bg-gray-50/50 dark:bg-gray-900/20 border border-transparent"></div>
          ))}
        </div>
      </div>
    </div>
  );
}