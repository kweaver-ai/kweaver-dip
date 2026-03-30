import { Button, Checkbox, Drawer, List, Space, Tabs, Tooltip } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSize, useUpdateEffect } from 'ahooks'
import InfiniteScroll from 'react-infinite-scroll-component'
import { isNumber } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import { IBusinessAssetsFilterQuery } from '@/components/DataAssetsCatlg/helper'
import {
    FieldTypeIcon,
    formatError,
    queryServiceOverviewList,
    reqBusinObjList,
    reqBusinObjListForOper,
    IServiceOverview,
    detailServiceOverview,
    reqDataCatlgColumnInfo,
    HasAccess,
} from '@/core'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { typeOptoins } from '@/components/ResourcesDir/const'
import { ResTypeEnum } from '../helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const scrollListId = 'add-resource-scroll-list-res_id'

enum TabKey {
    DataCatlog = 'data_view',
    Interface = 'interface_svc',
}
interface AddResourceDrawerProps {
    open: boolean
    onClose: () => void
    initData?: any[]
    onOk?: (data: any[]) => void
}
const AddCatalogDrawer = ({
    open,
    onClose,
    initData = [],
    onOk,
}: AddResourceDrawerProps) => {
    const [selectedResource, setSelectedResource] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<TabKey>(TabKey.DataCatlog)
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
    const [totalCount, setTotalCount] = useState<number>(0)
    const [isSearch, setIsSearch] = useState<boolean>(false)
    const [roleList, setRoleList] = useState<Array<any>>()
    const [listData, setListData] = useState<Array<any>>()
    const [isInit, setIsInit] = useState(true)
    const [searchKeyword, setSearchKeyword] = useState<string>('')
    const [interfaceData, setInterfaceData] = useState<any[]>([])
    const [previewParams, setPreviewParams] = useState<any[]>([])
    const [previewColumns, setPreviewColumns] = useState<any[]>([])

    const { checkPermission, checking } = useUserPermCtx()
    const hasDataOperRole = useMemo(
        () => checkPermission('manageResourceCatalog') ?? false,
        [checkPermission],
    )

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
        if (!isInit && activeTab === TabKey.DataCatlog) {
            loadEntityList(
                {
                    ...filterListCondition,
                    cate_info_req: selectedNode?.id ? cate_info_req : undefined,
                },
                searchKeyword,
            )
        }
    }, [selectedNode])

    useEffect(() => {
        if (activeTab === TabKey.Interface) {
            getApi({
                department_id:
                    selectedNode?.id === '00000000-0000-0000-0000-000000000000'
                        ? 'uncategory'
                        : selectedNode?.id,
                service_keyword: searchKeyword,
            })
        }
    }, [activeTab, selectedNode, searchKeyword])

    const getApi = async (params) => {
        const res = await queryServiceOverviewList({
            offset: 1,
            limit: 100,
            // 只查注册接口
            service_type: 'service_register',
            status: 'online',
            ...params,
        })
        setInterfaceData(
            res.entries.map((item) => {
                return {
                    res_type: ResTypeEnum.Api,
                    res_id: item.service_id,
                    res_code: item.service_code,
                    res_name: item.service_name,
                    org_path: item.department.name,
                }
            }),
        )
    }

    const loadEntityList = async (
        params: any,
        keyword: string,
        loadMore?: boolean,
    ) => {
        try {
            const filter = {
                ...params,
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
            const entries =
                res.entries?.map((item) => {
                    return {
                        res_type: ResTypeEnum.Catalog,
                        res_id: item.id,
                        res_code: item.code,
                        res_name: item.raw_name,
                        mount_data_resources: item.mount_data_resources,
                    }
                }) || []
            if (!loadMore) {
                setListData(entries || [])
            } else {
                const listDataTemp = listData || []
                setListData(listDataTemp?.concat(entries || []))
            }
            setTotalCount(res.total_count)
            setFilterListCondition({
                ...params,
                next_flag: res.next_flag || [],
            })
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

    const handlePreview = async (
        isOpen: boolean,
        res_id: string,
        isApi = false,
    ) => {
        if (!isOpen || !res_id) return
        if (isApi) {
            const res = await detailServiceOverview(res_id)
            setPreviewParams(res.service_param.data_table_request_params)
        } else {
            const res = await reqDataCatlgColumnInfo({ catalogId: res_id })
            setPreviewColumns(res.columns)
        }
    }

    const renderListItem = (item, isApi: boolean) => {
        return (
            <List.Item key={item.res_id} className={styles['list-item']}>
                <div className={styles['item-container']}>
                    <Tooltip
                        title={
                            initData.some((i) => i.res_id === item.res_id)
                                ? __('已选')
                                : ''
                        }
                    >
                        <Checkbox
                            disabled={
                                initData.some(
                                    (i) => i.res_id === item.res_id,
                                ) ||
                                (item.mount_data_resources?.length === 1 &&
                                    item.mount_data_resources[0]
                                        .data_resources_type === 'file')
                            }
                            checked={selectedResource.some(
                                (i) => i.res_id === item.res_id,
                            )}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedResource([
                                        ...selectedResource,
                                        item,
                                    ])
                                } else {
                                    setSelectedResource(
                                        selectedResource.filter(
                                            (i) => i.res_id !== item.res_id,
                                        ),
                                    )
                                }
                            }}
                        />
                    </Tooltip>
                    <FontIcon
                        name={
                            isApi
                                ? 'icon-jiekoufuwuguanli'
                                : 'icon-shujumuluguanli1'
                        }
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
                    <Tooltip
                        color="#fff"
                        placement="bottomRight"
                        overlayInnerStyle={{
                            color: '#000',
                            width: 260,
                            height: 260,
                            padding: '20px 16px',
                        }}
                        autoAdjustOverflow
                        onOpenChange={(o) =>
                            handlePreview(o, item.res_id, isApi)
                        }
                        title={
                            <div
                                className={
                                    styles['add-catalog-preview-container']
                                }
                            >
                                <div className={styles['preview-title']}>
                                    {isApi
                                        ? __('预览请求参数')
                                        : __('预览信息项')}
                                </div>
                                <div className={styles['preview-content']}>
                                    {(isApi
                                        ? previewParams
                                        : previewColumns
                                    ).map((p, pIdx) => (
                                        <div
                                            className={styles['field-item']}
                                            key={pIdx}
                                        >
                                            {FieldTypeIcon({
                                                dataType: isApi
                                                    ? p.data_type
                                                    : typeOptoins.find(
                                                          (it) =>
                                                              p.data_type ===
                                                              it.value,
                                                      )?.strValue,
                                                style: {
                                                    color: 'rgba(0,0,0,0.85)',
                                                },
                                            })}
                                            <div
                                                className={
                                                    styles['name-container']
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles['field-name']
                                                    }
                                                    title={
                                                        isApi
                                                            ? p.cn_name
                                                            : p.business_name
                                                    }
                                                >
                                                    {isApi
                                                        ? p.cn_name
                                                        : p.business_name}
                                                </div>
                                                <div
                                                    className={
                                                        styles['field-enname']
                                                    }
                                                    title={
                                                        isApi
                                                            ? p.en_name
                                                            : p.technical_name
                                                    }
                                                >
                                                    {isApi
                                                        ? p.en_name
                                                        : p.technical_name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                    >
                        <Button
                            type="link"
                            className={styles['item-preview-btn']}
                        >
                            {__('预览')}
                        </Button>
                    </Tooltip>
                </div>
            </List.Item>
        )
    }

    return (
        <Drawer
            title={__('添加资源')}
            width={836}
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
                    <Tooltip
                        title={
                            selectedResource.length === 0
                                ? __('请选择资源后保存')
                                : ''
                        }
                    >
                        <Button
                            type="primary"
                            disabled={selectedResource.length === 0}
                            onClick={() => {
                                onOk?.(selectedResource)
                                onClose()
                            }}
                        >
                            {__('保存')}
                        </Button>
                    </Tooltip>
                </Space>
            }
        >
            <div className={styles['add-catalog-drawer']}>
                <div
                    className={styles['selected-resource']}
                    ref={selectedResourceRef}
                >
                    <div className={styles['selected-resource-label']}>
                        {__('已选（${num}）：', {
                            num: selectedResource.length || '0',
                        })}
                    </div>
                    <div className={styles['selected-resource-items']}>
                        {selectedResource.map((item) => (
                            <div
                                key={item.res_id}
                                className={styles['selected-resource-item']}
                            >
                                <div
                                    className={styles['item-name']}
                                    title={item.res_name}
                                >
                                    {item.res_name}
                                </div>
                                <FontIcon
                                    name="icon-yichu"
                                    type={IconType.FONTICON}
                                    className={styles['item-del-icon']}
                                    onClick={() => {
                                        setSelectedResource(
                                            selectedResource.filter(
                                                (i) => i.res_id !== item.res_id,
                                            ),
                                        )
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => {
                        setActiveTab(key as TabKey)
                        setIsInit(true)
                        setSearchKeyword('')
                        setFilterListCondition({
                            ...filterListCondition,
                            type: key,
                        })
                        loadEntityList(
                            {
                                ...filterListCondition,
                                type: key,
                            },
                            '',
                            false,
                        )
                    }}
                    items={[
                        {
                            label: __('数据目录'),
                            key: TabKey.DataCatlog,
                        },
                        {
                            label: __('接口服务'),
                            key: TabKey.Interface,
                        },
                    ]}
                />
                <div
                    className={styles['data-catlog-content']}
                    style={{
                        height: `calc(100% - 62px - 20px - ${
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
                        <SearchInput
                            placeholder={
                                activeTab === TabKey.DataCatlog
                                    ? __('搜索数据资源目录名称、编码')
                                    : __('搜索接口服务名称、编码')
                            }
                            onKeyChange={(value) => {
                                setSearchKeyword(value)
                            }}
                            style={{ width: 430, marginTop: 62 }}
                        />
                        <div
                            id={scrollListId}
                            className={styles['list-data-wrapper']}
                        >
                            {activeTab === TabKey.DataCatlog ? (
                                isInit && listDataLoading ? (
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
                                            dataSource={listData.filter(
                                                (item) =>
                                                    !(
                                                        item
                                                            .mount_data_resources
                                                            ?.length === 1 &&
                                                        item
                                                            .mount_data_resources[0]
                                                            .data_resources_type ===
                                                            'file'
                                                    ),
                                            )}
                                            renderItem={(item) =>
                                                renderListItem(item, false)
                                            }
                                        />
                                    </InfiniteScroll>
                                )
                            ) : interfaceData.length === 0 ? (
                                searchKeyword ? (
                                    <Empty />
                                ) : (
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                )
                            ) : (
                                interfaceData.map((item) =>
                                    renderListItem(item, true),
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default AddCatalogDrawer
