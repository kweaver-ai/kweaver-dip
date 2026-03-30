import React, { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Checkbox,
    Drawer,
    List,
    Popover,
    Radio,
    Row,
    Space,
    Tooltip,
    Typography,
} from 'antd'
import InfiniteScroll from 'react-infinite-scroll-component'
import classNames from 'classnames'
import { UpOutlined, DownOutlined } from '@ant-design/icons'
import { useAntdTable, useDebounce, useUpdateEffect } from 'ahooks'
import { isEqual, isNumber, uniqBy } from 'lodash'
import styles from './styles.module.less'
import { Empty, LightweightSearch, Loader, SearchInput } from '@/ui'
import {
    IDataRescQuery,
    SortDirection,
    SystemCategory,
    formatError,
    getDataRescList,
    getDataRescList2,
    getDatasheetViewDetails,
    getInfoRescCatlgList,
    queryInfoResCatlgColumns,
    getRescCatlgList,
    getRescDirColumnInfo,
    previewFormData,
    reqBusinObjListForOper,
} from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import __ from './locale'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import { allNodeInfo, OnlineStatus, PublishStatus } from '../../const'
import { searchFormData, SelRescTags } from './helper'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import { onLineStatus, typeOptoins } from '@/components/ResourcesDir/const'
import { useQuery } from '@/utils'

