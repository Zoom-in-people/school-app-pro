import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle, ListFilter } from 'lucide-react';
import TodoModal from '../components/modals/TodoModal';

export default function TaskList({ todos, onAddTodo, onUpdateTodo, onDeleteTodo }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetTodo, setTargetTodo] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' 또는 'completed'

  // 🔥 3번 요청: 기존에 입력된 모든 분류(category) 추출하여 중복 제거 (자동완성용)
  const existingCategories = Array.from(new Set(todos.map(t => t.category).filter(Boolean)));

  const handleSave = (todo) => {
    if (todo.id) {
      const { id, ...fields } = todo;
      onUpdateTodo(id, fields);
    } else {
      onAddTodo({ ...todo, done: false });
    }
    setModalOpen(false);
  };

  // 탭 필터링 로직
  const filteredTodos = todos.filter(t => activeTab === 'completed' ? t.done : !t.done);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">업무 리스트</h2>
        <button onClick={() => { setTargetTodo(null); setModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">업무 등록</button>
      </div>

      {/* 🔥 2번 요청: 탭 메뉴 구성 */}
      <div className="flex border-b dark:border-gray-700">
        <button onClick={() => setActiveTab('pending')} className={`px-6 py-3 font-bold transition ${activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}>
          미완료 업무 ({todos.filter(t => !t.done).length})
        </button>
        <button onClick={() => setActiveTab('completed')} className={`px-6 py-3 font-bold transition ${activeTab === 'completed' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-400'}`}>
          완료된 업무 ({todos.filter(t => t.done).length})
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
            <tr>
              <th className="p-4 w-12">상태</th>
              <th className="p-4">업무 내용</th>
              <th className="p-4">분류</th>
              <th className="p-4">기한</th>
              <th className="p-4 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredTodos.map(todo => (
              <tr key={todo.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="p-4">
                  <button onClick={() => onUpdateTodo(todo.id, { done: !todo.done })}>
                    {todo.done ? <CheckCircle className="text-green-500"/> : <Circle className="text-gray-300"/>}
                  </button>
                </td>
                <td className={`p-4 font-medium ${todo.done ? 'line-through text-gray-400' : ''}`}>{todo.title}</td>
                <td className="p-4"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-xs">{todo.category}</span></td>
                <td className="p-4 text-sm">{todo.dueDate}</td>
                <td className="p-4 text-right">
                  <button onClick={() => { setTargetTodo(todo); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                  <button onClick={() => onDeleteTodo(todo.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <TodoModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          onSave={handleSave} 
          todo={targetTodo}
          // 🔥 3번 요청: 드롭다운 자동완성용 데이터 전달
          categories={existingCategories} 
        />
      )}
    </div>
  );
}