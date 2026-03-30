import styles from '../../styles.module.less'
import { ObjectionReviewList } from '@/components/ObjectionMgt'

function ObjectionReviewPage() {
    return (
        <div className={styles.objectionMgt}>
            <ObjectionReviewList />
        </div>
    )
}

export default ObjectionReviewPage
