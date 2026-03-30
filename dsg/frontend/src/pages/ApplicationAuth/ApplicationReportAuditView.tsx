import styles from '../styles.module.less'
import ApplicationAudit from '@/components/ApplicationAuth/ApplicationAudit'
import __ from '../locale'

function ApplicationAuditView() {
    return (
        <div className={styles.useRoleWrapper}>
            <ApplicationAudit auditType="af-sszd-app-report-escalate" />
        </div>
    )
}

export default ApplicationAuditView
