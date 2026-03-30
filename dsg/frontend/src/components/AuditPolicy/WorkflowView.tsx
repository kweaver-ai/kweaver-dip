import { Button, Space } from 'antd'

import { memo, useEffect, useRef, useState } from 'react'
import { formatError, getProcessDefinitionByKey } from '@/core'
import { confirm } from '@/utils/modalHelper'
import WorkflowViewPlugin, {
    IWorkflowInfo,
    VisitType,
} from '../WorkflowViewPlugin'

import { Loader } from '@/ui'
import __ from './locale'
import styles from './styles.module.less'

export interface IWorkflowView {
    title?: string
    tip?: string
    type: any
    data?: any
    loading?: boolean
    onSave?: (workflowInfo: IWorkflowInfo) => void
    onUnBind?: () => void
}

function WorkflowView({
    title,
    tip,
    type,
    data,
    loading,
    onSave,
    onUnBind,
}: IWorkflowView) {
    const [workflow, setWorkflow] = useState<any>()
    const [processLoading, seProcessLoading] = useState<boolean>(true)
    const [isSetWorkflow, setIsSetWorkflow] = useState<boolean>(false)
    const originalWorkflow = useRef<any>(null)
    const [refreshKey, setRefreshKey] = useState<number>(0)

    const getProccess = async (key: string) => {
        try {
            seProcessLoading(true)
            setWorkflow(null)
            const process = await getProcessDefinitionByKey(key)
            setWorkflow(process)
            originalWorkflow.current = process
        } catch (error) {
            formatError(error)
            setWorkflow(null)
            originalWorkflow.current = null
        } finally {
            seProcessLoading(false)
        }
    }

    useEffect(() => {
        if (data?.proc_def_key) {
            getProccess(data.proc_def_key)
        } else {
            seProcessLoading(false)
            setWorkflow(undefined)
            originalWorkflow.current = undefined
        }
    }, [data])

    useEffect(() => {
        if (isSetWorkflow) {
            // setWorkflow(null)
        } else {
            setWorkflow(originalWorkflow.current)
        }
    }, [isSetWorkflow])

    /**
     * 保存
     */
    const saveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        try {
            const config = {
                id: workflowInfo.process_def_id,
                key: workflowInfo.process_def_key,
                name: workflowInfo.process_def_name,
                type,
            }
            originalWorkflow.current = config
            setIsSetWorkflow(false)

            forceRefreshPreview()

            if (onSave) {
                onSave(workflowInfo)
            }
        } catch {
            //
        }
    }

    const forceRefreshPreview = () => {
        setRefreshKey((prev) => prev + 1)
    }

    /**
     * 解绑审核流程
     */
    const unBindWorkflow = async () => {
        if (onUnBind) {
            confirm({
                title: __('确认解绑'),
                content: __('确认要解绑该流程吗？'),
                okText: __('确定'),
                cancelText: __('取消'),
                onOk() {
                    onUnBind()
                },
            })
        }
    }

    /**
     * 取消
     */
    const closeWorkflow = () => {
        setIsSetWorkflow(false)
        setWorkflow(null)
    }

    return (
        <>
            <div
                className={styles['workflow-view']}
                hidden={processLoading || loading}
            >
                <div className={styles['workflow-view-config']}>
                    <div>
                        {title && (
                            <div className={styles['config-title']}>
                                {title}
                            </div>
                        )}
                        {tip && (
                            <div className={styles['config-tip']}>{tip}</div>
                        )}
                    </div>
                    <Space direction="horizontal" size={12}>
                        {!workflow ? (
                            <Button
                                type="primary"
                                onClick={() => {
                                    setIsSetWorkflow(true)
                                    setWorkflow(null)
                                }}
                            >
                                {__('设置')}
                            </Button>
                        ) : (
                            <>
                                <Button
                                    key="edit"
                                    type="primary"
                                    onClick={() => {
                                        setIsSetWorkflow(true)
                                    }}
                                >
                                    {__('编辑')}
                                </Button>
                                {onUnBind && (
                                    <Button
                                        key="unBind"
                                        onClick={() => unBindWorkflow()}
                                    >
                                        {__('解绑')}
                                    </Button>
                                )}
                            </>
                        )}
                    </Space>
                </div>
                {workflow && (
                    <WorkflowViewPlugin
                        isFixed={false}
                        className={styles['workflow-preview']}
                        refreshKey={refreshKey}
                        flowProps={
                            {
                                process_type: type,
                                visit: VisitType.Preview,
                                process_def_key: workflow.key,
                                process_def_id: workflow.id,
                                previewBox: {
                                    background: '#fff',
                                },
                            } as any
                        }
                    />
                )}
                {isSetWorkflow && (
                    <WorkflowViewPlugin
                        flowProps={{
                            allowEditName: false,
                            process_type: type,
                            visit: workflow ? VisitType.Update : VisitType.New,
                            ...(workflow
                                ? {
                                      process_def_id: workflow.id,
                                      process_def_key: workflow.key,
                                  }
                                : {}),
                            onCloseAuditFlow: closeWorkflow,
                            onSaveAuditFlow: saveWorkflow,
                        }}
                    />
                )}
            </div>
            {(processLoading || loading) && (
                <div className={styles['workflow-view-loading']}>
                    <Loader />
                </div>
            )}
        </>
    )
}

export default memo(WorkflowView)
