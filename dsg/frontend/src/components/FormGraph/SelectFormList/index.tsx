import React, { FC, useState } from 'react'
import { Node } from '@antv/x6'
import { Tabs } from 'antd'
import styles from './styles.module.less'
import { FormListTabItems, FormListTabType } from '../const'
import { SelectedDataContextProvider } from './SelectedDataContext'
import BusinessFormSelect from './BusinessFormSelect'
import LogicViewSelect from './LogicViewSelect'

interface SelectFormListProps {
    formInfo: any
    targetNode: Node | null
    mid: string
    onStartDrag: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        mid: string,
        fid: string,
        type: FormListTabType,
        data?: any,
    ) => void
    allOriginNodes: Array<Node>
    departmentId: string
}
const SelectFormList: FC<SelectFormListProps> = ({
    formInfo,
    targetNode,
    mid,
    onStartDrag,
    allOriginNodes,
    departmentId,
}) => {
    // 当前选中的tab
    const [activeTab, setActiveTab] = useState(FormListTabType.BusinessForm)
    // 拖拽loading
    const [dragLoading, setDragLoading] = useState<boolean>(false)

    /**
     * 获取当前选中的列表
     * @returns
     */
    const getSelectedList = () => {
        if (activeTab === FormListTabType.BusinessForm) {
            return <BusinessFormSelect />
        }
        if (activeTab === FormListTabType.LogicView) {
            return <LogicViewSelect />
        }
        return null
    }
    return (
        <SelectedDataContextProvider
            value={{
                formInfo,
                targetNode,
                mid,
                onStartDrag,
                allOriginNodes,
                dragLoading,
                setDragLoading,
                activeTab,
                departmentId,
            }}
        >
            <div className={styles.selectFormContainer}>
                <Tabs
                    items={FormListTabItems}
                    onChange={(key) => setActiveTab(key as FormListTabType)}
                    className={styles.selectFormTabs}
                />

                <div className={styles.selectedFormContent}>
                    {getSelectedList()}
                </div>
            </div>
        </SelectedDataContextProvider>
    )
}

export default SelectFormList
