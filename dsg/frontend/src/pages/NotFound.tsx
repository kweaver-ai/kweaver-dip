import { Result } from 'antd'
import BackHome from '@/components/BackHome'
import styles from './styles.module.less'
import __ from './locale'
import notFound from '../assets/notFound.svg'

function NotFound() {
    return (
        <div className={styles.notFoundWraper}>
            <Result
                title={
                    <div className={styles.errorTitle}>
                        {__('哎呀！页面不在了...')}
                    </div>
                }
                extra={<BackHome />}
                icon={<img src={notFound} alt="notFound" />}
            />
        </div>
    )
}

export default NotFound
