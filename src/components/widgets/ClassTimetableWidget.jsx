import React, { useState, useEffect } from 'react';
import { Calendar, Loader, RefreshCw } from 'lucide-react';
import { fetchNeisClassTimetable } from '../../utils/neisApi';

export default function ClassTimetableWidget({ schoolInfo }) {
  const [timetable, setTimetable] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchGrade, setSearchGrade] = useState(schoolInfo?.grade || '1');
  const [searchClass, setSearchClass] = useState(schoolInfo?.class || '1');

  const getTodayNeisDate = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };

  const loadTimetable = async () => {
    if (!schoolInfo?.code) return;
    setIsLoading(true);
    const data = await fetchNeisClassTimetable(
      schoolInfo.officeCode, 
      schoolInfo.code, 
      schoolInfo.name, 
      searchGrade, 
      searchClass, 
      getTodayNeisDate()
    );
    setTimetable(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTimetable();
  }, [schoolInfo?.code]);

  if (!schoolInfo?.code) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4 text-center">
        <p className="text-sm">교무수첩 설정에서<br/>학교 정보를 먼저 등록해주세요.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative group overflow-hidden">
      <div className="flex justify-between items-center mb-4 z-10 shrink-0">
        <h4 className="font-bold flex items-center gap-2 text-lg text-white">
          <Calendar size={20}/> 
          <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{searchGrade}학년 {searchClass}반</span> 시간표
        </h4>
        <button onClick={loadTimetable} className="text-white/80 hover:text-white transition p-1">
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 z-10 shrink-0">
        <select value={searchGrade} onChange={(e) => setSearchGrade(e.target.value)} className="bg-white/20 text-white text-sm rounded px-2 py-1 outline-none border border-white/30 focus:border-white w-16">
          {[1,2,3,4,5,6].map(g => <option key={g} value={g} className="text-black">{g}학년</option>)}
        </select>
        <select value={searchClass} onChange={(e) => setSearchClass(e.target.value)} className="bg-white/20 text-white text-sm rounded px-2 py-1 outline-none border border-white/30 focus:border-white w-16">
          {Array.from({length: 15}, (_, i) => i + 1).map(c => <option key={c} value={c} className="text-black">{c}반</option>)}
        </select>
        <button onClick={loadTimetable} className="bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded shadow-sm hover:bg-indigo-50 transition">조회</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar z-10 space-y-2 pr-1">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader className="animate-spin text-white/50" size={32}/></div>
        ) : timetable.length > 0 ? (
          timetable.map((cls, idx) => (
            <div key={idx} className="flex items-center gap-4 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm">
              <span className="font-extrabold text-blue-200 text-sm w-12">{cls.period}교시</span>
              <span className="font-bold text-white text-base">{cls.subject}</span>
            </div>
          ))
        ) : (
          <div className="text-center text-white/60 py-10 text-sm font-medium">오늘은 등록된 시간표가 없습니다.</div>
        )}
      </div>
    </div>
  );
}