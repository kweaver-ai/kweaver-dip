import { Spin } from 'antd'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import GradientContainer from '@/components/GradientContainer'
import { resolveDefaultAuthRedirect } from '@/routes/utils'
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

            const { userInfo: currentUserInfo, isAdmin, modules } = useUserInfoStore.getState()
            if (currentUserInfo) {
              void (async () => {
                const result = await resolveDefaultAuthRedirect(isAdmin, modules)
                if (hasNavigatedRef.current) {
                  return
                }
                hasNavigatedRef.current = true
                navigate(result.path, { replace: true, state: result.state })
              })()
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
      <Spin />
    </GradientContainer>
  )
}

export default LoginSuccess
