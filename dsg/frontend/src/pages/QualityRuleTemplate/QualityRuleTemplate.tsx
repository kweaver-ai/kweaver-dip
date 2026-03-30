import styles from './styles.module.less'
import QualityRuleTemplate from '@/components/QualityRuleTemplate'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'

function QualityRuleTemplatePage() {
    return (
        <DataViewProvider>
            <QualityRuleTemplate />
        </DataViewProvider>
    )
}

export default QualityRuleTemplatePage
