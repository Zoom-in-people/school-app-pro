import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Search } from 'lucide-react';
import { NEIS_API_KEY, OFFICE_CODES } from '../../constants/data';

export default function HandbookSettingsModal({ isOpen, onClose, handbook, onUpdate }) {
  const [formData, setFormData] = useState(handbook || {});
  
  // 학교 검색 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (handbook) {
      setFormData(handbook);
      if (handbook.schoolInfo) setSearchTerm(handbook.schoolInfo.name);
    }
  }, [handbook, isOpen]);

  const searchSchool = async () => {
    if (searchTerm.length < 2) return alert("2글자 이상 입력하세요.");
    setIsSearching(true);
    try {
      let allResults = [];
      const officeCodeList = Object.values(OFFICE_CODES);
      const promises = officeCodeList.map(async (officeCode) => {
        try {
          const res = await fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${NEIS_API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SCHUL_NM=${encodeURIComponent(searchTerm)}`);
          const data = await res.json();
          if (data.schoolInfo) return data.schoolInfo[1].row.map(s => ({ name: s.SCHUL_NM, code: s.SD_SCHUL_CODE, officeCode: s.ATPT_OFCDC_SC_CODE, address: s.ORG_RDNMA }));
        } catch (e) { return []; }
        return [];
      });
      const results = await Promise.all(promises);
      allResults = results.flat();
      setSearchResults(allResults);
      if (allResults.length === 0) alert("결과가 없습니다.");
    } catch (e) { alert("오류 발생"); } finally { setIsSearching(false); }
  };

  const handleSelectSchool = (school) => {
    setFormData({ ...formData, schoolInfo: school });
    setSearchTerm(school.name);
    setSearchResults([]);
  };

  if (!isOpen || !handbook) return null;

  const handleSave = () => {
    onUpdate(handbook.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <Settings className="text-gray-500"/> 수첩 설정 ({formData.year}학년도)
          </h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"/></button>
        </div>

        <div className="space-y-5">
          {/* 학교 설정 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">학교 설정</label>
            <div className="flex gap-2 relative">
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSchool()}
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
              <button onClick={searchSchool} className="bg-indigo-600 text-white p-2 rounded"><Search size={18}/></button>
              
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 shadow-lg rounded max-h-40 overflow-y-auto z-10">
                  {searchResults.map((s, idx) => (
                    <div key={idx} onClick={() => handleSelectSchool(s)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600 text-sm dark:text-white">
                      {s.name} <span className="text-xs text-gray-400">({s.address})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">시작일</label>
              <input type="date" value={formData.startDate || ""} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">종료일</label>
              <input type="date" value={formData.endDate || ""} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
            </div>
          </div>

          <div 
            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${formData.isHomeroom ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700' : 'bg-gray-50 border-gray-100 dark:bg-gray-700 dark:border-gray-600'}`} 
            onClick={() => setFormData({...formData, isHomeroom: !formData.isHomeroom})}
          >
            <div>
              <p className="font-bold text-gray-800 dark:text-white">담임 선생님</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formData.isHomeroom ? "담임 모드" : "비담임 모드"}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${formData.isHomeroom ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
              {formData.isHomeroom && <Check size={14} className="text-white" />}
            </div>
          </div>

          {formData.isHomeroom && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">학년</label>
                <select value={formData.grade || "1"} onChange={e => setFormData({...formData, grade: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-500">
                  {Array.from({length: 6}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}학년</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">반</label>
                <select value={formData.classroom || "1"} onChange={e => setFormData({...formData, classroom: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-500">
                  {Array.from({length: 15}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}반</option>)}
                </select>
              </div>
            </div>
          )}

          <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">설정 저장</button>
        </div>
      </div>
    </div>
  );
}