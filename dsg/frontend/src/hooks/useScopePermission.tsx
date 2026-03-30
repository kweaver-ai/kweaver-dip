import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useMemo,
} from 'react'
import { getUserDetails } from '@/core'
import { PermissionScope } from '@/core/apis'
import { useCurrentUser } from './useCurrentUser'

// 用户权限范围上下文类型
interface ScopePermissionContextType {
    // 用户权限范围
    scope: PermissionScope
    // 用户权限列表
    permissions: string[]
    // 加载状态
    loading: boolean
    // 刷新权限数据
    refreshPermissions: () => Promise<void>
    // 是否为全部范围
    isAllScope: boolean
    // 是否为本组织范围
    isOrganizationScope: boolean
}

// 创建上下文
const ScopePermissionContext = createContext<
    ScopePermissionContextType | undefined
>(undefined)

interface ScopePermissionProviderProps {
    children: React.ReactNode
}

export const ScopePermissionProvider: React.FC<
    ScopePermissionProviderProps
> = ({ children }) => {
    const [currentUser] = useCurrentUser()
    const [scope, setScope] = useState<PermissionScope>(
        PermissionScope.Organization,
    )
    const [permissions, setPermissions] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    // 获取用户权限数据
    const fetchUserPermissions = async (targetUserId?: string) => {
        try {
            setLoading(true)
            // 如果没有提供 userId，使用当前登录用户的ID
            const currentUserId = targetUserId || currentUser?.ID

            if (!currentUserId) {
                // console.warn('未找到用户ID，无法获取权限信息')
                setScope(PermissionScope.Organization)
                setPermissions([])
                return
            }

            const response = await getUserDetails(currentUserId)

            // 从 getUserDetails 返回的 permissions 字段中提取权限信息
            // permissions 格式: [{ id, scope }]
            const permissionsList = response?.permissions || []
            const scopeValue =
                permissionsList.length > 0
                    ? (permissionsList[0].scope as PermissionScope)
                    : PermissionScope.Organization

            setScope(scopeValue)
            setPermissions(permissionsList.map((p) => p.id))
        } catch (error) {
            // console.error('获取用户权限失败:', error)
            // 发生错误时使用默认值
            setScope(PermissionScope.Organization)
            setPermissions([])
        } finally {
            setLoading(false)
        }
    }

    // 刷新权限数据
    const refreshPermissions = async () => {
        await fetchUserPermissions()
    }

    const isAllScope = scope === PermissionScope.All
    const isOrganizationScope = scope === PermissionScope.Organization

    useEffect(() => {
        fetchUserPermissions()
    }, [currentUser?.ID])

    const contextValue: ScopePermissionContextType = useMemo(
        () => ({
            scope,
            permissions,
            loading,
            refreshPermissions,
            isAllScope,
            isOrganizationScope,
        }),
        [
            scope,
            permissions,
            loading,
            refreshPermissions,
            isAllScope,
            isOrganizationScope,
        ],
    )

    return (
        <ScopePermissionContext.Provider value={contextValue}>
            {children}
        </ScopePermissionContext.Provider>
    )
}

// 用于在组件中使用权限范围
export const useScopePermission = (): ScopePermissionContextType => {
    const context = useContext(ScopePermissionContext)

    if (context === undefined) {
        throw new Error(
            'useScopePermission must be used within ScopePermissionProvider',
        )
    }

    return context
}

// 用于检查特定权限
export const useScopePermissionCheck = () => {
    const { scope, permissions, isAllScope, isOrganizationScope } =
        useScopePermission()

    // 检查是否拥有特定权限
    const hasPermission = (permissionId: string): boolean => {
        return permissions.includes(permissionId)
    }

    // 检查是否拥有多个权限中的任意一个
    const hasAnyPermission = (permissionIds: string[]): boolean => {
        return permissionIds.some((id) => permissions.includes(id))
    }

    // 检查是否拥有多个权限中的所有权限
    const hasAllPermissions = (permissionIds: string[]): boolean => {
        return permissionIds.every((id) => permissions.includes(id))
    }

    return {
        scope,
        permissions,
        isAllScope,
        isOrganizationScope,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
    }
}

export default useScopePermission
