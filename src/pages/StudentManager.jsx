import React, { useState, useRef } from 'react';
import { Search, Plus, Filter, MoreHorizontal, User, FileSpreadsheet, Download, X, Save, Trash2, Sparkles, Loader, AlertTriangle, FileText, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';

// 🔥 [수정] students 기본값을 []로 설정하여 에러 방지
export default function StudentManager({ students = [], onAddStudent, onAddStudents, onUpdateStudent, onDeleteStudent, apiKey, isHomeroomView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchAiModalOpen, setIsBatchAiModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const fileInputRef = useRef(null);

  // 🔥 [수정] 안전 장치: students가 null이거나 배열이 아닐 경우 빈 배열로 처리
  const safeStudents = Array.isArray(students) ? students : [];

  const filteredStudents = safeStudents.filter(student => 
    student.name.includes(searchTerm) || 
    (student.studentId && student.studentId.includes(searchTerm)) ||
    (student.phone && student.phone.includes(searchTerm))
  ).sort((a, b) => {
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    if (numA !== numB) return numA - numB;
    return a.name.localeCompare(b.name);
  });

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        const newStudents = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (row.length === 0) continue;
          const name = row[3] || row[0]; 
          if (!name) continue;

          newStudents.push({
            grade: row[0] || '',
            class: row[1] || '',
            number: row[2] || '',
            name: name,
            phone: row[4] || '',
            gender: row[5] === '남' ? 'male' : row[5] === '여' ? 'female' : 'other',
            note: row[6] || '',
            record_note: row[7] || '', 
            ai_remark: row[8] || '',
            studentId: `${row[0]}${row[1]}${row[2]}`
          });
        }

        if (newStudents.length > 0) {
          if (onAddStudents) {
            onAddStudents(newStudents);
            alert(`${newStudents.length}명의 학생이 처리되었습니다.`);
          } else {
            newStudents.forEach(s => onAddStudent(s));
          }
        }
      } catch (error) {
        console.error("Excel Upload Error:", error);
        alert("엑셀 파일 읽기 실패");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const downloadExcel = () => {
    const dataToExport = filteredStudents.map(s => ({
      '학년': s.grade,
      '반': s.class,
      '번호': s.number,
      '이름': s.name,
      '전화번호': s.phone,
      '성별': s.gender === 'male' ? '남' : s.gender === 'female' ? '여' : '기타',
      '특이사항(메모)': s.note,
      '생기부용 기초자료': s.record_note || '', 
      'AI 생성 특기사항': s.ai_remark || '' 
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "학생명단");
    XLSX.writeFile(wb, `${isHomeroomView ? '우리반' : '교과'}_학생명단.xlsx`);
  };

  // 구글 드라이브에 시트 자동 생성
  const createGoogleSheetInDrive = async () => {
    const token = localStorage.getItem('google_access_token');
    const folderId = localStorage.getItem('cached_folder_id'); 

    if (!token || !folderId) {
      alert("구글 드라이브 연결 상태를 확인할 수 없습니다. (새로고침 후 다시 시도해주세요)");
      return;
    }

    setIsCreatingSheet(true);

    try {
      let csvContent = "학년,반,번호,이름,생기부용 기초자료,Gemini_프롬프트(함수참조용),사용법\n";
      
      filteredStudents.forEach(s => {
        const sourceText = s.record_note && s.record_note.trim() !== '' ? s.record_note.replace(/"/g, '""') : '(기초자료 없음)';
        const prompt = `역할: 초등학교 교사. 다음 학생의 기초 자료를 바탕으로 생활기록부 행동특성 및 종합의견을 교육적인 문체로 3문장 작성해줘. [학생이름: ${s.name}, 기초자료: ${sourceText}]`;
        
        const row = [
          s.grade,
          s.class,
          s.number,
          s.name,
          `"${sourceText}"`,
          `"${prompt.replace(/"/g, '""')}"`,
          '=GEMINI(F2)'
        ];
        csvContent += row.join(",") + "\n";
      });

      const fileName = `[AI작성용] ${isHomeroomView ? '우리반' : '교과'}_명단 (${new Date().toLocaleDateString()})`;
      const metadata = {
        name: fileName,
        parents: [folderId],
        mimeType: 'application/vnd.google-apps.spreadsheet'
      };

      const file = new Blob([csvContent], { type: 'text/csv' });
      const form = new FormData();
      
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      if (res.ok) {
        alert(`✅ 구글 드라이브에 스프레드시트가 생성되었습니다!\n\n파일명: ${fileName}\n폴더: 교무수첩 데이터`);
      } else {
        throw new Error("업로드 실패");
      }

    } catch (error) {
      console.error("Sheet Creation Error:", error);
      alert("스프레드시트 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <User className="text-indigo-600 dark:text-indigo-400"/>
            {isHomeroomView ? "우리반 학생 명렬표" : "교과 학생 명렬표"}
          </h2>
          {/* 🔥 [수정] safeStudents 사용 */}
          <p className="text-gray-500 dark:text-gray-400 text-sm">총 {safeStudents.length}명의 학생이 등록되어 있습니다.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="이름, 번호 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none w-48 sm:w-64 transition"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <button 
            onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            <Plus size={18} /> <span className="hidden sm:inline">학생 추가</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <FileSpreadsheet size={16} className="text-green-600"/> 엑셀 업로드
        </button>
        <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
        
        <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <Download size={16} className="text-blue-600"/> 전체 다운로드
        </button>

        <button 
          onClick={createGoogleSheetInDrive} 
          disabled={isCreatingSheet}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition shadow-sm disabled:bg-orange-300"
        >
          {isCreatingSheet ? <Loader className="animate-spin" size={16}/> : <FileText size={16}/>}
          Drive에 시트 생성 (Gemini용)
        </button>

        <div className="flex-1"></div>

        <button 
          onClick={() => setIsBatchAiModalOpen(true)}
          className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg transition shadow-md"
        >
          <Sparkles size={16} /> AI 특기사항 일괄 작성
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">번호</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">이름</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">학번/정보</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">생기부 기초자료</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">AI 결과</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400 dark:text-gray-500">
                    등록된 학생이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                    <td className="p-4 font-bold text-gray-700 dark:text-gray-300 w-16">{student.number}</td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">{student.name}</td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                      {student.grade}학년 {student.class}반
                    </td>
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell max-w-xs truncate">
                      {student.record_note ? (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">{student.record_note}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">{student.note || "-"}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm hidden lg:table-cell max-w-xs truncate text-indigo-600 dark:text-indigo-400">
                      {student.ai_remark ? "✅ 작성됨" : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { setEditingStudent(student); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                        title="관리"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <StudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={(data) => {
          if (editingStudent) onUpdateStudent(editingStudent.id, data);
          else onAddStudent(data);
          setIsModalOpen(false);
        }}
        onDelete={() => { 
          if (editingStudent) {
            if(window.confirm(`${editingStudent.name} 학생을 삭제하시겠습니까?`)) {
               onDeleteStudent(editingStudent.id);
               setIsModalOpen(false);
            }
          }
        }}
        initialData={editingStudent}
      />

      {/* 🔥 [수정] safeStudents를 전달하여 모달에서도 에러 방지 */}
      <BatchAiRemarkModal 
        isOpen={isBatchAiModalOpen}
        onClose={() => setIsBatchAiModalOpen(false)}
        students={filteredStudents} 
        apiKey={apiKey}
        onUpdateStudents={onUpdateStudent}
      />
    </div>
  );
}

// ... (StudentModal, BatchAiRemarkModal 컴포넌트는 기존과 동일하므로 생략하지 않고 아래에 붙여야 함)
// 실제 파일 저장 시에는 아래 StudentModal과 BatchAiRemarkModal 코드를 그대로 유지해주세요.

function StudentModal({ isOpen, onClose, onSave, onDelete, initialData }) {
  const [formData, setFormData] = useState({ 
    grade: '1', class: '1', number: '1', name: '', phone: '', gender: 'male', 
    note: '', record_note: ''
  });

  React.useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ grade: '1', class: '1', number: '1', name: '', phone: '', gender: 'male', note: '', record_note: '' });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">{initialData ? '학생 정보 관리' : '새 학생 추가'}</h2>
          <button onClick={onClose}><X className="text-gray-500 hover:text-gray-700 dark:text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">학년</label>
              <select value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">반</label>
              <select value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{Array.from({length: 20}, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}반</option>)}</select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">번호</label>
              <select value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">{Array.from({length: 60}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}번</option>)}</select>
            </div>
          </div>
          <div><label className="block text-sm font-bold mb-1 dark:text-gray-300">이름</label><input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-bold mb-1 dark:text-gray-300">전화번호</label><input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"/></div>
            <div><label className="block text-sm font-bold mb-1 dark:text-gray-300">성별</label><select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"><option value="male">남자</option><option value="female">여자</option></select></div>
          </div>
          <hr className="border-gray-100 dark:border-gray-700 my-2" />
          <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
             <div className="flex items-center gap-2 mb-1">
                <BookOpen size={16} className="text-blue-600 dark:text-blue-400"/>
                <label className="block text-sm font-bold text-blue-800 dark:text-blue-300">생기부용 기초 자료 (AI 작성용)</label>
             </div>
             <textarea value={formData.record_note || ''} onChange={e => setFormData({...formData, record_note: e.target.value})} rows="4" placeholder="예: 수업 시간에 발표를 잘하고..." className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
          </div>
          <div>
             <label className="block text-sm font-bold mb-1 text-gray-500 dark:text-gray-400">기타 특이사항 (단순 메모)</label>
             <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} rows="2" placeholder="예: 우유 알레르기 있음" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"></textarea>
          </div>
          <div className="pt-2 flex gap-2">
            <button onClick={() => onSave(formData)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"><Save size={18}/> 저장</button>
            {initialData && (<button onClick={onDelete} className="px-4 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"><Trash2 size={18}/></button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchAiRemarkModal({ isOpen, onClose, students, apiKey, onUpdateStudents }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const targets = students.filter(s => s.record_note && s.record_note.trim() !== '');

  const handleBatchGenerate = async () => {
    if (!apiKey) { alert("설정 메뉴에서 API 키를 먼저 등록해주세요."); return; }
    if (targets.length === 0) { alert("생기부용 기초 자료가 입력된 학생이 없습니다."); return; }
    setLoading(true);
    setProgress(`대상 학생 ${targets.length}명의 데이터를 처리 중입니다...`);
    try {
      const promptData = targets.map(s => ({ id: s.id, name: s.name, note: s.record_note }));
      const systemPrompt = `너는 초등학교 생활기록부 전문가야. 아래 학생들의 [이름, 기초자료]를 바탕으로, 각 학생별 '행동특성 및 종합의견'을 작성해줘. [작성 규칙] 1. 교육적이고 긍정적인 문체(~합니다). 2. 학생당 3~4문장. 3. **중요: 반드시 아래와 같은 JSON 형식의 리스트로만 응답해줘.**`;
      const userPrompt = JSON.stringify(promptData);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }] }) });
      if (!response.ok) throw new Error("API 호출 실패");
      const data = await response.json();
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const results = JSON.parse(rawText);
      setProgress("데이터 저장 중...");
      let updatedCount = 0;
      for (const res of results) {
        const student = students.find(s => s.id === res.id);
        if (student) { await onUpdateStudents(student.id, { ...student, ai_remark: res.remark }); updatedCount++; }
      }
      alert(`${updatedCount}명의 특기사항이 일괄 생성되었습니다!`); onClose();
    } catch (error) { console.error("Batch Error:", error); alert(`오류가 발생했습니다: ${error.message}`); } finally { setLoading(false); setProgress(''); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="text-yellow-300"/> AI 특기사항 일괄 작성</h2>
          <button onClick={onClose}><X className="text-white/80 hover:text-white" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20}/>
            <div><h3 className="font-bold text-red-700 dark:text-red-400 text-sm mb-1">사용량 제한 안내</h3><p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">무료 API는 하루 20회 제한이 있습니다. 대량 작업 시 'Drive에 시트 생성' 기능을 권장합니다.</p></div>
          </div>
          <div className="text-center"><div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{targets.length}명</div><p className="text-gray-600 dark:text-gray-300">'생기부용 기초자료'가 입력된 학생 수</p></div>
          {loading ? (<div className="flex flex-col items-center justify-center py-4 space-y-3"><Loader className="animate-spin text-indigo-600 w-8 h-8"/><p className="text-sm font-bold text-gray-600 dark:text-gray-300 animate-pulse">{progress}</p></div>) : (<button onClick={handleBatchGenerate} disabled={targets.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"><Sparkles size={20}/> 일괄 생성 시작하기</button>)}
        </div>
      </div>
    </div>
  );
}