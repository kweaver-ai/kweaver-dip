import { Button, message, Table, Tooltip } from 'antd'
import { useEffect, useState } from 'react'

import {
    ExclamationCircleFilled,
    InfoCircleFilled,
    PlusOutlined,
} from '@ant-design/icons'
import moment from 'moment'
import { StatusLabel } from '@/components/RecognitionAlgorithmConfig/helper'
import {
    deleteClassificationRule,
    exportClassificationRule,
    formatError,
    getClassificationsList,
    startClassificationRule,
    stopClassificationRule,
} from '@/core'
import { FontIcon } from '@/icons'
import { OptionBarTool, OptionMenuType } from '@/ui'
import { streamToFile } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import __ from '../locale'
import { useClassificationContext } from './ClassificationProvider'
import {
    AlgorithmStatus,
    AlgorithmType,
    ClassifyType,
    OperationType,
    OperationTypeMap,
} from './const'
import CreateClassify from './CreateClassify'
import DataDetail from './DataDetail'
import { ContainerBar, IntroductionTooltip } from './helper'
import styles from './styles.module.less'

const ClassifyTable = () => {
    const [data, setData] = useState<any[]>([])
    const { setSelectedAttribute, selectedAttribute } =
        useClassificationContext()
    // 是否显示创建分类弹窗
    const [showCreateClassify, setShowCreateClassify] = useState(false)
    // 是否显示详情弹窗
    const [showDetail, setShowDetail] = useState(false)

    // 操作id
    const [operationId, setOperationId] = useState('')

    // 是否显示编辑弹窗
    const [showEditClassify, setShowEditClassify] = useState(false)

    useEffect(() => {
        if (selectedAttribute?.id) {
            getTableData()
        }
    }, [selectedAttribute])

    // 获取表格数据
    const getTableData = async () => {
        try {
            const res = await getClassificationsList({
                subject_id: selectedAttribute.id,
            })
            setData(res.entries)
        } catch (err) {
            formatError(err)
        }
    }

    const handleExport = async (id) => {
        try {
            const res = await exportClassificationRule({ ids: [id] })
            streamToFile(
                res,
                `分类识别规则_${moment().format('YYYYMMDDHHmmss')}.xlsx`,
            )
            message.success(__('导出成功'))
        } catch (err) {
            formatError(err)
        }
    }

    // 操作
    const handleOperation = (key: string, id: string) => {
        switch (key) {
            case OperationType.DETAIL:
                setShowDetail(true)
                break
            case OperationType.ENABLE:
                confirm({
                    title: __('确定启用当前识别规则吗？'),
                    content: null,
                    icon: <InfoCircleFilled style={{ color: '#126ee3' }} />,
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await startClassificationRule(id)
                            getTableData()
                            message.success(__('启用成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            case OperationType.DISABLE:
                confirm({
                    title: __('确定停用当前识别规则吗？'),
                    content: __(
                        '停用后，在进行表（库表）的数据探查时，不能再基于当前规则识别分类。',
                    ),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#FAAD14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await stopClassificationRule(id)
                            getTableData()
                            message.success(__('停用成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            case OperationType.EXPORT:
                handleExport(id)
                break
            case OperationType.EDIT:
                setShowEditClassify(true)
                break
            case OperationType.DELETE:
                confirm({
                    title: __('确定删除当前识别规则吗？'),
                    content: __(
                        '删除后，在进行表（库表）的数据探查时，不能再基于当前规则识别分类。',
                    ),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#FAAD14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await deleteClassificationRule(id)
                            getTableData()
                            message.success(__('删除成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            default:
                break
        }
    }

    const columns: Array<any> = [
        {
            title: (
                <span className={styles.nameTitleContainer}>
                    {__('识别规则名称')}
                    <span className={styles.subTitle}>（{__('描述')}）</span>
                </span>
            ),
            key: 'name',
            dataIndex: 'name',
            ellipsis: true,
            fixed: 'left',
            render: (_, record) => (
                <div className={styles.rowNameContainer}>
                    <div className={styles.nameWrapper}>
                        <span
                            className={styles.name}
                            title={record?.name}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // onPreview(record.id, record.indicator_type)
                            }}
                        >
                            {record?.name}
                        </span>
                        {record.type === AlgorithmType.BUILT_IN && (
                            <IntroductionTooltip />
                        )}
                    </div>
                    <div>
                        <span
                            className={styles.description}
                            title={record?.description}
                        >
                            {record?.description}
                        </span>
                    </div>
                </div>
            ),
            width: 220,
        },
        {
            title: __('规则类型'),
            key: 'type',
            dataIndex: 'type',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return text === AlgorithmType.BUILT_IN
                    ? __('内置')
                    : __('自定义')
            },
        },
        {
            title: __('引用算法模板'),
            key: 'algorithms',
            dataIndex: 'algorithms',
            ellipsis: true,
            width: 350,
            render: (text, record) => {
                return record.type === AlgorithmType.BUILT_IN ? (
                    __('数据识别算法：通过识别字段名称和属性名称的相似度')
                ) : (
                    <Tooltip
                        title={
                            <div className={styles.algorithmItemWrapper}>
                                {record.algorithms.map(
                                    (item: any, index: number) => (
                                        <div key={item.id}>
                                            <div className={styles.itemWrapper}>
                                                <div className={styles.number}>
                                                    {index + 1}
                                                </div>
                                                <div
                                                    className={styles.name}
                                                    title={item.name}
                                                >
                                                    {item.name}
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        }
                        placement="bottomLeft"
                        overlayStyle={{
                            maxWidth: 280,
                        }}
                        color="#fff"
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,0.85)',
                        }}
                    >
                        <span>
                            {record.algorithms
                                .map((item: any) => item.name)
                                .join(' | ')}
                        </span>
                    </Tooltip>
                )
            },
        },
        {
            title: __('识别字段分类'),
            key: 'subject_id',
            dataIndex: 'subject_id',
            ellipsis: true,
            width: 150,
            render: (text, record) => {
                return (
                    <div className={styles.selectOptionWrapper}>
                        <FontIcon
                            name="icon-shuxing"
                            style={{
                                fontSize: 20,
                                color: 'rgba(245, 137, 13, 1)',
                            }}
                        />
                        <span className={styles.titleText}>
                            {record.subject_name || selectedAttribute.name}
                        </span>
                    </div>
                )
            },
        },
        {
            title: __('启用状态'),
            key: 'status',
            dataIndex: 'status',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return <StatusLabel status={text} />
            },
        },
        {
            title: __('规则创建时间'),
            key: 'created_at',
            dataIndex: 'created_at',
            ellipsis: true,
            width: 180,
            render: (text, record) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('规则更新时间'),
            key: 'updated_at',
            dataIndex: 'updated_at',
            ellipsis: true,
            width: 180,
            render: (text, record) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 220,
            render: (_, record) => {
                // 操作菜单
                const operationMenus = [
                    OperationType.DETAIL,
                    OperationType.EDIT,
                    OperationType.ENABLE,
                    OperationType.DISABLE,
                    OperationType.EXPORT,
                    OperationType.DELETE,
                ]
                    .filter((item) => {
                        // 如果算法状态为启用，则不显示启用操作
                        if (record.status === AlgorithmStatus.ENABLE) {
                            return item !== OperationType.ENABLE
                        }
                        // 如果算法状态为停用，则不显示停用操作
                        if (record.status === AlgorithmStatus.DISABLE) {
                            return item !== OperationType.DISABLE
                        }
                        return true
                    })
                    .map((item) => ({
                        key: item,
                        label: OperationTypeMap[item],
                        menuType: OptionMenuType.Menu,
                    }))
                return (
                    <OptionBarTool
                        menus={
                            record.type === AlgorithmType.BUILT_IN
                                ? [
                                      {
                                          key: OperationType.EXPORT,
                                          label: OperationTypeMap[
                                              OperationType.EXPORT
                                          ],
                                          menuType: OptionMenuType.Menu,
                                      },
                                  ]
                                : operationMenus
                        }
                        onClick={(key) => {
                            setOperationId(record.id)
                            handleOperation(key, record.id)
                        }}
                    />
                )
            },
        },
    ]

    return (
        <div className={styles.classifyTableContainer}>
            <ContainerBar>
                <div className={styles.titleContainer}>
                    <span>{__('探查分类的识别规则')}</span>
                    {data.length < 2 && (
                        <Button
                            type="link"
                            icon={<PlusOutlined />}
                            onClick={() => setShowCreateClassify(true)}
                        >
                            {__('新建规则')}
                        </Button>
                    )}
                </div>
            </ContainerBar>
            <Table
                columns={columns}
                pagination={false}
                dataSource={data}
                scroll={{
                    y: 1000,
                }}
            />

            {showCreateClassify && (
                <CreateClassify
                    onClose={() => setShowCreateClassify(false)}
                    open={showCreateClassify}
                    onConfirm={() => {
                        getTableData()
                        setShowCreateClassify(false)
                    }}
                />
            )}
            {showDetail && (
                <DataDetail
                    onClose={() => setShowDetail(false)}
                    open={showDetail}
                    id={operationId}
                    type={ClassifyType.CLASSIFY}
                />
            )}
            {showEditClassify && (
                <CreateClassify
                    onClose={() => setShowEditClassify(false)}
                    open={showEditClassify}
                    onConfirm={() => {
                        setShowEditClassify(false)
                    }}
                    id={operationId}
                />
            )}
        </div>
    )
}

export default ClassifyTable
