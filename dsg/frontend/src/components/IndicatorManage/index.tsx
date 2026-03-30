import { useEffect, useState, useContext, FC, useRef } from 'react'
import { useGetState } from 'ahooks'
import { Tabs, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import styles from './styles.module.less'
import actionType from '@/redux/actionType'
import __ from './locale'
import DragBox from '../DragBox'
import SelectedFilterTree from './SelectedFilterTree'
import { DataTableTabs, SelectFilterMenu, TabsKey } from './const'
import DataTable from './DataTable'

const IndicatorManage: FC<{
    collapsed: boolean
    getContainer?: any
    taskId?: string
}> = ({ collapsed, getContainer, taskId }) => {
    const dispatch = useDispatch()
    const indicatorManageTabIndex = useSelector((state: any) => {
        return state?.IndicatorManageReducer
    })
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const tableContainerRef: any = useRef()
    const [activeTab, setActiveTab, getActiveTab] = useGetState<TabsKey>(
        indicatorManageTabIndex,
    )

    const [selectedNode, setSelectedNode] = useState<any>({
        id: '',
        type: SelectFilterMenu.BUSSINESSDOMAIN,
        isAll: true,
    })

    return (
        <div
            className={styles.container}
            onClick={() => {
                // tableContainerRef?.current?.onCloseDetail()
            }}
        >
            <DragBox
                defaultSize={defaultSize}
                minSize={[280, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <SelectedFilterTree
                        onChange={(value) => {
                            setSelectedNode(value)
                        }}
                        extraFunc={() => {
                            setActiveTab(TabsKey.ALL)
                            dispatch({
                                type: actionType.INDICATORMANAGE_LIST_TAB_INDEX,
                                payload: TabsKey.ALL,
                            })
                        }}
                    />
                </div>
                <div className={styles.right}>
                    <Tabs
                        items={DataTableTabs}
                        defaultActiveKey={TabsKey.ALL}
                        onChange={(activeKey) => {
                            setActiveTab(activeKey as TabsKey)
                            dispatch({
                                type: actionType.INDICATORMANAGE_LIST_TAB_INDEX,
                                payload: activeKey,
                            })
                        }}
                        activeKey={getActiveTab()}
                    />

                    <div className={styles.container}>
                        <DataTable
                            filterSearch={selectedNode}
                            tabKey={getActiveTab()}
                            collapsed={collapsed}
                            ref={tableContainerRef}
                            getContainer={getContainer}
                        />
                    </div>
                </div>
            </DragBox>
        </div>
    )
}
export default IndicatorManage
