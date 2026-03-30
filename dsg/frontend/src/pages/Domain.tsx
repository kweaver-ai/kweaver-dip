import BusinessModeling from '@/components/BusinessModeling'
import styles from './styles.module.less'
import { BizModelType } from '@/core'

function BusinessModel() {
    return (
        <div className={styles.useRoleWrapper}>
            <BusinessModeling businessModelType={BizModelType.BUSINESS} />
        </div>
    )
}

export default BusinessModel
