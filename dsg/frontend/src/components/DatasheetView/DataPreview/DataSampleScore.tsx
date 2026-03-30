import { useAntdTable } from 'ahooks'
import { message, Space, Table, Tooltip } from 'antd'
import { InfoCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { isNil, noop } from 'lodash'
import { useContext, useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import dataPermisEmpty from '@/assets/dataPermisEmpty.svg'

import {
    AssetTypeEnum,
    formatError,
    getDatasheetViewDetails,
    getDataViewBaseInfo,
    getSubViews,
    getVirtualEngineExample,
    HasAccess,
    isMicroWidget,
    IVirtualEngineExample,
    PolicyActionEnum,
    PolicyDataRescType,
    policyValidate,
} from '@/core'

import { useAuditProcess } from '@/hooks/useAuditProcess'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Watermark } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { getFieldTypeEelment } from '../helper'
import __ from './locale'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import { getInnerUrl } from '@/utils'
import { PolicyType, BizType } from '@/components/AuditPolicy/const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { VIEWERRORCODElIST } from '../const'
import { getScoreColor } from './helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import useResourcePermissionCheck from '@/hooks/useResourcePermissionCheck'

interface DataSampleScoreType {
    id: string
    formViewStatus?: string
    // 是否数据服务超市
    isMarket?: boolean
    // 样例数据是否需要权限控制，为true则传userid，否则不传
    isNeedPermisControl?: boolean
    // 数据获取是否正常
    getDataNormal?: (value: boolean) => void
    hasRule?: boolean
    isAudit?: boolean
    scoreItems?: any[]
    emptyOprClick?: () => void
    loadStatusCallback: (flag: boolean) => void
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
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {text?.isOnlyStatistics
                ? __('未配置质量探查规则')
                : __('未配置探查规则')}
        </div>
    )
}

