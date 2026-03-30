import styles from '../styles.module.less'
import Investigation from '@/components/DataPlanManage/Investigation'
import __ from '../locale'

function InvestigationReport() {
    return (
        <div className={styles.investigationReportWrapper}>
            <div className={styles.pageTitle}>{__('调研报告')}</div>
            <Investigation />
        </div>
    )
}

export default InvestigationReport
