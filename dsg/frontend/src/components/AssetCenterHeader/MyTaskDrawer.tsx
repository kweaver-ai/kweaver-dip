import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Drawer, Button, Tabs, Space, message } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import DataDownload from '../DataDownload'
import ExplorationTask from '../DatasheetView/DatasourceExploration/ExplorationTask'
import { DataViewProvider } from '../DatasheetView/DataViewProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { explorationContentType } from '../DatasheetView/DatasourceExploration/const'

interface IMyTaskDrawer {
    open: boolean
    onClose: () => void
    tabKey?: string
    hideExplorationTask?: boolean
}

const MyTaskDrawer: React.FC<IMyTaskDrawer> = ({
    open,
    tabKey,
    onClose,
    hideExplorationTask,
}) => {
    const [activeKey, setActiveKey] = useState<string>('1')
    const { checkPermission } = useUserPermCtx()

    useEffect(() => {
        if (tabKey) {
            setActiveKey(tabKey)
        }
    }, [tabKey])

    // const items = useMemo(() => {
    //     const explorationTaskType = [
    //         explorationContentType.Timestamp,
    //         explorationContentType.Classification,
    //     ].join(',')

    //     return [
    //         {
    //             label: __('探查任务'),
    //             key: '1',
    //             show: checkPermission('manageLogicalView'),
    //             children: (
    //                 <ExplorationTask
    //                     key="1"
    //                     onClose={onClose}
    //                     taskType={explorationTaskType}
    //                 />
    //             ),
    //         },
    //         {
    //             label: __('评估任务'),
    //             key: '2',
    //             show: checkPermission('manageLogicalView'),
    //             children: (
    //                 <ExplorationTask
    //                     key="2"
    //                     onClose={onClose}
    //                     taskType={explorationContentType.Quality}
    //                 />
    //             ),
    //         },
    //     ]
    // }, [checkPermission, onClose])
    return (
        <Drawer
            title={__('我的任务')}
            placement="right"
            onClose={onClose}
            open={open}
            width={980}
            className={styles.taskWrapper}
            push={false}
        >
            <div className={styles.drawerBox}>
                <DataViewProvider>
                    {/* <Tabs
                        activeKey={activeKey}
                        onChange={setActiveKey}
                        items={items.filter((it) => it.show)}
                    /> */}
                    <ExplorationTask
                        key="1"
                        onClose={onClose}
                        taskType={[
                            explorationContentType.Timestamp,
                            explorationContentType.Classification,
                        ].join(',')}
                    />
                </DataViewProvider>
            </div>
        </Drawer>
    )
}

export default MyTaskDrawer
