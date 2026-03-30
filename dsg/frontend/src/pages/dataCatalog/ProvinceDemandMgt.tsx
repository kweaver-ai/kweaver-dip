import styles from '../styles.module.less'
import DemandMgtList from '@/components/DemandManagement/Province/DemandMgtList'

function ProvinceDemandMgt() {
    return (
        <div className={styles.provinceDemandWrapper}>
            <DemandMgtList />
        </div>
    )
}

export default ProvinceDemandMgt
