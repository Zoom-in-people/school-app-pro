import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_WIDGETS } from '../constants/data';

export const useAppStore = create(
  persist(
    (set) => ({
      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view, isSidebarOpen: false }),

      // 🔥 사이드바 토글 상태 (기본적으로 열림)
      isSidebarOpen: true,
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

      selectHandbook: (handbook) => set({
        currentHandbook: handbook,
        lastHandbookId: handbook.id,
        activeView: 'dashboard',
        isSidebarOpen: false
      }),

      apiKey: '',
      setApiKey: (apiKey) => set({ apiKey }),

      hideApiPrompt: false,
      setHideApiPrompt: (hideApiPrompt) => set({ hideApiPrompt }),

      theme: 'light',
      setTheme: (theme) => set({ theme }),

      // 🔥 폰트 사이즈 기본값을 숫자로 변경
      fontSize: 16,
      setFontSize: (fontSize) => set({ fontSize }),

      widgets: INITIAL_WIDGETS,
      setWidgets: (widgets) => set({ widgets }),

      lastHandbookId: null,
      setLastHandbookId: (lastHandbookId) => set({ lastHandbookId }),
    }),
    {
      name: 'school-app-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        hideApiPrompt: state.hideApiPrompt,
        theme: state.theme,
        fontSize: state.fontSize,
        widgets: state.widgets,
        lastHandbookId: state.lastHandbookId,
      }),
    }
  )
);