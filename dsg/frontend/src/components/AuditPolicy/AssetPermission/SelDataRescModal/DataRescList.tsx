import React, { memo, useEffect, useState, useContext, useMemo } from 'react'
import {
    Tabs,
    List,
    Button,
    Pagination,
    Checkbox,
    Tooltip,
    message,
} from 'antd'
import { useDebounce, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import _, { uniqBy } from 'lodash'
import {
    OnlineStatus,
    formatError,
    getDataRescListByOper,
    getDatasheetView,
    getIndictorList,
    queryServiceOverviewList,
    PolicyDataRescType,
    checkRescItemsHavePermission,
    PublishStatus,
} from '@/core'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import {
    ListDefaultPageSize,
    ListPageSizerOptions,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import {
    DsType,
    LogicViewPublishState,
    defaultMenu,
} from '@/components/DatasheetView/const'
import {
    handleRescPolicyError,
    policyRescTypeToDataRescType,
    rescTypeList,
} from '../helper'
import { IndicatorTypes } from '@/components/IndicatorManage/const'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { RescCatlgType } from '@/components/ResourcesDir/const'
import { unCategorizedKey } from './helper'

const ListItem = ({
    item,
    isBind,
    isRemove,
    checked,
    onChecked,
    handleClickDetail,
}: // curPolicyRescList,
// otherPolicyRescLists,
{
    item: any
    isRemove?: boolean
    isBind?: boolean
    checked: boolean
    onChecked: (checked) => void
    handleClickDetail: (item) => void
    // curPolicyRescList: []
    // otherPolicyRescLists: []
}) => {
    const isExist = (item.hasAuditPolicy && !isRemove) || isBind
    return (
        <div
            className={classnames({
                [styles['lv-item']]: true,
                [styles['is-checked']]: checked,
                [styles['is-disabled']]: isExist,
            })}
            onClick={() => !isExist && onChecked(!checked)}
        >
            <Tooltip
                placement="top"
                title={
                    isExist
                        ? __('不能重复选择资源（已存在于当前策略或其他策略）')
                        : ''
                }
                overlayStyle={{ maxWidth: 'unset' }}
            >
                <Checkbox
                    checked={isExist ? true : checked}
                    disabled={isExist}
                    onChange={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        onChecked(e.target.checked)
                    }}
                />
            </Tooltip>
            <div className={styles.icon}>
                {getDataRescTypeIcon(
                    {
                        type: policyRescTypeToDataRescType[item.type],
                        indicator_type: item.sub_type,
                    },
                    20,
                )}
            </div>
            <div className={styles.title}>
                <div title={`${item?.name}`} className={styles['title-name']}>
                    {`${item?.name}`}
                </div>
                <div className={styles['title-other-info']}>
                    <div>
                        {__('编码')}: {item?.uniform_catalog_code}
                    </div>
                    <div>
                        {__('类型')}:{' '}
                        {rescTypeList?.find(
                            (tItem) => item.type === tItem.value,
                        )?.label || '--'}
                    </div>
                    <div className={styles['title-other-info-item']}>
                        {item.type === PolicyDataRescType.LOGICALVIEW && (
                            <>
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                {__('技术名称')}: {item?.technical_name}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.oprWrapper}>
                <Button type="link" onClick={() => handleClickDetail(item)}>
                    {__('详情')}
                </Button>
            </div>
        </div>
    )
}

const DataRescList = (props: any) => {
    const {
        viewKey,
        selectedNode,
        checkItems,
        bindItems,
        setCheckItems,
        removeIds,
        handleClickDetail,
        onTabChange,
    } = props

    const [{ using }] = useGeneralConfig()

    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [listData, setListData] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [tabActiveKey, setTabActiveKey] = useState<PolicyDataRescType>(
        PolicyDataRescType.LOGICALVIEW,
    )
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: ListDefaultPageSize[ListType.WideList],
        offset: 1,
        keyword,
        // filter: {
        //     is_publish: true,
        //     is_online: true,
        //     type: tabActiveKey,
        // },
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 200 })

    // 所选项id集合
    const checkedIdList: Array<string> = useMemo(
        () => checkItems?.map((item) => item.id) || [],
        [checkItems],
    )

    const bindItemsIds = useMemo(
        () => bindItems?.map((item) => item.id) || [],
        [bindItems],
    )

    // 当前列表所有可选id
    const curListItemOptionalIds = useMemo(
        () =>
            listData
                ?.filter(
                    (item) =>
                        !item.hasAuditPolicy && !removeIds?.includes(item.id),
                )
                ?.filter((item) => !bindItemsIds?.includes(item.id))
                ?.map((item) => item.id) || [],
        [listData, bindItemsIds, removeIds],
    )
    // 全选状态
    const checkAll = useMemo(() => {
        // 当前展示列表中不在已选项的ids集合
        const curListNotCheckedIds = curListItemOptionalIds?.filter(
            (id) => !checkedIdList.includes(id),
        )
        // 未选选项不存在
        return (
            curListItemOptionalIds?.length > 0 &&
            curListNotCheckedIds?.length === 0
        )
    }, [checkedIdList, curListItemOptionalIds])
    // 是否全选当前页
    const indeterminate = useMemo(() => {
        if (!checkItems?.length) return false
        // const checkItemIds = checkedIdList?.filter(())
        // listData.forEach((cItem) => {
        //     checkItemIds = checkItemIds.filter((id) => id !== cItem?.id)
        // })
        // 当前展示列表中不在已选项的ids集合
        const curListNotCheckedIds = curListItemOptionalIds?.filter(
            (id) => !checkedIdList.includes(id),
        )
        return (
            curListNotCheckedIds?.length > 0 &&
            curListNotCheckedIds?.length < listData?.length
        )
    }, [listData, checkItems])

    // const { data: contextData } = useContext(CustomViewContext)
    // const { dataViewLists } = contextData.toJS()

    useEffect(() => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
        })
    }, [selectedNode])

    useEffect(() => {
        getListData({ ...searchCondition })
    }, [searchDebounce])

    // useUpdateEffect(() => {
    //     if (keyword === searchCondition.keyword) return
    //     setSearchCondition((prev) => ({
    //         ...prev,
    //         keyword,
    //         offset: 1,
    //     }))
    // }, [keyword])

    const getListData = async (params) => {
        try {
            setLoading(true)
            const reqParams = { ...params }
            let req
            let res
            let dataListTemp: any[] = []
            let total_count = 0
            const { id: nodeId } = selectedNode || {}
            // 资源版展示已上线资源；（cs 配置）目录版展示已发布资源
            if (tabActiveKey === PolicyDataRescType.LOGICALVIEW) {
                if (using === 1) {
                    reqParams.publish_status = LogicViewPublishState.Published
                } else {
                    reqParams.online_status_list = [
                        OnlineStatus.ONLINE,
                        OnlineStatus.DOWN_AUDITING,
                        OnlineStatus.DOWN_REJECT,
                    ].join()
                }
                if (viewKey === RescCatlgType.DOAMIN) {
                    reqParams.subject_id =
                        nodeId === unCategorizedKey
                            ? '00000000-0000-0000-0000-000000000000'
                            : nodeId
                } else if (viewKey === RescCatlgType.ORGSTRUC) {
                    reqParams.department_id =
                        nodeId === unCategorizedKey
                            ? '00000000-0000-0000-0000-000000000000'
                            : nodeId
                }
                res = await getDatasheetView({
                    ...reqParams,
                    include_sub_subject: true,
                })
                total_count = res?.total_count
                dataListTemp =
                    res?.entries?.map((item) => {
                        return {
                            id: item.id,
                            type: tabActiveKey,
                            name: item.business_name,
                            technical_name: item.technical_name,
                            // 编码
                            uniform_catalog_code: item.uniform_catalog_code,
                            department: item.department,
                            department_path: item.department_path,
                            subject: item.subject,
                            subject_path: item.subject_path,
                        }
                    }) || []
                // 已上线资源
                reqParams.online_status_list = OnlineStatus.ONLINE
            } else if (tabActiveKey === PolicyDataRescType.INDICATOR) {
                // 指标无上线状态，获取所有
                if (viewKey === RescCatlgType.DOAMIN) {
                    if (nodeId) {
                        reqParams.subject_id =
                            nodeId === unCategorizedKey ? '' : nodeId
                    }
                } else if (viewKey === RescCatlgType.ORGSTRUC) {
                    if (nodeId) {
                        reqParams.management_department_id =
                            nodeId === unCategorizedKey ? '' : nodeId
                    }
                }
                res = await getIndictorList(reqParams)
                total_count = res?.count
                dataListTemp =
                    res?.entries?.map((item) => {
                        return {
                            id: item.id,
                            type: tabActiveKey,
                            sub_type: item.indicator_type,
                            name: item.name,
                            // 编码
                            uniform_catalog_code: item.uniform_catalog_code,
                            // department: item.management_department_name,
                            // subject_path: item.subject_domain_path,
                        }
                    }) || []
            } else if (tabActiveKey === PolicyDataRescType.INTERFACE) {
                // 接口后台接口不支持上线状态传两个值
                if (viewKey === RescCatlgType.DOAMIN) {
                    reqParams.subject_domain_id = nodeId
                } else if (viewKey === RescCatlgType.ORGSTRUC) {
                    reqParams.department_id = nodeId
                }
                res = await queryServiceOverviewList({
                    ...reqParams,
                    publish_and_online_status:
                        using === 1
                            ? [
                                  PublishStatus.PUBLISHED,
                                  PublishStatus.CHANGE_REJECT,
                                  PublishStatus.CHANGE_AUDITING,
                              ]
                            : [
                                  OnlineStatus.ONLINE,
                                  OnlineStatus.DOWN_REJECT,
                                  OnlineStatus.DOWN_AUDITING,
                              ].join(),
                })
                total_count = res?.total_count
                dataListTemp =
                    res?.entries?.map((item) => {
                        return {
                            id: item.service_id,
                            type: tabActiveKey,
                            name: item.service_name,
                            // 编码
                            uniform_catalog_code: item.service_code,
                            // department: item.department,
                            // subject_path: item.subject_path,
                        }
                    }) || []
            }
            const listDataIds = dataListTemp?.map((item) => item.id) || []
            if (listDataIds?.length) {
                // 查询资源是否有审核策略
                const auditPolicyRes = await checkRescItemsHavePermission(
                    listDataIds,
                )
                // 内置策略是否设置
                const buildInAuditPolicy = {
                    [PolicyDataRescType.LOGICALVIEW]:
                        auditPolicyRes.data_view_has_built_in_audit,
                    [PolicyDataRescType.INDICATOR]:
                        auditPolicyRes.indicator_has_built_in_audit,
                    [PolicyDataRescType.INTERFACE]:
                        auditPolicyRes.interface_svc_has_built_in_audit,
                }
                // 自定义策略是否设置
                const customAuditPolicy = {
                    [PolicyDataRescType.LOGICALVIEW]:
                        auditPolicyRes.data_view_has_customize_audit,
                    [PolicyDataRescType.INDICATOR]:
                        auditPolicyRes.indicator_has_customize_audit,
                    [PolicyDataRescType.INTERFACE]:
                        auditPolicyRes.interface_svc_has_customize_audit,
                }
                setListData(
                    dataListTemp?.map((item: any) => {
                        const { type } = item
                        return {
                            ...item,
                            type: tabActiveKey,
                            // 是否设置了启用内置策略
                            hasInnerEnablePolicy: buildInAuditPolicy[type],
                            // 是否同类型资源有启用策略
                            hasCustomEnablePolicy: customAuditPolicy[type],
                            // 是否设置了策略（不管策略是否启用）
                            hasAuditPolicy: auditPolicyRes?.resources?.find(
                                (rItem) => rItem.id === item.id,
                            ),
                        }
                    }),
                )
            } else {
                setListData(dataListTemp)
            }

            setTotal(total_count || 0)
        } catch (e) {
            formatError(e)
            setListData([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    // 空库表
    const renderEmpty = () => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword) {
            return (
                <div className={styles.emptyWrapper}>
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                </div>
            )
        }
        // if (total === 0 && searchCondition.keyword) {
        //     return (
        //         <div className={styles.emptyWrapper}>
        //             <Empty />
        //         </div>
        //     )
        // }
        return (
            <div className={styles.emptyWrapper}>
                <Empty />
            </div>
        )
    }

    const handleChangeCheckbox = (checked, curr) => {
        const currItem = {
            ...curr,
        }
        let newCheckItems: any = []
        if (checked) {
            const tmp = [...checkItems, currItem]
            newCheckItems = tmp.reduce((acc, current: any) => {
                const exists = acc.some((item: any) => item.id === current.id)
                if (!exists) {
                    return [...acc, current]
                }
                return acc
            }, [])
        } else {
            newCheckItems = checkItems.filter(
                (checkItem) => checkItem.id !== currItem.id,
            )
        }

        setCheckItems(uniqBy(newCheckItems, 'id'))
        // setCheckItems(
        //     newCheckItems?.map((item) => {
        //         // 指标特殊处理
        //         if (IndicatorTypes[item.type]) {
        //             return {
        //                 ...item,
        //                 type: PolicyDataRescType.INDICATOR,
        //                 sub_type: item.type,
        //             }
        //         }
        //         return item
        //     }),
        // )
    }

    return (
        <div className={styles['lv-list']}>
            <Tabs
                activeKey={tabActiveKey}
                onChange={(e) => {
                    setTabActiveKey(e as PolicyDataRescType)
                    setSearchCondition((prev) => ({
                        ...prev,
                        keyword: '',
                        // filter: {
                        //     ...prev.filter,
                        //     type: e,
                        // },
                        offset: 1,
                    }))
                }}
                getPopupContainer={(node) => node}
                tabBarGutter={32}
                items={rescTypeList}
                destroyInactiveTabPane
                className={styles.contentTab}
            />

            <div className={styles['lv-list-bottom']}>
                <div className={styles['lv-list-bottom-content']}>
                    {total === 0 && !searchDebounce.keyword ? (
                        renderEmpty()
                    ) : (
                        <>
                            <SearchInput
                                style={{ width: 704 }}
                                placeholder={__('搜索资源名称、编码')}
                                value={searchCondition?.keyword}
                                onKeyChange={(kw: string) => {
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: 1,
                                        keyword: kw,
                                    }))
                                    // setKeyword(kw)
                                }}
                                onPressEnter={(e: any) =>
                                    setSearchCondition((prev) => ({
                                        ...prev,
                                        offset: 1,
                                        keyword: e.target.value,
                                    }))
                                }
                            />

                            {!!listData?.length && (
                                <Checkbox
                                    indeterminate={indeterminate}
                                    onChange={(e) => {
                                        // 全选
                                        if (e.target.checked) {
                                            setCheckItems((prev) => {
                                                return uniqBy(
                                                    [
                                                        ...(prev || []),
                                                        ...(listData?.filter(
                                                            (item) =>
                                                                !item.hasAuditPolicy,
                                                        ) || []),
                                                    ],
                                                    'id',
                                                )
                                            })
                                        } else {
                                            // 取消全选
                                            setCheckItems((prev) => {
                                                return uniqBy(
                                                    prev.filter((id) =>
                                                        curListItemOptionalIds.includes(
                                                            id,
                                                        ),
                                                    ),
                                                    'id',
                                                )
                                            })
                                        }
                                    }}
                                    checked={checkAll}
                                    style={{ margin: '16px 0 8px 20px' }}
                                >
                                    <span
                                        style={{
                                            marginLeft: '8px',
                                        }}
                                    >
                                        {__('全选')}
                                    </span>
                                </Checkbox>
                            )}
                            {total > 0 || !!searchDebounce.keyword ? (
                                <List
                                    split={false}
                                    dataSource={listData}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <ListItem
                                                item={item}
                                                isBind={bindItemsIds?.includes(
                                                    item.id,
                                                )}
                                                isRemove={removeIds?.includes(
                                                    item.id,
                                                )}
                                                onChecked={(val) =>
                                                    handleChangeCheckbox(
                                                        val,
                                                        item,
                                                    )
                                                }
                                                checked={
                                                    !!_.find(
                                                        checkItems,
                                                        (o) => {
                                                            return (
                                                                o.id === item.id
                                                            )
                                                        },
                                                    )
                                                }
                                                handleClickDetail={(_item) =>
                                                    handleClickDetail(_item)
                                                }
                                            />
                                        </List.Item>
                                    )}
                                    className={styles.listWrapper}
                                    loading={loading}
                                    locale={{
                                        emptyText: (
                                            <div style={{ marginTop: 56 }}>
                                                {renderEmpty()}
                                            </div>
                                        ),
                                    }}
                                />
                            ) : (
                                renderEmpty()
                            )}
                        </>
                    )}
                </div>
                <Pagination
                    current={searchCondition.offset}
                    pageSize={searchCondition.limit}
                    onChange={(page, pageSize) =>
                        setSearchCondition((prev) => ({
                            ...prev,
                            offset: page,
                            limit: pageSize,
                        }))
                    }
                    total={total}
                    showSizeChanger={false}
                    // showSizeChanger={
                    //     total > ListDefaultPageSize[ListType.NarrowList]
                    // }
                    // showQuickJumper={total > searchCondition.limit * 8}
                    hideOnSinglePage
                    pageSizeOptions={ListPageSizerOptions[ListType.NarrowList]}
                    size="small"
                    className={styles['lv-list-bottom-page']}
                />
            </div>
        </div>
    )
}

export default memo(DataRescList)
