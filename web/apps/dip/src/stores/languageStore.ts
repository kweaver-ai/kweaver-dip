import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 语言状态 */
interface LanguageState {
  language: string
  setLanguage: (lang: string) => void
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'zh-CN',
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'dip.language',
      partialize: (state) => ({
        language: state.language,
      }),
    },
  ),
)
