import React, {
    useRef,
    useEffect,
    useState,
    useMemo,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { noop } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import GraphContent from './GraphContent'
import { ViewGraphProvider } from './ViewGraphProvider'
import FloatBar from './FloatBar'

interface IFusionGraphView {
    inMode?: 'view' | 'edit' // 所在视图模式
    sceneData?: any // 模型信息
    onExpand?: (val: boolean) => void
    onEdit?: () => void
    ref?: any
}
const FusionGraphView: React.FC<IFusionGraphView> = forwardRef(
    (props: any, ref) => {
        const { inMode = 'view', sceneData, onExpand, onEdit } = props

        const graphContentRef = useRef<any>(null)
        const [forceUpdate, setForceUpdate] = useState(0)
        // 画布缩放大小
        const [graphSize, setGraphSize] = useState(100)

        useImperativeHandle(ref, () => ({
            handleRefresh: () => {
                graphContentRef.current?.handleRefresh()
            },
        }))

        const contextValue = useMemo(() => {
            const {
                handleShowAll,
                handleChangeGraphSize,
                handleMovedToCenter,
                handleStartDrag,
                handleSave,
                handleRefresh,
                handleOptionGraphData,
                handleEditFormName,
                handleRunGraph,
                handleRefreshOptionGraphData,
                handleDeleteCells,
            } = graphContentRef?.current || {}
            return {
                viewMode: 'view',
                viewHeight: 480,
                modelInfo: sceneData,
                graphSize,
                onShowAll: handleShowAll || noop,
                onChangeSize: handleChangeGraphSize || noop,
                onMovedToCenter: handleMovedToCenter || noop,
                onSave: handleSave || noop,
                onStartDrag: handleStartDrag || noop,
                onRefresh: handleRefresh || noop,
                onOptionGraphData: handleOptionGraphData || noop,
                onEditFormName: handleEditFormName || noop,
                onRunGraph: handleRunGraph || noop,
                onRefreshOptionGraphData: handleRefreshOptionGraphData || noop,
                onDeleteCells: handleDeleteCells || noop,
            }
        }, [forceUpdate, graphSize, sceneData])

        return (
            <div className={styles.fusionGraphView}>
                <ViewGraphProvider value={contextValue}>
                    <GraphContent
                        ref={graphContentRef}
                        setGraphSize={setGraphSize}
                        onReady={() => setForceUpdate((prev) => prev + 1)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            right: 20,
                            top: 20,
                        }}
                    >
                        <FloatBar
                            inMode={inMode}
                            onExpand={onExpand}
                            onEdit={onEdit}
                        />
                    </div>
                </ViewGraphProvider>
            </div>
        )
    },
)

export default FusionGraphView
