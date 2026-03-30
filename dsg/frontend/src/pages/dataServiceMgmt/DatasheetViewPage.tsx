import LogicView from '@/components/DatasheetView/LogicView'
import DatasheetView from '@/components/DatasheetView'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'

function DatasheetViewPage() {
    return (
        <DataViewProvider>
            <DatasheetView />
        </DataViewProvider>
    )
}

export default DatasheetViewPage
