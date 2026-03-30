import { useMemo } from 'react'
import { useMenu, MenuAction } from '@/providers/MenuProvider'
import { useAuthContext } from '@/providers/AuthProvider'

export type AccessTarget = {
    /** 使用 key 判定菜单权限 */
    key: string
}

export type AccessApi = {
    /** 权限数据是否已准备好 */
    ready: boolean

    /** 是否能访问页面/路由 - 菜单级 */
    canAccess: (target: AccessTarget) => boolean

    /** 是否能执行动作 - 按钮级 */
    canAction: (action: MenuAction, target: AccessTarget) => boolean

    /** 一次校验多个动作 - 必须全部满足 */
    canAll: (actions: MenuAction[], target: AccessTarget) => boolean

    /** 是否至少拥有其中一个动作 */
    canAny: (actions: MenuAction[], target: AccessTarget) => boolean

    /** 快捷方法：是否有创建权限 */
    canCreate: (target: AccessTarget) => boolean

    /** 快捷方法：是否有更新权限 */
    canUpdate: (target: AccessTarget) => boolean

    /** 快捷方法：是否有读取权限 */
    canRead: (target: AccessTarget) => boolean

    /** 快捷方法：是否有删除权限 */
    canDelete: (target: AccessTarget) => boolean

    /** 快捷方法：是否有导入权限 */
    canImport: (target: AccessTarget) => boolean

    /** 快捷方法：是否有下线权限 */
    canOffline: (target: AccessTarget) => boolean

    /** 获取指定 key 的所有可用 actions */
    getActions: (target: AccessTarget) => MenuAction[]
}

export function useAccess(): AccessApi {
    const { loading: authLoading } = useAuthContext()
    const { loading: menuLoading, accessIndex } = useMenu()

    const ready = !authLoading && !menuLoading

    return useMemo<AccessApi>(() => {
        const canAccess = (t: AccessTarget): boolean => {
            if (!ready) return false
            return accessIndex.pageKeys.has(t.key)
        }

        const canAction = (action: MenuAction, t: AccessTarget): boolean => {
            if (!ready) return false

            // 页面都不可访问时，动作也不允许
            if (!canAccess(t)) return false

            const actions = accessIndex.actionsByKey.get(t.key)
            return actions ? actions.has(action) : false
        }

        const canAll = (actions: MenuAction[], t: AccessTarget): boolean =>
            actions.every((a) => canAction(a, t))

        const canAny = (actions: MenuAction[], t: AccessTarget): boolean =>
            actions.some((a) => canAction(a, t))

        const canCreate = (t: AccessTarget): boolean => canAction('create', t)
        const canUpdate = (t: AccessTarget): boolean => canAction('update', t)
        const canRead = (t: AccessTarget): boolean => canAction('read', t)
        const canDelete = (t: AccessTarget): boolean => canAction('delete', t)
        const canImport = (t: AccessTarget): boolean => canAction('import', t)
        const canOffline = (t: AccessTarget): boolean => canAction('offline', t)

        const getActions = (t: AccessTarget): MenuAction[] => {
            const actions = accessIndex.actionsByKey.get(t.key)
            return actions ? Array.from(actions) : []
        }

        return {
            ready,
            canAccess,
            canAction,
            canAll,
            canAny,
            canCreate,
            canUpdate,
            canRead,
            canDelete,
            canImport,
            canOffline,
            getActions,
        }
    }, [accessIndex, ready])
}
