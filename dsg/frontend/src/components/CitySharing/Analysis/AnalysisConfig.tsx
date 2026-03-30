import React, { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Checkbox,
    Col,
    Drawer,
    Dropdown,
    Form,
    FormInstance,
    Input,
    MenuProps,
    Radio,
    Row,
    Select,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { useAntdTable } from 'ahooks'
import {
    LeftCircleOutlined,
    PlusOutlined,
    RightCircleOutlined,
} from '@ant-design/icons'
import { debounce, flatMap } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { analysisConfigApiFields, analysisConfigViewFields } from './helper'
import {
    detailServiceOverview,
    formatError,
    getDataBaseDetails,
    getDataCatalogMountFrontend,
    getExploreReport,
    IShareApplyResource,
    queryServiceOverviewList,
    reqDataCatlgColumnInfo,
} from '@/core'
import { shareTypeList, typeOptoins } from '@/components/ResourcesDir/const'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { FieldData } from '../Apply/helper'
import { ApplyResource, ConfigModeEnum } from '../const'
import { ResTypeEnum } from '../helper'
import { ResourceDetailsFieldType } from '../Details/helper'
import { getActualUrl } from '@/utils'
import ReportDetail from '@/components/WorkOrder/QualityReport/ReportDetail'
import { createModelType } from '@/components/ApiServices/const'
import ConfigDataSerivce from '@/components/ConfigDataSerivce'

interface AnalysisConfigProps {
    configMode: ConfigModeEnum
    catalog: IShareApplyResource & any
    handleAddResource: () => void
    handleNext?: () => void
    handleLast?: () => void
    onChange: (fields: FieldData[], values: any, selectedRowKeys: any[]) => void // 表单字段数据变化
    handleSave?: () => void
    form: FormInstance
    handleCustonApiChange: (apiId: string) => void
}
const AnalysisConfig = ({
    configMode = ConfigModeEnum.Multiple,
    catalog = {},
    handleAddResource,
    handleNext,
    handleLast,
    onChange,
    handleSave,
    form,
    handleCustonApiChange,
}: AnalysisConfigProps) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedColumns, setSelectedColumns] = useState<any[]>([])
    // const [form] = Form.useForm()
    const [queryParams, setQueryParams] = useState({
        current: 1,
        pageSize: 5,
        catalogId: catalog?.res_id,
    })
    const [dbInfo, setDBInfo] = useState<any>({})
    const [interfaceData, setInterfaceData] = useState<any[]>([])
    const [isReport, setIsReport] = useState(false)
    const [operateItem, setOperateItem] = useState<any>()
    const [reportDetailVisible, setReportDetailVisible] =
        useState<boolean>(false)
    const [createModel, setCreateModel] = useState<createModelType>(
        createModelType.Wizard,
    )
    const [createApiOpen, setCreateApiOpen] = useState<boolean>(false)

    // 目录的库表交换使用analysisConfigViewFields
    // 目录的接口对接及接口资源使用analysisConfigApiFields
    const isApi = useMemo(
        () =>
            catalog.res_type === ResTypeEnum.Api ||
            catalog.apply_conf.supply_type === ApplyResource.Interface,
        [catalog],
    )

    const getDataQualityReport = async () => {
        try {
            const res = await getExploreReport({
                id: catalog.apply_conf.view_apply_conf.data_res_id,
            })
            setIsReport(!!res.task_id)
        } catch (error) {
            setIsReport(false)
        }
    }

    useEffect(() => {
        if (!isApi) {
            getDataQualityReport()
        }
    }, [isApi, catalog.res_id])

    useEffect(() => {
        form.resetFields()
        if (catalog.apply_conf?.view_apply_conf?.columns) {
            setSelectedRowKeys(
                catalog.apply_conf.view_apply_conf.column_ids?.split(',') || [],
            )
            setSelectedColumns(catalog.apply_conf.view_apply_conf.columns)
        }
        // 回显分析信息 无论目录还是接口
        const {
            is_reasonable,
            additional_info_types,
            attach_add_remark,
            is_res_replace,
            api_id,
        } = catalog

        form.setFieldsValue({
            is_reasonable,
            additional_info_types:
                catalog.res_type === ResTypeEnum.Api ||
                catalog.apply_conf.supply_type === ApplyResource.Interface ||
                (catalog.apply_conf?.view_apply_conf?.dst_data_source_id &&
                    catalog.apply_conf?.view_apply_conf?.dst_view_name)
                    ? additional_info_types?.split(',')
                    : additional_info_types
                    ? [
                          ...(additional_info_types?.split(',') || []),
                          'data-source',
                      ]
                    : ['data-source'],
            attach_add_remark,
            is_res_replace,
            api_id,
        })
    }, [catalog.res_id])

    const getColumnInfo = async (params) => {
        const {
            direction,
            keyword,
            sort,
            current: offset,
            pageSize: limit,
            catalogId,
        } = params

        try {
            setLoading(true)
            const res = await reqDataCatlgColumnInfo({
                catalogId,
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

    useEffect(() => {
        if (catalog.res_id && catalog.res_type === ResTypeEnum.Catalog) {
            run({
                ...queryParams,
                catalogId: catalog.res_id,
            })
        }
    }, [catalog.res_id])

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

    const handleNextRes = async () => {
        await form.validateFields()
        // 切换前先保存当前表单数据，避免因防抖导致数据丢失
        const currentValues = form.getFieldsValue()
        onChange([], selectedColumns, currentValues)
        handleNext?.()
    }

    const handleLastRes = async () => {
        // 切换前先保存当前表单数据，避免因防抖导致数据丢失
        const currentValues = form.getFieldsValue()
        onChange([], selectedColumns, currentValues)
        handleLast?.()
    }

    const getDataBaseInfo = async () => {
        const res = await getDataBaseDetails(
            catalog.apply_conf.view_apply_conf.dst_data_source_id,
        )
        setDBInfo(res)
    }

    useEffect(() => {
        if (
            catalog &&
            catalog.res_type === ResTypeEnum.Catalog &&
            catalog.apply_conf.supply_type === ApplyResource.Database
        ) {
            getDataBaseInfo()
        }
        if (
            catalog.apply_conf.supply_type === ApplyResource.Interface &&
            catalog.apply_conf.api_apply_conf.is_customized
        ) {
            getApi()
        }
    }, [catalog.res_id])

    const getApi = async () => {
        try {
            const mountRes = await getDataCatalogMountFrontend(catalog.res_id)
            const data: any[] =
                (mountRes?.mount_resource || [])
                    .map((item) => item.children || [])
                    .flat()
                    .filter((item) => item.resource_type === 2) || []
            setInterfaceData(
                data.map((item) => {
                    return {
                        res_type: ResTypeEnum.Api,
                        res_id: item.resource_id,
                        res_code: item.code,
                        res_name: item.name,
                        org_path: item.department_path,
                    }
                }),
            )
        } catch (error) {
            formatError(error)
        }
    }

    const getApiDetail = async (apiId: string) => {
        try {
            const res = await detailServiceOverview(apiId)
            setInterfaceData([
                {
                    res_type: ResTypeEnum.Api,
                    res_id: apiId,
                    res_code: res.service_info.service_code,
                    res_name: res.service_info.service_name,
                    org_path: res.service_info.department.name,
                    description: res.service_info.description,
                    // published
                    publish_status: res.service_info.publish_status,
                },
                ...interfaceData,
            ])
            form.setFieldsValue({
                api_id: apiId,
            })

            handleCustonApiChange(apiId)
        } catch (error) {
            formatError(error)
        }
    }

    const getValue = (field: any) => {
        let val = catalog
        if (Array.isArray(field.key)) {
            field.key.forEach((key) => {
                val = val?.[key]
            })
        } else {
            val = catalog[field.key]
        }

        if (field.type === ResourceDetailsFieldType.Other) {
            return dbInfo?.[field.key]
        }

        if (field.key.includes('report')) {
            return (
                <div
                    className={isReport ? styles['report-link'] : ''}
                    onClick={() => {
                        if (!isReport) {
                            return
                        }
                        setReportDetailVisible(true)
                        setOperateItem({
                            form_view_id:
                                catalog.apply_conf.view_apply_conf.data_res_id,
                            business_name:
                                catalog.apply_conf.view_apply_conf
                                    .data_res_name,
                        })
                    }}
                >
                    {isReport
                        ? `${
                              catalog.apply_conf.view_apply_conf.data_res_name
                          }${__('质量报告')}`
                        : '--'}
                </div>
            )
        }

        if (field.render) {
            return field.render(val, catalog)
        }
        return val || '--'
    }

    const items: MenuProps['items'] = [
        {
            key: createModelType.Wizard,
            label: (
                <div>
                    <FontIcon
                        name="icon-a-xiangdaomoshiiconbeifen2"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16, marginRight: 8 }}
                    />
                    {__('向导模式')}
                </div>
            ),
        },
        {
            key: createModelType.Script,
            label: (
                <div>
                    <FontIcon
                        name="icon-a-jiaobenmoshiiconbeifen2"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16, marginRight: 8 }}
                    />
                    {__('脚本模式')}
                </div>
            ),
        },
    ]

    const handleItemClick = (item) => {
        setCreateModel(item.key)
        setCreateApiOpen(true)
    }

    const onFieldsChange = (field, allFields) => {
        onChange(allFields, selectedColumns, form.getFieldsValue())
    }

    return (
        <div className={styles['analysis-config-wrapper']}>
            {(isApi ? analysisConfigApiFields : analysisConfigViewFields).map(
                (item, acfIndex) => {
                    return (
                        <div
                            className={styles['analysis-config-group']}
                            key={acfIndex}
                        >
                            <div className={styles['group-title']}>
                                <div>
                                    {item.groupTitle}
                                    {acfIndex === 0 && (
                                        <Space
                                            size={15}
                                            className={
                                                styles[
                                                    'analysis-header-operate'
                                                ]
                                            }
                                        >
                                            <Tooltip title={__('上一个资源')}>
                                                <LeftCircleOutlined
                                                    className={
                                                        styles['operate-icon']
                                                    }
                                                    onClick={handleLastRes}
                                                />
                                            </Tooltip>
                                            <Tooltip title={__('下一个资源')}>
                                                <RightCircleOutlined
                                                    className={
                                                        styles['operate-icon']
                                                    }
                                                    onClick={() =>
                                                        handleNextRes()
                                                    }
                                                />
                                            </Tooltip>
                                        </Space>
                                    )}
                                </div>
                                {configMode === ConfigModeEnum.Single &&
                                    acfIndex === 0 && (
                                        <Button onClick={handleSave}>
                                            {__('保存并返回列表')}
                                        </Button>
                                    )}
                            </div>
                            <Row>
                                {item.fields.map((field, fInx) => {
                                    return (
                                        <Col
                                            span={field.span}
                                            className={styles.item}
                                            key={fInx}
                                        >
                                            <div className={styles.label}>
                                                {field.label}：
                                            </div>
                                            <div className={styles.value}>
                                                {getValue(field)}
                                            </div>
                                        </Col>
                                    )
                                })}
                            </Row>
                        </div>
                    )
                },
            )}

            <Form
                form={form}
                className={styles['analysis-config-form']}
                // 实时将表单变更同步到父级，避免切换资源时因防抖导致配置未保存
                onFieldsChange={onFieldsChange}
            >
                {!isApi && (
                    <Form.Item
                        name="push_fields"
                        label={__('推送字段')}
                        labelCol={{ span: 24 }}
                        required
                        rules={[
                            {
                                required: true,
                                validator: (_, value) => {
                                    if (selectedRowKeys.length === 0) {
                                        return Promise.reject(
                                            new Error(__('请选择')),
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
                                hideOnSinglePage: pagination.total <= 5,
                                showSizeChanger: false,
                                size: 'small',
                            }}
                            rowSelection={rowSelection}
                        />
                    </Form.Item>
                )}

                <div className={styles['analysis-config-divider']} />
                <Form.Item
                    label={__('分析结果')}
                    required
                    name="is_reasonable"
                    colon
                    rules={[
                        {
                            required: true,
                            message: __('请选择'),
                        },
                    ]}
                >
                    <Radio.Group
                        onChange={() => {
                            if (
                                catalog.apply_conf.supply_type ===
                                    ApplyResource.Interface &&
                                catalog.apply_conf.api_apply_conf.is_customized
                            ) {
                                form.resetFields(['api_id'])
                            }
                        }}
                    >
                        <Radio value>{__('合理')}</Radio>
                        <Radio value={false}>{__('不合理')}</Radio>
                    </Radio.Group>
                </Form.Item>
                {/* 自定义接口合理时需要生成接口 */}
                {catalog.apply_conf.supply_type === ApplyResource.Interface &&
                    catalog.apply_conf.api_apply_conf.is_customized && (
                        <div style={{ display: 'flex' }}>
                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.is_reasonable !== cur.is_reasonable
                                }
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('is_reasonable') ? (
                                        <Form.Item
                                            name="api_id"
                                            label={__('选择数据资源')}
                                            required
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                options={interfaceData}
                                                placeholder={__('请选择')}
                                                fieldNames={{
                                                    label: 'res_name',
                                                    value: 'res_id',
                                                }}
                                                optionFilterProp="res_name"
                                                getPopupContainer={(n) =>
                                                    n.parentNode
                                                }
                                                style={{ width: 513 }}
                                            />
                                        </Form.Item>
                                    ) : null
                                }}
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.is_reasonable !== cur.is_reasonable
                                }
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('is_reasonable') ? (
                                        <Form.Item
                                            name="generate_api"
                                            // label={__('生成接口')}
                                            colon
                                        >
                                            <Dropdown
                                                menu={{
                                                    items,
                                                    onClick: handleItemClick,
                                                }}
                                                placement="bottomLeft"
                                            >
                                                <Button
                                                    type="primary"
                                                    icon={<PlusOutlined />}
                                                    style={{ marginLeft: 10 }}
                                                >
                                                    {__('生成接口')}
                                                </Button>
                                            </Dropdown>
                                        </Form.Item>
                                    ) : null
                                }}
                            </Form.Item>
                        </div>
                    )}
                <Form.Item
                    shouldUpdate={(pre, cur) => pre.api_id !== cur.api_id}
                    noStyle
                >
                    {({ getFieldValue }) => {
                        const apiId = getFieldValue('api_id')
                        const target = interfaceData.find(
                            (item) => item.res_id === apiId,
                        )
                        return apiId && target ? (
                            <div className={styles['res-info-container']}>
                                <div className={styles.label}>
                                    {__('资源名称：')}
                                </div>
                                <div className={styles.value}>
                                    <FontIcon
                                        name="icon-jiekoufuwuguanli"
                                        type={IconType.COLOREDICON}
                                        className={styles['api-icon']}
                                    />
                                    <div
                                        className={styles.name}
                                        title={target.res_name}
                                        onClick={() => {
                                            const url = `/dataService/interfaceService/api-service-detail?serviceId=${target.res_id}`
                                            window.open(getActualUrl(url))
                                        }}
                                    >
                                        {target.res_name}
                                    </div>
                                </div>
                                {target.publish_status &&
                                    target.publish_status !== 'published' && (
                                        <div className={styles.flag}>
                                            {__('未发布')}
                                        </div>
                                    )}
                            </div>
                        ) : null
                    }}
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(pre, cur) =>
                        pre.is_reasonable !== cur.is_reasonable
                    }
                >
                    {({ getFieldValue }) => {
                        return getFieldValue('is_reasonable') === true ? (
                            <Form.Item
                                label={__('请选择需要申请方补充的内容')}
                                labelCol={{ span: 24 }}
                                name="additional_info_types"
                                colon
                            >
                                <Checkbox.Group>
                                    {!isApi && (
                                        <Checkbox
                                            value="data-source"
                                            // disabled={
                                            //     !!catalog.apply_conf
                                            //         .view_apply_conf
                                            //         .dst_data_source_id
                                            // }
                                            disabled
                                        >
                                            {__('数据源信息')}
                                        </Checkbox>
                                    )}
                                    <Checkbox value="usage">
                                        {__('数据用途')}
                                    </Checkbox>
                                    <Checkbox value="attachment">
                                        {__('申请材料（如勾选，请补充说明）')}
                                    </Checkbox>
                                </Checkbox.Group>
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item>
                <Form.Item
                    noStyle
                    shouldUpdate={(pre, cur) =>
                        pre.is_reasonable !== cur.is_reasonable ||
                        pre.additional_info_types !== cur.additional_info_types
                    }
                >
                    {({ getFieldValue }) => {
                        return getFieldValue('is_reasonable') === true &&
                            getFieldValue('additional_info_types')?.includes(
                                'attachment',
                            ) ? (
                            <Form.Item
                                name="attach_add_remark"
                                label={__('申请材料补充说明')}
                                labelCol={{ span: 24 }}
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请输入'),
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    placeholder={__('请输入')}
                                    maxLength={500}
                                    showCount
                                    className={
                                        styles['analysis-config-textarea']
                                    }
                                />
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item>
                {catalog.res_type === ResTypeEnum.Catalog &&
                    catalog.apply_conf.supply_type ===
                        ApplyResource.Database && (
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.is_reasonable !== cur.is_reasonable
                            }
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('is_reasonable') ===
                                    false ? (
                                    <Form.Item
                                        name="is_res_replace"
                                        label={__('是否替换资源')}
                                        colon
                                        required
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择'),
                                            },
                                        ]}
                                    >
                                        <Radio.Group>
                                            <Tooltip
                                                title={__(
                                                    '更改后替换的资源会自动移除',
                                                )}
                                            >
                                                <Radio value>{__('是')}</Radio>
                                            </Tooltip>
                                            <Tooltip
                                                title={__(
                                                    '更改后替换的资源会自动移除',
                                                )}
                                            >
                                                <Radio value={false}>
                                                    {__('否')}
                                                </Radio>
                                            </Tooltip>
                                        </Radio.Group>
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                    )}

                <Form.Item
                    noStyle
                    shouldUpdate={(pre, cur) =>
                        pre.is_reasonable !== cur.is_reasonable ||
                        pre.is_res_replace !== cur.is_res_replace
                    }
                >
                    {({ getFieldValue }) => {
                        return getFieldValue('is_reasonable') === false &&
                            getFieldValue('is_res_replace') === true ? (
                            <Form.Item
                                name="new_res_id"
                                label={__('添加资源')}
                                colon
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择'),
                                    },
                                ]}
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        handleAddResource()
                                    }}
                                >
                                    {__('添加资源')}
                                </Button>
                            </Form.Item>
                        ) : null
                    }}
                </Form.Item>
                {catalog.new_res_name &&
                    catalog.apply_conf.data_res_name &&
                    catalog.is_res_replace && (
                        <div className={styles['replace-res-container']}>
                            <div className={styles['res-item']}>
                                <div className={styles['res-item-label']}>
                                    {__('资源名称：')}
                                </div>
                                <FontIcon
                                    name="icon-shujumuluguanli1"
                                    type={IconType.COLOREDICON}
                                    className={styles['res-item-icon']}
                                />
                                <div
                                    className={styles['res-item-value']}
                                    title={catalog.new_res_name}
                                >
                                    {catalog.new_res_name}
                                </div>
                            </div>
                            <div className={styles['res-item']}>
                                <div className={styles['res-item-label']}>
                                    {__('数据资源名称：')}
                                </div>
                                <FontIcon
                                    name="icon-shitusuanzi"
                                    type={IconType.COLOREDICON}
                                    className={styles['res-item-icon']}
                                />
                                <div
                                    className={styles['res-item-value']}
                                    title={catalog.apply_conf.data_res_name}
                                >
                                    {catalog.apply_conf.data_res_name}
                                </div>
                            </div>
                        </div>
                    )}
            </Form>
            {reportDetailVisible && (
                <ReportDetail
                    item={operateItem}
                    visible={reportDetailVisible}
                    onClose={() => {
                        setReportDetailVisible(false)
                        setOperateItem(undefined)
                    }}
                />
            )}
            {createApiOpen && (
                <Drawer
                    open={createApiOpen}
                    width="100vw"
                    headerStyle={{ display: 'none' }}
                    bodyStyle={{ padding: 0, overflow: 'hidden' }}
                >
                    <ConfigDataSerivce
                        createModel={createModel}
                        onClose={() => {
                            setCreateApiOpen(false)
                        }}
                        catalogId={catalog.res_id}
                        onOk={(id) => getApiDetail(id)}
                    />
                </Drawer>
            )}
        </div>
    )
}

export default AnalysisConfig
