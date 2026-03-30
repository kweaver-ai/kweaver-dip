import { Result } from 'antd'
import BackHome from '@/components/BackHome'
import styles from './styles.module.less'
import __ from './locale'
import noAccess from '../assets/noAccess.svg'

function NoAccess() {
    return (
        <div className={styles.notFoundWraper}>
            <Result
                title={
                    <div className={styles.errorTitle}>
                        {__('您暂无访问权限')}
                    </div>
                }
                extra={<BackHome />}
                icon={<img src={noAccess} alt="noAccess" />}
            />
        </div>
    )
}

export default NoAccess
