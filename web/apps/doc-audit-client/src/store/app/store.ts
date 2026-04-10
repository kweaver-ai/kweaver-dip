import { create } from 'zustand';
import type { MicroWidgetProps, AppContext } from '@/types';

export interface AppState {
  context: AppContext | null;
  microWidgetProps: MicroWidgetProps | null;
  lang: string;
  arbitrailyAuditLog: Record<string, unknown>;
  popupContainer: HTMLElement | null;

  setContext: (context: AppContext) => void;
  setMicroWidgetProps: (props: MicroWidgetProps) => void;
  setLang: (lang: string) => void;
  setArbitrailyAuditLog: (log: Record<string, unknown>) => void;
  setPopupContainer: (popupContainer: HTMLElement | null) => void;
}

export const useAppStore = create<AppState>(set => ({
  context: null,
  microWidgetProps: null,
  lang: 'zh-cn',
  arbitrailyAuditLog: {},
  popupContainer: null,

  setContext: context => set({ context }),
  setMicroWidgetProps: microWidgetProps => set({ microWidgetProps }),
  setLang: lang => set({ lang }),
  setArbitrailyAuditLog: arbitrailyAuditLog =>
    set(state => ({
      arbitrailyAuditLog: {
        ...state.arbitrailyAuditLog,
        ...arbitrailyAuditLog,
      },
    })),
  setPopupContainer: popupContainer => set({ popupContainer }),
}));
