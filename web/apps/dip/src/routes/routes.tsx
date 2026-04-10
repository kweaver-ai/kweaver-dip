import { lazy } from 'react'
import applicationsUrl from '@/assets/images/sider/applications.svg'
import appStoreUrl from '@/assets/images/sider/appStore.svg'
import chatUrl from '@/assets/images/sider/chat.svg'
import digitalHumanUrl from '@/assets/images/sider/digitalHuman.svg'
import dipStudioUrl from '@/assets/images/sider/dipStudio.svg'
import skillUrl from '@/assets/images/sider/skill.svg'
import {
  BUSINESS_NETWORK_BASE_PATH,
  businessLeafMenuItems,
} from '@/components/Sider/BusinessSider/menus'
import type { RouteConfig } from './types'

const MyApp = lazy(() => import('../pages/MyApp'))
const AppStore = lazy(() => import('../pages/AppStore'))
const Home = lazy(() => import('../pages/Home'))
const WorkPlan = lazy(() => import('../pages/WorkPlan'))
const WorkPlanDetail = lazy(() => import('../pages/WorkPlan/Details'))
const History = lazy(() => import('../pages/History'))
const HistoryConversation = lazy(() => import('../pages/History/HistoryConversation'))
const DigitalHumanManagement = lazy(() => import('../pages/DigitalHuman/Management'))
const SkillsManagement = lazy(() => import('../pages/Skills'))
const SkillsDetailPage = lazy(() => import('../pages/Skills/Details'))
const DigitalHumanDetail = lazy(() => import('../pages/DigitalHuman/Details'))
const DHSetting = lazy(() => import('../pages/DigitalHuman/DHSetting'))
const Conversation = lazy(() => import('../pages/Conversation'))
const InitialConfiguration = lazy(() => import('../pages/InitialConfiguration'))
const BusinessNetwork = lazy(() => import('../pages/BusinessNetwork'))

const businessLayoutConfig = {
  hasHeader: true,
  siderMode: 'app',
  module: 'business',
  headerType: 'business',
} as const

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
    iconUrl: chatUrl,
    requiredRoleIds: [],
    element: <Home />,
    sidebarMode: 'menu',
    handle: {
      layout: {
        hasHeader: false,
        siderMode: 'entry',
        module: 'studio',
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
        hasHeader: true,
        siderMode: 'app',
        module: 'store',
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
        hasHeader: true,
        siderMode: 'app',
        module: 'store',
        headerType: 'store',
      },
    },
  },

  // --- DIP Studio Section ---
  {
    path: 'studio/digital-human',
    key: 'digital-human',
    label: '我的数字员工',
    iconUrl: digitalHumanUrl,
    element: <DigitalHumanManagement />,
    sidebarMode: 'menu',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/skills',
    key: 'skills',
    label: '技能管理',
    iconUrl: skillUrl,
    element: <SkillsManagement />,
    sidebarMode: 'menu',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/skills/:skillName',
    key: 'skill-item',
    label: '技能详情',
    element: <SkillsDetailPage />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/conversation',
    key: 'studio-conversation',
    label: '会话',
    iconUrl: chatUrl,
    requiredRoleIds: [],
    element: <Conversation />,
    sidebarMode: 'entry-only',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/work-plan',
    key: 'work-plan',
    label: '工作计划',
    iconUrl: dipStudioUrl,
    element: <WorkPlan />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/work-plan/:workPlanId',
    key: 'work-plan-item',
    label: '工作计划详情',
    element: <WorkPlanDetail />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/history',
    key: 'history',
    label: '历史记录',
    iconUrl: dipStudioUrl,
    element: <History />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/history/:sessionKey',
    key: 'history-item',
    label: '历史记录',
    element: <HistoryConversation />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/digital-human/setting',
    key: 'digital-human-setting-new',
    label: '新建数字员工',
    element: <DHSetting />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/digital-human/:digitalHumanId/setting',
    key: 'digital-human-setting-item',
    label: '数字员工配置',
    element: <DHSetting />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/digital-human/:digitalHumanId',
    key: 'digital-human-detail',
    label: '数字员工详情',
    element: <DigitalHumanDetail />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'app',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: 'studio/initial-configuration',
    key: 'initial-configuration',
    label: '系统初始化配置',
    element: <InitialConfiguration />,
    sidebarMode: 'hidden',
    handle: {
      layout: {
        hasHeader: true,
        siderMode: 'none',
        module: 'studio',
        headerType: 'studio',
      },
    },
  },
  {
    path: BUSINESS_NETWORK_BASE_PATH.replace(/^\//, ''),
    key: 'business-network',
    label: '全局业务知识网络',
    element: <BusinessNetwork />,
    sidebarMode: 'menu',
    handle: {
      layout: businessLayoutConfig,
    },
  },
  ...businessLeafMenuItems.flatMap((item): RouteConfig[] => {
    const normalizedPath = item.path.replace(/^\//, '')
    return [
      {
        path: normalizedPath,
        key: item.key,
        label: item.label,
        element: <BusinessNetwork />,
        sidebarMode: 'menu',
        handle: {
          layout: businessLayoutConfig,
        },
      },
      {
        path: `${normalizedPath}/*`,
        key: `${item.key}-nested`,
        label: item.label,
        element: <BusinessNetwork />,
        sidebarMode: 'menu',
        handle: {
          layout: businessLayoutConfig,
        },
      },
    ]
  }),
]
