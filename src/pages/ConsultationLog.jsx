import React, { useState } from 'react';
import { Search, Plus, Calendar, User, MessageSquare, Tag, Trash2, X, Save, Filter } from 'lucide-react';

export default function ConsultationLog({ students = [], consultations = [], onAddConsultation, onDeleteConsultation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: 'student', content: '', category: '생활' });

  const filteredLogs = consultations.filter(log => {
    const student = students.find(s => s.id === log.studentId);
    const studentName = student ? student.name : '삭제된 학생';
    return studentName.includes(searchTerm) || log.content.includes(searchTerm);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = () => {
    if (!selectedStudentId) { alert("학생을 선택해주세요."); return; }
    if (!formData.content) { alert("상담 내용을 입력해주세요."); return; }
    
    onAddConsultation({
      studentId: selectedStudentId,
      ...formData
    });
    
    setIsModalOpen(false);
    setFormData({ date: new Date().toISOString().split('T')[0], type: 'student', content: '', category: '생활' });
    setSelectedStudentId('');
  };

  const getStudentName = (id) => {
    const s = students.find(st => st.id === id);
    return s ? s.name : '(정보 없음)';
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* 🔥 [수정] 모바일 최적화 헤더: flex-col sm:flex-row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl md:text-2xl font-bold dark:text-white flex items-center gap-2">
          <MessageSquare className="text-indigo-600 w-6 h-6 md:w-8 md:h-8"/> 
          <span>학생 상담 일지</span>
        </h2>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input 
              type="text" 
              placeholder="이름, 내용 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg text-sm shrink-0"
          >
            <Plus size={18} /> <span className="hidden sm:inline">상담 기록</span><span className="sm:hidden">기록</span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {filteredLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
            <MessageSquare size={48} className="mb-4 opacity-20"/>
            <p>기록된 상담 일지가 없습니다.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-100 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-gray-500 transition group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                      <User size={12}/> {getStudentName(log.studentId)}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${
                      log.type === 'student' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {log.type === 'student' ? '학생상담' : '학부모상담'}
                    </span>
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Calendar size={12}/> {log.date}
                    </span>
                  </div>
                  <button onClick={() => { if(window.confirm('삭제하시겠습니까?')) onDeleteConsultation(log.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1">
                    <Trash2 size={16}/>
                  </button>
                </div>
                
                <div className="pl-1 border-l-4 border-indigo-200 dark:border-indigo-800 ml-1">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm ml-3">
                    {log.content}
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">#{log.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold dark:text-white">상담 기록 추가</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="text-gray-500 hover:text-gray-700 dark:text-gray-400" /></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-gray-300">날짜</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-gray-300">대상 학생</label>
                  <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="">선택하세요</option>
                    {students.sort((a,b)=>parseInt(a.number)-parseInt(b.number)).map(s => (
                      <option key={s.id} value={s.id}>{s.number}번 {s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-gray-300">상담 유형</label>
                  <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <button onClick={() => setFormData({...formData, type: 'student'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${formData.type === 'student' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}>학생</button>
                    <button onClick={() => setFormData({...formData, type: 'parent'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${formData.type === 'parent' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500'}`}>학부모</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 dark:text-gray-300">카테고리</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option>생활</option><option>학업</option><option>진로</option><option>교우관계</option><option>기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 dark:text-gray-300">상담 내용</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows="6" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none" placeholder="상담 내용을 상세히 기록하세요."></textarea>
              </div>

              <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
                <Save size={18}/> 저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}