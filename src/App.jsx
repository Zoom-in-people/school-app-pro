import React, { useEffect } from 'react';
import { Menu, LogIn, Plus } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useAppStore } from './store/useAppStore'; // 🔥 Zustand 스토어 도입
import { useAppData } from './hooks/useAppData';   // 🔥 DB 훅 분리
import { showToast } from './utils/alerts';

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
import MonthlyEvents from './pages/MonthlyEvents';
import MeetingLogs from './pages/MeetingLogs';
import MyTimetable from './pages/MyTimetable';
import ExternalApps from './pages/ExternalApps';
import UpdateHistory from './pages/UpdateHistory';
import HowToUse from './pages/HowToUse'; 
import RealtimeSetup from './pages/RealtimeSetup'; 

export default function App() {
  const { user, loading, login, logout } = useAuth();
  
  // 🔥 한 줄의 코드로 UI 상태와 설정값들을 모두 가져옴
  const store = useAppStore(); 

  useEffect(() => { 
    if (user && !store.apiKey && !store.hideApiPrompt) {
      store.setIsSetupWizardOpen(true);
    }
  }, [user, store.apiKey, store.hideApiPrompt]);

  useEffect(() => {
    const root = document.documentElement;
    if (store.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [store.theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (store.fontSize === 'xsmall') root.style.fontSize = '75%';
    else if (store.fontSize === 'small') root.style.fontSize = '87.5%';
    else if (store.fontSize === 'large') root.style.fontSize = '112.5%';
    else if (store.fontSize === 'xlarge') root.style.fontSize = '125%';
    else root.style.fontSize = '100%';
  }, [store.fontSize]);

  const userId = user ? user.uid : null;

  // 🔥 복잡한 DB 로직을 단 한 줄로 압축!
  const db = useAppData(userId, store.currentHandbook?.id);
  const { data: handbooks, add: addHandbook, update: updateHandbook, remove: removeHandbook } = db.handbooks;

  useEffect(() => {
    if (handbooks.length > 0) {
      if (store.lastHandbookId) {
        const found = handbooks.find(h => h.id === store.lastHandbookId);
        if (found) store.setCurrentHandbook(found);
        else store.setCurrentHandbook(handbooks[0]);
      } else {
        store.setCurrentHandbook(handbooks[0]);
      }
    } else {
      store.setCurrentHandbook(null);
    }
  }, [handbooks, store.lastHandbookId]);

  const handleCreateHandbook = async (data) => {
    try {
      const newId = await addHandbook(data);
      if (newId) {
        store.selectHandbook({ id: newId, ...data });
        store.setIsAddHandbookOpen(false);
      }
    } catch (error) { showToast("교무수첩 생성 실패", 'error'); }
  };

  const handleUpdateHandbook = async (id, data) => {
    await updateHandbook(id, data);
    store.setCurrentHandbook({ ...store.currentHandbook, ...data });
  };

  const handleDeleteHandbook = async (id) => {
    await removeHandbook(id); 
    if (store.currentHandbook && store.currentHandbook.id === id) {
      const remaining = handbooks.filter(h => h.id !== id);
      if (remaining.length > 0) {
        store.setCurrentHandbook(remaining[0]);
        store.setLastHandbookId(remaining[0].id);
      } else {
        store.setCurrentHandbook(null);
        store.setLastHandbookId(null);
      }
    }
    store.setIsHandbookSettingsOpen(false);
  };

  const handleUpdateAttendance = (id, data) => { if (id && !data) db.attendanceLog.remove(id); else if (id && data) db.attendanceLog.update(id, data); else db.attendanceLog.add(data); };
  const handleUpdateEvent = (id, data) => { if (id && !data) db.events.remove(id); else if (id && data) db.events.update(id, data); else db.events.add(data); };

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300 print:h-auto print:bg-white print:text-black">
      {store.isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm no-print" onClick={() => store.setIsSidebarOpen(false)} />}

      <div className={`
        no-print fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${store.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64 md:block
      `}>
        {/* 🔥 Sidebar로 넘기던 수많은 Props가 삭제되었습니다! */}
        <Sidebar user={user} logout={logout} handbooks={handbooks} />
      </div>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative print:overflow-visible print:h-auto print:p-0">
        <header className="md:hidden bg-white dark:bg-gray-800 p-4 flex items-center justify-between border-b dark:border-gray-700 sticky top-0 z-30 no-print">
          <span className="font-bold text-lg">{store.currentHandbook ? store.currentHandbook.title : "교무수첩 Pro"}</span>
          <button onClick={() => store.setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Menu size={24}/></button>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto print:p-0 print:overflow-visible print:h-auto">
          <div className="max-w-7xl mx-auto h-full print:max-w-full">
            {store.activeView === 'update_history' ? <UpdateHistory />
            : store.activeView === 'how_to_use' ? <HowToUse />
            : store.activeView === 'realtime_setup' ? <RealtimeSetup />
            : !store.currentHandbook ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 no-print"><Plus size={48} className="text-indigo-600 mx-auto"/><h2 className="text-2xl font-bold">시작하려면 교무수첩을 만드세요</h2><button onClick={() => store.setIsAddHandbookOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold">새 교무수첩 만들기</button></div>
            ) : (
              <>
                {store.activeView === 'dashboard' && <Dashboard students={db.homeroomStudents.data} todos={db.todos.data} setActiveView={store.setActiveView} isHomeroom={store.currentHandbook.isHomeroom} schoolInfo={store.currentHandbook.schoolInfo || {}} attendanceLog={db.attendanceLog.data} onUpdateAttendance={handleUpdateAttendance} onUpdateStudent={(id, data) => db.homeroomStudents.update(id, data)} lessonGroups={db.lessonGroups.data} onUpdateLessonGroup={db.lessonGroups.update} currentHandbook={store.currentHandbook} onUpdateHandbook={handleUpdateHandbook} myTimetable={db.myTimetable.data} widgets={store.widgets} setWidgets={store.setWidgets} />}
                {store.activeView === 'monthly' && <MonthlyEvents handbook={store.currentHandbook} isHomeroom={store.currentHandbook.isHomeroom} students={db.homeroomStudents.data} attendanceLog={db.attendanceLog.data} onUpdateAttendance={handleUpdateAttendance} events={db.events.data} onUpdateEvent={handleUpdateEvent} />}
                {store.activeView === 'students_homeroom' && <StudentManager key="homeroom-manager" students={db.homeroomStudents.data} onAddStudent={db.homeroomStudents.add} onAddStudents={db.homeroomStudents.addMany} onUpdateStudent={db.homeroomStudents.update} onDeleteStudent={db.homeroomStudents.remove} onUpdateStudentsMany={db.homeroomStudents.updateMany} onSetAllStudents={db.homeroomStudents.setAll} apiKey={store.apiKey} isHomeroomView={true} />}
                {store.activeView === 'students_subject' && <StudentManager key="subject-manager" students={db.subjectStudents.data} onAddStudent={db.subjectStudents.add} onAddStudents={db.subjectStudents.addMany} onUpdateStudent={db.subjectStudents.update} onDeleteStudent={db.subjectStudents.remove} onUpdateStudentsMany={db.subjectStudents.updateMany} onSetAllStudents={db.subjectStudents.setAll} apiKey={store.apiKey} isHomeroomView={false} classPhotos={db.classPhotos.data} onAddClassPhoto={db.classPhotos.add} onUpdateClassPhoto={db.classPhotos.update} onDeleteClassPhoto={db.classPhotos.remove} />}
                {store.activeView === 'lessons' && <LessonManager lessonGroups={db.lessonGroups.data} onAddGroup={db.lessonGroups.add} onUpdateGroup={db.lessonGroups.update} onDeleteGroup={db.lessonGroups.remove} />}
                {store.activeView === 'consultation' && <ConsultationLog students={db.homeroomStudents.data} consultations={db.consultations.data} onAddConsultation={db.consultations.add} onDeleteConsultation={db.consultations.remove} onUpdateConsultation={db.consultations.update} />}
                {store.activeView === 'tasks' && <TaskList todos={db.todos.data} onAddTodo={db.todos.add} onUpdateTodo={db.todos.update} onDeleteTodo={db.todos.remove} />}
                {store.activeView === 'schedule' && <AcademicSchedule apiKey={store.apiKey} scheduleData={db.academicSchedule.data} onUpdateSchedule={db.academicSchedule.update} onAddSchedule={db.academicSchedule.add} onDeleteSchedule={db.academicSchedule.remove} />}
                {store.activeView === 'edu_plan' && <EducationPlan apiKey={store.apiKey} planData={db.educationPlans.data} onSavePlan={db.educationPlans.add} onUpdatePlan={db.educationPlans.update} onDeletePlan={db.educationPlans.remove} />}
                {store.activeView === 'meeting_logs' && <MeetingLogs logs={db.meetingLogs.data} onAddLog={db.meetingLogs.add} onUpdateLog={db.meetingLogs.update} onDeleteLog={db.meetingLogs.remove} />}
                {store.activeView === 'my_timetable' && <MyTimetable timetableData={db.myTimetable.data} onAddTimetable={db.myTimetable.add} onUpdateTimetable={db.myTimetable.update} onDeleteTimetable={db.myTimetable.remove} />}
                {store.activeView === 'apps' && <ExternalApps />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 🔥 모달창들도 Props 대신 Zustand를 바라보게 구조가 단순해짐 */}
      <SettingsModal isOpen={store.isSettingsOpen} onClose={() => store.setIsSettingsOpen(false)} settings={{ apiKey: store.apiKey, theme: store.theme, fontSize: store.fontSize }} setSettings={{ setApiKey: store.setApiKey, setTheme: store.setTheme, setFontSize: store.setFontSize }} onOpenSetupWizard={() => { store.setIsSettingsOpen(false); store.setIsSetupWizardOpen(true); }}/>
      <SetupWizardModal isOpen={store.isSetupWizardOpen} onClose={() => { store.setIsSetupWizardOpen(false); store.setHideApiPrompt(true); }} apiKey={store.apiKey} setApiKey={store.setApiKey} />
      <AddHandbookModal isOpen={store.isAddHandbookOpen} onClose={() => store.setIsAddHandbookOpen(false)} onSave={handleCreateHandbook} />
      <HandbookSettingsModal isOpen={store.isHandbookSettingsOpen} onClose={() => store.setIsHandbookSettingsOpen(false)} handbook={store.currentHandbook} onUpdate={handleUpdateHandbook} onDelete={handleDeleteHandbook} apiKey={store.apiKey} setApiKey={store.setApiKey} />
    </div>
  );
}