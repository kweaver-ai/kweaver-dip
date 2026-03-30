import styles from '../styles.module.less'
import ProvinceDemandApplyList from '@/components/DemandManagement/Province/DemandApplyList'

function ProvinceDemandApplication() {
    return (
        <div className={styles.provinceDemandWrapper}>
            <ProvinceDemandApplyList />
        </div>
    )
}

export default ProvinceDemandApplication
