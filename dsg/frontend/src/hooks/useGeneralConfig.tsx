import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
    formatError,
    getConfigValue,
    getGeneralConfigUsing,
    getGlobalConfigValue,
    getGovernmentDataShare,
} from '@/core'
import { getInnerUrl } from '@/utils'
import { loginRoutePath } from '@/routers/config'

interface GlobalConfigType {
    using: -1 | 0 | 1 | 2
    governmentSwitch: {
        on: boolean
    }
    local_app: boolean | null
    cssjj: boolean | null
    third_party: boolean | null
}

let globalConfig: GlobalConfigType = {
    using: -1,
    governmentSwitch: {
        on: false,
    },
    local_app: null,
    cssjj: null,
    third_party: null,
}

const defaultConfigs = {
    using: 0,
    government_data_share: false,
    local_app: true,
}

// 创建一个请求缓存，用于存储正在进行的请求
let pendingRequest: Promise<any> | null = null
let requestCache: any = null

/**
 * 封装的配置获取函数，确保相同请求只执行一次
 */
const getConfigValueWithCache = async (params: { key: string }) => {
    // 如果已经有缓存结果，直接返回
    if (requestCache) {
        return requestCache
    }

    // 如果已经有正在进行的请求，等待该请求完成
    if (pendingRequest) {
        return pendingRequest
    }

    // 创建新的请求
    pendingRequest = getConfigValue(params)
        .then((result) => {
            // 缓存结果
            requestCache = result
            // 清除正在进行的请求标记
            pendingRequest = null
            return result
        })
        .catch((error) => {
            // 清除正在进行的请求标记
            pendingRequest = null
            throw error
        })

    return pendingRequest
}

/**
 * 资源模式
 * @return -1 没从后端读之前的默认值
 * @return 0 后端还未初始化
 * @return 1 数据目录模式
 * @return 2 数据资源模式
 */
export const useGeneralConfig = (): [GlobalConfigType, () => Promise<void>] => {
    const [generalConfig, setGeneralConfig] =
        useState<GlobalConfigType>(globalConfig)
    const pathname = getInnerUrl(window.location.pathname)

    type ConfigValue = string | number | boolean

    /**
     * 解析配置值
     * @param value 配置值
     * @param key 配置键
     * @returns 解析后的配置值
     */
    const parseConfigValue = (value: string, key: string): ConfigValue => {
        // 特殊处理 using 字段
        if (key === 'using') {
            return Number(value)
        }

        // 处理布尔值
        if (value === 'true' || value === 'false') {
            return value === 'true'
        }

        // 处理数字
        if (!Number.isNaN(Number(value))) {
            return Number(value)
        }

        return value
    }

    /**
     * 修改全局配置
     * @param configData 配置数据
     * @returns 修改后的全局配置
     */
    const changeGeneralConfig = (
        configData: Array<{ key: string; value: any }>,
    ): any => {
        return configData.reduce((prev, curr) => {
            return {
                ...prev,
                [curr.key]: parseConfigValue(curr.value, curr.key),
            }
        }, {})
    }

    const getGeneralConfig = async () => {
        if (loginRoutePath.includes(pathname)) {
            return
        }
        try {
            if (generalConfig.using === -1) {
                const res = await getConfigValueWithCache({
                    key: 'using,government_data_share,local_app,cssjj,third_party',
                })
                requestCache = res
                const configs = {
                    ...defaultConfigs,
                    ...changeGeneralConfig(res),
                }
                setGeneralConfig({
                    using: configs.using,
                    governmentSwitch: {
                        on: configs.government_data_share,
                    },
                    local_app: configs.local_app,
                    cssjj: false, // 标品环境 固定为 false
                    third_party: configs.third_party,
                })

                globalConfig = {
                    using: configs.using,
                    governmentSwitch: {
                        on: configs.government_data_share,
                    },
                    local_app: configs.local_app,
                    cssjj: configs.cssjj,
                    third_party: configs.third_party,
                }
            } else {
                setGeneralConfig(generalConfig)
            }

            // let on = false
            // let localApp = true
            // if (configs.using === 1) {
            //     const data = await getGovernmentDataShare()
            //     const configData = await getGlobalConfigValue('local_app')
            //     localApp = configData.value === 'true'
            //     on = data.on
            // }
        } catch (err) {
            formatError(err)
        }
    }

    const updateGeneralConfig = async () => {
        try {
            const res = await getConfigValue({
                key: 'using,government_data_share,local_app,cssjj,third_party',
            })
            const configs = {
                ...defaultConfigs,
                ...changeGeneralConfig(res),
            }
            setGeneralConfig({
                using: configs.using,
                governmentSwitch: {
                    on: configs.government_data_share,
                },
                local_app: configs.local_app,
                cssjj: configs.cssjj,
                third_party: configs.third_party,
            })

            globalConfig = {
                using: configs.using,
                governmentSwitch: {
                    on: configs.government_data_share,
                },
                local_app: configs.local_app,
                cssjj: configs.cssjj,
                third_party: configs.third_party,
            }
        } catch (err) {
            formatError(err)
        }
    }
    useEffect(() => {
        if (generalConfig.using === -1) {
            getGeneralConfig()
        }
    }, [])

    return [useMemo(() => generalConfig, [generalConfig]), updateGeneralConfig]
}
