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

      widgets: { ...INITIAL_WIDGETS, weather: true, dday: true, memo: true },
      setWidgets: (widgets) => set({ widgets }),

      lastHandbookId: null,
      setLastHandbookId: (lastHandbookId) => set({ lastHandbookId }),

      // 🔥 메모장 및 디데이 데이터 저장소
      memos: [],
      addMemo: (memo) => set((state) => ({ memos: [{ id: Date.now(), color: 'bg-yellow-100', ...memo }, ...state.memos] })),
      updateMemo: (id, text) => set((state) => ({ memos: state.memos.map(m => m.id === id ? { ...m, content: text } : m) })),
      deleteMemo: (id) => set((state) => ({ memos: state.memos.filter(m => m.id !== id) })),

      ddays: [],
      addDday: (dday) => set((state) => ({ ddays: [...state.ddays, { id: Date.now(), ...dday }] })),
      deleteDday: (id) => set((state) => ({ ddays: state.ddays.filter(d => d.id !== id) })),
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
        memos: state.memos,
        ddays: state.ddays,
      }),
    }
  )
);