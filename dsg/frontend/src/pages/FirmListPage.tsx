import styles from './styles.module.less'
import { FirmList } from '@/components/Firm'
import __ from './locale'

function FirmListPage() {
    return (
        <div className={styles.useRoleWrapper}>
            <FirmList />
        </div>
    )
}

export default FirmListPage
