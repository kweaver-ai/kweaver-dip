import BusinessTagAuditList from '@/components/BusinessTagAuditList'
import styles from '../styles.module.less'

function TagAudit() {
    return (
        <div className={styles.useRoleWrapper}>
            <BusinessTagAuditList />
        </div>
    )
}

export default TagAudit
