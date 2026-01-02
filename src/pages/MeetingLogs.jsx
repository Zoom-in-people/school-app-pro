import React, { useState } from 'react';
import { Plus, Trash2, Save, FileText, Calendar } from 'lucide-react';

export default function MeetingLogs({ logs = [], onAddLog, onUpdateLog, onDeleteLog }) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentLog, setCurrentLog] = useState(null);

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = () => {
    if (currentLog.id) {
      onUpdateLog(currentLog.id, currentLog);
    } else {
      onAddLog({ ...currentLog, date: new Date().toISOString() });
    }
    setIsEditing(false);
    setCurrentLog(null);
  };

  const startNewLog = () => {
    setCurrentLog({ title: '', content: '', date: new Date().toISOString() });
    setIsEditing(true);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <FileText className="text-indigo-600"/> 회의록
        </h2>
        <button onClick={startNewLog} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition">
          <Plus size={18}/> 새 회의록
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex gap-6">
        {/* 목록 리스트 */}
        <div className={`flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${isEditing ? 'hidden md:grid w-1/3' : ''}`}>
          {sortedLogs.map(log => (
            <div key={log.id} onClick={() => { setCurrentLog(log); setIsEditing(true); }} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 cursor-pointer shadow-sm transition group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg dark:text-white truncate pr-2">{log.title || '제목 없음'}</h3>
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0"><Calendar size={12}/> {new Date(log.date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 whitespace-pre-wrap">{log.content}</p>
            </div>
          ))}
        </div>

        {/* 편집기 (우측) */}
        {isEditing && currentLog && (
          <div className="flex-[2] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col shadow-lg animate-in slide-in-from-right-4">
            <input 
              type="text" 
              placeholder="회의 제목을 입력하세요" 
              value={currentLog.title}
              onChange={e => setCurrentLog({...currentLog, title: e.target.value})}
              className="text-2xl font-bold border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 outline-none bg-transparent dark:text-white placeholder-gray-300"
            />
            <textarea 
              className="flex-1 w-full resize-none outline-none bg-transparent dark:text-white text-base leading-relaxed" 
              placeholder="회의 내용을 자유롭게 작성하세요..."
              value={currentLog.content}
              onChange={e => setCurrentLog({...currentLog, content: e.target.value})}
            />
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              {currentLog.id && (
                <button onClick={() => { if(window.confirm('삭제하시겠습니까?')) { onDeleteLog(currentLog.id); setIsEditing(false); } }} className="text-red-500 px-4 py-2 hover:bg-red-50 rounded-lg flex items-center gap-2"><Trash2 size={18}/> 삭제</button>
              )}
              <button onClick={() => setIsEditing(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-lg">취소</button>
              <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2"><Save size={18}/> 저장</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}