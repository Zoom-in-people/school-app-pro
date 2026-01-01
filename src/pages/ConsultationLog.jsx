import React, { useState } from 'react';
import { Users, Plus, Trash2, Edit2, X } from 'lucide-react';

function ConsultationModal({ isOpen, onClose, students, preSelectedId, onSave, initialData }) {
  const [formData, setFormData] = useState(initialData || {
    studentId: preSelectedId || (students[0] ? students[0].id : ""),
    date: new Date().toISOString().split('T')[0],
    category: "진로", content: "", action: ""
  });

  // 초기 데이터가 변경되면 폼 업데이트 (수정 모드 진입 시)
  React.useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ studentId: preSelectedId || (students[0]?.id || ""), date: new Date().toISOString().split('T')[0], category: "진로", content: "", action: "" });
  }, [initialData, preSelectedId, students, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-indigo-600 text-white">
          <h3 className="font-bold text-lg">{initialData ? "상담 기록 수정" : "상담 기록 작성"}</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">학생 선택</label>
              <select value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                {students.map(s => <option key={s.id} value={s.id}>{s.grade}-{s.class}-{s.number} {s.name}</option>)}
              </select>
            </div>
            <div>
               <label className="block text-sm font-bold mb-1 dark:text-gray-300">날짜</label>
               <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 dark:text-gray-300">카테고리</label>
            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
              {["진로", "학업", "교우관계", "생활", "행동특성", "기타"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 dark:text-gray-300">내용</label>
            <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-3 border rounded h-24 dark:bg-gray-700 dark:text-white" placeholder="상담 내용"/>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 dark:text-gray-300">조치사항</label>
            <textarea value={formData.action} onChange={e => setFormData({...formData, action: e.target.value})} className="w-full p-3 border rounded h-16 dark:bg-gray-700 dark:text-white" placeholder="조치 사항"/>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button onClick={() => { onSave(formData); onClose(); }} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">저장하기</button>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationLog({ students, consultations, onAddConsultation, onDeleteConsultation }) {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null); // 수정할 로그

  const filteredLogs = selectedStudentId ? consultations.filter(c => c.studentId === selectedStudentId) : consultations;
  filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 🔥 수정/추가 핸들러 통합
  const handleSave = (data) => {
    if (editingLog) {
      // 수정: 기존 데이터 삭제 후 추가 (Firestore update 함수를 별도로 받는게 정석이지만, 여기선 onAddConsultation이 update 역할도 한다고 가정하거나, 삭제 후 추가 방식 사용)
      // 하지만 App.jsx의 onAddConsultation은 addDoc만 하므로, 여기서는 App.jsx를 수정하기보다, 삭제 후 추가 방식을 쓰거나 (비효율), App.jsx에서 update함수를 받아야 함.
      // -> 가장 깔끔한건 App.jsx에서 updateConsultation을 내려주는 것.
      // (App.jsx 수정 없이 하려면 삭제 후 추가)
      onDeleteConsultation(editingLog.id); // 기존 삭제
      onAddConsultation(data); // 새 데이터 추가 (ID 변경됨)
      // *참고: ID 유지가 중요하다면 App.jsx의 update 함수를 사용해야 합니다. 일단 기존 구조상 삭제/추가로 구현.
    } else {
      onAddConsultation(data);
    }
    setEditingLog(null);
  };
  
  // * 개선: App.jsx에서 update 함수를 안 받으므로, ID 유지를 위해 onAddConsultation이 ID가 있으면 update하도록 App.jsx를 수정했는지 확인.
  // 아까 App.jsx 전체 코드에서 `onAddConsultation={addConsultation}`만 되어있음. 
  // 상담 수정 기능을 완벽히 하려면 App.jsx에서 `updateConsultation`을 넘겨줘야 함.
  // 여기서는 일단 삭제 -> 추가 로직으로 구현합니다.

  const openEdit = (log) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingLog(null);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px] flex gap-6">
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 pr-6 flex flex-col">
        <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2"><Users className="text-indigo-500" /> 학생 선택</h3>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          <button onClick={() => setSelectedStudentId(null)} className={`w-full text-left p-3 rounded-lg text-sm transition ${!selectedStudentId ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}>📋 전체 보기</button>
          {students.sort((a,b)=>Number(a.number)-Number(b.number)).map(student => (
            <button key={student.id} onClick={() => setSelectedStudentId(student.id)} className={`w-full text-left p-3 rounded-lg text-sm transition flex justify-between items-center ${selectedStudentId === student.id ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
              <span>{student.number}번 {student.name}</span>
              {consultations.some(c => c.studentId === student.id) && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold dark:text-white">💬 상담 일지</h3>
          <button onClick={openAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Plus size={18} /> 기록하기</button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {filteredLogs.length > 0 ? filteredLogs.map(log => {
            const student = students.find(s => s.id === log.studentId);
            return (
              <div key={log.id} className="border border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:shadow-md transition bg-gray-50 dark:bg-gray-700/50 relative group">
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button onClick={() => openEdit(log)} className="text-gray-400 hover:text-indigo-500"><Edit2 size={16}/></button>
                  <button onClick={() => onDeleteConsultation(log.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-bold text-lg dark:text-white">{student ? student.name : "삭제된 학생"}</span>
                  <span className="text-xs text-gray-500">{log.date}</span>
                  <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded">{log.category}</span>
                </div>
                <p className="text-sm dark:text-gray-200 whitespace-pre-wrap">{log.content}</p>
                {log.action && <p className="mt-2 text-sm text-gray-500 border-t pt-2 dark:border-gray-600">↳ 조치: {log.action}</p>}
              </div>
            );
          }) : <div className="text-center text-gray-400 py-10">기록된 상담 내용이 없습니다.</div>}
        </div>
      </div>
      <ConsultationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} students={students} preSelectedId={selectedStudentId} onSave={handleSave} initialData={editingLog} />
    </div>
  );
}