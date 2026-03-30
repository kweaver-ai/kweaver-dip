import { useEffect, useState } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import styles from '../styles.module.less'
import { findFirstPath, useMenus } from '@/hooks/useMenus'
import { allRoleList, goEffectivePath, HasAccess, LoginPlatform } from '@/core'
import { getActualUrl, getPlatformNumber, useQuery } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'

function LoginSuccess() {
    const navigate = useNavigate()
    const query = useQuery()
    const targetUrl = query.get('targetUrl') || ''

    const [userInfo] = useCurrentUser()
    const [menus, getMenus] = useMenus()
    const {
        checkPermission,
        checkPermissions,
        noPermission,
        permissions = [],
        refresh,
    } = useUserPermCtx()
    const platform = getPlatformNumber()

    useEffect(() => {
        if (noPermission) {
            navigate('/login-failed')
        }
    }, [noPermission])

    useEffect(() => {
        if (userInfo?.ID) {
            refresh()
        }
    }, [userInfo?.ID])

    useEffect(() => {
        if (menus.length > 0 && permissions.length > 0) {
            changePageByAccess()
        }
    }, [menus, permissions])

    /**
     * 根据权限值跳转至对应的模块
     */
    const changePageByAccess = () => {
        const hasResourceAccess = checkPermissions(HasAccess.isHasBusiness)
        const isAppDeveloper = checkPermission(allRoleList.ApplicationDeveloper)
        const isOnlySystemMgm = checkPermission(allRoleList.TCSystemMgm, 'only')
        // 仅有系统管理员角色，默认进入配置页面  其他进入门户首页
        if (isOnlySystemMgm) {
            goEffectivePath(menus, platform, isOnlySystemMgm, navigate)
        } else {
            goEffectivePath(
                menus,
                LoginPlatform.drmp,
                isOnlySystemMgm,
                (path) => {
                    if (targetUrl) {
                        navigate(targetUrl)
                    } else {
                        window.open(
                            getActualUrl(path, true, LoginPlatform.drmp),
                            '_self',
                        )
                    }
                },
            )
        }
    }

    return (
        <div className={styles.loginSuccess}>
            <Spin />
        </div>
    )
}

export default LoginSuccess
