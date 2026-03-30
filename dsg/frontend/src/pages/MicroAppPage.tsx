import Loader from '@/ui/Loader'
import styles from './styles.module.less'

function MicroAppPage() {
    return (
        <div id="doc-audit-client" className={styles.aduitTemplate}>
            <Loader />
        </div>
    )
}

export default MicroAppPage
