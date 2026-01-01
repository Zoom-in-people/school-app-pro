import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, X, BookOpen, CheckCircle, HelpCircle, Calendar } from 'lucide-react';

const SettingsModal = ({ group, onClose, onSave }) => {
  const [localGroup, setLocalGroup] = useState(JSON.parse(JSON.stringify(group)));
  const [newItem, setNewItem] = useState("");
  const [classMode, setClassMode] = useState("standard");
  const [grade, setGrade] = useState("1");
  const [cls, setCls] = useState("1");
  const [customName, setCustomName] = useState("");

  const addProgressItem = () => { if (newItem.trim()) { setLocalGroup(prev => ({...prev, progressItems: [...prev.progressItems, newItem.trim()]})); setNewItem(""); } };
  const removeProgressItem = (idx) => { setLocalGroup(prev => ({...prev, progressItems: prev.progressItems.filter((_, i) => i !== idx)})); };
  const addClass = () => {
    let className = classMode === 'standard' ? `${grade}학년 ${cls}반` : customName.trim();
    if (!className) return alert("입력하세요");
    if (localGroup.classes.some(c => c.name === className)) return alert("중복입니다");
    setLocalGroup(prev => ({...prev, classes: [...prev.classes, { id: Date.now().toString(), name: className }]}));
    setCustomName("");
  };
  const removeClass = (clsId) => { setLocalGroup(prev => ({...prev, classes: prev.classes.filter(c => c.id !== clsId)})); };

  const handleSave = () => {
    onSave(localGroup.id, localGroup);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings/> 수업 설정</h3><button onClick={onClose}><X/></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <h4 className="font-bold mb-3 dark:text-white">🏫 교실 관리</h4>
            <div className="flex gap-2 mb-4 bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-600">
              <button onClick={() => setClassMode('standard')} className={`flex-1 py-1 text-sm rounded ${classMode === 'standard' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500'}`}>학년/반</button>
              <button onClick={() => setClassMode('custom')} className={`flex-1 py-1 text-sm rounded ${classMode === 'custom' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-500'}`}>자유입력</button>
            </div>
            <div className="flex gap-2 mb-4">
              {classMode === 'standard' ? (<><select value={grade} onChange={e=>setGrade(e.target.value)} className="p-2 border rounded w-20 dark:bg-gray-700 dark:text-white">{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}학년</option>)}</select><select value={cls} onChange={e=>setCls(e.target.value)} className="p-2 border rounded w-20 dark:bg-gray-700 dark:text-white">{Array.from({length:15},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}반</option>)}</select></>) : (<input type="text" value={customName} onChange={e=>setCustomName(e.target.value)} placeholder="예: 동아리 A" className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white"/>)}
              <button onClick={addClass} className="bg-indigo-600 text-white px-3 rounded font-bold text-sm">추가</button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">{localGroup.classes.map(c => (<div key={c.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600"><span className="text-sm font-medium dark:text-white">{c.name}</span><button onClick={() => removeClass(c.id)} className="text-red-500"><Trash2 size={14}/></button></div>))}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <h4 className="font-bold mb-3 dark:text-white">📝 진도 단계 관리</h4>
            <div className="flex gap-2 mb-4"><input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="예: 1단원" className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white"/><button onClick={addProgressItem} className="bg-indigo-600 text-white px-3 rounded font-bold text-sm">추가</button></div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">{localGroup.progressItems.map((item, idx) => (<span key={idx} className="bg-white dark:bg-gray-800 border dark:border-gray-600 px-2 py-1 rounded text-sm flex items-center gap-1 dark:text-white">{item} <button onClick={() => removeProgressItem(idx)} className="text-red-500 hover:bg-red-50 rounded-full"><X size={12}/></button></span>))}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 border-t pt-4 dark:border-gray-700"><button onClick={onClose} className="px-4 py-2 text-gray-500">취소</button><button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">저장</button></div>
      </div>
    </div>
  );
};

