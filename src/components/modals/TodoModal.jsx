import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function TodoModal({ isOpen, onClose, todo, onSave }) {
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const defaultData = { title: "", category: "", dueDate: getTodayDateString(), priority: "medium", done: false };
  const [formData, setFormData] = useState(defaultData);

  // 🔥 5번 요청: 커스텀 분류 데이터 로컬스토리지 관리
  const [customCategories, setCustomCategories] = useState(() => {
    const saved = localStorage.getItem('todo_categories');
    return saved ? JSON.parse(saved) : ["행정", "수업", "상담", "행사"];
  });
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (todo && todo.id) setFormData(todo);
      else setFormData({ ...defaultData, dueDate: getTodayDateString() });
    }
  }, [isOpen, todo]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.title.trim()) return alert("업무명을 입력하세요.");
    onSave(formData);
    onClose();
  };

  const addCategory = () => {
    if(newCat.trim() && !customCategories.includes(newCat.trim())) {
      const updated = [...customCategories, newCat.trim()];
      setCustomCategories(updated);
      localStorage.setItem('todo_categories', JSON.stringify(updated));
      setFormData({...formData, category: newCat.trim()});
      setNewCat("");
    }
  };

  const deleteCategory = (catToRemove) => {
    if (!window.confirm(`'${catToRemove}' 분류를 목록에서 삭제하시겠습니까?`)) return;
    const updated = customCategories.filter(c => c !== catToRemove);
    setCustomCategories(updated);
    localStorage.setItem('todo_categories', JSON.stringify(updated));
    if (formData.category === catToRemove) setFormData({...formData, category: ""});
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold dark:text-white">{todo && todo.id ? "업무 수정" : "새 업무 등록"}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">업무명</label>
            <input 
              type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="예: 주간학습안내 작성" autoFocus
            />
          </div>

          {/* 🔥 5번 요청: 세련된 분류 버튼 폼 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">분류 선택</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {customCategories.map(c => (
                <div key={c} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border ${formData.category === c ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}`}>
                  <span onClick={() => setFormData({...formData, category: c})}>{c}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteCategory(c); }} className={`ml-1 p-0.5 rounded-full ${formData.category === c ? 'hover:bg-indigo-700' : 'hover:bg-gray-200 dark:hover:bg-gray-600'} transition`}>
                    <X size={12}/>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="새 분류 추가..." className="flex-1 p-2 text-sm border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"/>
              <button onClick={addCategory} className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-white px-3 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-500 transition flex items-center gap-1"><Plus size={14}/> 추가</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">마감일</label>
              <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">중요도</label>
              <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="low">일반</option><option value="medium">중요</option><option value="high">긴급</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition font-bold">취소</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition">저장</button>
        </div>
      </div>
    </div>
  );
}