import { create } from 'zustand'
import {
  getOEMBasicConfigApi,
  getOEMResourceConfigApi,
  type OemBasicConfig,
  type OemResourceConfig,
} from '@/apis'

/** OEM 配置状态 */
interface OEMConfigState {
  /** OEM 资源配置（按语言存储） */
  oemResourceConfig: Record<string, OemResourceConfig>
  /** OEM 基本配置 */
  oemBasicConfig: OemBasicConfig | null
  /** 加载状态 */
  loading: boolean
  /** 错误信息 */
  error: Error | null
  /** 是否已初始化 */
  initialized: boolean
  /** 设置所有语言的 OEM 资源配置 */
  setOEMResourceConfig: (configs: Record<string, OemResourceConfig>) => void
  /** 设置 OEM 基本配置 */
  setOEMBasicConfig: (config: OemBasicConfig) => void
  /** 设置加载状态 */
  setLoading: (loading: boolean) => void
  /** 设置错误信息 */
  setError: (error: Error | null) => void
  /** 根据语言获取 OEM 资源配置 */
  getOEMResourceConfig: (language: string) => OemResourceConfig | null
  /** 获取 OEM 基本配置 */
  getOEMBasicConfig: () => OemBasicConfig | null
  /** 初始化 OEM 配置 */
  initialize: (languages?: string[], product?: string) => Promise<void>
}

export const useOEMConfigStore = create<OEMConfigState>((set, get) => ({
  oemResourceConfig: {},
  oemBasicConfig: null,
  loading: false,
  error: null,
  initialized: false,
  setOEMResourceConfig: (configs) => set({ oemResourceConfig: configs }),
  setOEMBasicConfig: (config) => set({ oemBasicConfig: config }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  getOEMResourceConfig: (language: string) => {
    const { oemResourceConfig } = get()
    // 先尝试精确匹配
    if (oemResourceConfig[language]) {
      return oemResourceConfig[language]
    }
    // 尝试匹配语言前缀
    const langPrefix = language.split('-')[0].toLowerCase()
    if (langPrefix === 'zh') {
      return oemResourceConfig['zh-CN'] || oemResourceConfig['zh-TW'] || null
    }
    if (langPrefix === 'en') {
      return oemResourceConfig['en-US'] || null
    }
    // 默认返回第一个配置，如果都没有则返回 null
    const keys = Object.keys(oemResourceConfig)
    return keys.length > 0 ? oemResourceConfig[keys[0]] : null
  },
  getOEMBasicConfig: () => {
    return get().oemBasicConfig
  },
  initialize: async (languages = ['zh-CN'], product = 'dip') => {
    // 'zh-CN', 'zh-TW', 'en-US'
    const { initialized } = get()
    // 如果已经初始化过，跳过
    if (initialized) {
      return
    }

    set({ loading: true, error: null })

    try {
      // 并行加载所有语言的配置和基本配置
      const [resourceResults, basicConfig] = await Promise.allSettled([
        Promise.all(
          languages.map((lang) =>
            getOEMResourceConfigApi(lang, product).then((config) => ({ lang, config })),
          ),
        ),
        getOEMBasicConfigApi(),
      ])

      const configs: Record<string, OemResourceConfig> = {}

      if (resourceResults.status === 'fulfilled') {
        resourceResults.value.forEach(({ lang, config }) => {
          configs[lang] = config
        })
      }

      set({
        oemResourceConfig: configs,
        oemBasicConfig: basicConfig.status === 'fulfilled' ? basicConfig.value : null,
        loading: false,
        initialized: true,
        error: null,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to initialize OEM config')
      set({
        loading: false,
        error: err,
        initialized: true,
      })
    }
  },
}))
