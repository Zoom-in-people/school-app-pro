import React, { useState, useRef } from 'react';
import { Search, Plus, Filter, MoreHorizontal, User, FileSpreadsheet, Download, X, Save, Trash2, Sparkles, Loader, AlertTriangle, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StudentManager({ students, onAddStudent, onAddStudents, onUpdateStudent, onDeleteStudent, apiKey, isHomeroomView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchAiModalOpen, setIsBatchAiModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const fileInputRef = useRef(null);

  const filteredStudents = students.filter(student => 
    student.name.includes(searchTerm) || 
    (student.studentId && student.studentId.includes(searchTerm)) ||
    (student.phone && student.phone.includes(searchTerm))
  ).sort((a, b) => {
    const numA = parseInt(a.number) || 0;
    const numB = parseInt(b.number) || 0;
    if (numA !== numB) return numA - numB;
    return a.name.localeCompare(b.name);
  });

  // 엑셀 업로드 (기존 유지)
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
            ai_remark: row[7] || '', 
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

  // 일반 엑셀 다운로드
  const downloadExcel = () => {
    const dataToExport = filteredStudents.map(s => ({
      '학년': s.grade,
      '반': s.class,
      '번호': s.number,
      '이름': s.name,
      '전화번호': s.phone,
      '성별': s.gender === 'male' ? '남' : s.gender === 'female' ? '여' : '기타',
      '특이사항': s.note,
      'AI 생성 특기사항': s.ai_remark || '' 
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "학생명단");
    XLSX.writeFile(wb, `${isHomeroomView ? '우리반' : '교과'}_학생명단.xlsx`);
  };

  // 🔥 [신규] 구글 시트용(Gemini 함수) 다운로드
  const downloadForGoogleSheet = () => {
    const dataToExport = filteredStudents.map(s => {
      // Gemini 함수에 들어갈 프롬프트를 미리 만들어서 엑셀에 넣어줍니다.
      const prompt = `역할: 초등학교 교사. 다음 학생의 특기사항을 바탕으로 생활기록부 행동특성 및 종합의견을 3문장으로 작성해줘. [학생이름: ${s.name}, 특기사항: ${s.note || '없음'}]`;
      
      return {
        '학년': s.grade,
        '반': s.class,
        '번호': s.number,
        '이름': s.name,
        '특이사항': s.note,
        'Gemini_프롬프트(함수참조용)': prompt, // 이 열을 참조하면 됨
        '사용법': '구글 시트에서 확장프로그램 설치 후 =GEMINI(F2) 입력'
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "구글시트_AI작성용");
    XLSX.writeFile(wb, `구글시트용_${isHomeroomView ? '우리반' : '교과'}_명단.xlsx`);
    
    alert("파일이 다운로드 되었습니다.\n\n[사용법]\n1. 구글 스프레드시트에 업로드하세요.\n2. 'Gemini for Google Sheets' 확장프로그램을 설치하세요.\n3. 빈 셀에 =GEMINI(F2) 라고 입력하면 자동 생성됩니다. (F열이 프롬프트)");
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <User className="text-indigo-600 dark:text-indigo-400"/>
            {isHomeroomView ? "우리반 학생 명렬표" : "교과 학생 명렬표"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">총 {students.length}명의 학생이 등록되어 있습니다.</p>
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

      {/* 툴바 */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <FileSpreadsheet size={16} className="text-green-600"/> 엑셀 업로드
        </button>
        <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
        
        <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <Download size={16} className="text-blue-600"/> 전체 다운로드
        </button>

        {/* 🔥 [신규] 구글 시트용 다운로드 버튼 */}
        <button onClick={downloadForGoogleSheet} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <FileText size={16} className="text-orange-600"/> 구글 시트용(Gemini) 다운로드
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
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">특기사항(기초)</th>
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
                      {student.note || "-"}
                    </td>
                    <td className="p-4 text-sm hidden lg:table-cell max-w-xs truncate text-indigo-600 dark:text-indigo-400">
                      {student.ai_remark ? "✅ 작성됨" : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => { setEditingStudent(student); setIsModalOpen(true); }}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
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

// 학생 추가/수정 모달
function StudentModal({ isOpen, onClose, onSave, onDelete, initialData }) {
  const [formData, setFormData] = useState({ 
    grade: '1', class: '1', number: '1', name: '', phone: '', gender: 'male', note: '' 
  });

  React.useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({ grade: '1', class: '1', number: '1', name: '', phone: '', gender: 'male', note: '' });
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">{initialData ? '학생 정보 수정' : '새 학생 추가'}</h2>
          <button onClick={onClose}><X className="text-gray-500 hover:text-gray-700 dark:text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">학년</label>
              <select 
                value={formData.grade} 
                onChange={e => setFormData({...formData, grade: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}학년</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">반</label>
              <select 
                value={formData.class} 
                onChange={e => setFormData({...formData, class: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                 {Array.from({length: 20}, (_, i) => i + 1).map(c => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">번호</label>
              <select 
                value={formData.number} 
                onChange={e => setFormData({...formData, number: e.target.value})}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {Array.from({length: 60}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}번</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1 dark:text-gray-300">이름</label>
            <input 
              type="text" 
              required
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">전화번호</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="010-0000-0000"
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1 dark:text-gray-300">성별</label>
              <select 
                value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value})}
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="male">남자</option>
                <option value="female">여자</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold mb-1 dark:text-gray-300">특이사항</label>
             <textarea 
               value={formData.note} 
               onChange={e => setFormData({...formData, note: e.target.value})}
               rows="3"
               className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
             ></textarea>
          </div>

          <div className="pt-2 flex gap-2">
            <button onClick={() => onSave(formData)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              <Save size={18}/> 저장
            </button>
            
            {initialData && (
              <button 
                onClick={onDelete} 
                className="px-4 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
              >
                <Trash2 size={18}/>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 일괄 작성 모달
function BatchAiRemarkModal({ isOpen, onClose, students, apiKey, onUpdateStudents }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const targets = students.filter(s => s.note && s.note.trim() !== '');

  const handleBatchGenerate = async () => {
    if (!apiKey) {
      alert("설정 메뉴에서 API 키를 먼저 등록해주세요.");
      return;
    }
    if (targets.length === 0) {
      alert("특기사항이 입력된 학생이 없습니다. 기초 자료를 먼저 입력해주세요.");
      return;
    }

    setLoading(true);
    setProgress(`대상 학생 ${targets.length}명의 데이터를 처리 중입니다...`);

    try {
      const promptData = targets.map(s => ({
        id: s.id,
        name: s.name,
        note: s.note
      }));

      const systemPrompt = `
        너는 초등학교 생활기록부 전문가야. 
        아래 제공되는 학생들의 [이름, 특기사항] 데이터를 바탕으로, 각 학생별 '행동특성 및 종합의견'을 작성해줘.
        
        [작성 규칙]
        1. 문체: 교육적이고 긍정적이며, '~~함' 대신 '~~합니다.' 식의 완성된 문장.
        2. 분량: 학생당 3~4문장.
        3. **중요: 반드시 아래와 같은 JSON 형식의 리스트로만 응답해줘. 다른 말은 절대 하지 마.**
        
        [응답 형식]
        [
          { "id": "학생ID1", "remark": "이 학생은..." },
          { "id": "학생ID2", "remark": "밝은 성격으로..." }
        ]
      `;

      const userPrompt = JSON.stringify(promptData);

      // Gemini 2.5 Flash 사용 (Batch 처리용)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ 
            role: "user",
            parts: [{ text: systemPrompt + "\n\n" + userPrompt }] 
          }]
        })
      });

      if (!response.ok) throw new Error("API 호출 실패 (무료 사용량 초과 가능성)");

      const data = await response.json();
      let rawText = data.candidates[0].content.parts[0].text;
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const results = JSON.parse(rawText);

      setProgress("데이터 저장 중...");
      
      let updatedCount = 0;
      for (const res of results) {
        const student = students.find(s => s.id === res.id);
        if (student) {
          await onUpdateStudents(student.id, { ...student, ai_remark: res.remark });
          updatedCount++;
        }
      }

      alert(`${updatedCount}명의 특기사항이 일괄 생성되었습니다!`);
      onClose();

    } catch (error) {
      console.error("Batch Error:", error);
      alert(`오류가 발생했습니다: ${error.message}\n(무료 사용량 한도 초과이거나, 데이터가 너무 많을 수 있습니다.)`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-yellow-300"/> AI 특기사항 일괄 작성
          </h2>
          <button onClick={onClose}><X className="text-white/80 hover:text-white" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 🔥 [신규] 제한사항 경고 표시 */}
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20}/>
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400 text-sm mb-1">사용량 제한 안내 (필독)</h3>
              <p className="text-xs text-red-600 dark:text-red-300 leading-relaxed">
                현재 무료 API 키 사용 시 <strong>하루 20회</strong>까지만 AI 작성이 가능합니다.<br/>
                생기부 시즌 등 대량 작업이 필요할 경우, <strong>'구글 시트용 다운로드'</strong> 기능을 이용해주세요.
              </p>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {targets.length}명
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              특기사항이 입력된 학생 수
            </p>
            <p className="text-xs text-gray-400 mt-1">
              (총 {students.length}명 중 {students.length - targets.length}명은 특기사항 없음)
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-800 dark:text-blue-300">
            <p className="font-bold mb-1">🚀 효율적인 API 사용</p>
            이 기능을 사용하면 <strong>단 1회의 API 호출</strong>로 위 {targets.length}명의 특기사항을 모두 생성합니다. 
            (20회 제한 안에서 반 전체를 충분히 처리할 수 있습니다.)
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <Loader className="animate-spin text-indigo-600 w-8 h-8"/>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300 animate-pulse">{progress}</p>
            </div>
          ) : (
            <button 
              onClick={handleBatchGenerate} 
              disabled={targets.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
            >
              <Sparkles size={20}/> 일괄 생성 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}