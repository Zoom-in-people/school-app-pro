import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Save, Calendar } from 'lucide-react';

export default function MemoLogModal({ isOpen, onClose, student, onSave }) {
  if (!isOpen || !student) return null;

  // 🔥 수정: 날짜 내림차순 정렬 (최신순)
  const sortedMemos = (student.memos || []).sort((a, b) => new Date(b.date) - new Date(a.date));

  const [logs, setLogs] = useState(sortedMemos);
  const [newContent, setNewContent] = useState("");
  
  // 수정 상태
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");

  const today = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (!newContent.trim()) return;
    const newLog = {
      id: Date.now(),
      date: today,
      content: newContent
    };
    // 추가 후 다시 정렬하여 저장
    const updatedLogs = [newLog, ...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    setLogs(updatedLogs);
    setNewContent("");
    onSave(student.id, { memos: updatedLogs });
  };

  const handleDelete = (id) => {
    if(!window.confirm("삭제하시겠습니까?")) return;
    const updatedLogs = logs.filter(l => l.id !== id);
    setLogs(updatedLogs);
    onSave(student.id, { memos: updatedLogs });
  };

  const startEdit = (log) => {
    setEditingId(log.id);
    setEditContent(log.content);
    setEditDate(log.date);
  };

  const saveEdit = (id) => {
    const updatedLogs = logs.map(l => l.id === id ? { ...l, content: editContent, date: editDate } : l);
    // 수정 후에도 정렬 유지
    updatedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    setLogs(updatedLogs);
    setEditingId(null);
    onSave(student.id, { memos: updatedLogs });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-gray-700/50">
          <div>
            <h3 className="font-bold text-lg text-indigo-900 dark:text-white flex items-center gap-2">
              📝 학생 기록 메모
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-300 font-bold mt-1">
              {student.grade}학년 {student.class}반 {student.number}번 {student.name}
            </p>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"/></button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="내용을 입력하세요."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
            />
            <button onClick={handleAdd} className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 transition">
              <Plus size={20}/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
          {logs.length > 0 ? logs.map(log => (
            <div key={log.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                {editingId === log.id ? (
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="text-xs border rounded p-1 dark:bg-gray-700 dark:text-white"/>
                ) : (
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded flex items-center gap-1">
                    <Calendar size={10}/> {log.date}
                  </span>
                )}
                <div className="flex gap-1">
                  {editingId === log.id ? (
                    <button onClick={() => saveEdit(log.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={14}/></button>
                  ) : (
                    <button onClick={() => startEdit(log)} className="text-gray-400 hover:text-indigo-600 hover:bg-gray-100 p-1 rounded"><Edit2 size={14}/></button>
                  )}
                  <button onClick={() => handleDelete(log.id)} className="text-gray-400 hover:text-red-600 hover:bg-gray-100 p-1 rounded"><Trash2 size={14}/></button>
                </div>
              </div>
              
              {editingId === log.id ? (
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white mt-2" rows={2}/>
              ) : (
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">{log.content}</p>
              )}
            </div>
          )) : (
            <div className="text-center text-gray-400 py-10 text-sm">작성된 메모가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}