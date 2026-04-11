import React from 'react';
import { StickyNote } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function MemoWidget({ setActiveView }) {
  const { memos } = useAppStore();

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 p-3 relative cursor-pointer group" onClick={() => setActiveView('memos')}>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
        {memos.length > 0 ? memos.slice(0, 3).map(m => (
          <div key={m.id} className={`${m.color} p-2 rounded shadow-sm text-gray-800 text-xs font-bold line-clamp-2 leading-snug`}>
            {m.content}
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <StickyNote size={24} className="opacity-20 mb-1"/>
            <span className="text-xs font-bold">메모장에 기록해보세요</span>
          </div>
        )}
      </div>
      {memos.length > 3 && <div className="text-[10px] text-center text-gray-400 font-bold pt-1">+ {memos.length - 3}개 더보기</div>}
    </div>
  );
}