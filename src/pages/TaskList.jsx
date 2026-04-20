import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import TodoModal from '../components/modals/TodoModal';
import { showToast, showConfirm } from '../utils/alerts';

export default function TaskList({ todos, onAddTodo, onUpdateTodo, onDeleteTodo }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetTodo, setTargetTodo] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'completed', 'date'
  const [selectedDate, setSelectedDate] = useState(null); // 날짜 탭 용도
  
  const [expandedTaskId, setExpandedTaskId] = useState(null);
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

  const handleToggleDone = (todo) => {
    const today = new Date().toISOString().split('T')[0];
    onUpdateTodo(todo.id, { 
      done: !todo.done, 
      completedDate: !todo.done ? today : null 
    });
  };

  const filteredTodos = todos.filter(t => {
    if (activeTab === 'completed') return t.done;
    if (activeTab === 'pending') return !t.done;
    if (activeTab === 'date' && selectedDate) {
      const start = t.startDate || t.dueDate;
      const end = t.dueDate;
      return selectedDate >= start && selectedDate <= end;
    }
    return true;
  });

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
        <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
          {['일','월','화','수','목','금','토'].map((d, i) => (
            <div key={d} className={`font-bold p-1.5 ${i===0 ? 'text-red-500' : i===6 ? 'text-blue-500' : 'text-gray-500'}`}>{d}</div>
          ))}
          {emptyDays.map((_, i) => <div key={`empty-${i}`} className="p-1"></div>)}
          
          {days.map(day => {
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            const dayTodos = todos.filter(t => {
              const start = t.startDate || t.dueDate;
              const end = t.dueDate;
              return dateStr >= start && dateStr <= end;
            });

            dayTodos.sort((a, b) => (a.startDate || a.dueDate).localeCompare(b.startDate || b.dueDate) || a.id.localeCompare(b.id));

            return (
              <div key={day} 
                   onClick={() => { setSelectedDate(dateStr); setActiveTab('date'); }}
                   className={`p-1 border rounded-lg min-h-[80px] flex flex-col items-stretch transition cursor-pointer hover:border-indigo-400 ${isToday ? 'bg-indigo-50/80 dark:bg-indigo-900/40 border-indigo-300 dark:border-indigo-700 shadow-sm z-10' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                
                <span className={`text-center font-bold text-[11px] mb-1 ${isToday ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 rounded-full w-5 h-5 mx-auto flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>{day}</span>
                
                <div className="flex flex-col gap-[2px]">
                  {dayTodos.map(t => {
                    const start = t.startDate || t.dueDate;
                    const end = t.dueDate;
                    const isStart = dateStr === start;
                    const isEnd = dateStr === end;
                    
                    const isCompletedDay = t.done && (t.completedDate === dateStr || (!t.completedDate && isEnd)); 

                    let bgClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';
                    if (t.done) bgClass = 'bg-gray-100 text-gray-400 line-through dark:bg-gray-800/50 dark:text-gray-500';
                    else if (t.priority === 'high') bgClass = 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200';
                    else if (t.priority === 'medium') bgClass = 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200';
                    else bgClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200';
                    
                    let roundedClass = 'rounded-sm';
                    let marginClass = 'mx-0';
                    if (start !== end) {
                      if (isStart) { roundedClass = 'rounded-l-md rounded-r-none z-10 relative'; marginClass = 'ml-0.5 -mr-1'; }
                      else if (isEnd) { roundedClass = 'rounded-r-md rounded-l-none z-10 relative'; marginClass = '-ml-1 mr-0.5'; }
                      else { roundedClass = 'rounded-none z-0 relative'; marginClass = '-mx-1'; }
                    } else {
                      roundedClass = 'rounded-md z-10 relative'; marginClass = 'mx-0.5';
                    }

                    return (
                      <div key={t.id} className={`text-[10px] font-bold leading-tight px-1.5 py-0.5 truncate ${bgClass} ${roundedClass} ${marginClass}`} title={t.title}>
                        {isStart || start === end ? t.title : '\u00A0'}
                        {isCompletedDay && ' ✅'}
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ... (나머지 탭 렌더링 코드는 생략)

  return (
    <div className="flex flex-col gap-4 pb-12">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">업무 리스트</h2>
        <button onClick={() => { setTargetTodo(null); setModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-sm">업무 등록</button>
      </div>

      {renderCalendar()}

      <div className="flex border-b dark:border-gray-700 shrink-0 mt-4 overflow-x-auto custom-scrollbar">
        <button onClick={() => setActiveTab('pending')} className={`px-5 py-3 font-bold transition whitespace-nowrap ${activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
          미완료 업무 ({todos.filter(t => !t.done).length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={`px-5 py-3 font-bold transition whitespace-nowrap ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
          완료된 업무 ({todos.filter(t => t.done).length})
        </button>
        
        {selectedDate && (
          <button onClick={() => setActiveTab('date')} className={`px-5 py-3 font-bold transition whitespace-nowrap flex items-center gap-1 ${activeTab === 'date' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
            <CalIcon size={14}/> {parseInt(selectedDate.split('-')[1])}월 {parseInt(selectedDate.split('-')[2])}일 업무
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto w-full">
        <table className="w-full text-left min-w-[600px] border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
            <tr>
              <th className="p-4 w-16 text-center whitespace-nowrap border-b dark:border-gray-600">상태</th>
              <th className="p-4 whitespace-nowrap border-b dark:border-gray-600">업무 내용 (클릭 시 전체 보기)</th>
              <th className="p-4 w-28 whitespace-nowrap border-b dark:border-gray-600">분류</th>
              <th className="p-4 w-40 whitespace-nowrap border-b dark:border-gray-600">기간</th>
              <th className="p-4 w-24 text-right whitespace-nowrap border-b dark:border-gray-600">관리</th>
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
                    <button onClick={() => handleToggleDone(todo)} className="transition-transform hover:scale-110">
                      {todo.done ? <CheckCircle className="text-green-500"/> : <Circle className="text-gray-300 hover:text-indigo-400"/>}
                    </button>
                  </td>
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
                  <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap align-top pt-4">
                    <div className="flex flex-col gap-0.5">
                      <span className={todo.startDate !== todo.dueDate ? 'text-indigo-600 dark:text-indigo-400' : ''}>{todo.startDate || todo.dueDate}</span>
                      {todo.startDate !== todo.dueDate && <span className="text-xs text-red-500">~ {todo.dueDate}</span>}
                    </div>
                  </td>
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
                  {activeTab === 'date' ? "이 날짜에 등록된 업무가 없습니다." : "해당하는 업무가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && <TodoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} todo={targetTodo} onSave={handleSave} />}
    </div>
  );
}
