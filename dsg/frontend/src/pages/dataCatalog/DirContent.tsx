import DirDetailContent from '@/components/ResourcesDir/DirDetailContent'
import { ResourcesCatlogProvider } from '@/components/ResourcesDir/ResourcesCatlogProvider'
import { UndsGraphProvider } from '@/context/UndsGraphProvider'

function DirContent() {
    return (
        <UndsGraphProvider>
            <ResourcesCatlogProvider>
                <DirDetailContent />
            </ResourcesCatlogProvider>
        </UndsGraphProvider>
    )
}

export default DirContent
