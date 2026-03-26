import { lazy } from 'react'
import applicationsUrl from '@/assets/images/sider/applications.svg'
import appStoreUrl from '@/assets/images/sider/appStore.svg'
import digitalHumanUrl from '@/assets/images/sider/digitalHuman.svg'
import dipStudioUrl from '@/assets/images/sider/dipStudio.svg'
import type { RouteConfig } from './types'

const MyApp = lazy(() => import('../pages/MyApp'))
const AppStore = lazy(() => import('../pages/AppStore'))
const Home = lazy(() => import('../pages/Home'))
const WorkPlan = lazy(() => import('../pages/WorkPlan'))
const WorkPlanDetail = lazy(() => import('../pages/WorkPlan/Details'))
const History = lazy(() => import('../pages/History'))
const HistoryConversation = lazy(() => import('../pages/History/HistoryConversation'))
const DigitalHumanManagement = lazy(() => import('../pages/DigitalHuman/Management'))
const DigitalHumanDetail = lazy(() => import('../pages/DigitalHuman/Details'))
const DHSetting = lazy(() => import('../pages/DigitalHuman/DHSetting'))
const Conversation = lazy(() => import('../pages/Conversation'))
const InitialConfiguration = lazy(() => import('../pages/InitialConfiguration'))

/**
 * 路由配置数组
 * 这里定义了所有路由信息，包括路径、组件、菜单显示等
 */
export const routeConfigs: RouteConfig[] = [
  // --- Home Section ---
  {
    path: 'home',
    key: 'home',
    label: '首页',
    iconUrl: dipStudioUrl,
    requiredRoleIds: [],
    element: <Home />,
    sidebarMode: 'menu',
    handle: {
      layout: {
        hasSider: true,
        hasHeader: false,
        siderType: 'home',
        headerType: 'home',
      },
    },
  },

  // --- AI Store Section ---
  {
    path: 'store/my-app',
    key: 'my-app',
    label: '应用',
    iconUrl: applicationsUrl,
    requiredRoleIds: [],
    element: <MyApp />,
    sidebarMode: 'menu',
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
    requiredRoleIds: [],
    element: <AppStore />,
    sidebarMode: 'menu',
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
    path: 'digital-human/management',
    key: 'digital-human-management',
    label: '我的数字员工',
    iconUrl: digitalHumanUrl,
    element: <DigitalHumanManagement />,
    sidebarMode: 'menu',
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
    path: 'studio/conversation',
    key: 'studio-conversation',
    label: '会话',
    iconUrl: dipStudioUrl,
    requiredRoleIds: [],
    element: <Conversation />,
    sidebarMode: 'entry-only',
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
    path: 'work-plan',
    key: 'work-plan',
    label: '工作计划',
    iconUrl: dipStudioUrl,
    element: <WorkPlan />,
    sidebarMode: 'hidden',
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
    path: 'work-plan/:workPlanId',
    key: 'work-plan-item',
    label: '工作计划详情',
    element: <WorkPlanDetail />,
    sidebarMode: 'hidden',
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
    path: 'history',
    key: 'history',
    label: '历史记录',
    iconUrl: dipStudioUrl,
    element: <History />,
    sidebarMode: 'hidden',
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
    path: 'history/:sessionKey',
    key: 'history-item',
    label: '历史记录',
    element: <HistoryConversation />,
    sidebarMode: 'hidden',
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
    path: 'digital-human/management/setting',
    key: 'digital-human-setting-new',
    label: '新建数字员工',
    element: <DHSetting />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasSider: true,
        hasHeader: true,
        siderType: 'studio',
        headerType: 'studio',
      },
    },
  },
  // 详情 Tab 暂用页面 state，子路径路由先关闭
  // {
  //   path: 'digital-human/management/:digitalHumanId/plan',
  //   key: 'digital-human-detail-plan',
  //   label: '数字员工详情',
  //   element: <DigitalHumanDetail />,
  //   sidebarMode: 'hidden',
  //   handle: {
  //     layout: {
  //       hasSider: true,
  //       hasHeader: false,
  //       siderType: 'studio',
  //       headerType: 'home',
  //     },
  //   },
  // },
  // {
  //   path: 'digital-human/management/:digitalHumanId/session',
  //   key: 'digital-human-detail-session',
  //   label: '数字员工详情',
  //   element: <DigitalHumanDetail />,
  //   sidebarMode: 'hidden',
  //   handle: {
  //     layout: {
  //       hasSider: true,
  //       hasHeader: false,
  //       siderType: 'studio',
  //       headerType: 'home',
  //     },
  //   },
  // },
  // {
  //   path: 'digital-human/management/:digitalHumanId/config',
  //   key: 'digital-human-detail-config',
  //   label: '数字员工详情',
  //   element: <DigitalHumanDetail />,
  //   sidebarMode: 'hidden',
  //   handle: {
  //     layout: {
  //       hasSider: true,
  //       hasHeader: false,
  //       siderType: 'studio',
  //       headerType: 'home',
  //     },
  //   },
  // },
  {
    path: 'digital-human/management/:digitalHumanId/setting',
    key: 'digital-human-setting-item',
    label: '数字员工配置',
    element: <DHSetting />,
    sidebarMode: 'hidden',
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
    path: 'digital-human/management/:digitalHumanId',
    key: 'digital-human-detail',
    label: '数字员工详情',
    element: <DigitalHumanDetail />,
    sidebarMode: 'hidden',
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
    path: 'initial-configuration',
    key: 'initial-configuration',
    label: '系统初始化配置',
    element: <InitialConfiguration />,
    sidebarMode: 'hidden',
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
