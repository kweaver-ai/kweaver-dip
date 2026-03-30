import Loader from '@/ui/Loader'
import styles from './styles.module.less'

function WorkflowManagePage() {
    return (
        <div id="workflow-manage-front" className={styles.appTemplate}>
            <Loader />
        </div>
    )
}

export default WorkflowManagePage
