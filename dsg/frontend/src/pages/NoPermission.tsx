import { Result } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import noAccess from '../assets/noAccess.svg'

function NoPermission() {
    return (
        <div className={styles.notFoundWraper}>
            <Result
                title={
                    <div className={styles.errorTitle}>
                        {__('您暂无访问权限')}
                    </div>
                }
                icon={<img src={noAccess} alt="noAccess" />}
            />
        </div>
    )
}

export default NoPermission
