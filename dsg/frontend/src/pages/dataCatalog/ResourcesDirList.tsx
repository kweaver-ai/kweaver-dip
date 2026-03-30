import styles from '../styles.module.less'
import ResourcesDir from '@/components/ResourcesDir'
import { ResourcesCatlogProvider } from '@/components/ResourcesDir/ResourcesCatlogProvider'

function ResourcesDirList() {
    return (
        <div className={styles.rescDirMgnWrapper}>
            <ResourcesCatlogProvider>
                <ResourcesDir />
            </ResourcesCatlogProvider>
        </div>
    )
}

export default ResourcesDirList
