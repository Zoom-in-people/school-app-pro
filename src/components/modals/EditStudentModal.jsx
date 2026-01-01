import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

export default function EditStudentModal({ isOpen, onClose, student, onSave, existingClasses, isHomeroomView }) {
  const defaultStudent = { 
    grade: "3", class: "1", number: "", name: "", 
    phone: "", parentPhone: "", address: "", 
    tags: [], autoActivity: "", uniqueness: "" 
  };

  const [data, setData] = useState(student || defaultStudent);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (student) {
      setData(student);
    } else {
      setData(defaultStudent);
    }
  }, [student, isOpen]);

  if (!isOpen || !data) return null;

  const addTag = () => { 
    if(newTag) { 
      setData({...data, tags: [...(data.tags || []), newTag]}); 
      setNewTag(""); 
    }
  };

  const removeTag = (t) => setData({...data, tags: data.tags.filter(tag => tag !== t)});

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold dark:text-white">
            {data.id ? '학생 정보 수정' : '학생 추가'} ({isHomeroomView ? '담임' : '수업'})
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"/></button>
        </div>

        <div className="space-y-4">
          {/* 기본 학적 정보 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">학년</label>
              <input type="text" value={data.grade || ""} onChange={e => setData({...data, grade: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">반</label>
              <input list="classes" type="text" value={data.class || ""} onChange={e => setData({...data, class: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
              <datalist id="classes">{existingClasses && existingClasses.map(c => <option key={c} value={c}/>)}</datalist>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">번호</label>
              <input type="number" value={data.number || ""} onChange={e => setData({...data, number: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-500 mb-1">이름</label>
            <input type="text" value={data.name || ""} onChange={e => setData({...data, name: e.target.value})} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="이름"/>
          </div>
          
          {/* 🔥 담임 모드일 때만 연락처/주소 표시 */}
          {isHomeroomView && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">학생 연락처</label>
                  <input type="text" value={data.phone || ""} onChange={e => setData({...data, phone: e.target.value})} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="연락처"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">보호자 연락처</label>
                  <input type="text" value={data.parentPhone || ""} onChange={e => setData({...data, parentPhone: e.target.value})} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="보호자 연락처"/>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">주소</label>
                <input type="text" value={data.address || ""} onChange={e => setData({...data, address: e.target.value})} className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="주소"/>
              </div>
            </>
          )}

          {/* 태그 및 기록 (담임/수업 모두 표시) */}
          <div>
            <label className="block text-sm text-gray-500 mb-1">특성 태그</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} className="flex-1 border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="태그 추가 (예: 성실함)"/>
              <button onClick={addTag} className="bg-gray-200 dark:bg-gray-600 px-3 rounded text-gray-700 dark:text-white"><Plus size={16}/></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags && data.tags.map(tag => (
                <span key={tag} className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs flex items-center gap-1 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {tag}<X size={12} className="cursor-pointer" onClick={() => removeTag(tag)}/>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 mb-1">자율활동 / 특기사항</label>
            <textarea value={data.autoActivity || ""} onChange={e => setData({...data, autoActivity: e.target.value})} className="w-full h-20 border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600 mb-2" placeholder="자율활동 내용"/>
            <textarea value={data.uniqueness || ""} onChange={e => setData({...data, uniqueness: e.target.value})} className="w-full h-20 border p-2 rounded dark:bg-gray-700 dark:text-white dark:border-gray-600" placeholder="기타 특이사항"/>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">취소</button>
          <button onClick={() => onSave(data)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">저장</button>
        </div>
      </div>
    </div>
  );
}