import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, GraduationCap, Search } from 'lucide-react';
import { NEIS_API_KEY, OFFICE_CODES } from '../../constants/data';

export default function HandbookSettingsModal({ isOpen, onClose, handbook, onUpdate, onDelete }) {
  const [formData, setFormData] = useState({ 
    title: '', 
    isHomeroom: true,
    schoolInfo: { name: '', code: '', officeCode: '', grade: '1', class: '1' } 
  });

  // 🔥 학교 검색을 위한 상태 추가
  const [schoolSearchName, setSchoolSearchName] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (handbook) {
      setFormData({
        title: handbook.title || '',
        isHomeroom: handbook.isHomeroom ?? true,
        schoolInfo: {
            name: handbook.schoolInfo?.name || '',
            code: handbook.schoolInfo?.code || '',
            officeCode: handbook.schoolInfo?.officeCode || '',
            grade: String(handbook.schoolInfo?.grade || '1'),
            class: String(handbook.schoolInfo?.class || '1')
        }
      });
      setSchoolSearchName(handbook.schoolInfo?.name || '');
      setSearchResults([]); // 모달이 열릴 때 검색 결과 초기화
    }
  }, [handbook, isOpen]);

  // 🔥 학교 검색 함수
  const searchSchool = async () => {
    if (schoolSearchName.length < 2) return alert("학교명을 2글자 이상 입력하세요.");
    setIsSearching(true);
    try {
      let allResults = [];
      const officeCodeList = Object.values(OFFICE_CODES);
      
      const promises = officeCodeList.map(async (officeCode) => {
        try {
          const url = `https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SCHUL_NM=${encodeURIComponent(schoolSearchName)}`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.schoolInfo) {
            return data.schoolInfo[1].row.map(s => ({
              name: s.SCHUL_NM,
              code: s.SD_SCHUL_CODE,
              officeCode: s.ATPT_OFCDC_SC_CODE,
              address: s.ORG_RDNMA
            }));
          }
        } catch (e) { return []; }
        return [];
      });

      const results = await Promise.all(promises);
      allResults = results.flat();
      
      setSearchResults(allResults);
      if (allResults.length === 0) alert("검색 결과가 없습니다.");

    } catch (e) {
      console.error(e);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  // 🔥 검색된 학교 선택
  const handleSelectSchool = (school) => {
    setFormData(prev => ({
      ...prev,
      schoolInfo: {
        ...prev.schoolInfo,
        name: school.name,
        code: school.code,
        officeCode: school.officeCode
      }
    }));
    setSchoolSearchName(school.name);
    setSearchResults([]); // 선택 후 결과창 닫기
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(handbook.id, formData);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(
      "정말로 이 교무수첩을 삭제하시겠습니까?\n\n" +
      "⚠️ 주의: 입력한 모든 학생 정보와 상담 기록이 영구적으로 삭제됩니다.\n" +
      "(구글 드라이브의 파일은 휴지통으로 이동됩니다)"
    )) {
      onDelete(handbook.id);
    }
  };

  if (!isOpen || !handbook) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* 헤더 */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center shrink-0">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             교무수첩 설정
           </h2>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition">
             <X className="text-white" />
           </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. 교무수첩 이름 */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">교무수첩 이름</label>
              <input 
                type="text" 
                required
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="예: 2026학년도 1학기"
                className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            {/* 2. 담임 여부 (토글) */}
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex items-center justify-between border border-gray-100 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                  <GraduationCap size={20}/>
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">담임 선생님이신가요?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">우리반 관리 기능을 활성화합니다.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isHomeroom} 
                  onChange={(e) => setFormData({...formData, isHomeroom: e.target.checked})} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 3. 학교 정보 및 검색 */}
            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학교 설정 (급식 연동용)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={schoolSearchName} 
                    onChange={(e) => setSchoolSearchName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchSchool();
                      }
                    }}
                    placeholder="학교명 검색 (예: 서울초)"
                    className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                  <button 
                    type="button" 
                    onClick={searchSchool} 
                    disabled={isSearching}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    <Search size={20}/>
                  </button>
                </div>
                
                {/* 검색 결과 드롭다운 */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 absolute z-50 w-[calc(100%-3.5rem)] shadow-xl custom-scrollbar">
                    {searchResults.map((s, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectSchool(s)} 
                        className="p-3 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-600 last:border-none transition"
                      >
                        <p className="font-bold dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.address}</p>
                      </div>
                    ))}
                  </div>
                )}
                {formData.schoolInfo.code && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-bold">
                    ✅ 선택됨: {formData.schoolInfo.name}
                  </p>
                )}
              </div>

              {/* 담임일 경우 학년/반 입력 */}
              {formData.isHomeroom && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학년</label>
                    <select
                      value={String(formData.schoolInfo.grade)} 
                      onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, grade: e.target.value}})} 
                      className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none bg-white dark:bg-gray-800"
                    >
                      {[1, 2, 3, 4, 5, 6].map(g => (
                        <option key={g} value={String(g)}>{g}학년</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">반</label>
                    <select
                      value={String(formData.schoolInfo.class)} 
                      onChange={(e) => setFormData({...formData, schoolInfo: {...formData.schoolInfo, class: e.target.value}})} 
                      className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition appearance-none bg-white dark:bg-gray-800"
                    >
                      {Array.from({length: 20}, (_, i) => i + 1).map(c => (
                        <option key={c} value={String(c)}>{c}반</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2">
              <Save size={20}/> 변경사항 저장
            </button>
          </form>

          {/* 삭제 영역 */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-6 shrink-0">
            <button 
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center justify-center gap-2 p-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition font-bold border border-transparent hover:border-red-100 dark:hover:border-red-800"
            >
              <Trash2 size={18}/> 이 교무수첩 삭제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}