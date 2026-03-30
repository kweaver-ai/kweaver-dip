import { useEffect, useMemo, useState } from 'react'
import { getRoleIcons, roleIconInfo } from '@/core'
import { getInnerUrl } from '@/utils'
import { loginRoutePath } from '@/routers/config'
import { dataAssetsIndicatorPath } from '@/components/DataAssetsIndicator/const'

// 全局状态管理
let globalRoleIcons: roleIconInfo[] = []
let pendingPromise: Promise<any> | null = null

/**
 * 获取系统角色图标
 */
export const useRoleIcons = (): [roleIconInfo[], () => void] => {
    const pathname = getInnerUrl(window.location.pathname)
    const [icons, setIcons] = useState<roleIconInfo[]>(globalRoleIcons)

    const getRoleIconsData = async () => {
        // 登录页面直接返回 false
        if (
            loginRoutePath
                .filter((item) => item !== dataAssetsIndicatorPath)
                .includes(pathname)
        ) {
            return
        }

        // 创建新的Promise并保存
        pendingPromise = getRoleIcons()
            .then((res) => {
                globalRoleIcons = res
                // 更新所有订阅组件的状态
                setIcons(res)
                pendingPromise = null
                return res
            })
            .catch(() => {
                globalRoleIcons = []
                // 更新所有订阅组件的状态
                setIcons([])
                pendingPromise = null
                return false
            })
    }

    useEffect(() => {
        // 如果有正在进行的请求，等待该请求完成
        if (pendingPromise) {
            pendingPromise.then(() => {
                setIcons(globalRoleIcons)
            })
        } else if (globalRoleIcons.length === 0) {
            // 没有正在进行的请求，且需要初始化时发起新请求
            getRoleIconsData()
        } else {
            // 已有结果，直接同步状态
            setIcons(globalRoleIcons)
        }
    }, [])

    return [useMemo(() => icons, [icons]), getRoleIconsData]
}
