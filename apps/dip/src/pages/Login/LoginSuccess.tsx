import { Spin } from 'antd'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientContainer from '@/components/GradientContainer'
import { resolveDefaultMicroAppPath } from '@/routes/utils'
import { useUserInfoStore } from '@/stores'

const LoginSuccess = () => {
  const navigate = useNavigate()
  const { fetchUserInfo } = useUserInfoStore()
  // 用于跟踪是否已经开始获取用户信息
  const hasStartedFetch = useRef(false)
  // 防止重复导航
  const hasNavigatedRef = useRef(false)

  useEffect(() => {
    // 登录成功后获取用户信息
    if (!hasStartedFetch.current) {
      hasStartedFetch.current = true
      fetchUserInfo()
        .then(() => {
          // Promise 完成后，使用 queueMicrotask 确保状态已经更新
          // queueMicrotask 会在当前同步代码执行完成后、下一个事件循环之前执行
          queueMicrotask(() => {
            // 防止重复导航（如果组件已卸载或已导航过）
            if (hasNavigatedRef.current) {
              return
            }

            const { userInfo: currentUserInfo } = useUserInfoStore.getState()
            if (currentUserInfo) {
              // 用户信息加载成功，根据权限跳转
              // 注意：如果有 asredirect 参数，后端会直接重定向到该地址，不会到 login-success 页面
              // 所以这里只需要处理没有 asredirect 的情况（跳转到首页）
              // TODO: 角色信息需要从其他地方获取，暂时使用空数组
              // const roleIds = new Set<string>([])
              // const firstRoute = getFirstVisibleSidebarRoute(roleIds)
              // const to = firstRoute?.path ? `/${firstRoute.path}` : '/'
              // hasNavigatedRef.current = true
              // navigate(to, { replace: true })

              // 通过公共方法解析默认微应用路由（基于固定应用 key）
              resolveDefaultMicroAppPath().then((targetPath) => {
                if (hasNavigatedRef.current) {
                  return
                }
                hasNavigatedRef.current = true
                navigate(targetPath, { replace: true })
              })
            } else {
              // 请求完成但没有用户信息，说明获取失败
              hasNavigatedRef.current = true
              navigate('/login-failed', { replace: true })
            }
          })
        })
        .catch(() => {
          // 防止重复导航
          if (hasNavigatedRef.current) {
            return
          }
          hasNavigatedRef.current = true
          // 请求失败，跳转到失败页面
          navigate('/login-failed', { replace: true })
        })
    }
  }, [fetchUserInfo, navigate])

  return (
    <GradientContainer className="w-full h-full flex items-center justify-center">
      <Spin size="large" />
    </GradientContainer>
  )
}

export default LoginSuccess
