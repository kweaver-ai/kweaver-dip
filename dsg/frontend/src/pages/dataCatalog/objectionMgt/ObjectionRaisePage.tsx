import styles from '../../styles.module.less'
import { ObjectionRaiseList } from '@/components/ObjectionMgt'

function ObjectionRaisePage() {
    return (
        <div className={styles.objectionMgt}>
            <ObjectionRaiseList />
        </div>
    )
}

export default ObjectionRaisePage
