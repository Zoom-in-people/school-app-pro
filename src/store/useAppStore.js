import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_WIDGETS } from '../constants/data';

export const useAppStore = create(
  persist(
    (set) => ({
      // 🔥 1. UI 상태 (새로고침 시 날아감)
      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view, isSidebarOpen: false }),

      isSidebarOpen: false,
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      isSettingsOpen: false,
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen, isSidebarOpen: false }),

      isAddHandbookOpen: false,
      setIsAddHandbookOpen: (isOpen) => set({ isAddHandbookOpen: isOpen, isSidebarOpen: false }),

      isHandbookSettingsOpen: false,
      setIsHandbookSettingsOpen: (isOpen) => set({ isHandbookSettingsOpen: isOpen, isSidebarOpen: false }),

      isSetupWizardOpen: false,
      setIsSetupWizardOpen: (isOpen) => set({ isSetupWizardOpen: isOpen }),

      currentHandbook: null,
      setCurrentHandbook: (handbook) => set({ currentHandbook: handbook }),

      // 교무수첩 선택 시 작동할 액션
      selectHandbook: (handbook) => set({
        currentHandbook: handbook,
        lastHandbookId: handbook.id,
        activeView: 'dashboard',
        isSidebarOpen: false
      }),

      // 🔥 2. 환경 설정 (새로고침해도 로컬 스토리지에 영구 저장됨)
      apiKey: '',
      setApiKey: (apiKey) => set({ apiKey }),

      hideApiPrompt: false,
      setHideApiPrompt: (hideApiPrompt) => set({ hideApiPrompt }),

      theme: 'light',
      setTheme: (theme) => set({ theme }),

      fontSize: 'normal',
      setFontSize: (fontSize) => set({ fontSize }),

      widgets: INITIAL_WIDGETS,
      setWidgets: (widgets) => set({ widgets }),

      lastHandbookId: null,
      setLastHandbookId: (lastHandbookId) => set({ lastHandbookId }),
    }),
    {
      name: 'school-app-storage', // 로컬 스토리지 키 이름
      partialize: (state) => ({
        apiKey: state.apiKey,
        hideApiPrompt: state.hideApiPrompt,
        theme: state.theme,
        fontSize: state.fontSize,
        widgets: state.widgets,
        lastHandbookId: state.lastHandbookId,
      }), // 이 값들만 영구 저장
    }
  )
);