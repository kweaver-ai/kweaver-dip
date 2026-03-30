import AddResourcesDir from '@/components/ResourcesDir/AddResourcesDir'
import { ResourcesCatlogProvider } from '@/components/ResourcesDir/ResourcesCatlogProvider'

function AddResourcesDirList() {
    return (
        <ResourcesCatlogProvider>
            <AddResourcesDir />
        </ResourcesCatlogProvider>
    )
}

export default AddResourcesDirList
