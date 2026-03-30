import React, { useEffect, useState } from 'react'
import { Drawer, Table } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import { PageType, ResourceSource, resourceTypeInfo } from './const'
import { getDemandItems, IDemandItemConfig, formatError } from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import ConfigDetails from './ConfigDetails'

interface IResourceDetails {
    id: string
    auditId?: string
    viewConfigCustom?: (data: IDemandItemConfig) => void
}
const ResourceDetails: React.FC<IResourceDetails> = ({
    id,
    auditId,
    viewConfigCustom,
}) => {
    const [items, setItems] = useState<IDemandItemConfig[]>([])
    const [configDetailsOpen, setConfigDetailsOpen] = useState(false)
    const [itemInfo, setItemInfo] = useState<IDemandItemConfig>()

    const getItems = async () => {
        try {
            if (id) {
                const res = await getDemandItems(id, auditId)
                setItems(res.entries)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        getItems()
    }, [id])

    const resourceColumns = [
        {
            title: __('资源名称'),
            dataIndex: 'res_name',
            key: 'res_name',
            render: (_, record) => (
                <div
                    className={styles.resNameWrapper}
                    onClick={() => {
                        if (record.res_status === 2) return
                        if (viewConfigCustom) {
                            viewConfigCustom(record)
                            return
                        }
                        setItemInfo(record)
                        setConfigDetailsOpen(true)
                    }}
                    title={record.res_name}
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
            ),
            ellipsis: true,
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
            render: (_: string, record) =>
                record.res_status !== 2 ? (
                    <a
                        onClick={() => {
                            if (viewConfigCustom) {
                                viewConfigCustom(record)
                                return
                            }
                            setItemInfo(record)
                            setConfigDetailsOpen(true)
                        }}
                    >
                        {__('查看配置')}
                    </a>
                ) : null,
        },
    ]

    return (
        <div className={styles.ResourceDetailWrapper}>
            <div className={styles.resourceTitle}>{__('数据资源目录')}</div>
            <div className={styles.resourceList}>
                <Table
                    columns={resourceColumns}
                    dataSource={items.filter(
                        (info) =>
                            info.res_source === ResourceSource.SERVICESHOP,
                    )}
                    pagination={false}
                    rowKey="id"
                    locale={{
                        emptyText: (
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        ),
                    }}
                />
            </div>
            <div className={styles.resourceTitle}>{__('空白资源')}</div>
            <div className={styles.resourceList}>
                <Table
                    columns={resourceColumns}
                    dataSource={items.filter(
                        (info) => info.res_source === ResourceSource.BLANK,
                    )}
                    pagination={false}
                    rowKey="id"
                    locale={{
                        emptyText: (
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        ),
                    }}
                />
            </div>
            <Drawer
                title={__('查看配置')}
                open={configDetailsOpen}
                onClose={() => setConfigDetailsOpen(false)}
                destroyOnClose
                width={640}
                getContainer={false}
            >
                <ConfigDetails itemInfo={itemInfo} />
            </Drawer>
        </div>
    )
}
export default ResourceDetails
