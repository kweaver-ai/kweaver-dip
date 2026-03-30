import React, { useEffect, useMemo, useState } from 'react'
import {
    Input,
    Radio,
    Row,
    Space,
    Table,
    Form,
    Button,
    Popconfirm,
    Drawer,
} from 'antd'
import { MinusSquareOutlined, PlusSquareOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { IDemandItemConfig } from '@/core'
import styles from './styles.module.less'
import {
    ErrorInfo,
    keyboardCharactersReg,
    OperateType,
    useQuery,
} from '@/utils'
import {
    AddOutlined,
    InfoChangeFlagColored,
    NewResourceFlagColored,
} from '@/icons'
import PreviewResource from './PreviewResource'
import SourceConfig from '../Requirement/SourceConfig'
import AddResource from '../Requirement/AddResource'
import { PageType, ResourceSource, ResourceType } from '../Requirement/const'
import { jsonComparedFields } from './const'
import ConfigDetails from '../Requirement/ConfigDetails'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'

interface IAnalysisTable {
    data?: IDemandItemConfig[]
    setData: (data: IDemandItemConfig[]) => void
    initExpandedShopKeys: string[]
    initExpandedBlankKeys: string[]
    originalItems: IDemandItemConfig[]
    pageType?: PageType
    operateWidth?: number
    isShowPreviewResource?: boolean
}
const AnalysisTable: React.FC<IAnalysisTable> = ({
    data,
    setData,
    initExpandedShopKeys,
    initExpandedBlankKeys,
    originalItems,
    pageType = PageType.ANALYSIS,
    operateWidth,
    isShowPreviewResource = true,
}) => {
    const [form] = Form.useForm()
    // 展开项的keys，默认全部展开
    const [expandedShopKeys, setExpandedShopKeys] =
        useState(initExpandedShopKeys)
    const [expandedBlankKeys, setExpandedBlankKeys] = useState(
        initExpandedBlankKeys,
    )

    // 是否全部展开
    const [expandAllShop, setExpandAllShop] = useState(true)
    const [expandAllBlank, setExpandAllBlank] = useState(true)

    const [addBlankResOpen, setAddBlankResOpen] = useState(false)

    const [addResourceOpen, setAddResourceOpen] = useState(false)

    const [configOpen, setConfigOpen] = useState(false)
    const [resourceInfo, setResourceInfo] = useState<any>()

    const [itemInfo, setItemInfo] = useState<IDemandItemConfig>()
    const [configShow, setConfigShow] = useState(false)

    const query = useQuery()
    const mode =
        query.get('mode') ||
        pageType === PageType.APPLY ||
        pageType === PageType.AUDIT
            ? OperateType.DETAIL
            : ''

    // 设置初始全部展开
    useEffect(() => {
        setExpandedShopKeys(initExpandedShopKeys)
        setExpandedBlankKeys(initExpandedBlankKeys)
    }, [initExpandedShopKeys, initExpandedBlankKeys])

    // 资源目录资源数据
    const serviceShopData = useMemo(
        () =>
            data?.filter(
                (item) => item.res_source === ResourceSource.SERVICESHOP,
            ) || [],
        [data],
    )

    // 空白资源数据
    const blankData = useMemo(
        () =>
            data?.filter((item) => item.res_source === ResourceSource.BLANK) ||
            [],
        [data],
    )

    const getAddedBlankRes = (values) => {
        setData([
            { ...values, res_source: ResourceSource.BLANK, original_id: '0' },
            ...(data || []),
        ])
    }

    const getSourcesFromServiceShop = (values) => {
        setData([
            ...values.map((val) => ({ ...val, original_id: '0' })),
            ...(data || []),
        ])
    }

    const handleDelete = (record) => {
        setData(data?.filter((item) => item.res_id !== record.res_id) || [])
    }

    const getIsChanged = (record) => {
        const originItem = originalItems.find(
            (item) => item.id === record.original_id,
        )

        if (originItem) {
            let isChanged = false
            // 获取原始数据中的字段 （排除id）
            const { id, ...comparedFields } = originItem
            const comparedKeys = Object.keys(comparedFields)
            comparedKeys.forEach((key) => {
                // 如果原始数据字段与当前数据都没有 即为没改变
                if (!originItem[key] && !record[key]) {
                    return
                }
                // 如果是对象类型 则转为字符串比较
                if (jsonComparedFields.includes(key)) {
                    if (
                        JSON.stringify(originItem[key]) !==
                        JSON.stringify(record[key])
                    ) {
                        isChanged = true
                        return
                    }
                    return
                }
                // 值类型直接比较
                if (originItem[key] !== record[key]) {
                    isChanged = true
                }
            })
            return isChanged
        }

        return false
    }

    const columns = [
        {
            title: '资源名称',
            dataIndex: 'res_name',
            key: 'res_name',
            ellipsis: true,
            render: (val, record, index) => (
                <div
                    className={classnames({
                        [styles.resNameWrapper]: true,
                        [styles.strikethrough]: record.apply_status === 1,
                    })}
                >
                    <div
                        className={classnames({
                            [styles.resName]: true,
                            [styles.loseEffectResourceName]:
                                record.res_status === 2,
                            [styles.loseEffect]: record.res_status === 2,
                        })}
                        title={record.res_name}
                        onClick={() => {
                            if (record.res_status === 2) return
                            setItemInfo(record)
                            setConfigShow(true)
                        }}
                    >
                        {record.res_name}
                    </div>
                    {record.original_id === '0' && (
                        <NewResourceFlagColored
                            className={styles.newResFlagIcon}
                        />
                    )}
                    {record.original_id !== '0' && getIsChanged(record) && (
                        <InfoChangeFlagColored
                            className={styles.infoChangedFlagIcon}
                        />
                    )}
                    {record.res_status === 2 && (
                        <div className={styles.loseEffectiveFlag}>已失效</div>
                    )}
                </div>
            ),
        },
        {
            title: '资源类型',
            dataIndex: 'res_type',
            key: 'res_type',
            width: 100,
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.resName]: true,
                        [styles.strikethrough]: record.apply_status === 1,
                        [styles.loseEffect]: record.res_status === 2,
                    })}
                >
                    {val === 1
                        ? '库表'
                        : val === 2
                        ? 'API'
                        : val === 3
                        ? '文件'
                        : '--'}
                </div>
            ),
        },
        {
            title: '资源描述',
            dataIndex: 'res_desc',
            key: 'res_desc',
            ellipsis: true,
            render: (val: string, record) => (
                <div
                    className={classnames({
                        [styles.resDesc]: true,
                        [styles.strikethrough]:
                            val && record.apply_status === 1,
                        [styles.loseEffect]: record.res_status === 2,
                    })}
                >
                    {val || '--'}
                </div>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operate',
            key: 'operate',
            width: operateWidth || 240,
            render: (val, record) =>
                record.res_type === ResourceType.FILE ? (
                    <Button type="link">查看文件</Button>
                ) : (
                    <Space size={24}>
                        {mode === OperateType.DETAIL ? (
                            <Button
                                type="link"
                                onClick={() => {
                                    setItemInfo(record)
                                    setConfigShow(true)
                                }}
                            >
                                查看配置
                            </Button>
                        ) : (
                            <>
                                <Button
                                    type="link"
                                    disabled={
                                        record.apply_status === 1 ||
                                        record.res_status === 2
                                    }
                                    onClick={() => handleConfig(record)}
                                >
                                    {record.original_id === '0'
                                        ? '配置'
                                        : ' 修改配置'}
                                </Button>
                                {record.original_id === '0' && (
                                    <Popconfirm
                                        title="你确定要移除吗？"
                                        onConfirm={() => handleDelete(record)}
                                        okText="确认"
                                        cancelText="取消"
                                    >
                                        <Button type="link">移除</Button>
                                    </Popconfirm>
                                )}
                            </>
                        )}
                    </Space>
                ),
        },
    ]

    const handleChange = (val: number | string, record, field) => {
        setData(
            data?.map((item) => {
                if (item.res_id === record.res_id) {
                    return { ...item, [field]: val }
                }
                return item
            }) || [],
        )
    }

    const handleConfig = (record) => {
        setConfigOpen(true)
        setResourceInfo(record)
    }

    // 资源配置时更新数据
    const updateResConfig = (values) => {
        setData(
            data?.map((item) => {
                if (item.res_id === resourceInfo.res_id) {
                    return { ...values }
                }
                return item
            }) || [],
        )
    }

    const expandedRowRenderShop = (record) => (
        <div className={styles.expandContent}>
            <div
                className={classnames({
                    [styles.rowInfo]: true,
                    [styles.firstRowInfo]: true,
                })}
            >
                <span className={styles.label}>是否提供:</span>
                <Radio.Group
                    value={record.apply_status}
                    onChange={(e) =>
                        handleChange(e.target.value, record, 'apply_status')
                    }
                    disabled={mode === OperateType.DETAIL}
                >
                    <Radio value={2}>提供</Radio>
                    <Radio value={1}>不提供</Radio>
                </Radio.Group>
            </div>
            {record.apply_status === 1 && (
                <>
                    <div className={styles.applyStatusDescWrapper}>
                        <span className={styles.label}>说明:</span>
                        {mode === OperateType.DETAIL ? (
                            <div className={styles.value}>
                                {record.apply_desc || '--'}
                            </div>
                        ) : (
                            <Input.TextArea
                                placeholder="请输入"
                                className={classnames({
                                    [styles.applyDesc]: true,
                                    [styles.descError]:
                                        !keyboardCharactersReg.test(
                                            record.apply_desc,
                                        ),
                                })}
                                maxLength={255}
                                value={record.apply_desc}
                                onChange={(e) =>
                                    handleChange(
                                        e.target.value,
                                        record,
                                        'apply_desc',
                                    )
                                }
                            />
                        )}
                    </div>
                    {!keyboardCharactersReg.test(record.apply_desc) && (
                        <div className={styles.errorInfo}>
                            {ErrorInfo.EXCEPTEMOJI}
                        </div>
                    )}
                </>
            )}
        </div>
    )

    const expandedRowRenderBlankRes = (record) => (
        <div className={styles.expandContent}>
            <div
                className={classnames({
                    [styles.rowInfo]: true,
                    [styles.firstRowInfo]: true,
                })}
            >
                <span className={styles.label}>中台是否有：</span>
                <Radio.Group
                    value={record.has_resource}
                    onChange={(e) =>
                        handleChange(e.target.value, record, 'has_resource')
                    }
                    disabled={mode === OperateType.DETAIL}
                >
                    <Radio value={2}>有</Radio>
                    <Radio value={1}>没有</Radio>
                </Radio.Group>
            </div>
            {record.has_resource === 1 && (
                <>
                    <div className={styles.applyStatusDescWrapper}>
                        <span className={styles.label}>说明:</span>
                        {mode === OperateType.DETAIL ? (
                            <div className={styles.value}>
                                {record.has_resource_desc || '--'}
                            </div>
                        ) : (
                            <Input.TextArea
                                placeholder="请输入"
                                className={classnames({
                                    [styles.applyDesc]: true,
                                    [styles.descError]:
                                        !keyboardCharactersReg.test(
                                            record.has_resource_desc,
                                        ),
                                })}
                                maxLength={255}
                                value={record.has_resource_desc}
                                onChange={(e) =>
                                    handleChange(
                                        e.target.value,
                                        record,
                                        'has_resource_desc',
                                    )
                                }
                            />
                        )}
                    </div>
                    {!keyboardCharactersReg.test(record.has_resource_desc) && (
                        <div className={styles.errorInfo}>
                            {ErrorInfo.EXCEPTEMOJI}
                        </div>
                    )}
                </>
            )}
        </div>
    )

    // 点击行的展开项
    const onExpandRow = (expanded, record, isShop: boolean) => {
        if (expanded) {
            if (isShop) {
                setExpandedShopKeys([...expandedShopKeys, record.res_id])
            } else {
                setExpandedBlankKeys([...expandedBlankKeys, record.res_id])
            }
        } else if (isShop) {
            setExpandedShopKeys(
                expandedShopKeys.filter((item) => item !== record.res_id),
            )
        } else {
            setExpandedBlankKeys(
                expandedBlankKeys.filter((item) => item !== record.res_id),
            )
        }
    }

    // 展开全部与折叠全部
    const changeExpandableState = (isShop: boolean) => {
        if (isShop) {
            setExpandAllShop(!expandAllShop)
            setExpandedShopKeys(
                !expandAllShop
                    ? serviceShopData.map((item) => {
                          return item.res_id
                      })
                    : [],
            )
        } else {
            setExpandAllBlank(!expandAllBlank)
            setExpandedBlankKeys(
                !expandAllBlank
                    ? blankData.map((item) => {
                          return item.res_id
                      })
                    : [],
            )
        }
    }

    const expandIcon = ({ expanded, onExpand, record }) =>
        record.original_id === '0' ? null : expanded ? (
            <MinusSquareOutlined onClick={(e) => onExpand(record, e)} />
        ) : (
            <PlusSquareOutlined onClick={(e) => onExpand(record, e)} />
        )

    return (
        <div className={styles.analysisTable}>
            <div className={styles.titleLine}>
                <div className={styles.title}>数据服务超市</div>
                <div
                    className={styles.addRes}
                    onClick={() => setAddResourceOpen(true)}
                    hidden={mode === OperateType.DETAIL}
                >
                    <AddOutlined className={styles.addIcon} />
                    添加
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={serviceShopData}
                rowKey="res_id"
                pagination={false}
                bordered={false}
                className={styles.serviceShopTable}
                expandable={{
                    expandedRowRender: expandedRowRenderShop,
                    expandedRowKeys: expandedShopKeys,
                    columnTitle: (
                        <span onClick={() => changeExpandableState(true)}>
                            {expandAllShop ? (
                                <MinusSquareOutlined />
                            ) : (
                                <PlusSquareOutlined />
                            )}
                        </span>
                    ),
                    rowExpandable: (record) => record.original_id !== '0',
                    expandIcon,
                    onExpand: (expanded, record) =>
                        onExpandRow(expanded, record, true),
                }}
                locale={{
                    emptyText: <Empty iconSrc={empty} desc="暂无数据" />,
                }}
            />

            <div className={styles.titleLine}>
                <div className={styles.title}>空白资源</div>
                <div
                    className={styles.addRes}
                    onClick={() => setAddBlankResOpen(true)}
                    hidden={mode === OperateType.DETAIL}
                >
                    <AddOutlined className={styles.addIcon} />
                    添加
                </div>
            </div>
            <Table
                columns={columns}
                dataSource={blankData}
                rowKey="res_id"
                pagination={false}
                bordered={false}
                expandable={{
                    expandedRowRender: expandedRowRenderBlankRes,
                    expandedRowKeys: expandedBlankKeys,
                    columnTitle: (
                        <span onClick={() => changeExpandableState(false)}>
                            {expandAllBlank ? (
                                <MinusSquareOutlined />
                            ) : (
                                <PlusSquareOutlined />
                            )}
                        </span>
                    ),
                    rowExpandable: (record) => record.original_id !== '0',
                    expandIcon,
                    onExpand: (expanded, record) =>
                        onExpandRow(expanded, record, false),
                }}
                locale={{
                    emptyText: <Empty iconSrc={empty} desc="暂无数据" />,
                }}
            />
            {isShowPreviewResource && (
                <PreviewResource
                    serviceShopData={serviceShopData}
                    blankData={blankData}
                />
            )}

            {/* 添加空白资源 */}
            <SourceConfig
                onClose={() => setAddBlankResOpen(false)}
                open={addBlankResOpen}
                operateType={OperateType.CREATE}
                title="添加空白资源"
                getAddedBlankRes={getAddedBlankRes}
                pageType={PageType.ANALYSIS}
            />
            {/* 添加资源目录资源 */}
            {pageType === PageType.ANALYSIS && (
                <AddResource
                    open={addResourceOpen}
                    onClose={() => setAddResourceOpen(false)}
                    getSelectedSources={getSourcesFromServiceShop}
                    selectedRes={
                        data?.filter(
                            (item) =>
                                item.res_source === ResourceSource.SERVICESHOP,
                        ) || []
                    }
                />
            )}

            {/* 资源配置 */}
            {configOpen && (
                <SourceConfig
                    onClose={() => setConfigOpen(false)}
                    resourceInfo={resourceInfo}
                    open={configOpen}
                    operateType={OperateType.EDIT}
                    title="资源配置"
                    updateResConfig={updateResConfig}
                    disabledFields={
                        resourceInfo?.original_id !== '0'
                            ? ['use_purpose', 'target_machine_name']
                            : []
                    }
                    pageType={PageType.ANALYSIS}
                />
            )}

            <Drawer
                open={configShow}
                title="查看配置"
                onClose={() => setConfigShow(false)}
                width={640}
                destroyOnClose
            >
                <ConfigDetails
                    itemInfo={itemInfo}
                    pageType={PageType.ANALYSIS}
                />
            </Drawer>
        </div>
    )
}

export default AnalysisTable
