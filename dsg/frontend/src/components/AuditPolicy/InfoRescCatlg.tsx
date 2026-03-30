import React, { useEffect, useState } from 'react'
import { Tabs, message } from 'antd'
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
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface IInfoRescDatalogAuditProcess {
    type: string
    title?: string
    tip?: string
    unBindTip?: string
    canUnBind?: boolean
}

export const InfoRescDatalogAuditProcess = ({
    type,
    title,
    tip,
    unBindTip,
    canUnBind = true,
}: IInfoRescDatalogAuditProcess) => {
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

const InfoRescDatalog: React.FC = () => {
    const [{ using }] = useGeneralConfig()
    return (
        <div className={styles['api-container']}>
            <Tabs
                defaultActiveKey={PolicyType.InfoRescCatlgPublish}
                destroyInactiveTabPane
                items={[
                    {
                        label: __('发布审核'),
                        key: PolicyType.InfoRescCatlgPublish,
                        children: (
                            <InfoRescDatalogAuditProcess
                                tip={__(
                                    '设置后，用户发布${type}时需要审核，审核通过后${type}发布才生效；若未设置，默认自动通过无需审核',
                                    { type: __('信息资源目录') },
                                )}
                                type={PolicyType.InfoRescCatlgPublish}
                            />
                        ),
                    },
                    {
                        label: __('上线审核'),
                        key: PolicyType.InfoRescCatlgOnline,
                        children: (
                            <InfoRescDatalogAuditProcess
                                tip={__(
                                    '设置后，用户上线${type}时需要审核，审核通过后${type}发布或变更审核才生效；若未设置，默认自动通过无需审核',
                                    { type: __('信息资源目录') },
                                )}
                                type={PolicyType.InfoRescCatlgOnline}
                            />
                        ),
                    },
                    {
                        label: __('下线审核'),
                        key: PolicyType.InfoRescCatlgOffline,
                        children: (
                            <InfoRescDatalogAuditProcess
                                tip={__(
                                    '设置后，用户下线${type}时需要审核，审核通过后${type}下线才生效；若未设置，默认自动通过无需审核',
                                    { type: __('信息资源目录') },
                                )}
                                type={PolicyType.InfoRescCatlgOffline}
                            />
                        ),
                    },
                    {
                        label: __('变更审核'),
                        key: PolicyType.InfoRescCatlgChange,
                        children: (
                            <InfoRescDatalogAuditProcess
                                tip={__(
                                    '设置审核流程后，用户变更信息资源目录时需要审核，审核通过后可变更信息资源目录；若未设置审核流程，默认自动通过无需审核',
                                )}
                                type={PolicyType.InfoRescCatlgChange}
                            />
                        ),
                    },
                ]}
            />
        </div>
    )
}

export default InfoRescDatalog
