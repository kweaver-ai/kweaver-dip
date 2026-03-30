import React, {
    useState,
    useCallback,
    useMemo,
    useEffect,
    createContext,
    useContext,
    useRef,
} from 'react'
import { has } from 'lodash'
import {
    accessRolesIds,
    formatError,
    getUserDetails,
    IPermissions,
    permissionMap,
    PermissionScope,
    rolePermissions,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { loginRoutePath } from '@/routers/config'
import { getInnerUrl } from '@/utils'

interface PermissionsContextType {
    permissions: IPermissions[] | undefined
    checking: boolean
    error: any
    noPermission: boolean
    refresh: () => Promise<void>
    checkPermission: (
        ids?: { key: string; scope?: PermissionScope }[] | string,
        mode?: 'and' | 'or' | 'only',
        ignoreScope?: boolean,
    ) => boolean | null
    checkPermissions: (
        ids?: { key: string; scope: PermissionScope }[][] | string,
        modeIn?: 'and' | 'or',
        modeOut?: 'and' | 'or',
        ignoreScope?: boolean,
    ) => boolean | null
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: undefined,
    checking: true,
    error: null,
    noPermission: false,
    refresh: async () => {},
    checkPermission: () => null,
    checkPermissions: () => null,
})

export const useUserPermCtx = () => useContext(PermissionsContext)

const UserPermissionProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const pathname = getInnerUrl(window.location.pathname)
    const [userInfo] = useCurrentUser()
    const [permissions, setPermissions] = useState<IPermissions[] | undefined>()
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<any>(null)
    const [noPermission, setNoPermission] = useState<any>(false)
    const requestIdRef = useRef(0)
    const abortControllerRef = useRef<AbortController | null>(null)

    const isLogin = useMemo(() => {
        return !loginRoutePath.includes(pathname)
    }, [pathname])

    // 重置权限状态
    const resetPermissions = useCallback(() => {
        setPermissions([])
        setChecking(false)
        setError(null)
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }
    }, [])

    const refresh = useCallback(async () => {
        // 终止之前的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
            abortControllerRef.current = null
        }

        if (!isLogin || !userInfo?.ID) {
            resetPermissions()
            return
        }

        const controller = new AbortController()
        abortControllerRef.current = controller
        const currentRequestId = Date.now()
        requestIdRef.current = currentRequestId

        try {
            setChecking(true)
            setError(null)
            const res = await getUserDetails(userInfo?.ID, {
                signal: controller.signal,
            })
            // 确保是最新的请求
            if (currentRequestId === requestIdRef.current) {
                const totalPermissions = res?.permissions?.reduce(
                    (acc, cur) => {
                        const index = acc.findIndex((it) => it.id === cur.id)
                        if (index !== -1) {
                            if (cur.scope === PermissionScope.All) {
                                acc.splice(index, 1, cur)
                            }
                        } else {
                            acc.push(cur)
                        }
                        return acc
                    },
                    [] as IPermissions[],
                )
                setPermissions(totalPermissions || [])
                // 权限判断改为基于菜单数据，只要有菜单数据就认为有权限
                setNoPermission(false)
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                if (currentRequestId === requestIdRef.current) {
                    setError(err)
                    formatError(err)
                }
            }
        } finally {
            if (currentRequestId === requestIdRef.current) {
                setChecking(false)
            }
            if (abortControllerRef.current === controller) {
                abortControllerRef.current = null
            }
        }
    }, [userInfo?.ID, isLogin, resetPermissions])

    useEffect(() => {
        refresh()
    }, [refresh])

    useEffect(() => {
        return () => {
            resetPermissions()
        }
    }, [])

    /**
     * 检查单组权限
     * @param ids 权限key组 | 权限key
     * @param mode 权限模式 默认and，and-与，or-或, only-仅
     * @returns 是否拥有权限
     */
    const checkPermission = useCallback(
        (
            ids?: { key: string; scope?: PermissionScope }[] | string,
            mode: 'and' | 'or' | 'only' = 'and',
            ignoreScope: boolean = false,
        ) => {
            return true
            // if (!ids) return true
            // if (checking) return null
            // if (!permissions) return false

            // const permissionIds = new Set(permissions.map((p) => p.id))
            // if (typeof ids === 'string') {
            //     if (has(rolePermissions, ids)) {
            //         return checkPermission(
            //             rolePermissions[ids],
            //             mode,
            //             ignoreScope,
            //         )
            //     }
            //     if (has(permissionMap, ids)) {
            //         return permissionIds.has(permissionMap[ids].id)
            //     }
            //     return permissionIds.has(ids)
            // }

            // if (ids.length === 0) return true
            // // 忽略权限范围
            // if (ignoreScope) {
            //     const newIds: string[] = ids
            //         .map((item) => permissionMap[item.key].id)
            //         .filter((item) => item)
            //     if (mode === 'only') {
            //         return (
            //             newIds.every((id) => permissionIds.has(id)) &&
            //             newIds.length === permissionIds.size
            //         )
            //     }
            //     if (mode === 'or') {
            //         return newIds.some((id) => permissionIds.has(id))
            //     }
            //     return newIds.every((id) => permissionIds.has(id))
            // }
            // // 不忽略权限范围
            // const newIds = ids
            //     .map((item) => ({
            //         ...item,
            //         id: permissionMap[item.key].id,
            //     }))
            //     .filter((item) => item.id)

            // const checkFn = (item: {
            //     id: string
            //     key: string
            //     scope?: PermissionScope
            // }) => {
            //     const findItem = permissions.find((p) => p.id === item.id)
            //     if (!findItem) return false
            //     if (item.scope === PermissionScope.Organization) {
            //         return true
            //     }
            //     return (
            //         item.scope === PermissionScope.All &&
            //         findItem.scope === PermissionScope.All
            //     )
            // }
            // if (mode === 'only') {
            //     return (
            //         newIds.every((item) => checkFn(item)) &&
            //         newIds.length === permissionIds.size
            //     )
            // }
            // if (mode === 'or') {
            //     return newIds.some((item) => checkFn(item))
            // }
            // return newIds.every((item) => checkFn(item))
        },
        [permissions, checking],
    )

    /**
     * 检查多组权限
     * @param ids 多组权限key | HasAccess值 | 权限key
     * @param modeIn 组内权限模式
     * @param modeOut 组间权限模式
     * @returns 是否拥有权限
     */
    const checkPermissions = useCallback(
        (
            ids?: { key: string; scope: PermissionScope }[][] | string,
            modeIn: 'and' | 'or' = 'and',
            modeOut: 'and' | 'or' = 'or',
            ignoreScope: boolean = false,
        ) => {
            return true
            // if (!ids) return true
            // if (checking) return null
            // if (!permissions) return false

            // if (typeof ids === 'string') {
            //     if (has(accessRolesIds, ids)) {
            //         return checkPermissions(
            //             accessRolesIds[ids] as any[][],
            //             modeIn,
            //             modeOut,
            //             ignoreScope,
            //         )
            //     }
            //     return checkPermission(ids, modeIn, ignoreScope)
            // }

            // if (ids.length === 0) return true
            // if (modeOut === 'and') {
            //     return ids.every((id) =>
            //         checkPermission(id, modeIn, ignoreScope),
            //     )
            // }
            // return ids.some((id) => checkPermission(id, modeIn, ignoreScope))
        },
        [permissions, checking],
    )

    const contextValue = useMemo(
        () => ({
            permissions,
            checking,
            error,
            noPermission,
            refresh,
            checkPermission,
            checkPermissions,
        }),
        [
            permissions,
            checking,
            error,
            noPermission,
            refresh,
            checkPermission,
            checkPermissions,
        ],
    )

    return (
        <PermissionsContext.Provider value={contextValue}>
            {children}
        </PermissionsContext.Provider>
    )
}

export default UserPermissionProvider
