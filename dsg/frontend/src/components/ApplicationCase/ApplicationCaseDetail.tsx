import { useSearchParams } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'

import Details from './Details'

const AppCaseDetail = () => {
    const [searchParams] = useSearchParams()
    const caseId = searchParams.get('id') || ''
    const isLocal = searchParams.get('isReport') || ''

    return (
        <div className={styles.appCaseDetailWrapper}>
            <div className={styles.appCaseDetailContent}>
                <Details id={caseId} />
            </div>
        </div>
    )
}

export default AppCaseDetail
