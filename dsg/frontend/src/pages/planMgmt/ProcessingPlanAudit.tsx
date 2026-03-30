import styles from '../styles.module.less'
import PlanProcessingAudit from '@/components/DataPlanManage/PlanProcessingAudit'
import __ from '../locale'

function ProcessingPlanAudit() {
    return (
        <div className={styles.dataPlanWrapper}>
            <PlanProcessingAudit />
        </div>
    )
}

export default ProcessingPlanAudit
