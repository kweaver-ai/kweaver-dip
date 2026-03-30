import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUpdateEffect } from 'ahooks'
import styles from '../styles.module.less'
import { formatError, getProject, goEffectivePath, allRoleList } from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useMenus } from '@/hooks/useMenus'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { Loader } from '@/ui'

async function getProjectProvider() {
    try {
        const { value } = await getProject()
        localStorage.setItem('project', value)
    } catch (error) {
        formatError(error)
    }
}

function LoginSuccess() {
    const navigate = useNavigate()
    const [{ using }, updateUsing] = useGeneralConfig()
    const { checkPermission, checkPermissions, checking } = useUserPermCtx()

    const [menus, getMenus] = useMenus()

    useEffect(() => {
        if (using !== 0 && using !== -1 && !checking) {
            getMenus()
        }
    }, [using, checking])

    // useEffect(() => {
    //     getProjectProvider()
    // }, [])

    useUpdateEffect(() => {
        if (using !== 0 && using !== -1 && !checking && menus.length > 0) {
            // 如果没有可用的菜单（只有登录相关路由），则跳转到登录失败页面
            const hasValidMenu = menus.some(
                (menu) =>
                    ![
                        'login-success',
                        'login-failed',
                        'logout',
                        'login-sso',
                    ].includes(menu.key),
            )
            if (!hasValidMenu) {
                navigate('/login-failed')
                return
            }
            // 稍微延迟一下,让用户看到最后的提示
            setTimeout(() => {
                changePageByAccess()
            }, 300)
        }
    }, [using, checking, menus])

    /**
     * 根据权限值跳转至对应的模块
     */
    const changePageByAccess = () => {
        const isOnlySystemMgm = checkPermission(allRoleList.TCSystemMgm, 'only')
        goEffectivePath(menus, 1, isOnlySystemMgm, navigate)
    }

    return (
        <div className={styles.loginSuccess}>
            <div className={styles.loadingContainer}>
                <Loader />
            </div>
        </div>
    )
}

export default LoginSuccess
