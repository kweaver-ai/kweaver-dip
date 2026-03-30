import BusinessModeling from '@/components/BusinessModeling'
import styles from './styles.module.less'
import { BizModelType } from '@/core'

function DataModelPage() {
    return (
        <div className={styles.useRoleWrapper}>
            <BusinessModeling businessModelType={BizModelType.DATA} />
        </div>
    )
}

export default DataModelPage
