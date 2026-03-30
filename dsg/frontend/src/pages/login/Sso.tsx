import { Spin } from 'antd'
import Cookies from 'js-cookie'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlatformNumber, useQuery } from '@/utils'
import { useMenus, getRouters } from '@/hooks/useMenus'
import {
    allRoleList,
    goEffectivePath,
    HasAccess,
    loginConfigs,
    ssoGet,
} from '@/core'
import styles from '../styles.module.less'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

function Sso() {
    const navigate = useNavigate()
    const platform = getPlatformNumber()
    const query = useQuery()
    const targetUrl = query.get('targetUrl') || ''
    const { checkPermission, checkPermissions, refresh } = useUserPermCtx()
    const [menus, getMenus] = useMenus()

    useEffect(() => {
        const { href } = window.location
        const url = new URL(href)

        // 获取查询字符串
        const queryString = url.search
        if (queryString) {
            toSso(queryString)
        }
    }, [])

    const toSso = async (params) => {
        try {
            const res = await loginConfigs()
            const thirdpartyid = res?.thirdauth?.id || ''
            const { access_token } = await ssoGet(
                `${params}&thirdpartyid=${thirdpartyid}`,
            )
            Cookies.set('af.oauth2_token', access_token, { httpOnly: false })
            // const menusRes = await getLoginMenus({ platform, un_filter: false })
            // const menus = getRouters([...(menusRes?.menus || [])])
            // await refresh()
            // if (targetUrl) {
            //     navigate(targetUrl)
            // } else {
            //     changePageByAccess(menus)
            // }
            await getMenus()
            navigate(`/login-success?targetUrl=${targetUrl}`)
        } catch (error) {
            // setIsLogin(false)
        }
    }

    /**
     * 根据权限值跳转至对应的模块
     */
    const changePageByAccess = async (menu: any[]) => {
        const hasResourceAccess = checkPermissions(HasAccess.isHasBusiness)
        const isAppDeveloper = checkPermission(allRoleList.ApplicationDeveloper)
        const isOnlySystemMgm = checkPermission(allRoleList.TCSystemMgm, 'only')
        goEffectivePath(menu, platform, isOnlySystemMgm, navigate)
    }

    return (
        <div className={styles.loginSuccess}>
            <Spin />
        </div>
    )
}

export default Sso
