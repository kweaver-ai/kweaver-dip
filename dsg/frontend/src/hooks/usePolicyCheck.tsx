import { useState, useCallback, useEffect, useRef } from 'react'
import {
    AssetTypeEnum,
    PolicyActionEnum,
    IPolicyInfo,
    policyDetail,
    policyValidate,
    formatError,
    PolicyEffectEnum,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'

/**
 * 策略检查参数接口
 */
export interface IPolicyCheckParams {
    action: PolicyActionEnum
    object_id: string
    object_type: AssetTypeEnum
    subject_id: string
    subject_type: string
}

/**
 * 策略验证结果接口
 */
export interface IPolicyValidationResult {
    object_id: string
    object_type: AssetTypeEnum
    action: PolicyActionEnum
    effect: PolicyEffectEnum
}

/**
 * 数据策略检查结果接口
 */
export interface IPolicyResult {
    /** 策略详情信息 */
    policyInfo?: IPolicyInfo | null
    /** 允许的操作列表 */
    allowedActions: PolicyActionEnum[]
    /** 拒绝的操作列表 */
    deniedActions: PolicyActionEnum[]
    /** 是否允许读取 */
    canRead: boolean
    /** 是否允许下载 */
    canDownload: boolean
    /** 是否允许授权 */
    canAuth: boolean
    /** 是否允许分配 */
    canAllocate: boolean
    /** 加载状态 */
    loading: boolean

    /** 刷新策略信息 */
    refreshPolicy: () => void
    /** 检查特定操作权限 */
    checkSpecificAction: (action: PolicyActionEnum) => Promise<boolean>
    /** 手动获取策略详情（按需调用） */
    fetchPolicyDetail: () => Promise<void>
    /** 批量检查策略权限 */
    checkBatchPolicy: (
        resources: Array<{ id: string; type: AssetTypeEnum }>,
    ) => Promise<Record<string, Partial<IPolicyResult>>>
}

/**
 * 全局策略缓存管理
 */
class PolicyCacheManager {
    private static instance: PolicyCacheManager

    private cache = new Map<
        string,
        {
            policyInfo: IPolicyInfo | null
            allowedActions: PolicyActionEnum[]
            deniedActions: PolicyActionEnum[]
            timestamp: number
            loading: boolean
        }
    >()

    private pendingRequests = new Map<string, Promise<any>>()

    private readonly CACHE_EXPIRE_TIME = 5 * 60 * 1000 // 5分钟缓存过期

    static getInstance(): PolicyCacheManager {
        if (!PolicyCacheManager.instance) {
            PolicyCacheManager.instance = new PolicyCacheManager()
        }
        return PolicyCacheManager.instance
    }

    private static getCacheKey(
        objectId: string,
        objectType: AssetTypeEnum,
        userId: string,
    ): string {
        return `${objectId}:${objectType}:${userId}`
    }

    private isCacheValid(timestamp: number): boolean {
        return Date.now() - timestamp < this.CACHE_EXPIRE_TIME
    }

    getCachedData(objectId: string, objectType: AssetTypeEnum, userId: string) {
        const key = PolicyCacheManager.getCacheKey(objectId, objectType, userId)
        const cached = this.cache.get(key)

        if (cached && this.isCacheValid(cached.timestamp)) {
            return cached
        }

        return null
    }

    setCachedData(
        objectId: string,
        objectType: AssetTypeEnum,
        userId: string,
        data: {
            policyInfo: IPolicyInfo | null
            allowedActions: PolicyActionEnum[]
            deniedActions: PolicyActionEnum[]
        },
    ) {
        const key = PolicyCacheManager.getCacheKey(objectId, objectType, userId)
        this.cache.set(key, {
            ...data,
            timestamp: Date.now(),
            loading: false,
        })
    }

    setLoading(
        objectId: string,
        objectType: AssetTypeEnum,
        userId: string,
        loading: boolean,
    ) {
        const key = PolicyCacheManager.getCacheKey(objectId, objectType, userId)
        const existing = this.cache.get(key)
        if (existing) {
            existing.loading = loading
        }
    }

    hasPendingRequest(
        objectId: string,
        objectType: AssetTypeEnum,
        userId: string,
    ): boolean {
        const key = PolicyCacheManager.getCacheKey(objectId, objectType, userId)
        return this.pendingRequests.has(key)
    }

    addPendingRequest(
        objectId: string,
        objectType: AssetTypeEnum,
        userId: string,
        request: Promise<any>,
    ) {
        const key = PolicyCacheManager.getCacheKey(objectId, objectType, userId)
        this.pendingRequests.set(key, request)

        // 请求完成后清理
        request.finally(() => {
            this.pendingRequests.delete(key)
        })
    }

    clearCache() {
        this.cache.clear()
        this.pendingRequests.clear()
    }

    clearSpecificCache(
        objectId: string,
        objectType: AssetTypeEnum,
        userId: string,
    ) {
        const key = PolicyCacheManager.getCacheKey(objectId, objectType, userId)
        this.cache.delete(key)
    }
}

/**
 * 使用数据策略检查的hooks
 * @param objectId 资源ID
 * @param objectType 资源类型
 * @param options 配置选项
 * @param options.autoFetch 是否自动获取策略详情，默认false
 * @param options.autoValidate 是否自动验证权限，默认true
 * @param options.checkKeys 检查的权限列表，默认[Read, Download, Auth, Allocate]
 * @returns 数据策略检查结果
 */
export const usePolicyCheck = (
    objectId: string,
    objectType: AssetTypeEnum,
    options: {
        autoFetch?: boolean
        autoValidate?: boolean
        checkKeys?: PolicyActionEnum[] // 检查的权限列表
        toast?: any
        skipRoleCheck?: boolean // 是否跳过角色检查，仅查询实际策略权限
    } = {},
): IPolicyResult => {
    const {
        autoFetch = false,
        autoValidate = true,
        skipRoleCheck = true,
        checkKeys = [
            PolicyActionEnum.Read,
            PolicyActionEnum.Download,
            PolicyActionEnum.Auth,
            PolicyActionEnum.Allocate,
        ],
    } = options
    const [userId] = useCurrentUser('ID')
    const [policyInfo, setPolicyInfo] = useState<IPolicyInfo | null>(null)
    const [allowedActions, setAllowedActions] = useState<PolicyActionEnum[]>([])
    const [deniedActions, setDeniedActions] = useState<PolicyActionEnum[]>([])
    const [loading, setLoading] = useState(false)

    const cacheManager = PolicyCacheManager.getInstance()
    const isInitialized = useRef(false)

    /**
     * 获取策略检查参数
     */
    const getCheckParams = useCallback(
        (
            object_id: string,
            object_type: AssetTypeEnum,
        ): IPolicyCheckParams[] => {
            return checkKeys.map((action) => ({
                action,
                object_id,
                object_type,
                subject_id: userId,
                subject_type: 'user',
            }))
        },
        [userId, checkKeys],
    )

    /**
     * 获取策略详情（带缓存）
     */
    const fetchPolicyDetail = useCallback(async () => {
        if (!objectId || !objectType || !userId) return

        // 检查缓存
        const cached = cacheManager.getCachedData(objectId, objectType, userId)
        if (cached) {
            setPolicyInfo(cached.policyInfo)
            setAllowedActions(cached.allowedActions)
            setDeniedActions(cached.deniedActions)
            setLoading(false)
            return
        }

        // 检查是否有正在进行的请求
        if (cacheManager.hasPendingRequest(objectId, objectType, userId)) {
            return
        }

        try {
            setLoading(true)
            cacheManager.setLoading(objectId, objectType, userId, true)

            const request = policyDetail(objectId, objectType)
            cacheManager.addPendingRequest(
                objectId,
                objectType,
                userId,
                request,
            )

            const result = await request
            setPolicyInfo(result)

            // 更新缓存
            cacheManager.setCachedData(objectId, objectType, userId, {
                policyInfo: result,
                allowedActions: [],
                deniedActions: [],
            })
        } catch (err) {
            formatError(err, options?.toast)
        } finally {
            setLoading(false)
            cacheManager.setLoading(objectId, objectType, userId, false)
        }
    }, [objectId, objectType, userId, cacheManager])

    /**
     * 验证策略权限（带缓存）
     */
    const validatePolicy = useCallback(async () => {
        if (!objectId || !objectType || !userId) return

        // 检查缓存
        const cached = cacheManager.getCachedData(objectId, objectType, userId)
        if (cached && cached.allowedActions.length > 0) {
            setAllowedActions(cached.allowedActions)
            setDeniedActions(cached.deniedActions)
            return
        }

        try {
            setLoading(true)

            const checkParams = getCheckParams(objectId, objectType)
            const validationResults: IPolicyValidationResult[] =
                await policyValidate(checkParams, skipRoleCheck)

            // 分离允许和拒绝的操作
            const allowed: PolicyActionEnum[] = []
            const denied: PolicyActionEnum[] = []

            validationResults.forEach((result) => {
                if (result.effect === PolicyEffectEnum.Allow) {
                    allowed.push(result.action)
                } else {
                    denied.push(result.action)
                }
            })

            setAllowedActions(allowed)
            setDeniedActions(denied)

            // 更新缓存
            const currentPolicyInfo =
                cacheManager.getCachedData(objectId, objectType, userId)
                    ?.policyInfo || null
            cacheManager.setCachedData(objectId, objectType, userId, {
                policyInfo: currentPolicyInfo,
                allowedActions: allowed,
                deniedActions: denied,
            })
        } catch (err) {
            formatError(err, options?.toast)
        } finally {
            setLoading(false)
        }
    }, [
        objectId,
        objectType,
        userId,
        getCheckParams,
        cacheManager,
        skipRoleCheck,
    ])

    /**
     * 检查特定操作权限
     */
    const checkSpecificAction = useCallback(
        async (action: PolicyActionEnum): Promise<boolean> => {
            if (!objectId || !objectType || !userId) return false

            try {
                const checkParams: IPolicyCheckParams[] = [
                    {
                        action,
                        object_id: objectId,
                        object_type: objectType,
                        subject_id: userId,
                        subject_type: 'user',
                    },
                ]

                const results = await policyValidate(checkParams, skipRoleCheck)
                return results[0]?.effect === PolicyEffectEnum.Allow
            } catch (err) {
                formatError(err, options?.toast)
                return false
            }
        },
        [objectId, objectType, userId, skipRoleCheck],
    )

    /**
     * 批量检查策略权限
     */
    const checkBatchPolicy = async (
        resources: Array<{ id: string; type: AssetTypeEnum }>,
    ): Promise<Record<string, Partial<IPolicyResult>>> => {
        if (!resources.length) return {}
        try {
            setLoading(true)
            // 构建批量检查参数
            const params: any = resources.reduce((acc: any[], { id, type }) => {
                const checkParams = checkKeys.map((action) => ({
                    action,
                    object_id: id,
                    object_type: type,
                    subject_id: userId,
                    subject_type: 'user',
                }))
                return [...acc, ...checkParams]
            }, [])

            // 批量验证策略权限
            const validationResults = await policyValidate(
                params,
                skipRoleCheck,
            )

            // 按资源ID分组结果
            const allowItems = (validationResults || []).filter(
                (o) => o.effect === PolicyEffectEnum.Allow,
            )
            const denyItems = (validationResults || []).filter(
                (o) => o.effect === PolicyEffectEnum.Deny,
            )

            // 按资源ID分组允许的操作
            const allowedGroupById = allowItems.reduce((acc, item) => {
                acc[item.object_id] = acc[item.object_id] || []
                acc[item.object_id].push(item.action)
                return acc
            }, {} as Record<string, PolicyActionEnum[]>)

            // 按资源ID分组拒绝的操作
            const deniedGroupById = denyItems.reduce((acc, item) => {
                acc[item.object_id] = acc[item.object_id] || []
                acc[item.object_id].push(item.action)
                return acc
            }, {} as Record<string, PolicyActionEnum[]>)

            // 构建最终结果
            const batchResults: Record<string, Partial<IPolicyResult>> = {}

            resources.forEach(({ id, type }) => {
                const allowed = allowedGroupById[id] || []
                const denied = deniedGroupById[id] || []

                batchResults[id] = {
                    allowedActions: allowed,
                    deniedActions: denied,
                    canRead: allowed.includes(PolicyActionEnum.Read),
                    canDownload: allowed.includes(PolicyActionEnum.Download),
                    canAuth: allowed.includes(PolicyActionEnum.Auth),
                    canAllocate: allowed.includes(PolicyActionEnum.Allocate),
                }
            })
            return batchResults
        } catch (err) {
            formatError(err, options?.toast)
            return {}
        } finally {
            setLoading(false)
        }
    }

    /**
     * 刷新策略信息
     */
    const refreshPolicy = useCallback(() => {
        // 清除缓存，强制重新获取
        if (objectId && objectType && userId) {
            cacheManager.clearSpecificCache(objectId, objectType, userId)
        }
        fetchPolicyDetail()
        validatePolicy()
    }, [
        fetchPolicyDetail,
        validatePolicy,
        objectId,
        objectType,
        userId,
        cacheManager,
    ])

    // 计算权限状态
    const canRead = allowedActions.includes(PolicyActionEnum.Read)
    const canDownload = allowedActions.includes(PolicyActionEnum.Download)
    const canAuth = allowedActions.includes(PolicyActionEnum.Auth)
    const canAllocate = allowedActions.includes(PolicyActionEnum.Allocate)

    // 初始化逻辑
    useEffect(() => {
        if (!objectId || !objectType || !userId || isInitialized.current) return

        isInitialized.current = true

        // 检查缓存
        const cached = cacheManager.getCachedData(objectId, objectType, userId)
        if (cached) {
            setPolicyInfo(cached.policyInfo)
            setAllowedActions(cached.allowedActions)
            setDeniedActions(cached.deniedActions)
            setLoading(false)
        } else {
            // 如果没有缓存，根据配置决定是否自动获取
            if (autoValidate) {
                validatePolicy()
            }
            if (autoFetch) {
                fetchPolicyDetail()
            }
        }
    }, [
        objectId,
        objectType,
        userId,
        autoFetch,
        autoValidate,
        validatePolicy,
        fetchPolicyDetail,
        cacheManager,
    ])

    // 当参数变化时重置初始化状态
    useEffect(() => {
        isInitialized.current = false
    }, [objectId, objectType, userId])

    return {
        policyInfo,
        allowedActions,
        deniedActions,
        canRead,
        canDownload,
        canAuth,
        canAllocate,
        loading,
        refreshPolicy,
        checkSpecificAction,
        fetchPolicyDetail,
        checkBatchPolicy,
    }
}

// 导出缓存管理器，供外部使用
export const policyCacheManager = PolicyCacheManager.getInstance()
