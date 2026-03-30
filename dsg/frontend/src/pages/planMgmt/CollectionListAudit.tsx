import styles from '../styles.module.less'
import ListCollectionAudit from '@/components/DataPlanManage/ListCollectionAudit'
import __ from '../locale'

function CollectionListAudit() {
    return (
        <div className={styles.dataPlanWrapper}>
            <ListCollectionAudit />
        </div>
    )
}

export default CollectionListAudit
