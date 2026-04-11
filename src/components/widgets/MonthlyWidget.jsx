import React, { useState, useEffect, useMemo } from 'react';
import { Loader, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchNeisSchedule } from '../../utils/neisApi';

export default function MonthlyWidget({ schoolInfo, customEvents = [] }) {
  const [neisEvents, setNeisEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const loadSchedule = async () => {
      if (!schoolInfo?.code) return;
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const data = await fetchNeisSchedule(schoolInfo.officeCode, schoolInfo.code, `${year}${month}01`, `${year}${month}${new Date(year, currentDate.getMonth() + 1, 0).getDate()}`);
      setNeisEvents(data);
      setIsLoading(false);
    };
    loadSchedule();
  }, [currentDate, schoolInfo?.code]);

  const { year, month, firstDayOfMonth, emptyDays, daysArray } = useMemo(() => {
    const y = currentDate.getFullYear(); const m = currentDate.getMonth();
    const dim = new Date(y, m + 1, 0).getDate(); const fd = new Date(y, m, 1).getDay();
    return { year: y, month: m, firstDayOfMonth: fd, emptyDays: Array.from({ length: fd }, (_, i) => i), daysArray: Array.from({ length: dim }, (_, i) => i + 1) };
  }, [currentDate]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 relative">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-700 text-gray-500"><ChevronLeft size={16}/></button>
        <span className="font-bold text-xs text-gray-800 dark:text-gray-200 w-16 text-center">{year}. {month + 1}</span>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded dark:hover:bg-gray-700 text-gray-500"><ChevronRight size={16}/></button>
      </div>

      <div className="flex-1 flex flex-col p-1 sm:p-2 overflow-hidden relative">
        {isLoading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]"><Loader className="animate-spin text-teal-500" size={24}/></div>}
        <div className="grid grid-cols-7 mb-1 shrink-0">{['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (<div key={d} className={`text-center text-[10px] font-bold ${i===0?'text-red-400':i===6?'text-blue-400':'text-gray-500'}`}>{d}</div>))}</div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-0.5 sm:gap-1">
          {emptyDays.map(i => <div key={`empty-${i}`} className="rounded bg-gray-50/50 dark:bg-gray-900/20 border border-transparent"></div>)}
          {daysArray.map(day => {
            const isSunday = (firstDayOfMonth + day - 1) % 7 === 0; const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;
            const dNeis = neisEvents.filter(e => e.date === `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`);
            const targetDate = new Date(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00`);
            const dCust = customEvents.filter(e => targetDate >= new Date(e.startDate+'T00:00:00') && targetDate <= new Date(e.endDate+'T23:59:59'));
            const isRedDay = isSunday || dNeis.some(e => e.holiday);
            const isToday = new Date().getFullYear() === year && new Date().getMonth() === month && new Date().getDate() === day;

            return (
              <div key={day} className={`flex flex-col p-0.5 rounded border ${isToday ? 'border-teal-400 bg-teal-50/30 dark:bg-teal-900/20 shadow-sm' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'} overflow-hidden transition-colors hover:bg-gray-50 dark:hover:bg-gray-700`}>
                <span className={`text-[9px] sm:text-[10px] font-bold leading-none mb-0.5 ${isToday ? 'text-teal-600 dark:text-teal-400' : isRedDay ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-[1px]">
                  {dNeis.map((evt, idx) => (<div key={`n-${idx}`} className={`text-[8px] px-0.5 rounded truncate font-medium ${evt.holiday?'bg-red-50 text-red-600':'bg-teal-50 text-teal-700'}`}>{evt.name}</div>))}
                  {dCust.map(evt => (<div key={`c-${evt.id}`} className="text-[8px] px-0.5 rounded truncate font-medium bg-indigo-100 text-indigo-800">{evt.title}</div>))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}