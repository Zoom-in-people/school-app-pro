import React, { useState, useRef } from 'react';
import { Search, Plus, Upload, Filter, MoreHorizontal, User, FileSpreadsheet, Download, X, Save, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function StudentManager({ students, onAddStudent, onAddStudents, onUpdateStudent, onDeleteStudent, apiKey, isHomeroomView }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const fileInputRef = useRef(null);

  // 검색 및 정렬
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

  // 엑셀 업로드 처리
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
        // 헤더 제외하고 데이터 파싱 (1번줄부터)
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
            studentId: `${row[0]}${row[1]}${row[2]}`
          });
        }

        if (newStudents.length > 0) {
          // 🔥 [수정] 일괄 저장 함수 호출 (엑셀 버그 해결)
          if (onAddStudents) {
            onAddStudents(newStudents);
            alert(`${newStudents.length}명의 학생이 처리되었습니다. (중복 제외)`);
          } else {
            // 호환성 유지
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

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['학년', '반', '번호', '이름', '전화번호', '성별(남/여)', '특이사항'],
      ['1', '1', '1', '홍길동', '010-1234-5678', '남', '예시 데이터입니다']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "학생명단");
    XLSX.writeFile(wb, "학생등록_양식.xlsx");
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

      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 items-center">
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <FileSpreadsheet size={16} className="text-green-600"/> 엑셀 업로드
        </button>
        <input type="file" ref={fileInputRef} onChange={handleExcelUpload} accept=".xlsx, .xls" className="hidden" />
        
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition border border-gray-200 dark:border-gray-600">
          <Download size={16} className="text-blue-600"/> 양식 다운로드
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
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">전화번호</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">성별</th>
                <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-400 dark:text-gray-500">
                    등록된 학생이 없습니다. 학생을 추가해주세요.
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
                    <td className="p-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell font-mono">{student.phone}</td>
                    <td className="p-4 text-sm hidden lg:table-cell">
                      {student.gender === 'male' && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold dark:bg-blue-900/30 dark:text-blue-300">남</span>}
                      {student.gender === 'female' && <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs font-bold dark:bg-pink-900/30 dark:text-pink-300">여</span>}
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
    </div>
  );
}

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