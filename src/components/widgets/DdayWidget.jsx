import React, { useState } from 'react';
import { Target, Plus, X } from 'lucide-react';

export default function DdayWidget({ ddays = [], onAddDday, onDeleteDday }) {
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: '', date: '' });

  const calculateDday = (targetDate) => {
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(targetDate); target.setHours(0,0,0,0);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "D-Day";
    return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
  };

  const handleAdd = () => {
    if (form.title && form.date) { 
      onAddDday(form); 
      setForm({title:'', date:''}); 
      setIsAdding(false); 
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 p-2 relative">
      {!isAdding && (
        <button onClick={() => setIsAdding(true)} className="absolute top-2 right-2 p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 text-gray-500 rounded-lg transition z-10">
          <Plus size={14}/>
        </button>
      )}
      
      {isAdding ? (
        <div className="flex-1 flex flex-col justify-center gap-2 p-2">
          <input type="text" placeholder="디데이 제목" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="p-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white outline-none"/>
          <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="p-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white outline-none"/>
          <div className="flex gap-1 mt-1"><button onClick={()=>setIsAdding(false)} className="flex-1 bg-gray-200 py-1 text-xs font-bold rounded">취소</button><button onClick={handleAdd} className="flex-1 bg-indigo-500 text-white py-1 text-xs font-bold rounded">추가</button></div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 p-2">
          {ddays.length > 0 ? ddays.map(d => {
             const dStr = calculateDday(d.date);
             const isImminent = dStr.includes('D-') && parseInt(dStr.replace('D-','')) <= 7;
             return (
               <div key={d.id} className={`flex items-center justify-between p-2 rounded-lg border shadow-sm group ${isImminent ? 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600'}`}>
                 <div className="min-w-0 flex-1">
                   <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{d.title}</div>
                   <div className="text-[9px] text-gray-400">{d.date}</div>
                 </div>
                 <div className={`font-black ml-2 ${isImminent ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{dStr}</div>
                 <button onClick={() => onDeleteDday(d.id)} className="ml-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition"><X size={12}/></button>
               </div>
             )
          }) : <div className="h-full flex flex-col items-center justify-center text-gray-400"><Target size={24} className="opacity-20 mb-1"/><span className="text-xs font-bold">등록된 D-Day 없음</span></div>}
        </div>
      )}
    </div>
  );
}