import React, { useState, useEffect, useMemo } from 'react'
import {
    Button,
    Col,
    DatePicker,
    Form,
    FormInstance,
    Input,
    InputNumber,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { debounce, trim, flatMap } from 'lodash'
import moment from 'moment'
import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import __ from '../locale'
import {
    FieldData,
    NotFoundContent,
    resourceUtilizationOptions,
} from './helper'
import {
    apiInfoConfig,
    catalogInfoConfig,
    resourceUsageConfig,
} from '../Details/helper'
import { GroupSubHeader, ResTypeEnum } from '../helper'
import styles from './styles.module.less'
import {
    ApplyResource,
    applyResourceOptions,
    updateCycleOptions,
} from '../const'
import {
    formatError,
    getDataCatalogMountFrontend,
    getDataSourceList,
    getFormsFromDatasource,
    getRescDirColumnInfo,
    reqDataCatlgColumnInfo,
} from '@/core'
import { shareTypeList, typeOptoins } from '@/components/ResourcesDir/const'
import CommonDetails from '../Details/CommonDetails'

interface ICatalogForm {
    form: FormInstance
    catalog: any // 目录数据
    fields?: FieldData[] // 表单字段数据
    onChange: (
        fields: FieldData[],
        selectedRowKeys: any[],
        unRequiredFields?: string[],
    ) => void // 表单字段数据变化回调
    checking: boolean
    setChecking: (value: boolean) => void
    handleLast: () => void
    handleNext: () => void
    handleSave?: () => void
}

/**
 * 项目选择组件
 */
const CatalogForm: React.FC<ICatalogForm> = ({
    form,
    catalog,
    fields = [],
    onChange,
    checking,
    setChecking,
    handleLast,
    handleNext,
    handleSave,
}) => {
    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')
    const [mountResource, setMountResource] = useState<any[]>([])

    // 查询params
    const [queryParams, setQueryParams] = useState({
        current: 1,
        pageSize: 5,
        catalogId: catalog?.res_id,
    })
    const [loading, setLoading] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedColumns, setSelectedColumns] = useState<any[]>([])
    const [dataSourceOptions, setDataSourceOptions] = useState<any[]>([])
    const [dataTableOptions, setDataTableOptions] = useState<
        {
            label: string
            value: string
        }[]
    >([])
    const [resOptions, setResOptions] = useState<any[]>([])

    useEffect(() => {
        form.resetFields()
        setSelectedRowKeys([])
        setSelectedColumns([])
        setDataTableOptions([])
        if (catalog) {
            form.setFieldsValue({
                supply_type:
                    catalog.res_type === ResTypeEnum.Catalog
                        ? ApplyResource.Database
                        : ApplyResource.Interface,
            })
        }
        if (catalog.apply_conf) {
            const { view_apply_conf, api_apply_conf, ...rest } =
                catalog.apply_conf
            if (catalog.res_type === ResTypeEnum.Catalog) {
                if (
                    catalog.apply_conf.supply_type === ApplyResource.Interface
                ) {
                    form.setFieldsValue({ ...rest, ...api_apply_conf })
                } else {
                    const { time_range_type, time_range, ...restViewConfig } =
                        view_apply_conf || {}
                    const timeRange =
                        time_range_type === 'select'
                            ? typeof time_range === 'string'
                                ? time_range
                                      .split('~')
                                      .map((item) => moment(item))
                                : time_range
                            : time_range
                    form.setFieldsValue({
                        ...rest,
                        ...restViewConfig,
                        time_range_type,
                        time_range: timeRange,
                    })
                }
            } else {
                form.setFieldsValue({ ...rest, ...api_apply_conf })
            }
            if (catalog.apply_conf?.view_apply_conf?.columns) {
                setSelectedRowKeys(
                    catalog.apply_conf.view_apply_conf.columns.map(
                        (col) => col.id,
                    ),
                )
                setSelectedColumns(catalog.apply_conf.view_apply_conf.columns)
            }
            if (view_apply_conf?.dst_data_source_id) {
                getDataTables(view_apply_conf?.dst_data_source_id)
            }
        }
    }, [catalog.res_id])

    useEffect(() => {
        if (catalog.res_type === ResTypeEnum.Api) return
        if (catalog?.res_id === queryParams.catalogId) {
            run({
                ...queryParams,
                current: 1,
                catalogId: catalog?.res_id,
            })
        } else {
            run({
                current: 1,
                pageSize: 5,
                catalogId: catalog?.res_id,
            })
        }
    }, [queryParams, catalog?.res_id])

    const getColumnInfo = async (params) => {
        const {
            direction,
            keyword,
            sort,
            current: offset,
            pageSize: limit,
        } = params

        try {
            setLoading(true)
            const res = await reqDataCatlgColumnInfo({
                catalogId: catalog?.res_id,
                direction,
                keyword,
                sort,
                offset,
                limit,
            })
            return {
                total: res?.total_count || 0,
                list: res?.columns || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getColumnInfo, {
        defaultPageSize: 5,
        manual: true,
    })

    const props = useMemo(() => {
        const p: { dataSource; onChange; [key: string]: any } = tableProps
        return p
    }, [tableProps])

    const getMountResource = async () => {
        try {
            const mountRes = await getDataCatalogMountFrontend(catalog.res_id)
            const newMountRes =
                mountRes?.mount_resource?.filter(
                    (item) => item.resource_type !== 3,
                ) || []
            setMountResource(newMountRes)
            const supplyType = form.getFieldValue('supply_type')
            const options =
                !supplyType || supplyType === ApplyResource.Database
                    ? newMountRes || []
                    : flatMap(newMountRes.map((item) => item.children || []))
            setResOptions(options)
        } catch (e) {
            formatError(e)
        }
    }

    useEffect(() => {
        if (catalog?.res_id && catalog?.res_type === ResTypeEnum.Catalog) {
            getMountResource()
        }
    }, [catalog.res_id])

    useEffect(() => {
        if (checking) {
            checkSelf()
        }
    }, [checking])

    const checkSelf = async () => {
        try {
            await form.validateFields()
            setChecking(false)
        } catch (e) {
            if (e.errorFields[0]?.name) {
                form.scrollToField(e.errorFields[0]?.name)
            }
        }
    }

    const getDataSources = async () => {
        const { entries } = await getDataSourceList({
            limit: 999,
        })
        setDataSourceOptions(entries)
    }

    useEffect(() => {
        getDataSources()
    }, [])

    // 可选择的资源
    // const chooseResource = useMemo(() => {
    //     const type = form.getFieldValue('supply_type')
    //     return mountResource.filter(
    //         (item) =>
    //             item.resource_type ===
    //             (type === ApplyResource.Database ? 1 : 2),
    //     )
    // }, [mountResource, form.getFieldValue('supply_type')])

    // 资源使用配置
    const getResourceUsageConfig = () => (
        <div className={styles.catalogForm_item}>
            <GroupSubHeader text={resourceUsageConfig.subTitle} />
            <div className={styles['catalogForm_item-content']}>
                <Form.Item
                    name="supply_type"
                    label={__('资源提供方式')}
                    required
                    className={styles.form_row}
                >
                    <Radio.Group>
                        {(catalog.res_type === ResTypeEnum.Api
                            ? applyResourceOptions.filter(
                                  (item) =>
                                      item.value === ApplyResource.Interface,
                              )
                            : applyResourceOptions
                        ).map((option) => (
                            <Radio
                                key={option.value}
                                value={option.value}
                                disabled={catalog.res_type === ResTypeEnum.Api}
                                onChange={(e) => {
                                    const options =
                                        e.target.value ===
                                        ApplyResource.Database
                                            ? mountResource
                                            : flatMap(
                                                  mountResource.map(
                                                      (item) =>
                                                          item.children || [],
                                                  ),
                                              )
                                    setResOptions(options)
                                    if (
                                        options.length === 0 &&
                                        e.target.value ===
                                            ApplyResource.Interface
                                    ) {
                                        form.setFieldValue(
                                            'is_customized',
                                            true,
                                        )
                                    }
                                    if (options.length === 1) {
                                        form.setFieldValue(
                                            'data_res_id',
                                            options[0].resource_id,
                                        )
                                    } else {
                                        form.resetFields(['data_res_id'])
                                    }
                                }}
                            >
                                {option.label}
                            </Radio>
                        ))}
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(pre, cur) =>
                        pre.supply_type !== cur.supply_type
                    }
                >
                    {({ getFieldValue }) => {
                        return getFieldValue('supply_type') ===
                            ApplyResource.Interface &&
                            catalog.res_type === ResTypeEnum.Catalog ? (
                            <Form.Item
                                name="is_customized"
                                label={__('选择的接口')}
                                required
                                className={styles.form_row}
                                initialValue={false}
                            >
                                <Radio.Group
                                    onChange={() => {
                                        if (resOptions.length === 1) {
                                            form.setFieldValue(
                                                'data_res_id',
                                                resOptions[0].resource_id,
                                            )
                                        } else {
                                            form.resetFields(['data_res_id'])
                                        }
                                    }}
                                >
                                    <Radio
                                        value={false}
                                        disabled={resOptions.length === 0}
                                    >
                                        {__('已有接口')}
                                    </Radio>
                                    <Radio value>{__('自定义接口')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(pre, cur) =>
                        pre.supply_type !== cur.supply_type ||
                        pre.interface_type !== cur.interface_type
                    }
                >
                    {({ getFieldValue }) => {
                        return getFieldValue('supply_type') ===
                            ApplyResource.Interface &&
                            getFieldValue('is_customized') === true ? (
                            <Form.Item
                                name="interface_desc"
                                label={__('自定义接口描述')}
                                required
                            >
                                <Input.TextArea
                                    maxLength={500}
                                    showCount
                                    placeholder={__(
                                        '描述自定义接口的请求参数，返回参数等信息',
                                    )}
                                    className={styles['interface-desc-area']}
                                />
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item>
                {catalog?.res_type === ResTypeEnum.Catalog && (
                    <Form.Item
                        shouldUpdate={(pre, cur) =>
                            pre.supply_type !== cur.supply_type ||
                            pre.is_customized !== cur.is_customized
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const supplyType = getFieldValue('supply_type')

                            return supplyType === ApplyResource.Interface &&
                                getFieldValue('is_customized') ? null : (
                                <Form.Item
                                    name="data_res_id"
                                    label={__('选择数据资源')}
                                    required={resOptions.length > 0}
                                    rules={[
                                        {
                                            required: resOptions.length > 0,
                                            message: __('请选择'),
                                        },
                                    ]}
                                >
                                    <Select
                                        options={resOptions}
                                        placeholder={
                                            resOptions.length === 0
                                                ? __('暂无数据')
                                                : __('请选择')
                                        }
                                        disabled={resOptions.length === 0}
                                        fieldNames={{
                                            label: 'name',
                                            value: 'resource_id',
                                        }}
                                        optionFilterProp="name"
                                        showSearch
                                        onSearch={(value) =>
                                            setSearchKey(trim(value))
                                        }
                                        notFoundContent={
                                            mountResource?.length === 0 &&
                                            searchKey === '' ? (
                                                <NotFoundContent />
                                            ) : (
                                                <NotFoundContent
                                                    text={__(
                                                        '抱歉，没有找到相关内容',
                                                    )}
                                                />
                                            )
                                        }
                                        getPopupContainer={(n) => n.parentNode}
                                        style={{ width: 513 }}
                                    />
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                )}
                {catalog.res_type === ResTypeEnum.Catalog && (
                    <Form.Item
                        shouldUpdate={(pre, cur) =>
                            pre.data_res_id !== cur.data_res_id
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const resId = getFieldValue('data_res_id')
                            const resInfo = mountResource?.find(
                                (item) => item.resource_id === resId,
                            )
                            return resId ? (
                                <div className={styles.resourceInfo}>
                                    <div className={styles.resourceName}>
                                        <div className={styles.label}>
                                            {__('数据资源名称：')}
                                        </div>
                                        <div className={styles.name}>
                                            {resInfo?.name}
                                        </div>
                                    </div>
                                    <div className={styles.resourceDesc}>
                                        {__('资源描述：')}
                                        {resInfo?.description || '--'}
                                    </div>
                                </div>
                            ) : null
                        }}
                    </Form.Item>
                )}

                {catalog.res_type === ResTypeEnum.Catalog && (
                    <Form.Item
                        noStyle
                        shouldUpdate={(pre, cur) =>
                            pre.supply_type !== cur.supply_type
                        }
                    >
                        {({ getFieldValue }) => {
                            return getFieldValue('supply_type') ===
                                ApplyResource.Interface ? null : (
                                <>
                                    <Col span={24}>
                                        <Form.Item
                                            name="area_range"
                                            label={__('期望空间范围')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请输入'),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入空间范围，如全市、市直、某各区、某个园区、某个街道等',
                                                )}
                                                maxLength={128}
                                                style={{ width: 513 }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name="time_range_type"
                                            label={__('期望时间范围')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择'),
                                                },
                                            ]}
                                            className={styles.form_row}
                                            initialValue="select"
                                        >
                                            <Radio.Group
                                                onChange={() =>
                                                    form.resetFields([
                                                        'time_range',
                                                    ])
                                                }
                                            >
                                                <Radio value="select">
                                                    {__('选择日期')}
                                                </Radio>
                                                <Radio value="self-define">
                                                    {__('自定义日期')}
                                                </Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>

                                    <Col span={24}>
                                        <Form.Item
                                            shouldUpdate={(pre, cur) =>
                                                pre.time_range_type !==
                                                cur.time_range_type
                                            }
                                        >
                                            {() => {
                                                return getFieldValue(
                                                    'time_range_type',
                                                ) === 'self-define' ? (
                                                    <Form.Item
                                                        name="time_range"
                                                        label=""
                                                        required
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message:
                                                                    __(
                                                                        '请选择',
                                                                    ),
                                                            },
                                                        ]}
                                                    >
                                                        <Input
                                                            placeholder={__(
                                                                '请输入时间范围',
                                                            )}
                                                            maxLength={128}
                                                            style={{
                                                                width: 513,
                                                            }}
                                                        />
                                                    </Form.Item>
                                                ) : (
                                                    <Form.Item
                                                        name="time_range"
                                                        label=""
                                                        required
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message:
                                                                    __(
                                                                        '请选择时间范围',
                                                                    ),
                                                            },
                                                        ]}
                                                    >
                                                        <DatePicker.RangePicker
                                                            style={{
                                                                width: 513,
                                                            }}
                                                        />
                                                    </Form.Item>
                                                )
                                            }}
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item
                                            name="push_frequency"
                                            label={__('期望推送频率')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={updateCycleOptions}
                                                placeholder={__('请选择')}
                                                getPopupContainer={(n) =>
                                                    n.parentNode
                                                }
                                                style={{ width: 513 }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </>
                            )
                        }}
                    </Form.Item>
                )}
                <Row gutter={48}>
                    <Col span={24}>
                        <Form.Item
                            name="available_date_type"
                            label={__('资源使用期限')}
                            required
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择'),
                                },
                            ]}
                            className={styles.form_row}
                            initialValue={-1}
                        >
                            <Radio.Group>
                                {resourceUtilizationOptions.map((option) => (
                                    <Radio
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </Radio>
                                ))}
                            </Radio.Group>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            shouldUpdate={(pre, cur) =>
                                pre.available_date_type !==
                                cur.available_date_type
                            }
                            noStyle
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('available_date_type') ===
                                    -2 ? (
                                    <Form.Item
                                        name="other_available_date"
                                        label={__('选择日期')}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择'),
                                            },
                                        ]}
                                    >
                                        <DatePicker
                                            placeholder={__('请选择')}
                                            getPopupContainer={(n) => n}
                                            disabledDate={(current) => {
                                                return (
                                                    current &&
                                                    current <
                                                        moment().endOf('day')
                                                )
                                            }}
                                            style={{ width: 513 }}
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Space>
                            <Form.Item
                                shouldUpdate={(pre, cur) =>
                                    pre.supply_type !== cur.supply_type
                                }
                                noStyle
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('supply_type') ===
                                        ApplyResource.Interface ? (
                                        <Form.Item
                                            name="call_frequency"
                                            label={__('预计调用频率')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请输入'),
                                                },
                                            ]}
                                        >
                                            <InputNumber
                                                placeholder={__('请输入')}
                                                min={1}
                                                max={100}
                                            />
                                        </Form.Item>
                                    ) : null
                                }}
                            </Form.Item>
                            <Form.Item
                                shouldUpdate={(pre, cur) =>
                                    pre.supply_type !== cur.supply_type
                                }
                                noStyle
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('supply_type') ===
                                        ApplyResource.Interface ? (
                                        <div
                                            className={styles['unit-container']}
                                        >
                                            {__('次/秒')}
                                        </div>
                                    ) : null
                                }}
                            </Form.Item>
                        </Space>
                    </Col>
                </Row>
            </div>
        </div>
    )

    const pushFieldsColumns = [
        {
            title: __('信息项中文名称'),
            dataIndex: 'business_name',
        },
        {
            title: __('共享属性'),
            key: 'shared_type',
            ellipsis: true,
            render: (item) => {
                const type =
                    shareTypeList.find((it) => it.value === item.shared_type)
                        ?.label || '--'
                const condition = item.shared_condition
                    ? `（${item.shared_condition}）`
                    : ''
                const title = `${type}${condition}`
                return (
                    <span className={styles.ellipsis} title={title}>
                        {title}
                    </span>
                )
            },
        },
        {
            title: __('源表字段名称'),
            dataIndex: 'technical_name',
        },
        {
            title: __('源表数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            render: (text) => {
                const val =
                    typeOptoins.find((item) => item.value === text)?.label || ''
                return <span title={val}>{val || '--'}</span>
            },
        },
    ]

    const rowSelection: any = useMemo(
        () => ({
            type: 'checkbox',
            selectedRowKeys,
            onChange: (selRowKeys: React.Key[], selectedRows: any[]) => {
                const newSelectedRowKeys = selectedRowKeys.filter(
                    (key) =>
                        !tableProps.dataSource.find((item) => item.id === key),
                )
                const newSelectedColumns = selectedColumns.filter(
                    (item) =>
                        !tableProps.dataSource.find((d) => d.id === item.id),
                )
                setSelectedRowKeys([...newSelectedRowKeys, ...selRowKeys])
                setSelectedColumns([...newSelectedColumns, ...selectedRows])
                form.validateFields(['push_fields'])
            },
        }),
        [selectedRowKeys, tableProps],
    )

    // 资源使用配置
    const getDataPushConfig = () => (
        <Form.Item
            noStyle
            shouldUpdate={(pre, cur) => pre.supply_type !== cur.supply_type}
        >
            {({ getFieldValue }) => {
                return getFieldValue('supply_type') ===
                    ApplyResource.Interface ? null : (
                    <div className={styles.catalogForm_item}>
                        <GroupSubHeader text={__('数据推送配置')} />
                        <div className={styles['catalogForm_item-content']}>
                            <Row gutter={78}>
                                <Col span={24}>
                                    <Form.Item
                                        name="new_dst_data_source"
                                        label={__('目标数据源来源')}
                                        required
                                        className={styles.form_row}
                                        initialValue={false}
                                    >
                                        <Radio.Group>
                                            <Radio value={false}>
                                                {__('已有数据源')}
                                            </Radio>
                                            {/* <Radio value disabled>
                                                {__('新增数据源')}
                                            </Radio> */}
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="dst_data_source_id"
                                        label={__('目标数据源')}
                                        className={styles.form_row}
                                    >
                                        <Select
                                            options={dataSourceOptions}
                                            fieldNames={{
                                                label: 'name',
                                                value: 'id',
                                            }}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.name ?? '')
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase(),
                                                    )
                                            }
                                            placeholder={__('请选择')}
                                            style={{ width: 284 }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="dst_view_name"
                                        label={__('目标数据表')}
                                        className={styles.form_row}
                                    >
                                        <Select
                                            options={dataTableOptions}
                                            showSearch
                                            filterOption={(input, option) =>
                                                (option?.label ?? '')
                                                    .toLowerCase()
                                                    .includes(
                                                        input.toLowerCase(),
                                                    )
                                            }
                                            placeholder={__('请选择')}
                                            style={{ width: 284 }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name="push_type"
                                        label={__('推送机制')}
                                        required
                                        className={styles.form_row}
                                        initialValue="full"
                                    >
                                        <Radio.Group>
                                            <Radio value="full">
                                                {__('全量')}
                                            </Radio>
                                            <Radio value="incr">
                                                {__('增量')}
                                            </Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item
                                        name="push_fields"
                                        label={__('推送字段')}
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                validator: (_, value) => {
                                                    if (
                                                        selectedRowKeys.length ===
                                                        0
                                                    ) {
                                                        return Promise.reject(
                                                            new Error(
                                                                __('请选择'),
                                                            ),
                                                        )
                                                    }
                                                    return Promise.resolve()
                                                },
                                            },
                                        ]}
                                    >
                                        <Table
                                            rowKey={(record) => record.id}
                                            columns={pushFieldsColumns}
                                            {...props}
                                            loading={loading}
                                            pagination={{
                                                ...tableProps.pagination,
                                                current: pagination.current,
                                                pageSize: pagination.pageSize,
                                                total: pagination.total,
                                                hideOnSinglePage:
                                                    pagination.total <= 5,
                                                size: 'small',
                                            }}
                                            rowSelection={rowSelection}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>
                    </div>
                )
            }}
        </Form.Item>
    )

    const normFile = (e: any) => {
        if (Array.isArray(e)) {
            return e
        }
        return e?.fileList
    }

    const handleLastOne = async () => {
        handleLast()
    }

    const handleNextOne = async () => {
        handleNext()
    }

    const getDataTables = async (dataSourceId: string) => {
        try {
            const res = await getFormsFromDatasource(dataSourceId)
            setDataTableOptions(
                res.map((item) => ({
                    label: item,
                    value: item,
                })),
            )
        } catch (e) {
            formatError(e)
        }
    }

    const onFieldsChange = (field, allFields) => {
        if (field[0]?.name[0]?.includes('dst_data_source_id')) {
            getDataTables(field[0].value)
        }

        const unRequiredFields: string[] = []
        if (resOptions.length === 0) {
            unRequiredFields.push('data_res_id')
        }

        onChange(allFields, selectedColumns, unRequiredFields)
    }

    return (
        <Form
            form={form}
            name={catalog?.res_id}
            layout="vertical"
            autoComplete="off"
            fields={fields}
            onFieldsChange={debounce(onFieldsChange, 500)}
            scrollToFirstError
            initialValues={{
                supply_type:
                    catalog.res_type === ResTypeEnum.Catalog
                        ? ApplyResource.Database
                        : ApplyResource.Interface,
            }}
            className={styles.catalogForm}
        >
            <div className={styles['catalogForm-header']}>
                <div className={styles['catalogForm-header-left']}>
                    <div className={styles['catalogForm-header-title']}>
                        {__('资源信息')}
                    </div>
                    <Space
                        size={15}
                        className={styles['catalogForm-header-operate']}
                    >
                        <Tooltip title={__('上一个资源')}>
                            <LeftCircleOutlined
                                className={styles['operate-icon']}
                                onClick={() => handleLastOne()}
                            />
                        </Tooltip>
                        <Tooltip title={__('下一个资源')}>
                            <RightCircleOutlined
                                className={styles['operate-icon']}
                                onClick={() => handleNextOne()}
                            />
                        </Tooltip>
                    </Space>
                </div>
                {handleSave && (
                    <Button
                        onClick={handleSave}
                        className={styles['catalogForm-header-save-btn']}
                    >
                        {__('保存并返回列表')}
                    </Button>
                )}
            </div>
            <div className={styles['res-info-container']}>
                <CommonDetails
                    data={catalog}
                    configData={
                        catalog.res_type === ResTypeEnum.Catalog
                            ? catalogInfoConfig
                            : apiInfoConfig
                    }
                />
            </div>
            {getResourceUsageConfig()}
            {catalog.res_type === ResTypeEnum.Catalog
                ? getDataPushConfig()
                : null}
            {/* {getDatabaseDesignMaterial()} */}
        </Form>
    )
}

export default CatalogForm
