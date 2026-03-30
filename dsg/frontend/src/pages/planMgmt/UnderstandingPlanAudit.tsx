import styles from '../styles.module.less'
import PlanUnderstandingAudit from '@/components/DataPlanManage/PlanUnderstandingAudit'
import __ from '../locale'

function UnderstandingPlanAudit() {
    return (
        <div className={styles.dataPlanWrapper}>
            <PlanUnderstandingAudit />
        </div>
    )
}

export default UnderstandingPlanAudit
