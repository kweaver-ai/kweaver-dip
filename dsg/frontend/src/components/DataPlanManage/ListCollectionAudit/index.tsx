import AuditTable from './AuditTable'
import { AuditType } from './const'
import styles from './styles.module.less'

/** 归集清单审核 */
const ListCollectionAudit = () => {
    return (
        <div className={styles['list-collection-audit']}>
            <AuditTable target={AuditType.Tasks} />
        </div>
    )
}

export default ListCollectionAudit
