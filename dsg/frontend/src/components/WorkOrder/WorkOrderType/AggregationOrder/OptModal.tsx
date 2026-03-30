import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    Anchor,
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Modal,
    Radio,
    Row,
    Select,
    Space,
    Tooltip,
    message,
} from 'antd'
import { trim } from 'lodash'
import moment from 'moment'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameWorkOrder,
    createDataAggregationInventories,
    createWorkOrder,
    formatError,
    getDataAggregationPlan,
    getInvestigationReport,
    getWorkOrderDetail,
    updateWorkOrder,
    createCityDemandWorkOrder,
} from '@/core'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'

import DepartResponsibleSelect from '../../DepartResponsibleSelect'
import __ from './locale'
import styles from './styles.module.less'
import {
    InitPriorityOption,
    OrderTypeOptions,
    SelectPriorityOptions,
} from '../../helper'
import PlanSelect from '../../PlanSelect'
import BusinessFormSelect from '@/components/FormGraph/SelectFormList/BusinessFormSelect'
import SelectBusinessForm from './SelectBusinessForm'
import Return from '../../Return'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'
import ReportDetailModal from '@/components/DataPlanManage/Investigation/DetailModal'
import AggregationInfo from '../../WorkOrderProcessing/AggregationInfo'
import { CreateMethod } from '@/components/DataPlanManage/ListCollection/helper'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const { Link } = Anchor
const OptModal = ({
    id,
    visible,
    type,
    onClose,
    projectNodeStageInfo,
    cityDemandDetails,
    onDemandWorkOrderSuccess,
}: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [detail, setDetail] = useState<any>()
    const [fromType, setFromType] = useState<any>()
    const [reportItem, setReportItem] = useState<any>()
    const [reportVisible, setReportVisible] = useState<any>(false)
    const aRef = useRef<any>()
    const container = useRef<any>(null)
    const [userInfo] = useCurrentUser()
    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        }
    }

    const getReport = async () => {
        try {
            const res = await getInvestigationReport({ work_order_id: id })
            if (res?.entries?.[0]) {
                setReportItem(res?.entries?.[0])
            }
        } catch (error) {
            // formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
            getReport()
        }
    }, [id])

    // 供需管理创建归集工单，带过来的默认信息
    useEffect(() => {
        if (cityDemandDetails) {
            setDetail(cityDemandDetails)
        }
    }, [cityDemandDetails])

    const [projectOptions, nodeOptions] = useMemo(() => {
        const { project, node, stage } = projectNodeStageInfo || {}
        return projectNodeStageInfo
            ? [
                  [
                      {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      },
                  ],
                  [
                      stage
                          ? {
                                key: `${stage.id}-${node.id}`,
                                value: `${stage.id}-${node.id}`,
                                label: `${stage.name}/${node.name}`,
                            }
                          : {
                                key: node.id,
                                value: node.id,
                                label: node.name,
                            },
                  ],
              ]
            : [[], []]
    }, [projectNodeStageInfo])

    useEffect(() => {
        if (detail) {
            const {
                description,
                finished_at,
                name,
                // remark,
                priority,
                responsible_uid,
                responsible_uname,
                source_id,
                source_ids,
                source_name,
                source_type,
                data_aggregation_inventory,
            } = detail

            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : source_type || SourceTypeEnum.STANDALONE

            setFromType(fType)

            const param: any = {
                name,
                description,
                source_type: fType,
                // remark,
                priority: priority
                    ? SelectPriorityOptions.find((o) => o.value === priority)
                    : undefined,
                finished_at: finished_at
                    ? moment(finished_at * 1000)
                    : undefined,
                responsible: responsible_uid
                    ? { value: responsible_uid, label: responsible_uname }
                    : undefined,
            }

            // 项目创建
            if (projectNodeStageInfo) {
                const { project, node, stage } = projectNodeStageInfo || {}
                param.source = project
                    ? {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      }
                    : undefined
                param.node = node
                    ? stage?.id
                        ? {
                              key: `${stage.id}-${node.id}`,
                              value: `${stage.id}-${node.id}`,
                              label: `${stage.name}/${node.name}`,
                          }
                        : {
                              key: node.id,
                              value: node.id,
                              label: node.name,
                          }
                    : undefined
            } else if (source_type === SourceTypeEnum.PLAN) {
                param.source = source_id
                    ? { key: source_id, value: source_id, label: source_name }
                    : undefined
            }
            // else if (source_type === SourceTypeEnum.BUSINESS_FORM) {
            //     param.source_biz = data_aggregation_inventory?.business_forms
            //         ?.length
            //         ? data_aggregation_inventory?.business_forms?.map((o) => ({
            //               key: o?.id,
            //               value: o?.id,
            //               label: o?.name,
            //           }))
            //         : undefined
            // }
            form?.setFieldsValue(param)
        } else {
            form?.resetFields()
            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : SourceTypeEnum.STANDALONE
            setFromType(fType)

            const param: any = { source_type: fType }

            param.responsible = {
                value: userInfo?.ID,
                key: userInfo?.ID,
                label: userInfo?.VisionName,
            }

            if (projectNodeStageInfo) {
                const { project, node, stage } = projectNodeStageInfo || {}
                param.source = project
                    ? {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      }
                    : undefined
                param.node = node
                    ? stage?.id
                        ? {
                              key: `${stage.id}-${node.id}`,
                              value: `${stage.id}-${node.id}`,
                              label: `${stage.name}/${node.name}`,
                          }
                        : {
                              key: node.id,
                              value: node.id,
                              label: node.name,
                          }
                    : undefined
            }

            form?.setFieldsValue({
                ...param,
                name: `${__('数据归集工单')}${moment().format(
                    'YYYYMMDDHHmmss',
                )}`,
                priority: InitPriorityOption,
                finished_at: moment().add(2, 'weeks'),
            })
        }
    }, [detail, form, projectNodeStageInfo])

    const validateNameRepeat = (fid?: string) => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                    return
                }
                if (trimValue && !nameReg.test(trimValue)) {
                    reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
                    return
                }
                const errorMsg = __('该名称已存在，请重新输入')
                checkNameWorkOrder({
                    name: trimValue,
                    id: fid,
                    type,
                })
                    .then((res) => {
                        if (res) {
                            reject(new Error(errorMsg))
                        } else {
                            resolve(1)
                        }
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    const onFinish = async (values) => {
        // 验证AggregationInfo中的数据
        if (aRef.current && aRef.current.validate) {
            const validateResult = aRef.current.validate()
            if (!validateResult.valid) {
                if (microWidgetProps?.components?.toast) {
                    microWidgetProps?.components?.toast.error(
                        validateResult.message,
                    )
                } else {
                    message.warn(validateResult.message)
                }
                return
            }
        }

        const {
            priority,
            responsible,
            finished_at,
            source_type,
            source,
            source_biz,
            name,
            ...rest
        } = values

        // 获取AggregationInfo中的表单数据
        const aggregationData = aRef.current?.getFormData
            ? aRef.current.getFormData()
            : {}

        let tableData: any = {}

        if (source_type === SourceTypeEnum.BUSINESS_FORM) {
            const { creation_method, ...elseData } = aggregationData
            tableData = elseData
        }

        if (aggregationData.creation_method === CreateMethod.WorkOrder) {
            const res = await createDataAggregationInventories(aggregationData)
            tableData.data_aggregation_inventory_id = res?.id
        } else if (aggregationData.creation_method === CreateMethod.Raw) {
            tableData.data_aggregation_inventory_id =
                aggregationData?.collection
        } else if (
            aggregationData.creation_method === CreateMethod.BusinessForm
        ) {
            const { creation_method, ...elseData } = aggregationData
            tableData = elseData
        }

        const params = {
            ...rest,
            ...tableData, // 合并AggregationInfo中的数据
            name: trim(name),
            source_type,
            type,
            priority: priority ? priority.value : undefined,

            finished_at: finished_at
                ? finished_at.endOf('day').unix()
                : undefined,
            responsible_uid: responsible?.value,
        }
        if (projectNodeStageInfo) {
            params.source_type = SourceTypeEnum.PROJECT
            params.source_id = source?.value
            params.source_name = source?.label
            params.node_id = projectNodeStageInfo?.node?.id
            params.node_name = projectNodeStageInfo?.node?.name
            params.stage_id = projectNodeStageInfo?.stage?.id
            params.stage_name = projectNodeStageInfo?.stage?.name
        } else if (source_type === SourceTypeEnum.PLAN) {
            params.source_id = source?.value
        }

        // else if (source_type === SourceTypeEnum.BUSINESS_FORM) {
        //     params.source_ids = source_biz?.map((o) => o.value)
        // }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateWorkOrder(id, params)
            } else if (cityDemandDetails) {
                const res = await createCityDemandWorkOrder(
                    cityDemandDetails?.id,
                    {
                        ...params,
                        source_type: 'supply_and_demand',
                    },
                )
                if (onDemandWorkOrderSuccess) {
                    onDemandWorkOrderSuccess(res)
                }
            } else {
                await createWorkOrder(params)
            }

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const typeLabel = useMemo(() => {
        return OrderTypeOptions.find((o) => o.value === type)?.label ?? ''
    }, [type])

    const disabledDate = (current) => {
        return current && current < moment().startOf('day')
    }

    const ReportTipElse = reportItem ? (
        <span>
            {__('无法确认归集内容？可前往调研并完成')}
            <a
                onClick={(e) => {
                    e.stopPropagation()
                    setReportVisible(true)
                }}
            >
                {__('调研报告')}
            </a>
        </span>
    ) : (
        <span>
            {__('无法确认归集内容？可前往调研并完成')}
            <Tooltip title={__('暂无报告')}>
                <span style={{ textDecoration: 'underline' }}>
                    {__('调研报告')}
                </span>
            </Tooltip>
        </span>
    )

    const ReportTip = reportItem ? (
        <span>
            {__('查看')}
            <Tooltip
                title={`${__('无法确认归集内容？可前往调研并完成')}${__(
                    '调研报告',
                )}`}
            >
                <a
                    onClick={(e) => {
                        e.stopPropagation()
                        setReportVisible(true)
                    }}
                >
                    {__('调研报告')}
                </a>
            </Tooltip>
        </span>
    ) : (
        <span>
            {__('查看')}

            <Tooltip title={__('暂无报告')}>
                <span style={{ textDecoration: 'underline' }}>
                    {__('调研报告')}
                </span>
            </Tooltip>
        </span>
    )

    return (
        <Drawer
            open={visible}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={`${id ? __('编辑') : __('新建')}${__(
                            '${type}工单',
                            {
                                type: typeLabel,
                            },
                        )}`}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content} ref={container}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                            >
                                <div
                                    className={styles.moduleTitle}
                                    id="base-info"
                                >
                                    <h4>{__('基本信息')}</h4>
                                </div>
                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('工单名称')}
                                            name="name"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                            rules={[
                                                {
                                                    required: true,
                                                    validateTrigger: 'onChange',
                                                    validator: validateName(),
                                                },
                                                {
                                                    validateTrigger: 'onBlur',
                                                    validator:
                                                        validateNameRepeat(id),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入工单名称',
                                                )}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('责任人')}
                                            name="responsible"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择责任人'),
                                                },
                                            ]}
                                        >
                                            <DepartResponsibleSelect
                                                placeholder={__('请选择责任人')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('优先级')}
                                            name="priority"
                                        >
                                            <Select
                                                labelInValue
                                                placeholder={__('请选择优先级')}
                                                options={SelectPriorityOptions}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('截止日期')}
                                            name="finished_at"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                        >
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                disabledDate={disabledDate}
                                                placeholder={__(
                                                    '请选择截止日期',
                                                )}
                                                getPopupContainer={(node) =>
                                                    node.parentElement ||
                                                    document.body
                                                }
                                            />
                                        </Form.Item>
                                    </Col>

                                    {projectNodeStageInfo ? (
                                        <>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('来源项目')}
                                                    name="source"
                                                >
                                                    <Select
                                                        labelInValue
                                                        placeholder={__(
                                                            '请选择来源项目',
                                                        )}
                                                        options={projectOptions}
                                                        disabled
                                                        getPopupContainer={(
                                                            node,
                                                        ) => node.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('工单所在节点')}
                                                    name="node"
                                                >
                                                    <Select
                                                        labelInValue
                                                        placeholder={__(
                                                            '请选择工单所在节点',
                                                        )}
                                                        options={nodeOptions}
                                                        disabled
                                                        getPopupContainer={(
                                                            node,
                                                        ) => node.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    ) : cityDemandDetails ? null : (
                                        <Col span={24}>
                                            <Form.Item
                                                label={__('来源')}
                                                name="source_type"
                                            >
                                                <Radio.Group
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value
                                                        setFromType(val)
                                                        form?.setFieldsValue({
                                                            source_type: val,
                                                        })
                                                    }}
                                                    value={fromType}
                                                >
                                                    <Radio
                                                        value={
                                                            SourceTypeEnum.STANDALONE
                                                        }
                                                    >
                                                        无
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            SourceTypeEnum.PLAN
                                                        }
                                                    >
                                                        归集计划
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            SourceTypeEnum.BUSINESS_FORM
                                                        }
                                                    >
                                                        业务表
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    )}

                                    {fromType === SourceTypeEnum.PLAN && (
                                        <Col span={24}>
                                            <Form.Item
                                                key="source"
                                                label={__('来源计划')}
                                                name="source"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('请选择计划'),
                                                    },
                                                ]}
                                            >
                                                <PlanSelect
                                                    placeholder={__(
                                                        '请选择计划',
                                                    )}
                                                    fetchMethod={
                                                        getDataAggregationPlan
                                                    }
                                                    params={{
                                                        audit_status: 'pass',
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {/* {fromType ===
                                        SourceTypeEnum.BUSINESS_FORM && (
                                        <Col span={24}>
                                            <Form.Item
                                                key="source_biz"
                                                label={__('来源业务表')}
                                                name="source_biz"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('请选择业务表'),
                                                    },
                                                ]}
                                            >
                                                <SelectBusinessForm
                                                    placeholder={__(
                                                        '请选择业务表',
                                                    )}
                                                    onChange={(vals) =>
                                                        form?.setFieldsValue({
                                                            source_biz:
                                                                vals?.length > 0
                                                                    ? vals
                                                                    : undefined,
                                                        })
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                    )} */}
                                </Row>

                                <Row gutter={24}>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('工单说明')}
                                            name="description"
                                            rules={[
                                                {
                                                    pattern: keyboardReg,
                                                    message:
                                                        ErrorInfo.EXCEPTEMOJI,
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                placeholder={__('请输入')}
                                                maxLength={800}
                                                style={{
                                                    height: 100,
                                                    resize: 'none',
                                                }}
                                                className={styles['show-count']}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div
                                    className={styles.moduleTitle}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                    id="aggregation-info"
                                >
                                    <h4>{__('归集信息')}</h4>
                                    <span
                                        style={{
                                            fontSize: '12px',
                                            color: 'rgba(0,0,0,0.65)',
                                            marginRight: '10px',
                                        }}
                                    >
                                        {detail?.data_aggregation_inventory
                                            ?.resources?.length > 0 ||
                                        detail?.data_aggregation_inventory
                                            ?.resources?.length > 0
                                            ? ReportTip
                                            : ReportTipElse}
                                    </span>
                                </div>
                                <div style={{ paddingBottom: 80 }}>
                                    <AggregationInfo
                                        ref={aRef}
                                        data={detail}
                                        fromType={fromType}
                                        onClose={onClose}
                                    />
                                </div>
                            </Form>
                        </div>

                        <div className={styles.menuContainer}>
                            <Anchor
                                targetOffset={48}
                                getContainer={() =>
                                    (container.current as HTMLElement) || window
                                }
                                onClick={(e: any) => e.preventDefault()}
                                className={styles.anchorWrapper}
                            >
                                <Link
                                    href="#base-info"
                                    title={__('基本信息')}
                                />
                                <Link
                                    href="#aggregation-info"
                                    title={__('归集信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>

                            <Button
                                type="primary"
                                onClick={() => {
                                    form.submit()
                                }}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
            {reportVisible && (
                <ReportDetailModal
                    id={reportItem?.id}
                    onClose={() => {
                        setReportVisible(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default OptModal
