import React, { useState } from 'react';

export default function AddLessonModal({ isOpen, onClose, onSave, classList }) {
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [content, setContent] = useState("");
  if (!isOpen) return null;
  const handleClassToggle = (cls) => { if (selectedClasses.includes(cls)) setSelectedClasses(selectedClasses.filter(c => c !== cls)); else setSelectedClasses([...selectedClasses, cls]); };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6"><h3 className="text-lg font-bold mb-4 dark:text-white">진도 추가</h3><div className="space-y-4"><div className="grid grid-cols-2 gap-2">{classList.map(cls => (<label key={cls} className="flex items-center gap-2"><input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => handleClassToggle(cls)}/>{cls}</label>))}</div><input type="text" value={content} onChange={(e) => setContent(e.target.value)} className="w-full border p-2 rounded dark:bg-gray-700" placeholder="내용"/></div><div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 text-gray-500">취소</button><button onClick={() => onSave(selectedClasses.map(cls => ({ id: Date.now()+Math.random(), class: cls, subject: "과학", progress: content, done: false })))} className="px-4 py-2 bg-indigo-600 text-white rounded">추가</button></div></div></div>
  );
}