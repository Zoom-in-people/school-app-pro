import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, X, BookOpen, CheckCircle, HelpCircle, Calendar, Edit2, Pencil } from 'lucide-react';
import { showToast, showConfirm } from '../utils/alerts';

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
    if (!className) return showToast("이름을 입력하세요.", "warning");
    if (localGroup.classes.some(c => c.name === className)) return showToast("이미 추가된 교실입니다.", "warning");
    
    setLocalGroup(prev => ({...prev, classes: [...prev.classes, { id: Date.now().toString(), name: className }]}));
    setCustomName("");
  };
  const removeClass = (clsId) => { setLocalGroup(prev => ({...prev, classes: prev.classes.filter(c => c.id !== clsId)})); };

  const handleSave = () => { onSave(localGroup.id, localGroup); onClose(); showToast('수업 설정이 저장되었습니다.'); };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-xl dark:text-white flex items-center gap-2"><Settings/> 수업 설정</h3><button onClick={onClose}><X/></button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
            <h4 className="font-bold mb-3 dark:text-white">🏫 교실 관리 (가로에 배치됨)</h4>
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
            <h4 className="font-bold mb-3 dark:text-white">📝 진도 단계 관리 (세로로 배치됨)</h4>
            <div className="flex gap-2 mb-4"><input type="text" value={newItem} onChange={e=>setNewItem(e.target.value)} placeholder="예: 1단원" className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white"/><button onClick={addProgressItem} className="bg-indigo-600 text-white px-3 rounded font-bold text-sm">추가</button></div>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">{localGroup.progressItems.map((item, idx) => (<span key={idx} className="bg-white dark:bg-gray-800 border dark:border-gray-600 px-2 py-1 rounded text-sm flex items-center gap-1 dark:text-white">{item} <button onClick={() => removeProgressItem(idx)} className="text-red-500 hover:bg-red-50 rounded-full"><X size={12}/></button></span>))}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 border-t pt-4 dark:border-gray-700"><button onClick={onClose} className="px-4 py-2 text-gray-500">취소</button><button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold">저장</button></div>
      </div>
    </div>
  );
};

