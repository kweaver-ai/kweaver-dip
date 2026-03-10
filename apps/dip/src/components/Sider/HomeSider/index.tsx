import { PushpinOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Menu, message, Popover, Tooltip } from 'antd'
import clsx from 'classnames'
import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import logoImage from '@/assets/images/brand/logo.png'
import SidebarAiStoreIcon from '@/assets/images/sider/aiStore.svg?react'
import SidebarDipStudioIcon from '@/assets/images/sider/dipStudio.svg?react'
import SidebarSystemIcon from '@/assets/images/sider/proton.svg?react'
import { getFirstVisibleRouteBySiderType } from '@/routes/utils'
import { useMicroAppStore, usePreferenceStore } from '@/stores'
import { useLanguageStore } from '@/stores/languageStore'
import { useOEMConfigStore } from '@/stores/oemConfigStore'
import { getFullPath } from '@/utils/config'
import { getAccessToken, getRefreshToken } from '@/utils/http/token-config'
import AppIcon from '../../AppIcon'
import IconFont from '../../IconFont'
import { UserMenuItem } from '../components/UserMenuItem'

interface HomeSiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
}

/**
 * 首页侧边栏（HomeSider）
 *
 * - 负责渲染：Logo + 折叠按钮 + 用户信息
 * - 显示路由菜单项、钉住的应用、外部链接等
 */
