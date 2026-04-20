import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Plus, Trash2, Save, X } from 'lucide-react';
import { showToast, showConfirm } from '../utils/alerts';

export default function StudentManager({ students = [], onAddStudents, onUpdateStudent, onDeleteStudent, isHomeroomView }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // 🔥 원상복구: 기존에 사용하던 '학년-반', '수강과목' 필터 상태 부활
  const [activeClassFilter, setActiveClassFilter] = useState(null);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState(null);

  const safeStudents = Array.isArray(students) ? students : [];

  // 🔥 원상복구: DB에 있는 기존 [학년-반] 조합을 읽어와서 탭으로 만듦
  const existingClasses = useMemo(() => {
    const classes = new Set(safeStudents.map(s => {
      if (s.grade && s.class) return `${s.grade}-${s.class}`;
      if (s.grade) return `${s.grade}학년`;
      if (s.class) return `${s.class}반`;
      return '';
    }).filter(Boolean));
    return Array.from(classes).sort();
  }, [safeStudents]);

  // 🔥 원상복구: DB에 있는 기존 [과목] 조합을 읽어와서 탭으로 만듦
  const existingSubjects = useMemo(() => {
    const subjects = new Set(safeStudents.map(s => s.creditSubject).filter(Boolean));
    return Array.from(subjects).sort();
  }, [safeStudents]);

  // 🔥 원상복구: 학년-반, 과목, 검색어 필터링 로직 완벽 적용
  const filteredStudents = useMemo(() => {
    let result = safeStudents;
    
    if (activeClassFilter) {
      result = result.filter(s => {
        const clsStr = (s.grade && s.class) ? `${s.grade}-${s.class}` : (s.grade ? `${s.grade}학년` : (s.class ? `${s.class}반` : ''));
        return clsStr === activeClassFilter;
      });
    }
    
    if (!isHomeroomView && activeSubjectFilter) {
      result = result.filter(s => s.creditSubject === activeSubjectFilter);
    }
    
    if (searchQuery) {
      result = result.filter(s => 
        s.name.includes(searchQuery) || 
        (s.number && s.number.toString().includes(searchQuery)) ||
        (s.tags && s.tags.includes(searchQuery)) ||
        (s.creditSubject && s.creditSubject.includes(searchQuery))
      );
    }

    return result.sort((a, b) => {
      if (a.grade !== b.grade) return Number(a.grade || 0) - Number(b.grade || 0);
      if (a.class !== b.class) return Number(a.class || 0) - Number(b.class || 0);
      return Number(a.number || 0) - Number(b.number || 0);
    });
  }, [safeStudents, searchQuery, activeClassFilter, activeSubjectFilter, isHomeroomView]);

  const handleCreateNew = () => {
    let defaultGrade = '';
    let defaultClass = '';
    if (activeClassFilter) {
      const parts = activeClassFilter.split('-');
      if (parts.length === 2) {
        defaultGrade = parts[0];
        defaultClass = parts[1];
      }
    }
    setSelectedStudent({ 
      grade: defaultGrade,
      class: defaultClass,
      number: '', name: '', gender: '남', tags: '', note: '', phone: '', parentPhone: '',
      creditSubject: (!isHomeroomView && activeSubjectFilter) ? activeSubjectFilter : ''
    });
  };

  const handleSaveStudent = (data) => {
    if (!data.name.trim()) return showToast('이름을 입력해주세요.', 'warning');
    if (data.id) {
      onUpdateStudent(data.id, data);
      showToast('수정되었습니다.');
    } else {
      const newStudent = { ...data, id: Date.now().toString() };
      if (onAddStudents) onAddStudents([newStudent]);
      setSelectedStudent(newStudent);
      showToast('학생이 추가되었습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (await showConfirm('정말로 삭제하시겠습니까?', '이 학생의 모든 기록이 삭제됩니다.')) {
      onDeleteStudent(id);
      setSelectedStudent(null);
      showToast('삭제되었습니다.');
    }
  };

  const handleBulkSave = () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    
    let defaultGrade = '';
    let defaultClass = '';
    if (activeClassFilter) {
      const parts = activeClassFilter.split('-');
      if (parts.length === 2) {
        defaultGrade = parts[0];
        defaultClass = parts[1];
      }
    }

    const newStudents = lines.map((line, idx) => {
      const parts = line.trim().split(/\s+/);
      const num = parseInt(parts[0]);
      const name = isNaN(num) ? line.trim() : parts.slice(1).join(' ');
      return { 
        id: (Date.now() + idx).toString(),
        grade: defaultGrade,
        class: defaultClass,
        number: isNaN(num) ? '' : num, 
        name: name || parts[0], 
        gender: '남', tags: '', note: '',
        creditSubject: (!isHomeroomView && activeSubjectFilter) ? activeSubjectFilter : ''
      };
    });
    if (onAddStudents) onAddStudents(newStudents);
    setShowBulkAdd(false);
    setBulkText('');
    showToast(`${newStudents.length}명의 학생이 추가되었습니다.`);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 animate-in fade-in">
      
      {/* 🔹 왼쪽: 학생 목록 리스트 및 필터 영역 */}
      <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0 h-1/2 md:h-full">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex flex-col gap-3 shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
              <Users className="text-indigo-500" size={20}/> 
              {isHomeroomView ? '우리 반 명렬표' : '교과 명렬표'}
            </h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-1 rounded-full">
              총 {filteredStudents.length}명
            </span>
          </div>

          {/* 🔥 잃어버렸던 반/과목 탭 UI 완벽 복구 */}
          <div className="flex flex-col gap-2 mb-1">
            {existingClasses.length > 0 && (
              <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                <span className="text-[11px] font-extrabold text-gray-400 flex items-center shrink-0 pr-1">반 필터:</span>
                {existingClasses.map(cls => (
                  <button 
                    key={cls} onClick={() => setActiveClassFilter(activeClassFilter === cls ? null : cls)} 
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition ${activeClassFilter === cls ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            )}
            
            {!isHomeroomView && existingSubjects.length > 0 && (
              <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                <span className="text-[11px] font-extrabold text-orange-400 flex items-center shrink-0 pr-1">과목 필터:</span>
                {existingSubjects.map(sub => (
                  <button 
                    key={sub} onClick={() => setActiveSubjectFilter(activeSubjectFilter === sub ? null : sub)} 
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition ${activeSubjectFilter === sub ? 'bg-orange-500 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-orange-200 dark:border-orange-800/50 hover:bg-orange-50 dark:hover:bg-gray-600'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <input type="text" placeholder="이름, 번호, 태그 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-2.5 pl-9 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleCreateNew} className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white py-2 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center gap-1 shadow-sm"><Plus size={14}/> 1명 추가</button>
            <button onClick={() => setShowBulkAdd(true)} className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 py-2 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm">일괄 추가</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1 bg-white dark:bg-gray-800">
          {filteredStudents.length > 0 ? filteredStudents.map(s => (
            <div key={s.id} onClick={() => setSelectedStudent(s)} className={`p-3 rounded-xl cursor-pointer transition flex items-center gap-3 border ${selectedStudent?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:text-gray-200'}`}>
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black shrink-0 ${selectedStudent?.id === s.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{s.number}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate flex items-center gap-2">
                  {s.name}
                  {/* 이름 옆에 학년-반 표시 */}
                  {(s.grade || s.class) && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedStudent?.id === s.id ? 'bg-indigo-500 text-indigo-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                      {s.grade && `${s.grade}-`}{s.class}
                    </span>
                  )}
                </div>
                {/* 태그 및 수강과목 표시 */}
                <div className={`text-[10px] truncate mt-0.5 flex gap-1 ${selectedStudent?.id === s.id ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {!isHomeroomView && s.creditSubject && <span className="font-bold text-orange-400">[{s.creditSubject}]</span>}
                  {s.tags}
                </div>
              </div>
            </div>
          )) : (
            <div className="h-full flex flex-col justify-center items-center text-gray-400 p-4 text-center">
              <Users size={32} className="opacity-20 mb-2"/>
              <p className="text-sm font-bold">학생 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 오른쪽: 상세 정보 입력 폼 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-1/2 md:h-full">
        {selectedStudent ? (
          <StudentDetailForm student={selectedStudent} onSave={handleSaveStudent} onDelete={handleDelete} isHomeroomView={isHomeroomView} onCancel={() => setSelectedStudent(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-4 p-6 text-center bg-gray-50/50 dark:bg-gray-900/20">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-inner">
              <Users size={48} className="text-gray-300 dark:text-gray-500"/>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-600 dark:text-gray-300 mb-1">학생을 선택해주세요</h3>
              <p className="text-sm">왼쪽 명단에서 학생을 클릭하거나 추가 버튼을 눌러 정보를 등록하세요.</p>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 학생 일괄 추가 모달 */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Users className="text-indigo-500"/> 학생 일괄 추가</h3>
              <button onClick={() => setShowBulkAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20}/></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              번호와 이름을 띄어쓰기로 구분하여 한 줄에 한 명씩 입력하세요.<br/>(예: 1 홍길동)
              {activeClassFilter && (
                <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-bold">※ 현재 선택된 '{activeClassFilter}'반에 자동 배정됩니다.</span>
              )}
            </p>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} className="w-full h-48 p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none resize-none mb-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 custom-scrollbar" placeholder="1 김철수&#10;2 이영희&#10;3 박민수"></textarea>
            <button onClick={handleBulkSave} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md">일괄 저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔹 분할 화면 우측에 들어갈 상세 폼 컴포넌트
function StudentDetailForm({ student, onSave, onDelete, isHomeroomView, onCancel }) {
  const [form, setForm] = useState(student);
  useEffect(() => setForm(student), [student]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shrink-0">
        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
          {student.id ? '학생 정보 상세' : '새 학생 등록'}
        </h3>
        <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 transition"><X size={20}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/20">
        
        {/* 🔥 잃어버렸던 학년, 반, 번호 입력창 완벽 복구 */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">학년</label>
            <input type="text" name="grade" value={form.grade || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 1" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">반</label>
            <input type="text" name="class" value={form.class || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 3" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">번호</label>
            <input type="number" name="number" value={form.number || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 15" />
          </div>
        </div>

        {/* 🔥 잃어버렸던 수강과목 입력창 완벽 복구 */}
        <div className={`grid ${!isHomeroomView ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">이름</label>
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 홍길동" />
          </div>
          
          {!isHomeroomView && (
            <div>
              <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">수강 과목</label>
              <input type="text" name="creditSubject" value={form.creditSubject || ''} onChange={handleChange} className="w-full p-3 border border-orange-200 rounded-xl bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-800/50 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition shadow-sm" placeholder="예: 물리학I" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">성별</label>
          <div className="flex gap-3">
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition font-bold text-sm ${form.gender === '남' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 shadow-sm' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>
              <input type="radio" name="gender" value="남" checked={form.gender === '남'} onChange={handleChange} className="sr-only" /> 남학생
            </label>
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition font-bold text-sm ${form.gender === '여' ? 'bg-pink-50 border-pink-200 text-pink-700 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-400 shadow-sm' : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>
              <input type="radio" name="gender" value="여" checked={form.gender === '여'} onChange={handleChange} className="sr-only" /> 여학생
            </label>
          </div>
        </div>

        {isHomeroomView && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
            <div>
              <label className="block text-xs font-extrabold text-indigo-800/60 dark:text-indigo-300/60 mb-1.5 uppercase tracking-wider">학생 연락처</label>
              <input type="text" name="phone" value={form.phone || ''} onChange={handleChange} placeholder="010-0000-0000" className="w-full p-3 border border-indigo-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-indigo-800/60 dark:text-indigo-300/60 mb-1.5 uppercase tracking-wider">학부모 연락처</label>
              <input type="text" name="parentPhone" value={form.parentPhone || ''} onChange={handleChange} placeholder="010-0000-0000" className="w-full p-3 border border-indigo-100 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">태그 / 특징 (쉼표 구분)</label>
          <input type="text" name="tags" value={form.tags || ''} onChange={handleChange} placeholder="예: 모범생, 체육부장, 활발함" className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">특기사항 / 메모</label>
          <textarea name="note" value={form.note || ''} onChange={handleChange} rows={6} placeholder="학생 관리에 필요한 상세 메모를 자유롭게 기록하세요." className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm resize-none custom-scrollbar" />
        </div>
      </div>

      <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between shrink-0">
        {student.id ? (
          <button onClick={() => onDelete(student.id)} className="px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition flex items-center gap-2 border border-transparent hover:border-red-100 dark:hover:border-red-800"><Trash2 size={18}/> <span className="hidden sm:inline">학생 삭제</span></button>
        ) : <div></div>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-5 py-2.5 text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-bold transition">닫기</button>
          <button onClick={() => onSave(form)} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md flex items-center gap-2"><Save size={18}/> 저장하기</button>
        </div>
      </div>
    </div>
  );
}