const DataSampleScore = ({
    id,
    formViewStatus,
    isMarket = false,
    isNeedPermisControl = true,
    getDataNormal = noop,
    hasRule = false,
    isAudit = false,
    scoreItems,
    emptyOprClick = noop,
    loadStatusCallback = noop,
}: DataSampleScoreType) => {
    const [userId] = useCurrentUser('ID')
    // useCogAsstContext 已移除，相关功能已下线
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [{ using }] = useGeneralConfig()

    const [columns, setColumns] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [isAI, setIsAI] = useState<boolean>(true)
    const [isErr, setIsErr] = useState<boolean>(false)
    const [userInfo] = useCurrentUser()
    const noData = ['delete']
    const [viewDetailRes, setViewDetailRes] = useState<any>()
    const [currentCol, setCurrentCol] = useState<string>()
    const [columnObj, setColumnObj] = useState<any[]>()
    const [allowRead, setAllowRead] = useState<boolean>(false)
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
    const userRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )
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
        if (columnObj) {
            ColumnChange(columnObj)
        }
    }, [columnObj, scoreItems])

    useEffect(() => {
        if (!noData.includes(formViewStatus || '') && userInfo?.Account) {
            run({ ...pagination, current: 1 })
        }
    }, [id, formViewStatus, userInfo])

    // 库表有read权限才需要需要样例、合成数据
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
            if (!isAllow) {
                const subviewResult = await getSubViews({
                    limit: 1000,
                    offset: 1,
                    logic_view_id: id,
                })
                isAllow = subviewResult?.entries?.length > 0
            }
            setAllowRead(isAllow)
            return Promise.resolve(isAllow)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
            return Promise.reject(error)
        }
    }

    const ColumnChange = (resColumns) => {
        setColumns(
            resColumns?.map((cItem) => {
                let curConf
                if (hasRule) {
                    const it = scoreItems?.find((obj) => obj.key === cItem.id)
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
                                        {
                                            ...cItem,
                                            type: cItem.data_type,
                                            // 审核样例数据时，tooltip无法展示，需要单独设置getContainer
                                            getContainer: () =>
                                                document.getElementById(
                                                    'data-sample-score-table-id',
                                                ),
                                        },
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
                                style={{
                                    marginTop: hasDataOperRole ? 4 : 'unset',
                                }}
                                title={`${cItem.technical_name}`}
                            >
                                {cItem.technical_name}
                            </div>
                        </div>
                    ),
                    dataIndex: cItem.technical_name,
                    key: cItem.technical_name,
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

    const initTableData = async () => {
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
            const [catalog, schema] = res.view_source_catalog_name.split('.')
            const sampleParams: IVirtualEngineExample = {
                catalog,
                schema,
                table: res.technical_name,
                user: userInfo?.Account || '',
                limit: 10,
                user_id: isAudit ? '' : userInfo?.ID || '',
            }
            if (isAllow) {
                const data = await getVirtualEngineExample(sampleParams)
                getDataNormal(true)
                const list: any[] = []
                const resColumns =
                    data?.columns?.map((item) => {
                        const obj = res?.fields?.find(
                            (it) =>
                                it.technical_name?.toLowerCase() ===
                                item.name?.toLowerCase(),
                        )
                        return {
                            ...item,
                            ...obj,
                            technical_name: item.name,
                            business_name: obj?.business_name,
                            id: obj?.id,
                        }
                    }) || []
                const names = data?.columns?.map((item) => item.name)
                data?.data.forEach((item) => {
                    const obj: any = {}
                    names.forEach((it, inx) => {
                        // 二进制大对象不显示
                        obj[it] =
                            it === 'long_blob_data' ? '[Record]' : item[inx]
                    })
                    list.push(obj)
                })
                setColumnObj(resColumns)
                ColumnChange(resColumns)

                return {
                    total: data?.total_count || 0,
                    list,
                }
            }
            return {
                total: 0,
                list: [],
            }
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
                    message.info({
                        icon: <InfoCircleFilled className={styles.infoIcon} />,
                        content: <span>{err?.data?.description}</span>,
                        duration: 5,
                        className: styles.sampleMsgInfo,
                        // getPopupContainer: () => document.body as HTMLElement,
                    })
                } else if (errCode === VIEWERRORCODElIST.AFSAILORERROR) {
                    // af-sailor服务挂掉
                    message.warning({
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

            return {
                total: 0,
                list: [],
            }
        } finally {
            setLoading(false)
        }
    }
    const { tableProps, run, pagination } = useAntdTable(initTableData, {
        defaultPageSize: 20,
        manual: true,
    })

    const props: any = useMemo(() => {
        const p: { dataSource; loading; onChange; [key: string]: any } =
            tableProps
        return p
    }, [tableProps])

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
            // 样例数据无权限
            if (!allowRead) {
                if (hasDataOperRole || !userRoles) {
                    // 无大模型
                    return (
                        <div className={isMarket ? styles.marketEmpty : ''}>
                            <Empty
                                iconSrc={dataPermisEmpty}
                                desc={__('权限不足，无法查看样例数据')}
                            />
                        </div>
                    )
                }
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
                                        {__('权限不足，无法查看样例数据')}
                                    </div>
                                    <div>
                                        {__('建议您可以先查看')}
                                        <a onClick={() => emptyOprClick()}>
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
                                ? __('源表已删除，无法查看样例数据')
                                : __('暂无样例数据')
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
                            ? __('源表已删除，无法查看样例数据')
                            : __('暂无样例数据')
                    }
                />
            </div>
        )
    }

    useEffect(() => {
        loadStatusCallback(
            (!isMarket || allowRead) &&
                (tableProps?.dataSource?.length > 0 ||
                    (hasRule && tableProps?.dataSource?.length === 0)),
        )
    }, [isMarket, allowRead, tableProps?.dataSource, hasRule])

    return loading ? (
        <Loader />
    ) : (!isMarket || allowRead) &&
      (tableProps?.dataSource?.length > 0 ||
          (hasRule && tableProps?.dataSource?.length === 0)) ? (
        <div
            className={styles.tableWrapper}
            id="data-sample-score-table-id"
            style={{
                height: isMarket
                    ? '100%'
                    : tableProps.dataSource.length === 0
                    ? undefined
                    : tableProps.pagination.total > 20
                    ? 'calc(100% - 50px)'
                    : 'calc(100% - 24px)',
                overflowY: 'auto',
            }}
        >
            <Watermark
                content={`${userInfo?.VisionName || ''} ${
                    userInfo?.Account || ''
                }`}
            >
                <Table
                    {...props}
                    columns={columns}
                    className={styles.sampleTable}
                    rowKey={(record) => record.key}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    bordered
                    rowSelection={null}
                    size="small"
                    locale={{
                        emptyText: (
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        ),
                    }}
                />
            </Watermark>
        </div>
    ) : (
        empty()
    )
}

export default DataSampleScore
