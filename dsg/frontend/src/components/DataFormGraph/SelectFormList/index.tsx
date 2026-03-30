import React, { FC, useEffect, useRef, useState } from 'react'
import { Node } from '@antv/x6'
import { Tabs } from 'antd'
import styles from './styles.module.less'
import { FormListTabItems, FormListTabType } from '../const'
import { SelectedDataContextProvider } from './SelectedDataContext'
import BusinessFormSelect from './BusinessFormSelect'

import { FormTableKind } from '@/components/Forms/const'
import FormViewSelect from './FormViewSelect'
import __ from '../locale'

interface SelectFormListProps {
    formInfo: any
    targetNode: Node | null
    mid: string
    onStartDrag: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        mid: string,
        fid: string,
        type: FormTableKind,
    ) => void
    allOriginNodes: Array<Node>
}
const SelectFormList: FC<SelectFormListProps> = ({
    formInfo,
    targetNode,
    mid,
    onStartDrag,
    allOriginNodes,
}) => {
    // 当前选中的tab
    const [activeTab, setActiveTab] = useState(FormTableKind.STANDARD)
    // 拖拽loading
    const [dragLoading, setDragLoading] = useState<boolean>(false)

    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (formInfo?.table_kind === FormTableKind.DATA_ORIGIN) {
            setActiveTab(FormTableKind.STANDARD)
        } else {
            setActiveTab(FormTableKind.DATA_STANDARD)
        }
    }, [formInfo?.table_kind])

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.addEventListener('selectstart', (e) => {
                e.preventDefault()
            })
        }
    }, [containerRef.current])

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
            }}
        >
            <div className={styles.selectFormContainer} ref={containerRef}>
                <div className={styles.selectTitle}>
                    {formInfo?.table_kind === FormTableKind.DATA_FUSION ? (
                        <Tabs
                            items={FormListTabItems}
                            onChange={(key) =>
                                setActiveTab(key as FormTableKind)
                            }
                            className={styles.selectFormTabs}
                        />
                    ) : (
                        <div className={styles.titleText}>
                            {__('业务标准表')}
                        </div>
                    )}
                </div>

                <div className={styles.selectedFormContent}>
                    <FormViewSelect tableKind={activeTab} />
                </div>
            </div>
        </SelectedDataContextProvider>
    )
}

export default SelectFormList
