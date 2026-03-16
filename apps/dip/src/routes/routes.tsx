import { lazy } from 'react'
import { SYSTEM_FIXED_APP_ADMIN_USER_ID, SYSTEM_FIXED_NORMAL_USER_ID } from '@/apis/types'
import applicationsUrl from '@/assets/images/sider/applications.svg'
import appStoreUrl from '@/assets/images/sider/appStore.svg'
import dipStudioUrl from '@/assets/images/sider/dipStudio.svg'
import type { RouteConfig } from './types'

const MyApp = lazy(() => import('../pages/MyApp'))
const AppStore = lazy(() => import('../pages/AppStore'))
const Conversation = lazy(() => import('../pages/DipStudio/Conversation'))
const DigitalEmployee = lazy(() => import('../pages/DipStudio/DigitalEmployee'))
const DESetting = lazy(() => import('../pages/DipStudio/DigitalEmployee/DESetting'))

/**
 * 路由配置数组
 * 这里定义了所有路由信息，包括路径、组件、菜单显示等
 */
export const routeConfigs: RouteConfig[] = [
  // --- Home Section ---
  {
    path: 'home',
    key: 'home',
    label: 'DIP Studio',
    iconUrl: dipStudioUrl,
    requiredRoleIds: [],
    element: <Conversation />,
    showInSidebar: true,
    handle: {
      layout: {
        hasSider: true,
        hasHeader: false,
        siderType: 'home',
        headerType: 'micro-app',
      },
    },
  },

  // --- AI Store Section ---
  {
    path: 'store/my-app',
    key: 'my-app',
    label: '应用',
    iconUrl: applicationsUrl,
    requiredRoleIds: [SYSTEM_FIXED_NORMAL_USER_ID],
    element: <MyApp />,
    showInSidebar: true,
    handle: {
      layout: {
        hasSider: true,
        hasHeader: true,
        siderType: 'store',
        headerType: 'store',
      },
    },
  },
  {
    path: 'store/app-store',
    key: 'app-store',
    label: '应用商店',
    iconUrl: appStoreUrl,
    requiredRoleIds: [SYSTEM_FIXED_APP_ADMIN_USER_ID],
    element: <AppStore />,
    showInSidebar: true,
    handle: {
      layout: {
        hasSider: true,
        hasHeader: true,
        siderType: 'store',
        headerType: 'store',
      },
    },
  },

  // --- DIP Studio Section ---
  {
    path: 'studio/home',
    key: 'studio-home',
    label: '会话',
    iconUrl: dipStudioUrl,
    requiredRoleIds: [],
    element: <Conversation />,
    showInSidebar: true,
    handle: {
      layout: {
        hasSider: true,
        hasHeader: true,
        siderType: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/work-plan/:workPlanId',
    key: 'work-plan-item',
    label: '工作计划',
    requiredRoleIds: [SYSTEM_FIXED_NORMAL_USER_ID],
    // element: <WorkPlan />,
    handle: {
      layout: {
        hasSider: true,
        hasHeader: true,
        siderType: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/digital-employee',
    key: 'digital-employee',
    label: '数字员工',
    iconUrl: dipStudioUrl,
    requiredRoleIds: [SYSTEM_FIXED_NORMAL_USER_ID],
    element: <DigitalEmployee />,
    showInSidebar: true,
    group: '数字员工配置',
    handle: {
      layout: {
        hasSider: true,
        hasHeader: true,
        siderType: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/digital-employee/:id/setting',
    key: 'digital-employee-setting',
    label: '数字员工配置',
    requiredRoleIds: [SYSTEM_FIXED_NORMAL_USER_ID],
    element: <DESetting />,
    showInSidebar: false,
    handle: {
      layout: {
        hasSider: false,
        hasHeader: true,
        siderType: 'studio',
        headerType: 'studio',
      },
    },
  },
]
