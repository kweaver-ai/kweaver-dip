import CustomView from '@/components/SCustomView'
import styles from './styles.module.less'
import { CustomViewReduxWrapper } from '@/components/SCustomView/CustomViewRedux'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import { SceneGraphProvider } from '@/components/SCustomView/helper'

function PSceneGraph() {
    return (
        <CustomViewReduxWrapper>
            <SceneGraphProvider>
                <DataViewProvider>
                    <div className={styles.pSceneGraphWrap}>
                        <CustomView />
                    </div>
                </DataViewProvider>
            </SceneGraphProvider>
        </CustomViewReduxWrapper>
    )
}
export default PSceneGraph
