import { useState, useContext, useEffect, useMemo, useRef, memo } from 'react'
import { Spin, Table, message, Space, Tooltip } from 'antd'
import { useDebounce, useInfiniteScroll } from 'ahooks'

import { InfoCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { isNil, noop } from 'lodash'
import { Empty, Watermark } from '@/ui'
import __ from '../locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import dataPermisEmpty from '@/assets/dataPermisEmpty.svg'

import {
    AssetTypeEnum,
    createDownloadTask,
    formatError,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getDataViewPreview,
    HasAccess,
    isMicroWidget,
    PolicyActionEnum,
    PolicyDataRescType,
    policyValidate,
    SortDirection,
} from '@/core'

import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'

import Loader from '@/ui/Loader'
import { getFieldTypeEelment } from '../../../helper'
import { MicroWidgetPropsContext } from '@/context'
import { getInnerUrl } from '@/utils'
import { PolicyType, BizType } from '@/components/AuditPolicy/const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { VIEWERRORCODElIST } from '../../../const'
import { getScoreColor } from '../../helper'
import { FontIcon } from '@/icons'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import useResourcePermissionCheck from '@/hooks/useResourcePermissionCheck'

interface DataSampleScoreType {
    id: string
    fields: any
    formViewStatus?: string
    // 是否数据服务超市
    isMarket?: boolean
    // 样例数据是否需要权限控制，为true则传userid，否则不传
    isNeedPermisControl?: boolean
    canCheckCol?: boolean
    scrollY?: string
    // 数据获取是否正常
    getDataNormal?: (value: boolean) => void
    onColChange?: (key?: string) => void
    hasRule?: boolean
    isAudit?: boolean
    scoreItems?: any[]
    emptyOprClick?: () => void
    loadStatusCallback?: (flag: boolean) => void
    config?: any
    hasDownloadPermission?: boolean // 下载页跳过权限校验
    onConfigChange?: (conf?: any) => void
}

const ScoreConfig = [
    {
        label: __('完整性'),
        value: 'completeness_score',
    },
    {
        label: __('唯一性'),
        value: 'uniqueness_score',
    },
    {
        label: __('规范性'),
        value: 'standardization_score',
    },
    {
        label: __('准确性'),
        value: 'accuracy_score',
    },
]

const renderItem = (text: any) => {
    const isInvalidValue = text === '' || isNil(text)

    const name = isInvalidValue
        ? '--'
        : text === false || text === true || text === 0
        ? `${text}`
        : text
    return (
        <div
            className={classnames(styles.tableTDContnet)}
            style={{
                padding: '4px 12px',
            }}
        >
            <Tooltip title={isInvalidValue && __('暂无数据')}>
                <span
                    title={!isInvalidValue ? `${name}` : ''}
                    className={classnames(
                        styles.businessTitle,
                        isInvalidValue && styles.emptyTitle,
                    )}
                >
                    {name}
                </span>
            </Tooltip>
        </div>
    )
}

const renderTitle = (text) => {
    const item = text?.data
    return !text?.isOnlyStatistics && item ? (
        <div
            className={classnames(styles.scoreInfo)}
            style={{
                padding: '6px 12px',
            }}
        >
            {ScoreConfig.map((o) => (
                <div
                    key={o.value}
                    className={classnames(
                        styles.scoreInfoItem,
                        !item?.[o.value] &&
                            item?.[o.value] !== 0 &&
                            styles.unConfig,
                    )}
                >
                    <span className={styles.scoreTitle}>{o.label}:</span>
                    <span
                        hidden={!item?.[o.value] && item?.[o.value] !== 0}
                        className={styles.scoreIcon}
                        style={{
                            background: getScoreColor(item?.[o.value]),
                        }}
                    />
                    <span className={styles.scoreValue}>
                        {item?.[o.value] ?? '未配置'}
                    </span>
                </div>
            ))}
        </div>
    ) : (
        <div
            className={classnames(styles.unConfig)}
            style={{
                padding: '6px 12px',
            }}
        >
            {text?.isOnlyStatistics
                ? __('未配置质量探查规则')
                : __('未配置探查规则')}
        </div>
    )
}

/**
 * 无限滚动表
 * @returns
 */
function ScrollTable({
    id,
    formViewStatus,
    isMarket = false,
    isNeedPermisControl = true,
    scrollY,
    canCheckCol = false,
    getDataNormal = noop,
    onColChange = noop,
    hasRule = false,
    isAudit = false,
    scoreItems,
    fields,
    emptyOprClick = noop,
    loadStatusCallback = noop,
    config,
    onConfigChange,
    hasDownloadPermission = false,
}: DataSampleScoreType) {
    const [searchCondition, setSearchCondition] = useState<any>()
    const debounceCondition = useDebounce(searchCondition)
    const [columns, setColumns] = useState<Array<any>>([])
    const [dataSource, setDataSource] = useState<any[]>([])
    const [showFieldIds, setShowFieldIds] = useState<string[]>()
    const [showField, setShowField] = useState<any[]>([])
    const curOffset = useRef<number>(1)
    const [filters, setFilters] = useState<any[]>([])

    // 字段变更更新显示字段
    useEffect(() => {
        const { fields: cFields, filters: cFilters } = config || {}

        // filter显示与排序
        const checkedFields = cFields?.filter((o) => o?.isChecked)
        const curFields =
            checkedFields?.length > 0
                ? checkedFields
                : cFields?.length > 0
                ? cFields
                : fields
        const currentFields = (curFields || [])
            .map((o) => {
                const it = fields?.find((k) => k?.id === o?.id)
                return it
            })
            ?.filter(
                (o) =>
                    o !== undefined &&
                    o.status !== 'delete' &&
                    o.status !== 'not_support',
            )
        const checkedIds = currentFields.map((o) => o?.id)
        // filter转换
        // const curFilter = (cFilters || [])
        //     .map((o) => {
        //         const val = Array.isArray(o?.value)
        //             ? o?.value?.join(',')
        //             : o?.value
        //         return {
        //             ...o,
        //             value: val,
        //         }
        //     })
        //     .filter((o) => {
        //         const it = fields?.find((k) => k?.id === o?.id)
        //         const isTypeChange =
        //             o?.data_type &&
        //             o?.data_type !== changeFormatToType(it?.data_type)
        //         return !isTypeChange && checkedIds?.includes(o?.id)
        //     }) // 过滤掉类型变更的字段和未勾选字段

        // setFilters(curFilter)
        setShowField(currentFields)
        setShowFieldIds(checkedIds)
        checkDownloadPermission()
    }, [fields, config])

    useEffect(() => {
        ColumnChange(showField)
    }, [showField, config])

    useEffect(() => {
        if (id) {
            setSearchCondition((prev) => ({
                ...prev,
                filters,
                form_view_id: id,
                fields: showFieldIds,
                direction: config?.sort_field_id
                    ? config?.direction
                    : undefined,
                sort_field_id: config?.sort_field_id,
            }))
            curOffset.current = 1
        }
    }, [id, showFieldIds, filters, config])

    const [userId] = useCurrentUser('ID')
    // useCogAsstContext 已移除，相关功能已下线
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [{ using }] = useGeneralConfig()
    const [loading, setLoading] = useState<boolean>(false)
    const [isAI, setIsAI] = useState<boolean>(true)
    const [isErr, setIsErr] = useState<boolean>(false)
    const [userInfo] = useCurrentUser()
    const noData = ['delete']
    const [viewDetailRes, setViewDetailRes] = useState<any>()
    const [currentCol, setCurrentCol] = useState<string>()
    const [columnObj, setColumnObj] = useState<any[]>()
    const [allowRead, setAllowRead] = useState<boolean>(false)
    const [allowDownload, setAllowDownload] = useState<boolean>(false)
    // const [hasAuditProcess, refreshAuditProcess] = useAuditProcess({
    //     audit_type: PolicyType.AssetPermission,
    //     service_type: BizType.AuthService,
    // })

    const resourceInfo = useMemo(() => {
        if (!id) return []
        return [{ id, type: PolicyDataRescType.LOGICALVIEW }]
    }, [id])

    const { results: resourcePermissionResults } =
        useResourcePermissionCheck(resourceInfo)

    const hasAuditProcess = useMemo(() => {
        const curPolicy = resourcePermissionResults?.find(
            (item) => item.id === id,
        )
        return curPolicy?.hasAuditEnablePolicy
    }, [resourcePermissionResults, id])

    const { checkPermissions } = useUserPermCtx()
    // const userRoles = useMemo(
    //     () => checkPermissions(HasAccess.isHasBusiness),
    //     [checkPermissions],
    // )
    // 样例数据错误code
    const [sampleErr, setSampleErr] = useState<any>()

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    // 仅服务超市、认知搜索、首页、我的、资产全景
    const isShowRequestPath = [
        '/data-assets',
        '/cognitive-search',
        '/asset-center',
        '/my-assets',
        '/asset-view/architecture',
    ].includes(getInnerUrl(window.location.pathname))

    const isOwner = useMemo(() => {
        return userId === viewDetailRes?.owner_id
    }, [viewDetailRes, userId])

    // 是否显示权限申请按钮
    const isShowAuditProcessBtn = useMemo(() => {
        return (
            hasAuditProcess &&
            !isOwner &&
            (isShowRequestPath ||
                isMicroWidget({
                    microWidgetProps,
                }))
        )
    }, [hasAuditProcess, isOwner])

    useEffect(() => {
        if (!canCheckCol) {
            setCurrentCol(undefined)
        }
    }, [canCheckCol])

    // 库表有read权限才需要需要全量、合成数据
    const checkReadPermission = async (): Promise<any> => {
        try {
            let isAllow = false
            if (isAudit) {
                isAllow = true
                setAllowRead(isAllow)
                return Promise.resolve(isAllow)
            }
            const res = await policyValidate([
                {
                    action: PolicyActionEnum.Read,
                    object_id: id,
                    object_type: AssetTypeEnum.DataView,
                    subject_id: userId,
                    subject_type: 'user',
                },
            ])
            const validateItem = (res || [])?.find((o) => o.object_id === id)
            isAllow = validateItem?.effect === 'allow'
            setAllowRead(isAllow)
            return Promise.resolve(isAllow)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
            return Promise.reject(error)
        }
    }

    // download权限判断
    const checkDownloadPermission = () => {
        if (hasDownloadPermission) {
            setAllowDownload(true)
        }
        let isAllow = false
        // 判断选择字段是否is_downloadable
        if (config?.fields) {
            // 已配置 则选择字段均满足下载条件
            isAllow = config?.fields
                ?.filter((o) => o?.isChecked)
                ?.every(
                    (o) =>
                        fields?.find((k) => k?.id === o?.id)?.is_downloadable,
                )
        } else {
            // 未配置 则所有字段均满足下载条件
            isAllow = fields?.every((o) => o?.is_downloadable)
        }
        setAllowDownload(isAllow)
    }

    const ColumnChange = (resColumns) => {
        setColumns(
            resColumns?.map((cItem) => {
                if (!cItem) return undefined

                let curConf
                if (hasRule) {
                    const it = scoreItems?.find((obj) => obj.key === cItem?.id)
                    curConf = it || { isScore: true }
                }

                const isShowRule = hasRule && curConf?.isScore
                return {
                    title: (
                        <div
                            style={{
                                padding: '6px 12px',
                            }}
                        >
                            <div className={styles.tableTDContnet}>
                                <span className={styles.nameIcon}>
                                    {getFieldTypeEelment(
                                        { ...cItem, type: cItem?.data_type },
                                        20,
                                        'top',
                                        hasDataOperRole,
                                    )}
                                </span>
                                <span
                                    title={`${cItem.business_name}`}
                                    className={styles.businessTitle}
                                >
                                    {cItem.business_name}
                                </span>
                            </div>
                            <div
                                className={classnames(
                                    styles.tableTDContnet,
                                    styles.subTableTDContnet,
                                )}
                                title={`${cItem.technical_name}`}
                            >
                                {cItem.technical_name}
                            </div>
                        </div>
                    ),
                    dataIndex: cItem.technical_name,
                    key: cItem.technical_name,
                    sorter: true,
                    showSorterTooltip: false,
                    sortOrder:
                        searchCondition.sort_field_id === cItem.id
                            ? searchCondition.direction === SortDirection.ASC
                                ? 'ascend'
                                : 'descend'
                            : null,
                    children: isShowRule
                        ? [
                              {
                                  title: renderTitle(curConf),
                                  dataIndex: cItem.technical_name,
                                  key: `${cItem.technical_name}_conf`,
                                  ellipsis: true,
                                  render: renderItem,
                              },
                          ]
                        : undefined,
                    ellipsis: true,
                    render: isShowRule ? undefined : renderItem,
                }
            }) || [],
        )
    }

    const getData = async () => {
        let isAllow: any = false
        try {
            setLoading(true)
            const [res, baseRes, hasPermis] = await Promise.all([
                getDatasheetViewDetails(id),
                getDataViewBaseInfo(id),
                checkReadPermission(),
            ])
            setViewDetailRes({
                ...baseRes,
                ...res,
            })
            isAllow = typeof hasPermis === 'boolean' ? hasPermis : false
        } catch (err) {
            getDataNormal(false)
            const errCode = err?.data?.code || ''
            setSampleErr(errCode)
            if (errCode === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                setIsErr(true)
            }
            if (isAllow) {
                if (errCode === VIEWERRORCODElIST.VIEWTABLEFIELD) {
                    // 库表与源表的字段不一致
                    ;(microWidgetProps?.components?.toast || message).info({
                        icon: <InfoCircleFilled className={styles.infoIcon} />,
                        content: <span>{err?.data?.description}</span>,
                        duration: 5,
                        className: styles.sampleMsgInfo,
                        // getPopupContainer: () => document.body as HTMLElement,
                    })
                } else if (errCode === VIEWERRORCODElIST.AFSAILORERROR) {
                    // af-sailor服务挂掉
                    ;(microWidgetProps?.components?.toast || message).warning({
                        content: (
                            <span>
                                {__('无法连接af-sailor服务，信息获取失败')}
                            </span>
                        ),
                        duration: 5,
                    })
                } else {
                    formatError(err, microWidgetProps?.components?.toast)
                }
            } else {
                formatError(err, microWidgetProps?.components?.toast)
            }
        }
    }

    const empty = () => {
        if (isMarket) {
            if (sampleErr === VIEWERRORCODElIST.VIEWTABLEFIELD) {
                // 库表与源表的字段不一致，无法查看数据
                return (
                    <div className={isMarket ? styles.marketEmpty : ''}>
                        <Empty
                            iconSrc={dataEmpty}
                            desc={__('库表与源表的字段不一致，无法查看数据')}
                        />
                    </div>
                )
            }
            // 全量数据无权限
            if (!fields?.length) {
                // if (hasDataOperRole || !userRoles) {
                //     // 无大模型
                //     return (
                //         <div className={isMarket ? styles.marketEmpty : ''}>
                //             <Empty
                //                 iconSrc={dataPermisEmpty}
                //                 desc={__('权限不足，无法查看全量数据')}
                //             />
                //         </div>
                //     )
                // }
                return (
                    <div className={isMarket ? styles.marketEmpty : ''}>
                        <Empty
                            iconSrc={dataPermisEmpty}
                            desc={
                                <Space
                                    direction="vertical"
                                    align="center"
                                    size={8}
                                >
                                    <div>
                                        {__('权限不足，无法查看全量数据')}
                                    </div>
                                    {/* {llm && (
                                        <div>
                                            {__('建议您可以先查看')}
                                            <a
                                                onClick={() =>
                                                    emptyOprClick?.()
                                                }
                                            >
                                                {__('合成数据')}
                                            </a>
                                            {using === 1 ||
                                            !isShowAuditProcessBtn
                                                ? __(
                                                      '作为参考，若需要使用真实的样例数据，可联系当前资源的数据Owner进行授权',
                                                  )
                                                : __(
                                                      '作为参考，若需要使用真实的样例数据，可进行权限申请',
                                                  )}
                                        </div>
                                    )} */}
                                    <div>
                                        {__('建议您可以先查看')}
                                        <a onClick={() => emptyOprClick?.()}>
                                            {__('合成数据')}
                                        </a>
                                        {using === 1 || !isShowAuditProcessBtn
                                            ? __(
                                                  '作为参考，若需要使用真实的样例数据，可联系当前资源的数据Owner进行授权',
                                              )
                                            : __(
                                                  '作为参考，若需要使用真实的样例数据，可进行权限申请',
                                              )}
                                    </div>
                                </Space>
                            }
                        />
                    </div>
                )
            }

            return (
                <div className={isMarket ? styles.marketEmpty : ''}>
                    <Empty
                        iconSrc={dataEmpty}
                        desc={
                            isErr
                                ? __(
                                      '源表已修改，请联系系统管理员重新发布后查看',
                                  )
                                : formViewStatus === 'delete'
                                ? __('源表已删除，无法查看全量数据')
                                : __('暂无数据')
                        }
                    />
                </div>
            )
        }

        return (
            <div
                style={{
                    padding: '80px 0',
                }}
            >
                <Empty
                    iconSrc={dataEmpty}
                    desc={
                        isErr
                            ? __('源表已修改，请联系系统管理员重新发布后查看')
                            : formViewStatus === 'delete'
                            ? __('源表已删除，无法查看全量数据')
                            : __('暂无数据')
                    }
                />
            </div>
        )
    }

    useEffect(() => {
        getData()
    }, [])

    useEffect(() => {
        loadStatusCallback?.(
            (!isMarket || fields?.length > 0) &&
                (dataSource?.length > 0 ||
                    (hasRule && dataSource?.length === 0)),
        )
    }, [isMarket, fields, dataSource, hasRule])

    const getList = (offset: number, limit: number) => {
        return getDataViewPreview({
            ...searchCondition,
            configs: config?.configs ?? '',
            limit,
            offset,
        })
            .then((res) => {
                return Promise.resolve({ ...res, list: res?.data || [] })
            })
            .catch((err) => {
                if (
                    err?.data?.code ===
                    'DataView.FormView.FormViewFieldIDNotExist'
                ) {
                    ;(microWidgetProps?.components?.toast || message).error(
                        __('源表已删除，无法进行数据预览'),
                    )
                } else {
                    formatError(err)
                }
                return Promise.resolve({ data: [], list: [] })
            })
    }

    const {
        data,
        loading: initLoading,
        loadingMore,
        noMore,
        loadMore,
        reload: updateList,
        error,
    } = useInfiniteScroll<{
        columns: any[]
        data: any[]
        list: any[]
        total_count: number
    }>(
        (currentData) => {
            return getList(curOffset.current, 20)
        },
        {
            target: () =>
                document.querySelector(
                    '#scroll-table .any-fabric-ant-table-body',
                ),
            manual: true,
            isNoMore: (d: any) => {
                return d?.data?.length < 20 || false
            },
            onSuccess: (d) => {
                curOffset.current += 1
            },
            onFinally: () => {
                setLoading(false)
            },
            reloadDeps: [debounceCondition],
        },
    )

    useEffect(() => {
        if (!noData.includes(formViewStatus || '') && userInfo?.Account) {
            curOffset.current = 1
            if (searchCondition?.form_view_id) {
                updateList()
            }
        }
    }, [id, formViewStatus, userInfo])

    useEffect(() => {
        const list: any[] = []
        const fieldNames = (data?.columns || []).map((item) => item.name)
        data?.data.forEach((item) => {
            const obj: any = {}
            fieldNames.forEach((it, idx) => {
                // 二进制大对象不显示
                obj[it] = it === 'long_blob_data' ? '[Record]' : item[idx]
            })
            list.push(obj)
        })
        setDataSource(curOffset.current === 1 ? list : [...dataSource, ...list])
    }, [data])

    const handleDownloadTask = async () => {
        try {
            const useConfig: any = {
                fields: showField,
                row_filters: {
                    member: filters,
                },
            }

            if (config?.sort_field_id) {
                useConfig.sort_field_id = config?.sort_field_id
                useConfig.direction = config?.direction || SortDirection.DESC
            }

            const detail = JSON.stringify(useConfig || '{}')
            await createDownloadTask({
                form_view_id: id,
                detail,
            })
            ;(microWidgetProps?.components?.toast || message).success(
                __('已添加至「下载任务」'),
            )
        } catch (err) {
            ;(microWidgetProps?.components?.toast || message).error(
                __('添加下载任务失败'),
            )
        }
    }

    return loading || initLoading ? (
        <Loader />
    ) : (!isMarket || fields?.length > 0) &&
      (dataSource?.length > 0 ||
          (hasRule && scoreItems?.length && dataSource?.length === 0)) ? (
        <div
            className={styles.tableWrapper}
            style={{
                height: isMarket
                    ? '100%'
                    : dataSource.length === 0
                    ? undefined
                    : '100% ',
                overflow: 'hidden',
                width: '100%',
            }}
        >
            <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
            >
                <Table
                    id="scroll-table"
                    dataSource={dataSource}
                    loading={initLoading}
                    columns={columns}
                    className={styles.sampleTable}
                    rowKey={(record) => record.key}
                    scroll={{
                        // scrollToFirstRowOnChange: false,
                        y: scrollY || 'calc(100vh - 400px)',
                        x: columns.length * 200,
                    }}
                    onChange={(_pagination, _filter, _sorter: any) => {
                        const { field: sort_field, order: sort_direction } =
                            _sorter || {}

                        const conf: any = {
                            sort_field_id: undefined,
                            direction: undefined,
                        }
                        if (sort_direction) {
                            const direction =
                                sort_direction === 'ascend'
                                    ? SortDirection.ASC
                                    : SortDirection.DESC
                            const sort_field_id = fields?.find(
                                (o) => o?.technical_name === sort_field,
                            )?.id
                            conf.sort_field_id = sort_field_id

                            conf.direction = sort_field_id
                                ? direction
                                : undefined
                        }
                        onConfigChange?.(conf)
                    }}
                    pagination={false}
                    bordered
                    summary={() =>
                        (dataSource?.length > 0 && (
                            <div className={styles['text-center']}>
                                {loadingMore && <Spin size="small" />}
                                {noMore && <span>没有更多了</span>}
                                {error && (
                                    <span
                                        className={styles['text-center-retry']}
                                    >
                                        加载失败
                                        <br />
                                        <a
                                            onClick={() => {
                                                loadMore()
                                            }}
                                        >
                                            重试
                                        </a>
                                    </span>
                                )}
                            </div>
                        )) as any
                    }
                    locale={{
                        emptyText: (
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        ),
                    }}
                />
            </Watermark>
            {!hasDownloadPermission && (
                <Tooltip
                    title={
                        allowDownload ? (
                            <div>
                                <div>
                                    1、{__('实际下载的数据受数据权限限制')}
                                </div>
                                <div>2、{__('最多可下载10万条数据')}</div>
                            </div>
                        ) : (
                            __('无下载权限，请申请权限或联系数据Owner进行授权')
                        )
                    }
                >
                    <div
                        onClick={() => {
                            if (allowDownload) {
                                handleDownloadTask()
                            }
                        }}
                        className={classnames(
                            styles.downloadBtn,
                            !allowDownload && styles.disabledDownload,
                        )}
                    >
                        <FontIcon name="icon-xiazai" />
                    </div>
                </Tooltip>
            )}
        </div>
    ) : (
        empty()
    )
}

export default memo(ScrollTable)
