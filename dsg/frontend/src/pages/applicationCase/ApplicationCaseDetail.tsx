import { LeftOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ApplicationCaseDetailComp from '@/components/ApplicationCase/ApplicationCaseDetail'
import styles from '../styles.module.less'
import __ from '../locale'

function ApplicationCaseDetail() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isLocal = searchParams.get('isLocal')
    const handleReturn = () => {
        if (isLocal === 'true') {
            navigate(`/applicationCase/report`)
        } else {
            navigate(`/applicationCase/provinceCase`)
        }
    }

    return (
        <div className={styles.caseDetailWrapper}>
            <div className={styles.caseTitle}>
                <div onClick={handleReturn} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.titleText}>{__('应用案例详情')}</div>
            </div>
            <div className={styles.contentWrapper}>
                <ApplicationCaseDetailComp />
            </div>
        </div>
    )
}

export default ApplicationCaseDetail
