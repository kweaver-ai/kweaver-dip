import DataUndsContent from '@/components/DataComprehension/DataUndsContent'
import { UndsGraphProvider } from '@/context/UndsGraphProvider'

function PComprehensionContent() {
    return (
        <UndsGraphProvider>
            <DataUndsContent />
        </UndsGraphProvider>
    )
}

export default PComprehensionContent
