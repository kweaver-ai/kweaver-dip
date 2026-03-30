import styles from '../../styles.module.less'
import { ObjectionHandleList } from '@/components/ObjectionMgt'

function ObjectionHandlePage() {
    return (
        <div className={styles.objectionMgt}>
            <ObjectionHandleList />
        </div>
    )
}

export default ObjectionHandlePage
