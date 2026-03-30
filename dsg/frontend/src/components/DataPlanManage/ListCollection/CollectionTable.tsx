import {
    Button,
    DatePicker,
    message,
    Select,
    Space,
    Spin,
    Table,
    Tooltip,
} from 'antd'
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import { Empty, Loader } from '@/ui'
import {
    DataSourceFromType,
    formatError,
    getDataSourceList,
    getWorkOrder,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import { CollectionMethod, getDepartName, SyncFrequency } from './helper'
import { OperateType } from '@/utils'
import { FixedType } from '@/components/CommonTable/const'
import ViewChoose from './ViewChoose'
import { getState } from '@/components/DatasheetView/helper'
import {
    evaluationStatusList,
    explorationStatus,
} from '@/components/DatasheetView/const'
import { ExplorationType } from '@/components/DatasheetView/DatasourceExploration/const'
import DatasourceExploration from '@/components/DatasheetView/DatasourceExploration'
import { databaseTypesEleData } from '@/core/dataSource'
import { useDataViewContext } from '@/components/DatasheetView/DataViewProvider'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { SourceTypeEnum } from '@/components/WorkOrder/WorkOrderManage/helper'

import MyTaskDrawer from '@/components/AssetCenterHeader/MyTaskDrawer'
import BatchConfig from './BatchConfig'

const CollectionTable = forwardRef(
    (
        {
            readOnly,
            isAsset = false,
            value,
            onChange,
            isChild = false,
            onCheckChange,
        }: any,
        ref,
    ) => {
        const [dataSource, setDataSource] = useState<any[]>([])
        const [curDatasheet, setCurDatasheet] = useState<any>()
        const [optOpen, setOptOpen] = useState<boolean>(false)
        const [datasourceExplorationOpen, setDatasourceExplorationOpen] =
            useState<boolean>(false)

        const [dataSourceLoading, setDataSourceLoading] =
            useState<boolean>(false)
        const [dataOriginOptions, setDataOriginOptions] = useState<Array<any>>(
            [],
        )
        const [datasourceKeyword, setDatasouceKeyword] = useState<string>('')
        const { setIsValueEvaluation, showMytask, setShowMytask } =
            useDataViewContext()

        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
        const [batchConfigOpen, setBatchConfigOpen] = useState<boolean>(false)
        const [checkedItems, setCheckedItems] = useState<any[]>([])
        const navigator = useNavigate()
        const handleViewDetail = (id: string) => {
            const url: string = `/datasheet-view/detail?id=${id}&backPrev=true`
            navigator(url)
        }

        useEffect(() => {
            if (value?.length && Array.isArray(value)) {
                const dataTrans = value.map((o) => ({
                    ...o,
                    explore_content:
                        o.explore_content || o?.value_assessment_status,
                }))
                setDataSource(dataTrans)
            }
        }, [value])

        useEffect(() => {
            getDataOriginOptions()
        }, [])

        const onAdd = () => {
            handleOperate(OperateType.CREATE, undefined)
        }

        const onBatchConfigOpen = (isOpen: boolean) => {
            setBatchConfigOpen(isOpen)
        }

        const clearSelection = () => {
            setSelectedRowKeys([])
            setCheckedItems([])
            onCheckChange?.([])
        }

        useImperativeHandle(ref, () => ({
            onAdd,
            onBatchConfigOpen,
            clearSelection,
        }))

        /**
         * 获取数据源下拉
         * @param systemId
         */
        const getDataOriginOptions = async () => {
            try {
                setDataSourceLoading(true)
                const { entries } = await getDataSourceList({
                    limit: 999,
                })

                if (!entries || !Array.isArray(entries)) {
                    setDataOriginOptions([])
                    return
                }

                const options = entries
                    .filter((item) => item.type !== 'excel')
                    .map((dataSourceInfo) => {
                        const { Outlined } =
                            databaseTypesEleData?.dataBaseIcons?.[
                                dataSourceInfo.type
                            ] || {}
                        const ICons = Outlined ? (
                            <Outlined style={{ fontSize: 22 }} />
                        ) : null

                        return {
                            label: (
                                <div className={styles.selectMetaOptions}>
                                    {ICons}
                                    <span
                                        className={styles.name}
                                        title={dataSourceInfo.name}
                                    >
                                        {dataSourceInfo.name}
                                    </span>
                                </div>
                            ),
                            value: dataSourceInfo.id,
                            dataType: dataSourceInfo.type,
                            details: dataSourceInfo,
                        }
                    })

                setDataOriginOptions(options)
            } catch (ex) {
                formatError(ex)
                setDataOriginOptions([])
            } finally {
                setDataSourceLoading(false)
            }
        }

        const handleChange = (key, field, val) => {
            const obj: any = {}
            if (key === 'target_datasource_id') {
                obj.target_datasource_name =
                    dataOriginOptions?.find((o) => o.value === val)?.details
                        ?.name || ''
            }
            const newData = dataSource.map((item) =>
                item.id === key ? { ...item, [field]: val, ...obj } : item,
            )
            setDataSource(newData)
            onChange(newData)
        }

        const columns: any = [
            {
                title: (
                    <div>
                        <span>
                            {isAsset ? __('逻辑视图名称') : __('资源名称')}
                        </span>
                        <span
                            style={{
                                color: 'rgba(0,0,0,0.45)',
                                fontWeight: 'normal',
                            }}
                        >
                            （{__('技术名称')}）
                        </span>
                    </div>
                ),
                dataIndex: 'business_name',
                key: 'business_name',
                ellipsis: true,
                width: 200,
                fixed: FixedType.LEFT,
                render: (text, record) => (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 8,
                        }}
                    >
                        <div>
                            <FontIcon
                                name="icon-shujubiaoshitu"
                                type={IconType.COLOREDICON}
                                style={{ fontSize: 24 }}
                            />
                        </div>
                        <div
                            className={styles.titleBox}
                            style={{ width: 'calc(100% - 22px)' }}
                        >
                            <div className={styles.sourceTitle}>
                                <div
                                    title={text}
                                    onClick={() =>
                                        handleViewDetail(record?.data_view_id)
                                    }
                                >
                                    {text || '--'}
                                </div>
                            </div>
                            <div
                                className={styles.sourceContent}
                                title={record?.technical_name}
                            >
                                {record?.technical_name || '--'}
                            </div>
                        </div>
                    </div>
                ),
            },
            {
                title: (
                    <div>
                        <span>{__('数据来源')}</span>
                        <span
                            style={{
                                color: 'rgba(0,0,0,0.45)',
                                fontWeight: 'normal',
                            }}
                        >
                            （{__('所属部门')}）
                        </span>
                    </div>
                ),
                dataIndex: 'datasource_name',
                key: 'datasource_name',
                width: 160,
                ellipsis: true,
                render: (text, record) => (
                    <div className={styles.titleBox}>
                        <div className={styles.sourceTitle}>
                            <div title={text}>{text || '--'}</div>
                        </div>
                        <div
                            className={styles.sourceContent}
                            title={record?.department_path}
                        >
                            {getDepartName(record?.department_path) || '--'}
                        </div>
                    </div>
                ),
            },
            {
                title: (
                    <div>
                        <span style={{ color: 'red' }} hidden={readOnly}>
                            *
                        </span>
                        <span>{__('归集方式')}</span>
                    </div>
                ),
                dataIndex: 'collection_method',
                key: 'collection_method',
                width: 120,
                ellipsis: true,
                render: (text, record) =>
                    readOnly ? (
                        <div className={styles.ellipsisTitle} title={text}>
                            {CollectionMethod.find((o) => o.value === text)
                                ?.label || '--'}
                        </div>
                    ) : (
                        <Select
                            placeholder={__('请选择')}
                            value={text}
                            defaultValue="Full"
                            options={CollectionMethod}
                            onChange={(val) =>
                                handleChange(
                                    record?.id,
                                    'collection_method',
                                    val,
                                )
                            }
                        />
                    ),
            },

            {
                title: (
                    <div>
                        <span style={{ color: 'red' }} hidden={readOnly}>
                            *
                        </span>
                        <span>{__('同步频率')}</span>
                    </div>
                ),
                dataIndex: 'sync_frequency',
                key: 'sync_frequency',
                width: 120,
                ellipsis: true,
                render: (text, record) =>
                    readOnly ? (
                        <div className={styles.ellipsisTitle} title={text}>
                            {SyncFrequency.find((o) => o.value === text)
                                ?.label || '--'}
                        </div>
                    ) : (
                        <Select
                            value={text}
                            defaultValue="PerDay"
                            options={SyncFrequency}
                            placeholder={__('请选择')}
                            onChange={(val) =>
                                handleChange(record?.id, 'sync_frequency', val)
                            }
                        />
                    ),
            },
            {
                title: (
                    <div>
                        <span style={{ color: 'red' }} hidden={readOnly}>
                            *
                        </span>
                        <span>{__('目标数据源')}</span>
                        <span
                            style={{
                                color: 'rgba(0,0,0,0.45)',
                                fontWeight: 'normal',
                            }}
                            hidden={!readOnly}
                        >
                            （{__('数据库')}）
                        </span>
                    </div>
                ),
                dataIndex: 'target_datasource_id',
                key: 'target_datasource_id',
                ellipsis: true,
                width: 230,
                render: (text, record) =>
                    readOnly ? (
                        <div
                            className={styles.ellipsisTitle}
                            title={record?.target_datasource_name}
                        >
                            {record?.target_datasource_name}
                        </div>
                    ) : (
                        <Select
                            value={
                                text
                                    ? {
                                          value: text,
                                          label: record?.target_datasource_name,
                                      }
                                    : undefined
                            }
                            style={{ width: '100%' }}
                            options={dataOriginOptions}
                            notFoundContent={
                                dataSourceLoading ? (
                                    <div
                                        style={{
                                            padding: '8px 0',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Spin size="small" />
                                    </div>
                                ) : dataOriginOptions?.length ? (
                                    __('未找到匹配的结果')
                                ) : (
                                    __('暂无数据')
                                )
                            }
                            placeholder={__('请选择')}
                            allowClear
                            showSearch
                            // onSearch={(val) => {
                            //     if (val.length <= 128) {
                            //         setDatasouceKeyword(val)
                            //     }
                            // }}
                            // searchValue={datasourceKeyword}
                            filterOption={(input, opt: any) => {
                                const name = opt?.details?.name || ''
                                return name
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                            }}
                            onChange={(val) => {
                                handleChange(
                                    record?.id,
                                    'target_datasource_id',
                                    val,
                                )
                            }}
                        />
                    ),
            },
            {
                title: __('价值评估状态'),
                dataIndex: 'explore_content',
                key: 'explore_content',
                ellipsis: true,
                width: 120,
                render: (text, record) =>
                    getState(
                        text ||
                            record.explored_data ||
                            record.explored_timestamp ||
                            record.explored_classification
                            ? explorationStatus.Exploration
                            : explorationStatus.UnExploration,
                        evaluationStatusList,
                    ),
            },
            {
                title: __('操作'),
                key: 'action',
                width: isAsset ? 150 : 80,
                fixed: FixedType.RIGHT,
                render: (_: string, record) => (
                    <Space>
                        <Button
                            type="link"
                            onClick={() =>
                                handleOperate(OperateType.EXECUTE, record)
                            }
                            hidden={!isAsset}
                        >
                            {__('发起评估')}
                        </Button>
                        {!readOnly && (
                            <Button
                                type="link"
                                onClick={() =>
                                    handleOperate(OperateType.DELETE, record)
                                }
                            >
                                {__('移除')}
                            </Button>
                        )}
                    </Space>
                ),
            },
        ]

        const handleDelete = async (id: string) => {
            const newData = dataSource?.filter((o) => o?.id !== id)
            setDataSource(newData)
            onChange(newData)
        }

        const handleOperate = async (op: OperateType, item: any) => {
            switch (op) {
                case OperateType.CREATE:
                    // 创建
                    setOptOpen(true)
                    break
                case OperateType.DELETE:
                    // 删除
                    handleDelete(item?.id)
                    break
                case OperateType.EXECUTE:
                    // 发起评估
                    setCurDatasheet(item)
                    setDatasourceExplorationOpen(true)
                    setIsValueEvaluation(true)
                    break
                default:
                    break
            }
        }

        const onSelectChange = (keys: React.Key[]) => {
            setSelectedRowKeys(keys)
            setCheckedItems(dataSource?.filter((o) => keys.includes(o?.id)))
            onCheckChange?.(keys)
        }

        const handleUpdateCheckedRowItems = (config) => {
            const newData = dataSource?.map((o) => {
                if (selectedRowKeys.includes(o.id)) {
                    return {
                        ...o,
                        ...config,
                    }
                }
                return o
            })
            setDataSource(newData)
            onChange?.(newData)
            message.success(__('批量配置成功'))
            // 清空选中项
            clearSelection()
        }

        const renderEmpty = () => {
            return (
                <Empty
                    desc={
                        readOnly ? (
                            <span>暂无数据</span>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div>
                                    {__('点击')}
                                    <a
                                        onClick={() =>
                                            handleOperate(
                                                OperateType.CREATE,
                                                undefined,
                                            )
                                        }
                                    >
                                        【{__('添加')}】
                                    </a>
                                    {isAsset
                                        ? __('可添加归集资源')
                                        : __('可添加资源')}
                                </div>
                            </div>
                        )
                    }
                    iconSrc={dataEmpty}
                />
            )
        }

        const currentColumns = useMemo(() => {
            const ignoreKeys: string[] = []
            if (readOnly) {
                ignoreKeys.push('action')
            }
            if (!isAsset) {
                ignoreKeys.push('explore_content')
            }

            return columns?.filter((o) => !ignoreKeys.includes(o.key))
        }, [readOnly, dataSource, isAsset, dataOriginOptions])

        return (
            <div className={styles['resource-list']}>
                <div
                    className={styles['resource-list-header']}
                    hidden={
                        !(
                            !readOnly &&
                            dataSource?.length > 0 &&
                            !isAsset &&
                            !isChild
                        )
                    }
                >
                    <div>
                        <Button
                            type="primary"
                            onClick={() => {
                                onAdd()
                            }}
                        >
                            {__('添加')}
                        </Button>
                    </div>
                    <div>
                        <Tooltip
                            title={
                                selectedRowKeys?.length === 0
                                    ? __('请勾选${type}', {
                                          type: isAsset
                                              ? __('逻辑视图')
                                              : __('资源'),
                                      })
                                    : undefined
                            }
                        >
                            <Button
                                type="link"
                                icon={
                                    <FontIcon
                                        name="icon-shezhi"
                                        style={{ marginRight: 6 }}
                                    />
                                }
                                disabled={selectedRowKeys?.length === 0}
                                onClick={() => {
                                    setBatchConfigOpen(true)
                                }}
                            >
                                {__('批量配置')}
                            </Button>
                        </Tooltip>
                    </div>
                </div>
                {!dataSource?.length && !isChild ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {renderEmpty()}
                    </div>
                ) : (
                    <Table
                        rowClassName={styles.tableRow}
                        dataSource={dataSource}
                        columns={currentColumns}
                        rowKey="id"
                        scroll={{
                            x: 1100,
                            y: readOnly || isChild ? undefined : 500,
                        }}
                        rowSelection={
                            readOnly
                                ? undefined
                                : {
                                      type: 'checkbox',
                                      selectedRowKeys,
                                      onChange: onSelectChange,
                                  }
                        }
                        pagination={
                            isChild || !readOnly
                                ? false
                                : {
                                      pageSize: 5,
                                      showSizeChanger: false,
                                      hideOnSinglePage: true,
                                  }
                        }
                    />
                )}

                {batchConfigOpen && (
                    <BatchConfig
                        open={batchConfigOpen}
                        data={checkedItems}
                        onClose={() => {
                            setBatchConfigOpen(false)
                        }}
                        onSure={(config) => {
                            if (config) {
                                handleUpdateCheckedRowItems(config)
                            }
                            setBatchConfigOpen(false)
                        }}
                    />
                )}

                {optOpen && (
                    <ViewChoose
                        open={optOpen}
                        bindItems={dataSource}
                        onClose={() => {
                            setOptOpen(false)
                        }}
                        onSure={(items) => {
                            const curItems = items?.map((o) => ({
                                ...o,
                                datasource_name: o?.datasource,
                                collection_method: 'Full',
                                sync_frequency: 'PerDay',
                            }))
                            // 设置选中view
                            const newData = [...(dataSource ?? []), ...curItems]
                            setDataSource(newData)
                            onChange?.(newData)
                            setOptOpen(false)
                        }}
                    />
                )}

                {datasourceExplorationOpen && (
                    <DatasourceExploration
                        open={datasourceExplorationOpen}
                        onClose={(showTask?: boolean) => {
                            setDatasourceExplorationOpen(false)
                            if (showTask) {
                                setShowMytask(true)
                            }
                        }}
                        type={ExplorationType.FormView}
                        formView={curDatasheet}
                    />
                )}

                {showMytask && (
                    <MyTaskDrawer
                        open={showMytask}
                        onClose={() => {
                            setShowMytask(false)
                        }}
                        tabKey="2"
                    />
                )}
            </div>
        )
    },
)

export default CollectionTable
