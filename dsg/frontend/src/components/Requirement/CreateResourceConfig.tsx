import {
    Button,
    Input,
    Popconfirm,
    Space,
    Table,
    Form,
    FormInstance,
    Drawer,
    message,
} from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import { AddOutlined } from '@/icons'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import empty from '@/assets/emptyAdd.svg'
import {
    ResourceSource,
    resourceSourceInfo,
    ResourceType,
    resourceTypeInfo,
} from './const'
import SourceConfig from './SourceConfig'
import AddResource from './AddResource'
import { OperateType } from '@/utils'
import ConfigDetails from './ConfigDetails'
import { getRepositoryIsOnline, IDemandItemConfig } from '@/core/apis'
import { formatError } from '@/core'
import __ from './locale'

interface ICreateResourceConfig {
    form: FormInstance<any>
    setIsRequiredInfoFilledOver: (vals: boolean) => void
    setIsContentChanged: (val: boolean) => void
    itemsInfo?: any[]
    isShowTitle?: boolean
    isHidden: boolean
    setIsHidden: (hidden: boolean) => void
}
const CreateResourceConfig: React.FC<ICreateResourceConfig> = ({
    form,
    setIsRequiredInfoFilledOver,
    setIsContentChanged,
    itemsInfo,
    isShowTitle = true,
    isHidden,
    setIsHidden,
}) => {
    // 全部资源数据
    const [resourceData, setResourceData] = useState<any[]>([])
    const [configOpen, setConfigOpen] = useState(false)
    // 点击配置的资源信息
    const [resourceInfo, setResourceInfo] = useState<any>()
    const [addResourceOpen, setAddResourceOpen] = useState(false)
    const [addBlankResOpen, setAddBlankResOpen] = useState(false)

    const [itemInfo, setItemInfo] = useState<IDemandItemConfig>()
    const [configShow, setConfigShow] = useState(false)
    // const [isHidden, setIsHidden] = useState(false)

    // 数据资源目录资源
    const assetsRes = useMemo(
        () =>
            resourceData.filter(
                (item) => item.res_source === ResourceSource.SERVICESHOP,
            ),
        [resourceData],
    )

    // 空白资源
    const blankRes = useMemo(
        () =>
            resourceData.filter(
                (item) => item.res_source === ResourceSource.BLANK,
            ),
        [resourceData],
    )

    // 将数据资源目录资源 设置在表格中展示
    useEffect(() => {
        form.setFieldsValue({ assetsRes })
    }, [assetsRes])

    // 将空白资源 设置在表格中展示
    useEffect(() => {
        form.setFieldsValue({ blankRes })
    }, [blankRes])

    // 初始化资源数据
    useEffect(() => {
        if (itemsInfo) {
            setResourceData(itemsInfo)
        }
    }, [itemsInfo])

    useEffect(() => {
        // 资源大于0时代表有资源即代表资源已配置
        setIsRequiredInfoFilledOver(resourceData.length > 0)
    }, [resourceData])

    const renderEmpty = (resourceSource: ResourceSource) => {
        return (
            <Empty
                iconSrc={empty}
                desc={
                    <>
                        <div>{__('暂无资源')}</div>
                        <div>
                            点击
                            <Button
                                type="link"
                                onClick={() => {
                                    if (
                                        resourceSource === ResourceSource.BLANK
                                    ) {
                                        setAddBlankResOpen(true)
                                    } else {
                                        setAddResourceOpen(true)
                                    }
                                }}
                            >
                                {`【${__('添加')}】`}
                            </Button>
                            {__('按钮添加需求申请的资源')}
                        </div>
                    </>
                }
            />
        )
    }

    const handleRemove = (record) => {
        if (record.res_source === ResourceSource.BLANK) {
            setResourceData(
                resourceData.filter((item) => item.id !== record.id),
            )
        } else {
            setResourceData(
                resourceData.filter((item) => item.res_id !== record.res_id),
            )
        }

        setIsContentChanged(true)
    }

    const handleConfig = async (record) => {
        if (record.res_source === ResourceSource.BLANK) {
            setConfigOpen(true)
            setResourceInfo(record)
            return
        }
        // 目录资源检测是否失效 失效不允许配置
        try {
            const res = await getRepositoryIsOnline(record?.res_id)
            if (!res.available) {
                message.error(__('资源已失效，不能进行配置，请移除'))
            } else {
                setConfigOpen(true)
                setResourceInfo(record)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleDetails = async (record) => {
        setItemInfo(record)
        setConfigShow(true)
    }

    // record.res_status === 2 已失效状态
    const resourceColumns = [
        {
            title: __('资源名称'),
            dataIndex: 'res_name',
            key: 'res_name',
            render: (_, record) => {
                return (
                    <div
                        className={classnames({
                            [styles.topInfo]: true,
                            [styles.onlyTopInfo]:
                                record.res_type === ResourceType.FILE,
                        })}
                        title={record.res_name}
                        onClick={() => {
                            if (record.res_status === 2) return
                            handleDetails(record)
                        }}
                    >
                        <div
                            className={classnames({
                                [styles.resourceName]: true,
                                [styles.loseEffectResourceName]:
                                    record.res_status === 2,
                                [styles.loseEffect]: record.res_status === 2,
                            })}
                        >
                            {record.res_name}
                        </div>
                        {record.res_status === 2 && (
                            <div className={styles.loseEffectiveFlag}>
                                {__('已失效')}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('资源类型'),
            dataIndex: 'res_type',
            key: 'res_type',
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.loseEffect]: record.res_status === 2,
                    })}
                >
                    {resourceTypeInfo[val]}
                </div>
            ),
        },
        {
            title: __('资源描述'),
            dataIndex: 'res_desc',
            key: 'res_desc',
            ellipsis: true,
            render: (val, record) => (
                <div
                    className={classnames({
                        [styles.loseEffect]: record.res_status === 2,
                        [styles.resDesc]: true,
                    })}
                >
                    {val || '--'}
                </div>
            ),
        },

        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (_: string, record) => (
                <Space size={16}>
                    {record.res_type !== ResourceType.FILE &&
                        record.res_status !== 2 && (
                            <a onClick={() => handleConfig(record)}>配置</a>
                        )}
                    <Popconfirm
                        placement="top"
                        title={__('你确定要移除吗？')}
                        onConfirm={() => handleRemove(record)}
                        okText={__('确定')}
                        cancelText={__('取消')}
                    >
                        <a>{__('移除')}</a>
                    </Popconfirm>
                </Space>
            ),
        },
    ]

    const getAddedBlankRes = (values) => {
        const val = [
            { ...values, res_source: ResourceSource.BLANK },
            ...resourceData,
        ]

        setResourceData(val)
        setIsContentChanged(true)
    }

    const updateResConfig = (values) => {
        const newItems = resourceData.map((item) => {
            if (item.res_id === resourceInfo.res_id) {
                return { ...values }
            }
            return item
        })

        // 设置全部资源数据
        setResourceData(newItems)
        setIsContentChanged(true)
    }

    const getSourcesFromServiceShop = (values) => {
        const val = [...values, ...resourceData]
        setResourceData(val)
        setIsContentChanged(true)
    }

    return (
        <div
            className={classnames(styles.createInfo, styles.createResourceInfo)}
        >
            {isShowTitle && (
                <div className={styles.titleWrapper}>
                    {isHidden ? (
                        <CaretRightOutlined
                            className={styles.arrowIcon}
                            onClick={() => setIsHidden(!isHidden)}
                        />
                    ) : (
                        <CaretDownOutlined
                            className={styles.arrowIcon}
                            onClick={() => setIsHidden(!isHidden)}
                        />
                    )}
                    <div className={styles.title}>{__('资源配置')}</div>
                </div>
            )}

            <div hidden={isHidden} className={styles.contentWrapper}>
                <div className={styles.operateWrapper}>
                    <div className={styles.tableTitle}>
                        {__('数据服务超市')}
                    </div>
                    <Button
                        icon={<AddOutlined className={styles.addIcon} />}
                        type="link"
                        onClick={() => setAddResourceOpen(true)}
                    >
                        {__('添加')}
                    </Button>
                </div>
                <Form.Item
                    shouldUpdate={(pre, cur) => pre.assetsRes !== cur.assetsRes}
                    noStyle
                >
                    {({ getFieldValue }) => {
                        return (
                            <Form.Item
                                valuePropName="dataSource"
                                name="assetsRes"
                            >
                                <Table
                                    columns={resourceColumns}
                                    pagination={false}
                                    bordered={assetsRes?.length !== 0}
                                    className={styles.resourceTableInfo}
                                    rowKey="res_id"
                                    locale={{
                                        emptyText: renderEmpty(
                                            ResourceSource.SERVICESHOP,
                                        ),
                                    }}
                                />
                            </Form.Item>
                        )
                    }}
                </Form.Item>
                <div className={styles.operateWrapper}>
                    <div className={styles.tableTitle}>{__('空白资源')}</div>
                    <Button
                        icon={<AddOutlined className={styles.addIcon} />}
                        type="link"
                        onClick={() => setAddBlankResOpen(true)}
                    >
                        {__('添加')}
                    </Button>
                </div>
                <Form.Item
                    shouldUpdate={(pre, cur) => pre.blankRes !== cur.blankRes}
                    noStyle
                >
                    {({ getFieldValue }) => {
                        return (
                            <Form.Item
                                valuePropName="dataSource"
                                name="blankRes"
                            >
                                <Table
                                    columns={resourceColumns}
                                    pagination={false}
                                    bordered={blankRes?.length !== 0}
                                    className={styles.resourceTableInfo}
                                    rowKey="id"
                                    locale={{
                                        emptyText: renderEmpty(
                                            ResourceSource.BLANK,
                                        ),
                                    }}
                                />
                            </Form.Item>
                        )
                    }}
                </Form.Item>
            </div>
            {configOpen && (
                <SourceConfig
                    onClose={() => setConfigOpen(false)}
                    resourceInfo={resourceInfo}
                    open={configOpen}
                    operateType={OperateType.EDIT}
                    title={__('资源配置')}
                    updateResConfig={updateResConfig}
                />
            )}

            <AddResource
                open={addResourceOpen}
                onClose={() => setAddResourceOpen(false)}
                getSelectedSources={getSourcesFromServiceShop}
                selectedRes={
                    resourceData.filter(
                        (res) => res.res_source === ResourceSource.SERVICESHOP,
                    ) || []
                }
            />
            {addBlankResOpen && (
                <SourceConfig
                    onClose={() => setAddBlankResOpen(false)}
                    open={addBlankResOpen}
                    operateType={OperateType.CREATE}
                    title={__('添加空白资源')}
                    getAddedBlankRes={getAddedBlankRes}
                />
            )}
            <Drawer
                open={configShow}
                title={__('查看配置')}
                onClose={() => setConfigShow(false)}
                width={640}
                destroyOnClose
            >
                <ConfigDetails itemInfo={itemInfo} />
            </Drawer>
        </div>
    )
}
export default CreateResourceConfig
