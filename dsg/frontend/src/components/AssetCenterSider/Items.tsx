import { Badge } from 'antd'
import { isNaN } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import { getActualUrl } from '@/utils'

interface IItems {
    selectedKey: string[]
    currentKey: string
    SelectedIcon: any
    CurrentIcon: any
    title: string
    count?: number
}

const Items = ({
    selectedKey,
    currentKey,
    SelectedIcon,
    CurrentIcon,
    title,
    count,
}: IItems) => {
    const path =
        currentKey.substring(0, 1) === '/' ? currentKey : `/${currentKey}`
    const href = `${getActualUrl(path)}`
    return (
        <div className={styles.labelWrapper}>
            <div className={styles.iconWrapper}>
                {selectedKey.includes(currentKey) ? (
                    <SelectedIcon
                        style={{ fontSize: '18px', color: '#126ee3' }}
                    />
                ) : (
                    <CurrentIcon
                        style={{
                            fontSize: '18px',
                            color: 'rgb(0 0 0 / 65%)',
                        }}
                    />
                )}
                {!isNaN(count) && (
                    <Badge
                        count={isNaN(count) ? 0 : count}
                        overflowCount={99}
                        className={classnames(
                            styles.badge,
                            currentKey === 'config-center' && styles.badgeOther,
                        )}
                    />
                )}
            </div>
            <div className={styles.label}>{title}</div>
        </div>
    )
}

export default Items
