import React, { useState, useEffect } from 'react';
import { Clock, Settings, Plus, Save, Trash2, X, ChevronRight, Calendar, Layout, Bell } from 'lucide-react';

export default function MyTimetable({ timetableData = [], onAddTimetable, onUpdateTimetable, onDeleteTimetable }) {
  const timetable = timetableData && timetableData.length > 0 ? timetableData[0] : null;

  const [isSettingMode, setIsSettingMode] = useState(false);
  
  const [settings, setSettings] = useState({
    days: ['월', '화', '수', '목', '금'],
    totalPeriods: 6,
    classDuration: 45, 
    breakTime: 10,     
    startTime: '09:00',
    lunchStart: '12:30',
    lunchEnd: '13:20',
    lunchAfter: 4      
  });

  const [modalData, setModalData] = useState(null); 

  useEffect(() => {
    if (!timetable || timetable.type !== 'manual') {
      setIsSettingMode(true);
    } else if (timetable && timetable.settings) {
      setSettings(timetable.settings);
    }
  }, [timetable]);

  const handleSaveSettings = () => {
    if (settings.days.length === 0) return alert("최소 하루 이상의 요일을 선택해야 합니다.");
    
    const newTimetable = {
      type: 'manual',
      settings,
      schedule: timetable?.schedule || {},
      recentSubjects: timetable?.recentSubjects || [],
      recentRooms: timetable?.recentRooms || []
    };

    if (timetable && timetable.id) {
      onUpdateTimetable(timetable.id, newTimetable);
    } else {
      onAddTimetable(newTimetable);
    }
    setIsSettingMode(false);
  };

  const handleReset = () => {
    if (window.confirm("시간표를 완전히 초기화하시겠습니까?\n(입력한 모든 수업 정보가 삭제됩니다.)")) {
      if (timetable && timetable.id) onDeleteTimetable(timetable.id);
      setIsSettingMode(true);
    }
  };

  const handleDayToggle = (day) => {
    setSettings(prev => {
      const newDays = prev.days.includes(day) 
        ? prev.days.filter(d => d !== day) 
        : [...prev.days, day];
      const order = ['월', '화', '수', '목', '금', '토', '일'];
      return { ...prev, days: newDays.sort((a, b) => order.indexOf(a) - order.indexOf(b)) };
    });
  };

  const generateTimes = () => {
    const times = [];
    let [h, m] = settings.startTime.split(':').map(Number);
    
    for (let i = 1; i <= settings.totalPeriods; i++) {
      const startStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      let endM = m + Number(settings.classDuration);
      let endH = h + Math.floor(endM / 60);
      endM = endM % 60;
      const endStr = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
      
      times.push({ period: i, start: startStr, end: endStr });
      
      if (i === Number(settings.lunchAfter)) {
        const [lh, lm] = settings.lunchEnd.split(':').map(Number);
        h = lh; m = lm;
      } else {
        m = endM + Number(settings.breakTime);
        h = endH + Math.floor(m / 60);
        m = m % 60;
      }
    }
    return times;
  };

  const times = isSettingMode ? [] : generateTimes();

  const handleCellClick = (day, period) => {
    const key = `${period}-${day}`;
    const cellData = timetable?.schedule?.[key] || { subject: '', room: '' };
    setModalData({ day, period, subject: cellData.subject, room: cellData.room });
  };

  const handleSaveCell = () => {
    const key = `${modalData.period}-${modalData.day}`;
    const newSchedule = { ...timetable.schedule, [key]: { subject: modalData.subject, room: modalData.room } };
    
    if (!modalData.subject.trim() && !modalData.room.trim()) {
      delete newSchedule[key];
    }

    const newSubjects = modalData.subject.trim() ? Array.from(new Set([modalData.subject.trim(), ...(timetable.recentSubjects || [])])).slice(0, 10) : timetable.recentSubjects;
    const newRooms = modalData.room.trim() ? Array.from(new Set([modalData.room.trim(), ...(timetable.recentRooms || [])])).slice(0, 10) : timetable.recentRooms;

    onUpdateTimetable(timetable.id, {
      ...timetable,
      schedule: newSchedule,
      recentSubjects: newSubjects,
      recentRooms: newRooms
    });
    setModalData(null);
  };

  const handleDeleteCell = () => {
    const key = `${modalData.period}-${modalData.day}`;
    const newSchedule = { ...timetable.schedule };
    delete newSchedule[key];
    onUpdateTimetable(timetable.id, { ...timetable, schedule: newSchedule });
    setModalData(null);
  };

  if (isSettingMode) {
    return (
      <div className="h-full flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Settings className="text-indigo-600"/> 시간표 설정</h2>
        </div>
        
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6">
            
            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4"><Calendar className="text-indigo-500" size={20}/> 1. 수업 요일 설정</h3>
              <div className="flex flex-wrap gap-2">
                {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                  <button key={day} onClick={() => handleDayToggle(day)} className={`px-5 py-2.5 rounded-xl font-bold transition border ${settings.days.includes(day) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4"><Layout className="text-indigo-500" size={20}/> 2. 기본 형태 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">하루 총 교시 수</label>
                  <select value={settings.totalPeriods} onChange={e => setSettings({...settings, totalPeriods: Number(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                    {[4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>{n}교시</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">점심시간 배치</label>
                  <select value={settings.lunchAfter} onChange={e => setSettings({...settings, lunchAfter: Number(e.target.value)})} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                    {[3, 4, 5].map(n => <option key={n} value={n}>{n}교시 후 점심</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2 mb-4"><Bell className="text-indigo-500" size={20}/> 3. 시간표 종소리 설정</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">첫 수업 시작 시간</label>
                    <input type="time" value={settings.startTime} onChange={e => setSettings({...settings, startTime: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"/>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">수업 진행 시간 (분)</label>
                    <input type="number" value={settings.classDuration} onChange={e => setSettings({...settings, classDuration: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"/>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">점심시간</label>
                    <div className="flex items-center gap-2">
                      <input type="time" value={settings.lunchStart} onChange={e => setSettings({...settings, lunchStart: e.target.value})} className="flex-1 p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"/>
                      <span className="font-bold text-gray-400">~</span>
                      <input type="time" value={settings.lunchEnd} onChange={e => setSettings({...settings, lunchEnd: e.target.value})} className="flex-1 p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">쉬는 시간 (분)</label>
                    <input type="number" value={settings.breakTime} onChange={e => setSettings({...settings, breakTime: e.target.value})} className="w-full p-3 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {timetable && timetable.id && (
                <button onClick={() => setIsSettingMode(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">취소</button>
              )}
              <button onClick={handleSaveSettings} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                완료 및 표 만들기 <ChevronRight size={20}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 relative">
      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Clock className="text-indigo-600"/> 나의 시간표</h2>
        <div className="flex gap-2">
          <button onClick={() => setIsSettingMode(true)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2 shadow-sm">
            <Settings size={18}/> 시간표 설정
          </button>
          <button onClick={handleReset} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition">
            <Trash2 size={18}/> 초기화
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto custom-scrollbar flex flex-col">
        <div className="min-w-[500px] flex-1">
          <table className="w-full text-center h-full table-fixed">
            <thead className="bg-indigo-50 dark:bg-gray-700/50">
              <tr>
                <th className="w-20 p-2 border-b border-r dark:border-gray-600 text-indigo-800 dark:text-indigo-200 font-bold text-xs md:text-sm">교시</th>
                {settings.days.map(day => (
                  <th key={day} className="p-2 border-b border-r dark:border-gray-600 last:border-r-0 text-gray-700 dark:text-gray-200 font-extrabold text-sm">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((timeInfo, idx) => {
                const isLunchNext = timeInfo.period === Number(settings.lunchAfter);
                return (
                  <React.Fragment key={timeInfo.period}>
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="p-1 border-b border-r dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 h-14 md:h-16">
                        <div className="font-extrabold text-xs md:text-sm text-gray-800 dark:text-gray-200">{timeInfo.period}교시</div>
                        <div className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 font-medium">{timeInfo.start}<br/>~ {timeInfo.end}</div>
                      </td>
                      {settings.days.map(day => {
                        const cellData = timetable?.schedule?.[`${timeInfo.period}-${day}`];
                        return (
                          <td 
                            key={day} 
                            onClick={() => handleCellClick(day, timeInfo.period)}
                            className="p-1 border-b border-r dark:border-gray-600 last:border-r-0 cursor-pointer group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all relative"
                          >
                            {cellData ? (
                              <div className="flex flex-col items-center justify-center h-full">
                                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm mb-0.5">{cellData.subject}</span>
                                {cellData.room && <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded-full border border-gray-100 dark:border-gray-600">{cellData.room}</span>}
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-indigo-100 text-indigo-500 dark:bg-indigo-900 dark:text-indigo-300 p-1.5 rounded-full"><Plus size={16}/></div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {isLunchNext && (
                      <tr className="bg-orange-50/50 dark:bg-orange-900/10">
                        {/* 🔥 수정: h-14 md:h-16 클래스 추가로 점심시간 높이를 다른 교시와 동일하게 축소 */}
                        <td colSpan={settings.days.length + 1} className="p-1 border-b dark:border-gray-600 text-center h-14 md:h-16">
                          <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs md:text-sm">
                            점심 시간 <span className="text-[10px] font-normal opacity-80 ml-1">({settings.lunchStart} ~ {settings.lunchEnd})</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalData && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-sm">{modalData.day}요일 {modalData.period}교시</span>
              </h3>
              <button onClick={() => setModalData(null)} className="text-gray-400 hover:bg-gray-100 rounded-full p-1"><X size={20}/></button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">과목명</label>
                <input type="text" value={modalData.subject} onChange={e => setModalData({...modalData, subject: e.target.value})} placeholder="예: 국어" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" autoFocus/>
                {timetable?.recentSubjects?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {timetable.recentSubjects.map(sub => (
                      <button key={sub} onClick={() => setModalData({...modalData, subject: sub})} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition border dark:border-gray-600">{sub}</button>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">장소/교실 (선택)</label>
                <input type="text" value={modalData.room} onChange={e => setModalData({...modalData, room: e.target.value})} placeholder="예: 3학년 1반, 과학실" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"/>
                {timetable?.recentRooms?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {timetable.recentRooms.map(rm => (
                      <button key={rm} onClick={() => setModalData({...modalData, room: rm})} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold rounded-full hover:bg-indigo-100 hover:text-indigo-600 transition border dark:border-gray-600">{rm}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between gap-2 pt-4">
                <button onClick={handleDeleteCell} className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition shrink-0">삭제</button>
                <div className="flex gap-2 flex-1">
                  <button onClick={() => setModalData(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl">취소</button>
                  <button onClick={handleSaveCell} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl flex justify-center items-center gap-1 shadow-md"><Save size={16}/> 확인</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}