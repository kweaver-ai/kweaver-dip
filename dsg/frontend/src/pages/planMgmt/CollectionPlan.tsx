import styles from '../styles.module.less'
import PlanCollection from '@/components/DataPlanManage/PlanCollection'
import __ from '../locale'

function CollectionPlan() {
    return (
        <div className={styles.dataPlanWrapper}>
            <div className={styles.pageTitle}>{__('数据归集计划')}</div>
            <PlanCollection />
        </div>
    )
}

export default CollectionPlan
