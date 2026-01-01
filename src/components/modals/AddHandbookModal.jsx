import React, { useState } from 'react';
import { X, BookPlus, Check, Search, School } from 'lucide-react';
import { NEIS_API_KEY, OFFICE_CODES } from '../../constants/data';

export default function AddHandbookModal({ isOpen, onClose, onSave }) {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState(`${currentYear}-03-02`);
  const [endDate, setEndDate] = useState(`${currentYear + 1}-02-28`);
  const [isHomeroom, setIsHomeroom] = useState(false);
  const [grade, setGrade] = useState("1");
  const [classroom, setClassroom] = useState("1");

  // 🔥 학교 검색 상태
  const [schoolName, setSchoolName] = useState("");
  const [schoolInfo, setSchoolInfo] = useState(null); // { name, code, officeCode }
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // 학교 검색 함수
  const searchSchool = async () => {
    if (schoolName.length < 2) return alert("학교명을 2글자 이상 입력하세요.");
    setIsSearching(true);
    try {
      // 전국 교육청을 순회하며 검색 (간단 구현을 위해 서울/경기 등 주요 지역만 하거나 전체 루프)
      // 여기서는 사용자가 교육청을 선택하지 않으므로, 모든 교육청 코드로 검색해봐야 하지만, 
      // 편의상 많이 쓰는 로직(전체 검색) 대신, NEIS API 특성상 시도교육청 코드가 필요하므로
      // 일단 모든 교육청 코드를 다 돌려서 결과를 합치는 방식으로 구현합니다.
      
      let allResults = [];
      const officeCodeList = Object.values(OFFICE_CODES);
      
      // Promise.all로 병렬 처리하여 속도 향상
      const promises = officeCodeList.map(async (officeCode) => {
        try {
          const url = `https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SCHUL_NM=${encodeURIComponent(schoolName)}`;
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
      allResults = results.flat(); // 결과 합치기
      
      setSearchResults(allResults);
      if (allResults.length === 0) alert("검색 결과가 없습니다.");

    } catch (e) {
      console.error(e);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSchool = (school) => {
    setSchoolInfo(school);
    setSchoolName(school.name);
    setSearchResults([]); // 결과창 닫기
  };

  const handleSubmit = () => {
    onSave({ 
      year, startDate, endDate, isHomeroom, 
      grade: isHomeroom ? grade : "",
      classroom: isHomeroom ? classroom : "",
      title: `${year}학년도 교무수첩`,
      schoolInfo: schoolInfo || {} // 학교 정보 저장
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="bg-indigo-600 p-6 text-white text-center relative">
          <BookPlus size={48} className="mx-auto mb-2 opacity-80" />
          <h3 className="text-xl font-bold">새 교무수첩 만들기</h3>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          {/* 학년도 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">학년도 선택</label>
            <select 
              value={year} 
              onChange={(e) => {
                const y = Number(e.target.value);
                setYear(y);
                setStartDate(`${y}-03-02`);
                setEndDate(`${y + 1}-02-28`);
              }}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg font-bold text-center"
            >
              {years.map(y => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>

          {/* 학교 검색 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">학교 설정 (급식 연동용)</label>
            <div className="relative flex gap-2">
              <input 
                type="text" 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSchool()}
                placeholder="학교명 입력 (예: 서울초)"
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <button onClick={searchSchool} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"><Search size={20}/></button>
            </div>
            {/* 검색 결과 리스트 */}
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto border rounded bg-white dark:bg-gray-700 absolute z-50 w-full shadow-lg">
                {searchResults.map((s, idx) => (
                  <div key={idx} onClick={() => handleSelectSchool(s)} className="p-2 hover:bg-indigo-50 dark:hover:bg-gray-600 cursor-pointer text-sm border-b dark:border-gray-600 last:border-none">
                    <p className="font-bold dark:text-white">{s.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.address}</p>
                  </div>
                ))}
              </div>
            )}
            {schoolInfo && <p className="text-xs text-green-600 mt-1">✅ 선택됨: {schoolInfo.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">시작일</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">종료일</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"/>
            </div>
          </div>

          <div 
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${isHomeroom ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : 'bg-gray-50 border-gray-100 dark:bg-gray-700'}`} 
            onClick={() => setIsHomeroom(!isHomeroom)}
          >
            <div>
              <p className="font-bold text-gray-800 dark:text-white">담임 선생님이신가요?</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">체크하면 출결 관리 메뉴가 활성화됩니다.</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isHomeroom ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
              {isHomeroom && <Check size={14} className="text-white" />}
            </div>
          </div>

          {isHomeroom && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학년</label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                  {Array.from({length: 6}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}학년</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">반</label>
                <select value={classroom} onChange={e => setClassroom(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white">
                  {Array.from({length: 15}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}반</option>)}
                </select>
              </div>
            </div>
          )}

          <button onClick={handleSubmit} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg">
            수첩 생성하기
          </button>
        </div>
      </div>
    </div>
  );
}