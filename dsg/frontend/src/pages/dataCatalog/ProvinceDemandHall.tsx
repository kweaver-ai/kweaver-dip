import styles from '../styles.module.less'
import ProvinceDemandHallList from '@/components/DemandManagement/Province/DemandHallList'

function ProvinceDemandHall() {
    return (
        <div className={styles.provinceDemandWrapper}>
            <ProvinceDemandHallList />
        </div>
    )
}

export default ProvinceDemandHall
