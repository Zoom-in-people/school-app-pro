import React, { useRef } from 'react';
import { GripVertical } from 'lucide-react';

export default function DashboardWidget({ id, index, moveWidget, children }) {
  const ref = useRef(null);
  
  const handleDragStart = (e) => { 
    e.dataTransfer.setData('text/plain', index); 
    e.dataTransfer.effectAllowed = 'move';
    if (ref.current) {
      e.dataTransfer.setDragImage(ref.current, 0, 0);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDrop = (e) => { 
    e.preventDefault(); 
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain')); 
    if (dragIndex !== index && !isNaN(dragIndex)) { 
      moveWidget(dragIndex, index); 
    } 
  };
  
  return (
    <div ref={ref} onDragOver={handleDragOver} onDrop={handleDrop} className="h-full transition-transform duration-200 hover:scale-[1.01]">
      <div className="relative group h-full">
        <div draggable onDragStart={handleDragStart} className="absolute top-2 right-2 text-gray-300 opacity-0 group-hover:opacity-100 transition z-10 cursor-move p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <GripVertical size={16}/>
        </div>
        {children}
      </div>
    </div>
  );
}