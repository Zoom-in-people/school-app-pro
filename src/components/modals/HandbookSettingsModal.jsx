import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, AlertTriangle, GraduationCap } from 'lucide-react';

export default function HandbookSettingsModal({ isOpen, onClose, handbook, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    isHomeroom: true,
    schoolInfo: { name: '', grade: '', class: '' } 
  });

  useEffect(() => {
    if (handbook) {
      setFormData({
        title: handbook.title || '',
        isHomeroom: handbook.isHomeroom ?? true,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
        
        {/* 헤더 (새로만들기와 통일) */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             교무수첩 설정 변경
           </h2>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition">
             <X className="text-white" />
           </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. 교무수첩 이름 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">교무수첩 이름</label>
              <input 
                type="text" 
                required
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="예: 2026학년도 1학기"
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition dark:text-white"
              />
            </div>

            {/* 2. 담임 여부 */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-200">
                  <GraduationCap size={20}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">담임 선생님이신가요?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">우리반 관리 기능을 사용합니다.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isHomeroom} 
                  onChange={(e) => setFormData({...formData, isHomeroom: e.target.checked})} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 3. 학교 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">학교명</label>
                <input 
                  type="text" 
                  value={formData.schoolInfo.name} 
                  onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, name: e.target.value}})} 
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 transition dark:text-white mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">학년</label>
                <input 
                  type="text" 
                  value={formData.schoolInfo.grade} 
                  onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, grade: e.target.value}})} 
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 transition dark:text-white mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">반</label>
                <input 
                  type="text" 
                  value={formData.schoolInfo.class} 
                  onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, class: e.target.value}})} 
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 transition dark:text-white mt-1"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2">
              <Save size={20}/> 변경사항 저장
            </button>
          </form>

          {/* 삭제 영역 */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button"
              onClick={handleDelete}
              className="w-full group flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-200 transition dark:bg-red-900/10 dark:border-red-900/30 dark:hover:bg-red-900/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition dark:bg-red-900/50">
                  <Trash2 size={20}/>
                </div>
                <div className="text-left">
                  <p className="font-bold text-red-600 dark:text-red-400 text-sm">교무수첩 삭제</p>
                  <p className="text-xs text-red-400 dark:text-red-300">데이터가 영구적으로 삭제됩니다.</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-white dark:bg-red-900/50 px-3 py-1.5 rounded-lg text-red-500 border border-red-100 dark:border-red-800">삭제하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}