import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

export default function MemoPage({ memos = [], onAddMemo, onUpdateMemo, onDeleteMemo }) {
  const [newMemoText, setNewMemoText] = useState("");

  const handleAdd = () => {
    if (!newMemoText.trim()) return;
    const colors = ['bg-yellow-100', 'bg-pink-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    onAddMemo({ content: newMemoText, color: randomColor, date: new Date().toISOString() });
    setNewMemoText("");
  };

  return (
    <div className="h-full flex flex-col bg-[url('https://www.transparenttextures.com/patterns/cork-board.png')] bg-[#e6c280] dark:bg-gray-900 dark:bg-none rounded-xl overflow-hidden shadow-inner p-4 md:p-6">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-xl shadow-md mb-6 flex items-center gap-2 shrink-0">
        <input 
          type="text" 
          value={newMemoText} 
          onChange={(e) => setNewMemoText(e.target.value)} 
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} 
          placeholder="새로운 아이디어나 할 일을 메모하세요!" 
          className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none font-bold text-gray-800 dark:text-white"
        />
        <button onClick={handleAdd} className="bg-indigo-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 whitespace-nowrap">
          <Plus size={20}/> 메모 붙이기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-20">
          {memos.map(memo => (
            <div key={memo.id} className={`${memo.color} dark:text-gray-900 p-4 rounded-md shadow-[2px_4px_6px_rgba(0,0,0,0.1)] relative group aspect-square flex flex-col transform hover:scale-105 transition-transform rotate-1 hover:rotate-0 hover:z-10`}>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => onDeleteMemo(memo.id)} className="text-gray-500 hover:text-red-500 p-1 bg-white/50 rounded-full"><X size={14}/></button>
              </div>
              <textarea 
                value={memo.content || ''} 
                onChange={(e) => onUpdateMemo(memo.id, { content: e.target.value })} 
                className="w-full flex-1 bg-transparent resize-none outline-none text-gray-800 font-medium custom-scrollbar mt-4"
              />
              <div className="text-[10px] text-gray-500 text-right mt-2">{new Date(memo.date || memo.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          ))}
          {memos.length === 0 && <div className="col-span-full py-20 text-center text-white/70 dark:text-gray-500 font-bold text-lg drop-shadow-md">작성된 포스트잇이 없습니다.</div>}
        </div>
      </div>
    </div>
  );
}