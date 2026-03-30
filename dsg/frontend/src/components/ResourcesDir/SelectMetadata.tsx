import React, {
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { Button, Input, Space, Table, Modal, Tooltip, message } from 'antd'
import classnames from 'classnames'
import { SearchOutlined } from '@ant-design/icons'
import { useAntdTable, useDebounce, useUpdateEffect } from 'ahooks'
import { debounce, noop, trim } from 'lodash'
import dataEmpty from '@/assets/dataEmpty.svg'
import MetaDataTree from './MetaDataTree'
import { Architecture, DataNode, typeOptoins } from './const'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import {
    formatError,
    getObjectDetails,
    getMetaDataList,
    IGetObject,
    getMetaDataFields,
    getResourcesCheck,
    getDataViewDatasouces,
    getDatasheetView,
    IDatasheetView,
    getFormViewCheck,
    getDatasheetViewDetails,
    LogicViewType,
    dataTypeMapping,
} from '@/core'
import __ from './locale'
import { SearchInput } from '@/ui'
import DatasourceTree from '../DatasheetView/DatasourceTree'
import { DatasourceTreeNode, stateType } from '../DatasheetView/const'
import Icons from '../DatasheetView/Icons'
import { getFieldTypeIcon } from './helper'
import { DatasheetViewColored, DatasheetViewDisabledColored } from '@/icons'
import { DataColoredBaseIcon } from '@/core/dataSource'

interface ISearchCondition extends IGetObject {
    current?: number
}
interface ISelectMetaData {
    ref?: any
    defaultForm: any
    defaultTreeExpandedKeys?: Array<string>
    getForm?: () => void
    selectedRowList?: (flag: boolean) => void
    setIsUpdataInfos?: (flag: boolean) => void
    onDataChanged?: () => void
    setIsShowFooter?: (isShow: boolean) => void
}

const SelectMetaData: React.FC<ISelectMetaData> = forwardRef(
    (props: any, ref) => {
        const {
            defaultForm,
            selectedRowList,
            setIsUpdataInfos,
            defaultTreeExpandedKeys,
            onDataChanged = noop,
            setIsShowFooter = noop,
        } = props
        const [searchValue, setSearchValue] = useState('')
        const [initFieldsListState, setInitFieldsListState] =
            useState<boolean>(true)

        const [selectedNode, setSelectedNode] = useState<DatasourceTreeNode>({
            name: '全部',
            id: '',
        })
        // 表名已被编目id列表
        const [checkResources, setCheckResources] = useState<string[]>([])
        useImperativeHandle(ref, () => ({
            selectedRows,
            getExpandedKeys,
            datasourceData,
        }))
        const [searchCondition, setSearchConditon] = useState<ISearchCondition>(
            {
                id: selectedNode?.id,
                is_all: true,
                type: '',
                keyword: '',
            },
        )

        const [selectedRow, setSelectedRow] = useState<DataNode>()
        const [details, setDetails] = useState<any>()
        // 查看字段弹窗
        const [fieldsModalOpen, setFieldsModalOpen] = useState<boolean>(false)
        // 已选表 ids
        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
        // 已选表 rows
        const [selectedRows, setSelectedRows] = useState<any[]>([])
        // 已选库 -- tree
        const [selectedTreeNode, setSelectedTreeNode] = useState<any>({})
        const [fieldsDataSource, setFieldsDataSource] = useState([])
        const [fieldsDataSourceCopy, setFieldsDataSourceCopy] = useState([])
        const metaDataTreeRef: any = useRef()
        const [datasourceData, setDatasourceData] = useState<any[]>([])
        const [tabelIdStr, setTableIdStr] = useState('')

        useUpdateEffect(() => {
            if (searchValue === searchCondition.keyword) return
            setSearchConditon({
                ...searchCondition,
                keyword: searchValue,
                current: 1,
            })
        }, [searchValue])
        useEffect(() => {
            setSelectedRows(defaultForm)
            if (defaultForm && defaultForm.length > 0) {
                const [row] = defaultForm
                setSelectedRowKeys(defaultForm.map((item) => item.id))
                run({
                    ...pagination,
                    ...searchCondition,
                    schema_id: row.schema_id,
                })
            }
        }, [defaultForm])
        useEffect(() => {
            selectedRowList(selectedRows.length === 0)
        }, [selectedRows])

        const getDatasourceData = async () => {
            try {
                const res = await getDataViewDatasouces({ limit: 1000 })
                setDatasourceData(res?.entries)
                if (
                    (res?.entries || []).length === 0 ||
                    res?.entries?.every((item) => item.last_scan === 0)
                ) {
                    setIsShowFooter(false)
                } else {
                    setIsShowFooter(true)
                }
            } catch (err) {
                formatError(err)
            }
        }

        useEffect(() => {
            getDatasourceData()
        }, [])

        const checkTable = async () => {
            const checkRes = await getFormViewCheck({
                form_view_ids: tableProps.dataSource
                    .map((item) => item.id)
                    .toString(),
            })
            setCheckResources(checkRes?.mounted_res_ids || [])
        }

        // 获取节点对象
        const getNodeObjects = async (params: any) => {
            const {
                current: offset,
                pageSize: limit,
                keyword,
                datasource_id,
                datasource_type,
                sn,
            } = params

            let paramsObj: IDatasheetView = {
                limit,
                offset,
                keyword,
                datasource_id,
                datasource_type,
                type: LogicViewType.DataSource,
                publish_status: 'publish',
            }

            if (!datasource_id && !datasource_type && !sn) {
                paramsObj = {
                    ...paramsObj,
                    ...getDatasourceSearchParams(selectedNode),
                }
            }
            try {
                const res = await getDatasheetView(paramsObj)
                return {
                    total: res.total_count,
                    list: res.entries,
                }
            } catch (error) {
                return { total: 0, list: [] }
            }
        }

        const { tableProps, run, pagination } = useAntdTable(getNodeObjects, {
            defaultPageSize: 10,
            manual: true,
        })

        useEffect(() => {
            if (tableProps.dataSource.length > 0) {
                checkTable()
            }
        }, [tableProps.dataSource])

        const getDataType = (type: string) => {
            let tempType = ''
            Object.keys(dataTypeMapping).forEach((key) => {
                if (dataTypeMapping[key].includes(type)) {
                    tempType = key
                }
            })
            return typeOptoins.find((item) => item.strValue === tempType)?.value
        }

        const columns: any = [
            {
                title: (
                    <div>
                        <span>{__('库表业务名称')}</span>
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('（技术名称）')}
                        </span>
                    </div>
                ),
                dataIndex: 'business_name',
                key: 'business_name',
                render: (text, record) => (
                    <div
                        className={classnames(
                            styles.catlgBox,
                            checkResources.includes(record.id) &&
                                styles.disabledCatlgBox,
                        )}
                    >
                        {checkResources.includes(record.id) ? (
                            <DatasheetViewDisabledColored
                                className={styles.formIcon}
                            />
                        ) : (
                            <DatasheetViewColored className={styles.formIcon} />
                        )}

                        <div
                            className={classnames(styles.catlgName)}
                            title={text}
                        >
                            <div className={styles.ellipsis} title={text}>
                                {text}
                            </div>
                            <div
                                className={classnames(
                                    styles.ellipsis,
                                    styles.catlgCode,
                                )}
                                title={record.technical_name}
                                style={{
                                    color: 'rgba(0, 0, 0, 0.45)',
                                    fontSize: '12px',
                                }}
                            >
                                {record.technical_name}
                            </div>
                        </div>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('所属数据源'),
                dataIndex: 'datasource',
                key: 'datasource',
                ellipsis: true,
                render: (text, record) => {
                    return (
                        <div
                            title={text}
                            className={classnames(
                                styles.datasourceBox,
                                checkResources.includes(record.id) &&
                                    styles.disabledCatlgBox,
                            )}
                        >
                            {record?.datasource_type && (
                                <DataColoredBaseIcon
                                    type={record.datasource_type}
                                    iconType="Colored"
                                    className={styles.datasourceIcon}
                                />
                            )}
                            <span>{text || '--'}</span>
                        </div>
                    )
                },
            },
            {
                title: __('操作'),
                key: 'action',
                width: 120,
                render: (_: string, record) => (
                    <Space size={16}>
                        <Tooltip>
                            <Button
                                type="link"
                                onClick={(e) => {
                                    viewField(record)
                                    e.stopPropagation()
                                }}
                            >
                                {__('查看字段')}
                            </Button>
                        </Tooltip>
                    </Space>
                ),
            },
        ]

        const fieldsColumns = [
            {
                // title: __('业务名称/技术名称'),
                title: (
                    <div>
                        <span>{__('业务名称')}</span>
                        <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>
                            {__('（技术名称）')}
                        </span>
                    </div>
                ),
                dataIndex: 'field_name',
                key: 'field_name',
                ellipsis: true,
                width: 260,
                render: (_, record) => {
                    const data_format = getDataType(
                        record?.data_type?.toLocaleLowerCase(),
                    )
                    const type =
                        typeOptoins.find((item) => item.value === data_format)
                            ?.label || ''
                    return (
                        <div className={styles['name-column']}>
                            <Tooltip
                                title={type}
                                color="#fff"
                                overlayInnerStyle={{ color: '#000' }}
                            >
                                <div className={styles.icon}>
                                    {getFieldTypeIcon(record.data_type)}
                                </div>
                            </Tooltip>
                            <div className={styles.names}>
                                <div
                                    className={styles['business-name']}
                                    title={record.business_name}
                                >
                                    {record.business_name}
                                </div>
                                <div
                                    className={styles['technical-name']}
                                    title={record.technical_name}
                                >
                                    {record.technical_name}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                title: __('数据长度'),
                dataIndex: 'data_length',
                key: 'data_length',
                ellipsis: true,
                render: (text) => (text || text === 0 ? text : '--'),
            },
            {
                title: __('精度'),
                dataIndex: 'data_accuracy',
                key: 'data_accuracy',
                ellipsis: true,
                render: (text) => (text || text === 0 ? text : '--'),
            },
            {
                title: __('是否主键'),
                dataIndex: 'primary_key',
                key: 'primary_key',
                ellipsis: true,
                render: (text) => (text ? __('是') : __('否')),
            },
            {
                title: __('是否为空'),
                dataIndex: 'is_nullable',
                key: 'is_nullable',
                ellipsis: true,
                render: (text) => (text === 'YES' ? __('是') : __('否')),
            },
        ]

        const viewField = async (record, key_word?: string) => {
            try {
                const res = await getDatasheetViewDetails(record.id)
                // 过滤被删除项
                const fields = res?.fields?.filter(
                    (item) => item.status !== stateType.delete,
                )
                setInitFieldsListState(fields.length === 0)
                setFieldsDataSourceCopy(fields)
                setFieldsDataSource(fields)
                setFieldsModalOpen(true)
            } catch (error) {
                formatError(error)
            }
        }

        const getDetails = async (objId: string, record?) => {
            try {
                // advanced_params
                const res = await getObjectDetails(objId)
                setDetails({
                    ...res.attributes,
                    name: res.name,
                })
                // 请求成功设置选中行，不成功不允许选中
                if (record) {
                    setSelectedRow(record)
                }
            } catch (error) {
                formatError(error)
            }
        }

        // 选中树节点变化，查属性详情
        useEffect(() => {
            if (selectedNode.id) {
                // getDetails(selectedNode.id)
            }
        }, [selectedNode])

        const renderEmpty = () => {
            // 是否根据库查询表
            if (tableProps.dataSource.length === 0 && searchValue) {
                return (
                    <Empty
                        desc={
                            <div className={styles['empty-reason']}>
                                <div>抱歉，没有找到相关内容</div>
                                <div>可能的有以下原因：</div>
                                <div>1、库表不存在</div>
                                <div>2、库表存在但未发布</div>
                            </div>
                        }
                    />
                )
            }
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }

        const getExpandedKeys = () => {
            const data = metaDataTreeRef?.current.expandedKeys
            return data
        }

        const rowSelection = {
            selectedRowKeys,
            onChange: (newSelectedRowKeys: React.Key[], record) => {
                setSelectedRowKeys(newSelectedRowKeys)
                setSelectedRows(record)
                setIsUpdataInfos(true)
                onDataChanged()
            },
            getCheckboxProps: (record: any) => ({
                disabled: checkResources.includes(record.id),
                name: record.name,
                children: checkResources.includes(record.id) ? (
                    <Tooltip title={__('该库表不可重复编目')}>
                        <span
                            style={{
                                width: 20,
                                height: 20,
                                position: 'absolute',
                                top: 1,
                                left: -2,
                                zIndex: 11,
                                borderRadius: '50%',
                            }}
                        />
                    </Tooltip>
                ) : null,
            }),
        }

        // 列表搜索
        const handleSearchPressEnter = async (e: any) => {
            const keyword = typeof e === 'string' ? e : trim(e.target.value)
            run({
                ...pagination,
                ...searchCondition,
                keyword,
            })
        }
        // 查看字段 -- 详情
        const fieldshandleSearchPressEnter = async (e: any) => {
            const value =
                typeof e === 'string'
                    ? e?.toLowerCase()
                    : trim(e.target.value)?.toLowerCase()
            if (value) {
                setFieldsDataSource(
                    fieldsDataSourceCopy.filter(
                        (item: any) =>
                            item.business_name.toLowerCase().indexOf(value) >
                                -1 ||
                            item.technical_name.toLowerCase().indexOf(value) >
                                -1,
                    ),
                )
            } else {
                setFieldsDataSource(fieldsDataSourceCopy)
            }
        }

        const getDatasourceSearchParams = (selectedDatasources) => {
            // 后端datasource_id和datasource_type二选一，有id则不使用type
            const datasource_type =
                !selectedDatasources?.id ||
                selectedDatasources?.id !== selectedDatasources.type
                    ? undefined
                    : selectedDatasources.type
            const datasource_id =
                datasource_type || !selectedDatasources?.id
                    ? undefined
                    : selectedDatasources?.id

            return {
                datasource_type,
                datasource_id,
            }
        }
        // 获取选中的节点
        const getSelectedNode = (sn: DatasourceTreeNode) => {
            if (sn?.id === selectedNode.id) return
            setSelectedNode(sn || { id: '', name: '全部' })
            setSearchValue('')
            run({
                ...pagination,
                ...searchCondition,
                ...getDatasourceSearchParams(sn),
                current: 1,
                sn,
            })
        }

        return (
            <div
                className={classnames(
                    styles.selectMetaDataWrapper,
                    (datasourceData?.length === 0 ||
                        datasourceData?.every(
                            (item) => item.last_scan === 0,
                        )) &&
                        styles.selectMetaDataEmptyWrapper,
                )}
            >
                {datasourceData?.length > 0 &&
                datasourceData.find((item) => item.last_scan !== 0) ? (
                    <>
                        <div className={styles.leftBox}>
                            <DatasourceTree
                                getSelectedNode={getSelectedNode}
                                datasourceData={datasourceData}
                                ref={metaDataTreeRef}
                            />
                        </div>
                        <div className={styles.rightBox}>
                            <div className={styles.rightSearch}>
                                <div className={styles.rigthTitle}>
                                    {selectedRows.length > 0 ? (
                                        <span>
                                            {__('表技术名称：')}
                                            {selectedRows?.map(
                                                (item) => item.technical_name,
                                            )}
                                        </span>
                                    ) : (
                                        __('库表')
                                    )}
                                </div>
                                <div className={styles.rightSearchInp}>
                                    <SearchInput
                                        placeholder={__(
                                            '搜索库表业务名称、技术名称',
                                        )}
                                        onKeyChange={(kw: string) => {
                                            setSearchValue(kw)
                                            handleSearchPressEnter(kw)
                                        }}
                                        value={searchValue}
                                        onPressEnter={handleSearchPressEnter}
                                        className={styles.searchInput}
                                        style={{ width: 272 }}
                                    />
                                </div>
                            </div>

                            <div className={classnames(styles.bottom)}>
                                {tableProps.pagination.total === 0 &&
                                !tableProps.loading ? (
                                    <div className={styles.emptyWrapper}>
                                        {renderEmpty()}
                                    </div>
                                ) : (
                                    <Table
                                        columns={columns}
                                        {...tableProps}
                                        rowSelection={{
                                            ...rowSelection,
                                            type: 'radio',
                                        }}
                                        rowKey="id"
                                        // scroll={{
                                        //     y:
                                        //         tableProps.dataSource.length === 0
                                        //             ? undefined
                                        //             : 320,
                                        // }}
                                        pagination={{
                                            ...tableProps.pagination,
                                            showSizeChanger: false,
                                            hideOnSinglePage: true,
                                        }}
                                        bordered={false}
                                        locale={{
                                            emptyText: searchValue ? (
                                                <Empty />
                                            ) : (
                                                <div />
                                            ),
                                        }}
                                        rowClassName={(record) =>
                                            record.id === selectedRow?.id
                                                ? 'any-fabric-ant-table-row-selected'
                                                : ''
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyWrapper}>
                        <Empty
                            desc={__('系统中暂无已发布的库表')}
                            iconSrc={dataEmpty}
                        />
                    </div>
                )}

                <Modal
                    title={__('查看字段')}
                    width={910}
                    open={fieldsModalOpen}
                    onOk={() => setFieldsModalOpen(false)}
                    onCancel={() => setFieldsModalOpen(false)}
                    footer={null}
                    destroyOnClose
                    bodyStyle={{ padding: 24 }}
                >
                    {!initFieldsListState ? (
                        <div>
                            <div className={styles.fieldsSearchInp}>
                                <SearchInput
                                    placeholder={__('搜索业务名称、技术名称')}
                                    onKeyChange={fieldshandleSearchPressEnter}
                                    onPressEnter={fieldshandleSearchPressEnter}
                                    className={styles.searchInput}
                                    style={{ width: 272 }}
                                />
                            </div>
                            <Table
                                dataSource={fieldsDataSource}
                                columns={fieldsColumns}
                                locale={{
                                    emptyText: <Empty />,
                                }}
                                scroll={{
                                    y:
                                        fieldsDataSource.length === 0
                                            ? undefined
                                            : 'calc(100vh - 395px)',
                                }}
                                rowKey="id"
                                pagination={{ hideOnSinglePage: true }}
                            />
                        </div>
                    ) : (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    )}
                </Modal>
            </div>
        )
    },
)

export default SelectMetaData
