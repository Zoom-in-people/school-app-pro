import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Users, AlertTriangle, BookOpen, Edit3, ClipboardList, CheckCircle, Upload, RotateCcw, X, Grip, MessageSquare, Layout } from 'lucide-react';
import LunchWidget from '../components/widgets/LunchWidget';
import MemoLogModal from '../components/modals/MemoLogModal';

// 라이브러리 Import
import * as RGL from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ReactGridLayout = RGL.default || RGL;
const Responsive = ReactGridLayout.Responsive || RGL.Responsive;
const WidthProvider = ReactGridLayout.WidthProvider || RGL.WidthProvider;
const ResponsiveGridLayout = WidthProvider ? WidthProvider(Responsive) : Responsive;

export default function Dashboard({ widgets, students, todos, setActiveView, schoolInfo, isHomeroom, attendanceLog, onUpdateAttendance, onUpdateStudent, lessonGroups, onUpdateLessonGroup, currentHandbook, onUpdateHandbook, moveWidget, resetLayout, addWidget, deleteWidget, onLayoutChange }) {
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [attPopup, setAttPopup] = useState({ isOpen: false, studentId: null, note: "" });
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef(null);

  // 날짜 관련
  const getTodayDateString = () => { 
    const d = new Date(); 
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; 
  };
  const todayStr = getTodayDateString();

  // -------------------------------------------------------------------------
  // 🔥 [핵심] 배치 강제 설정 (저장된 좌표 무시하고 여기서 정의한 대로만 그립니다)
  // -------------------------------------------------------------------------
  const fixedLayouts = useMemo(() => {
    // 1. PC용 강제 배치 (12칸 그리드)
    const desktopLayout = widgets.map(w => {
      let pos = { x: 0, y: Infinity, w: 3, h: 4 }; // 기본값

      // 선생님이 지정하신 순서대로 좌표 하드코딩
      switch (w.type) {
        case 'lunch':    pos = { x: 0, y: 0, w: 3, h: 4 }; break; // 1열 1번
        case 'deadline': pos = { x: 3, y: 0, w: 3, h: 4 }; break; // 1열 2번
        case 'lesson':   pos = { x: 6, y: 0, w: 3, h: 4 }; break; // 1열 3번
        case 'student':  pos = { x: 9, y: 0, w: 3, h: 4 }; break; // 1열 4번
        case 'progress': pos = { x: 0, y: 4, w: 12, h: 5 }; break; // 2열 전체
        default:         pos = { x: 0, y: 10, w: 3, h: 4 }; break; // 기타
      }
      return { i: w.id, ...pos, minW: 2, minH: 2 };
    });

    // 2. 모바일용 강제 배치 (1칸 그리드 - 세로 일렬)
    let yStack = 0;
    const mobileLayout = widgets.map(w => {
      const height = w.type === 'progress' ? 5 : 4;
      const item = { i: w.id, x: 0, y: yStack, w: 1, h: height };
      yStack += height;
      return item;
    });

    return {
      lg: desktopLayout,
      md: desktopLayout,
      sm: desktopLayout, // 태블릿도 PC 배치 유지
      xs: mobileLayout,  // 모바일
      xxs: mobileLayout  // 초소형 모바일
    };
  }, [widgets]);

  // -------------------------------------------------------------------------
  // 기능 로직 (출결, 메모, 업로드 등)
  // -------------------------------------------------------------------------
  const openAttPopup = (studentId) => {
    const existing = attendanceLog?.find(l => l.studentId === studentId && l.date === todayStr);
    setAttPopup({ isOpen: true, studentId, note: existing ? (existing.note || "") : "" });
  };

  const saveAttendance = (type) => {
    if (!attPopup.studentId) return;
    const existing = attendanceLog?.find(l => l.studentId === attPopup.studentId && l.date === todayStr);
    const { note } = attPopup;
    if (type === 'reset') {
      if (existing) onUpdateAttendance(existing.id, null); 
    } else {
      const data = { studentId: attPopup.studentId, date: todayStr, type, note };
      if (existing) onUpdateAttendance(existing.id, { ...existing, type, note });
      else onUpdateAttendance(null, data);
    }
    setAttPopup({ isOpen: false, studentId: null, note: "" });
  };

  const handleMemoClick = (student) => { setTargetStudent(student); setMemoModalOpen(true); };
  const handleMemoSave = (studentId, updatedFields) => { onUpdateStudent(studentId, updatedFields); setTargetStudent(prev => ({...prev, ...updatedFields})); };

  const handleTimetableUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { onUpdateHandbook(currentHandbook.id, { timetableImage: reader.result }); };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleProgress = (groupId, classId, itemName) => {
    const group = lessonGroups.find(g => g.id === groupId);
    if (!group) return;
    const key = `${classId}_${itemName}`;
    const newStatus = { ...group.status, [key]: group.status[key] ? null : todayStr };
    onUpdateLessonGroup(groupId, { status: newStatus });
  };

  // -------------------------------------------------------------------------
  // 위젯 렌더링
  // -------------------------------------------------------------------------
  const renderWidgetContent = (widget) => {
    if (widget.type === 'spacer') {
      return <div className={`w-full h-full rounded-xl flex items-center justify-center transition-all ${isEditMode ? 'border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400' : 'opacity-0'}`}>{isEditMode && <span className="text-xs font-bold">빈 공간</span>}</div>;
    }
    switch (widget.type) {
      case 'lunch': return <LunchWidget schoolInfo={schoolInfo || {}} />;
      case 'deadline': return (<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 h-full overflow-hidden flex flex-col"><div className="flex justify-between items-center mb-4"><h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> 업무 체크</h4><button onClick={() => setActiveView('tasks')} className="text-xs text-gray-400 hover:text-indigo-500">전체보기</button></div><div className="space-y-3 overflow-y-auto flex-1">{todos.slice(0, 5).map(todo => (<div key={todo.id} className={`flex items-start gap-3 p-2 rounded-lg transition ${todo.done ? 'opacity-50' : ''}`}><input type="checkbox" checked={todo.done} readOnly className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"/><div className="flex-1"><p className={`text-sm font-medium ${todo.done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{todo.title}</p><span className="text-xs text-red-500 font-medium">{todo.done ? '완료' : 'D-Day'}</span></div></div>))}</div></div>);
      case 'lesson': return (<div className="bg-indigo-600 rounded-xl shadow-lg p-5 text-white h-full flex flex-col overflow-hidden relative group"><h4 className="font-bold mb-2 flex items-center justify-between z-10">오늘의 수업</h4><div className="flex-1 flex items-center justify-center bg-indigo-500/50 rounded-lg overflow-hidden relative">{currentHandbook?.timetableImage ? (<img src={currentHandbook.timetableImage} alt="TimeTable" className="w-full h-full object-cover"/>) : (<div className="text-center text-indigo-200 text-sm p-4"><p>등록된 시간표가 없습니다.</p><p className="text-xs mt-1">이미지를 클릭하여 업로드</p></div>)}<div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer" onClick={() => fileInputRef.current.click()}><Upload className="text-white"/></div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleTimetableUpload}/></div></div>);
      case 'student': return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><Users className="text-green-500" /> 오늘 출결 ({todayStr})</h3><button onClick={() => setActiveView('students_homeroom')} className="text-xs text-indigo-600 hover:underline">관리 &gt;</button></div>
          <div className="p-2 flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 sticky top-0"><tr><th className="px-3 py-2">이름</th><th className="px-3 py-2 text-center">상태</th><th className="px-3 py-2 text-right">메모</th></tr></thead>
              <tbody>
                {students.sort((a,b)=>Number(a.number)-Number(b.number)).map((student) => {
                  const log = attendanceLog?.find(l => l.studentId === student.id && l.date === todayStr);
                  let statusText = "-"; let statusClass = "bg-gray-100 text-gray-500 hover:bg-gray-200"; let hasNote = false;
                  if (log) {
                    hasNote = !!log.note;
                    if (log.type.includes('결')) { statusText = "병결"; statusClass = "bg-red-100 text-red-700 border border-red-200"; }
                    else if (log.type.includes('지')) { statusText = "지각"; statusClass = "bg-yellow-100 text-yellow-700 border border-yellow-200"; }
                    else if (log.type.includes('조')) { statusText = "조퇴"; statusClass = "bg-blue-100 text-blue-700 border border-blue-200"; }
                    else { statusText = log.type; statusClass = "bg-purple-100 text-purple-700"; }
                  }
                  return (
                    <tr key={student.id} className="border-b border-gray-50 dark:border-gray-700/50">
                      <td className="px-3 py-3 font-bold dark:text-gray-200">{student.number}. {student.name}</td>
                      <td className="px-3 py-3 text-center"><button onClick={() => openAttPopup(student.id)} className={`px-2 py-1 rounded text-xs font-bold w-14 ${statusClass} relative`}>{statusText}{hasNote && <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></div>}</button></td>
                      <td className="px-3 py-3 text-right"><button onClick={() => handleMemoClick(student)} className="p-1 text-gray-400 hover:text-indigo-500"><ClipboardList size={16}/></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
      case 'progress': return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><BookOpen className="text-purple-500" /> 수업 진도</h3><button onClick={() => setActiveView('lessons')} className="text-xs text-indigo-600 hover:underline">관리 &gt;</button></div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {lessonGroups?.map(group => (
              <div key={group.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                <h4 className="font-bold text-sm mb-2 text-indigo-700 dark:text-indigo-300">{group.name}</h4>
                {group.classes.map(cls => (
                  <div key={cls.id} className="flex items-start gap-2 py-2 border-b border-dotted border-gray-300 dark:border-gray-600 last:border-0">
                    <span className="dark:text-gray-300 w-24 shrink-0 font-bold text-xs mt-1.5">{cls.name}</span>
                    <div className="flex-1 flex flex-wrap gap-1">{group.progressItems.slice(0, 20).map((item, idx) => <button key={idx} onClick={() => handleToggleProgress(group.id, cls.id, item)} className={`px-2 py-1 rounded text-xs border ${group.status[`${cls.id}_${item}`] ? 'bg-green-500 text-white' : 'bg-white text-gray-500'}`}>{item}</button>)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
      default: return null;
    }
  };

  const rglStyles = `
    .react-grid-layout { position: relative; transition: height 200ms ease; }
    .react-grid-item { transition: all 200ms ease; transition-property: left, top; }
    .react-grid-item.cssTransforms { transition-property: transform; }
    .react-grid-item.resizing { z-index: 100; box-shadow: 0 0 10px rgba(0,0,0,0.2); }
    .react-grid-item.react-grid-placeholder { background: rgba(79, 70, 229, 0.1) !important; opacity: 0.5; border-radius: 12px; border: 2px dashed #6366f1; }
    .react-resizable-handle { position: absolute; width: 20px; height: 20px; bottom: 0; right: 0; cursor: se-resize; }
  `;

  return (
    <div className="relative pb-20 w-full">
      <style>{rglStyles}</style>

      <div className="flex justify-end mb-4 gap-2">
        {/* 🔥 강제 복구 버튼 */}
        <button onClick={resetLayout} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-sm font-bold"><RotateCcw size={12}/> 배치 초기화</button>
        <button onClick={() => setIsEditMode(!isEditMode)} className={`text-xs flex items-center gap-1 px-3 py-2 rounded-lg font-bold shadow-sm transition ${isEditMode ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-indigo-600'}`}>
          {isEditMode ? <CheckCircle size={14}/> : <Edit3 size={14}/>} {isEditMode ? '편집 완료' : '화면 편집'}
        </button>
      </div>

      <ResponsiveGridLayout
        className="layout"
        // 🔥 [핵심] 저장된 좌표 무시하고 여기서 계산한 강제 좌표 사용
        layouts={fixedLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        // 🔥 PC 12열, 모바일 1열
        cols={{ lg: 12, md: 12, sm: 12, xs: 1, xxs: 1 }} 
        rowHeight={100} 
        
        compactType="vertical"
        preventCollision={false}
        
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
        
        // 🔥 레이아웃 변경 시 저장을 막지는 않지만, 어차피 위에서 fixedLayouts를 쓰므로 렌더링엔 영향 없음
        onLayoutChange={(layout) => onLayoutChange(layout)}
        margin={[16, 16]}
      >
        {widgets.map((widget) => {
          if (!isHomeroom && widget.type === 'student') return <div key={widget.id} className="hidden"></div>;
          
          return (
            <div key={widget.id} className="bg-transparent">
              <div className="h-full relative group">
                {isEditMode && (
                  <>
                    <div className="drag-handle absolute top-2 right-2 z-50 p-1 bg-gray-100 dark:bg-gray-700 rounded cursor-move text-gray-400 hover:text-indigo-600 shadow-sm border border-gray-200 dark:border-gray-600"><Grip size={16}/></div>
                    {widget.type === 'spacer' && <button onClick={() => deleteWidget(widget.id)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-md z-50 hover:bg-red-600"><X size={14}/></button>}
                  </>
                )}
                {renderWidgetContent(widget)}
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {memoModalOpen && targetStudent && <MemoLogModal isOpen={memoModalOpen} onClose={() => setMemoModalOpen(false)} student={targetStudent} onSave={handleMemoSave} />}
      {attPopup.isOpen && (
        <div className="fixed inset-0 bg-black/20 z-[100] flex items-center justify-center" onClick={() => setAttPopup({isOpen: false, studentId: null, note: ""})}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl w-72" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3"><h4 className="font-bold dark:text-white">출결 / 메모 입력</h4><button onClick={() => setAttPopup({isOpen: false, studentId: null, note: ""})}><X size={16}/></button></div>
            <div className="mb-3"><div className="flex items-center gap-1 mb-1 text-xs font-bold text-gray-500 dark:text-gray-400"><MessageSquare size={12}/> 사유 (선택)</div><input type="text" value={attPopup.note} onChange={(e) => setAttPopup({...attPopup, note: e.target.value})} placeholder="예: 독감, 체험학습" className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" /></div>
            <div className="space-y-3"><button onClick={() => saveAttendance('reset')} className="w-full p-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold">출석 (초기화)</button><div className="grid grid-cols-3 gap-2 text-xs"><div className="text-center font-bold text-red-500 col-span-3 pb-1 border-b">결석</div><button onClick={() => saveAttendance('병결')} className="p-2 bg-red-50 hover:bg-red-100 text-red-700 rounded">병결</button><button onClick={() => saveAttendance('미결')} className="p-2 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인결')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button><div className="text-center font-bold text-yellow-500 col-span-3 pb-1 border-b mt-2">지각</div><button onClick={() => saveAttendance('병지')} className="p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded">병지</button><button onClick={() => saveAttendance('미지')} className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인지')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button><div className="text-center font-bold text-blue-500 col-span-3 pb-1 border-b mt-2">조퇴</div><button onClick={() => saveAttendance('병조')} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded">병조</button><button onClick={() => saveAttendance('미조')} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded">미인정</button><button onClick={() => saveAttendance('인조')} className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded">인정</button><div className="text-center font-bold text-purple-500 col-span-3 pb-1 border-b mt-2">기타</div><button onClick={() => saveAttendance('기타')} className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded col-span-3">기타 사유</button></div></div>
          </div>
        </div>
      )}
    </div>
  );
}