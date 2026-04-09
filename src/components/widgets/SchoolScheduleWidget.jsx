import React, { useState, useEffect } from 'react';
import { Calendar, Loader, RefreshCw } from 'lucide-react';
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
    
    // 오늘 이후의 일정만 먼저 보여주도록 필터링
    const todayStr = `${year}${month}${String(new Date().getDate()).padStart(2, '0')}`;
    const upcoming = data.filter(e => e.date >= todayStr);
    
    setEvents(upcoming.length > 0 ? upcoming : data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadSchedule();
  }, [schoolInfo?.code]);

  const formatDisplayDate = (ymd) => {
    return `${parseInt(ymd.substring(4, 6))}월 ${parseInt(ymd.substring(6, 8))}일`;
  };

  if (!schoolInfo?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
        <p className="text-sm">교무수첩 설정에서<br/>학교 정보를 먼저 등록해주세요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-teal-500 to-emerald-600 text-white relative group overflow-hidden">
      <div className="flex justify-between items-center mb-4 z-10 shrink-0">
        <h4 className="font-bold flex items-center gap-2 text-lg text-white">
          <Calendar size={20}/> 
          학사일정 (이번 달)
        </h4>
        <button onClick={loadSchedule} className="text-white/80 hover:text-white transition p-1">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar z-10 space-y-2 pr-1">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader className="animate-spin text-white/50" size={32}/></div>
        ) : events.length > 0 ? (
          events.map((evt, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-white/10 px-3 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm shadow-sm hover:bg-white/20 transition">
              <span className={`font-extrabold text-sm w-12 shrink-0 ${evt.holiday ? 'text-red-200' : 'text-teal-100'}`}>
                {formatDisplayDate(evt.date)}
              </span>
              <span className="font-bold text-white text-sm flex-1 truncate">{evt.name}</span>
              {evt.holiday && <span className="text-[10px] font-bold bg-red-500/80 text-white px-1.5 py-0.5 rounded shrink-0">휴업</span>}
            </div>
          ))
        ) : (
          <div className="text-center text-white/60 py-10 text-sm font-medium">이번 달 등록된 학사일정이 없습니다.</div>
        )}
      </div>
    </div>
  );
}