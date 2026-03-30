import { Spin } from 'antd'
import styles from './styles.module.less'
import __ from './locale'

function Loader({ tip }: { tip?: string }) {
    return (
        <div className={styles.wrapper}>
            <Spin tip={tip ?? __('加载中...')} />
        </div>
    )
}

export default Loader
