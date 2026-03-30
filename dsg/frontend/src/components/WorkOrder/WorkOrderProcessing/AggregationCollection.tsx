import { Button, Col, Form, Input, message, Radio, Row, Tooltip } from 'antd'
import React, {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import moment from 'moment'
import { trim } from 'lodash'
import CollectionTable from '@/components/DataPlanManage/ListCollection/CollectionTable'
import {
    checkNameDataAggregationInventories,
    createDataAggregationInventories,
    formatError,
    getDataAggregationInventories,
    getDataAggregationInventoriesDetail,
    updateWorkOrderStatus,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { nameReg, validateName } from '@/utils'
import { MicroWidgetPropsContext } from '@/context'
import { CreateMethod } from '@/components/DataPlanManage/ListCollection/helper'
import PlanSelect from '../PlanSelect'
import { StatusType } from '../helper'
import { useProcessContext } from './ProcessProvider'
import AggregationAsset from './AggregationAsset'
import { DataViewProvider } from '@/components/DatasheetView/DataViewProvider'
import { SourceTypeEnum } from '../WorkOrderManage/helper'
import { FontIcon } from '@/icons'

const AggregationCollection = forwardRef(
    ({ readOnly, data, onClose, fromType }: any, ref) => {
        const { setProcessInfo } = useProcessContext()
        const [form] = Form.useForm()
        const [detail, setDetail] = useState<any>()
        const [resources, setResources] = useState<any[]>([])
        const { microWidgetProps } = useContext(MicroWidgetPropsContext)
        const cRef = useRef<any>()
        const [addType, setAddType] = useState<any>(CreateMethod.WorkOrder)
        const projectRef = useRef<any>()

        const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([])

        useEffect(() => {
            setProcessInfo((prev) => ({
                ...prev,
                canSubmit: resources?.length > 0,
            }))
        }, [setProcessInfo, resources])

        const getCollectionDetail = async (id: string) => {
            try {
                const res = await getDataAggregationInventoriesDetail(id)
                const curRes = (res?.resources || [])?.map((o) => ({
                    ...o,
                    // collected_at: o?.collected_at
                    //     ? moment(o?.collected_at)
                    //     : undefined,
                    datasource: o?.datasource_name,
                    datasource_type: o?.datasource_type,
                    datasource_id: o?.datasource_id,
                    explore_content: o?.value_assessment_status,
                    id: o?.data_view_id,
                }))
                setResources(curRes)
                form?.setFieldsValue({ resources: curRes })
            } catch (error) {
                formatError(error)
            }
        }

        useEffect(() => {
            let atype = data?.data_aggregation_inventory?.id
                ? CreateMethod.Raw
                : CreateMethod.WorkOrder

            if (
                fromType === SourceTypeEnum.PROJECT &&
                data?.data_aggregation_inventory?.business_forms?.length > 0
            ) {
                atype = CreateMethod.BusinessForm
            }

            setAddType(atype)
            form?.setFieldsValue({ creation_method: atype })
        }, [data, form, fromType])

        const collectionId = useMemo(() => {
            return data?.data_aggregation_inventory?.id
        }, [data])

        const setInfo = (dataDetail: any) => {
            setDetail(dataDetail)

            const {
                creation_method,
                resources: processResource,
                business_forms,
                name,
            } = dataDetail

            const curRes = processResource?.map((o) => ({
                ...o,
                // collected_at: o?.collected_at
                //     ? moment(o?.collected_at)
                //     : undefined,
                datasource: o?.datasource_name,
                datasource_type: o?.datasource_type,
                datasource_id: o?.datasource_id,
                explore_content: o?.value_assessment_status,
                id: o?.data_view_id,
            }))
            setResources(curRes)
            form?.setFieldsValue({
                name,
                creation_method: creation_method || CreateMethod.WorkOrder,
                resources: curRes,
                collection: dataDetail
                    ? {
                          value: dataDetail.id,
                          key: dataDetail.id,
                          label: dataDetail.name,
                      }
                    : undefined,
            })
        }

        useEffect(() => {
            if (data?.data_aggregation_inventory) {
                // 项目中添加的业务表形式
                if (
                    fromType === SourceTypeEnum.PROJECT &&
                    data?.data_aggregation_inventory?.business_forms?.length > 0
                ) {
                    return
                }

                const collectionDetail = data?.data_aggregation_inventory
                setInfo(collectionDetail)
            } else if (data?.data_aggregation_inventory_id) {
                getCollectionDetail(data?.data_aggregation_inventory_id)
            }
        }, [data?.data_aggregation_inventory])

        const handleFinish = () => {
            if (!readOnly) {
                form?.submit()
            }
        }

        const validate = () => {
            const values = form.getFieldsValue()
            if (addType === CreateMethod.WorkOrder) {
                // 检查名称
                if (!values?.name) {
                    return { valid: false, message: __('请输入名称') }
                }

                // 检查是否有资源
                if (!values?.resources || values.resources.length === 0) {
                    return { valid: false, message: __('请添加归集资源') }
                }

                // 检查资源配置是否完整
                const invalidResource = (values.resources || []).some(
                    (it) =>
                        !it.id ||
                        !it.collection_method ||
                        !it.sync_frequency ||
                        !it.target_datasource_id,
                )

                if (invalidResource) {
                    return { valid: false, message: __('归集资源配置项缺失') }
                }
            }
            if (addType === CreateMethod.Raw) {
                if (!values?.collection) {
                    return { valid: false, message: __('请选择关联归集清单') }
                }
            }
            if (addType === CreateMethod.BusinessForm) {
                return projectRef?.current?.validate()
            }
            return { valid: true }
        }

        const getFormData = () => {
            const values = form.getFieldsValue()
            if (addType === CreateMethod.WorkOrder) {
                return {
                    ...values,
                    creation_method: CreateMethod.WorkOrder,
                    resources: (values.resources || []).map((it) => {
                        return {
                            data_view_id: it?.id,
                            collection_method: it?.collection_method,
                            sync_frequency: it?.sync_frequency,
                            target_datasource_id: it?.target_datasource_id,
                            datasource_type: it?.datasource_type,
                            datasource_id: it?.datasource_id,
                        }
                    }),
                }
            }
            if (addType === CreateMethod.Raw) {
                return {
                    ...values,
                    creation_method: CreateMethod.Raw,
                    collection: values?.collection?.value,
                }
            }
            if (addType === CreateMethod.BusinessForm) {
                return {
                    creation_method: CreateMethod.BusinessForm,
                    ...projectRef?.current?.getFormData(),
                }
            }

            return form.getFieldsValue()
        }

        useImperativeHandle(ref, () => ({
            handleFinish,
            validate,
            getFormData,
        }))

        const handleResourcesChange = (newResources) => {
            setResources(newResources)
            form.setFieldsValue({ resources: newResources })
        }

        const validateNameRepeat = (fid?: string) => {
            return (_: any, value: string) => {
                return new Promise((resolve, reject) => {
                    const trimValue = trim(value)
                    if (!trimValue) {
                        reject(new Error(__('输入不能为空')))
                        return
                    }
                    if (trimValue && !nameReg.test(trimValue)) {
                        reject(
                            new Error(__('仅支持中英文、数字、下划线及中划线')),
                        )
                        return
                    }
                    const errorMsg = __('该名称已存在，请重新输入')
                    checkNameDataAggregationInventories({
                        name: trimValue,
                        id: fid,
                    })
                        .then(() => {
                            resolve(1)
                        })
                        .catch(() => {
                            reject(new Error(errorMsg))
                        })
                })
            }
        }

        const onFinish = async (values) => {
            try {
                let bindId: any = collectionId
                if (addType === CreateMethod.WorkOrder) {
                    const params = {
                        ...values,
                        creation_method: CreateMethod.WorkOrder,
                        resources: (values?.resources || [])?.map((it) => {
                            return {
                                data_view_id: it?.id,
                                // collected_at: it?.collected_at
                                //     ? moment(it?.collected_at).format(
                                //           'YYYY-MM-DDTHH:mm:ssZ',
                                //       )
                                //     : undefined,
                                collection_method: it?.collection_method,
                                sync_frequency: it?.sync_frequency,
                                target_datasource_id: it?.target_datasource_id,
                                datasource_type: it?.datasource_type,
                                datasource_id: it?.datasource_id,
                            }
                        }),
                    }

                    if (
                        params?.resources.some((it) =>
                            Object.keys(it).some((key) => !it[key]),
                        )
                    ) {
                        message.warn('归集资源配置项缺失')
                        return
                    }

                    const res = await createDataAggregationInventories(params)
                    bindId = res?.id
                } else {
                    // eslint-disable-next-line no-unused-expressions
                    bindId = values?.collection?.value
                }

                if (bindId) {
                    // 更新工单绑定
                    await updateWorkOrderStatus(data?.work_order_id, {
                        data_aggregation_inventory_id: bindId,
                        status: StatusType.ONGOING,
                    })

                    const tip = __('处理成功')

                    if (microWidgetProps?.components?.toast) {
                        microWidgetProps?.components?.toast.success(tip)
                    } else {
                        message.success(tip)
                    }

                    onClose?.(true)
                }
            } catch (error) {
                formatError(error, microWidgetProps?.components?.toast)
            }
        }

        const handleRelativeChange = (val) => {
            getCollectionDetail(val?.value)
            form?.setFieldsValue({ collection: val })
        }

        return (
            <div>
                <Form
                    form={form}
                    layout="horizontal"
                    onFinish={onFinish}
                    autoComplete="off"
                    className={styles.form}
                >
                    <Row gutter={40} className={styles.contentWrapper}>
                        {data?.source_type ===
                        SourceTypeEnum.SUPPLY_AND_DEMAND ? null : (
                            <Col
                                span={24}
                                hidden={
                                    fromType === SourceTypeEnum.PROJECT &&
                                    addType === CreateMethod.BusinessForm &&
                                    readOnly
                                }
                            >
                                <Form.Item
                                    label={__('添加方式')}
                                    name="creation_method"
                                    required
                                >
                                    {readOnly ? (
                                        <span>
                                            {detail?.creation_method ===
                                            CreateMethod.WorkOrder
                                                ? __('新建归集清单')
                                                : __('选择已有清单')}
                                        </span>
                                    ) : (
                                        <Radio.Group
                                            onChange={(e) => {
                                                const val = e.target.value
                                                setAddType(val)
                                                // 创建一个新的空数组，确保引用变化
                                                const emptyArray = []
                                                setResources(emptyArray)

                                                // 使用同一个空数组更新表单
                                                form?.setFieldsValue({
                                                    creation_method: val,
                                                    name: undefined,
                                                    resources: emptyArray,
                                                    collection: undefined,
                                                })
                                            }}
                                            value={addType}
                                        >
                                            <Radio
                                                value={CreateMethod.WorkOrder}
                                            >
                                                {__('新建归集清单')}
                                            </Radio>
                                            <Radio value={CreateMethod.Raw}>
                                                {__('选择已有清单')}
                                            </Radio>

                                            {/* 项目来源显示 */}
                                            {fromType ===
                                                SourceTypeEnum.PROJECT && (
                                                <Radio
                                                    value={
                                                        CreateMethod.BusinessForm
                                                    }
                                                >
                                                    {__('通过业务表添加')}
                                                </Radio>
                                            )}
                                        </Radio.Group>
                                    )}
                                </Form.Item>
                            </Col>
                        )}
                        {addType === CreateMethod.WorkOrder && (
                            <Col span={24}>
                                <Form.Item
                                    label={__('数据归集清单') + __('名称')}
                                    name="name"
                                    validateTrigger={['onChange', 'onBlur']}
                                    validateFirst
                                    rules={[
                                        {
                                            required: true,
                                            validateTrigger: [
                                                'onChange',
                                                'onBlur',
                                            ],
                                            validator: validateName(),
                                        },
                                        {
                                            validateTrigger: 'onBlur',
                                            validator: validateNameRepeat(),
                                        },
                                    ]}
                                >
                                    {readOnly ? (
                                        <span>{detail?.name}</span>
                                    ) : (
                                        <Input
                                            placeholder={__('请输入名称')}
                                            maxLength={128}
                                        />
                                    )}
                                </Form.Item>
                            </Col>
                        )}

                        {addType === CreateMethod.Raw && (
                            <Col span={24}>
                                <Form.Item
                                    label={__('数据归集清单') + __('名称')}
                                    name="collection"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择关联归集清单'),
                                        },
                                    ]}
                                >
                                    {readOnly ? (
                                        <span>{detail?.name}</span>
                                    ) : (
                                        <PlanSelect
                                            placeholder={__(
                                                '请选择关联归集清单',
                                            )}
                                            fetchMethod={
                                                getDataAggregationInventories
                                            }
                                            params={{ status: 'Completed' }}
                                            onChange={handleRelativeChange}
                                        />
                                    )}
                                </Form.Item>
                            </Col>
                        )}

                        {addType === CreateMethod.BusinessForm ? (
                            <Col span={24}>
                                <AggregationAsset
                                    ref={projectRef}
                                    readOnly={readOnly}
                                    data={data}
                                    onClose={onClose}
                                />
                            </Col>
                        ) : (
                            <Col span={24}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '16px',
                                    }}
                                >
                                    <span style={{ color: 'rgba(0,0,0,0.85)' }}>
                                        <span
                                            style={{
                                                color: '#ff4d4f',
                                                marginRight: '4px',
                                            }}
                                        >
                                            *
                                        </span>
                                        {__('归集资源')}:
                                    </span>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            columnGap: '16px',
                                        }}
                                    >
                                        <Tooltip
                                            title={
                                                selectedRowKeys?.length === 0
                                                    ? __('请勾选逻辑视图')
                                                    : undefined
                                            }
                                        >
                                            <Button
                                                type="link"
                                                icon={
                                                    <FontIcon
                                                        name="icon-shezhi"
                                                        style={{
                                                            marginRight: 6,
                                                        }}
                                                    />
                                                }
                                                className={
                                                    styles.batchConfigButton
                                                }
                                                hidden={
                                                    addType ===
                                                        CreateMethod.Raw ||
                                                    resources?.length === 0 ||
                                                    readOnly
                                                }
                                                disabled={
                                                    selectedRowKeys?.length ===
                                                    0
                                                }
                                                onClick={() => {
                                                    cRef.current?.onBatchConfigOpen(
                                                        true,
                                                    )
                                                }}
                                            >
                                                {__('批量配置')}
                                            </Button>
                                        </Tooltip>
                                        {data?.source_type ===
                                        SourceTypeEnum.SUPPLY_AND_DEMAND ? null : (
                                            <a
                                                onClick={() =>
                                                    cRef.current?.onAdd()
                                                }
                                                hidden={
                                                    addType ===
                                                        CreateMethod.Raw ||
                                                    resources?.length === 0 ||
                                                    readOnly
                                                }
                                            >
                                                + 添加库表
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <Form.Item
                                    name="resources"
                                    validateTrigger={['onChange', 'onBlur']}
                                >
                                    <DataViewProvider>
                                        <CollectionTable
                                            key={addType}
                                            ref={cRef}
                                            readOnly={
                                                readOnly ||
                                                addType === CreateMethod.Raw
                                            }
                                            isAsset
                                            value={resources}
                                            onChange={handleResourcesChange}
                                            onCheckChange={(keys) => {
                                                setSelectedRowKeys(keys)
                                            }}
                                        />
                                    </DataViewProvider>
                                </Form.Item>
                            </Col>
                        )}
                    </Row>
                </Form>
            </div>
        )
    },
)

export default AggregationCollection
