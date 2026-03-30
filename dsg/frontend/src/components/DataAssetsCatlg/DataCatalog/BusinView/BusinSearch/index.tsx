import { useDebounce, useUpdateEffect } from 'ahooks'
import { AutoComplete, TabsProps, Divider, Space } from 'antd'
import { memo, useMemo, useRef, useState } from 'react'
import { isArray, uniqBy } from 'lodash'
import classnames from 'classnames'
import { Loader, SearchInput } from '@/ui'
import styles from './styles.module.less'
import __ from './locale'
import {
    BusinessView,
    BusinNodeIcon,
    BusinNodeType,
    NodeTypeText,
} from '../nodes/helper'
import {
    formatError,
    IqueryInfoResCatlgListParams,
    queryInfoResCatlgList,
    queryInfoResCatlgListFrontend,
    RelatedFieldType,
} from '@/core'
import {
    businViewResFieldToNodeTypeMap,
    businViewResTypeFields,
    businViewSearchFieldsType,
} from '../helper'
import { useBusinViewContext } from '../BusinViewProvider'
import { useRescProviderContext } from '@/components/DataAssetsCatlg/RescProvider'
import { defaultListSize } from '@/components/DataAssetsCatlg/InfoResourcesCatlg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

type IBusinSearch = {
    businView: BusinessView
    onSelect?: (item: any) => void
}

