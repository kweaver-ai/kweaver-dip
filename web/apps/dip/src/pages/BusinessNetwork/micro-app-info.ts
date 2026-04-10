import type { CurrentMicroAppInfo } from '@/stores/microAppStore'
import { getFullPath } from '@/utils/config'

/** 菜单里 //ip:port/... → 当前 host */
export const normalizeMicroAppEntry = (entry: string): string =>
  entry.replace('ip:port', window.location.host)

/**
 * 由业务菜单构造 CurrentMicroAppInfo
 */
export const buildMicroAppInfo = (
  menuKey: string,
  label: string,
  routePath: string,
  appName: string,
  appEntry: string,
): CurrentMicroAppInfo => ({
  id: 0,
  key: menuKey,
  name: label,
  description: '',
  icon: '',
  category: 'business',
  version: '',
  is_config: true,
  updated_by: 'system',
  updated_at: new Date(0).toISOString(),
  micro_app: {
    name: appName,
    entry: appEntry,
    headless: false,
  },
  pinned: false,
  isBuiltIn: true,
  routeBasename: getFullPath(routePath),
})
