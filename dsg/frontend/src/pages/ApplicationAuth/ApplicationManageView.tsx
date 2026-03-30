import styles from '../styles.module.less'
import ApplicationManage from '@/components/ApplicationAuth/ApplicationManage'
import __ from '../locale'

function ApplicationManageView() {
    return (
        <div className={styles.useRoleWrapper}>
            <ApplicationManage />
        </div>
    )
}

export default ApplicationManageView
