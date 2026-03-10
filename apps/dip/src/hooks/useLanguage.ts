import { useRef } from 'react'
import intl from 'react-intl-universal'
import { DEFAULT_LOCALE, getNavigatorLanguage } from '../i18n/config'
import locales from '../i18n/locales'
import { useLanguageStore } from '../stores/languageStore'
// TODO: 后端接口待接入，暂时注释导入
// import { getAppConfigApi, postLanguageApi } from '../apis/config'
import { setMicroAppGlobalState } from '../utils/micro-app/globalState'

interface InitOptions {
  currentLocale: string
  locales: Record<string, any>
  fallbackLocale?: string
}

/**
 * 语言管理 Hook
 * @returns {Function} initLanguage 初始化语言
 * @returns {Function} changeLanguage 切换语言
 */
export const useLanguage = () => {
  const { setLanguage } = useLanguageStore()
  const currentLocaleRef = useRef<string>(DEFAULT_LOCALE)

  /**
   * 初始化国际化配置
   */
  const initI18n = async (locale: string): Promise<void> => {
    const targetLocale = locale || DEFAULT_LOCALE
    currentLocaleRef.current = targetLocale

    const options: InitOptions = {
      currentLocale: targetLocale,
      locales: locales,
      fallbackLocale: DEFAULT_LOCALE,
    }

    try {
      await intl.init(options as any)
    } catch (error) {
      console.error('Failed to init i18n:', error)
    }
  }

  /**
   * 更新国际化配置
   */
  const updateI18n = async (locale: string): Promise<void> => {
    const targetLocale = locale || DEFAULT_LOCALE
    if (targetLocale === currentLocaleRef.current) return
    await initI18n(targetLocale)
  }

  /**
   * 初始化语言
   * 1. 同步用本地可用语言初始化（不阻塞首屏）
   * 2. 异步同步后端语言配置（如果不同则切换）
   */
  const initLanguage = async () => {
    // 1. 使用本地可用语言同步初始化，避免首屏阻塞在接口上
    const persistedLanguage = useLanguageStore.getState().language
    const fallbackLanguage = persistedLanguage || getNavigatorLanguage() || DEFAULT_LOCALE

    await initI18n(fallbackLanguage)
    // 同步到微应用全局状态，通知所有微应用当前语言
    setMicroAppGlobalState(
      {
        language: fallbackLanguage,
      },
      { allowAllFields: true },
    )

    // 2. 异步同步后端语言配置（不阻塞首屏）
    // TODO: 后端接口待接入，暂时注释
    // try {
    //   const language = await getAppConfigApi()
    //   if (language?.language && language.language !== fallbackLanguage) {
    //     const serverLang = language.language
    //     setLanguage(serverLang)
    //     await updateI18n(serverLang)
    //     // 使用后端语言覆盖时，同步到微应用全局状态
    //     setMicroAppGlobalState(
    //       {
    //         language: serverLang,
    //       },
    //       { allowAllFields: true }
    //     )
    //   }
    // } catch (error) {
    //   console.warn('getLanguageService failed, keep fallback language:', error)
    // }
  }

  /**
   * 切换语言：更新 store + 更新 intl + 同步后端
   */
  const updateLanguage = async (lang: string) => {
    try {
      // 1. 同步到后端
      // TODO: 后端接口待接入，暂时注释
      // await postLanguageApi(lang)
      // 2. 更新 store
      setLanguage(lang)
      // 3. 更新 intl
      await updateI18n(lang)
      // 4. 同步到微应用全局状态，让所有微应用收到语言变更
      setMicroAppGlobalState(
        {
          language: lang,
        },
        { allowAllFields: true },
      )
    } catch (error) {
      console.log('Failed to set language config on server:', error)
    }
  }

  return {
    initLanguage,
    updateLanguage,
  }
}
