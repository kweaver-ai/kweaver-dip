import { useEffect, useMemo } from 'react'
import storeFavicon from '@/assets/favicons/ai-store.png'
import studioFavicon from '@/assets/favicons/dip-studio.png'
import homeFavicon from '@/assets/favicons/home.png'
import type { SiderType } from '@/routes/types'
import { getRouteByPath } from '@/routes/utils'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import { themeColors } from '@/styles/themeColors'
import { hexToRgb } from '@/utils/colorUtils'

/**
 * 处理与 OEM 品牌相关的全局效果：
 * - 主题色（CSS 变量）
 * - favicon
 * 返回当前 primaryColor 供上层（如 App）配置 antd 主题。
 */
export const useOEMBranding = () => {
  const { getOEMBasicConfig } = useOEMConfigStore()
  const oemBasicConfig = getOEMBasicConfig()

  // 从 OEM 配置中获取主题色，如果没有则使用默认值
  const primaryColor = useMemo(() => {
    return oemBasicConfig?.theme || themeColors.primary
  }, [oemBasicConfig?.theme])

  // 动态设置 CSS 变量
  useEffect(() => {
    const root = document.documentElement
    // 1. 同步主色
    root.style.setProperty('--dip-primary-color', primaryColor)
    const rgb = hexToRgb(primaryColor)
    root.style.setProperty('--dip-primary-color-rgb', rgb)
    root.style.setProperty('--dip-primary-color-rgb-space', rgb.replace(/,/g, ' '))

    // 2. 同步状态色和文字色
    root.style.setProperty('--dip-success-color', themeColors.success)
    root.style.setProperty('--dip-warning-color', themeColors.warning)
    root.style.setProperty('--dip-error-color', themeColors.error)
    root.style.setProperty('--dip-info-color', themeColors.info)
    root.style.setProperty('--dip-text-color-85', themeColors.text)
    root.style.setProperty('--dip-link-color', themeColors.link)
  }, [primaryColor])

  // 根据 OEM 配置动态设置 favicon
  useEffect(() => {
    const favicon = oemBasicConfig?.['favicon.ico']
    if (!favicon) return

    // 处理后端返回的 favicon：可能是完整 dataURL，也可能是纯 base64
    const href = favicon.startsWith('data:') ? favicon : `data:image/x-icon;base64,${favicon}`

    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = href
  }, [oemBasicConfig?.['favicon.ico']])

  // // 根据当前路由所属侧边栏分类，设置 favicon（使用 public 目录下的静态资源）
  // useEffect(() => {
  //   const getSiderTypeByLocation = (): SiderType => {
  //     try {
  //       const route = getRouteByPath(window.location.pathname)
  //       const layoutSiderType = route?.handle?.layout?.siderType
  //       if (layoutSiderType) {
  //         return layoutSiderType
  //       }
  //     } catch {
  //       // 忽略解析错误，走兜底逻辑
  //     }
  //     return 'home'
  //   }

  //   const getFaviconPathBySiderType = (siderType: SiderType): string => {
  //     // 与侧边栏分类对应的 favicon 静态资源（通过打包资产 URL 引用，避免 BASE_PATH / public 路径差异问题）
  //     const map: Record<SiderType, string> = {
  //       home: homeFavicon,
  //       store: storeFavicon,
  //       studio: studioFavicon,
  //     }
  //     // 直接使用打包后资源 URL，依赖浏览器缓存，减少图标闪烁
  //     return map[siderType] ?? map.home
  //   }

  //   const updateFavicon = () => {
  //     const siderType = getSiderTypeByLocation()
  //     const href = getFaviconPathBySiderType(siderType)

  //     let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  //     if (!link) {
  //       link = document.createElement('link')
  //       link.rel = 'icon'
  //       document.head.appendChild(link)
  //     }
  //     // 始终更新一次 href，避免由于绝对/相对路径差异导致比较失败
  //     link.href = href
  //   }

  //   // 初次加载时设置一次
  //   updateFavicon()

  //   // 监听浏览器前进/后退
  //   const handleLocationChange = () => {
  //     updateFavicon()
  //   }

  //   // 拦截 history.pushState / replaceState，处理 SPA 内部路由变更
  //   const originalPushState = history.pushState
  //   const originalReplaceState = history.replaceState

  //   history.pushState = function (...args) {
  //     // eslint-disable-next-line prefer-rest-params
  //     const result = originalPushState.apply(this, args as any)
  //     handleLocationChange()
  //     return result
  //   }

  //   history.replaceState = function (...args) {
  //     // eslint-disable-next-line prefer-rest-params
  //     const result = originalReplaceState.apply(this, args as any)
  //     handleLocationChange()
  //     return result
  //   }

  //   window.addEventListener('popstate', handleLocationChange)

  //   return () => {
  //     history.pushState = originalPushState
  //     history.replaceState = originalReplaceState
  //     window.removeEventListener('popstate', handleLocationChange)
  //   }
  // }, [])

  return { primaryColor }
}
