import { lazy } from 'react'
import { SYSTEM_FIXED_APP_ADMIN_USER_ID, SYSTEM_FIXED_NORMAL_USER_ID } from '@/apis/types'
import applicationsUrl from '@/assets/images/sider/applications.svg'
import appStoreUrl from '@/assets/images/sider/appStore.svg'
import projectUrl from '@/assets/images/sider/project.svg'
import type { RouteConfig } from './types'

const MyApp = lazy(() => import('../pages/MyApp'))
const AppStore = lazy(() => import('../pages/AppStore'))
const ProjectManagement = lazy(() => import('../pages/ProjectManagement'))
const Project = lazy(() => import('../pages/ProjectManagement/Project'))

/**
 * 路由配置数组
 * 这里定义了所有路由信息，包括路径、组件、菜单显示等
 */
export const routeConfigs: RouteConfig[] = [
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
    path: 'studio/project-management',
    key: 'project-management',
    label: '项目管理',
    iconUrl: projectUrl,
    requiredRoleIds: [SYSTEM_FIXED_NORMAL_USER_ID],
    element: <ProjectManagement />,
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
    path: 'studio/project-management/:projectId',
    key: 'project-management-item',
    label: '项目',
    requiredRoleIds: [SYSTEM_FIXED_NORMAL_USER_ID],
    element: <Project />,
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
