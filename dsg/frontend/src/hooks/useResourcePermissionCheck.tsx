import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { checkRescItemsHavePermission, PolicyDataRescType } from '@/core'

/**
 * 资源信息
 */
export interface ResourceInfo {
    /** 资源ID */
    id: string
    /** 资源类型 */
    type: PolicyDataRescType
}

/**
 * 资源权限策略检测结果
 */
export interface ResourcePermissionResult {
    /** 资源ID */
    id: string
    /** 资源类型 */
    type: PolicyDataRescType
    /** 是否配置了策略启用 */
    hasAuditEnablePolicy: boolean
    /** 是否设置了启用内置策略 */
    hasInnerEnablePolicy: boolean
    /** 是否同类型资源有启用策略 */
    hasCustomEnablePolicy: boolean
}

/**
 * 资源权限策略检测hooks返回值
 */
export interface UseResourcePermissionCheckReturn {
    /** 检测结果 */
    results: ResourcePermissionResult[]
    /** 是否正在加载 */
    loading: boolean
    /** 检测单个资源 */
    checkSingleResource: (
        resourceInfo: ResourceInfo,
    ) => Promise<ResourcePermissionResult | null>
    /** 检测多个资源 */
    checkMultipleResources: (
        resourceInfos: ResourceInfo[],
    ) => Promise<ResourcePermissionResult[]>
    /** 根据ID获取检测结果 */
    getResultById: (id: string) => ResourcePermissionResult | undefined
    /** 清除结果 */
    clearResults: () => void
}

export const useResourcePermissionCheck = (
    initialResources?: ResourceInfo[],
): UseResourcePermissionCheckReturn => {
    const [results, setResults] = useState<ResourcePermissionResult[]>([])
    const [loading, setLoading] = useState(false)

    // 使用 useRef 来跟踪已经检查过的资源，避免重复检查
    const checkedResourcesRef = useRef<Set<string>>(new Set())

    // 使用 useRef 来缓存初始资源，避免每次渲染都重新检查
    const initialResourcesRef = useRef<ResourceInfo[]>([])

    /**
     * 处理API返回的数据，转换为统一格式
     */
    const processApiResult = useCallback(
        (
            apiResult: any,
            resourceInfos: ResourceInfo[],
        ): ResourcePermissionResult[] => {
            // 内置策略是否设置
            const buildInAuditPolicy = {
                [PolicyDataRescType.LOGICALVIEW]:
                    apiResult.data_view_has_built_in_audit,
                [PolicyDataRescType.INDICATOR]:
                    apiResult.indicator_has_built_in_audit,
                [PolicyDataRescType.INTERFACE]:
                    apiResult.interface_svc_has_built_in_audit,
            }

            // 自定义策略是否设置
            const customAuditPolicy = {
                [PolicyDataRescType.LOGICALVIEW]:
                    apiResult.data_view_has_customize_audit,
                [PolicyDataRescType.INDICATOR]:
                    apiResult.indicator_has_customize_audit,
                [PolicyDataRescType.INTERFACE]:
                    apiResult.interface_svc_has_customize_audit,
            }

            return resourceInfos.map((resourceInfo) => {
                const { id, type } = resourceInfo
                const resourcePolicyInfo = apiResult?.resources?.find(
                    (rItem: any) => rItem.id === id,
                )

                // 是否设置了启用内置策略
                const hasInnerEnablePolicy = buildInAuditPolicy[type] || false
                // 是否同类型资源有启用策略
                const hasCustomEnablePolicy = customAuditPolicy[type] || false
                // 是否设置了策略（不管策略是否启用）
                const hasAuditPolicy = !!resourcePolicyInfo
                // 是否设置了启用策略（内置启用或启用自定义策略选了当前资源）
                const hasAuditEnablePolicy =
                    hasInnerEnablePolicy ||
                    (hasCustomEnablePolicy && hasAuditPolicy)

                return {
                    id,
                    type,
                    hasAuditEnablePolicy,
                    hasInnerEnablePolicy,
                    hasCustomEnablePolicy,
                }
            })
        },
        [],
    )

    /**
     * 检测单个资源
     */
    const checkSingleResource = useCallback(
        async (
            resourceInfo: ResourceInfo,
        ): Promise<ResourcePermissionResult | null> => {
            if (!resourceInfo?.id) return null

            try {
                setLoading(true)
                const apiResult = await checkRescItemsHavePermission([
                    resourceInfo.id,
                ])
                const processedResults = processApiResult(apiResult, [
                    resourceInfo,
                ])

                const result = processedResults[0]
                if (result) {
                    setResults((prev) => {
                        const existingIndex = prev.findIndex(
                            (item) => item.id === resourceInfo.id,
                        )
                        if (existingIndex >= 0) {
                            const newResults = [...prev]
                            newResults[existingIndex] = result
                            return newResults
                        }
                        return [...prev, result]
                    })
                }

                return result || null
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('check single resource error:', error)
                return null
            } finally {
                setLoading(false)
            }
        },
        [processApiResult],
    )

    /**
     * 检测多个资源
     */
    const checkMultipleResources = useCallback(
        async (
            resourceInfos: ResourceInfo[],
        ): Promise<ResourcePermissionResult[]> => {
            if (!resourceInfos?.length) return []

            try {
                setLoading(true)
                const ids = resourceInfos.map((info) => info.id)
                const apiResult = await checkRescItemsHavePermission(ids)
                const processedResults = processApiResult(
                    apiResult,
                    resourceInfos,
                )

                setResults((prev) => {
                    const newResults = [...prev]
                    processedResults.forEach((result) => {
                        const existingIndex = newResults.findIndex(
                            (item) => item.id === result.id,
                        )
                        if (existingIndex >= 0) {
                            newResults[existingIndex] = result
                        } else {
                            newResults.push(result)
                        }
                    })
                    return newResults
                })

                return processedResults
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('check multiple resources error:', error)
                return []
            } finally {
                setLoading(false)
            }
        },
        [processApiResult],
    )

    /**
     * 根据ID获取检测结果
     */
    const getResultById = useCallback(
        (id: string): ResourcePermissionResult | undefined => {
            return results.find((result) => result.id === id)
        },
        [results],
    )

    /**
     * 清除结果
     */
    const clearResults = useCallback(() => {
        setResults([])
        checkedResourcesRef.current.clear()
    }, [])

    // 优化：使用 useEffect 替代 useMemo，避免在渲染过程中调用异步函数
    useEffect(() => {
        if (initialResources?.length) {
            // 检查是否已经处理过这些资源
            const newResources = initialResources.filter(
                (resource) => !checkedResourcesRef.current.has(resource.id),
            )

            if (newResources.length > 0) {
                // 标记这些资源为已检查
                newResources.forEach((resource) => {
                    checkedResourcesRef.current.add(resource.id)
                })

                // 更新缓存
                initialResourcesRef.current = initialResources

                // 检查新资源
                checkMultipleResources(newResources)
            }
        }
    }, [initialResources, checkMultipleResources])

    return {
        results,
        loading,
        checkSingleResource,
        checkMultipleResources,
        getResultById,
        clearResults,
    }
}

export default useResourcePermissionCheck
