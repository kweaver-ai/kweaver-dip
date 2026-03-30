import AuditTable from './AuditTable'
import { AuditType } from './const'
import styles from './styles.module.less'

const PlanUnderstandingAudit = () => {
    return (
        <div className={styles['plan-understanding-audit']}>
            <AuditTable type={AuditType.Tasks} />
        </div>
    )
}

export default PlanUnderstandingAudit
