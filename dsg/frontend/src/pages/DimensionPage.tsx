import DimensionGraph from '@/components/DimensionModel/DimensionGraph'
import styles from './styles.module.less'

function DimensionPage() {
    return (
        <div className={styles.DimensionPageWrapper}>
            <DimensionGraph />
        </div>
    )
}
export default DimensionPage