const HomeSider = ({ collapsed, onCollapse }: HomeSiderProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [messageApi, messageContextHolder] = message.useMessage()
  const { pinnedMicroApps, unpinMicroApp, wenshuAppInfo } = usePreferenceStore()
  const { setAppSource } = useMicroAppStore()
  const { language } = useLanguageStore()
  const { getOEMResourceConfig } = useOEMConfigStore()
  const oemResourceConfig = getOEMResourceConfig(language)
  // TODO: 角色信息需要从其他地方获取，暂时使用空数组
  const roleIds = useMemo(() => new Set<string>([]), [])

  const handleOpenApp = useCallback(
    (appId: number) => {
      // 记录来源类型，并在容器中根据 Store 读取，不再依赖 URL 参数
      setAppSource(appId, 'home')
      navigate(`/application/${appId}`)
    },
    [navigate, setAppSource],
  )

  const handleUnpin = useCallback(
    async (appId: number) => {
      try {
        await unpinMicroApp(appId)
        messageApi.success('已取消钉住')
      } catch (error) {
        console.error('Failed to unpin micro app:', error)
        messageApi.error('取消钉住失败，请稍后重试')
      }
    },
    [unpinMicroApp],
  )


  const menuItems = useMemo<MenuProps['items']>(() => {
    const items: MenuProps['items'] = []

    // 问数应用始终排在第一位（若存在）
    if (wenshuAppInfo) {
      items.push({
        key: `micro-app-${wenshuAppInfo.id}`,
        label: wenshuAppInfo.name,
        icon: (
          <AppIcon icon={wenshuAppInfo.icon} name={wenshuAppInfo.name} size={16} shape="square" />
        ),
        onClick: () => handleOpenApp(wenshuAppInfo.id),
      })
    }

    // 钉住的应用（排除问数，避免重复）
    pinnedMicroApps
      .filter((app) => app.id !== wenshuAppInfo?.id)
      .forEach((app) => {
        items.push({
          key: `micro-app-${app.id}`,
          label: (
            <div className="w-full h-full flex justify-between items-center">
              {app.name}
              <Popover content="取消固定">
                <PushpinOutlined
                  className="w-6 h-6 text-base flex items-center justify-center rounded text-[var(--dip-warning-color)] pin-icon opacity-0 hover:bg-[rgba(0,0,0,0.04)]"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnpin(app.id)
                  }}
                />
              </Popover>
            </div>
          ),
          icon: <AppIcon icon={app.icon} name={app.name} size={16} shape="square" />,
          onClick: () => handleOpenApp(app.id),
        })
      })

    return items
  }, [pinnedMicroApps, handleOpenApp, handleUnpin, wenshuAppInfo])

  const externalMenuItems = useMemo<MenuProps['items']>(() => {
    const firstStoreRoute = getFirstVisibleRouteBySiderType('store', roleIds)
    const firstStudioRoute = getFirstVisibleRouteBySiderType('studio', roleIds)
    const baseOrigin = window.location.origin
    const getExternalUrl = (path: string) => `${baseOrigin}${path}`

    const storePath = `/${firstStoreRoute?.path || 'store/my-app'}`
    const studioPath = `/${firstStudioRoute?.path || 'studio/project-management'}`

    const storeHref = getFullPath(storePath)
    const studioHref = getFullPath(studioPath)

    // 业务知识网络单点登录参数
    const redirectUrl = '/studio/home'
    const token = getAccessToken()
    const refreshToken = getRefreshToken()
    const ssoSearchParams = new URLSearchParams({
      redirect_url: redirectUrl,
      product: 'adp',
    })
    if (token) {
      if (process.env.NODE_ENV === 'development') {
        ssoSearchParams.set(
          'token',
          'ory_at_1Ol1cd_wZVPwYNCr50AiR9dctvUvM1_mI2C-f481n6Y.uikVUF3c1Rf5KFBivT8JbYDE6VDFLplv_1KRiihWqWU',
        )
        ssoSearchParams.set(
          'refreshToken',
          'ory_rt_b1VBSySehSNQro5ZPZPTxScOEYVkNwaVpzTVk0tgCZI.8lJkppPN97yZSGWTlZOSxqz3fpoTg0dKTR8MwCWr5Uo',
        )
      } else {
        ssoSearchParams.set('token', token)
        ssoSearchParams.set('refreshToken', refreshToken)
      }
    }
    const ssoUrl = `${baseOrigin}/interface/studioweb/internalSSO?${ssoSearchParams.toString()}`

    return [
      {
        key: 'ai-store',
        label: (
          <a href={storeHref} target="_blank" rel="noopener noreferrer">
            AI Store
          </a>
        ),
        icon: <SidebarAiStoreIcon />,
      },
      {
        key: 'dip-studio',
        label: (
          <a href={studioHref} target="_blank" rel="noopener noreferrer">
            DIP Studio
          </a>
        ),
        icon: <SidebarDipStudioIcon />,
      },
      {
        key: 'data-platform',
        label: (
          <a href={ssoUrl} target="_blank" rel="noopener noreferrer">
            业务知识网络
          </a>
        ),
        icon: <IconFont type="icon-yewuzhishiwangluo" />,
      },
      {
        key: 'system',
        label: (
          <a href={getExternalUrl('/deploy')} target="_blank" rel="noopener noreferrer">
            系统工作台
          </a>
        ),
        icon: <SidebarSystemIcon />,
      },
    ]
  }, [roleIds])

  // 获取 OEM logo，如果获取不到则使用默认 logo
  const logoUrl = useMemo(() => {
    const base64Image = oemResourceConfig?.['logo.png']
    if (!base64Image) {
      return logoImage
    }
    // 如果已经是 data URL 格式，直接使用
    if (base64Image.startsWith('data:image/')) {
      return base64Image
    }
    // 否则添加 base64 前缀
    return `data:image/png;base64,${base64Image}`
  }, [oemResourceConfig])

  const selectedKeys = useMemo(() => {
    const path = location.pathname
    const match = path.match(/^\/application\/(\d+)/)
    if (!match) {
      return []
    }

    const appId = Number(match[1])
    const key = `micro-app-${appId}`

    const exists =
      (wenshuAppInfo && wenshuAppInfo.id === appId) ||
      pinnedMicroApps.some((app) => app.id === appId)

    return exists ? [key] : []
  }, [location.pathname, pinnedMicroApps, wenshuAppInfo])

  return (
    <div className="flex flex-col h-full px-0 pt-4 pb-1 overflow-hidden">
      {messageContextHolder}
      {/* logo + 收缩按钮 */}
      <div
        className={clsx(
          'flex items-center gap-2 pb-4',
          collapsed ? 'justify-center pl-1.5 pr-1.5' : 'justify-between pl-3 pr-2',
        )}
      >
        <img src={logoUrl} alt="logo" className={clsx('h-8 w-auto', collapsed && 'hidden')} />
        <Tooltip title={collapsed ? '展开' : '收起'} placement="right">
          <button
            type="button"
            className="text-sm cursor-pointer flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color] hover:text-[--dip-primary-color]"
            onClick={() => onCollapse(!collapsed)}
          >
            <IconFont type="icon-dip-cebianlan" />
          </button>
        </Tooltip>
      </div>

      {/* 菜单内容 */}
      <div className="flex-1 flex flex-col dip-hideScrollbar">
        <div className="flex-1">
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            items={menuItems}
            inlineCollapsed={collapsed}
            selectable
          />
        </div>

        {/* 外链菜单内容 */}
        <div className="shrink-0">
          <Menu
            mode="inline"
            selectedKeys={[]}
            items={externalMenuItems}
            inlineCollapsed={collapsed}
            selectable={false}
          />
        </div>
      </div>

      {/* 用户 */}
      <UserMenuItem collapsed={collapsed} />
    </div>
  )
}

export default HomeSider
