import styles from '../styles.module.less'
import RequirementAnalysis from '@/components/RequirementAnalysis'

function RequirementAnalysisList() {
    return (
        <div className={styles.rescDirMgnWrapper}>
            <RequirementAnalysis />
        </div>
    )
}

export default RequirementAnalysisList
