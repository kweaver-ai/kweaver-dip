import styles from '../styles.module.less'
import DemandManagement from '@/components/DemandManagement'

function DemandMgt() {
    return (
        <div className={styles.rescDirMgnWrapper}>
            <DemandManagement />
        </div>
    )
}

export default DemandMgt
