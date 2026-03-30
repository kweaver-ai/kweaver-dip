import { Button, Checkbox, Drawer, List, Space, Tabs, Tooltip } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSize, useUpdateEffect } from 'ahooks'
import InfiniteScroll from 'react-infinite-scroll-component'
import { isNumber } from 'lodash'
import classNames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import {
    FieldTypeIcon,
    formatError,
    getDataCatalogMountFrontend,
    getDatasheetViewDetails,
    HasAccess,
    reqBusinObjList,
    reqBusinObjListForOper,
    reqDataCatlgColumnInfo,
} from '@/core'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { typeOptoins } from '@/components/ResourcesDir/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const scrollListId = 'add-resource-scroll-list-res_id'

interface ICatalog {
    res_id: string
    res_name: string
    res_code: string
    department_name: string
    department_path: string
}

enum TabKey {
    DataCatlog = 'data_view',
    Interface = 'interface_svc',
}
interface AddFieldsFromCatalogProps {
    open: boolean
    onClose: () => void
    initData?: any[]
    onOk?: (data: any[]) => void
}
const AddFieldsFromCatalog = ({
    open,
    onClose,
    initData = [],
    onOk,
}: AddFieldsFromCatalogProps) => {
    const [selectedInfoItems, setSelectedInfoItems] = useState<any[]>([])
    const [categorys, setCategorys] = useState<Array<any>>([])
    const [selectedNode, setSelectedNode] = useState<any>({})
    const selectedResourceRef = useRef<HTMLDivElement>(null)
    const selectedResourceSize = useSize(selectedResourceRef)
    const [filterListCondition, setFilterListCondition] = useState<any>({
        size: 20,
        type: TabKey.DataCatlog,
        is_online: true,
        is_publish: true,
    })
    const [listDataLoading, setListDataLoading] = useState(true)
    const [infoItemsLoading, setInfoItemsLoading] = useState(false)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [isSearch, setIsSearch] = useState<boolean>(false)
    const [roleList, setRoleList] = useState<Array<any>>()
    const [listData, setListData] = useState<Array<ICatalog>>([])
    const [isInit, setIsInit] = useState(true)
    const [searchKeyword, setSearchKeyword] = useState<string>('')
    const [searchInfoItemKeyword, setSearchInfoItemKeyword] =
        useState<string>('')
    const [previewColumns, setPreviewColumns] = useState<any[]>([])
    const [selecedCatalog, setSelecedCatalog] = useState<ICatalog>({
        res_id: '',
        res_name: '',
        res_code: '',
        department_name: '',
        department_path: '',
    })
    const { checking, checkPermission } = useUserPermCtx()
    const hasDataOperRole = useMemo(
        () => checkPermission('manageResourceCatalog') ?? false,
        [checkPermission],
    )

    const showPreviewColumns = useMemo(() => {
        return searchInfoItemKeyword
            ? previewColumns.filter(
                  (item) =>
                      item.name_cn
                          .toLowerCase()
                          .includes(searchInfoItemKeyword.toLowerCase()) ||
                      item.name_en
                          .toLowerCase()
                          .includes(searchInfoItemKeyword.toLowerCase()),
              )
            : previewColumns
    }, [previewColumns, searchInfoItemKeyword])

    useEffect(() => {
        if (!checking) {
            loadEntityList(filterListCondition, '')
        }
    }, [hasDataOperRole, checking])

    useUpdateEffect(() => {
        if (!isInit) {
            loadEntityList(filterListCondition, searchKeyword)
        }
    }, [searchKeyword])

    useEffect(() => {
        const cate_info_req = [
            {
                cate_id: selectedNode?.cate_id || '',
                node_ids: [selectedNode?.id || ''],
            },
        ]
        if (!isInit) {
            loadEntityList(
                {
                    ...filterListCondition,
                    cate_info_req: selectedNode?.id ? cate_info_req : undefined,
                },
                searchKeyword,
            )
        }
    }, [selectedNode])

    const loadEntityList = async (
        params: any,
        keyword: string,
        loadMore?: boolean,
    ) => {
        try {
            const filter = {
                ...params,
                data_resource_type: ['data_view'],
            }
            let reqParams = {
                next_flag: params.next_flag,
                filter,
            }

            // 只有加载更多（加载下一页）的时候才传next_flag
            if (!loadMore) {
                setListDataLoading(true)
                delete reqParams.next_flag
            }
            // let isOwned: boolean = hasDataOperRole || false
            // if (!roleList?.length) {
            //     const roleRres = await getCurUserRoles()
            //     setRoleList(roleRres || [])
            //     isOwned = !!roleRres?.find((r) =>
            //         [
            //             allRoleList.TCDataOperationEngineer,
            //             allRoleList.TCDataGovernEngineer,
            //         ].includes(r.id),
            //     )
            //     setHasDataOperRole(isOwned)
            // }
            const action = hasDataOperRole
                ? reqBusinObjListForOper
                : reqBusinObjList
            const res = await action({
                ...reqParams,
                keyword,
            })

            reqParams = {
                ...reqParams,
                next_flag: res.next_flag || [],
            }
            const entries = Array.isArray(res.entries)
                ? res.entries.map((item) => {
                      return {
                          res_id: item.id,
                          res_code: item.raw_code!,
                          res_name: item.raw_name!,
                          department_name: item?.cate_info?.[0]?.node_name,
                          department_path: item?.cate_info?.[0]?.node_path,
                      }
                  })
                : []
            if (!loadMore) {
                setListData(entries)
            } else {
                const listDataTemp = listData || []
                setListData(listDataTemp?.concat(entries))
            }
            setTotalCount(res.total_count)
            setFilterListCondition(params)
            if (!selecedCatalog.res_id && entries.length > 0) {
                setSelecedCatalog(entries[0])
                handlePreview(entries[0].res_id, entries[0])
            }
        } catch (error) {
            formatError(error)
        } finally {
            if (!loadMore) {
                setListDataLoading(false)
            }
            setIsInit(false)
        }
    }

    // 列表为空
    const showListDataEmpty = () => {
        const desc =
            searchKeyword || isSearch
                ? __('抱歉，没有找到相关内容')
                : __('暂无数据')
        const icon = searchKeyword ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    const handlePreview = async (res_id: string, currentCatalog: ICatalog) => {
        try {
            setInfoItemsLoading(true)
            // 获取信息项
            const res = await reqDataCatlgColumnInfo({
                catalogId: res_id,
                limit: 0,
            })
            // 获取挂接资源
            const mountRes = await getDataCatalogMountFrontend(res_id)

            const viewId = mountRes.mount_resource?.find(
                (r) => r.resource_type === 1,
            )?.resource_id
            let viewRes
            // 库表详情
            if (viewId) {
                viewRes = await getDatasheetViewDetails(viewId)
            }
            setPreviewColumns(
                res.columns.map((item) => ({
                    catalog_id: currentCatalog.res_id,
                    catalog_name: currentCatalog.res_name,
                    catalog_code: currentCatalog.res_code,
                    department_name: currentCatalog.department_name,
                    department_path: currentCatalog.department_path,
                    view_id: viewId,
                    view_code: viewRes.uniform_catalog_code,
                    view_busi_name: viewRes.business_name,
                    view_tech_name: viewRes.technical_name,
                    column_id: item.id,
                    field_id: item.source_id,
                    name_en: item.technical_name,
                    name_cn: item.business_name,
                    data_type: typeOptoins.find(
                        (it) => item.data_type === it.value,
                    )?.strValue!,
                    data_std_code: item.standard_code,
                    data_std_name: item.standard,
                    dict_code: item.code_table_id,
                    dict_name: item.code_table,
                    ranges: item.data_range,
                    data_length: item.data_length,
                    data_accuracy: item.data_precision,
                    is_pk: !!item.primary_flag,
                    // 以下字段当前版本没有
                    rule_code: item.rule_code,
                    rule_name: item.rule_name,
                    is_mandatory: item.is_mandatory,
                    is_increment_field: item.is_increment_field,
                    is_standardized: item.is_standardized,
                    field_rel: __('取值${view}表${field}字段', {
                        view: viewRes.business_name,
                        field: item.technical_name,
                    }),
                })),
            )
        } catch (error) {
            formatError(error)
        } finally {
            setInfoItemsLoading(false)
        }
    }

    const renderListItem = (item) => {
        return (
            <List.Item key={item.res_id} className={styles['list-item']}>
                <div
                    className={classNames(styles['item-container'], {
                        [styles['item-container-active']]:
                            selecedCatalog.res_id === item.res_id,
                    })}
                    onClick={() => {
                        setSelecedCatalog(item)
                        handlePreview(item.res_id, item)
                    }}
                >
                    <FontIcon
                        name="icon-shujumuluguanli1"
                        type={IconType.COLOREDICON}
                        className={styles['item-icon']}
                    />
                    <div className={styles['item-info']}>
                        <div
                            className={styles['item-name']}
                            title={item.res_name}
                        >
                            {item.res_name}
                        </div>
                        <div
                            className={styles['item-code']}
                            title={item.res_code}
                        >
                            {item.res_code}
                        </div>
                    </div>
                </div>
            </List.Item>
        )
    }

    return (
        <Drawer
            title={__('添加字段')}
            width={946}
            open={open}
            onClose={onClose}
            push={false}
            bodyStyle={{ paddingBottom: 0, overflowY: 'hidden' }}
            footer={
                <Space
                    size={8}
                    className={styles['add-resource-drawer-footer']}
                >
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button
                        type="primary"
                        onClick={() => {
                            onOk?.(selectedInfoItems)
                            onClose()
                        }}
                    >
                        {__('确定')}
                    </Button>
                </Space>
            }
        >
            <div className={styles['add-fields-drawer']}>
                <div
                    className={styles['selected-resource']}
                    ref={selectedResourceRef}
                >
                    <div className={styles['selected-resource-label']}>
                        {__('已选（${num}）：', {
                            num: selectedInfoItems.length || '0',
                        })}
                    </div>
                    <div className={styles['selected-resource-items']}>
                        {selectedInfoItems.map((item) => (
                            <div
                                key={item.column_id}
                                className={styles['selected-resource-item']}
                            >
                                <div
                                    className={styles['item-name']}
                                    title={item.name_cn}
                                >
                                    {item.name_cn}
                                </div>
                                <FontIcon
                                    name="icon-yichu"
                                    type={IconType.FONTICON}
                                    className={styles['item-del-icon']}
                                    onClick={() => {
                                        setSelectedInfoItems(
                                            selectedInfoItems.filter(
                                                (i) =>
                                                    i.column_id !==
                                                    item.column_id,
                                            ),
                                        )
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div
                    className={styles['data-catlog-content']}
                    style={{
                        height: `calc(100% - 44px - ${
                            selectedResourceSize?.height || 0
                        }px)`,
                    }}
                >
                    <div className={styles['data-catlog-tree']}>
                        <ResourcesCustomTree
                            getCategorys={setCategorys}
                            onChange={setSelectedNode}
                            needUncategorized
                        />
                    </div>
                    <div className={styles['data-catlog-info']}>
                        <div className={styles['common-title']}>
                            {__('数据资源目录')}
                        </div>
                        <SearchInput
                            placeholder={__('搜索数据资源目录')}
                            onKeyChange={(value) => {
                                setSearchKeyword(value)
                            }}
                            style={{ marginTop: 13, width: 240 }}
                        />
                        <div
                            id={scrollListId}
                            className={styles['list-data-wrapper']}
                        >
                            {isInit && listDataLoading ? (
                                <Loader />
                            ) : !listData?.length ? (
                                <div className={styles.listEmpty}>
                                    {showListDataEmpty()}
                                </div>
                            ) : (
                                <InfiniteScroll
                                    dataLength={listData.length}
                                    next={() => {
                                        loadEntityList(
                                            filterListCondition,
                                            searchKeyword,
                                            true,
                                        )
                                    }}
                                    hasMore={
                                        isNumber(listData?.length) &&
                                        listData?.length < totalCount
                                    }
                                    loader={<Loader />}
                                    scrollableTarget={scrollListId}
                                    endMessage={
                                        listData?.length >= totalCount ? (
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    color: 'rgba(0,0,0,0.25)',
                                                    padding: '8px 0',
                                                    fontSize: '12px',
                                                    background: '#fff',
                                                }}
                                            >
                                                {__('已完成全部加载')}
                                            </div>
                                        ) : undefined
                                    }
                                >
                                    <List
                                        dataSource={listData}
                                        renderItem={(item) =>
                                            renderListItem(item)
                                        }
                                    />
                                </InfiniteScroll>
                            )}
                        </div>
                    </div>
                    <div className={styles['info-items-container']}>
                        <div className={styles['common-title']}>
                            {__('信息项')}
                        </div>
                        <SearchInput
                            placeholder={__('搜索信息项中文/英文名称')}
                            onKeyChange={(value) => {
                                setSearchInfoItemKeyword(value)
                            }}
                            style={{ marginTop: 13, width: 270 }}
                        />
                        <div className={styles['info-items']}>
                            {showPreviewColumns.length > 0 ? (
                                showPreviewColumns.map((p, pIdx) => (
                                    <div
                                        className={styles['field-item']}
                                        key={pIdx}
                                    >
                                        <Checkbox
                                            checked={[
                                                ...selectedInfoItems,
                                                ...initData,
                                            ].some(
                                                (it) =>
                                                    it.column_id ===
                                                    p.column_id,
                                            )}
                                            disabled={initData.find(
                                                (item) =>
                                                    item.column_id ===
                                                    p.column_id,
                                            )}
                                            className={
                                                styles['field-item-checkbox']
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedInfoItems([
                                                        ...selectedInfoItems,
                                                        p,
                                                    ])
                                                } else {
                                                    setSelectedInfoItems(
                                                        selectedInfoItems.filter(
                                                            (i) =>
                                                                i.column_id !==
                                                                p.column_id,
                                                        ),
                                                    )
                                                }
                                            }}
                                        />
                                        {FieldTypeIcon({
                                            dataType: p.data_type,
                                            style: {
                                                color: 'rgba(0,0,0,0.85)',
                                            },
                                        })}
                                        <div
                                            className={styles['name-container']}
                                        >
                                            <div
                                                className={styles['field-name']}
                                                title={p.name_cn}
                                            >
                                                {p.name_cn}
                                            </div>
                                            <div
                                                className={
                                                    styles['field-enname']
                                                }
                                                title={p.name_en}
                                            >
                                                {p.name_en}
                                            </div>
                                        </div>
                                        {initData.find(
                                            (item) =>
                                                item.column_id === p.column_id,
                                        ) && (
                                            <div
                                                className={styles['added-flag']}
                                            >
                                                {__('已添加')}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : infoItemsLoading ? (
                                <Loader />
                            ) : searchInfoItemKeyword ? (
                                <Empty />
                            ) : (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={__('暂无数据')}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default AddFieldsFromCatalog
