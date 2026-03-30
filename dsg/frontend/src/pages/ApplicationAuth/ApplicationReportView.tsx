import styles from '../styles.module.less'
import ApplicationReport from '@/components/ApplicationAuth/ApplicationReport'
import __ from '../locale'

function ApplicationReportView() {
    return (
        <div className={styles.useRoleWrapper}>
            <ApplicationReport />
        </div>
    )
}

export default ApplicationReportView
