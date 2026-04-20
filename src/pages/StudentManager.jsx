import React, { useState, useMemo, useEffect } from 'react';
import { Users, Search, Plus, Trash2, Save, X, Filter } from 'lucide-react';
import { showToast, showConfirm } from '../utils/alerts';

export default function StudentManager({ students = [], onAddStudents, onUpdateStudent, onDeleteStudent, isHomeroomView }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // 🔥 교과 모드용 반/그룹 선택 상태
  const [selectedGroup, setSelectedGroup] = useState('전체');

  // 등록된 학생들로부터 고유한 반/그룹명 추출 (교과 모드일 때만)
  const groups = useMemo(() => {
    if (isHomeroomView) return [];
    const groupSet = new Set(students.map(s => s.className).filter(Boolean));
    return ['전체', ...Array.from(groupSet).sort(), '미지정'];
  }, [students, isHomeroomView]);

  // 검색 및 그룹 필터링 적용
  const filteredStudents = useMemo(() => {
    let result = students;
    if (!isHomeroomView && selectedGroup !== '전체') {
      if (selectedGroup === '미지정') {
        result = result.filter(s => !s.className);
      } else {
        result = result.filter(s => s.className === selectedGroup);
      }
    }
    return result
      .filter(s => s.name.includes(searchQuery) || (s.number && s.number.toString().includes(searchQuery)))
      .sort((a, b) => Number(a.number) - Number(b.number));
  }, [students, searchQuery, isHomeroomView, selectedGroup]);

  const handleCreateNew = () => {
    setSelectedStudent({ 
      number: '', name: '', gender: '남', tags: '', note: '', phone: '', parentPhone: '',
      className: (!isHomeroomView && selectedGroup !== '전체' && selectedGroup !== '미지정') ? selectedGroup : ''
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
    const newStudents = lines.map((line, idx) => {
      const parts = line.trim().split(/\s+/);
      const num = parseInt(parts[0]);
      const name = isNaN(num) ? line.trim() : parts.slice(1).join(' ');
      return { 
        id: (Date.now() + idx).toString(),
        number: isNaN(num) ? '' : num, 
        name: name || parts[0], 
        gender: '남', tags: '', note: '',
        className: (!isHomeroomView && selectedGroup !== '전체' && selectedGroup !== '미지정') ? selectedGroup : ''
      };
    });
    if (onAddStudents) onAddStudents(newStudents);
    setShowBulkAdd(false);
    setBulkText('');
    showToast(`${newStudents.length}명의 학생이 추가되었습니다.`);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4 animate-in fade-in">
      
      {/* 🔹 왼쪽: 학생 목록 리스트 (검색, 필터링 및 추가) */}
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

          {/* 🔥 교과 모드일 때만 나타나는 반/그룹 탭 */}
          {!isHomeroomView && groups.length > 1 && (
            <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
              {groups.map(g => (
                <button 
                  key={g} onClick={() => setSelectedGroup(g)} 
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${selectedGroup === g ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          <div className="relative mt-1">
            <input type="text" placeholder="이름 또는 번호 검색..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full p-2.5 pl-9 border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" />
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
                  {/* 교과 모드에서 반 정보가 있으면 태그로 표시 */}
                  {!isHomeroomView && s.className && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedStudent?.id === s.id ? 'bg-indigo-500 text-indigo-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                      {s.className}
                    </span>
                  )}
                </div>
                {s.tags && <div className={`text-[10px] truncate mt-0.5 ${selectedStudent?.id === s.id ? 'text-indigo-200' : 'text-gray-400'}`}>{s.tags}</div>}
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
              <p className="text-sm">왼쪽 명단에서 학생을 클릭하거나 상단의 추가 버튼을 눌러 상세 정보를 관리하세요.</p>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 학생 일괄 추가 모달 (여러 명 복붙 전용) */}
      {showBulkAdd && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg dark:text-white flex items-center gap-2"><Users className="text-indigo-500"/> 학생 일괄 추가</h3>
              <button onClick={() => setShowBulkAdd(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X size={20}/></button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
              번호와 이름을 띄어쓰기로 구분하여 한 줄에 한 명씩 입력하세요.<br/>(예: 1 홍길동)
              {!isHomeroomView && selectedGroup !== '전체' && selectedGroup !== '미지정' && (
                <span className="block mt-1 text-indigo-600 dark:text-indigo-400 font-bold">※ 현재 선택된 '{selectedGroup}'에 일괄 추가됩니다.</span>
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">번호</label>
            <input type="number" name="number" value={form.number || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 1" />
          </div>
          <div>
            <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">이름</label>
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 홍길동" />
          </div>
          
          {/* 🔥 교과 모드일 때 그룹 입력 칸 활성화 */}
          {!isHomeroomView && (
            <div className="col-span-2">
              <label className="block text-xs font-extrabold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">소속 반 / 그룹명</label>
              <input type="text" name="className" value={form.className || ''} onChange={handleChange} className="w-full p-3 border border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-sm" placeholder="예: 1반, 2반, 동아리A" />
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