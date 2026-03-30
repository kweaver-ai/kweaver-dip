import AuditTable from './AuditTable'
import { AuditType } from './const'
import styles from './styles.module.less'

const InvestigationAudit = () => {
    return (
        <div className={styles['inverstigation-audit']}>
            <AuditTable type={AuditType.Tasks} />
        </div>
    )
}

export default InvestigationAudit
