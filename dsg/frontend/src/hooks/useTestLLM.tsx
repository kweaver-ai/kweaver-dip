import { useEffect, useMemo, useState } from 'react'
import { getTestLLM } from '@/core'
import { getInnerUrl } from '@/utils'
import { loginRoutePath } from '@/routers/config'
import { dataAssetsIndicatorPath } from '@/components/DataAssetsIndicator/const'

// 全局状态管理
const globalLLM: any = true
const pendingPromise: Promise<boolean> | null = null

/**
 * 测试大模型
 */
export const useTestLLM = (): [boolean, () => void] => {
    const pathname = getInnerUrl(window.location.pathname)
    const [llm, setLlm] = useState<any>(globalLLM)

    const getLLMData = async () => {
        //     // 登录页面直接返回 false
        //     if (
        //         loginRoutePath
        //             .filter((item) => item !== dataAssetsIndicatorPath)
        //             .includes(pathname)
        //     ) {
        //         return
        //     }
        //     // 创建新的Promise并保存
        //     pendingPromise = getTestLLM()
        //         .then(({ res }) => {
        //             globalLLM = res
        //             // 更新所有订阅组件的状态
        //             setLlm(res)
        //             pendingPromise = null
        //             return res
        //         })
        //         .catch(() => {
        //             globalLLM = false
        //             // 更新所有订阅组件的状态
        //             setLlm(false)
        //             pendingPromise = null
        //             return false
        //         })
    }

    useEffect(() => {
        // // 如果有正在进行的请求，等待该请求完成
        // if (pendingPromise) {
        //     pendingPromise.then(() => {
        //         setLlm(globalLLM)
        //     })
        // } else if (globalLLM === null) {
        //     // 没有正在进行的请求，且需要初始化时发起新请求
        //     getLLMData()
        // } else {
        //     // 已有结果，直接同步状态
        //     setLlm(globalLLM)
        // }
    }, [])

    return [useMemo(() => llm, [llm]), getLLMData]
}
