import styles from '../styles.module.less'
import PlanProcessing from '@/components/DataPlanManage/PlanProcessing'
import __ from '../locale'

function ProcessingPlan() {
    return (
        <div className={styles.dataPlanWrapper}>
            <div className={styles.pageTitle}>{__('数据处理计划')}</div>
            <PlanProcessing />
        </div>
    )
}

export default ProcessingPlan
