import { DownOutlined } from '@ant-design/icons'
import { Popover } from 'antd'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import PopoverContent from './PopoverContent'
import styles from './styles.module.less'

interface IUserInfoCard {
    darkMode?: boolean
}

function UserInfoCard({ darkMode = false }: IUserInfoCard) {
    const [info] = useCurrentUser()

    return (
        <Popover
            content={<PopoverContent userInfo={info} />}
            trigger="click"
            placement="bottomRight"
            overlayClassName={styles.pop}
            overlayStyle={{
                paddingTop: 0,
            }}
        >
            <div className={styles.nameWrapper} title={info?.VisionName}>
                {darkMode ? (
                    <FontIcon
                        name="icon-fanbaitouxiang"
                        type={IconType.COLOREDICON}
                        className={styles.userIconDark}
                    />
                ) : (
                    <FontIcon
                        name="icon-morenzhanghaotouxiang"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: '24px' }}
                    />
                )}
                <span className={styles.name}>{info?.VisionName}</span>
                <DownOutlined style={{ fontSize: '12px' }} />
            </div>
        </Popover>
    )
}

export default UserInfoCard
