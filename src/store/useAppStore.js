import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { INITIAL_WIDGETS } from '../constants/data';

export const useAppStore = create(
  persist(
    (set) => ({
      activeView: 'dashboard',
      setActiveView: (view) => set({ activeView: view }),

      isSidebarOpen: true,
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

      isSettingsOpen: false,
      setIsSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

      isAddHandbookOpen: false,
      setIsAddHandbookOpen: (isOpen) => set({ isAddHandbookOpen: isOpen }),

      isHandbookSettingsOpen: false,
      setIsHandbookSettingsOpen: (isOpen) => set({ isHandbookSettingsOpen: isOpen }),

      isSetupWizardOpen: false,
      setIsSetupWizardOpen: (isOpen) => set({ isSetupWizardOpen: isOpen }),

      // 🔥 통합 설정 팝업을 위한 상태 추가
      isUnifiedSettingsOpen: false,
      setIsUnifiedSettingsOpen: (isOpen) => set({ isUnifiedSettingsOpen: isOpen }),

      currentHandbook: null,
      setCurrentHandbook: (handbook) => set({ currentHandbook: handbook }),

      selectHandbook: (handbook) => set({
        currentHandbook: handbook,
        lastHandbookId: handbook.id,
        activeView: 'dashboard'
      }),

      apiKey: '',
      setApiKey: (apiKey) => set({ apiKey }),

      hideApiPrompt: false,
      setHideApiPrompt: (hideApiPrompt) => set({ hideApiPrompt }),

      theme: 'light',
      setTheme: (theme) => set({ theme }),

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