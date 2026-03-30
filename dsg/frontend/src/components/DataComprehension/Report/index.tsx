import AuditTable from './AuditTable'
import { AuditType } from './const'
import styles from './styles.module.less'

const ComprehensionReportAudit = () => {
    return (
        <div className={styles['comprehension-report-audit']}>
            <AuditTable target={AuditType.Tasks} />
        </div>
    )
}

export default ComprehensionReportAudit
