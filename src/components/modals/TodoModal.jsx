import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TodoModal({ isOpen, onClose, todo, onSave, categories = ["행정", "수업", "상담", "행사"] }) {
  // 오늘 날짜 구하는 함수 (한국 시간 기준 안전하게 처리)
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 🔥 3번 요청: 분류(category) 기본값을 비우고, 마감일(dueDate)을 오늘로 설정
  const defaultData = { 
    title: "", 
    category: "", 
    dueDate: getTodayDateString(), 
    priority: "medium", 
    done: false 
  };

  const [formData, setFormData] = useState(defaultData);

  // 🔥 1번 요청 해결: TaskList에서 전달한 'todo' 값을 인식하도록 수정
  useEffect(() => {
    if (isOpen) {
      if (todo && todo.id) {
        setFormData(todo); // 수정 모드
      } else {
        setFormData({ ...defaultData, dueDate: getTodayDateString() }); // 추가 모드 초기화
      }
    }
  }, [isOpen, todo]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.title.trim()) return alert("업무명을 입력하세요.");
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold dark:text-white">
            {todo && todo.id ? "업무 수정" : "새 업무 등록"}
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">업무명</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="예: 주간학습안내 작성"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">분류 (직접 입력 가능)</label>
            <input 
              list="category-options" 
              value={formData.category} 
              onChange={e => setFormData({...formData, category: e.target.value})} 
              className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="분류 선택 또는 입력"
            />
            <datalist id="category-options">
              {categories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">마감일</label>
              <input 
                type="date" 
                value={formData.dueDate} 
                onChange={e => setFormData({...formData, dueDate: e.target.value})} 
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">중요도</label>
              <select 
                value={formData.priority} 
                onChange={e => setFormData({...formData, priority: e.target.value})} 
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="low">일반</option>
                <option value="medium">중요</option>
                <option value="high">긴급</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">취소</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition">저장</button>
        </div>
      </div>
    </div>
  );
}