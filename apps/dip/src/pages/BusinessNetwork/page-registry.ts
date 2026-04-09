import type { ComponentType, LazyExoticComponent } from 'react'
import type { CurrentMicroAppInfo } from '@/stores/microAppStore'

export interface BusinessComponentPageProps {
  appBasicInfo: CurrentMicroAppInfo | null
  homeRoute: string
  customProps: Record<string, unknown>
}

// 业务组件页面注册
export const businessComponentPageRegistry: Record<
  string,
  | ComponentType<BusinessComponentPageProps>
  | LazyExoticComponent<ComponentType<BusinessComponentPageProps>>
> = {
  // "xx-page": React.lazy(() => import("./xx-page")),
}
