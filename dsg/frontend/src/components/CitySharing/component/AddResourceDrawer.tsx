import {
    Button,
    Checkbox,
    Drawer,
    List,
    Radio,
    Space,
    Tabs,
    Tooltip,
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import InfiniteScroll from 'react-infinite-scroll-component'
import { isNumber } from 'lodash'
import classNames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { FontIcon } from '@/icons'
import ResourcesCustomTree from '@/components/ResourcesDir/ResourcesCustomTree'
import { IBusinessAssetsFilterQuery } from '@/components/DataAssetsCatlg/helper'
import {
    FieldTypeIcon,
    formatError,
    getDataCatalogMountFrontend,
    HasAccess,
    reqBusinObjList,
    reqBusinObjListForOper,
    reqDataCatlgColumnInfo,
} from '@/core'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { ResTypeEnum } from '../helper'
import { typeOptoins } from '@/components/ResourcesDir/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const scrollListId = 'add-resource-scroll-list-id'

enum TabKey {
    DataCatlog = 'dataCatlog',
    Interface = 'interface',
}
interface AddResourceDrawerProps {
    open: boolean
    onClose: () => void
    initData?: any[]
    onOk?: (clg: any, mountedRes: any) => void
}
const AddResourceDrawer = ({
    open,
    onClose,
    initData = [],
    onOk,
}: AddResourceDrawerProps) => {
    const [selectedResource, setSelectedResource] = useState<any>()
    const [categorys, setCategorys] = useState<Array<any>>([])
    const [selectedNode, setSelectedNode] = useState<any>({})
    const [filterListCondition, setFilterListCondition] = useState<any>({
        size: 20,
        is_online: true,
        is_publish: true,
    })
    const [listDataLoading, setListDataLoading] = useState(true)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [roleList, setRoleList] = useState<Array<any>>()
    const [listData, setListData] = useState<Array<any>>()
    const [isInit, setIsInit] = useState(true)
    const [searchKeyword, setSearchKeyword] = useState<string>('')
    const [mountedResource, setMountedResource] = useState<any[]>([])
    const [checkedRes, setCheckedRes] = useState<any>()
    const [mountedResLoading, setMountedResLoading] = useState(false)
    const [previewColumns, setPreviewColumns] = useState<any[]>([])

    const { checking, checkPermission } = useUserPermCtx()
    // 是否拥有管理目录权限
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

    const getMountedResource = async () => {
        try {
            setMountedResLoading(true)
            const res = await getDataCatalogMountFrontend(
                selectedResource.res_id,
            )
            setMountedResource(res.mount_resource || [])
        } catch (error) {
            formatError(error)
        } finally {
            setMountedResLoading(false)
        }
    }

    useEffect(() => {
        if (selectedResource) {
            getMountedResource()
        }
    }, [selectedResource])

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

            const entries = res.entries.map((item) => {
                return {
                    res_type: ResTypeEnum.Catalog,
                    res_id: item.id,
                    res_code: item.code,
                    res_name: item.raw_name,
                }
            })

            if (!loadMore) {
                setListData(entries || [])
                setSelectedResource(entries?.[0])
            } else {
                const listDataTemp = listData || []
                setListData(listDataTemp?.concat(entries || []))
            }
            setTotalCount(res.total_count)
            setFilterListCondition(params)
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
        const desc = searchKeyword
            ? __('抱歉，没有找到相关内容')
            : __('暂无数据')
        const icon = searchKeyword ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    const handlePreview = async (isOpen: boolean, res_id: string) => {
        if (!isOpen || !res_id) return
        const res = await reqDataCatlgColumnInfo({ catalogId: res_id })
        setPreviewColumns(res.columns)
    }

    const renderListItem = (item) => {
        return (
            <List.Item key={item.res_id} className={styles['list-item']}>
                <div
                    className={classNames(styles['item-container'], {
                        [styles['item-container-selected']]:
                            selectedResource?.res_id === item.res_id,
                    })}
                    onClick={() => {
                        setSelectedResource(item)
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
                        onOpenChange={(o) => handlePreview(o, item.res_id)}
                        title={
                            <div
                                className={
                                    styles['add-catalog-preview-container']
                                }
                            >
                                <div className={styles['preview-title']}>
                                    {__('预览信息项')}
                                </div>
                                <div className={styles['preview-content']}>
                                    {previewColumns.map((p, pIdx) => (
                                        <div
                                            className={styles['field-item']}
                                            key={pIdx}
                                        >
                                            {FieldTypeIcon({
                                                dataType: typeOptoins.find(
                                                    (it) =>
                                                        p.data_type ===
                                                        it.value,
                                                )?.strValue!,
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
                                                    title={p.business_name}
                                                >
                                                    {p.business_name}
                                                </div>
                                                <div
                                                    className={
                                                        styles['field-enname']
                                                    }
                                                    title={p.technical_name}
                                                >
                                                    {p.technical_name}
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
            width={1155}
            open={open}
            onClose={onClose}
            push={false}
            bodyStyle={{ paddingTop: 0, paddingBottom: 0, overflowY: 'hidden' }}
            footer={
                <Space
                    size={8}
                    className={styles['add-resource-drawer-footer']}
                >
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button
                        type="primary"
                        onClick={() => {
                            onOk?.(selectedResource, checkedRes)
                            onClose()
                        }}
                    >
                        {__('保存')}
                    </Button>
                </Space>
            }
        >
            <div
                className={classNames(
                    styles['add-resource-drawer'],
                    styles['add-catalog-drawer'],
                )}
            >
                <div className={styles['data-catlog-content']}>
                    <div className={styles['data-catlog-tree']}>
                        <ResourcesCustomTree
                            getCategorys={setCategorys}
                            onChange={setSelectedNode}
                            needUncategorized
                        />
                    </div>
                    <div className={styles['data-catlog-info']}>
                        <SearchInput
                            placeholder={__('搜索数据资源目录名称、编码')}
                            onKeyChange={(value) => {
                                setSearchKeyword(value)
                            }}
                            style={{ width: 380, marginTop: 30 }}
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
                                        renderItem={renderListItem}
                                    />
                                </InfiniteScroll>
                            )}
                        </div>
                    </div>
                    <div className={styles['mounted-resource']}>
                        {mountedResLoading ? (
                            <Loader />
                        ) : (
                            <>
                                <div
                                    className={styles['mounted-resource-title']}
                                >
                                    {__('挂接的数据资源')}
                                </div>
                                {mountedResource.map((mr) => {
                                    return (
                                        <div
                                            className={classNames(
                                                styles[
                                                    'resource-item-container'
                                                ],
                                                checkedRes?.resource_id ===
                                                    mr.resource_id &&
                                                    styles[
                                                        'selected-resource-item-container'
                                                    ],
                                            )}
                                            key={mr.resource_id}
                                        >
                                            <Radio
                                                checked={
                                                    checkedRes?.resource_id ===
                                                    mr.resource_id
                                                }
                                                onChange={() => {
                                                    setCheckedRes(mr)
                                                }}
                                            />
                                            <FontIcon
                                                name={
                                                    mr.resource_type === 1
                                                        ? 'icon-shitusuanzi'
                                                        : 'icon-jiekoufuwuguanli'
                                                }
                                                type={IconType.COLOREDICON}
                                                className={styles['item-icon']}
                                            />
                                            <div
                                                className={styles['item-info']}
                                            >
                                                <div
                                                    className={
                                                        styles['item-name']
                                                    }
                                                    title={mr.name}
                                                >
                                                    {mr.name}
                                                </div>
                                                <div
                                                    className={
                                                        styles['item-code']
                                                    }
                                                    title={mr.code}
                                                >
                                                    {mr.code}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default AddResourceDrawer
