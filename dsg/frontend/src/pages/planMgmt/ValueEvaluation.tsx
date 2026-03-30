import styles from '../styles.module.less'
import ValueEvaluationPage from '@/components/ValueEvaluation'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import __ from '../locale'

function ValueEvaluation() {
    return (
        <DataViewProvider>
            <ValueEvaluationPage />
        </DataViewProvider>
    )
}

export default ValueEvaluation
