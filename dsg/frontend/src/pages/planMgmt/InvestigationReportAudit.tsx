import styles from '../styles.module.less'
import InvestigationAudit from '@/components/DataPlanManage/InvestigationAudit'
import __ from '../locale'

function InvestigationReportAudit() {
    return (
        <div className={styles.investigationReportWrapper}>
            <InvestigationAudit />
        </div>
    )
}

export default InvestigationReportAudit
