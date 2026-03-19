import React, { useState, useMemo } from 'react';
import { Search, Plus, Calendar, Clock, Trash2, Edit2, X, Save, MessageSquare, Printer } from 'lucide-react';
import { showToast, showConfirm } from '../utils/alerts'; // 🔥 알림창 가져오기

export default function MeetingLogs({ logs = [], onAddLog, onUpdateLog, onDeleteLog }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], title: '', content: '' });

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (searchTerm) result = result.filter(log => log.title.includes(searchTerm) || log.content.includes(searchTerm));
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs, searchTerm]);

  const handleSave = () => {
    // 🔥 예쁜 토스트 경고
    if (!formData.title || !formData.content) return showToast("제목과 내용을 모두 입력해주세요.", "warning");
    
    if (editingLogId) onUpdateLog(editingLogId, formData);
    else onAddLog(formData);
    
    showToast('회의록이 저장되었습니다.', 'success'); // 🔥 완료 알림
    closeModal();
  };

  const closeModal = () => { setIsModalOpen(false); setEditingLogId(null); setFormData({ date: new Date().toISOString().split('T')[0], title: '', content: '' }); };
  const handleEdit = (log) => { setFormData({ date: log.date, title: log.title, content: log.content }); setEditingLogId(log.id); setIsModalOpen(true); };

  return (
    <div className="h-full flex flex-col gap-4 relative">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="회의록 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"/>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center gap-2 border border-gray-200 dark:border-gray-600 shadow-sm">
            <Printer size={18}/> 인쇄
          </button>
          <button onClick={() => { closeModal(); setIsModalOpen(true); }} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-sm">
            <Plus size={18}/> 새 회의록 작성
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 print:overflow-visible print:h-auto mt-2">
        {filteredLogs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4 items-start print:block print:space-y-6">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:border-indigo-200 transition-all flex flex-col h-full print-break-inside-avoid print:border-gray-400 print:shadow-none">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-900/40 p-2 rounded-xl text-indigo-600 dark:text-indigo-300 print:bg-gray-100 print:text-black"><MessageSquare size={20}/></div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2 print:text-black">{log.title}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-1 print:text-gray-600"><Calendar size={12}/> {log.date}</p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition no-print">
                    <button onClick={() => handleEdit(log)} className="p-2 text-gray-400 hover:text-indigo-500 rounded-lg"><Edit2 size={18}/></button>
                    {/* 🔥 예쁜 삭제 확인창 적용 */}
                    <button onClick={async () => { 
                      if(await showConfirm("회의록을 삭제하시겠습니까?", "이 기록은 영구적으로 삭제됩니다.")) {
                        onDeleteLog(log.id); 
                        showToast('삭제되었습니다.');
                      }
                    }} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar flex-1 print:max-h-none print:overflow-visible print:bg-white print:text-black print:p-2 print:border-none">
                  {log.content}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400 no-print"><MessageSquare size={48} className="mx-auto mb-4 opacity-20"/><p>기록이 없습니다.</p></div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-indigo-600 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">{editingLogId ? <><Edit2 size={20}/> 회의록 수정</> : <><Plus size={20}/> 새 회의록</>}</h3>
              <button onClick={closeModal} className="hover:bg-white/20 p-1 rounded-full"><X size={24}/></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-[1fr_2fr] gap-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">회의 일자</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">회의 안건 (제목)</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="예: 2학기 현장체험학습 협의회" className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"/></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">회의 내용</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows="12" className="w-full p-4 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar" placeholder="회의 내용을 상세히 기록하세요."></textarea>
              </div>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">취소</button>
                <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2"><Save size={18}/> {editingLogId ? '수정 내용 저장' : '회의록 저장'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}