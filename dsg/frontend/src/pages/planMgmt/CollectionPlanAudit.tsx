import styles from '../styles.module.less'
import PlanCollectionAudit from '@/components/DataPlanManage/PlanCollectionAudit'
import __ from '../locale'

function CollectionPlanAudit() {
    return (
        <div className={styles.dataPlanWrapper}>
            <PlanCollectionAudit />
        </div>
    )
}

export default CollectionPlanAudit
