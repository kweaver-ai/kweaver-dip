import { useEffect } from 'react'
import bgImage from '../assets/images/gradient-container-bg.png'
import { useOEMConfigStore } from '../stores/oemConfigStore'
import { initQiankun } from '../utils/qiankun'
import { useLanguage } from './useLanguage'

/**
 * 应用初始化 Hook
 * 封装应用启动时的初始化逻辑：
 * - 设置页面标题
 * - 预加载关键背景图片
 * - 初始化语言配置
 * - 初始化 OEM 配置
 * - 初始化 qiankun
 * - 获取钉住的微应用列表
 */
export const useAppInit = () => {
  const { initLanguage } = useLanguage()
  const { initialize: initOEMConfig } = useOEMConfigStore()
  const productTitle = useOEMConfigStore((state) => {
    const configs = state.oemResourceConfig
    const keys = Object.keys(configs)
    if (keys.length === 0) {
      return 'DIP'
    }
    const firstConfig = configs[keys[0]]
    return firstConfig?.product || 'DIP'
  })

  useEffect(() => {
    const TITLE = productTitle || 'DIP'
    document.title = TITLE

    // 预加载背景图片，提升加载速度
    const preloadImage = () => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = bgImage
      document.head.appendChild(link)

      // 同时使用 Image 对象预加载，确保图片缓存
      const img = new Image()
      img.src = bgImage
    }
    preloadImage()

    initLanguage()
    initOEMConfig()
    initQiankun()

    // 拦截 document.title 的设置，确保标题始终保持为 'DIP'
    // 这样可以防止在登录重定向或微应用加载期间标题被修改
    try {
      // 尝试获取原始的 title 描述符
      const originalTitleDescriptor =
        Object.getOwnPropertyDescriptor(document, 'title') ||
        Object.getOwnPropertyDescriptor(Document.prototype, 'title')

      if (originalTitleDescriptor?.set) {
        // 保存原始的 getter 和 setter
        const originalGetter = originalTitleDescriptor.get
        const originalSetter = originalTitleDescriptor.set

        // 重写 title 的 setter，拦截所有设置操作
        Object.defineProperty(document, 'title', {
          get: originalGetter,
          set: () => {
            // 忽略所有设置操作，始终保持为 'DIP'
            if (originalSetter) {
              originalSetter.call(document, TITLE)
            } else {
              const titleElement = document.querySelector('title')
              if (titleElement) {
                titleElement.textContent = TITLE
              }
            }
          },
          configurable: true,
        })
      }
    } catch {
      // 如果拦截失败，静默处理
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
