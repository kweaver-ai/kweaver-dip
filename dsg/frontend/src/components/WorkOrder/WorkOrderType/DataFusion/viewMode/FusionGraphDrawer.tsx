import React, { useRef, useEffect, useState, useMemo, forwardRef } from 'react'
import { Drawer } from 'antd'
import { noop } from 'lodash'
import { useDebounce, useGetState } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import GraphHeader from './header/GraphHeader'
import GraphContent from './GraphContent'
import { ViewGraphProvider } from './ViewGraphProvider'

interface IFusionGraphDrawer {
    ref?: any
    open?: boolean
    viewMode?: string // 视图模式
    sceneData?: any // 模型信息
    onClose?: () => void
    onSave?: (value: any) => void
}
const FusionGraphDrawer: React.FC<IFusionGraphDrawer> = forwardRef(
    (props: any, ref) => {
        const { open, viewMode = 'view', sceneData, onClose, onSave } = props
        const graphContentRef = useRef<any>(null)
        const dndContainer = useRef<HTMLDivElement>(null)
        const [forceUpdate, setForceUpdate] = useState(0)
        const [deletable, setDeletable, getDeletable] = useGetState<any>(true)
        const [citeFormViewId, setCiteFormViewId] = useGetState<any>('')

        // 画布缩放大小
        const [graphSize, setGraphSize] = useState(100)
        // 是否可以保存
        const [canSave, setCanSave] = useState(false)
        // 算子切换时被中断操作的数据
        const [continueFn, setContinueFn, getContinueFn] = useGetState<{
            flag: string
            fn: any
            params: any
        }>()

        useEffect(() => {
            if (open) {
                setGraphSize(100)
                setContinueFn(undefined)
            }
        }, [open])

        const contextValue = useMemo(() => {
            const {
                handleShowAll,
                handleChangeGraphSize,
                handleMovedToCenter,
                handleStartDrag,
                handleSave,
                handleOptionGraphData,
                handleEditFormName,
                handleRunGraph,
                handleRefreshOptionGraphData,
                handleDeleteCells,
            } = graphContentRef?.current || {}
            return {
                viewMode,
                modelInfo: sceneData,
                graphSize,
                onShowAll: handleShowAll || noop,
                onChangeSize: handleChangeGraphSize || noop,
                onMovedToCenter: handleMovedToCenter || noop,
                onSave: handleSave || noop,
                onStartDrag: handleStartDrag || noop,
                onOptionGraphData: handleOptionGraphData || noop,
                onEditFormName: handleEditFormName || noop,
                onRunGraph: handleRunGraph || noop,
                onRefreshOptionGraphData: handleRefreshOptionGraphData || noop,
                onDeleteCells: handleDeleteCells || noop,
                deletable,
                setDeletable,
                getDeletable,
                citeFormViewId,
                setCiteFormViewId,
                // continueFn,
                getContinueFn,
                setContinueFn,
            }
        }, [
            sceneData,
            viewMode,
            graphSize,
            deletable,
            citeFormViewId,
            forceUpdate,
        ])

        return (
            <Drawer
                open={open}
                contentWrapperStyle={{
                    width: '100%',
                    height: '100%',
                    boxShadow: 'none',
                    transform: 'none',
                    marginTop: 0,
                }}
                style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }}
                headerStyle={{ display: 'none' }}
                bodyStyle={{
                    padding: '0 0 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                destroyOnClose
                maskClosable={false}
                mask={false}
                push={false}
            >
                <ViewGraphProvider value={contextValue}>
                    <div ref={dndContainer} className={styles.dndDrag}>
                        <GraphHeader
                            graphSize={graphSize}
                            canSave={canSave}
                            onClose={onClose}
                        />
                    </div>
                    <GraphContent
                        ref={graphContentRef}
                        dndContainer={dndContainer}
                        setGraphSize={setGraphSize}
                        setCanSave={setCanSave}
                        onSave={onSave}
                        onReady={() => setForceUpdate((prev) => prev + 1)}
                    />
                </ViewGraphProvider>
            </Drawer>
        )
    },
)

export default FusionGraphDrawer
