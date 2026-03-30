import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons'
import {
    Anchor,
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    InputNumber,
    Radio,
    Row,
    Select,
    Space,
    Tooltip,
    message,
} from 'antd'
import classnames from 'classnames'
import { trim } from 'lodash'
import moment from 'moment'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import EmptyAdd from '@/assets/emptyAdd.svg'
import {
    samplingRuleConfigRadio,
    samplingRuleConfigType,
} from '@/components/DatasheetView/DatasourceExploration/const'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameWorkOrder,
    createWorkOrder,
    formatError,
    getDataProcessingPlan,
    getWorkOrder,
    getWorkOrderDetail,
    updateWorkOrder,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Empty } from '@/ui'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'
import DepartResponsibleSelect from '../../DepartResponsibleSelect'
import {
    OrderType,
    OrderTypeOptions,
    SelectPriorityOptions,
    StatusType,
} from '../../helper'
import PlanSelect from '../../PlanSelect'
import Return from '../../Return'
import ViewDataChoose from '../../ViewDataChoose'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'
import __ from './locale'
import ModalTable from './ModalTable'
import styles from './styles.module.less'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const { Link } = Anchor

/**
 * 新建\编辑质量检测工单
 */
const OptModal = ({
    id,
    visible,
    type,
    fromType,
    onClose,
    projectNodeStageInfo,
    orderSourceType,
    orderName,
}: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const needDeclaration = useRef<boolean>(false)
    const container = useRef<any>(null)
    const [loading, setLoading] = useState<boolean>(false)
    // 工单详情
    const [detail, setDetail] = useState<any>()
    // 选择库表
    const [chooseVisible, setChooseVisible] = useState<boolean>(false)
    // 库表列表
    const [modalViews, setModalViews] = useState<any[]>([])
    const [userInfo] = useCurrentUser()
    const [remark, setRemark] = useState<any>({})
    const [samplingRuleNumber, setSamplingRuleNumber] = useState<number>(0)
    const [samplingRuleValue, setSamplingRuleValue] =
        useState<samplingRuleConfigType>(samplingRuleConfigType.All)
    const [sampleTip, setSampleTip] = useState<string>()
    // 工单类型
    const typeLabel = useMemo(() => {
        return OrderTypeOptions.find((o) => o.value === type)?.label ?? ''
    }, [type])

    // 是否是新建
    const isCreate = useMemo(() => {
        return !id || fromType === OrderType.AGGREGATION
    }, [id, fromType])
    const [{ third_party }] = useGeneralConfig()

    useEffect(() => {
        setSampleTip(third_party ? __('全量数据采样') : undefined)
        if (third_party) {
            setSamplingRuleNumber(0)
            setSamplingRuleValue(samplingRuleConfigType.All)
        }
    }, [third_party])

    // 获取质量检测工单详情
    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        }
    }

    // 归集工单详情
    const getAggregationDetail = async (_id?: string) => {
        if (!_id) {
            return
        }
        try {
            const detailRes = await getWorkOrderDetail(_id)
            const { name, data_aggregation_inventory } = detailRes

            // 按datasource_id分组resources
            const groupedResources =
                (data_aggregation_inventory?.resources || []).reduce(
                    (acc, resource) => {
                        const datasourceId = resource.datasource_id
                        if (!acc[datasourceId]) {
                            acc[datasourceId] = []
                        }
                        acc[datasourceId].push(resource)
                        return acc
                    },
                    {},
                ) || {}

            const dbIds = Object.keys(groupedResources) || []

            const datasource_infos = dbIds.map((o) => {
                const its = groupedResources?.[o] || []
                return {
                    datasource_id: its?.[0]?.datasource_id,
                    datasource_name: its?.[0]?.datasource_name,
                    datasource_type: its?.[0]?.datasource_type,
                    is_audited: undefined,
                    form_view_ids: its?.map((f) => f?.data_view_id),
                }
            })

            setRemark({ datasource_infos })
            const param = {
                source_type: SourceTypeEnum.AGGREGATION_WORK_ORDER,
                aggregation_work_order: {
                    key: _id,
                    value: _id,
                    label: name,
                },
                name: orderName,
            }
            form?.setFieldsValue(param)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            if (fromType === OrderType.AGGREGATION) {
                getAggregationDetail(id)
            } else {
                getDetail()
            }
        } else {
            form?.setFieldValue('name', orderName)
            form?.setFieldValue('source_type', orderSourceType)
        }
    }, [id, fromType])

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
                remark: strRemark,
                priority,
                responsible_uid,
                responsible_uname,
                source_id,
                source_name,
                source_type,
                quality_audit_form_views,
            } = detail
            // setModalViews(quality_audit_form_views || [])
            const jsonRemark = JSON.parse(strRemark || '{}')
            setRemark(jsonRemark)
            const totalSample = jsonRemark?.total_sample ?? 0
            setSamplingRuleNumber(totalSample)
            setSamplingRuleValue(
                totalSample
                    ? samplingRuleConfigType.Random
                    : samplingRuleConfigType.All,
            )

            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : source_type || SourceTypeEnum.STANDALONE

            const param: any = {
                name: orderName || name,
                description,
                // remark,
                source_type: orderSourceType || fType,
                priority: priority ? { value: priority } : undefined,
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
                param.plan = source_id
                    ? {
                          key: source_id,
                          value: source_id,
                          label: source_name,
                      }
                    : undefined
            } else if (source_type === 'aggregation_work_order') {
                param.aggregation_work_order = source_id
                    ? {
                          key: source_id,
                          value: source_id,
                          label: source_name,
                      }
                    : undefined
            }
            form?.setFieldsValue(param)
        } else {
            form?.resetFields()
            const param: any = {}
            param.responsible = {
                value: userInfo?.ID,
                key: userInfo?.ID,
                label: userInfo?.VisionName,
            }
            if (projectNodeStageInfo) {
                const fType = projectNodeStageInfo
                    ? SourceTypeEnum.PROJECT
                    : SourceTypeEnum.STANDALONE

                param.source_type = fType
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
            form?.setFieldsValue(param)
        }
    }, [detail, form, projectNodeStageInfo])

    // 验证工单名称是否重复
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

    // 提交前模型校验
    const validateModel = async (values) => {
        try {
            setLoading(true)
            onFinish(values)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const onFinish = async (values) => {
        const {
            priority,
            responsible,
            finished_at,
            source_type,
            source,
            plan,
            aggregation_work_order,
            ...rest
        } = values

        const params = {
            ...rest,
            quality_audit_form_view_ids: modalViews.map((o) => o.id),
            source_type: source_type || SourceTypeEnum.STANDALONE,
            type,
            priority: priority ? priority.value : undefined,
            finished_at: finished_at
                ? finished_at.endOf('day').unix()
                : undefined,
            responsible_uid: responsible?.value,
            remark: JSON.stringify({
                ...(remark || {}),
                total_sample: samplingRuleNumber,
            }),
            draft: !needDeclaration.current,
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
            params.source_id = plan?.value
        } else if (source_type === SourceTypeEnum.AGGREGATION_WORK_ORDER) {
            params.source_id = aggregation_work_order?.value
        }

        try {
            setLoading(true)

            if (isCreate) {
                await createWorkOrder(params)
            } else {
                await updateWorkOrder(id, params)
            }

            const tip = isCreate ? __('新建成功') : __('更新成功')
            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    // 来源类型改变
    const handleSourceTypeChange = (e) => {
        const sourceType = e.target.value
        const aggregationWorkOrder = form.getFieldValue(
            'aggregation_work_order',
        )
        if (
            sourceType === SourceTypeEnum.AGGREGATION_WORK_ORDER &&
            aggregationWorkOrder?.value
        ) {
            getAggregationDetail(aggregationWorkOrder?.value)
        }

        // 重置检测模型资源
        setRemark(undefined)
    }

    // 质量检测模型内容
    const getModalContent = (sourceType: string) => {
        // 是否基于归集工单
        const isBasedOnAggregation =
            sourceType === SourceTypeEnum.AGGREGATION_WORK_ORDER ||
            fromType === OrderType.AGGREGATION
        return remark?.datasource_infos?.length > 0 ? (
            <>
                <div className={styles['modal-table-top']}>
                    <div>
                        {!isBasedOnAggregation && (
                            <Button
                                icon={
                                    <PlusOutlined
                                        style={{ fontSize: 14, marginRight: 8 }}
                                    />
                                }
                                type="primary"
                                onClick={() => {
                                    setChooseVisible(true)
                                }}
                            >
                                添加资源
                            </Button>
                        )}
                        <span className={styles.tip}>
                            <InfoCircleOutlined
                                style={{ fontSize: 14, color: '#126EE3' }}
                            />
                            <span className={styles.tipTxt}>
                                提示：「数据质量检测模版」处开启的“系统预置”规则会在以下的资源中默认开启
                            </span>
                        </span>
                    </div>
                    <div className={styles.samplingBox}>
                        <span>{__('采样规则')}：</span>
                        {sampleTip}
                        <span hidden={!!sampleTip}>
                            <Radio.Group value={samplingRuleValue}>
                                <Space size={8}>
                                    {samplingRuleConfigRadio.map((item) => {
                                        return (
                                            <Radio
                                                onChange={(e) => {
                                                    const { value } = e.target
                                                    setSamplingRuleValue(value)
                                                    setSamplingRuleNumber(
                                                        value ===
                                                            samplingRuleConfigType.All
                                                            ? 0
                                                            : 1000,
                                                    )
                                                }}
                                                value={item.value}
                                                key={item.value}
                                            >
                                                {item.label}
                                                {samplingRuleValue ===
                                                    samplingRuleConfigType.Random &&
                                                    item.value ===
                                                        samplingRuleConfigType.Random && (
                                                        <span
                                                            style={{
                                                                marginLeft: 8,
                                                            }}
                                                        >
                                                            <InputNumber
                                                                className={
                                                                    styles.inpNumber
                                                                }
                                                                min={1000}
                                                                step={1000}
                                                                value={
                                                                    samplingRuleNumber
                                                                }
                                                                onChange={(
                                                                    val,
                                                                ) =>
                                                                    setSamplingRuleNumber(
                                                                        val ||
                                                                            1000,
                                                                    )
                                                                }
                                                            />
                                                            {__('条')}
                                                        </span>
                                                    )}
                                            </Radio>
                                        )
                                    })}
                                </Space>
                            </Radio.Group>
                        </span>
                    </div>
                </div>

                <ModalTable
                    dataSourceInfo={remark?.datasource_infos || []}
                    onConfigChange={(hasUnConfig) => {}}
                    workOrderTitle={detail?.name || '新建质量检测工单'}
                />
            </>
        ) : (
            <div>
                <Empty
                    iconSrc={EmptyAdd}
                    desc={
                        isBasedOnAggregation ? (
                            __('暂无数据')
                        ) : (
                            <div>
                                {__('点击')}
                                <a onClick={() => setChooseVisible(true)}>
                                    {__('【+添加】')}
                                </a>
                                {__('按钮，可添加库表和检测规则')}
                            </div>
                        )
                    }
                />
            </div>
        )
    }

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
                        title={`${isCreate ? __('新建') : __('编辑')}${__(
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
                                onFinish={validateModel}
                                autoComplete="off"
                                className={styles.form}
                                initialValues={{
                                    source_type: SourceTypeEnum.STANDALONE,
                                }}
                                scrollToFirstError
                            >
                                <div
                                    className={styles.moduleTitle}
                                    id="base-info"
                                >
                                    <h4>{__('基本信息')}</h4>
                                </div>

                                <div className={styles['padding-16']}>
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
                                                        validateTrigger:
                                                            'onChange',
                                                        validator:
                                                            validateName(),
                                                    },
                                                    {
                                                        validateTrigger:
                                                            'onBlur',
                                                        validator:
                                                            validateNameRepeat(
                                                                id,
                                                            ),
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
                                                        message:
                                                            __('请选择责任人'),
                                                    },
                                                ]}
                                            >
                                                <DepartResponsibleSelect
                                                    placeholder={__(
                                                        '请选择责任人',
                                                    )}
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
                                                    placeholder={__(
                                                        '请选择优先级',
                                                    )}
                                                    options={
                                                        SelectPriorityOptions
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
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                    format="YYYY-MM-DD"
                                                    placeholder={__(
                                                        '请选择截止日期',
                                                    )}
                                                    disabledDate={(current) => {
                                                        return (
                                                            current &&
                                                            current <
                                                                moment().startOf(
                                                                    'day',
                                                                )
                                                        )
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                        {
                                            projectNodeStageInfo ? (
                                                <>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label={__(
                                                                '来源项目',
                                                            )}
                                                            name="source"
                                                        >
                                                            <Select
                                                                labelInValue
                                                                placeholder={__(
                                                                    '请选择来源项目',
                                                                )}
                                                                options={
                                                                    projectOptions
                                                                }
                                                                disabled
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={12}>
                                                        <Form.Item
                                                            label={__(
                                                                '工单所在节点',
                                                            )}
                                                            name="node"
                                                        >
                                                            <Select
                                                                labelInValue
                                                                placeholder={__(
                                                                    '请选择工单所在节点',
                                                                )}
                                                                options={
                                                                    nodeOptions
                                                                }
                                                                disabled
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                </>
                                            ) : null
                                            // (
                                            // <>
                                            //     <Col span={12}>
                                            //         <Form.Item
                                            //             label={__('来源')}
                                            //             name="source_type"
                                            //         >
                                            //             <Radio.Group
                                            //                 disabled={
                                            //                     fromType ===
                                            //                         OrderType.AGGREGATION ||
                                            //                     !!orderSourceType
                                            //                 }
                                            //                 onChange={
                                            //                     handleSourceTypeChange
                                            //                 }
                                            //             >
                                            //                 <Radio
                                            //                     value={
                                            //                         SourceTypeEnum.STANDALONE
                                            //                     }
                                            //                 >
                                            //                     {__('无')}
                                            //                 </Radio>
                                            //                 <Radio
                                            //                     value={
                                            //                         SourceTypeEnum.PLAN
                                            //                     }
                                            //                 >
                                            //                     {__('处理计划')}
                                            //                 </Radio>
                                            //                 <Radio
                                            //                     value={
                                            //                         SourceTypeEnum.AGGREGATION_WORK_ORDER
                                            //                     }
                                            //                 >
                                            //                     {__('归集工单')}
                                            //                 </Radio>
                                            //             </Radio.Group>
                                            //         </Form.Item>
                                            //     </Col>
                                            //     <Form.Item
                                            //         noStyle
                                            //         shouldUpdate={(cur, prev) =>
                                            //             cur.source_type !==
                                            //             prev.source_type
                                            //         }
                                            //     >
                                            //         {({ getFieldValue }) => {
                                            //             const sourceType =
                                            //                 getFieldValue(
                                            //                     'source_type',
                                            //                 )
                                            //             return (
                                            //                 <Col span={12}>
                                            //                     {sourceType ===
                                            //                     SourceTypeEnum.PLAN ? (
                                            //                         <Form.Item
                                            //                             key="plan"
                                            //                             label={__(
                                            //                                 '来源计划',
                                            //                             )}
                                            //                             name="plan"
                                            //                             rules={[
                                            //                                 {
                                            //                                     required:
                                            //                                         true,
                                            //                                     message:
                                            //                                         __(
                                            //                                             '请选择来源计划',
                                            //                                         ),
                                            //                                 },
                                            //                             ]}
                                            //                         >
                                            //                             <PlanSelect
                                            //                                 placeholder={__(
                                            //                                     '请选择来源计划',
                                            //                                 )}
                                            //                                 fetchMethod={
                                            //                                     getDataProcessingPlan
                                            //                                 }
                                            //                                 params={{
                                            //                                     audit_status:
                                            //                                         'pass',
                                            //                                 }}
                                            //                             />
                                            //                         </Form.Item>
                                            //                     ) : (
                                            //                         sourceType ===
                                            //                             SourceTypeEnum.AGGREGATION_WORK_ORDER && (
                                            //                             <Form.Item
                                            //                                 key="aggregation_work_order"
                                            //                                 label={__(
                                            //                                     '来源工单',
                                            //                                 )}
                                            //                                 name="aggregation_work_order"
                                            //                                 rules={[
                                            //                                     {
                                            //                                         required:
                                            //                                             true,
                                            //                                         message:
                                            //                                             __(
                                            //                                                 '请选择来源工单',
                                            //                                             ),
                                            //                                     },
                                            //                                 ]}
                                            //                             >
                                            //                                 <PlanSelect
                                            //                                     placeholder={__(
                                            //                                         '请选择来源工单',
                                            //                                     )}
                                            //                                     fetchMethod={
                                            //                                         getWorkOrder
                                            //                                     }
                                            //                                     fieldMap={{
                                            //                                         label: 'name',
                                            //                                         value: 'work_order_id',
                                            //                                     }}
                                            //                                     params={{
                                            //                                         type: OrderType.AGGREGATION,
                                            //                                         status: StatusType.COMPLETED,
                                            //                                     }}
                                            //                                     disabled={
                                            //                                         fromType ===
                                            //                                         OrderType.AGGREGATION
                                            //                                     }
                                            //                                     onChange={(
                                            //                                         val,
                                            //                                     ) => {
                                            //                                         getAggregationDetail(
                                            //                                             val?.value,
                                            //                                         )
                                            //                                     }}
                                            //                                 />
                                            //                             </Form.Item>
                                            //                         )
                                            //                     )}
                                            //                 </Col>
                                            //             )
                                            //         }}
                                            //     </Form.Item>
                                            // </>
                                            // )
                                        }
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
                                                    placeholder={__(
                                                        '请输入工单说明',
                                                    )}
                                                    maxLength={800}
                                                    autoSize={{
                                                        minRows: 3,
                                                        maxRows: 3,
                                                    }}
                                                    showCount
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>

                                <div
                                    className={styles.moduleTitle}
                                    id="quality-modal"
                                >
                                    <h4>{__('质量检测模型')}</h4>
                                </div>
                                <div
                                    className={classnames(
                                        styles['modal-table'],
                                        styles['padding-16'],
                                    )}
                                >
                                    <Form.Item
                                        noStyle
                                        shouldUpdate={(cur, prev) =>
                                            cur.source_type !== prev.source_type
                                        }
                                    >
                                        {({ getFieldValue }) => {
                                            const sourceType =
                                                getFieldValue('source_type')
                                            return getModalContent(sourceType)
                                        }}
                                    </Form.Item>
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
                                    href="#quality-modal"
                                    title={__('质量检测模型')}
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
                                onClick={() => {
                                    needDeclaration.current = false
                                    form.submit()
                                }}
                                loading={loading}
                            >
                                {__('暂存')}
                            </Button>

                            <Tooltip
                                title={
                                    remark?.datasource_infos?.length === 0
                                        ? '未添加资源，无法提交'
                                        : ''
                                }
                                arrowPointAtCenter
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        needDeclaration.current = true
                                        form.submit()
                                    }}
                                    loading={loading}
                                    disabled={
                                        remark?.datasource_infos?.length === 0
                                    }
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>
            {chooseVisible && (
                <ViewDataChoose
                    open={chooseVisible}
                    bindData={remark?.datasource_infos || []}
                    onClose={() => {
                        setChooseVisible(false)
                    }}
                    onSure={(datasourceInfo, views) => {
                        const infos = datasourceInfo
                        setRemark({
                            datasource_infos: infos,
                        })
                        setChooseVisible(false)
                    }}
                />
            )}
        </Drawer>
    )
}
export default OptModal