function BusinSearch({ businView, onSelect }: IBusinSearch) {
    const { checkPermission } = useUserPermCtx()
    const { catlgView } = useRescProviderContext()
    const {
        currentNodeData,
        setCurrentNodeData,
        businView: provBusinView,
    } = useBusinViewContext()

    const [loading, setLoading] = useState<boolean>(false)
    const [searchCondition, setSearchCondition] = useState<
        Partial<IqueryInfoResCatlgListParams>
    >({
        keyword: '',
        fields: businViewSearchFieldsType[businView],
    })

    const [results, setResults] = useState<any[]>([])
    const [searchKey, setSearchKey] = useState<string>('')
    const debounceValue = useDebounce(searchKey, { wait: 500 })
    const isSearchRef = useRef<any>(false)
    const selectRef = useRef<any>(false)

    // 选中节点
    const [selNode, setSelNode] = useState<any>(null)

    const defaultAllKey = 'all'
    const [open, setOpen] = useState<boolean>(false)
    const [tabKey, setTabKey] = useState<string>(defaultAllKey)

    const items: TabsProps['items'] = useMemo(() => {
        setOpen(false)
        setResults([])
        setSearchCondition({
            keyword: '',
            fields: businViewSearchFieldsType[businView],
        })
        setTabKey(defaultAllKey)
        setSearchKey('')
        const tabItems = [
            {
                key: defaultAllKey,
                label: '全部',
            },
            {
                key: RelatedFieldType.DataCatlgName,
                label: '数据目录',
            },
            {
                key: RelatedFieldType.InfoCatlgName,
                label: '信息目录',
            },
            {
                key: RelatedFieldType.BusinModelName,
                label: '业务模型',
            },
            {
                key: RelatedFieldType.MainBusinName,
                label: '主干业务',
            },
        ]
        if (businView === BusinessView.Organization) {
            return [
                ...tabItems,
                {
                    key: RelatedFieldType.DepartmentName,
                    label: '组织机构',
                },
            ]
        }
        return [
            ...tabItems,
            {
                key: RelatedFieldType.BusinDomainName,
                label: '业务领域',
            },
        ]
    }, [businView])

    useUpdateEffect(() => {
        loadAllInfoCatlgList(searchCondition)
    }, [searchCondition])

    const hasDataOperRole = useMemo(() => {
        return checkPermission('manageResourceCatalog') ?? false
    }, [checkPermission])

    const reqAction = useMemo(() => {
        return hasDataOperRole
            ? queryInfoResCatlgList
            : queryInfoResCatlgListFrontend
    }, [hasDataOperRole])

    // 获取所有信息资源目录
    const loadAllInfoCatlgList = async (params?: any) => {
        try {
            setLoading(true)
            let reqParams: any = params
            const { fields = [], keyword } = params || {}
            let allInfoCatlgData: any[] = []
            let res: any
            if (!keyword) return

            do {
                // eslint-disable-next-line no-await-in-loop
                res = await reqAction(reqParams)

                if (res.entries && res.entries.length > 0) {
                    allInfoCatlgData = allInfoCatlgData.concat(res.entries)
                    // 假设接口通过 next_flag 控制分页，实际按接口调整
                    reqParams = { ...reqParams, next_flag: res.next_flag }
                }
            } while ((res?.entries?.length || 0) > defaultListSize)

            const resTemp: any[] = []
            // 接口返回数据中两种渲染节点的通用字段类型
            const curKeywordLowerCase = keyword?.toLocaleLowerCase()
            allInfoCatlgData.forEach((item) => {
                const pathName: string[] = []

                // 其他层级数据，如部门、主干业务、业务模型等
                businViewResTypeFields[businView].forEach((fKey) => {
                    // 筛选字段不包含当前层级类型，不渲染
                    if (
                        !fields.includes(fKey) &&
                        !fields?.includes(`${fKey}.name`)
                    )
                        return
                    if (isArray(item[fKey])) {
                        item[fKey]
                            .filter((dItem) => dItem.name)
                            ?.forEach((fItem) => {
                                pathName.push(fItem.name)

                                if (
                                    !fItem.name
                                        ?.toLocaleLowerCase()
                                        .includes(curKeywordLowerCase)
                                )
                                    return
                                resTemp.push({
                                    ...fItem,
                                    path_name: pathName,
                                    type: businViewResFieldToNodeTypeMap[fKey],
                                })
                            })
                    } else if (fKey === 'name') {
                        // 信息资源目录单独处理
                        pathName.push(item.raw_name)
                        // 是否有符合搜索的标签
                        const includesTag = !!item?.label_list_resp?.find((o) =>
                            o?.name
                                ?.toLocaleLowerCase()
                                ?.includes(curKeywordLowerCase),
                        )?.id
                        if (
                            !item.raw_name
                                ?.toLocaleLowerCase()
                                .includes(curKeywordLowerCase) &&
                            !includesTag
                        )
                            return

                        resTemp.push({
                            ...item,
                            id: item.id,
                            name: item.raw_name,
                            path_name: pathName,
                            type: BusinNodeType.InfoResourcesCatlg,
                        })
                    } else if (item[fKey]?.name) {
                        pathName.push(item[fKey].name)

                        if (
                            !item[fKey]?.name
                                ?.toLocaleLowerCase()
                                .includes(curKeywordLowerCase)
                        )
                            return

                        resTemp.push({
                            id: item[fKey].id,
                            name: item[fKey].name,
                            path_name: pathName,
                            type: businViewResFieldToNodeTypeMap[fKey],
                            label_list_resp: item.label_list_resp,
                        })
                    }
                })
            })
            setResults(uniqBy(resTemp, 'id'))
            setOpen(!!params.keyword)
        } catch (e) {
            formatError(e)
            setOpen(false)
        } finally {
            setLoading(false)
        }
    }

    const dropdownRender = () => {
        return (
            <div className={styles.resultWrapper}>
                {loading ? (
                    <Loader />
                ) : results?.length ||
                  (searchCondition.keyword && tabKey !== defaultAllKey) ? (
                    <>
                        <div className={styles.resultTop}>
                            <div className={styles.resultTitle}>
                                {__('搜索结果（${text}）', {
                                    text:
                                        results?.length > 99
                                            ? '99+'
                                            : results?.length?.toString(),
                                })}
                            </div>
                            <div
                                className={styles.foldLink}
                                onClick={() => {
                                    setOpen(false)
                                }}
                            >
                                {__('收起')}
                            </div>
                        </div>
                        <div className={styles.tabLinks}>
                            <Space
                                split={
                                    <Divider
                                        type="vertical"
                                        className={styles.divider}
                                    />
                                }
                                size={6}
                            >
                                {items.map((item) => (
                                    <div
                                        className={classnames({
                                            [styles.typeItem]: true,
                                            [styles.typeItemActive]:
                                                tabKey === item.key,
                                        })}
                                        key={item.key}
                                        onClick={() => {
                                            setTabKey(item.key)
                                            if (item.key === defaultAllKey) {
                                                setSearchCondition({
                                                    ...searchCondition,
                                                    fields: businViewSearchFieldsType[
                                                        businView
                                                    ],
                                                })
                                            } else {
                                                setSearchCondition({
                                                    ...searchCondition,
                                                    fields: [
                                                        item.key as RelatedFieldType,
                                                    ],
                                                })
                                            }
                                        }}
                                    >
                                        {item.label}
                                    </div>
                                ))}
                            </Space>
                        </div>
                        <div className={styles.resultItemList}>
                            {results?.length ? (
                                results.map((item) => (
                                    <div
                                        key={item.id}
                                        className={classnames({
                                            [styles.resultItem]: true,
                                            [styles.resultItemActive]:
                                                selNode?.id === item.id,
                                        })}
                                        onClick={() => {
                                            setSelNode(item)
                                            setCurrentNodeData(item)
                                            onSelect?.(item)
                                        }}
                                    >
                                        <BusinNodeIcon type={item.type} />
                                        <div
                                            className={styles.resultItemWrapper}
                                        >
                                            <div
                                                className={
                                                    styles.resultItemTitle
                                                }
                                                title={item.name}
                                                // dangerouslySetInnerHTML={{
                                                //     __html: item.name || '--',
                                                // }}
                                            >
                                                {item.name || '--'}
                                            </div>
                                            {/* <div className={styles.resultItemTitle}>
                                                {item.raw_name || '--'}
                                            </div> */}
                                            <div
                                                className={
                                                    styles.resultItemInfo
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.itemTypeName
                                                    }
                                                >
                                                    {NodeTypeText[item.type]}
                                                </div>
                                                <Divider
                                                    type="vertical"
                                                    className={styles.divider}
                                                />
                                                <div
                                                    className={
                                                        styles.itemPathName
                                                    }
                                                    title={item.path_name?.join(
                                                        '/',
                                                    )}
                                                >
                                                    {__('路径：')}
                                                    {item.path_name?.join(
                                                        '/',
                                                    ) || '--'}
                                                </div>
                                            </div>
                                            {item.type ===
                                                BusinNodeType.InfoResourcesCatlg &&
                                                item.label_list_resp?.length >
                                                    0 && (
                                                    <div
                                                        className={
                                                            styles.resultItemInfo
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles.itemPathName
                                                            }
                                                            title={
                                                                item.label_list_resp
                                                                    ?.map(
                                                                        (o) =>
                                                                            o.name,
                                                                    )
                                                                    ?.join(
                                                                        '、',
                                                                    ) || ''
                                                            }
                                                        >
                                                            {__('标签：')}
                                                            {item.label_list_resp
                                                                ?.map(
                                                                    (o) =>
                                                                        o.name,
                                                                )
                                                                ?.join('、') ||
                                                                '--'}
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className={styles.noData}>
                                    {__('暂无数据')}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className={styles.noData}>{__('暂无数据')}</div>
                )}
            </div>
        )
    }

    const handleCompositionStart = () => {
        isSearchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        isSearchRef.current = false
    }

    return (
        <AutoComplete
            dropdownRender={dropdownRender}
            style={{ width: '380px' }}
            ref={selectRef}
            maxLength={255}
            value={searchKey}
            popupClassName={styles['search-select']}
            notFoundContent={
                searchKey && (
                    <div className={styles['search-empty']}>
                        {__('暂无数据')}
                    </div>
                )
            }
            open={open}
            onFocus={() => {
                setOpen(true)
            }}
            // onDropdownVisibleChange={(expand) => {
            //     if (searchKey) {
            //         setOpen(true)
            //     } else {
            //         setOpen(false)
            //     }
            // }}
            getPopupContainer={(n) => n?.parentNode || n}
        >
            <SearchInput
                title={
                    businView === BusinessView.Organization
                        ? __('搜索目录名称、业务模型、主干业务、组织机构、标签')
                        : __('搜索目录名称、业务模型、主干业务、业务领域、标签')
                }
                placeholder={
                    businView === BusinessView.Organization
                        ? __('搜索目录名称、业务模型、主干业务、组织机构、标签')
                        : __('搜索目录名称、业务模型、主干业务、业务领域、标签')
                }
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onKeyChange={(key) => {
                    // if (!isSearchRef.current) {
                    if (!key) {
                        setOpen(false)
                        setTabKey(defaultAllKey)
                        setResults([])
                        setSearchCondition((pre) => ({
                            ...pre,
                            fields: businViewSearchFieldsType[businView],
                        }))
                    }
                    setSearchKey(key)
                    setSearchCondition((pre) => ({
                        ...pre,
                        keyword: key,
                    }))
                    // }
                }}
                onPressEnter={(e) => e.stopPropagation()}
            />
        </AutoComplete>
    )
}
export default memo(BusinSearch)
