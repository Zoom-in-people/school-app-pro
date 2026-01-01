import React, { useState, useEffect } from 'react';
import { Menu, LogIn, Plus } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useGoogleDriveDB } from './hooks/useGoogleDriveDB'; 
import { useLocalStorage } from './utils/useLocalStorage';
import { INITIAL_WIDGETS } from './constants/data';
import Sidebar from './components/layout/Sidebar';
import SettingsModal from './components/modals/SettingsModal';
import SetupWizardModal from './components/modals/SetupWizardModal';
import AddHandbookModal from './components/modals/AddHandbookModal';
import HandbookSettingsModal from './components/modals/HandbookSettingsModal';
import Dashboard from './pages/Dashboard';
import StudentManager from './pages/StudentManager';
import ConsultationLog from './pages/ConsultationLog';
import AcademicSchedule from './pages/AcademicSchedule';
import EducationPlan from './pages/EducationPlan';
import TaskList from './pages/TaskList';
import LessonManager from './pages/LessonManager';
import MaterialManager from './pages/MaterialManager';
import MonthlyEvents from './pages/MonthlyEvents';

export default function App() {
  const { user, loading, login, logout } = useAuth();
  
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddHandbookOpen, setIsAddHandbookOpen] = useState(false);
  const [isHandbookSettingsOpen, setIsHandbookSettingsOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  const [apiKey, setApiKey] = useLocalStorage('gemini_api_key', "");
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [fontSize, setFontSize] = useLocalStorage('fontSize', 'normal');
  const [widgets, setWidgets] = useLocalStorage('widgets', INITIAL_WIDGETS);
  const [lastHandbookId, setLastHandbookId] = useLocalStorage('lastHandbookId', null);

  const [currentHandbook, setCurrentHandbook] = useState(null);

  useEffect(() => {
    if (user && !apiKey) {
      setIsSetupWizardOpen(true);
    }
  }, [user, apiKey]);

  useEffect(() => {
    const needsReset = widgets.length === 0 || !widgets[0].hasOwnProperty('x');
    if (needsReset) setWidgets(INITIAL_WIDGETS);
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (fontSize === 'xsmall') root.style.fontSize = '75%';
    else if (fontSize === 'small') root.style.fontSize = '87.5%';
    else if (fontSize === 'large') root.style.fontSize = '112.5%';
    else if (fontSize === 'xlarge') root.style.fontSize = '125%';
    else root.style.fontSize = '100%';
  }, [fontSize]);

  const userId = user ? user.uid : null;

  const { data: handbooks, add: addHandbook, update: updateHandbook, remove: removeHandbook } 
    = useGoogleDriveDB('handbooks', userId);

  useEffect(() => {
    if (handbooks.length > 0) {
      if (lastHandbookId) {
        const found = handbooks.find(h => h.id === lastHandbookId);
        if (found) setCurrentHandbook(found);
        else setCurrentHandbook(handbooks[0]);
      } else {
        setCurrentHandbook(handbooks[0]);
      }
    } else {
      setCurrentHandbook(null);
    }
  }, [handbooks, lastHandbookId]);

  const currentHandbookId = currentHandbook ? currentHandbook.id : null;
  const collectionPrefix = currentHandbookId ? `_${currentHandbookId}` : '';

  // 🔥 [핵심 수정] 데이터 분리 (homeroom vs subject)
  const { 
    data: homeroomStudents, 
    add: addHomeroomStudent, 
    addMany: addManyHomeroomStudents, // 엑셀용
    remove: removeHomeroomStudent, 
    update: updateHomeroomStudent 
  } = useGoogleDriveDB(`students_homeroom${collectionPrefix}`, userId);

  const { 
    data: subjectStudents, 
    add: addSubjectStudent, 
    addMany: addManySubjectStudents, // 엑셀용
    remove: removeSubjectStudent, 
    update: updateSubjectStudent 
  } = useGoogleDriveDB(`students_subject${collectionPrefix}`, userId);
    
  const { data: consultations, add: addConsultation, remove: removeConsultation, update: updateConsultation } 
    = useGoogleDriveDB(`consultations${collectionPrefix}`, userId);
    
  const { data: todos, add: addTodo, remove: removeTodo, update: updateTodo } 
    = useGoogleDriveDB(`todos${collectionPrefix}`, userId);
    
  const { data: attendanceLog, add: addAttendance, remove: removeAttendance, update: updateAttendance } 
    = useGoogleDriveDB(`attendance${collectionPrefix}`, userId);
    
  const { data: events, add: addEvent, remove: removeEvent, update: updateEvent } 
    = useGoogleDriveDB(`events${collectionPrefix}`, userId);
    
  const { data: lessonGroups, add: addLessonGroup, remove: removeLessonGroup, update: updateLessonGroup } 
    = useGoogleDriveDB(`lesson_groups${collectionPrefix}`, userId);

  const handleCreateHandbook = async (data) => {
    try {
      const newId = await addHandbook(data);
      if (newId) {
        const newHandbook = { id: newId, ...data };
        setCurrentHandbook(newHandbook);
        setLastHandbookId(newId);
        setActiveView('dashboard');
        setIsAddHandbookOpen(false);
      }
    } catch (error) { alert("생성 실패"); }
  };

  const handleUpdateHandbook = async (id, data) => {
    await updateHandbook(id, data);
    setCurrentHandbook(prev => ({ ...prev, ...data }));
  };

  const handleDeleteHandbook = async (id) => {
    await removeHandbook(id); 
    if (currentHandbook && currentHandbook.id === id) {
      const remaining = handbooks.filter(h => h.id !== id);
      if (remaining.length > 0) {
        setCurrentHandbook(remaining[0]);
        setLastHandbookId(remaining[0].id);
      } else {
        setCurrentHandbook(null);
        setLastHandbookId(null);
      }
    }
    setIsHandbookSettingsOpen(false);
  };

  const handleSelectHandbook = (handbook) => {
    setCurrentHandbook(handbook);
    setLastHandbookId(handbook.id);
    setActiveView('dashboard');
  };

  const handleUpdateAttendance = (id, data) => { if (id && !data) removeAttendance(id); else if (id && data) updateAttendance(id, data); else addAttendance(data); };
  const handleUpdateEvent = (id, data) => { if (id && !data) removeEvent(id); else if (id && data) updateEvent(id, data); else addEvent(data); };

  const onLayoutChange = (newLayout) => {
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(l => l.i === widget.id);
      if (layoutItem) {
        return { ...widget, x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h };
      }
      return widget;
    });
    setWidgets(updatedWidgets);
  };

  const resetLayout = () => {
    if(window.confirm("배치를 초기화하시겠습니까?")) setWidgets(INITIAL_WIDGETS);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin text-4xl">⏳</div></div>;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-200 dark:border-gray-700">
           <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"><LogIn className="text-white" size={32} /></div>
           <h1 className="text-3xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">교무수첩 Pro</h1>
           <p className="text-gray-500 dark:text-gray-400 mb-8">선생님을 위한 스마트한 업무 파트너</p>
           <button onClick={login} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm font-medium">
             <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5"/> Google 계정으로 시작하기
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block h-full relative border-r border-gray-200 dark:border-gray-700`}>
        <Sidebar activeView={activeView} setActiveView={setActiveView} onOpenSettings={() => setIsSettingsOpen(true)} user={user} logout={logout} handbooks={handbooks} currentHandbook={currentHandbook} onSelectHandbook={handleSelectHandbook} onOpenAddHandbook={() => setIsAddHandbookOpen(true)} onOpenHandbookSettings={() => setIsHandbookSettingsOpen(true)}/>
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="md:hidden bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b dark:border-gray-700"><span className="font-bold">{currentHandbook ? currentHandbook.title : "교무수첩 Pro"}</span><button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu /></button></header>

        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full">
            {!currentHandbook ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6"><Plus size={48} className="text-indigo-600 mx-auto"/><h2 className="text-2xl font-bold">시작하려면 교무수첩을 만드세요</h2><button onClick={() => setIsAddHandbookOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold">새 교무수첩 만들기</button></div>
            ) : (
              <>
                {/* 대시보드는 우리반(homeroom) 데이터를 기본으로 보여줌 */}
                {activeView === 'dashboard' && (
                  <Dashboard 
                    widgets={widgets} 
                    students={homeroomStudents}
                    todos={todos} setActiveView={setActiveView} isHomeroom={currentHandbook.isHomeroom} schoolInfo={currentHandbook.schoolInfo || {}} 
                    attendanceLog={attendanceLog} onUpdateAttendance={handleUpdateAttendance} onUpdateStudent={(id, data) => updateHomeroomStudent(id, data)} lessonGroups={lessonGroups} onUpdateLessonGroup={updateLessonGroup} 
                    currentHandbook={currentHandbook} onUpdateHandbook={handleUpdateHandbook}
                    onLayoutChange={onLayoutChange} resetLayout={resetLayout}
                    addWidget={(newWidget) => setWidgets(prev => [...prev, { ...newWidget, id: Date.now().toString(), x: 0, y: Infinity }])}
                    deleteWidget={(id) => setWidgets(prev => prev.filter(w => w.id !== id))}
                  />
                )}
                {activeView === 'monthly' && <MonthlyEvents handbook={currentHandbook} isHomeroom={currentHandbook.isHomeroom} students={homeroomStudents} attendanceLog={attendanceLog} onUpdateAttendance={handleUpdateAttendance} events={events} onUpdateEvent={handleUpdateEvent} />}
                
                {/* 🔥 [핵심 수정] 학급관리(homeroom) vs 수업관리(subject) 데이터 분리 */}
                {activeView === 'students_homeroom' && (
                  <StudentManager 
                    students={homeroomStudents} 
                    onAddStudent={addHomeroomStudent} 
                    onAddStudents={addManyHomeroomStudents} // 일괄 추가
                    onUpdateStudent={updateHomeroomStudent} 
                    onDeleteStudent={removeHomeroomStudent} 
                    apiKey={apiKey} 
                    isHomeroomView={true} 
                  />
                )}
                
                {activeView === 'students_subject' && (
                  <StudentManager 
                    students={subjectStudents} 
                    onAddStudent={addSubjectStudent} 
                    onAddStudents={addManySubjectStudents} // 일괄 추가
                    onUpdateStudent={updateSubjectStudent} 
                    onDeleteStudent={removeSubjectStudent} 
                    apiKey={apiKey} 
                    isHomeroomView={false} 
                  />
                )}
                
                {activeView === 'lessons' && <LessonManager lessonGroups={lessonGroups} onAddGroup={addLessonGroup} onUpdateGroup={updateLessonGroup} onDeleteGroup={removeLessonGroup} />}
                
                {/* 상담일지는 우리반 데이터 사용 */}
                {activeView === 'consultation' && <ConsultationLog students={homeroomStudents} consultations={consultations} onAddConsultation={addConsultation} onDeleteConsultation={removeConsultation} />}
                
                {activeView === 'tasks' && <TaskList todos={todos} onAddTodo={addTodo} onUpdateTodo={updateTodo} onDeleteTodo={removeTodo} />}
                {activeView === 'schedule' && <AcademicSchedule apiKey={apiKey} />}
                {activeView === 'edu_plan' && <EducationPlan apiKey={apiKey} />}
                {activeView === 'materials' && <MaterialManager handbook={currentHandbook} />}
              </>
            )}
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={{ apiKey, theme, fontSize }} 
        setSettings={{ setApiKey, setTheme, setFontSize }} 
        onOpenSetupWizard={() => {
          setIsSettingsOpen(false);
          setIsSetupWizardOpen(true);
        }}
      />
      
      <SetupWizardModal 
        isOpen={isSetupWizardOpen} 
        onClose={() => setIsSetupWizardOpen(false)} 
        apiKey={apiKey} 
        setApiKey={setApiKey} 
      />
      
      <AddHandbookModal isOpen={isAddHandbookOpen} onClose={() => setIsAddHandbookOpen(false)} onSave={handleCreateHandbook} />
      
      <HandbookSettingsModal 
        isOpen={isHandbookSettingsOpen} 
        onClose={() => setIsHandbookSettingsOpen(false)} 
        handbook={currentHandbook} 
        onUpdate={handleUpdateHandbook}
        onDelete={handleDeleteHandbook} 
      />
    </div>
  );
}