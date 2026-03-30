import { SyncOutlined } from '@ant-design/icons'
import { Button, message, Tabs } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@/utils'
import {
    createSSZDSyncTask,
    formatError,
    getSSZDSyncTask,
    ISSZDReportRecordType,
    SSZDSyncTaskEnum,
} from '@/core'
import DragBox from '../DragBox'
import ResourcesCustomTree from '../ResourcesDir/ResourcesCustomTree'
import { AllNodeInfo, Architecture, CatlgTreeNode, TabItems } from './const'
import RecordTable from './RecordTable'
import ReportTable from './ReportTable'
import StartTable from './StartTable'
import __ from './locale'
import styles from './styles.module.less'

const ResourceReport = () => {
    const query = useQuery()
    const tabKey = query.get('tabKey') || ''
    const ref: any = useRef()
    const [isSyncing, setIsSyncing] = useState<boolean>(false)
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [activeKey, setActiveKey] = useState<ISSZDReportRecordType>(
        ISSZDReportRecordType.Waiting,
    )

    // 左侧目录tabKey
    const [activeTabKey, setActiveTabKey] = useState<string>()
    const [selectedNode, setSelectedNode] = useState<CatlgTreeNode>({
        name: __('全部'),
        id: '',
        path: '',
        type: Architecture.ALL,
    })

    const waitingRef = useRef<any>()
    const reportedRef = useRef<any>()
    const revocationRef = useRef<any>()
    const recordRef = useRef<any>()

    useEffect(() => {
        if (tabKey && tabKey !== 'undefined') {
            setActiveKey(tabKey as ISSZDReportRecordType)
        }
    }, [tabKey])

    useEffect(() => {
        getSyncStatus()
    }, [])

    // 查询任务状态
    const getSyncStatus = async () => {
        try {
            const res = await getSSZDSyncTask(SSZDSyncTaskEnum.Catalog)
            if (!res?.id) {
                setIsSyncing(false)
                message.success(__('数据同步成功'))
            } else {
                setIsSyncing(true)
            }
        } catch (err) {
            formatError(err)
            setIsSyncing(false)
        }
    }

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = AllNodeInfo
        }
        setSelectedNode(sn || AllNodeInfo)
    }

    const handleTabChange = (key) => {
        setActiveKey(key)
    }

    const getSyncData = async () => {
        setIsSyncing(true)
        try {
            setIsSyncing(true)
            const res = await createSSZDSyncTask(SSZDSyncTaskEnum.CatalogStatus)
            if (res) {
                // 数据同步  刷新操作
                switch (activeKey) {
                    case ISSZDReportRecordType.Waiting:
                        waitingRef.current?.handleRefresh()
                        break
                    case ISSZDReportRecordType.Reported:
                        reportedRef.current?.handleRefresh()
                        break
                    case ISSZDReportRecordType.Revocation:
                        revocationRef.current?.handleRefresh()
                        break
                    case ISSZDReportRecordType.Record:
                        recordRef.current?.handleRefresh()
                        break
                    default:
                        break
                }
            }
        } catch (err) {
            formatError(err)
        } finally {
            setIsSyncing(false)
        }
    }

    return (
        <div className={styles['dir-report']}>
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                items={TabItems}
                className={styles['dir-report-tabs']}
                tabBarExtraContent={
                    <div className={styles['sync-btn']}>
                        <Button
                            ghost
                            type="link"
                            icon={<SyncOutlined spin={isSyncing} />}
                            disabled={isSyncing}
                            onClick={() => getSyncData()}
                        >
                            {isSyncing
                                ? __('审核状态同步中...')
                                : __('同步最新审核状态')}
                        </Button>
                    </div>
                }
            />
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles['dir-report-left']}>
                    <ResourcesCustomTree onChange={getSelectedNode} />
                </div>
                <div className={styles['dir-report-right']}>
                    {activeKey === ISSZDReportRecordType.Waiting && (
                        <StartTable
                            ref={waitingRef}
                            key="start"
                            treeType={activeTabKey}
                            selectedNode={selectedNode}
                        />
                    )}
                    {activeKey === ISSZDReportRecordType.Reported && (
                        <ReportTable
                            ref={reportedRef}
                            key="report"
                            treeType={activeTabKey}
                            selectedNode={selectedNode}
                        />
                    )}
                    {activeKey === ISSZDReportRecordType.Record && (
                        <RecordTable
                            ref={recordRef}
                            key="record"
                            treeType={activeTabKey}
                            selectedNode={selectedNode}
                        />
                    )}
                </div>
            </DragBox>
        </div>
    )
}

export default ResourceReport
