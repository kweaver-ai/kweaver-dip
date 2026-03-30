import React from 'react'
import { Drawer } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import LogsList from './LogsList'

interface IWorkflowLogs {
    visible: boolean
    collapsed: boolean
    id: string
    data?: any
    onClose: () => void
    model?: 'sync' | 'proc' | 'wf'
}

/**
 * 工作流日志弹窗
 */
const WorkflowLogs: React.FC<IWorkflowLogs> = ({
    visible,
    collapsed,
    id,
    data,
    onClose,
    model = 'wf',
}) => {
    return (
        <Drawer
            open={visible}
            onClose={onClose}
            contentWrapperStyle={{
                width: collapsed ? 'calc(100% - 52px )' : 'calc(100% - 220px )',
                boxShadow: 'none',
                marginTop: 53,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '16px 24px',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            getContainer={false}
        >
            <div className={styles.workflowLogsWrap}>
                <div className={styles.titleWrap}>
                    <div className={styles.return} onClick={onClose}>
                        <LeftOutlined style={{ fontSize: 16 }} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </div>
                    <div className={styles.drawerTitle}>
                        {model === 'wf'
                            ? __('日志')
                            : model === 'sync'
                            ? __('同步日志')
                            : __('加工日志')}
                    </div>
                </div>
                <LogsList
                    pageType="inlay"
                    model={model}
                    id={id}
                    hi={215}
                    dataInfo={data}
                />
            </div>
        </Drawer>
    )
}

export default WorkflowLogs
