import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';

export default function HandbookSettingsModal({ isOpen, onClose, handbook, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({ title: '', schoolInfo: { name: '', grade: '', class: '' } });

  useEffect(() => {
    if (handbook) {
      setFormData({
        title: handbook.title || '',
        schoolInfo: handbook.schoolInfo || { name: '', grade: '', class: '' }
      });
    }
  }, [handbook, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(handbook.id, formData);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(
      "정말로 이 교무수첩을 삭제하시겠습니까?\n\n" +
      "⚠️ 주의: 입력한 모든 학생 정보와 상담 기록이 영구적으로 삭제됩니다.\n" +
      "(구글 드라이브의 파일은 휴지통으로 이동됩니다)"
    )) {
      onDelete(handbook.id);
    }
  };

  if (!isOpen || !handbook) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">교무수첩 설정</h2>
          <button onClick={onClose}><X className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" /></button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">교무수첩 이름</label>
              <input 
                type="text" 
                required
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학교명</label>
                <input 
                  type="text" 
                  value={formData.schoolInfo.name} 
                  onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, name: e.target.value}})} 
                  className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학년</label>
                  <input 
                    type="text" 
                    value={formData.schoolInfo.grade} 
                    onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, grade: e.target.value}})} 
                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">반</label>
                  <input 
                    type="text" 
                    value={formData.schoolInfo.class} 
                    onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, class: e.target.value}})} 
                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
              <Save size={18}/> 저장하기
            </button>
          </form>

          {/* 삭제 영역 (구분선 아래) */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1">
              <AlertTriangle size={14}/> 위험 구역
            </h4>
            <button 
              type="button"
              onClick={handleDelete}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
            >
              <Trash2 size={18}/> 이 교무수첩 삭제하기
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              삭제 시 해당 수첩의 모든 데이터가 사라집니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}