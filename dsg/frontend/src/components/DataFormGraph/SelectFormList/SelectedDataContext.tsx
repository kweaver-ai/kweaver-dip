import { Node } from '@antv/x6'
import { noop } from 'lodash'
import React, { createContext, useContext } from 'react'
import { FormListTabType } from '../const'
import { FormTableKind } from '@/components/Forms/const'

interface ISelectedDataContext {
    formInfo
    targetNode: Node | null
    mid: string
    onStartDrag: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        mid: string,
        fid: string,
        type: FormTableKind,
    ) => void
    allOriginNodes: Array<Node>
    dragLoading: boolean
    setDragLoading: (dragLoading: boolean) => void
    activeTab: FormTableKind
}
// 初始化组件通信
const SelectedDataContext = createContext<ISelectedDataContext>({
    formInfo: null,
    targetNode: null,
    mid: '',
    onStartDrag: noop,
    allOriginNodes: [],
    dragLoading: false,
    setDragLoading: noop,
    activeTab: FormTableKind.STANDARD,
})
// 获取context的方法
const useSelectedDataContext = () =>
    useContext<ISelectedDataContext>(SelectedDataContext)

// 提供context的组件
const SelectedDataContextProvider = SelectedDataContext.Provider

export { useSelectedDataContext, SelectedDataContextProvider }
