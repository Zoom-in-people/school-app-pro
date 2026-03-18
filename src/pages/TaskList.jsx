import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react';
import TodoModal from '../components/modals/TodoModal';

export default function TaskList({ todos, onAddTodo, onUpdateTodo, onDeleteTodo }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetTodo, setTargetTodo] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  const handleSave = (todo) => {
    if (todo.id) {
      const { id, ...fields } = todo;
      onUpdateTodo(id, fields);
    } else {
      onAddTodo({ ...todo, done: false });
    }
    setModalOpen(false);
  };

  const filteredTodos = todos.filter(t => activeTab === 'completed' ? t.done : !t.done);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">업무 리스트</h2>
        <button onClick={() => { setTargetTodo(null); setModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition">업무 등록</button>
      </div>

      <div className="flex border-b dark:border-gray-700">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-bold transition ${activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
          미완료 업무 ({todos.filter(t => !t.done).length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={`px-6 py-3 font-bold transition ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>
          완료된 업무 ({todos.filter(t => t.done).length})
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          {/* 🔥 3, 4번 요청: 헤더 가로 고정 유지 */}
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
            <tr>
              <th className="p-4 w-16 text-center whitespace-nowrap">상태</th>
              <th className="p-4 whitespace-nowrap">업무 내용</th>
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

              return (
                <tr key={todo.id} className={`border-b dark:border-gray-700 transition-colors ${bgClass}`}>
                  <td className="p-4 text-center">
                    <button onClick={() => onUpdateTodo(todo.id, { done: !todo.done })} className="transition-transform hover:scale-110 mt-1">
                      {todo.done ? <CheckCircle className="text-green-500"/> : <Circle className="text-gray-300 hover:text-indigo-400"/>}
                    </button>
                  </td>
                  {/* 🔥 4번 요청: 글자 넘침 방지 및 한 줄 유지 처리 */}
                  <td className={`p-4 font-bold ${todo.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'} truncate max-w-[200px] md:max-w-xs`} title={todo.title}>
                    {todo.title}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {todo.category && (
                      <span className="px-2 py-1 bg-white/60 dark:bg-gray-700 rounded-md text-xs font-bold text-gray-600 dark:text-gray-300 shadow-sm border border-gray-100 dark:border-gray-600">
                        {todo.category}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">{todo.dueDate}</td>
                  <td className="p-4 text-right whitespace-nowrap">
                    <button onClick={() => { setTargetTodo(todo); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 bg-white/50 dark:bg-transparent rounded-lg transition"><Edit2 size={16}/></button>
                    <button onClick={() => onDeleteTodo(todo.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white/50 dark:bg-transparent rounded-lg transition ml-1"><Trash2 size={16}/></button>
                  </td>
                </tr>
              );
            })}
            {filteredTodos.length === 0 && (
              <tr>
                <td colSpan="5" className="p-10 text-center text-gray-400">
                  해당하는 업무가 없습니다.
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