export default function LessonManager({ lessonGroups, onAddGroup, onUpdateGroup, onDeleteGroup }) {
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [datePopup, setDatePopup] = useState({ isOpen: false, classId: null, itemName: null, currentDate: null });

  useEffect(() => {
    if (!selectedGroupId && lessonGroups && lessonGroups.length > 0) {
      setSelectedGroupId(lessonGroups[0].id);
    }
  }, [lessonGroups, selectedGroupId]);

  const activeGroup = (lessonGroups || []).find(g => g.id === selectedGroupId);

  const handleAddGroup = () => {
    const name = prompt("새 수업 그룹 이름을 입력하세요");
    if (name) onAddGroup({ name, progressItems: ["1단원"], classes: [], status: {} });
  };

  const handleDeleteGroup = (id) => {
    if (window.confirm("삭제하시겠습니까?")) {
      onDeleteGroup(id);
      if (selectedGroupId === id) setSelectedGroupId(null);
    }
  };

  const handleSaveStatus = (date) => {
    if (!activeGroup) return;
    const { classId, itemName } = datePopup;
    const key = `${classId}_${itemName}`;
    const newStatus = { ...activeGroup.status, [key]: date };
    onUpdateGroup(activeGroup.id, { status: newStatus });
    setDatePopup({ isOpen: false, classId: null, itemName: null, currentDate: null });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[600px] flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><BookOpen className="text-indigo-500"/> 수업 진도 관리</h3>
        <div className="flex gap-2">
          <button onClick={() => setIsHelpOpen(true)} className="text-gray-500 hover:text-indigo-600"><HelpCircle size={20}/></button>
          <button onClick={handleAddGroup} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 flex items-center gap-1"><Plus size={16}/> 수업 그룹 추가</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100 dark:border-gray-700 mb-6">
        {lessonGroups && lessonGroups.map(group => (
          <div key={group.id} className="relative group/tab">
            <button onClick={() => setSelectedGroupId(group.id)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${selectedGroupId === group.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}>{group.name}</button>
            {selectedGroupId === group.id && <button onClick={() => handleDeleteGroup(group.id)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/tab:opacity-100 transition shadow-sm"><X size={10}/></button>}
          </div>
        ))}
        {(!lessonGroups || lessonGroups.length === 0) && <div className="text-sm text-gray-400 py-2">등록된 수업 그룹이 없습니다.</div>}
      </div>

      {activeGroup ? (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg"><Settings size={16}/> 수업 설정</button>
          </div>
          <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-indigo-50 dark:bg-gray-700 text-indigo-900 dark:text-gray-200 font-bold">
                <tr>
                  <th className="p-3 border border-indigo-100 dark:border-gray-600 min-w-[120px] sticky left-0 bg-indigo-50 dark:bg-gray-700 z-10">수업 교실</th>
                  {activeGroup.progressItems.map((item, idx) => (<th key={idx} className="p-3 border border-indigo-100 dark:border-gray-600 min-w-[100px]">{item}</th>))}
                </tr>
              </thead>
              <tbody>
                {activeGroup.classes.length > 0 ? activeGroup.classes.map(cls => (
                  <tr key={cls.id} className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="p-3 border border-gray-100 dark:border-gray-700 font-bold sticky left-0 bg-white dark:bg-gray-800 z-10">{cls.name}</td>
                    {activeGroup.progressItems.map((item, idx) => {
                      const statusDate = activeGroup.status[`${cls.id}_${item}`];
                      const displayDate = (typeof statusDate === 'string' && statusDate.length >= 5) ? statusDate.slice(5) : "";
                      return (
                        <td key={idx} className="p-3 border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600 transition" onClick={() => setDatePopup({ isOpen: true, classId: cls.id, itemName: item, currentDate: (typeof statusDate === 'string' ? statusDate : new Date().toISOString().split('T')[0]) })}>
                          {statusDate ? (<div className="flex flex-col items-center"><CheckCircle className="text-green-500 mb-1" size={20} fill="currentColor" color="white"/><span className="text-[10px] text-gray-500">{displayDate}</span></div>) : (<div className="w-6 h-6 rounded-full border-2 border-gray-300 mx-auto"></div>)}
                        </td>
                      );
                    })}
                  </tr>
                )) : <tr><td colSpan={activeGroup.progressItems.length + 1} className="p-10 text-gray-400">등록된 교실이 없습니다.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : <div className="flex-1 flex items-center justify-center text-gray-400">수업 그룹을 선택하세요.</div>}

      {isSettingsOpen && activeGroup && <SettingsModal group={activeGroup} onClose={() => setIsSettingsOpen(false)} onSave={onUpdateGroup} />}
      
      {datePopup.isOpen && (
        <div className="fixed inset-0 bg-black/20 z-[110] flex items-center justify-center" onClick={() => setDatePopup({ ...datePopup, isOpen: false })}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl w-64" onClick={e => e.stopPropagation()}>
            <h4 className="font-bold mb-3 dark:text-white">진도 완료일 선택</h4>
            <input type="date" value={datePopup.currentDate} onChange={e => setDatePopup({...datePopup, currentDate: e.target.value})} className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"/>
            <div className="flex justify-between"><button onClick={() => handleSaveStatus(null)} className="text-red-500 text-sm hover:underline">취소(미완료)</button><button onClick={() => handleSaveStatus(datePopup.currentDate)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold">완료 처리</button></div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 dark:text-white"><HelpCircle/> 사용 가이드</h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div><p className="font-bold text-indigo-600">1. 수업 그룹</p><p>과목/동아리별 탭을 만듭니다.</p></div>
              <div><p className="font-bold text-indigo-600">2. 수업 교실 & 진도</p><p>[수업 설정] 버튼을 눌러 반과 단원을 추가하세요.</p></div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"><p className="font-bold">💡 팁</p><p>표의 칸을 클릭하면 날짜를 지정할 수 있습니다.</p></div>
            </div>
            <button onClick={() => setIsHelpOpen(false)} className="w-full mt-6 bg-gray-200 dark:bg-gray-700 py-2 rounded-lg font-bold">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}