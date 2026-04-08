import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Loader, AlertTriangle } from 'lucide-react';
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
      // 해당 월의 1일부터 말일까지 YYYYMMDD 형태로 구하기
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

  const formatDisplayDate = (ymd) => {
    return `${ymd.substring(4, 6)}월 ${ymd.substring(6, 8)}일`;
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Calendar className="text-indigo-600" size={28}/> 우리 학교 학사일정
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">NEIS 연동을 통해 학교의 공식 학사일정을 조회합니다.</p>
        </div>
      </div>

      {!schoolInfo?.code && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-400 font-bold shadow-sm shrink-0">
          <AlertTriangle size={20} />
          <span>교무수첩 설정에서 [학교 설정]을 먼저 완료해주세요.</span>
        </div>
      )}

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition"><ChevronLeft size={20}/></button>
          <h3 className="font-bold text-lg dark:text-white">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg transition"><ChevronRight size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-gray-50/50 dark:bg-gray-800/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-indigo-500 gap-4">
              <Loader className="animate-spin" size={40}/>
              <p className="font-bold">NEIS에서 일정을 불러오는 중입니다...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((evt, idx) => (
                <div key={idx} className={`p-4 rounded-xl border shadow-sm transition hover:-translate-y-1 ${evt.holiday ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-600'}`}>
                  <p className={`text-sm font-bold mb-2 ${evt.holiday ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                    {formatDisplayDate(evt.date)}
                  </p>
                  <p className="font-extrabold text-gray-800 dark:text-gray-100 text-lg leading-tight break-keep">
                    {evt.name}
                  </p>
                  {evt.holiday && <span className="inline-block mt-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">휴업일</span>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <Calendar size={48} className="opacity-20"/>
              <p className="font-bold">이 달에는 등록된 학사일정이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}