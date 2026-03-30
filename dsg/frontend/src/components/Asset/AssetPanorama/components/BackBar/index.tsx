import { LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from '../../locale'

function index({ title, onClose }: { title: string; onClose?: () => void }) {
    const navigator = useNavigate()
    const handleBack = () => {
        if (onClose) {
            onClose()
        } else {
            navigator(-1)
        }
    }
    return (
        <div className={styles.backBar}>
            <div className={styles['backBar-btn']} onClick={handleBack}>
                <LeftOutlined style={{ fontSize: 16 }} />
                <span className={styles.returnText}>{__('返回')}</span>
            </div>
            <div className={styles['backBar-title']}>{title}</div>
        </div>
    )
}

export default index
