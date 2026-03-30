import DataUndsContent from '@/components/DataCatalogUnderstanding/DataUndsContent'
import { UndsGraphProvider } from '@/context/UndsGraphProvider'

function PDataUndsContent() {
    return (
        <UndsGraphProvider>
            <DataUndsContent />
        </UndsGraphProvider>
    )
}

export default PDataUndsContent
