// ... (imports 동일)
// render 부분의 table만 변경사항 위주로 보여드리지만, 전체 파일로 붙여넣으세요.

import React, { useRef, useState } from 'react';
import { Users, Download, Upload, Plus, Edit2, BookOpen, FileText, Sparkles } from 'lucide-react';
import { downloadTemplate } from '../utils/helpers';
import EditStudentModal from '../components/modals/EditStudentModal';
import AiGenModal from '../components/modals/AiGenModal';
import MemoLogModal from '../components/modals/MemoLogModal';

export default function StudentManager({ students, onAddStudent, onUpdateStudent, apiKey, isHomeroomView = false }) {
  // ... (기존 state, handlers 모두 동일) ...
  const fileInputRef = useRef(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);

  const handleEdit = (student) => { setTargetStudent(student); setEditModalOpen(true); setAiModalOpen(false); setMemoModalOpen(false); };
  const handleAdd = () => { setTargetStudent(null); setEditModalOpen(true); setAiModalOpen(false); setMemoModalOpen(false); };
  const handleSaveStudent = (data) => { if (data.id) { const { id, ...fields } = data; onUpdateStudent(id, fields); } else { onAddStudent(data); } setEditModalOpen(false); };
  const handleAiOpen = (student) => { setTargetStudent(student); setAiModalOpen(true); setEditModalOpen(false); };
  const handleAiSave = (text) => { if (targetStudent?.id) onUpdateStudent(targetStudent.id, { aiGeneratedText: text }); setAiModalOpen(false); };
  const handleMemoOpen = (student) => { setTargetStudent(student); setMemoModalOpen(true); };
  const handleMemoSave = (studentId, updatedFields) => { onUpdateStudent(studentId, updatedFields); setTargetStudent(prev => ({...prev, ...updatedFields})); };
  
  const handleFileUpload = (e) => { /* 기존 코드 유지 */
      const file = e.target.files[0];
      if (!file) return;
      if (!window.confirm("기존 명부에 추가됩니다. 업로드 하시겠습니까?")) { e.target.value = ""; return; }
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const text = event.target.result;
          const rows = text.split("\n");
          let successCount = 0;
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            if (!row) continue;
            const columns = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cleanCols = columns.map(col => col.replace(/^"|"$/g, '').trim());
            if (cleanCols.length >= 4) { 
               let importedMemos = [];
               if (isHomeroomView && cleanCols[10]) importedMemos.push({ id: Date.now(), date: new Date().toISOString().split('T')[0], content: "[Excel] " + cleanCols[10] });
               const newStudent = {
                 grade: cleanCols[0]||"", class: cleanCols[1]||"", number: cleanCols[2]||"", name: cleanCols[3]||"",
                 phone: isHomeroomView ? (cleanCols[4]||""):"", parentPhone: isHomeroomView ? (cleanCols[5]||""):"", address: isHomeroomView ? (cleanCols[6]||""):"",
                 tags: (isHomeroomView ? cleanCols[7] : cleanCols[4]) ? (isHomeroomView ? cleanCols[7] : cleanCols[4]).split(",") : [],
                 autoActivity: isHomeroomView ? (cleanCols[8]||""):(cleanCols[5]||""), uniqueness: isHomeroomView ? (cleanCols[9]||""):(cleanCols[6]||""),
                 aiGeneratedText: isHomeroomView ? "" : (cleanCols[7]||""), memos: importedMemos
               };
               await onAddStudent(newStudent);
               successCount++;
            }
          }
          alert(`${successCount}명 등록 완료!`);
        } catch (error) { console.error(error); alert("업로드 실패. CSV 형식을 확인하세요."); } finally { if(fileInputRef.current) fileInputRef.current.value = ""; }
      };
      reader.readAsText(file, 'UTF-8');
  };

  const pageTitle = isHomeroomView ? "학생 관리 (담임)" : "학생 관리 (수업)";
  const PageIcon = isHomeroomView ? Users : BookOpen;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><PageIcon className={isHomeroomView ? "text-indigo-500" : "text-green-500"}/> {pageTitle}</h3>
        <div className="flex gap-2">
          <button onClick={() => downloadTemplate(students, isHomeroomView)} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-100 transition"><Download size={16}/> 양식 다운로드</button>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition"><Upload size={16}/> 엑셀 업로드</button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload}/>
          <button onClick={handleAdd} className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"><Plus size={16}/> 학생 추가</button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-4 w-12 whitespace-nowrap">수정</th>
              {/* 🔥 번호 세로 작성 방지: w-12, whitespace-nowrap */}
              <th className="px-4 py-4 w-12 whitespace-nowrap">번호</th>
              <th className="px-4 py-4 w-20 whitespace-nowrap">성명</th>
              {isHomeroomView ? (
                <>
                  {/* 🔥 연락처 통합 및 점선 구분 */}
                  <th className="px-4 py-4 w-32 whitespace-nowrap">학생/학부모 연락처</th>
                  <th className="px-4 py-4 w-32 whitespace-nowrap">주소</th>
                  <th className="px-4 py-4 whitespace-nowrap">자율활동</th>
                  <th className="px-4 py-4 whitespace-nowrap">특기사항</th>
                  <th className="px-4 py-4 w-16 text-center whitespace-nowrap">메모</th>
                  <th className="px-4 py-4 w-16 text-center whitespace-nowrap">AI</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-4 whitespace-nowrap">특성 태그</th>
                  <th className="px-4 py-4 whitespace-nowrap">세특 기록</th>
                  <th className="px-4 py-4 w-16 text-center whitespace-nowrap">메모</th>
                  <th className="px-4 py-4 w-20 text-right whitespace-nowrap">AI</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? students.sort((a,b)=> Number(a.number)-Number(b.number)).map((student) => (
              <tr key={student.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-indigo-50/30">
                <td className="px-4 py-4"><button onClick={() => handleEdit(student)} className="text-gray-400 hover:text-indigo-600 p-1"><Edit2 size={16}/></button></td>
                <td className="px-4 py-4 font-medium">{student.number}</td>
                <td className="px-4 py-4 font-bold dark:text-white">{student.name}</td>
                {isHomeroomView ? (
                  <>
                    <td className="px-4 py-4 text-xs">
                      {/* 🔥 연락처 점선 구분 */}
                      <div className="border-b border-dotted border-gray-300 dark:border-gray-600 pb-1 mb-1 text-gray-700 dark:text-gray-300 font-medium">{student.phone || "-"}</div>
                      <div className="text-gray-500 dark:text-gray-400">{student.parentPhone || "-"}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-500 truncate max-w-[150px]">{student.address}</td>
                    <td className="px-4 py-4 text-xs text-gray-500 truncate max-w-[150px]">{student.autoActivity}</td>
                    <td className="px-4 py-4 text-xs text-gray-500 truncate max-w-[150px]">{student.uniqueness}</td>
                    <td className="px-4 py-4 text-center"><button onClick={() => handleMemoOpen(student)} className={`px-2 py-1.5 rounded text-xs font-bold transition inline-flex items-center gap-1 ${student.memos && student.memos.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}><FileText size={14}/> {student.memos ? student.memos.length : 0}</button></td>
                    <td className="px-4 py-4 text-center"><button onClick={() => handleAiOpen(student)} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700" title="AI 생성"><Sparkles size={16}/></button></td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{student.tags && student.tags.map(tag => (<span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-sm text-xs text-gray-600 dark:text-gray-300">#{tag}</span>))}</div></td>
                    <td className="px-4 py-4 text-xs text-gray-500 truncate max-w-[200px]">{student.aiGeneratedText || "미작성"}</td>
                    <td className="px-4 py-4 text-center"><button onClick={() => handleMemoOpen(student)} className={`px-2 py-1.5 rounded text-xs font-bold transition inline-flex items-center gap-1 ${student.memos && student.memos.length > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}><FileText size={14}/> {student.memos ? student.memos.length : 0}</button></td>
                    <td className="px-4 py-4 text-right"><button onClick={() => handleAiOpen(student)} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs hover:bg-indigo-700 whitespace-nowrap">AI 생성</button></td>
                  </>
                )}
              </tr>
            )) : <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-400">학생이 없습니다.</td></tr>}
          </tbody>
        </table>
      </div>
      <EditStudentModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} student={targetStudent} onSave={handleSaveStudent} existingClasses={["1", "2", "3"]} isHomeroomView={isHomeroomView} />
      {aiModalOpen && targetStudent && <AiGenModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} student={targetStudent} apiKey={apiKey} onSave={handleAiSave} onUpdateStudent={(updated) => setTargetStudent(updated)} />}
      {memoModalOpen && targetStudent && <MemoLogModal isOpen={memoModalOpen} onClose={() => setMemoModalOpen(false)} student={targetStudent} onSave={handleMemoSave} />}
    </div>
  );
}