import styles from './styles.module.less'
import GeneralConfig from '@/components/GeneralConfig'

function GeneralConfigPage() {
    return (
        <div className={styles.useRoleWrapper}>
            <GeneralConfig />
        </div>
    )
}

export default GeneralConfigPage
