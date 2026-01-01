import React, { useState } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react';
import TodoModal from '../components/modals/TodoModal';

export default function TaskList({ todos, onAddTodo, onUpdateTodo, onDeleteTodo }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [targetTodo, setTargetTodo] = useState(null);
  
  // 기본 분류 (사용자가 추가하면 여기에 포함되진 않지만, Datalist엔 나옴)
  const [categories, setCategories] = useState(["행정", "수업", "상담", "행사"]);

  // 저장 핸들러 (추가/수정 분기)
  const handleSave = (todo) => {
    if (todo.id) {
      // 수정
      const { id, ...fields } = todo;
      onUpdateTodo(id, fields);
    } else {
      // 추가
      onAddTodo({ ...todo, done: false });
    }
    setModalOpen(false);
  };

  // 추가 모드 열기
  const openAdd = () => { 
    setTargetTodo(null); // null로 설정하여 추가 모드임을 명시
    setModalOpen(true); 
  };

  // 수정 모드 열기
  const openEdit = (todo) => {
    setTargetTodo(todo);
    setModalOpen(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[600px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold dark:text-white">✅ 업무 목록</h3>
        <button onClick={openAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm font-bold text-sm">
          <Plus size={18}/> 업무 등록
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-700 uppercase text-gray-700 dark:text-gray-400 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-4 w-16 text-center">완료</th>
              <th className="px-6 py-4">업무명</th>
              <th className="px-6 py-4 w-32">기한</th>
              <th className="px-6 py-4 w-32">분류</th>
              <th className="px-6 py-4 w-24 text-center">중요도</th>
              <th className="px-6 py-4 w-24 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {todos.length > 0 ? todos.map(todo => (
              <tr key={todo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="px-6 py-4 text-center cursor-pointer" onClick={() => onUpdateTodo(todo.id, { done: !todo.done })}>
                  {todo.done ? (
                    <CheckCircle className="text-indigo-500 mx-auto" size={20} />
                  ) : (
                    <Circle className="text-gray-300 dark:text-gray-500 mx-auto" size={20} />
                  )}
                </td>
                <td className={`px-6 py-4 font-bold text-base ${todo.done ? 'line-through text-gray-400' : 'dark:text-white'}`}>
                  {todo.title}
                </td>
                <td className={`px-6 py-4 ${todo.done ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                  {todo.dueDate}
                </td>
                <td className="px-6 py-4">
                   <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded dark:bg-gray-600 dark:text-gray-200">
                     {todo.category}
                   </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    todo.priority === 'high' ? 'bg-red-100 text-red-700' : 
                    todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {todo.priority === 'high' ? '긴급' : todo.priority === 'medium' ? '중요' : '일반'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(todo)} className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                      <Edit2 size={16}/>
                    </button>
                    <button onClick={() => onDeleteTodo(todo.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="text-center py-12 text-gray-400">
                  등록된 업무가 없습니다. '업무 등록' 버튼을 눌러보세요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <TodoModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          initialData={targetTodo} 
          onSave={handleSave} 
          categories={categories} 
          setCategories={setCategories} 
        />
      )}
    </div>
  );
}