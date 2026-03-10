import { Button, Spin } from 'antd'
import { loadMicroApp, type MicroApp as QiankunMicroApp } from 'qiankun'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Root as ReactRoot } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import Empty from '@/components/Empty'
import { useUserInfoStore } from '@/stores'
import type { CurrentMicroAppInfo } from '@/stores/microAppStore'
import { getAccessToken, httpConfig } from '@/utils/http/token-config'
import { onMicroAppGlobalStateChange, setMicroAppGlobalState } from '@/utils/micro-app/globalState'
import { microAppLoadFailureManager } from '@/utils/micro-app/loadFailureManager'
import { getMicroAppEntry } from '@/utils/micro-app/localDev'
import type { MicroAppProps } from '@/utils/micro-app/types'
import { AppMenu } from '../Header/components/AppMenu'

interface MicroAppComponentProps {
  /** 应用基础信息 */
  appBasicInfo: CurrentMicroAppInfo
  /** 首页路由 */
  homeRoute: string
}

const MicroAppComponent = ({ appBasicInfo, homeRoute }: MicroAppComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const microAppRef = useRef<QiankunMicroApp | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0) // 用于强制重新加载
  const [failureInfo, setFailureInfo] = useState<{
    error: Error | string
    appName: string
    entry: string
  } | null>(null)
  const { userInfo, logout } = useUserInfoStore()
  // 用于存储渲染根实例
  const appMenuRootRef = useRef<Map<string, ReactRoot>>(new Map())
  // 用于存储最新的 microAppProps，避免 useEffect 依赖整个对象导致无限循环
  const microAppPropsRef = useRef<MicroAppProps | null>(null)

  // 构建标准化的微应用 props（所有微应用统一使用此结构）
  const microAppProps: MicroAppProps = useMemo<any>(
    () => ({
      // ========== 认证相关 ==========
      token: {
        // 使用 getter，每次访问时都从 Cookie 读取最新值，无需更新 props
        get accessToken() {
          return getAccessToken()
        },
        refreshToken: httpConfig.refreshToken || (async () => ({ accessToken: '' })),
        onTokenExpired: httpConfig.onTokenExpired,
      },

      // ========== 路由信息 ==========
      route: {
        basename: appBasicInfo.routeBasename,
        homeRoute: homeRoute,
      },

      // ========== 用户信息 ==========
      user: {
        id: userInfo?.id || '',
        // 使用 getter，每次访问时都从 store 读取最新值，无需更新 props
        get vision_name() {
          return useUserInfoStore.getState().userInfo?.vision_name || ''
        },
        get account() {
          return useUserInfoStore.getState().userInfo?.account || ''
        },
      },

      // ========== 应用信息 ==========
      application: {
        // 应用信息在微应用加载时确定，不会在运行时变化
        id: appBasicInfo.id,
        name: appBasicInfo.name,
        icon: appBasicInfo.icon || '',
      },

      // ========== UI 组件渲染函数 ==========
      // 通过 render props 模式传递组件，微应用可以调用这些函数来渲染组件
      // 注意：这些函数在主应用的 React 上下文中执行，使用 ReactDOM.createRoot 渲染到微应用指定的容器
      // 这样可以确保组件在主应用的 React 上下文中渲染，可以访问主应用的 store 和 hooks
      renderAppMenu: (container: HTMLElement | string) => {
        // 支持传入元素或元素 ID
        const targetContainer =
          typeof container === 'string' ? document.getElementById(container) : container

        if (!targetContainer) {
          console.log('容器元素不存在:', container)
          return
        }

        // 清理旧的渲染实例
        const containerKey = typeof container === 'string' ? container : container.id || 'app-menu'
        const oldRoot = appMenuRootRef.current.get(containerKey)
        if (oldRoot) {
          oldRoot.unmount()
        }

        // 在主应用的 React 上下文中渲染到微应用的容器
        const root = createRoot(targetContainer)
        root.render(<AppMenu />)
        appMenuRootRef.current.set(containerKey, root)
      },

      // ========== 用户操作 ==========
      logout: () => {
        // 调用主应用的退出登录函数
        logout()
      },

      // ========== 全局状态管理 ==========
      setMicroAppState: (state: Record<string, any>) => {
        // 微应用调用时，只允许更新 allowedFields 中的字段
        return setMicroAppGlobalState(state)
      },
      onMicroAppStateChange: (
        callback: (state: any, prev: any) => void,
        fireImmediately?: boolean,
      ) => {
        return onMicroAppGlobalStateChange(callback, fireImmediately)
      },
    }),
    [appBasicInfo.routeBasename, userInfo?.id],
  )

  // 更新 ref，确保 useEffect 能访问到最新的 props
  microAppPropsRef.current = microAppProps

  // 清理容器的辅助函数
  const clearContainer = () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }
  }

  // 只在应用配置变化时重新加载微应用
  useEffect(() => {
    let isMounted = true
    let microAppInstance: QiankunMicroApp | null = null

    // 检查是否已经失败过
    const appIdStr = String(appBasicInfo.id)
    const hasFailed = microAppLoadFailureManager.hasFailed(appIdStr)
    const isPageReload = microAppLoadFailureManager.isPageReload()

    // console.log(`[微应用加载] 检查失败状态:`, {
    //   appId: appIdStr,
    //   hasFailed,
    //   isPageReload,
    //   pageLoadTime: microAppLoadFailureManager.getPageLoadTime(),
    // })

    if (hasFailed) {
      const failureInfo = microAppLoadFailureManager.getFailureInfo(appIdStr)
      if (failureInfo) {
        setLoadFailed(true)
        setFailureInfo({
          error: failureInfo.error,
          appName: failureInfo.appName,
          entry: failureInfo.entry,
        })
        setLoading(false)
        clearContainer() // 确保容器为空
        console.log(
          `[微应用加载] 检测到之前的失败记录，跳过加载: ${failureInfo.appName} (${appBasicInfo.id})`,
          isPageReload ? '(页面刷新后恢复)' : '(组件重新渲染)',
        )
        return
      }
    }

    // 重置失败状态
    setLoadFailed(false)
    setFailureInfo(null)

    // 检查容器和 entry
    if (!containerRef.current) {
      setLoading(false)
      return
    }

    const microAppEntry = appBasicInfo.micro_app.entry
    if (!microAppEntry) {
      console.log('微应用入口不存在:', appBasicInfo)
      setLoading(false)
      return
    }

    // 如果已经存在微应用实例，先卸载（异步等待完成）
    const unmountOldInstance = async () => {
      if (microAppRef.current) {
        try {
          await microAppRef.current.unmount()
          microAppRef.current = null
        } catch (err) {
          console.log('卸载旧微应用实例时出错:', err)
          microAppRef.current = null
        }
      }
    }

    // 获取微应用 entry URL，支持本地调试覆盖
    const microAppName = appBasicInfo.micro_app.name
    let entryUrl = getMicroAppEntry(microAppName, microAppEntry)

    // 移除路由 hash（qiankun 的 entry 不能包含 #）
    const hashIndex = entryUrl.indexOf('#')
    if (hashIndex !== -1) {
      const originalUrl = entryUrl
      entryUrl = entryUrl.substring(0, hashIndex)
      console.log('entry 包含路由 hash，已自动移除:', originalUrl, '->', entryUrl)
    }

    // 异步加载流程
    const loadMicroAppAsync = async () => {
      // 等待旧实例卸载完成
      await unmountOldInstance()

      // 再次检查容器和挂载状态
      if (!containerRef.current) {
        setLoading(false)
        return
      }
      if (!isMounted) {
        setLoading(false)
        return
      }

      // 开发环境：调试信息
      console.log('加载微应用:', { name: microAppName, entry: entryUrl })

      // 加载微应用
      // 使用 ref 获取最新的 props，避免闭包问题
      const latestProps = microAppPropsRef.current || microAppProps
      microAppInstance = loadMicroApp({
        name: microAppName,
        entry: entryUrl,
        container: containerRef.current,
        props: { ...latestProps, container: containerRef.current },
      })

      microAppRef.current = microAppInstance

      // 监听微应用加载状态
      try {
        await microAppInstance.mountPromise
        if (isMounted) {
          setLoading(false)
          console.log('微应用加载成功:', microAppName)
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false)
          console.log('微应用加载失败:', {
            name: microAppName,
            entry: entryUrl,
            error: err,
          })

          // 清理 qiankun wrapper，避免残留
          try {
            if (microAppInstance) {
              await microAppInstance.unmount()
            }
          } catch {
            // console.log('清理失败微应用时出错:', unmountErr)
          } finally {
            // 无论卸载是否成功，都清空容器内容
            clearContainer()
            if (microAppRef.current === microAppInstance) {
              microAppRef.current = null
            }
          }

          // 记录失败状态
          microAppLoadFailureManager.recordFailure(
            appIdStr,
            microAppName,
            entryUrl,
            err instanceof Error ? err : String(err),
          )

          // 设置失败状态
          setLoadFailed(true)
          setFailureInfo({
            error: err instanceof Error ? err : String(err),
            appName: microAppName,
            entry: entryUrl,
          })
        }
      }
    }

    // 启动异步加载流程
    loadMicroAppAsync()

    // 清理函数：只在组件真正卸载或 app 配置变化时执行
    return () => {
      isMounted = false
      setLoading(true)

      // 清理所有渲染根实例
      appMenuRootRef.current.forEach((root) => {
        try {
          root.unmount()
        } catch (err) {
          console.log('清理 AppMenu 渲染实例时出错:', err)
        }
      })
      appMenuRootRef.current.clear()

      // 使用 ref 获取当前实例，更安全
      const currentInstance = microAppRef.current
      if (currentInstance) {
        // 异步卸载微应用，避免阻塞
        currentInstance
          .unmount()
          .then(() => {
            // 只有当前实例才清空 ref
            if (microAppRef.current === currentInstance) {
              microAppRef.current = null
            }
            clearContainer()
          })
          .catch((err) => {
            console.log('微应用卸载时出错:', err)
            if (microAppRef.current === currentInstance) {
              microAppRef.current = null
            }
            clearContainer()
          })
      } else {
        // 如果没有实例但容器中有内容，也清空
        clearContainer()
      }
    }
    // 只依赖应用配置和 props 的核心字段
    // 注意：不依赖整个 microAppProps 对象，而是依赖具体的值，避免对象引用变化导致的无限循环
    // retryKey 用于手动重试时触发重新加载
  }, [appBasicInfo.id, retryKey])

  // 处理重试
  const handleRetry = () => {
    // 清除失败记录
    microAppLoadFailureManager.clearFailure(String(appBasicInfo.id))
    // 重置状态
    setLoadFailed(false)
    setFailureInfo(null)
    setLoading(true)
    // 通过改变 retryKey 触发 useEffect 重新执行
    setRetryKey((prev) => prev + 1)
  }

  // 如果加载失败，显示错误信息
  if (loadFailed && failureInfo) {
    // 确保容器为空，清理可能残留的 qiankun wrapper
    clearContainer()

    const errorMessage =
      failureInfo.error instanceof Error ? failureInfo.error.message : String(failureInfo.error)

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <Empty
          type="failed"
          // desc="微应用加载失败"
          subDesc={
            <div className="mt-4 text-center">
              <div className="mb-2 text-sm text-gray-600">应用名称: {failureInfo.appName}</div>
              <div className="mb-4 text-sm text-red-600">错误信息: {errorMessage}</div>
              <Button type="primary" onClick={handleRetry}>
                重试
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-full w-full"
        id={`micro-app-container-${appBasicInfo.id}`}
      />
      {loading && (
        <Spin size="large" className="absolute inset-0 flex items-center justify-center" />
      )}
    </>
  )
}

export default MicroAppComponent
