import { ReactElement, memo } from 'react'
import styles from './styles.module.less'

interface IAccessProps {
    visitorComponent: ReactElement
    bottomComponent?: ReactElement
}

function CommonManage({ visitorComponent, bottomComponent }: IAccessProps) {
    return (
        <div className={styles['api-manage']}>
            <div className={styles['api-manage-content']}>
                {visitorComponent}
            </div>
            <div className={styles['api-manage-footer']}>{bottomComponent}</div>
        </div>
    )
}

export default memo(CommonManage)
