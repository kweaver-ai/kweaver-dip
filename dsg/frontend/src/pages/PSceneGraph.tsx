import DataSheetViewContainer from '@/components/SceneAnalysis/DataSheetViewContainer'
import styles from './styles.module.less'
import { SceneGraphProvider } from '@/components/SceneAnalysis/helper'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'

function PSceneGraph() {
    return (
        <SceneGraphProvider>
            <DataViewProvider>
                <div className={styles.pSceneGraphWrap}>
                    <DataSheetViewContainer />
                </div>
            </DataViewProvider>
        </SceneGraphProvider>
    )
}
export default PSceneGraph
