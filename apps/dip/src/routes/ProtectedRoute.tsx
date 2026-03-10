import { Spin } from 'antd'
import { useEffect, useRef } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import GradientContainer from '@/components/GradientContainer'
import { getFullPath } from '@/utils/config'
import { getAccessToken, setAccessToken } from '@/utils/http/token-config'
import { usePreferenceStore, useUserInfoStore } from '../stores'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * 路由守卫组件（组件包装器形式）
 * 保护需要登录才能访问的路由
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // 订阅 store 状态，用于触发重新渲染
  const { fetchUserInfo, userInfo, isLoading } = useUserInfoStore()
  const { fetchPinnedMicroApps } = usePreferenceStore()
  const location = useLocation()
  const navigate = useNavigate()
  // 用于跟踪是否已经尝试过获取用户信息，防止重复调用
  const hasTriedFetchRef = useRef(false)
  // 用于跟踪上次的 token，当 token 变化时重置 hasTriedFetchRef，允许重新请求
  // 注意：虽然 useEffect 依赖 token，但 ref 不会自动重置，需要手动检测变化
  const lastTokenRef = useRef<string | null>(null)

  // 通过环境变量控制是否跳过登录认证
  // 在 .env.local 中设置 PUBLIC_SKIP_AUTH=true 即可跳过登录认证
  const skipAuth = import.meta.env.PUBLIC_SKIP_AUTH === 'true'

  // 0) 支持外部平台通过 URL 携带 token和 refreshToken 免登录
  useEffect(() => {
    const urlToken = location.search && new URLSearchParams(location.search).get('token')
    const urlRefreshToken =
      location.search && new URLSearchParams(location.search).get('refresh_token')
    if (!(urlToken && urlRefreshToken)) return

    setAccessToken(urlToken, urlRefreshToken)
    const params = new URLSearchParams(location.search)
    params.delete('token')
    params.delete('refresh_token')
    const search = params.toString()
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash },
      { replace: true },
    )
  }, [location.search, location.pathname, location.hash, navigate])

  // 1) token 校验：无 token 或未登录 -> 登录页
  const token = getAccessToken()

  // 检查是否在登录相关页面（避免循环重定向）
  // 注意：location.pathname 是相对于 basename 的路径（如 /login），不是完整路径
  const isLoginPage =
    location.pathname === '/login' ||
    location.pathname === '/login-success' ||
    location.pathname === '/login-failed' ||
    location.pathname.endsWith('/login')

  // 构建当前路径（用于重定向）
  const currentPath = location.pathname + location.search
  const buildLoginUrl = (path: string) =>
    path === '/' || path === getFullPath('/')
      ? '/login'
      : `/login?asredirect=${encodeURIComponent(path)}`

  // 初始化时检查并获取用户信息（不在登录页面时才获取）
  useEffect(() => {
    // 如果跳过认证，不需要获取用户信息
    if (skipAuth) {
      return
    }
    // 使用 getState() 获取最新状态，避免依赖不同步的问题
    const currentState = useUserInfoStore.getState()
    const currentUserInfo = currentState.userInfo
    const currentIsLoading = currentState.isLoading

    // 如果 token 变化了，重置 hasTriedFetchRef，允许重新请求
    if (lastTokenRef.current !== token) {
      lastTokenRef.current = token
      hasTriedFetchRef.current = false
    }

    // 如果没有 token，重置状态
    if (!token) {
      hasTriedFetchRef.current = false
      lastTokenRef.current = null
      return
    }

    // 如果已经有用户信息，重置状态
    if (currentUserInfo) {
      hasTriedFetchRef.current = false
      return
    }

    // 如果正在加载中，不重复调用
    if (currentIsLoading) {
      return
    }

    // 如果在登录页面，不获取用户信息
    if (isLoginPage) {
      return
    }

    // 如果已经尝试过获取，不再重复调用
    if (hasTriedFetchRef.current) {
      return
    }

    // 有 token 但还没有用户信息，尝试获取
    hasTriedFetchRef.current = true
    fetchUserInfo()
      .then(() => {
        // 获取成功后，重置状态，允许后续重新获取（如果 token 变化）
        const latestState = useUserInfoStore.getState()
        if (latestState.userInfo) {
          hasTriedFetchRef.current = false
        }
      })
      .catch(() => {
        // 获取失败后，保持 hasTriedFetchRef.current = true，避免重复请求
        // 只有当 token 变化时才会重置，允许重新尝试
        // hasTriedFetchRef.current 保持为 true，这样条件2和条件3都不会满足，会走到 !userInfo 的判断，执行跳转
      })
    // 注意：不依赖 userInfo 和 isLoading，而是在 effect 内部使用 getState() 获取最新状态
    // 这样可以避免状态更新导致的无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isLoginPage, fetchUserInfo, skipAuth])

  // 用户已登录且通过路由守卫时，确保刷新后拉取一次 pinned 列表（带内部去重）
  // 增加 focus 监听，确保在多标签页场景下（如在 AI Store 标签页操作后回到首页）能及时同步状态
  useEffect(() => {
    const refresh = () => {
      if (!skipAuth && token && userInfo) {
        fetchPinnedMicroApps()
      }
    }

    // 初次加载
    refresh()

    // 监听窗口聚焦
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
    }
  }, [skipAuth, token, userInfo, fetchPinnedMicroApps])

  // 如果跳过认证，直接返回子组件
  if (skipAuth) {
    return <>{children}</>
  }

  // 如果没有 token，需要重定向到登录页
  if (!token) {
    // 如果已经在登录页面，不需要重定向（避免循环重定向）
    if (isLoginPage) {
      return null
    }
    // 跳转到登录页，并携带当前路径作为重定向参数
    // 注意：如果是根路径 `/`，不传递 asredirect，让后端重定向到 login-success，由前端处理首页跳转
    // location.pathname 是相对于 basename 的路径，需要使用 getFullPath 构建完整路径
    const loginUrl = buildLoginUrl(currentPath)
    return <Navigate to={loginUrl} state={{ from: location }} replace />
  }

  // 判断是否应该显示加载状态
  // 1. store 中的 isLoading 为 true（请求正在进行，可能是其他组件发起的）
  // 2. 或者已经尝试过获取但还没有用户信息，且正在加载中（本组件发起的请求正在进行）
  // 3. 或者满足发起请求的条件（有 token、没有 userInfo、不在登录页）且还没有尝试过获取
  //    这样可以在首次渲染时就显示加载状态，避免先跳转再显示加载状态
  // 注意：条件1主要用于处理其他组件（如 LoginSuccess）先发起请求的情况
  // 注意：条件2中必须同时检查 isLoading，避免请求失败后仍然显示加载状态
  const shouldShowLoading =
    isLoading ||
    (hasTriedFetchRef.current && !userInfo && isLoading) ||
    (token && !userInfo && !isLoginPage && !hasTriedFetchRef.current)

  if (shouldShowLoading) {
    return (
      <GradientContainer className="w-full h-full flex items-center justify-center">
        <Spin size="large" />
      </GradientContainer>
    )
  }

  // 如果有 token 但没有用户信息（且不在加载中，且获取已完成），需要重定向到登录页
  // 注意：这个判断只有在请求失败或获取完成后才会走到
  if (!userInfo) {
    // 如果已经在登录页面，不需要重定向（避免循环重定向）
    if (isLoginPage) {
      return null
    }
    // 跳转到登录页，并携带当前路径作为重定向参数
    const loginUrl = buildLoginUrl(currentPath)
    return <Navigate to={loginUrl} state={{ from: location }} replace />
  }

  // 3) 角色校验：无角色 -> 登录失败页
  // TODO: 角色信息需要从其他地方获取，暂时跳过角色校验
  // const roleIds = new Set<string>([])
  // if (roleIds.size === 0) {
  //   return <Navigate to="/login-failed" replace />
  // }

  // 4) 权限校验：根据当前路由绑定的 requiredRoleIds 判断
  // TODO: 当前没有角色系统，所有权限校验都已放开，允许所有用户访问
  // const pathname = location.pathname
  // // 微应用容器：仅"普通用户"角色可访问
  // if (pathname.startsWith('/application/')) {
  //   if (!roleIds.has(SYSTEM_FIXED_NORMAL_USER_ID)) {
  //     return <Navigate to="/403" replace />
  //   }
  //   return <>{children}</>
  // }

  // const route = getRouteByPath(pathname)
  // if (route && !isRouteVisibleForRoles(route, roleIds)) {
  //   return <Navigate to="/403" replace />
  // }

  return <>{children}</>
}

export default ProtectedRoute
