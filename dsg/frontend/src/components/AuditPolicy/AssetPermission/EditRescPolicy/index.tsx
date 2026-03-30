import { CheckCircleFilled, CloseOutlined } from '@ant-design/icons'
import { Button, Col, Drawer, Form, Input, Row, Tooltip, message } from 'antd'
import { noop, trim } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'
import WorkflowViewPlugin, {
    IWorkflowInfo,
    VisitType,
} from '@/components/WorkflowViewPlugin'
import {
    IRescPolicyItem,
    RescPolicyStatus,
    addRescPolicy,
    reqRescPolicyDetail,
    updateRescPolicy,
} from '@/core'
import { invalidCharsRegex2 } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { rescPolicyPrcsType } from '..'
import { policyRescMaxNum } from '../SelDataRescModal'
import __ from './locale'
import RescEditTable from './RescEditTable'
import styles from './styles.module.less'

import { Loader } from '@/ui'
import { BizType, PolicyType } from '../../const'
import { handleRescPolicyError } from '../helper'
import { checkNameRepeat } from './helper'

interface IEditRescPolicy {
    open: boolean
    id?: string
    // oprType?: OperateType
    onClose: () => void
    onSure: (policyInfo?: any, isSetProcess?: boolean) => void
}

const EditRescPolicy = (props: IEditRescPolicy) => {
    const { id, open, onClose = noop, onSure = noop } = props
    // 是否新建
    // const isAddNew = oprType === OperateType.CREATE

    const [loading, setLoading] = useState(true)
    const [detail, setDetail] = useState<IRescPolicyItem>()
    //  // 审核资源列表（后端返回策略所有审核的资源）
    //  const [auditRescList, setAuditRescList] = useState<any[]>([])
    // 新建/编辑后返回的策略id
    const [newPolicyId, setNewPolicyId] = useState<string>('')

    // 设置流程
    const [workflow, setWorkflow] = useState<any>()
    // 设置策略open
    const [isSetWorkflowOpen, setIsSetWorkflowOpen] = useState<boolean>(false)

    // 添加资源modal
    const [selRescModalOpen, setSelRescModalOpen] = useState<boolean>(false)
    // 审核资源列表（后端返回策略所有审核的资源）
    const [auditRescList, setAuditRescList] = useState<any[]>([])

    const [form] = Form.useForm()

    const rescEditTableRef = useRef<any>()

    const rescList = useMemo(
        () => rescEditTableRef?.current?.rescList,
        [rescEditTableRef?.current?.rescList],
    )

    useEffect(() => {
        if (!open) return

        if (id) {
            getPolicyDetail(id)
        } else {
            setLoading(false)
            setDetail(undefined)
        }
    }, [open, id])

    // 新建需要配置流程功能，编辑无配置流程功能
    // useEffect(() => {
    //     if (detail?.proc_def_key) {
    //         getProcess(detail.proc_def_key)
    //     } else {
    //         // seProcessLoading(false)
    //         setWorkflow(undefined)
    //         // originalWorkflow.current = undefined
    //     }
    // }, [detail])

    const getPolicyDetail = async (_id) => {
        try {
            if (!_id) return
            setLoading(true)
            const res = await reqRescPolicyDetail(_id)
            setDetail(res)
            form.setFieldsValue({
                id: _id,
                name: res.name,
                description: res.description,
            })
            setAuditRescList(res.resources || [])
        } catch (e) {
            handleRescPolicyError(e)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 保存流程
     */
    const saveWorkflow = async (workflowInfo: IWorkflowInfo) => {
        try {
            const config = {
                id: workflowInfo.process_def_id,
                key: workflowInfo.process_def_key,
                name: workflowInfo.process_def_name,
                type: rescPolicyPrcsType,
            }
            let policyItem: any = {}
            if (id) {
                // 编辑策略详情
                policyItem = detail
            } else {
                // 新建策略详情
                policyItem = await reqRescPolicyDetail(newPolicyId)
            }

            // originalWorkflow.current = config
            setIsSetWorkflowOpen(false)
            // 配置流程
            confirm({
                title: __('审核流程保存成功'),
                icon: (
                    <CheckCircleFilled style={{ color: 'rgb(82, 196, 27)' }} />
                ),
                content: (
                    <div className={styles.modalContentWrapper}>
                        <div className={styles.modalContentTitle}>
                            {__('是否立即启用策略？')}
                        </div>
                        <div className={styles.modalContentWrapper}>
                            {__(
                                '启用后，用户申请策略管控范围内的资源权限时，将按照此策略设定的审核流程进行审核。',
                            )}
                        </div>
                    </div>
                ),
                okText: __('立即启用'),
                cancelText: __('暂不启用'),
                async onOk() {
                    try {
                        // 仅更新新建流程保存审核流程+启用状态
                        await updateRescPolicy({
                            ...policyItem,
                            status: RescPolicyStatus.Enabled,
                            proc_def_key: workflowInfo.process_def_key,
                            service_type: BizType.AuthService,
                            audit_type: PolicyType.AssetPermission,
                        })
                        message.success(__('启用成功'))
                        onSure?.(undefined, true)
                    } catch (e) {
                        handleRescPolicyError(e, onSure)
                    }
                },
                async onCancel() {
                    try {
                        // 仅更新新建流程保存审核流程
                        await updateRescPolicy({
                            ...policyItem,
                            proc_def_key: workflowInfo.process_def_key,
                            service_type: BizType.AuthService,
                            audit_type: PolicyType.AssetPermission,
                        })
                        onSure?.(undefined, true)
                    } catch (e) {
                        handleRescPolicyError(e, onSure)
                    }
                },
            })
        } catch (e) {
            // 统一处理错误
            handleRescPolicyError(e, onSure)
        }
    }

    /**
     * 取消
     */
    const closeWorkflow = () => {
        setIsSetWorkflowOpen(false)
        onSure()
    }

    const onFinish = async (values) => {
        try {
            const req = id ? updateRescPolicy : addRescPolicy

            const res = await req({
                ...(detail || {}),
                ...values,
                id,
                resources: rescEditTableRef?.current?.rescList,
                service_type: BizType.AuthService,
                audit_type: PolicyType.AssetPermission,
            })
            setNewPolicyId(res.id)

            if (!id) {
                // 新建
                confirm({
                    title: __('策略创建成功'),
                    icon: <CheckCircleFilled style={{ color: '#52C41B' }} />,
                    content: __(
                        '策略创建成功后，还需要完成审核流程配置才能启用生效。',
                    ),
                    okText: __('立即配置'),
                    cancelText: __('稍后配置'),
                    onOk() {
                        // 配置流程
                        setIsSetWorkflowOpen(true)
                        // onClose()
                    },
                    onCancel() {
                        onSure(values)
                    },
                })
            } else {
                // 编辑
                message.success(__('保存成功'))
                onSure(values)
            }
        } catch (e) {
            // 统一处理错误
            handleRescPolicyError(e, onSure)
        }
    }

    return (
        <div className={styles.editRescPolicyWrapper}>
            <Drawer
                open={open}
                title={
                    <div className={styles.sideDrawerHeader}>
                        <div>
                            {id ? __('编辑审核策略') : __('新建审核策略')}
                        </div>
                        <CloseOutlined
                            className={styles.closeBtn}
                            onClick={onClose}
                        />
                    </div>
                }
                width="70%"
                className={styles.sideDrawerWrapper}
                push={{ distance: 0 }}
                // placement="right"
                closable={false}
                bodyStyle={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                destroyOnClose
                maskClosable={false}
                // mask={false}
                onClose={onClose}
                footer={
                    <div className={styles.sideDrawerFooter}>
                        {!id && (
                            <div className={styles.drawerTip}>
                                {__(
                                    '提示：请先完成策略创建，策略创建成功后，还需要完成审核流程配置才能启用生效。',
                                )}
                            </div>
                        )}
                        <div className={styles.modalFooter}>
                            <Button
                                onClick={() => onClose?.()}
                                className={styles.btn}
                            >
                                {__('取消')}
                            </Button>
                            <Tooltip
                                title={
                                    rescEditTableRef?.current?.rescList
                                        ?.length >= policyRescMaxNum
                                        ? __('单条策略最多可添加1000个审核资源')
                                        : ''
                                }
                                getPopupContainer={(n) => n}
                            >
                                <Button
                                    onClick={async () => {
                                        // await form.validateFields()
                                        form.submit()
                                    }}
                                    type="primary"
                                    className={styles.btn}
                                    disabled={
                                        rescEditTableRef?.current?.rescList
                                            ?.length >= policyRescMaxNum
                                    }
                                >
                                    {__('确定')}
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                }
            >
                <div className={styles.policyContentWrapper}>
                    {loading ? (
                        <Loader />
                    ) : (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            autoComplete="off"
                            className={styles.form}
                            // initialValues={accountInfo || initialFromValue}
                        >
                            <Row gutter={24}>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('策略名称')}
                                        name="name"
                                        validateTrigger={['onChange', 'onBlur']}
                                        validateFirst
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请输入策略名称'),
                                            },
                                            {
                                                pattern: invalidCharsRegex2,
                                                validateTrigger: ['onBlur'],
                                                message: __(
                                                    '名称不能包含 \\ / : * ? " < > | 特殊字符，长度不能超过128个字符',
                                                ),
                                                transform: (value) =>
                                                    trim(value),
                                            },
                                            {
                                                validateTrigger: ['onBlur'],
                                                validator: (e, value) =>
                                                    checkNameRepeat(id, value),
                                            },
                                        ]}
                                        className={styles.horizontalFormItem}
                                    >
                                        <Input
                                            placeholder={__('请输入策略名称')}
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        label={__('描述')}
                                        name="description"
                                    >
                                        <Input.TextArea
                                            placeholder={__('请输入策略描述')}
                                            style={{ resize: `none` }}
                                            maxLength={300}
                                            autoSize={{ minRows: 3 }}
                                            showCount
                                            className={styles.showCount}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <RescEditTable
                                ref={rescEditTableRef}
                                curForm={form}
                                policyDetail={detail}
                            />
                        </Form>
                    )}
                </div>
            </Drawer>

            {/* 设置策略 */}
            {isSetWorkflowOpen && (
                <WorkflowViewPlugin
                    flowProps={{
                        allowEditName: false,
                        process_type: rescPolicyPrcsType,
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
                    className={styles.setWorkflowWrapper}
                />
            )}
        </div>
    )
}

export default EditRescPolicy
