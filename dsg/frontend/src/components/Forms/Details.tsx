import {
    ExclamationCircleFilled,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import { useAntdTable } from 'ahooks'
import { Button, Col, message, Row, Table, Tag, Tooltip } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { trim } from 'lodash'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import {
    deleteStandard,
    formatError,
    formsOriginalFieldsList,
    formsStandardFieldsList,
    IEnumeration,
    IFormEnumConfigModel,
    IStandardEnum,
    TaskStatus,
    transformQuery,
} from '@/core'
import CustomDrawer from '../CustomDrawer'
import {
    FormType,
    formTypeArr,
    fusionBasicConfig,
    IDetailConfig,
    numberAndStringTypeArr,
    numberTypeArr,
    orBasicConfig,
    orDetailConfig,
    stBasicConfig,
    stDetailConfig,
} from './const'
import styles from './styles.module.less'

import { TaskInfoContext } from '@/context'
import { AddOutlined } from '@/icons'
import RecommendOutlined from '@/icons/RecommendOutlined'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { formatTime, OperateType } from '@/utils'
import dataEmpty from '../../assets/dataEmpty.svg'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import {
    OpenAttribute,
    SecurityClassification,
    Sensibility,
    SharedAttribute,
} from '../FormGraph/helper'
import { getStandradRate } from '../Standard/const'
import CreateStandard from '../Standard/CreateStandard'
import StandardDetails from '../Standard/Details'
import { getFormulateBasis, StandardStatusLabel } from './helper'
import __ from './locale'
import Standardizing from './Standardizing'

interface IDetails {
    visible: boolean
    formType: FormType
    mid?: string
    formItem?: any
    standardEnum?: IStandardEnum
    configEnum: IFormEnumConfigModel | undefined
    onClose?: () => void
}

/**
 * @param visible boolean 显示/隐藏
 * @param formType FormType 表单类型
 * @param mid string 业务模型id
 * @param formItem 表单信息
 * @param standardEnum IStandardEnum? 业务标准枚举配置
 * @param onClose
 */
const Details: React.FC<IDetails> = ({
    visible,
    formType,
    mid,
    formItem,
    standardEnum,
    configEnum,
    onClose,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const taskDisabled = useMemo(() => {
        const { taskStatus, taskType } = taskInfo
        return taskStatus === TaskStatus.COMPLETED
    }, [taskInfo])

    // 标准化率
    const [rate, setRate] = useState<{
        fields_count: number
        standard_fields_count: number
    }>()

    // 操作类型
    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )

    // 标准化界面显示,【true】显示,【false】隐藏
    const [standardVisible, setStandardVisible] = useState(false)

    // 创建/编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 字段详情界面
    const [detailsVisible, setDetailsVisible] = useState(false)

    // 删除load
    const [delLoading, setDelLoading] = useState(false)

    // 初始params
    const initialQueryParams = {
        current: 1,
        pageSize: 10,
        keyword: '',
    }

    // 查询params
    const [queryParams, setQueryParams] = useState(initialQueryParams)

    // 操作字段的id
    const [sid, setSid] = useState<number>()

    const { isDraft, selectedVersion } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    // 获取表单字段信息
    const getFormFields = async (params: any) => {
        if (formType === FormType.FUSION) {
            return {
                total: params.Details?.length || 0,
                list: params.Details || [],
            }
        }
        const { current: offset, pageSize: limit, keyword } = params
        try {
            const req =
                formType === FormType.STANDARD
                    ? formsStandardFieldsList
                    : formsOriginalFieldsList
            const res = await req(mid!, formItem?.id, {
                offset,
                limit,
                keyword,
                ...versionParams,
            })
            setQueryParams(params)
            if (formType === FormType.STANDARD) {
                const fields = res.entries
                setRate({
                    fields_count: res.total_count,
                    standard_fields_count: res.standard_fields_count,
                })
                return { total: res.total_count, list: fields }
            }
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getFormFields, {
        defaultPageSize: 10,
        manual: true,
    })

    const props = useMemo(() => {
        const p: { dataSource; loading; onChange; [key: string]: any } =
            tableProps
        return p
    }, [tableProps])

    useEffect(() => {
        if (visible && formItem && mid) {
            switch (formType) {
                case FormType.FUSION:
                    run(formItem.fusion_form)
                    break
                default:
                    run(initialQueryParams)
            }
        }
    }, [visible, formItem, mid])

    // 操作处理
    const handleOperate = (type: OperateType, value?: any) => {
        setOperateType(type)
        switch (type) {
            case OperateType.CREATE:
                setSid(undefined)
                setEditVisible(true)
                break
            case OperateType.EDIT:
                setSid(value.id)
                setEditVisible(true)
                break
            case OperateType.DELETE:
                confirm({
                    title: __('确认要删除字段吗？'),
                    icon: (
                        <ExclamationCircleFilled className={styles.delIcon} />
                    ),
                    content: __('字段删除后将无法找回，请谨慎操作！'),
                    onOk() {
                        handleDelete(value.id)
                    },
                    okButtonProps: {
                        loading: delLoading,
                    },
                })
                break
            case OperateType.STANDARDING:
                setStandardVisible(true)
                break
            case OperateType.PREVIEW:
                setSid(value.id)
                setDetailsVisible(true)
                break
            default:
                break
        }
    }

    // 删除字段
    const handleDelete = async (id: number) => {
        try {
            setDelLoading(true)
            await deleteStandard(mid!, formItem?.id, id, taskInfo.taskId)
            message.success(__('删除成功！'))
        } catch (error) {
            formatError(error)
        } finally {
            setDelLoading(false)
            run({
                ...queryParams,
                current:
                    tableProps.dataSource.length === 1
                        ? pagination.current! - 1 || 1
                        : pagination.current!,
            })
        }
    }

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        run({
            ...pagination,
            keyword,
            current: 1,
        })
    }

    // 加载显示内容
    const loadInfoValue = (config: IDetailConfig): any => {
        const value: any = formItem?.[config.name]
        if (config.name === 'type') {
            return formTypeArr[formType].value
        }
        if (config.name === 'created_by_at') {
            return (
                <>
                    <div className={styles.value}>
                        {formItem?.created_by || '--'}
                    </div>
                    <div className={styles.value}>
                        {formatTime((formItem?.created_at || 0) as number)}
                    </div>
                </>
            )
        }
        if (!value) {
            if (config.name === 'description') {
                return __('暂无描述')
            }
            return value
        }
        if (typeof value === 'string') {
            return value
        }
        if (['created_at', 'updated_at'].includes(config.name)) {
            return formatTime(value as number)
        }
        if (
            ['data_range', 'update_cycle', 'overall_priority_rule'].includes(
                config.name,
            )
        ) {
            return (value as IEnumeration).display
        }
        if (config.name === 'resource_tag') {
            return (value as string[]).map((tag) => <Tag>{tag}</Tag>)
        }
        if (
            [
                'flowcharts',
                'source_system',
                'source_business_scene',
                'related_business_scene',
            ].includes(config.name)
        ) {
            return (value as string[]).join(';')
        }
        return value
    }

    // 加载单个配置信息
    const loadRowInfo = (config: IDetailConfig) => (
        <div className={styles.rowWrapper} key={config.name}>
            <div className={styles.label}>{config.label}</div>
            <div className={styles.value}>{loadInfoValue(config) || '--'}</div>
        </div>
    )

    // 加载所有配置信息
    const loadInfos = (type: number) => {
        let configs: (IDetailConfig | IDetailConfig[])[] = []
        if (formType === FormType.ORIGINAL) {
            configs = type ? orDetailConfig : orBasicConfig
        } else if (formType === FormType.STANDARD) {
            configs = type ? stDetailConfig : stBasicConfig
        } else {
            configs = fusionBasicConfig
        }
        return (
            <>
                {configs.map((config) => {
                    if (Array.isArray(config)) {
                        return (
                            <Row key={config[0].name}>
                                {config.map((c) => (
                                    <Col span={c.col} key={c.name}>
                                        {loadRowInfo(c)}
                                    </Col>
                                ))}
                            </Row>
                        )
                    }
                    return loadRowInfo(config)
                })}
            </>
        )
    }

    // 标准化率提示
    const FieldNormalizationRate = (
        <div className={styles.rateTips}>
            <p>{__('字段标准化率=标准字段数量/总字段数量x100%')}</p>
            <p>
                {__('标准字段数量')}
                {__('：')}
                {rate?.standard_fields_count || 0}
            </p>
            <p>
                {__('总字段数量')}
                {__('：')}
                {rate?.fields_count || 0}
            </p>
            <p>
                {__('字段标准化率')}
                {__('：')}
                {getStandradRate(rate)}
            </p>
        </div>
    )

    // 原始字段
    const columnsOr = [
        {
            title: __('字段中英文名称'),
            fixed: 'left',
            dataIndex: 'name_cn_en',
            key: 'name_cn_en',
            ellipsis: true,
            render: (_, record) => (
                <div className={styles.showTableInfo}>
                    <div className={styles.topInfo} title={record.name || '--'}>
                        {record.name || '--'}
                    </div>
                    <div
                        className={styles.bottomInfo}
                        title={record.name_en || '--'}
                    >
                        {record.name_en || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('本业务产生'),
            dataIndex: 'is_current_business_generation',
            key: 'is_current_business_generation',
            width: 120,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('标准主题'),
            dataIndex: 'standard_theme',
            key: 'standard_theme',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('一级分类'),
            dataIndex: 'primary_class',
            key: 'primary_class',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('二级分类'),
            dataIndex: 'secondary_class',
            key: 'secondary_class',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('标准分类'),
            dataIndex: 'formulate_basis',
            key: 'formulate_basis',
            ellipsis: true,
            render: (_, record) => {
                const value = getFormulateBasis(
                    record.formulate_basis,
                    standardEnum,
                )
                return (
                    <div className={styles.baseTableRow}>{value || '--'}</div>
                )
            },
        },
        {
            title: __('业务定义'),
            dataIndex: 'business_definition',
            key: 'business_definition',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('标准来源规范文件'),
            dataIndex: 'standard_source_specification_document',
            key: 'standard_source_specification_document',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            render: (_, record) => {
                const bo = numberAndStringTypeArr.includes(record.data_type)
                return (
                    <div
                        className={styles.baseTableRow}
                        title={record.data_length || 0}
                    >
                        {bo ? record.data_length || 0 : '--'}
                    </div>
                )
            },
        },
        {
            title: __('主键'),
            dataIndex: 'is_primary_key',
            key: 'is_primary_key',
            width: 80,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('增量字段'),
            dataIndex: 'is_incremental_field',
            key: 'is_incremental_field',
            width: 100,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('必填'),
            dataIndex: 'is_required',
            key: 'is_required',
            width: 80,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('码表'),
            dataIndex: 'code_table',
            key: 'code_table',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('值域'),
            dataIndex: 'value_range',
            key: 'value_range',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('编码规则'),
            dataIndex: 'encoding_rule',
            key: 'encoding_rule',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('字段关系'),
            dataIndex: 'field_relationship',
            key: 'field_relationship',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('样例'),
            dataIndex: 'sample',
            key: 'sample',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('说明'),
            dataIndex: 'explanation',
            key: 'explanation',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('敏感属性'),
            dataIndex: 'sensitive_attribute',
            key: 'sensitive_attribute',
            width: 100,
            ellipsis: true,
            render: (value) => {
                const arr = standardEnum?.sensitive_attribute
                    .filter((v) => v.value === value)
                    .map((v) => v.type)
                return (
                    <div className={styles.baseTableRow}>
                        {arr && arr?.length > 0 ? arr[0] : '--'}
                    </div>
                )
            },
        },
        {
            title: __('涉密属性'),
            dataIndex: 'confidential_attribute',
            key: 'confidential_attribute',
            width: 100,
            ellipsis: true,
            render: (value) => {
                const arr = standardEnum?.confidential_attribute
                    .filter((v) => v.value === value)
                    .map((v) => v.type)
                return (
                    <div className={styles.baseTableRow}>
                        {arr && arr?.length > 0 ? arr[0] : '--'}
                    </div>
                )
            },
        },
        {
            title: __('共享属性'),
            dataIndex: 'shared_attribute',
            key: 'shared_attribute',
            ellipsis: true,
            render: (value) => {
                const arr = standardEnum?.shared_attribute
                    .filter((v) => v.value === value)
                    .map((v) => v.type)
                return (
                    <div className={styles.baseTableRow}>
                        {arr && arr?.length > 0 ? arr[0] : '--'}
                    </div>
                )
            },
        },
        {
            title: __('开放属性'),
            dataIndex: 'open_attribute',
            key: 'open_attribute',
            ellipsis: true,
            render: (value) => {
                const arr = standardEnum?.open_attribute
                    .filter((v) => v.value === value)
                    .map((v) => v.type)
                return (
                    <div className={styles.baseTableRow}>
                        {arr && arr?.length > 0 ? arr[0] : '--'}
                    </div>
                )
            },
        },
    ]

    // 业务表字段
    const columnsSt = [
        {
            title: __('字段中英文名称'),
            fixed: 'left',
            dataIndex: 'name_cn_en',
            key: 'name_cn_en',
            ellipsis: true,
            render: (_, record) => (
                <div className={styles.showTableInfo}>
                    <div className={styles.topInfo} title={record.name || '--'}>
                        {record.name || '--'}
                    </div>
                    <div
                        className={styles.bottomInfo}
                        title={record.name_en || '--'}
                    >
                        {record.name_en || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('标准化状态'),
            dataIndex: 'standard_status',
            key: 'standard_status',
            render: (_, record) => {
                return (
                    <StandardStatusLabel value={record.standard_status || ''} />
                )
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            render: (_, record) => {
                const bo = numberAndStringTypeArr.includes(record.data_type)
                return (
                    <div
                        className={styles.baseTableRow}
                        title={bo ? record.data_length || 0 : '--'}
                    >
                        {bo ? record.data_length || 0 : '--'}
                    </div>
                )
            },
        },
        {
            title: __('数据精度'),
            dataIndex: 'data_accuracy',
            key: 'data_accuracy',
            ellipsis: true,
            render: (_, record) => {
                const bo = numberTypeArr.includes(record.data_type)
                return (
                    <div
                        className={styles.baseTableRow}
                        title={bo ? record.data_accuracy || 0 : '--'}
                    >
                        {bo ? record.data_accuracy || 0 : '--'}
                    </div>
                )
            },
        },
        {
            title: __('计量单位'),
            dataIndex: 'unit',
            key: 'unit',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('值域'),
            dataIndex: 'value_range',
            key: 'value_range',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('字段关系'),
            dataIndex: 'field_relationship',
            key: 'field_relationship',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('标准分类'),
            dataIndex: 'formulate_basis',
            key: 'formulate_basis',
            ellipsis: true,
            render: (value, record) => {
                // const value = getFormulateBasis(
                //     record.formulate_basis,
                //     standardEnum,
                // )
                return (
                    <div className={styles.baseTableRow}>{value || '--'}</div>
                )
            },
        },
        {
            title: __('本业务产生'),
            dataIndex: 'is_current_business_generation',
            key: 'is_current_business_generation',
            width: 120,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('主键'),
            dataIndex: 'is_primary_key',
            key: 'is_primary_key',
            width: 80,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('增量字段'),
            dataIndex: 'is_incremental_field',
            key: 'is_incremental_field',
            width: 100,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('必填'),
            dataIndex: 'is_required',
            key: 'is_required',
            width: 80,
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>
                    {value ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('码表'),
            dataIndex: 'code_table',
            key: 'code_table',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },

        {
            title: __('编码规则'),
            dataIndex: 'encoding_rule',
            key: 'encoding_rule',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('敏感属性'),
            dataIndex: 'sensitive_attribute',
            key: 'sensitive_attribute',
            width: 100,
            ellipsis: true,
            render: (value) => {
                return (
                    <div className={styles.baseTableRow}>
                        {value === Sensibility.Insensitive
                            ? __('不敏感')
                            : __('敏感')}
                    </div>
                )
            },
        },
        {
            title: __('涉密属性'),
            dataIndex: 'confidential_attribute',
            key: 'confidential_attribute',
            width: 100,
            ellipsis: true,
            render: (value) => {
                return (
                    <div className={styles.baseTableRow}>
                        {value === SecurityClassification.NotConfidential
                            ? __('非涉密')
                            : __('涉密')}
                    </div>
                )
            },
        },
        {
            title: __('共享属性'),
            dataIndex: 'shared_attribute',
            key: 'shared_attribute',
            ellipsis: true,
            render: (value) => {
                const dataItem = [
                    {
                        label: __('不予共享'),
                        value: SharedAttribute.NotShare,
                    },
                    {
                        label: __('无条件共享'),
                        value: SharedAttribute.UnconditionalShare,
                    },
                    {
                        label: __('有条件共享'),
                        value: SharedAttribute.ConditionalShare,
                    },
                ]
                return (
                    <div className={styles.baseTableRow}>
                        {dataItem.find((item) => value === item.value)?.label ||
                            '--'}
                    </div>
                )
            },
        },
        {
            title: __('开放属性'),
            dataIndex: 'open_attribute',
            key: 'open_attribute',
            ellipsis: true,
            render: (value) => {
                const dataItem = [
                    {
                        label: __('不向公众开放'),
                        value: OpenAttribute.NotOpen,
                    },
                    {
                        label: __('向公众开放'),
                        value: OpenAttribute.Open,
                    },
                ]
                return (
                    <div className={styles.baseTableRow}>
                        {dataItem.find((item) => value === item.value)?.label ||
                            '--'}
                    </div>
                )
            },
        },
        {
            title: __('操作'),
            fixed: 'right',
            key: 'action',
            width: taskDisabled ? 80 : 180,
            render: (_: string, record) => (
                <div className={styles.tableOperate}>
                    <Button
                        type="link"
                        onClick={() =>
                            handleOperate(OperateType.PREVIEW, record)
                        }
                    >
                        {__('查看')}
                    </Button>
                    <Button
                        type="link"
                        onClick={() => handleOperate(OperateType.EDIT, record)}
                        hidden={taskDisabled}
                    >
                        {__('编辑')}
                    </Button>
                    <Button
                        type="link"
                        onClick={() => {
                            handleOperate(OperateType.DELETE, record)
                        }}
                        hidden={taskDisabled}
                    >
                        {__('删除')}
                    </Button>
                </div>
            ),
        },
    ]

    // 融合表信息
    const columnsFu = [
        {
            title: __('取值单位'),
            dataIndex: 'get_data_unit',
            key: 'get_data_unit',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('取值业务模型'),
            dataIndex: 'get_data_main_business',
            key: 'get_data_main_business',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('取值业务表'),
            dataIndex: 'get_data_business_table',
            key: 'get_data_business_table',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('取值优先级'),
            dataIndex: 'get_data_priority',
            key: 'get_data_priority',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow} title={value || '--'}>
                    {value || '--'}
                </div>
            ),
        },
        {
            title: __('优先规则'),
            dataIndex: 'priority_rule',
            key: 'priority_rule',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('字段关联规则'),
            dataIndex: 'field_association_rule',
            key: 'field_association_rule',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('规则字段'),
            dataIndex: 'rule_field',
            key: 'rule_field',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('取值规则'),
            dataIndex: 'get_data_rule',
            key: 'get_data_rule',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
        {
            title: __('备注'),
            dataIndex: 'remark',
            key: 'remark',
            ellipsis: true,
            render: (value) => (
                <div className={styles.baseTableRow}>{value || '--'}</div>
            ),
        },
    ]

    // 空库表
    const showEmpty = (
        <div className={styles.empty}>
            {tableProps.dataSource?.length === 0 && queryParams.keyword ? (
                <Empty />
            ) : (
                <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
            )}
        </div>
    )

    return (
        <>
            <div className={styles.detailsWrapper}>
                <CustomDrawer
                    open={visible}
                    onClose={onClose}
                    isShowFooter={false}
                    headerWidth="calc(100% - 96px)"
                    title={formItem?.name}
                >
                    <div className={styles.bodyWrapper}>
                        <div className={styles.body}>
                            <div className={styles.infoWrapper}>
                                <div className={styles.infoTitle}>
                                    {__('基本信息')}
                                </div>
                                {loadInfos(0)}
                            </div>
                            {formType !== FormType.FUSION && (
                                <div className={styles.infoWrapper}>
                                    <div className={styles.infoTitle}>
                                        {__('详细信息')}
                                    </div>
                                    {loadInfos(1)}
                                </div>
                            )}
                            <div className={styles.fieldsWrapper}>
                                <div className={styles.topWrapper}>
                                    <div className={styles.leftWrapper}>
                                        <div
                                            className={
                                                styles.fieldsTitleWrapper
                                            }
                                        >
                                            <div className={styles.fieldsTitle}>
                                                {formType === FormType.FUSION
                                                    ? __('详细信息')
                                                    : __('字段信息')}
                                            </div>
                                        </div>
                                        <div
                                            className={
                                                styles.normalizationRateWrapper
                                            }
                                            hidden={
                                                formType !== FormType.STANDARD
                                            }
                                        >
                                            <span className={styles.title}>
                                                {__('字段标准化率')}
                                                {__('：')}
                                            </span>
                                            <span className={styles.number}>
                                                {getStandradRate(rate)}
                                            </span>
                                            <Tooltip
                                                title={FieldNormalizationRate}
                                                placement="right"
                                                getPopupContainer={(node) =>
                                                    node
                                                }
                                            >
                                                <QuestionCircleOutlined
                                                    className={styles.icon}
                                                />
                                            </Tooltip>
                                        </div>
                                        <div
                                            className={styles.operateWrapper}
                                            hidden={
                                                formType !==
                                                    FormType.STANDARD ||
                                                taskInfo?.taskStatus ===
                                                    TaskStatus.COMPLETED
                                            }
                                        >
                                            <Button
                                                type="primary"
                                                className={styles.operate}
                                                style={{ marginRight: 16 }}
                                                onClick={() =>
                                                    handleOperate(
                                                        OperateType.CREATE,
                                                    )
                                                }
                                                hidden={
                                                    taskInfo?.taskStatus ===
                                                    TaskStatus.COMPLETED
                                                }
                                            >
                                                <AddOutlined />
                                                {__('新增字段')}
                                            </Button>
                                            <Button
                                                className={styles.operate}
                                                onClick={() =>
                                                    handleOperate(
                                                        OperateType.STANDARDING,
                                                    )
                                                }
                                                hidden={
                                                    taskInfo.taskStatus ===
                                                    TaskStatus.COMPLETED
                                                }
                                            >
                                                <RecommendOutlined />
                                                {__('标准化')}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className={styles.rightWrapper}>
                                        <SearchInput
                                            hidden={
                                                formType === FormType.FUSION
                                            }
                                            placeholder={__(
                                                '搜索字段中文名称、英文名称',
                                            )}
                                            onKeyChange={(kw: string) => {
                                                if (kw === '') {
                                                    handleSearchPressEnter(kw)
                                                }
                                            }}
                                            onPressEnter={
                                                handleSearchPressEnter
                                            }
                                            style={{ width: 272 }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.fieldsTableWrapper}>
                                    <Table
                                        className={styles.fieldsTable}
                                        columns={columnsSt as ColumnsType<any>}
                                        {...props}
                                        pagination={{
                                            current: pagination.current,
                                            pageSize: pagination.pageSize,
                                            total: pagination.total,
                                            showSizeChanger: false,
                                            hideOnSinglePage: true,
                                        }}
                                        scroll={{
                                            x:
                                                formType === FormType.FUSION
                                                    ? 1000
                                                    : formType ===
                                                      FormType.STANDARD
                                                    ? 3800
                                                    : 3200,
                                            y:
                                                tableProps.dataSource.length > 0
                                                    ? 480
                                                    : undefined,
                                        }}
                                        locale={{ emptyText: showEmpty }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CustomDrawer>
            </div>
            {standardVisible && (
                <Standardizing
                    visible={standardVisible}
                    mid={mid!}
                    fid={formItem?.id}
                    name={formItem?.name || ''}
                    fType={formItem?.form_type}
                    standardEnum={standardEnum}
                    onClose={() => {
                        setStandardVisible(false)
                        run(queryParams)
                    }}
                    config={configEnum}
                    onSure={() => {
                        setStandardVisible(false)
                        run({ ...queryParams, current: 1 })
                    }}
                />
            )}
            <CreateStandard
                visible={editVisible}
                type={operateType}
                standardId={sid}
                modalId={mid!}
                formId={formItem?.id}
                formName={formItem?.name}
                standardEnum={standardEnum}
                onClose={() => {
                    setEditVisible(false)
                    run(queryParams)
                }}
                update={() => run({ ...queryParams, current: 1 })}
            />
            <StandardDetails
                visible={detailsVisible}
                modalId={mid!}
                formId={formItem?.id}
                standardId={sid}
                standardEnum={standardEnum}
                onClose={() => {
                    setDetailsVisible(false)
                    run(queryParams)
                }}
            />
        </>
    )
}

export default Details
