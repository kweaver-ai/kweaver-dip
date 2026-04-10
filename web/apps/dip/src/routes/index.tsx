import { lazy, useEffect, useRef } from 'react'
import type { RouteObject } from 'react-router-dom'
import { createBrowserRouter, useNavigate } from 'react-router-dom'
import { useUserInfoStore } from '@/stores'
import { BASE_PATH } from '@/utils/config'
import { ProtectedRoute } from './ProtectedRoute'
import { routeConfigs } from './routes'
import { resolveDefaultAuthRedirect } from './utils'

const Login = lazy(() => import('../pages/Login'))
const LoginSuccess = lazy(() => import('../pages/Login/LoginSuccess'))
const MicroAppContainer = lazy(() => import('../pages/MicroAppContainer'))

// GlobalLayout 改为同步导入，避免 Suspense fallback 与 ProtectedRoute loading 同时显示
import GlobalLayout from '../layout/GlobalLayout'

const NotFound = lazy(() => import('../pages/ErrorPage/NotFound'))
const NoAccess = lazy(() => import('../pages/ErrorPage/NoAccess'))
const ServerError = lazy(() => import('../pages/ErrorPage/ServerError'))
const LoginFailed = lazy(() => import('../pages/Login/LoginFailed'))

/**
 * 默认首页重定向
 */
const DefaultIndexRedirect = () => {
  const navigate = useNavigate()
  const isAdmin = useUserInfoStore((s) => s.isAdmin)
  const modules = useUserInfoStore((s) => s.modules)
  const hasNavigatedRef = useRef(false)

  useEffect(() => {
    if (hasNavigatedRef.current) {
      return
    }

    void (async () => {
      const result = await resolveDefaultAuthRedirect(isAdmin, modules)
      hasNavigatedRef.current = true
      navigate(result.path, { replace: true, state: result.state })
    })()
  }, [navigate, isAdmin, modules])

  // const { userInfo } = useUserInfoStore()

  // TODO: 角色信息需要从其他地方获取，暂时使用空数组
  // const roleIds = useMemo(() => new Set<string>([]), [])
  // const first = useMemo(() => getFirstVisibleSidebarRoute(roleIds), [roleIds])
  // const to = first?.path ? `/${first.path}` : '/403'
  // navigate(to, { replace: true })

  return null
}

/**
 * 从路由配置生成 React Router 路由
 * 过滤掉占位路由（element 为 null 的）
 */
const generateRoutesFromConfig = (): RouteObject[] => {
  return routeConfigs
    .filter((route) => route.element !== null && route.element !== undefined)
    .map(({ key, label, iconUrl, sidebarMode, disabled, ...route }) => {
      const { element, path, handle, children } = route
      return {
        path,
        element,
        handle,
        children,
      } as RouteObject
    })
}

/**
 * 路由配置
 */
export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    // 登录成功页面
    {
      path: '/login-success',
      element: <LoginSuccess />,
    },
    // 登录失败页面
    {
      path: '/login-failed',
      element: <LoginFailed />,
    },
    // 403 页面
    {
      path: '/403',
      element: <NoAccess />,
    },
    // 505 页面
    {
      path: '/505',
      element: <ServerError />,
    },
    // 受保护区域（除 login/login-failed/403/404/505 外的所有页面）
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <GlobalLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <DefaultIndexRedirect />,
        },
        // 从配置生成的路由 (Store, Studio, Home)
        ...generateRoutesFromConfig(),
        // 动态路由（微应用容器）
        {
          path: 'application/:appKey/*',
          element: <MicroAppContainer />,
          handle: {
            layout: {
              hasHeader: true,
              siderMode: 'none',
              headerType: 'micro-app',
            },
          },
        },
        {
          path: 'application/error',
          element: <MicroAppContainer />,
          handle: {
            layout: {
              hasHeader: false,
              siderMode: 'entry',
              headerType: 'micro-app',
            },
          },
        },
      ],
    },
    // 404 页面
    {
      path: '*',
      element: <NotFound />,
    },
  ],
  {
    basename: BASE_PATH === '/' ? undefined : BASE_PATH,
  },
)
