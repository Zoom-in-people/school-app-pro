import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TodoModal({ isOpen, onClose, initialData, onSave, categories = ["행정", "수업", "상담", "행사"] }) {
  // 기본값 정의
  const defaultData = { 
    title: "", 
    category: "행정", 
    dueDate: new Date().toISOString().split('T')[0], 
    priority: "medium", 
    done: false 
  };

  const [formData, setFormData] = useState(defaultData);

  // 🔥 핵심 수정: 모달이 열릴 때마다 데이터 초기화 (이게 없으면 이전 상태가 남거나 비어있어서 오류남)
  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.id) {
        setFormData(initialData); // 수정 모드
      } else {
        setFormData(defaultData); // 추가 모드 (초기화)
      }
    }
  }, [isOpen, initialData]);

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
            {initialData && initialData.id ? "업무 수정" : "새 업무 등록"}
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