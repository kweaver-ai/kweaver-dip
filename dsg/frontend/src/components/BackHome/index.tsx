import { Button } from 'antd'
import __ from './locale'
import { goEffectivePath, allRoleList, LoginPlatform } from '@/core'
import { useMenus } from '@/hooks/useMenus'
import { getActualUrl } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

function BackHome() {
    const { checkPermission } = useUserPermCtx()
    const [menus] = useMenus()

    const handleBackHome = () => {
        const isOnlySystemMgm = checkPermission(allRoleList.TCSystemMgm, 'only')
        goEffectivePath(menus, LoginPlatform.default, isOnlySystemMgm, (path) =>
            window.open(
                getActualUrl(path, true, LoginPlatform.default),
                '_self',
                'noopener,noreferrer',
            ),
        )
        // goEffectivePath(menus, platform, isOnlySystemMgm, navigate)
    }

    return (
        <Button type="primary" onClick={handleBackHome}>
            {__('回到首页')}
        </Button>
    )
}

export default BackHome
