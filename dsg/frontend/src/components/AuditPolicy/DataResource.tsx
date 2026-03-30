import { Tabs, message } from 'antd'
import React, { useEffect, useState } from 'react'
import {
    formatError,
    getPolicyProcessList,
    createPolicyProcess,
    updatePolicyProcess,
    deletePolicyProcess,
} from '@/core'
import { IWorkflowInfo } from '../WorkflowViewPlugin'
import WorkflowView from './WorkflowView'
import { PolicyType } from './const'
import { getSelectedProcess } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IAuditProcess {
    type: string
    title?: string
    tip?: string
    unBindTip?: string
    canUnBind?: boolean
}

export const AuditProcess = ({
    type,
    title,
    tip,
    unBindTip,
    canUnBind = true,
}: IAuditProcess) => {
    const [workflow, setWorkflow] = useState<any>()
    const [loading, setLoading] = useState<boolean>(true)

    const getData = async () => {
        try {
            const auditProcess = await getPolicyProcessList({
                audit_type: type,
            })
            const auditData = getSelectedProcess(auditProcess?.entries, type)
            setWorkflow(auditData?.[0])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        getData()
    }, [])

    const handleSaveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        const processData = {
            audit_type: type,
            proc_def_key: workflowInfo.process_def_key,
            service_type: 'data-catalog',
        }
        try {
            if (!workflow) {
                await createPolicyProcess(processData)
                getData()
            } else {
                await updatePolicyProcess({
                    id: workflow?.id,
                    ...processData,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleUnbind = async () => {
        try {
            await deletePolicyProcess(workflow?.id)
            setWorkflow(undefined)
            message.success(__('解绑成功'))
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <WorkflowView
            title={title}
            tip={!workflow ? tip : unBindTip || undefined}
            type={type}
            data={workflow}
            loading={loading}
            onSave={handleSaveWorkflow}
            onUnBind={canUnBind ? handleUnbind : undefined}
        />
    )
}

const DataResource: React.FC = () => {
    return (
        <div className={styles['data-resource']}>
            <Tabs
                defaultActiveKey={PolicyType.CatalogPublish}
                destroyInactiveTabPane
                items={[
                    {
                        label: __('发布审核'),
                        key: PolicyType.CatalogPublish,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置后，用户发布数据目录及变更审核时需要审核，审核通过后数据目录发布或变更审核才生效；若未设置，默认自动通过无需审核',
                                )}
                                type={PolicyType.CatalogPublish}
                            />
                        ),
                    },
                    {
                        label: __('上线审核'),
                        key: PolicyType.CatalogOnline,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置后，用户上线数据目录时需要审核，审核通过后数据目录发布或变更审核才生效；若未设置，默认自动通过无需审核',
                                )}
                                type={PolicyType.CatalogOnline}
                            />
                        ),
                    },
                    {
                        label: __('下线审核'),
                        key: PolicyType.CatalogOffline,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置后，用户下线数据目录时需要审核，审核通过后数据目录下线才生效；若未设置，默认自动通过无需审核',
                                )}
                                type={PolicyType.CatalogOffline}
                            />
                        ),
                    },
                    {
                        label: __('变更审核'),
                        key: PolicyType.CatalogChange,
                        children: (
                            <AuditProcess
                                tip={__(
                                    '设置后，用户变更数据目录时需要审核，审核通过后数据目录变更才生效；若未设置，默认自动通过无需审核',
                                )}
                                type={PolicyType.CatalogChange}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

export default DataResource
