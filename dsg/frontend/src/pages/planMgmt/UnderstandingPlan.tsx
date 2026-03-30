import styles from '../styles.module.less'
import PlanUnderstanding from '@/components/DataPlanManage/PlanUnderstanding'
import __ from '../locale'

function UnderstandingPlan() {
    return (
        <div className={styles.dataPlanWrapper}>
            <div className={styles.pageTitle}>{__('数据理解计划')}</div>
            <PlanUnderstanding />
        </div>
    )
}

export default UnderstandingPlan
