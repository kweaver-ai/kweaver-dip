import { Empty } from '@/ui'
import { useQuery } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import __ from './locale'

const getErrorDes = (code) => {
    switch (code) {
        case 'session.login.UserHasNoRolesError':
            return __('没有配置AnyFabric角色，请联系系统管理员。')

        case 'session.login.UserNotExistedError':
            return __('用户不存在。')

        case 'session.login.UserDisabledError':
            return __('用户被禁用。')

        case 'session.login.ASTokenExpiredOrInvalidError':
            return __('AS Token无效或已过期。')

        case 'session.login.UserLoginError':
            return __('用户登录失败。')

        case 'session.login.AnyshareHostConfNotFindError':
            return __('未配置Anyshare Host，不能登录。')

        case 'RolesNotSupport':
            return __('当前账号角色无法访问。')

        default:
            return __('您暂无访问权限')
    }
}

interface INoAccess {
    // 为空描述
    desc?: string
}

function NoAccess({ desc }: INoAccess) {
    const query = useQuery()
    const code = query.get('errCode') || ''

    return (
        <div className={styles.center}>
            <Empty desc={desc || getErrorDes(code)} iconSrc={dataEmpty} />
        </div>
    )
}

export default NoAccess
