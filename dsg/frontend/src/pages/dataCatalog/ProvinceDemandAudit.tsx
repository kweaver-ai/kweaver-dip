import styles from '../styles.module.less'
import ProvinceDemandAuditList from '@/components/DemandManagement/Province/AuditList'

function ProvinceDemandAudit() {
    return (
        <div className={styles.provinceDemandWrapper}>
            <ProvinceDemandAuditList />
        </div>
    )
}

export default ProvinceDemandAudit
