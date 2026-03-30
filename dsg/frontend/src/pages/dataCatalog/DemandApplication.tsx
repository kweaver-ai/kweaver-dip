import styles from '../styles.module.less'
import DemandApplication from '@/components/DemandManagement/MyDemand'

function MyDemand() {
    return (
        <div className={styles.rescDirMgnWrapper}>
            <DemandApplication />
        </div>
    )
}

export default MyDemand
