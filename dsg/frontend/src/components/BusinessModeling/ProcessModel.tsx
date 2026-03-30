import { useNavigate } from 'react-router-dom'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { Button, Dropdown, message } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { EllipsisOutlined, FlowchartOutlined, NewCoreBizColored } from '@/icons'
import { formatTime, OperateType } from '@/utils'
import {
    BizModelType,
    deleteCoreBusiness,
    formatError,
    getCoreBusinessDetails,
    getProcessNodeCountInfo,
    IBusinessDomainItem,
    ICoreBusinessDetails,
    IProcessNodeCount,
    TaskType,
} from '@/core'
import Confirm from '../Confirm'
import ModelForm from './ModelForm'
import ModelIndicator from './ModelIndicator'
import ModelFlowchart from './ModelFlowchart'
import ProcessSubmodel from './ProcessSubmodel'
import { TabKey, ViewMode } from './const'
import ModelLock from './ModelLock'
import { useBusinessModelContext } from './BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IProcessModel {
    processNode: IBusinessDomainItem
    handleOperate: (op: OperateType | TaskType, data?: any) => void
    businessDomainTreeRef?: any
}
const ProcessModel: React.FC<IProcessModel> = ({
    handleOperate,
    processNode,
    businessDomainTreeRef,
}) => {
    const navigate = useNavigate()
    const [isEmpty, setIsEmpty] = useState(false)
    const [delOpen, setDelOpen] = useState(false)
    const [modelDetails, setModelDetails] = useState<ICoreBusinessDetails>()
    const [countInfo, setCountInfo] = useState<IProcessNodeCount>({
        form_count: 0,
        flowchart_count: 0,
        standardization_rate: 0,
        indicator_model_count: 0,
        indicator_count: 0,
        model_id: '',
        locked: false,
    })

    const { businessModelType, refreshDraft, refreshCoreBusinessDetails } =
        useBusinessModelContext()

    const { checkPermission } = useUserPermCtx()

    const hasOprAccess = useMemo(
        () => checkPermission('manageBusinessModelAndBusinessDiagnosis'),
        [checkPermission],
    )

    const getDetails = async (id: string) => {
        if (!id) return
        const res = await getCoreBusinessDetails(id)
        if (res?.has_draft !== undefined) {
            refreshDraft?.(res?.has_draft)
        }
        refreshCoreBusinessDetails?.(res)
        setModelDetails(res)
    }

    const getCountInfo = async () => {
        try {
            const res = await getProcessNodeCountInfo(processNode.id, {
                model_type: businessModelType,
            })
            setCountInfo(res)
            getDetails(res.model_id)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getCountInfo()
    }, [processNode])

    // 删除业务模型
    const delCoreBusiness = async () => {
        if (!modelDetails?.business_model_id) return
        try {
            await deleteCoreBusiness(modelDetails?.business_model_id, {
                taskId: '',
                subject_domain_id: modelDetails.business_domain_id,
            })
            message.success(__('删除成功'))
            // onDeleteSuccess()
            // 更新架构树 数量
            await businessDomainTreeRef.current?.execNode(
                OperateType.MINUS,
                modelDetails.business_domain_id,
                undefined,
            )
            setDelOpen(false)
        } catch (error) {
            formatError(error)
        }
    }

    const items = hasOprAccess
        ? [
              {
                  key: OperateType.DETAIL,
                  label: __('基本信息'),
              },
              {
                  key: OperateType.DELETE,
                  label: __('删除'),
              },
          ]
        : []

    const onClick = ({ key, domEvent }) => {
        domEvent.stopPropagation()
        if (key === OperateType.DELETE) {
            setDelOpen(true)
        } else {
            handleOperate(key, modelDetails)
        }

        domEvent.preventDefault()
    }

    const goInto = (tab: TabKey) => {
        if (businessModelType === BizModelType.BUSINESS) {
            navigate(
                `/coreBusiness/${countInfo?.model_id}?domainId=${processNode.id}&targetTab=${tab}&viewType=${ViewMode.BArchitecture}`,
            )
        } else {
            navigate(
                `/coreData/${countInfo?.model_id}?domainId=${processNode.id}&targetTab=${tab}&viewType=${ViewMode.BArchitecture}`,
            )
        }
    }

    return (
        <div className={styles['process-model-wrapper']}>
            <div
                className={classnames(
                    styles['process-model-top'],
                    isEmpty && styles['process-model-empty-top'],
                    countInfo.locked && styles['process-model-top-lock'],
                )}
                style={{ height: processNode.expand ? 'unset' : '100%' }}
            >
                {!countInfo.model_id ? (
                    <Empty
                        desc={
                            businessModelType === BizModelType.BUSINESS
                                ? __('暂无业务模型，点击下方按钮可新建')
                                : __('暂无数据模型，点击下方按钮可新建')
                        }
                        iconSrc={dataEmpty}
                        onAdd={
                            !hasOprAccess
                                ? undefined
                                : () => handleOperate(OperateType.CREATE)
                        }
                        btnText={
                            businessModelType === BizModelType.BUSINESS
                                ? __('新建业务模型')
                                : __('新建数据模型')
                        }
                    />
                ) : countInfo.locked ? (
                    <ModelLock processId={processNode.id} />
                ) : (
                    <>
                        <div className={styles['basic-info-wrapper']}>
                            <NewCoreBizColored
                                className={styles['model-icon']}
                            />
                            <div className={styles['basic-info']}>
                                <div className={styles['basic-info-row']}>
                                    <div
                                        className={styles['model-name']}
                                        title={modelDetails?.name}
                                        onClick={() => goInto(TabKey.FORM)}
                                    >
                                        {modelDetails?.name}
                                    </div>
                                    <div className={styles['update-info']}>
                                        <span
                                            className={styles.userName}
                                            title={modelDetails?.updated_by}
                                        >
                                            {modelDetails?.updated_by}
                                        </span>
                                        &nbsp;
                                        {__('修改于')}&nbsp;
                                        {formatTime(
                                            modelDetails?.updated_at || 0,
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={styles['basic-info-row']}
                                    style={{ alignItems: 'flex-start' }}
                                >
                                    <div className={styles['basic-info-left']}>
                                        <div
                                            className={styles.desc}
                                            title={
                                                modelDetails?.description ||
                                                '--'
                                            }
                                        >
                                            {modelDetails?.description || '--'}
                                        </div>

                                        <div
                                            className={styles.belongInfoWrapper}
                                        >
                                            <div
                                                className={classnames(
                                                    styles.belongInfo,
                                                    styles.belongDomain,
                                                )}
                                            >
                                                <div className={styles.label}>
                                                    {__('所属部门：')}
                                                </div>
                                                <div
                                                    className={styles.value}
                                                    title={
                                                        processNode.department_name
                                                    }
                                                >
                                                    {processNode.department_name ||
                                                        '--'}
                                                </div>
                                            </div>
                                            <div className={styles.belongInfo}>
                                                <div className={styles.label}>
                                                    {__('关联信息系统：')}
                                                </div>
                                                <div
                                                    className={styles.value}
                                                    title={processNode.business_system_name?.join()}
                                                >
                                                    {processNode.business_system_name?.join() ||
                                                        '--'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={styles.dropdown}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Dropdown
                                            menu={{ items, onClick }}
                                            placement="bottomLeft"
                                            trigger={['click']}
                                            className={styles.itemMore}
                                            overlayStyle={{ width: 120 }}
                                        >
                                            <EllipsisOutlined
                                                className={styles.operateIcon}
                                            />
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles['model-content-wrapper']}>
                            <div
                                className={
                                    businessModelType === BizModelType.BUSINESS
                                        ? styles['left-content']
                                        : styles['data-left-content']
                                }
                            >
                                <ModelForm
                                    formCount={countInfo?.form_count}
                                    standardizationRate={
                                        countInfo?.standardization_rate
                                    }
                                    modelId={countInfo?.model_id}
                                    domainId={processNode.id}
                                />
                                <ModelIndicator
                                    modelCount={
                                        countInfo?.indicator_model_count
                                    }
                                    indicatorCount={countInfo?.indicator_count}
                                    modelId={countInfo?.model_id}
                                    domainId={processNode.id}
                                />
                            </div>
                            {businessModelType === BizModelType.BUSINESS && (
                                <div className={styles['right-content']}>
                                    <div className={styles['content-title']}>
                                        <div
                                            className={
                                                styles['content-title-left']
                                            }
                                        >
                                            <FlowchartOutlined
                                                className={classnames(
                                                    styles['flowchart-icon'],
                                                    styles[
                                                        'content-title-icon'
                                                    ],
                                                )}
                                            />
                                            {__('流程图')}
                                        </div>
                                        <Button
                                            type="link"
                                            onClick={() =>
                                                goInto(TabKey.PROCESS)
                                            }
                                        >
                                            {__('查看详情')}
                                        </Button>
                                    </div>
                                    <ModelFlowchart
                                        modelId={countInfo?.model_id}
                                        flowchartCount={
                                            countInfo.flowchart_count
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            {/* 存在子流程时展示，不存在则不展示 */}
            {processNode.expand && (
                <ProcessSubmodel
                    processNode={processNode}
                    handleOperate={handleOperate}
                    businessDomainTreeRef={businessDomainTreeRef}
                />
            )}

            <Confirm
                onOk={() => {
                    delCoreBusiness()
                }}
                onCancel={() => setDelOpen(false)}
                open={delOpen}
                title={__('确认要删除业务模型吗？')}
                content={__('删除后，本业务模型下的所有内容将一并删除。')}
                okText={__('确定')}
                cancelText={__('取消')}
            />
        </div>
    )
}
export default ProcessModel
