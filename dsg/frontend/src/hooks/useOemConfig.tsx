import { useEffect, useMemo, useState } from 'react'
import { deployWebService } from '@/core/apis/deployWebService'

// 全局状态管理
let globalOemConfig: any = null
let pendingPromise: Promise<any> | null = null

/**
 * 获取部署个性化配置
 */
export const useOemConfig = (): [any, () => void] => {
    const [oemConfig, setOemConfig] = useState<any>(globalOemConfig)

    const getOemConfig = async () => {
        // 创建新的Promise并保存
        pendingPromise = deployWebService({ section: 'shareweb_zh-cn' })
            .then((res) => {
                globalOemConfig = res
                // 更新所有订阅组件的状态
                setOemConfig(res)
                pendingPromise = null
                return res
            })
            .catch(() => {
                globalOemConfig = null
                // 更新所有订阅组件的状态
                setOemConfig(null)
                pendingPromise = null
                return null
            })
    }

    useEffect(() => {
        // 如果有正在进行的请求，等待该请求完成
        if (pendingPromise) {
            pendingPromise.then(() => {
                setOemConfig(globalOemConfig)
            })
        } else if (globalOemConfig === null) {
            // 没有正在进行的请求，且需要初始化时发起新请求
            getOemConfig()
        } else {
            // 已有结果，直接同步状态
            setOemConfig(globalOemConfig)
        }
    }, [])

    return [useMemo(() => oemConfig, [oemConfig]), getOemConfig]
}