export const menus = [
    { key: 'created_at', label: __('按创建时间排序') },
    { key: 'updated_at', label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}

export interface ISearchCondition {
    offset?: number
    limit?: number
    orgcode?: string
    keyword?: string
    mount_type?: string
    direction?: string
    sort?: string
    sort_by?: {
        fields: Array<string>
        direction: string
    }
    cate_info?: {
        cate_id?: string
        node_id?: string
    }
    // 自动关联来源业务表ID
    auto_related_source_id?: string
}

interface ISelectRescCatlg {
    // 自动关联来源业务表ID
    formId?: string
    title?: string
    type: DataRescType
    open: boolean
    onClose: () => void
    onOK: (resource) => void
    selRescList?: Array<any>
    valueKey?: string
}

const SelectRescCatlg: React.FC<ISelectRescCatlg> = ({
    formId = '',
    title = '',
    type = DataRescType.DATA_RESC_CATLG,
    open,
    onClose,
    selRescList = [],
    valueKey = 'label',
    onOK,
}) => {
    const [{ using }, updateUsing] = useGeneralConfig()

    const query = useQuery()
    // 有值时为编辑，无值时为新建   信息资源目录选择生效  数据目录不生效
    const catlgId = type === DataRescType.INFO_RESC_CATLG ? query.get('id') : ''

    const scrollListId = 'item-list'

    const [selectedNode, setSelectedNode] = useState<any>({})
    const [checkedData, setCheckedData] = useState<
        Array<{
            id: string
            name: string
        }>
    >([])
    const [selectedData, setSelectedData] = useState<any>()

    const defaultPreivewListSize = 10
    // 预览列表搜索参数
    const initPreviewSearchCondition = {
        offset: 1,
        limit: defaultPreivewListSize,
    }
    // 右侧列表
    const [previewSearchCondition, setPreviewSearchCondition] = useState<any>(
        initPreviewSearchCondition,
    )
    // 预览资源的字段详情，Object{id: {total_count, entries}} 其中统一使用entries字段保存字段信息
    const [perviewAllData, setPerviewAllData] = useState<any>({})
    const previewScrollListId = 'previewScrollListId'

    const initDataCatlgSC: ISearchCondition = {
        offset: 1,
        limit: 20,
        orgcode: '',
        keyword: '',
        direction: SortDirection.DESC,
        sort: 'updated_at',
    }

    const initInfoCatlgSC: ISearchCondition = {
        offset: 1,
        limit: 20,
        keyword: '',
        sort_by: {
            fields: ['update_at'],
            direction: 'desc',
        },
    }

    const [searchCondition, setSearchCondition] = useState<ISearchCondition>()
    const searchConditionDebounce = useDebounce(searchCondition, { wait: 100 })
    // 资源列表数据（包括当前目录类型的所有资源+信息目录类型下自动给关联的资源目录列表）
    const [allRescList, setAllRescList] = useState<any[]>([])
    // 当前目录类型下的资源列表
    const [rescList, setRescList] = useState<any[]>([])
    // 自动关联信息资源目录列表
    const [autoRelateRescList, setAutoRelateRescList] = useState<any[]>([])
    // 资源总条数
    const [total, setTotal] = useState(0)
    const [nextFlag, setNextFlag] = useState<string[]>()
    const [fields, setFields] = useState<any[]>([])
    const [fieldsLoading, setFieldsLoading] = useState(false)
    const [loading, setLoading] = useState<boolean>(true)
    // // 目录-预览loading
    // const [columnLoading, setColumnLoading] = useState<boolean>(true)
    // 预览数据加载
    const [previewLoading, setPreviewLoading] = useState<boolean>(true)
    const [initSearch, setInitSearch] = useState<boolean>(true)
    const [visible, setVisible] = useState<boolean>(false) // 是否全部展示

    useEffect(() => {
        setAllRescList([...(rescList || []), ...(autoRelateRescList || [])])
    }, [rescList, autoRelateRescList])

    useEffect(() => {
        if (type === DataRescType.DATA_RESC_CATLG) {
            setSearchCondition(initDataCatlgSC)
        } else if (type === DataRescType.INFO_RESC_CATLG) {
            setSearchCondition(initInfoCatlgSC)
        }
        setCheckedData(
            selRescList?.map((item) => ({
                ...item,
                id: item.value,
                name: item.label,
            })),
        )
    }, [])

    // 拼接查询参数
    const spliceParams = () => {
        if (!searchCondition || isEqual(searchCondition, {})) {
            return undefined
        }
        let searchData: any = {}
        if (type === DataRescType.DATA_RESC_CATLG) {
            if (selectedNode.cate_id === SystemCategory.Organization) {
                searchData = {
                    ...searchCondition,
                    department_id: selectedNode.id,
                    info_system_id: undefined,
                    subject_id: undefined,
                    category_node_id: undefined,
                }
            } else if (
                selectedNode.cate_id === SystemCategory.InformationSystem
            ) {
                searchData = {
                    ...searchCondition,
                    subject_id: undefined,
                    department_id: undefined,
                    category_node_id: undefined,
                    info_system_id: selectedNode.id,
                }
                // } else {
                //     searchData = {
                //         ...searchCondition,
                //         subject_id: selectedNode.id,
                //         department_id: undefined,
                //         info_system_id: undefined,
                //         current: 1,
                //     }
            } else {
                searchData = {
                    ...searchCondition,
                    category_node_id: selectedNode.id,
                    subject_id: undefined,
                    department_id: undefined,
                    info_system_id: undefined,
                }
            }
        } else if (type === DataRescType.INFO_RESC_CATLG) {
            searchData = {
                ...searchCondition,
                cate_info:
                    selectedNode?.id && selectedNode?.cate_id
                        ? {
                              cate_id: selectedNode?.cate_id,
                              node_id: selectedNode?.id,
                          }
                        : undefined,
            }
        }
        return searchData
    }

    // 获取目录列表
    const getCatlgList = async (params: ISearchCondition, isInit?: boolean) => {
        if (!params) return
        try {
            if (params.limit === 1) {
                setLoading(true)
            }
            const { mount_type, ...rest } = params
            const reqParams: any = rest || {}
            if (mount_type) {
                reqParams.mount_type = mount_type
            }
            const isPublishedList = [
                PublishStatus.Published,
                PublishStatus.ChangeAuditing,
                PublishStatus.ChangeReject,
            ]
            const isOnlineList = [
                OnlineStatus.Online,
                OnlineStatus.OfflineAuditing,
                OnlineStatus.OfflineReject,
            ]
            let res: any = {}
            if (type === DataRescType.DATA_RESC_CATLG) {
                res = await getRescCatlgList({
                    online_status: isOnlineList.join(),
                    ...reqParams,
                })
            } else if (type === DataRescType.INFO_RESC_CATLG) {
                res = await getInfoRescCatlgList({
                    ...reqParams,
                    filter: {
                        publish_status: isPublishedList,
                        online_status: isOnlineList,
                    },
                })
                // 去掉当前编辑的信息资源目录
                if (res.entries.find((item) => item.id === catlgId)) {
                    res.entries = res.entries?.filter(
                        (item) => item.id !== catlgId,
                    )
                    res.total_count -= 1
                }
            }

            if (params?.offset === 1) {
                setRescList(res?.entries || [])
            } else {
                setRescList(
                    uniqBy([...rescList, ...(res?.entries || [])], 'id'),
                )
            }

            // 编辑时列表项中去除当前信息目录
            setTotal((res?.total_count || 0) - (catlgId ? 1 : 0))
            // return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            // return { total: 0, list: [] }
        } finally {
            setLoading(false)
            // setSelectedSort(undefined)
            setInitSearch(false)
        }
    }

    // const { listProps, run, pagination } = useAntdTable(getCatlgList, {
    //     defaultPageSize: 10,
    //     manual: true,
    // })

    // 初始化查询
    useEffect(() => {
        const searchData: any = spliceParams()
        if (initSearch) {
            getCatlgList(searchData, initSearch)
        } else {
            setRescList([])
            setSearchCondition({
                ...searchCondition,
                offset: 1,
            })
        }
    }, [selectedNode])

    useUpdateEffect(() => {
        if (!initSearch) {
            const searchData: any = spliceParams()
            if (searchData) {
                getCatlgList(searchData, initSearch)
            }
        }
    }, [searchConditionDebounce])

    useUpdateEffect(() => {
        getColumnInfo(previewSearchCondition)
    }, [previewSearchCondition])

    const getColumnInfo = async (params) => {
        const { catalogId, keyword, current: offset, pageSize: limit } = params

        try {
            setPreviewLoading(true)

            const res: any = await (type === DataRescType.DATA_RESC_CATLG
                ? getRescDirColumnInfo({
                      catalogId,
                      keyword,
                      offset,
                      limit,
                  })
                : queryInfoResCatlgColumns({
                      id: catalogId,
                      keyword,
                      offset,
                      limit,
                  }))
            // 数据目录需要取res.columns ,信息目录需要取res.entries
            setPerviewAllData({
                ...perviewAllData,
                [catalogId]: {
                    total_count: res?.total_count || 0,
                    entries: [
                        ...(perviewAllData?.[catalogId]?.entries || []),
                        ...(res?.columns || res?.entries || []),
                    ],
                },
            })
            // return {
            //     total: res?.total_count || 0,
            //     list: res?.columns || [],
            // }
        } catch (error) {
            formatError(error)
            // return { total: 0, list: [] }
        } finally {
            setPreviewLoading(false)
        }
    }

    const renderFieldListItem = (item: any, index) => {
        const nameCn =
            type === DataRescType.DATA_RESC_CATLG
                ? item.business_name
                : item.name

        const fieldType =
            item?.metadata?.data_type ||
            typeOptoins.find((tItem) => tItem.value === item?.data_type)
                ?.strValue
        return (
            <div key={item.id} className={styles.fieldContWrapper}>
                {getFieldTypeEelment({ type: fieldType }, 16)}

                <div className={styles.fieldNameWrapper}>
                    <div className={styles.nameCn} title={nameCn}>
                        {nameCn}
                    </div>
                    {type === DataRescType.DATA_RESC_CATLG && (
                        <div
                            className={styles.nameEn}
                            title={item.technical_name}
                        >
                            {item.technical_name}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // 预览内容-数据资源目录字段是在列表返回阶段就返回了所有字段，而信息资源目录字段是在预览阶段获取
    const renderPerviewContent = (item) => {
        const catalogId = item.id
        const infoFields = perviewAllData?.[catalogId]?.entries || []
        const total_count = perviewAllData?.[catalogId]?.total_count || 0
        return (
            <div className={styles.perviewContentWrapper}>
                <div className={styles.previewTitle}>{__('预览')}</div>
                <div className={styles.fieldsContentWrapepr}>
                    <div
                        className={styles.listEmpty}
                        hidden={
                            total_count > 0 &&
                            perviewAllData?.[catalogId]?.entries?.length
                        }
                    >
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    </div>
                    <div
                        id={previewScrollListId}
                        className={styles.contentList}
                        hidden={
                            !perviewAllData?.[catalogId]?.entries ||
                            !total_count
                        }
                    >
                        {/* 预览字段列表 */}
                        <InfiniteScroll
                            hasMore={infoFields?.length < total_count}
                            // endMessage={
                            //     infoFields?.length >= defaultPreivewListSize ? (
                            //         <div
                            //             style={{
                            //                 textAlign: 'center',
                            //                 color: 'rgba(0,0,0,0.25)',
                            //                 padding: '8px 0',
                            //                 fontSize: '12px',
                            //                 background: '#fff',
                            //             }}
                            //         >
                            //             {__('已完成全部加载')}
                            //         </div>
                            //     ) : undefined
                            // }
                            loader={
                                <div
                                    className={styles.listLoading}
                                    hidden={!previewLoading}
                                >
                                    <Loader />
                                </div>
                            }
                            next={() => {
                                setPreviewSearchCondition({
                                    ...previewSearchCondition,
                                    offset: previewSearchCondition.offset + 1,
                                    catalogId,
                                })
                            }}
                            dataLength={infoFields?.length || 0}
                            scrollableTarget={previewScrollListId}
                        >
                            <List
                                dataSource={infoFields}
                                renderItem={renderFieldListItem}
                            />
                        </InfiniteScroll>
                        {/* )} */}
                    </div>
                </div>
            </div>
        )
    }

    // useEffect(() => {
    //     // setUpdateSortOrder(
    //     //     initSearchCondition.direction === SortDirection.DESC
    //     //         ? 'descend'
    //     //         : 'ascend',
    //     // )

    //     if (!initSearch) {
    //         setSearchCondition({
    //             ...pagination,
    //             ...searchCondition,
    //             current: initSearchCondition.current,
    //         })
    //     }
    // }, [treeType])

    // const querySelNodeInfo = async (isRestData?: boolean) => {
    //     try {
    //         const { keyword, ...filter } = searchCondition
    //         const params: IDataRescQuery = {
    //             keyword,
    //             filter,
    //             next_flag: isRestData ? undefined : nextFlag,
    //         }
    //         const res = await getDataRescList2(params)
    //         setTotal(res.total_count)
    //         setNextFlag(res.next_flag)
    //         setDataSource(
    //             nextFlag && nextFlag.length > 0 && !isRestData
    //                 ? [...dataSource, ...(res.entries || [])]
    //                 : res.entries || [],
    //         )
    //         if (isRestData) {
    //             setSelectedData(res.entries?.[0])
    //         }
    //     } catch (error) {
    //         formatError(error)
    //     }
    // }

    // const getFields = async () => {
    //     try {
    //         setFieldsLoading(true)
    //         const res = await getDatasheetViewDetails(selectedData.id)
    //         setFields(res.fields || [])
    //     } catch (error) {
    //         formatError(error)
    //     } finally {
    //         setFieldsLoading(false)
    //     }
    // }

    // useEffect(() => {
    //     if (selectedData) {
    //         getFields()
    //     } else {
    //         setFields([])
    //     }
    // }, [selectedData])

    // useEffect(() => {
    //     querySelNodeInfo(true)
    // }, [searchCondition])

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setSelectedNode(sn || allNodeInfo)
    }

    const handleOk = () => {
        // onOK(
        //     checkedData?.map((item) => ({
        //         label: item.name,
        //         value: item.id,
        //     })),
        // )
        onOK(checkedData)
    }

    const handleChecked = (checked: boolean, data) => {
        if (checked) {
            setCheckedData([...checkedData, data])
        } else {
            setCheckedData(checkedData.filter((item) => item.id !== data.id))
        }
    }

    const searchChange = (d, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                ...d,
            })
        } else {
            const dk = dataKey

            setSearchCondition({
                ...(searchCondition || {}),
                [dk]: d[dk],
            })
        }
    }

    const handleDelete = (value) => {
        setCheckedData(checkedData.filter((item) => item.id !== value.id))
    }

    return (
        <Drawer
            title={
                title ||
                `${__('选择')}${
                    type === DataRescType.DATA_RESC_CATLG
                        ? __('数据资源目录')
                        : __('信息资源目录')
                }`
            }
            width={833}
            open={open}
            onClose={onClose}
            bodyStyle={{ padding: 0, overflow: 'hidden' }}
            className={styles.selectRescCatlgWrapper}
            footer={
                <Space className={styles.selectRescCatlgFooter}>
                    <Button onClick={onClose} className={styles.btn}>
                        {__('取消')}
                    </Button>
                    <Tooltip
                        title={
                            !checkedData?.length
                                ? __('请选择${text}后保存', {
                                      text:
                                          type === DataRescType.DATA_RESC_CATLG
                                              ? __('数据资源目录')
                                              : __('信息资源目录'),
                                  })
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            onClick={() => handleOk()}
                            className={styles.btn}
                            style={{ width: 80 }}
                            disabled={!checkedData?.length}
                        >
                            {__('保存')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles.selectRescContent}>
                <span className={styles.selectedCountInfo}>
                    {__('已选（${count}）：', {
                        count: checkedData?.length || '0',
                    })}
                </span>
                <div className={styles.tagContainer}>
                    {checkedData?.length ? (
                        <SelRescTags
                            initValue={checkedData || ''}
                            valueKey="name"
                            onDelete={handleDelete}
                        />
                    ) : (
                        '--'
                    )}
                    {/* <Typography.Paragraph
                        ellipsis={
                            !visible
                                ? {
                                      rows: 5,
                                      expandable: true,
                                      symbol: (
                                          <span
                                              style={{
                                                  visibility: 'hidden',
                                              }}
                                          >
                                              {__('展开全部')}
                                          </span>
                                      ),
                                      onEllipsis: (ell) => setEllipsis(ell),
                                  }
                                : false
                        }
                    >
                        {Array.isArray(getValue('business_system')) &&
                        getValue('business_system').length > 0
                            ? getValue('business_system')?.map((i) => {
                                  return (
                                      <span
                                          className={styles.tag}
                                          key={i.id}
                                          title={i.name}
                                      >
                                          {i.name}
                                      </span>
                                  )
                              })
                            : '--'}
                    </Typography.Paragraph>

                    {visible ? (
                        <Button
                            type="link"
                            onClick={() => setVisible(false)}
                            className={styles.operateBtn}
                        >
                            {__('收起')}
                            <UpOutlined />
                        </Button>
                    ) : (
                        <Button
                            type="link"
                            onClick={() => setVisible(true)}
                            style={{
                                visibility: ellipsis ? 'visible' : 'hidden',
                            }}
                            className={styles.operateBtn}
                        >
                            {__('展开全部')}
                            <DownOutlined />
                        </Button>
                    )} */}
                </div>
            </div>
            <div className={styles.selectRescCatlgContent}>
                <div className={styles.leftContent}>
                    {/* <div className={styles.titleContainer}>
                        <Radio.Group
                            options={viewModeOptions}
                            onChange={(e) => {
                                setViewMode(e.target.value)
                                setNextFlag(undefined)
                            }}
                            value={viewMode}
                            optionType="button"
                            className={styles.viewModeRadioWrapper}
                            style={{ width: 280 }}
                        />
                    </div> */}
                    <div className={styles.treeContainer}>
                        <ResourcesCustomTree
                            onChange={getSelectedNode}
                            needUncategorized
                            wapperStyle={{ height: 'calc(100vh - 146px)' }}
                        />
                    </div>
                </div>
                <div className={styles.rightContent}>
                    {/* <div className={styles.rightTop}> */}
                    <Row>
                        <SearchInput
                            placeholder={__('搜索数据资源目录名称、编码')}
                            value={searchCondition?.keyword}
                            onKeyChange={(keyword: string) => {
                                setSearchCondition({
                                    ...(searchCondition || {}),
                                    offset: 1,
                                    keyword,
                                })
                            }}
                            maxLength={128}
                            style={{ flex: '1', marginRight: 8 }}
                        />
                        {type === DataRescType.DATA_RESC_CATLG && (
                            <LightweightSearch
                                formData={searchFormData}
                                onChange={(data, key) =>
                                    searchChange(data, key)
                                }
                                defaultValue={{ mount_type: '' }}
                                // width="100px"
                                // style={{ flexShrink: '0', width: '100px' }}
                            />
                        )}
                    </Row>
                    {/* </div> */}
                    <div className={styles.listLoading} hidden={!loading}>
                        <Loader />
                    </div>
                    {!allRescList?.length ? (
                        <div className={styles.emptyContainer}>
                            <Empty
                                iconSrc={
                                    searchCondition?.keyword
                                        ? searchEmpty
                                        : dataEmpty
                                }
                                desc={
                                    searchCondition?.keyword
                                        ? __('抱歉，没有找到相关内容')
                                        : __('暂无数据')
                                }
                            />
                        </div>
                    ) : (
                        <div
                            className={styles.viewItems}
                            id={scrollListId}
                            hidden={loading}
                        >
                            <InfiniteScroll
                                hasMore={rescList?.length < total}
                                loader={
                                    <div className={styles.listLoading}>
                                        <Loader />
                                    </div>
                                }
                                next={() => {
                                    // getSelectedNode(false)
                                    const offset = isNumber(
                                        searchCondition?.offset,
                                    )
                                        ? (searchCondition?.offset || 0) + 1
                                        : 1
                                    setSearchCondition({
                                        ...(searchCondition || {}),
                                        offset,
                                    })
                                }}
                                dataLength={rescList?.length || 0}
                                scrollableTarget={scrollListId}
                            >
                                {allRescList.map((item = {}) => {
                                    const isChecked = !!checkedData.find(
                                        (cd) => cd.id === item.id,
                                    )
                                    return (
                                        <div
                                            key={item.id}
                                            className={classNames(
                                                styles.viewItem,
                                                selectedData?.id === item.id &&
                                                    styles.selectedViewItem,
                                                item.is_auto_related &&
                                                    styles.autoRelatedItem,
                                            )}
                                            onClick={() =>
                                                setSelectedData(item)
                                            }
                                        >
                                            <Tooltip
                                                title={
                                                    checkedData.find(
                                                        (cd) =>
                                                            cd.id === item.id,
                                                    )
                                                        ? __('已选')
                                                        : ''
                                                }
                                            >
                                                <Checkbox
                                                    checked={
                                                        !!checkedData.find(
                                                            (cd) =>
                                                                cd.id ===
                                                                item.id,
                                                        )
                                                    }
                                                    disabled={
                                                        item.is_auto_related
                                                    }
                                                    onChange={(e) =>
                                                        handleChecked(
                                                            e.target.checked,
                                                            item,
                                                        )
                                                    }
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                />
                                            </Tooltip>
                                            <div className={styles.viewInfo}>
                                                {getDataRescTypeIcon(
                                                    { type },
                                                    30,
                                                )}
                                                <div
                                                    className={styles.viewNames}
                                                >
                                                    <div
                                                        className={styles.top}
                                                        title={item.name}
                                                    >
                                                        {item.name}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.bottom
                                                        }
                                                        title={item.code}
                                                    >
                                                        {item.code}
                                                    </div>
                                                </div>
                                            </div>
                                            {item.is_auto_related && (
                                                <div
                                                    className={
                                                        styles.autoReleteTag
                                                    }
                                                >
                                                    {__('自动关联')}
                                                </div>
                                            )}
                                            <div className={styles.preivewBtn}>
                                                <Tooltip
                                                    color="white"
                                                    placement="bottomLeft"
                                                    overlayClassName="selRescItemsWrapper"
                                                    title={
                                                        previewLoading ? (
                                                            <div
                                                                className={
                                                                    styles.previewLoading
                                                                }
                                                            >
                                                                <Loader />
                                                            </div>
                                                        ) : (
                                                            renderPerviewContent(
                                                                item,
                                                            )
                                                        )
                                                    }
                                                    arrowPointAtCenter
                                                    // getPopupContainer={(
                                                    //     n,
                                                    // ) => n}
                                                    onOpenChange={(flag) => {
                                                        if (
                                                            flag &&
                                                            !perviewAllData[
                                                                item.id
                                                            ]
                                                        ) {
                                                            setPreviewSearchCondition(
                                                                {
                                                                    ...initPreviewSearchCondition,
                                                                    catalogId:
                                                                        item.id,
                                                                },
                                                            )
                                                        }
                                                    }}
                                                >
                                                    <Button type="link">
                                                        {__('预览')}
                                                    </Button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    )
                                })}
                            </InfiniteScroll>
                        </div>
                    )}
                </div>
            </div>
        </Drawer>
    )
}

export default SelectRescCatlg
