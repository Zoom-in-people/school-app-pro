import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Plus, MoreHorizontal, User, Download, X, Trash2, Sparkles, Loader, ImageIcon, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadFileToStorage } from '../utils/storage';
import EditStudentModal from '../components/modals/EditStudentModal';
import AiGenModal from '../components/modals/AiGenModal';
import { downloadTemplate } from '../utils/helpers';
import { showToast, showAlert, showConfirm } from '../utils/alerts';

export default function StudentManager({ 
  students = [], onAddStudent, onAddStudents, onUpdateStudent, onDeleteStudent, onUpdateStudentsMany, 
  apiKey, isHomeroomView, classPhotos = [], onAddClassPhoto, onUpdateClassPhoto, onDeleteClassPhoto 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchAiModalOpen, setIsBatchAiModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [activeClassFilter, setActiveClassFilter] = useState(null);
  const [activeSubjectFilter, setActiveSubjectFilter] = useState(null);

  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef(null);
  
  const fileInputRef = useRef(null);
  const rosterFileInputRef = useRef(null);

  const safeStudents = Array.isArray(students) ? students : [];

  const existingClasses = useMemo(() => {
    const classes = new Set(safeStudents.map(s => `${s.grade}-${s.class}`));
    return Array.from(classes).sort();
  }, [safeStudents]);

  const existingSubjects = useMemo(() => {
    const subjects = new Set(safeStudents.map(s => s.creditSubject).filter(Boolean));
    return Array.from(subjects).sort();
  }, [safeStudents]);

  const filteredStudents = useMemo(() => {
    let result = safeStudents;
    if (searchTerm) {
      result = result.filter(s => 
        s.name.includes(searchTerm) || 
        (s.tags && s.tags.some(tag => tag.includes(searchTerm))) ||
        (s.uniqueness && s.uniqueness.includes(searchTerm))
      );
    }
    if (activeClassFilter) result = result.filter(s => `${s.grade}-${s.class}` === activeClassFilter);
    if (activeSubjectFilter) result = result.filter(s => s.creditSubject === activeSubjectFilter);

    return result.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      if (a.class !== b.class) return a.class - b.class;
      return Number(a.number) - Number(b.number);
    });
  }, [safeStudents, searchTerm, activeClassFilter, activeSubjectFilter]);

  // 🔥 2번 요청 해결: 필터가 활성화되어 있으면 무한스크롤을 해제하고 해당 그룹을 모두 보여주도록 수정
  useEffect(() => { 
    if (activeClassFilter || activeSubjectFilter || searchTerm) {
      setVisibleCount(1000); 
    } else {
      setVisibleCount(20); 
    }
  }, [searchTerm, activeClassFilter, activeSubjectFilter]);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting) setVisibleCount((prev) => prev + 20);
  }, []);

  useEffect(() => {
    const option = { root: null, rootMargin: "20px", threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      const parsedStudents = data.slice(1).map(row => {
        if (isHomeroomView) {
          return {
            grade: String(row[0] || ""), class: String(row[1] || ""), number: String(row[2] || ""),
            name: String(row[3] || ""), phone: String(row[4] || ""), parentPhone: String(row[5] || ""),
            address: String(row[6] || ""), tags: row[7] ? String(row[7]).split(",").map(t=>t.trim()) : [],
            autoActivity: String(row[8] || ""), uniqueness: String(row[9] || ""), creditSubject: "",
            memos: row[10] ? [{ id: Date.now(), date: new Date().toISOString().split('T')[0], content: String(row[10]) }] : []
          };
        } else {
          return {
            grade: String(row[0] || ""), class: String(row[1] || ""), number: String(row[2] || ""),
            name: String(row[3] || ""), creditSubject: String(row[4] || ""), tags: row[5] ? String(row[5]).split(",").map(t=>t.trim()) : [],
            autoActivity: String(row[6] || ""), uniqueness: String(row[7] || ""),
            aiGeneratedText: String(row[8] || "")
          };
        }
      }).filter(s => s.name);

      const newStudents = [];
      const updateTasks = [];
      parsedStudents.forEach(parsed => {
        const existing = safeStudents.find(s => String(s.grade) === String(parsed.grade) && String(s.class) === String(parsed.class) && String(s.number) === String(parsed.number) && String(s.name) === String(parsed.name));
        if (existing) updateTasks.push({ id: existing.id, fields: { ...parsed } });
        else newStudents.push(parsed);
      });

      const isConfirmed = await showConfirm(
        '엑셀 분석 완료!', 
        `새 학생 ${newStudents.length}명 추가, 기존 학생 ${updateTasks.length}명 덮어쓰기를 진행할까요?`,
        '저장하기', false
      );
      
      if (isConfirmed) {
        if (newStudents.length > 0) onAddStudents(newStudents);
        if (updateTasks.length > 0) onUpdateStudentsMany(updateTasks);
        showToast('성공적으로 업로드되었습니다.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!activeClassFilter) { showToast("사진을 등록할 '반'을 먼저 선택해주세요.", 'warning'); e.target.value = ''; return; }
    try {
      const uploaded = await uploadFileToStorage(file, 'class_photos');
      const newPhotoData = { id: activeClassFilter, classId: activeClassFilter, url: uploaded.url, fileName: uploaded.name, fullPath: uploaded.fullPath };
      const existing = classPhotos.find(p => p.classId === activeClassFilter);
      if (existing) onUpdateClassPhoto(existing.id, newPhotoData);
      else onAddClassPhoto(newPhotoData);
      showToast("사진이 성공적으로 업로드되었습니다!");
    } catch (error) { showAlert("업로드 실패", error.message, 'error'); }
    e.target.value = '';
  };

  const handleEdit = (student) => { setEditingStudent(student); setIsModalOpen(true); };
  const handleSaveStudent = (data) => { 
    if (editingStudent) onUpdateStudent(editingStudent.id, data); 
    else onAddStudent(data); 
    setIsModalOpen(false); setEditingStudent(null); 
    showToast('저장되었습니다.');
  };
  const handleDelete = async (id) => { 
    if (await showConfirm('학생을 삭제하시겠습니까?', '입력된 태그와 상담 기록이 모두 삭제됩니다.')) {
      onDeleteStudent(id); showToast('삭제되었습니다.');
    }
  };

  const currentClassPhoto = activeClassFilter ? classPhotos.find(p => p.classId === activeClassFilter) : null;

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-3 flex-1 min-w-[250px]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="이름, 태그 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-white transition-all" />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-gray-50 dark:bg-gray-900 p-1 rounded-lg border border-gray-100 dark:border-gray-700">
              <span className="text-xs font-bold text-gray-400 flex items-center px-2">반:</span>
              {existingClasses.map(cls => (
                <button key={cls} onClick={() => setActiveClassFilter(activeClassFilter === cls ? null : cls)} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors border ${activeClassFilter === cls ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100'}`}>
                  {cls}
                </button>
              ))}
            </div>

            {!isHomeroomView && existingSubjects.length > 0 && (
              <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-orange-50 dark:bg-orange-900/20 p-1 rounded-lg border border-orange-100 dark:border-orange-800">
                <span className="text-xs font-bold text-orange-400 flex items-center px-2">과목:</span>
                {existingSubjects.map(sub => (
                  <button key={sub} onClick={() => setActiveSubjectFilter(activeSubjectFilter === sub ? null : sub)} className={`px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-colors border ${activeSubjectFilter === sub ? 'bg-orange-500 text-white border-orange-500 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-orange-200 dark:border-orange-800/50 hover:bg-orange-100'}`}>
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => { setEditingStudent(null); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm"><Plus size={16}/> 학생 추가</button>
          <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
          <button onClick={() => downloadTemplate(safeStudents, isHomeroomView)} className="text-gray-500 hover:text-green-600 p-2 rounded-lg transition" title="엑셀 양식 다운로드"><Download size={20}/></button>
          <button onClick={() => fileInputRef.current.click()} className="text-gray-500 hover:text-blue-600 p-2 rounded-lg transition" title="엑셀 업로드"><Upload size={20}/></button>
          <button onClick={() => rosterFileInputRef.current.click()} className="text-gray-500 hover:text-purple-600 p-2 rounded-lg transition" title="사진 명렬표 업로드"><ImageIcon size={20}/></button>
          {apiKey && <button onClick={() => setIsBatchAiModalOpen(true)} className="text-gray-500 hover:text-yellow-500 p-2 rounded-lg transition" title="AI 세특 일괄 작성"><Sparkles size={20}/></button>}
        </div>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
      <input type="file" ref={rosterFileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeClassFilter && currentClassPhoto && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-indigo-100 dark:border-gray-700 overflow-hidden relative group">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={async () => { if(await showConfirm("사진을 삭제하시겠습니까?", "명렬표 사진이 지워집니다.")) onDeleteClassPhoto(currentClassPhoto.id); }} className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition"><Trash2 size={16}/></button>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-center font-bold text-indigo-800 dark:text-indigo-200 border-b border-indigo-100 dark:border-gray-700">
                📸 {activeClassFilter}반 사진 명렬표
              </div>
              <div className="p-4 flex justify-center bg-gray-50 dark:bg-gray-900/50">
                <img src={currentClassPhoto.url} alt="Class Roster" className="max-w-full max-h-[400px] object-contain rounded shadow-sm" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.length > 0 ? (
            <>
              {filteredStudents.slice(0, visibleCount).map(student => (
                <StudentCard key={student.id} student={student} onEdit={() => handleEdit(student)} onDelete={() => handleDelete(student.id)} isHomeroomView={isHomeroomView} apiKey={apiKey} onUpdateStudent={onUpdateStudent} />
              ))}
              {visibleCount < filteredStudents.length && (
                <div ref={loaderRef} className="col-span-full h-10 flex justify-center items-center py-4">
                  <Loader className="animate-spin text-indigo-400" size={24} />
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
              <User size={48} className="mb-4 opacity-20"/>
              <p className="text-lg font-bold">등록된 학생이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      <EditStudentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} student={editingStudent} onSave={handleSaveStudent} existingClasses={existingClasses} isHomeroomView={isHomeroomView} />
      {isBatchAiModalOpen && <BatchAiGenModal isOpen={isBatchAiModalOpen} onClose={() => setIsBatchAiModalOpen(false)} students={filteredStudents} apiKey={apiKey} onUpdateStudentsMany={onUpdateStudentsMany} />}
    </div>
  );
}

function StudentCard({ student, onEdit, onDelete, isHomeroomView, apiKey, onUpdateStudent }) {
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full group">
        <div className="p-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm ${student.gender === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>{student.number}</div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1">{student.name}{isHomeroomView && student.phone && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1">📞</span>}</h3>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{student.grade}학년 {student.class}반</p>
                {!isHomeroomView && student.creditSubject && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 rounded-full border border-orange-200">{student.creditSubject}</span>}
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><MoreHorizontal size={16}/></button>
            <button onClick={onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
          </div>
        </div>

        <div className="px-4 pb-3 flex-1 space-y-2">
          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {student.tags && student.tags.length > 0 ? student.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-medium border border-gray-100 dark:border-gray-600">#{tag}</span>
            )) : <span className="text-[10px] text-gray-300 dark:text-gray-600 italic">태그 없음</span>}
            {student.tags && student.tags.length > 3 && <span className="text-[10px] text-gray-400">+{student.tags.length - 3}</span>}
          </div>
          {student.aiGeneratedText && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <p className="text-xs text-indigo-800 dark:text-indigo-300 line-clamp-2"><Sparkles size={10} className="inline mr-1"/>{student.aiGeneratedText}</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
          <span className="text-xs text-gray-400 font-medium">{isHomeroomView ? `상담 ${student.memos?.length || 0}건` : `특기사항 기록`}</span>
          {apiKey && <button onClick={() => setIsAiModalOpen(true)} className="text-xs bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 px-2 py-1 rounded-md shadow-sm hover:border-indigo-300 text-indigo-600 dark:text-indigo-300 font-bold flex items-center gap-1 transition"><Sparkles size={12}/> AI 세특</button>}
        </div>
      </div>
      {isAiModalOpen && <AiGenModal student={student} onClose={() => setIsAiModalOpen(false)} apiKey={apiKey} onSave={(text) => { onUpdateStudent(student.id, { ...student, aiGeneratedText: text }); setIsAiModalOpen(false); showToast('세특이 저장되었습니다.'); }} onUpdateStudent={(updated) => onUpdateStudent(student.id, updated)} />}
    </>
  );
}

function BatchAiGenModal({ isOpen, onClose, students, apiKey, onUpdateStudentsMany }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const targets = students.filter(s => (s.tags?.length > 0 || s.uniqueness) && !s.aiGeneratedText);

  const runBatch = async () => {
    if (!targets.length) {
      showToast('생성할 대상이 없습니다.', 'warning');
      return;
    }
    setLoading(true);
    let completed = 0;
    const updates = [];
    for (const student of targets) {
      try {
        const prompt = `학생(${student.name})의 특징(${student.tags.join(', ')}, ${student.uniqueness})을 바탕으로 학교생활기록부 세부능력 및 특기사항을 3문장으로 작성해줘.`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) updates.push({ id: student.id, fields: { aiGeneratedText: text } });
      } catch (e) { console.error(e); }
      completed++; setProgress(Math.round((completed / targets.length) * 100));
      await new Promise(r => setTimeout(r, 1000));
    }
    if (updates.length > 0) onUpdateStudentsMany(updates);
    setLoading(false); onClose(); 
    showAlert('생성 완료!', `${updates.length}명의 세특이 성공적으로 생성되었습니다.`, 'success');
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2"><Sparkles className="text-yellow-400"/> AI 일괄 생성</h3>
        {loading ? (
          <div className="text-center py-8"><Loader className="animate-spin mx-auto mb-4 text-indigo-600" size={32}/><p className="text-gray-600 dark:text-gray-300 font-bold mb-2">{progress}% 진행중...</p></div>
        ) : (
          <><div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg mb-6"><p className="text-sm text-indigo-800 dark:text-indigo-200">총 <span className="font-bold">{targets.length}명</span>의 학생에 대해 AI 세특을 생성합니다.</p></div><div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">취소</button><button onClick={runBatch} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">시작하기</button></div></>
        )}
      </div>
    </div>
  );
}