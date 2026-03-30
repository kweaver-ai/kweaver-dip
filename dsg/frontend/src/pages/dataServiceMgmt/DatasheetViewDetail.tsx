import DatasheetDetail from '@/components/DatasheetView/DatasheetDetail'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'

function DatasheetViewDetail() {
    return (
        <DataViewProvider>
            <DatasheetDetail />
        </DataViewProvider>
    )
}

export default DatasheetViewDetail
