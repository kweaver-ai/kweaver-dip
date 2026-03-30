import {
    Button,
    Drawer,
    Input,
    Popconfirm,
    Radio,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { ExclamationCircleFilled, InfoCircleOutlined } from '@ant-design/icons'
import React, { useEffect, useMemo, useState } from 'react'
import __ from '../locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'
import { Empty, SearchInput } from '@/ui'
import { ApplyResource } from '../const'
import ResourceDetails from '../Details/ResourceDetails'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { getDataRangeOptions } from '@/components/ResourcesDir/helper'
import { updateCycleOptions } from '@/components/ResourcesDir/const'
import { ResTypeEnum } from '../helper'
import dataEmpty from '@/assets/dataEmpty.svg'
import ViewFields from '../Details/ViewFields'
import ViewApiInfo from '../Details/ViewApiInfo'

interface CatalogTableProps {
    items?: any[] // 目录列表
    handleConfig?: (record?: any) => void
    handleAddResource?: () => void
    handleRemove?: (id: string) => void
    isView?: boolean
    isProvideColumns?: boolean
    handleBatchConfig?: (value: any) => void
}

const CatalogTable = ({
    items = [],
    handleConfig,
    handleAddResource,
    handleRemove,
    isView = false,
    isProvideColumns = false,
    handleBatchConfig,
}: CatalogTableProps) => {
    const [viewInfo, setViewInfo] = useState<any>()
    const [isBatchConfig, setIsBatchConfig] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [viewFieldsOpen, setViewFieldsOpen] = useState(false)
    const [viewFieldsId, setViewFieldsId] = useState('')
    const [viewApiOpen, setViewApiOpen] = useState(false)
    const [viewApiId, setViewApiId] = useState('')
    const [{ using, governmentSwitch }] = useGeneralConfig()

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])
    const handleView = (record: any) => {
        setViewInfo(record)
    }

    const showItems = useMemo(() => {
        return items.filter(
            (item) =>
                item?.res_name
                    ?.toLocaleLowerCase()
                    .includes(keyword.trim().toLocaleLowerCase()) ||
                item?.res_code
                    ?.toLocaleLowerCase()
                    .includes(keyword.trim().toLocaleLowerCase()),
        )
    }, [items, keyword])

    const handViewFields = (id: string) => {
        setViewFieldsOpen(true)
        setViewFieldsId(id)
    }

    const handViewApi = (id: string) => {
        setViewApiOpen(true)
        setViewApiId(id)
    }

    const getResInfoItem = (record) => {
        if (
            !record.apply_conf ||
            (!record.apply_conf.api_apply_conf &&
                !record.apply_conf.view_apply_conf)
        ) {
            return '--'
        }
        const isApi = record.apply_conf.supply_type === ApplyResource.Interface
        const name = isApi
            ? record.apply_conf.api_apply_conf.data_res_name
            : record.apply_conf.view_apply_conf.data_res_name
        const code = isApi
            ? record.apply_conf.api_apply_conf.data_res_code
            : record.apply_conf.view_apply_conf.data_res_code
        return name ? (
            <div className={styles['catalog-info-container']}>
                <FontIcon
                    name={isApi ? 'icon-jiekoufuwuguanli' : 'icon-shitusuanzi'}
                    type={IconType.COLOREDICON}
                    className={styles['catalog-icon']}
                />
                <div className={styles['catalog-info']}>
                    <div className={styles['catalog-name']} title={name}>
                        {name}
                    </div>
                    <div className={styles['catalog-code']} title={code}>
                        {code}
                    </div>
                </div>
                {!record.is_published &&
                    typeof record.is_published === 'boolean' && (
                        <div className={styles['unpublished-flag']}>
                            {__('未发布')}
                        </div>
                    )}
                {!record.sync_success &&
                    typeof record.sync_success === 'boolean' && (
                        <div
                            className={styles['sync-failed-flag']}
                            title={record.sync_failed_reason}
                        >
                            {__('同步接口失败')}
                            {record.sync_failed_reason && (
                                <InfoCircleOutlined style={{ fontSize: 12 }} />
                            )}
                        </div>
                    )}
            </div>
        ) : null
    }

    const columns = useMemo(() => {
        const cols = [
            {
                title: __('资源名称（编码）'),
                dataIndex: 'res_name',
                key: 'res_name',
                width: 252,
                render: (name: string, record: any) => (
                    <div className={styles['catalog-info-container']}>
                        <FontIcon
                            name={
                                record.res_type === ResTypeEnum.Catalog
                                    ? 'icon-shujumuluguanli1'
                                    : 'icon-jiekoufuwuguanli'
                            }
                            type={IconType.COLOREDICON}
                            style={{ fontSize: 20 }}
                        />
                        <div className={styles['catalog-info']}>
                            <div
                                className={styles['catalog-name']}
                                title={name}
                            >
                                {name}
                            </div>
                            <div
                                className={styles['catalog-code']}
                                title={record.res_code}
                            >
                                {record.res_code}
                            </div>
                        </div>
                        {record.configFinish && !isView && (
                            <Tooltip title={__('资源配置已完成')}>
                                <FontIcon
                                    name="icon-wancheng"
                                    type={IconType.COLOREDICON}
                                    className={styles['config-finished-icon']}
                                />
                            </Tooltip>
                        )}
                    </div>
                ),
            },
            {
                title: __('数据提供方'),
                dataIndex: 'org_path',
                key: 'org_path',
                render: (text: string, record: any) => (
                    <span title={record.org_path}>{text || '--'}</span>
                ),
                ellipsis: true,
            },
            {
                title: __('数据范围'),
                dataIndex: 'data_range',
                key: 'data_range',
                render: (text) =>
                    [...getDataRangeOptions(governmentStatus)].find(
                        (item) => item.value === text,
                    )?.label || '--',
            },
            {
                title: __('更新周期'),
                dataIndex: 'update_cycle',
                key: 'update_cycle',
                render: (text) =>
                    updateCycleOptions.find((item) => item.value === text)
                        ?.label || '--',
            },
            {
                title: __('提供方式'),
                dataIndex: 'supply_type',
                key: 'supply_type',
                render: (text: string, record: any) => {
                    return record.res_type === ResTypeEnum.Api
                        ? __('接口服务')
                        : record.apply_conf?.supply_type ===
                          ApplyResource.Database
                        ? __('库表交换')
                        : record.apply_conf?.supply_type ===
                          ApplyResource.Interface
                        ? __('接口服务')
                        : '--'
                },
            },
            // 库表不展示申请信息项
            // {
            //     title: __('申请信息项'),
            //     dataIndex: 'columns',
            //     key: 'columns',
            //     width: 206,
            //     render: (_, record) => {
            //         const infoColumns = record.apply_conf?.view_apply_conf
            //             ?.columns
            //             ? record.apply_conf.view_apply_conf?.columns
            //             : record.apply_conf?.view_apply_conf?.column_names
            //             ? (
            //                   JSON.parse(
            //                       record.apply_conf?.view_apply_conf
            //                           ?.column_names,
            //                   ) || []
            //               ).map((item) => ({
            //                   business_name: item,
            //               }))
            //             : []
            //         const len = infoColumns.length || 0
            //         return len > 0 ? (
            //             <div className={styles['catalog-columns-container']}>
            //                 <div
            //                     className={styles['catalog-columns-item']}
            //                     title={infoColumns[0]?.business_name}
            //                 >
            //                     {infoColumns[0]?.business_name}
            //                 </div>
            //                 {len > 1 && (
            //                     <div className={styles['catalog-columns-more']}>
            //                         +{(infoColumns?.length || 0) - 1}
            //                     </div>
            //                 )}
            //             </div>
            //         ) : (
            //             '--'
            //         )
            //     },
            // },
            {
                title: __('提供数据资源'),
                dataIndex: 'supply_res',
                key: 'supply_res',
                width: 300,
                render: (text: string, record: any) => getResInfoItem(record),
            },
            {
                title: __('字段/参数详情'),
                dataIndex: 'supply_type',
                key: 'supply_type',
                render: (text: string, record: any) => {
                    if (
                        !record.apply_conf ||
                        (!record.apply_conf.api_apply_conf &&
                            !record.apply_conf.view_apply_conf)
                    ) {
                        return '--'
                    }
                    const isApi =
                        record.apply_conf.supply_type ===
                        ApplyResource.Interface
                    const name = isApi
                        ? record.apply_conf.api_apply_conf.data_res_name
                        : record.apply_conf.view_apply_conf.data_res_name
                    return (
                        <div className={styles['origin-container']}>
                            {record.replace_res || !name ? (
                                '--'
                            ) : record.apply_conf?.supply_type ===
                              ApplyResource.Database ? (
                                <Button
                                    type="link"
                                    onClick={() =>
                                        handViewFields(
                                            record.apply_conf.view_apply_conf
                                                .data_res_id,
                                        )
                                    }
                                >
                                    {__('表字段')}
                                </Button>
                            ) : (
                                <Button
                                    type="link"
                                    onClick={() =>
                                        handViewApi(
                                            record.apply_conf.api_apply_conf
                                                .data_res_id,
                                        )
                                    }
                                >
                                    {__('接口参数')}
                                </Button>
                            )}
                        </div>
                    )
                },
            },
            {
                title: (
                    <div>
                        {__('是否提供')}
                        {isBatchConfig && (
                            <Radio.Group
                                className={styles['provider-radio-group']}
                                onChange={(e) => {
                                    handleBatchConfig?.({
                                        isBatchConfig: true,
                                        value: e.target.value,
                                    })
                                }}
                            >
                                <Radio value>
                                    <Tooltip
                                        title={__(
                                            '若选择“提供”并通过数据提供方审核，该接口将默认上线',
                                        )}
                                    >
                                        {__('是')}
                                    </Tooltip>
                                </Radio>
                                <Radio value={false}>{__('否')}</Radio>
                            </Radio.Group>
                        )}
                    </div>
                ),
                dataIndex: 'is_supply',
                key: 'is_supply',
                render: (val, record) => {
                    return (
                        <Radio.Group
                            className={styles['provider-radio-group']}
                            value={val}
                            onChange={(e) => {
                                handleBatchConfig?.({
                                    isBatchConfig: false,
                                    value: e.target.value,
                                    id: record.res_id,
                                })
                            }}
                        >
                            <Radio value>{__('是')}</Radio>
                            <Radio value={false}>{__('否')}</Radio>
                        </Radio.Group>
                    )
                },
            },
            {
                title: __('理由说明'),
                dataIndex: 'remark',
                key: 'remark',
                width: 300,
                render: (val, record) => {
                    return (
                        <Input
                            style={{ width: 200 }}
                            value={val || undefined}
                            placeholder={
                                record.is_supply ? __('请输入') : __('必填')
                            }
                            prefix={
                                record.is_supply ? null : (
                                    <span style={{ color: '#ff4d4f' }}>*</span>
                                )
                            }
                            onChange={(e) =>
                                handleBatchConfig?.({
                                    isBatchConfig: false,
                                    value: e.target.value,
                                    id: record.res_id,
                                    fieldKey: 'remark',
                                })
                            }
                        />
                    )
                },
            },
            {
                title: __('操作'),
                dataIndex: 'action',
                key: 'action',
                width: isView ? 86 : undefined,
                render: (_, record) =>
                    !isView ? (
                        <Space size={16}>
                            <Button
                                type="link"
                                onClick={() => handleConfig?.(record)}
                            >
                                {__('资源配置')}
                            </Button>
                            <Popconfirm
                                title={__('确认移除吗？')}
                                icon={
                                    <ExclamationCircleFilled
                                        style={{ color: '#1890FF' }}
                                    />
                                }
                                onConfirm={() => handleRemove?.(record.res_id)}
                            >
                                <Button type="link">{__('移除')}</Button>
                            </Popconfirm>
                        </Space>
                    ) : (
                        <Button type="link" onClick={() => handleView(record)}>
                            {__('查看')}
                        </Button>
                    ),
            },
        ]

        return isProvideColumns
            ? cols
            : cols.filter(
                  (col) => col.key !== 'is_supply' && col.key !== 'remark',
              )
    }, [isProvideColumns, isBatchConfig, items])

    return (
        <div className={styles['catalog-table-wrapper']}>
            <div className={styles['operate-content']}>
                {isView ? (
                    <div />
                ) : (
                    // 去掉批量配置
                    // <div>
                    //     {isProvideColumns && (
                    //         <Space size={8}>
                    //             <Button
                    //                 onClick={() =>
                    //                     setIsBatchConfig(!isBatchConfig)
                    //                 }
                    //             >
                    //                 {isBatchConfig
                    //                     ? __('完成批量配置')
                    //                     : __('批量配置')}
                    //             </Button>
                    //             {isBatchConfig && (
                    //                 <Button
                    //                     onClick={() =>
                    //                         setIsBatchConfig(!isBatchConfig)
                    //                     }
                    //                 >
                    //                     {__('取消')}
                    //                 </Button>
                    //             )}
                    //         </Space>
                    //     )}
                    // </div>
                    <Space size={20}>
                        <Button
                            type="primary"
                            className={styles['add-btn']}
                            onClick={() => handleAddResource?.()}
                        >
                            <FontIcon
                                name="icon-jia"
                                type={IconType.FONTICON}
                                className={styles['add-btn-icon']}
                            />
                            {__('添加资源')}
                        </Button>
                        <Button
                            onClick={() => handleConfig?.()}
                            disabled={items.length === 0}
                        >
                            {__('资源配置')}
                        </Button>
                    </Space>
                )}
                <SearchInput
                    placeholder={__('搜索资源名称、资源编码')}
                    style={{ width: 280 }}
                    onKeyChange={(e) => setKeyword(e)}
                />
            </div>
            <Table
                columns={columns}
                dataSource={showItems}
                pagination={{
                    hideOnSinglePage: items.length < 10,
                    showQuickJumper: true,
                    showSizeChanger: true,
                }}
                rowKey="res_id"
                locale={{
                    emptyText: keyword ? (
                        <Empty />
                    ) : (
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    ),
                }}
            />
            {viewInfo && (
                <Drawer
                    title={__('查看资源')}
                    open={!!viewInfo}
                    onClose={() => {
                        setViewInfo(undefined)
                    }}
                    width={837}
                    push={false}
                >
                    <ResourceDetails data={viewInfo || {}} />
                </Drawer>
            )}
            {viewFieldsOpen && viewFieldsId && (
                <ViewFields
                    open={viewFieldsOpen}
                    onCancel={() => {
                        setViewFieldsOpen(false)
                        setViewFieldsId('')
                    }}
                    id={viewFieldsId}
                />
            )}
            {viewApiOpen && viewApiId && (
                <ViewApiInfo
                    open={viewApiOpen}
                    onCancel={() => {
                        setViewApiOpen(false)
                        setViewApiId('')
                    }}
                    id={viewApiId}
                />
            )}
        </div>
    )
}

export default CatalogTable
