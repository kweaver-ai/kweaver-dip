import React, { createContext, useContext } from 'react'
import { noop } from 'lodash'
import __ from './locale'

type IViewGraphContext = {
    deletable?: boolean
    setDeletable?: (deletable: boolean) => void
    getDeletable?: () => boolean
    citeFormViewId?: string
    setCiteFormViewId?: (citeFormViewId: string) => void
    continueFn?: {
        flag: string
        fn: any
        params: any
    }
    getContinueFn?: () => any
    setContinueFn?: (continueFn?: {
        flag: string
        fn: any
        params: any
    }) => void
    // 保存模型
    onSave: () => void

    // 模式 查看 view | 编辑 edit
    viewMode: string

    // 画布高度
    viewHeight?: number

    modelInfo: any

    // 画布大小
    graphSize: number
    // 展示所有画布内容
    onShowAll: () => void
    // 缩放画布
    onChangeSize: (multiple: number) => void
    // 画布定位到中心
    onMovedToCenter: () => void
    // 刷新画布
    onRefresh?: () => void

    // 拖拽添加节点
    onStartDrag: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        item?: any,
        currentDndCase?: any,
    ) => void

    onOptionGraphData?: (values: any) => void
    onEditFormName?: (node: Node) => void
    onRunGraph?: (values: any) => void
    onRefreshOptionGraphData?: (...args: any) => void
    onDeleteCells?: (values: any) => void
}

const ViewGraphContext = createContext<IViewGraphContext>({
    deletable: true,
    setDeletable: noop,
    getDeletable: () => true,
    citeFormViewId: '',
    setCiteFormViewId: noop,
    continueFn: { flag: '', fn: noop, params: {} },
    getContinueFn: () => undefined,
    setContinueFn: noop,
    modelInfo: {},
    graphSize: 100,
    viewMode: 'edit',
    viewHeight: undefined,
    onShowAll: noop,
    onChangeSize: noop,
    onMovedToCenter: noop,
    onSave: noop,
    onStartDrag: noop,
    onRefresh: noop,
    onOptionGraphData: noop,
    onEditFormName: noop,
    onRunGraph: noop,
    onRefreshOptionGraphData: noop,
    onDeleteCells: noop,
})

export const useViewGraphContext = () =>
    useContext<IViewGraphContext>(ViewGraphContext)

export const ViewGraphProvider = ViewGraphContext.Provider
//  ({ children }: { children: ReactNode }) => {
//     const [deletable, setDeletable, getDeletable] = useGetState<any>(true)
//     const [citeFormViewId, setCiteFormViewId] = useGetState<any>('')
//     const [viewMode, setViewMode] = useGetState<any>('view')
//     // 算子切换时被中断操作的数据
//     const [continueFn, setContinueFn] = useState<{
//         flag: string
//         fn: any
//         params: any
//     }>()

//     const values = useMemo(
//         () => ({
//             continueFn,
//             setContinueFn,
//             deletable,
//             setDeletable,
//             getDeletable,
//             citeFormViewId,
//             setCiteFormViewId,
//             viewMode,
//             setViewMode,
//         }),
//         [
//             continueFn,
//             setContinueFn,
//             deletable,
//             setDeletable,
//             getDeletable,
//             citeFormViewId,
//             setCiteFormViewId,
//             viewMode,
//             setViewMode,
//         ],
//     )
//     return (
//         <ViewGraphContext.Provider value={values}>
//             {children}
//         </ViewGraphContext.Provider>
//     )
// }
