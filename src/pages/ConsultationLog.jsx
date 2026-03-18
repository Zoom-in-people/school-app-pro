import React, { useState, useMemo } from 'react';
import { Search, Plus, Calendar, User, MessageSquare, Tag, Trash2, Edit2, X, Save } from 'lucide-react';

export default function ConsultationLog({ students = [], consultations = [], onAddConsultation, onUpdateConsultation, onDeleteConsultation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState('all');

  const [editingLogId, setEditingLogId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split('T')[0], 
    type: 'student', 
    content: '', 
    category: '생활' 
  });

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (Number(a.grade) !== Number(b.grade)) return Number(a.grade) - Number(b.grade);
      if (Number(a.class) !== Number(b.class)) return Number(a.class) - Number(b.class);
      return Number(a.number) - Number(b.number);
    });
  }, [students]);

  const filteredLogs = useMemo(() => {
    let result = consultations;
    if (filterStudentId !== 'all') result = result.filter(log => log.studentId === filterStudentId);
    if (searchTerm) {
      result = result.filter(log => {
        const student = students.find(s => s.id === log.studentId);
        const name = student ? student.name : '';
        return name.includes(searchTerm) || log.content.includes(searchTerm);
      });
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [consultations, filterStudentId, searchTerm, students]);

  const handleSave = () => {
    if (!selectedStudentId) return alert("학생을 선택해주세요.");
    if (!formData.content) return alert("내용을 입력해주세요.");
    
    if (editingLogId) onUpdateConsultation(editingLogId, { studentId: selectedStudentId, ...formData });
    else onAddConsultation({ studentId: selectedStudentId, ...formData });
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLogId(null);
    setSelectedStudentId('');
    setFormData({ date: new Date().toISOString().split('T')[0], type: 'student', content: '', category: '생활' });
  };

  const handleEdit = (log) => {
    setSelectedStudentId(log.studentId);
    setFormData({ date: log.date, type: log.type, content: log.content, category: log.category });
    setEditingLogId(log.id);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" placeholder="상담 내용 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button onClick={() => { closeModal(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2">
          <Plus size={18}/> 새 상담 등록
        </button>
      </div>

      {/* 🔥 3번 요청 해결: flex-wrap 속성을 추가하여 가로 스크롤 대신 자동으로 여러 줄 바꿈이 되도록 수정 */}
      <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto custom-scrollbar">
        <button 
          onClick={() => setFilterStudentId('all')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold transition border ${filterStudentId === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'}`}
        >
          전체 보기
        </button>
        {sortedStudents.map(s => (
          <button 
            key={s.id} onClick={() => setFilterStudentId(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-bold transition border flex items-center gap-1.5 ${filterStudentId === s.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <span className="opacity-50 text-[10px]">{s.number}</span> {s.name}
          </button>
        ))}
      </div>

      {/* 🔥 2번 요청 해결: 그리드 뷰(2줄) 적용 (lg 화면 이상일 때 grid-cols-2) */}
      <div className="flex-1 overflow-y-auto pr-2">
        {filteredLogs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4 items-start">
            {filteredLogs.map(log => {
              const student = students.find(s => s.id === log.studentId);
              return (
                <div key={log.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-indigo-200 transition-all flex flex-col h-full">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-900/40 p-2 rounded-xl text-indigo-600 dark:text-indigo-300"><User size={20}/></div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {student ? `${student.grade}-${student.class} ${student.number}번 ${student.name}` : '삭제된 학생'}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${log.type === 'parent' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{log.type === 'parent' ? '학부모 상담' : '학생 상담'}</span>
                        </h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12}/> {log.date} · <Tag size={12}/> {log.category}</p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                      <button onClick={() => handleEdit(log)} className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg"><Edit2 size={18}/></button>
                      <button onClick={() => { if(window.confirm("삭제하시겠습니까?")) onDeleteConsultation(log.id); }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={18}/></button>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap flex-1">
                    {log.content}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400"><MessageSquare size={48} className="mx-auto mb-4 opacity-20"/><p>기록이 없습니다.</p></div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">{editingLogId ? <><Edit2 size={20}/> 상담 기록 수정</> : <><Plus size={20}/> 새 상담 기록</>}</h3>
              <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">상담 대상 선택</label>
                  <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">학생을 선택하세요</option>
                    {sortedStudents.map(s => (<option key={s.id} value={s.id}>{s.grade}-{s.class} {s.number}번 {s.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">상담 일자</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">상담 유형</label>
                  <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                    <button onClick={() => setFormData({...formData, type: 'student'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${formData.type === 'student' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>학생</button>
                    <button onClick={() => setFormData({...formData, type: 'parent'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${formData.type === 'parent' ? 'bg-white shadow text-orange-600' : 'text-gray-400'}`}>학부모</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">카테고리</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>생활</option><option>학업</option><option>진로</option><option>교우관계</option><option>기타</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">상담 내용</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows="5" className="w-full p-4 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="상담 내용을 입력하세요."></textarea>
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">취소</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"><Save size={18}/> {editingLogId ? '상담 수정' : '상담 저장'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}