// 🔥 1번 요청 해결: 인라인 수정 전용 컴포넌트 신설
function InlineEditableItem({ text, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(text);

  const handleBlur = () => {
    setIsEditing(false);
    if (val.trim() && val !== text) onSave(val.trim());
    else setVal(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') { setVal(text); setIsEditing(false); }
  };

  if (isEditing) {
    return (
      <input 
        type="text" value={val} onChange={e => setVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} 
        className="w-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold p-1 rounded outline-none border border-indigo-200" autoFocus 
      />
    );
  }
  
  return (
    <div onClick={() => setIsEditing(true)} className="group/edit cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 -mx-1 rounded transition">
      <span>{text}</span>
      <Pencil size={12} className="opacity-0 group-hover/edit:opacity-100 text-indigo-500 transition-opacity" />
    </div>
  );
}

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
    if (name) {
      onAddGroup({ name, progressItems: ["1단원"], classes: [], status: {} });
      showToast('새 그룹이 생성되었습니다.');
    }
  };
  
  const handleEditGroupName = (group) => {
    const newName = prompt("변경할 그룹 이름을 입력하세요", group.name);
    if (newName && newName.trim()) {
      onUpdateGroup(group.id, { ...group, name: newName.trim() });
      showToast('그룹 이름이 변경되었습니다.');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (await showConfirm("수업 그룹을 삭제하시겠습니까?", "등록된 모든 진도 데이터가 삭제됩니다.")) {
      onDeleteGroup(id);
      if (selectedGroupId === id) setSelectedGroupId(null);
      showToast('삭제되었습니다.');
    }
  };

  // 🔥 인라인 수정 내용을 DB에 반영하는 함수
  const handleInlineItemEdit = (idx, newValue) => {
    if (!activeGroup) return;
    const newItems = [...activeGroup.progressItems];
    newItems[idx] = newValue;
    
    // (선택) 만약 상태(status) 키도 같이 바꿔주고 싶다면 해당 로직 추가 필요 (지금은 단순 이름 변경만 지원)
    onUpdateGroup(activeGroup.id, { progressItems: newItems });
    showToast('진도 이름이 수정되었습니다.');
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

      <div className="flex gap-2 overflow-x-auto pb-3 border-b border-gray-100 dark:border-gray-700 mb-6 custom-scrollbar">
        {lessonGroups && lessonGroups.map(group => (
          <div key={group.id} className="relative group/tab mt-2">
            <button onClick={() => setSelectedGroupId(group.id)} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${selectedGroupId === group.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}>
              {group.name}
            </button>
            {selectedGroupId === group.id && (
              <div className="absolute -top-2 -right-2 flex gap-0.5 opacity-0 group-hover/tab:opacity-100 transition duration-200">
                <button onClick={(e) => { e.stopPropagation(); handleEditGroupName(group); }} className="bg-blue-500 text-white rounded-full p-1 shadow-sm hover:bg-blue-600 transition" title="이름 수정"><Edit2 size={12}/></button>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition" title="그룹 삭제"><X size={12}/></button>
              </div>
            )}
          </div>
        ))}
        {(!lessonGroups || lessonGroups.length === 0) && <div className="text-sm text-gray-400 py-2">등록된 수업 그룹이 없습니다.</div>}
      </div>

      {activeGroup ? (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-1 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"><Settings size={16}/> 상세 설정</button>
          </div>
          <div className="overflow-x-auto border rounded-xl border-gray-200 dark:border-gray-700 custom-scrollbar">
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-indigo-50 dark:bg-gray-700 text-indigo-900 dark:text-gray-200 font-bold">
                <tr>
                  <th className="p-3 border border-indigo-100 dark:border-gray-600 min-w-[150px] sticky left-0 bg-indigo-50 dark:bg-gray-700 z-10 shadow-sm">진도 단계</th>
                  {activeGroup.classes.map(cls => (
                    <th key={cls.id} className="p-3 border border-indigo-100 dark:border-gray-600 min-w-[100px]">{cls.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeGroup.progressItems.length > 0 ? activeGroup.progressItems.map((item, idx) => (
                  <tr key={idx} className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="p-3 border border-gray-100 dark:border-gray-700 font-bold sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-sm text-left">
                      {/* 🔥 1번 요청 해결: 인라인 에디팅 컴포넌트 렌더링 */}
                      <InlineEditableItem text={item} onSave={(newVal) => handleInlineItemEdit(idx, newVal)} />
                    </td>
                    {activeGroup.classes.map(cls => {
                      const statusDate = activeGroup.status[`${cls.id}_${item}`];
                      const displayDate = (typeof statusDate === 'string' && statusDate.length >= 5) ? statusDate.slice(5) : "";
                      return (
                        <td key={cls.id} className="p-3 border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-gray-600 transition" onClick={() => setDatePopup({ isOpen: true, classId: cls.id, itemName: item, currentDate: (typeof statusDate === 'string' ? statusDate : new Date().toISOString().split('T')[0]) })}>
                          {statusDate ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle className="text-green-500 mb-1" size={20} fill="currentColor" color="white"/>
                              <span className="text-[10px] text-gray-500 dark:text-gray-400">{displayDate}</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 mx-auto transition-colors hover:border-indigo-400"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                )) : <tr><td colSpan={activeGroup.classes.length + 1} className="p-10 text-gray-400">등록된 진도 단계가 없습니다.</td></tr>}
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
            <input type="date" value={datePopup.currentDate} onChange={e => setDatePopup({...datePopup, currentDate: e.target.value})} className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"/>
            <div className="flex justify-between"><button onClick={() => handleSaveStatus(null)} className="text-red-500 text-sm hover:underline font-bold">취소(미완료)</button><button onClick={() => handleSaveStatus(datePopup.currentDate)} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-bold shadow-sm">완료 처리</button></div>
          </div>
        </div>
      )}

      {isHelpOpen && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2 dark:text-white"><HelpCircle/> 사용 가이드</h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div><p className="font-bold text-indigo-600">1. 진도 이름 바로 수정</p><p>표 왼쪽의 진도 이름을 클릭하면 상세 설정에 들어가지 않고도 바로 이름을 고칠 수 있습니다.</p></div>
              <div><p className="font-bold text-indigo-600">2. 표 행/열 전환 안내</p><p>교실은 우측으로 길게 추가되고, 진도 항목은 아래쪽으로 추가됩니다.</p></div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"><p className="font-bold">💡 팁</p><p>완료 여부를 체크하고 싶은 빈 동그라미 칸을 클릭하세요.</p></div>
            </div>
            <button onClick={() => setIsHelpOpen(false)} className="w-full mt-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 py-2.5 rounded-lg font-bold transition">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}