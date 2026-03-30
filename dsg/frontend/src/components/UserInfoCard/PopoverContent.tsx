import { Tag } from 'antd'
import Cookies from 'js-cookie'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useMicroAppProps } from '@/context/MicroAppPropsProvider'
import { isRuntimeMicroApp } from '@/utils/runtimeConfig'
import {
    formatError,
    getAllMenus,
    getUserDetails,
    IRole,
    IUserInfo,
    LoginPlatform,
} from '@/core'
import { findFirstPathByModule, getRouters, useMenus } from '@/hooks/useMenus'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getActualUrl, getPlatformNumber } from '@/utils'
import __ from './locale'
import styles from './styles.module.less'

interface IPopoverContent {
    userInfo?: IUserInfo
}

function PopoverContent({ userInfo }: IPopoverContent) {
    const [roleList, setRoleList] = useState<Array<IRole>>()
    const { microAppProps } = useMicroAppProps()
    const isMicroApp = isRuntimeMicroApp()

    const handleLogout = () => {
        // 如果是微应用环境,且主应用提供了logout方法,则调用主应用的logout
        if (isMicroApp && microAppProps?.logout) {
            microAppProps.logout()
            return
        }

        // 非微应用环境或主应用未提供logout方法时,使用原有逻辑
        Cookies.remove('af.oauth2_token')
        window.location.href = getActualUrl('/')
    }
    const platform = getPlatformNumber()
    const [menus] = useMenus()
    const { checkPermission } = useUserPermCtx()
    const [mdMenu, setMdMenu] = useState<any>([])
    // 是否拥有内容管理权限
    const isContentManagement = useMemo(
        () => checkPermission('managePortalInformationDisplay') ?? false,
        [checkPermission],
    )

    const getUserInfo = async () => {
        if (!userInfo?.ID) return
        try {
            const res = await getUserDetails(userInfo.ID)
            if (res) {
                const { roles = [], role_groups = [] } = res
                const totalRoles: any[] = [
                    ...roles,
                    ...role_groups.map((item) => item.roles || []).flat(),
                ]
                const roleMap = new Map()
                totalRoles.forEach((role) => {
                    if (!roleMap.has(role.id)) {
                        roleMap.set(role.id, role)
                    }
                })
                const allRoles = Array.from(roleMap.values())
                setRoleList(allRoles)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getUserInfo()
        getDrmbMenu()
    }, [])

    const contentManagementUrl = useMemo(() => {
        return findFirstPathByModule('content-management', menus, false)
    }, [menus])

    const getDrmbMenu = async () => {
        try {
            const res = await getAllMenus()
            setMdMenu(getRouters(res?.menus || []))
        } catch (error) {
            formatError(error)
        }
    }

    const mdPlatformUrl = useMemo(() => {
        const url = findFirstPathByModule('md-platform', mdMenu, true)
        if (!url) return null
        const platformUrl = getActualUrl(url, true, LoginPlatform.drmb)
        return platformUrl
    }, [mdMenu])

    return (
        <div className={styles.popoverWrapper}>
            <div className={styles.userWrap}>
                <div className={styles.userIcon}>
                    <FontIcon
                        name="icon-morenzhanghaotouxiang"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: '48px' }}
                    />
                </div>
                <div className={styles.userWrapper}>
                    <div
                        title={userInfo?.VisionName || '--'}
                        className={styles.userName}
                    >
                        {userInfo?.VisionName || '--'}
                    </div>
                    <div className={styles.roleInfo}>
                        {roleList?.map((role, index) => (
                            <Tag
                                className={styles.tag}
                                key={index}
                                title={role.name}
                            >
                                {role.name}
                            </Tag>
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.operationWrapper}>
                {/* <div className={styles.item}>
                    <Link to="/personal-center" className={styles.logoutLink}>
                        {__('个人中心')}
                    </Link>
                </div> */}
                {platform === LoginPlatform.drmp && isContentManagement && (
                    <div className={styles.item}>
                        <Link
                            to={contentManagementUrl}
                            className={styles.logoutLink}
                        >
                            {__('内容管理')}
                        </Link>
                    </div>
                )}
                {platform === LoginPlatform.drmp && !!mdPlatformUrl && (
                    <div className={styles.item}>
                        <a
                            onClick={() => {
                                window.open(mdPlatformUrl, '_blank')
                            }}
                            className={styles.logoutLink}
                        >
                            {__('平台管理')}
                        </a>
                    </div>
                )}
                <div className={styles.item}>
                    <a
                        className={styles.logoutLink}
                        href={
                            isMicroApp ? undefined : '/af/api/session/v1/logout'
                        }
                        onClick={handleLogout}
                    >
                        {__('退出登录')}
                    </a>
                </div>
            </div>
        </div>
    )
}

export default PopoverContent
