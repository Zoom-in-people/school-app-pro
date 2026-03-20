import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import TodoModal from '../components/modals/TodoModal';
import { showToast, showConfirm } from '../utils/alerts';

export default function TaskList({ todos, onAddTodo, onUpdateTodo, onDeleteTodo }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetTodo, setTargetTodo] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // 🔥 8번 요청 해결: 클릭된 업무 ID 추적
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  
  // 🔥 2번 요청 해결: 미니 달력용 상태
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleSave = (todo) => {
    if (todo.id) {
      const { id, ...fields } = todo;
      onUpdateTodo(id, fields);
      showToast('업무가 수정되었습니다.');
    } else {
      onAddTodo({ ...todo, done: false });
      showToast('새 업무가 등록되었습니다.');
    }
    setModalOpen(false);
  };

  const filteredTodos = todos.filter(t => activeTab === 'completed' ? t.done : !t.done);

  // 미니 달력 렌더링 함수
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const emptyDays = Array(firstDay).fill(null);
    const days = Array.from({length: daysInMonth}, (_, i) => i + 1);

    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <CalIcon className="text-indigo-500"/> {year}년 {month}월 업무 현황
          </h3>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button onClick={() => setCurrentMonth(new Date(year, month - 2, 1))} className="p-1 hover:bg-white rounded dark:hover:bg-gray-600 transition"><ChevronLeft size={18}/></button>
            <button onClick={() => setCurrentMonth(new Date(year, month, 1))} className="p-1 hover:bg-white rounded dark:hover:bg-gray-600 transition"><ChevronRight size={18}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <div key={d} className={`font-bold p-1.5 ${i===0 ? 'text-red-500' : i===6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
          ))}
          {emptyDays.map((_, i) => <div key={`empty-${i}`} className="p-2"></div>)}
          {days.map(day => {
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const dayTodos = todos.filter(t => t.dueDate === dateStr);
            const pendingCount = dayTodos.filter(t => !t.done).length;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <div key={day} className={`p-1 border border-gray-100 dark:border-gray-700 rounded-lg min-h-[46px] flex flex-col items-center justify-start transition hover:border-indigo-300 ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                <span className={`font-bold text-[11px] ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                {pendingCount > 0 && <span className="mt-0.5 bg-red-100 text-red-600 text-[9px] font-bold px-1.5 rounded-full">{pendingCount}건</span>}
                {dayTodos.length > 0 && pendingCount === 0 && <span className="mt-0.5 bg-green-100 text-green-600 text-[9px] font-bold px-1.5 rounded-full">완료</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    // 🔥 9번 요청 해결: 전체 높이를 지정하고 리스트가 넘어갈 때 스크롤되도록 구조 개선
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">업무 리스트</h2>
        <button onClick={() => { setTargetTodo(null); setModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">업무 등록</button>
      </div>

      {/* 달력 렌더링 */}
      {renderCalendar()}

      <div className="flex border-b dark:border-gray-700 shrink-0 mt-2">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-bold transition ${activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          미완료 업무 ({todos.filter(t => !t.done).length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={`px-6 py-3 font-bold transition ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          완료된 업무 ({todos.filter(t => t.done).length})
        </button>
      </div>

      {/* 🔥 9번 요청 해결: flex-1과 overflow-y-auto를 줘서 10개 이상 작성해도 잘려나가지 않고 스크롤됨 */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px] border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 w-16 text-center whitespace-nowrap">상태</th>
                <th className="p-4 whitespace-nowrap">업무 내용 (클릭 시 전체 보기)</th>
                <th className="p-4 w-28 whitespace-nowrap">분류</th>
                <th className="p-4 w-32 whitespace-nowrap">기한</th>
                <th className="p-4 w-24 text-right whitespace-nowrap">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredTodos.map(todo => {
                const priorityColors = {
                  high: 'bg-red-50/70 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20',
                  medium: 'bg-amber-50/70 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20',
                  low: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                };
                const bgClass = todo.done ? 'bg-gray-50 dark:bg-gray-800/50 opacity-60' : (priorityColors[todo.priority] || priorityColors.low);
                const isExpanded = expandedTaskId === todo.id;

                return (
                  <tr key={todo.id} className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${bgClass}`}>
                    <td className="p-4 text-center align-top pt-5">
                      <button onClick={() => onUpdateTodo(todo.id, { done: !todo.done })} className="transition-transform hover:scale-110">
                        {todo.done ? <CheckCircle className="text-green-500"/> : <Circle className="text-gray-300 hover:text-indigo-400"/>}
                      </button>
                    </td>
                    {/* 🔥 8번 요청 해결: 클릭하면 내용이 펼쳐지도록 속성 부여 */}
                    <td 
                      onClick={() => setExpandedTaskId(isExpanded ? null : todo.id)} 
                      className={`p-4 font-bold cursor-pointer transition-all duration-200 ${todo.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}
                    >
                      <div className={isExpanded ? "whitespace-pre-wrap break-words" : "truncate max-w-[200px] md:max-w-md lg:max-w-xl"} title={!isExpanded ? "클릭하여 전체 보기" : ""}>
                        {todo.title}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap align-top pt-4">
                      {todo.category && <span className="px-2 py-1 bg-white/80 dark:bg-gray-700 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600">{todo.category}</span>}
                    </td>
                    <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap align-top pt-4">{todo.dueDate}</td>
                    <td className="p-4 text-right whitespace-nowrap align-top pt-4">
                      <button onClick={() => { setTargetTodo(todo); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 bg-white/50 dark:bg-transparent rounded-lg transition border border-transparent hover:border-indigo-100"><Edit2 size={16}/></button>
                      <button onClick={async () => {
                        if(await showConfirm("업무를 삭제하시겠습니까?", "선택한 업무가 목록에서 제거됩니다.")) {
                          onDeleteTodo(todo.id);
                          showToast('삭제되었습니다.');
                        }
                      }} className="p-2 text-gray-400 hover:text-red-600 bg-white/50 dark:bg-transparent rounded-lg transition ml-1 border border-transparent hover:border-red-100"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                );
              })}
              {filteredTodos.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-16 text-center text-gray-400">
                    해당하는 업무가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <TodoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} todo={targetTodo} onSave={handleSave} />}
    </div>
  );
}
