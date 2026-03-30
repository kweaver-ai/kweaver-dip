import styles from '../styles.module.less'
import ResourcesDirAudit from '@/components/ResourcesDirAudit'
import { ResourcesCatlogProvider } from '@/components/ResourcesDir/ResourcesCatlogProvider'

function ResourcesDirList() {
    return (
        <div className={styles.rescDirMgnWrapper}>
            <ResourcesCatlogProvider>
                <ResourcesDirAudit />
            </ResourcesCatlogProvider>
        </div>
    )
}

export default ResourcesDirList
