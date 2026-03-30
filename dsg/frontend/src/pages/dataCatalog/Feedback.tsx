import styles from '../styles.module.less'
import { FeedbackList } from '@/components/DataCatalogFeedback'

function Feedback() {
    return (
        <div className={styles.useRoleWrapper}>
            <FeedbackList />
        </div>
    )
}

export default Feedback
