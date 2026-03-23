import React, { useState, useEffect } from 'react';
import { X, Plus, Save } from 'lucide-react';
import { showToast } from '../../utils/alerts';

export default function EditStudentModal({ isOpen, onClose, student, onSave, existingClasses, isHomeroomView }) {
  // 🔥 2번 요청: creditSubject 기본값 추가
  const defaultData = { grade: "1", class: "1", number: "", name: "", phone: "", parentPhone: "", address: "", tags: [], autoActivity: "", uniqueness: "", creditSubject: "" };
  const [formData, setFormData] = useState(defaultData);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (student) setFormData({ ...defaultData, ...student, tags: student.tags || [] });
      else setFormData(defaultData);
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.name.trim() || !formData.number.toString().trim()) {
      showToast('이름과 번호는 필수입니다.', 'warning');
      return;
    }
    onSave(formData);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-indigo-600 p-5 flex justify-between items-center shrink-0">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">{student ? "학생 정보 수정" : "새 학생 등록"}</h3>
          <button onClick={onClose} className="text-white/80 hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">학년</label>
              <input type="number" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">반</label>
              <input type="text" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">번호</label>
              <input type="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">이름</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {/* 🔥 2번 요청: 교과 전담인 경우 학점제 과목 노출 */}
            {!isHomeroomView && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">학점제과목 (선택)</label>
                <input type="text" value={formData.creditSubject} onChange={e => setFormData({...formData, creditSubject: e.target.value})} placeholder="예: 물리학I" className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
          </div>

          {isHomeroomView && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">학생 연락처</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">보호자 연락처</label>
                <input type="text" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">특성 태그</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(t => (
                <span key={t} className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-indigo-100 dark:border-indigo-800">
                  #{t} <button onClick={() => removeTag(t)} className="text-indigo-400 hover:text-indigo-700 ml-1"><X size={12}/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTag(e)} placeholder="새 태그 입력 (엔터)" className="flex-1 p-2.5 text-sm border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500" />
              <button onClick={handleAddTag} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-4 rounded-lg font-bold text-sm transition"><Plus size={16}/></button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">학생 특기사항 / 교과 세특 기초 자료</label>
            <textarea value={formData.uniqueness} onChange={e => setFormData({...formData, uniqueness: e.target.value})} rows="4" className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 resize-none custom-scrollbar" placeholder="학생의 특징이나 활동 내용을 적어주세요."></textarea>
          </div>
        </div>

        <div className="p-5 border-t dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition">취소</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"><Save size={18}/> 저장하기</button>
        </div>
      </div>
    </div>
  );
}