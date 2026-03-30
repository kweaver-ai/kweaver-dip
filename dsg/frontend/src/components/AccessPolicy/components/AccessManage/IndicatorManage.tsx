import { Button, message, Tooltip } from 'antd'
import classnames from 'classnames'
import { memo, useContext, useEffect, useRef, useState } from 'react'
import { isEmpty, trim, uniqBy } from 'lodash'
import { ColAndRowColored } from '@/icons'
import {
    AssetTypeEnum,
    IDatasheetField,
    ISubView,
    formatError,
    getVirtualEngineExample,
    policyRemove,
    getDimRules,
    getIndicatorDetail,
    deleteIndicatorDimRules,
} from '@/core'
import { SubViewPrefix } from './SubViewManage'
import styles from './styles.module.less'
import {
    ScopeType,
    SubViewOptType,
    SubviewMode,
    UpdateOptType,
} from '../../const'
import { Loader, ReturnConfirmModal } from '@/ui'

import __ from '../../locale'
import { useStatusContext } from './StatusProvider'
import { getTypeText } from '@/utils'
import { MicroWidgetPropsContext } from '@/context'
import TipModal from '../TipModal'
import DimViewManage from './DimViewManage'
import { IScopeItem } from './ColAndRowPanel'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'

const SubViewLabel = ({
    data,
    isActive,
    isSubView = true,
    disabled = false,
    indicatorType,
    onClick,
}: {
    data: Partial<ISubView>
    onClick?: (item: Partial<ISubView>) => void
    isActive?: boolean
    disabled?: boolean
    isSubView?: boolean
    indicatorType?: string
}) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const handleClick = () => {
        if (!isActive && disabled) {
            TipModal({
                content: __(
                    '${type}还未保存，请先保存或取消本次${type}操作。',
                    { type: __('授权') },
                ),
                microWidgetProps,
            })
        }
        onClick?.(data)
    }
    return (
        <div
            className={classnames(
                styles['subview-label'],
                isActive && styles.active,
            )}
            onClick={() => handleClick()}
        >
            {isSubView ? (
                <ColAndRowColored className={styles.icon} />
            ) : (
                <IndicatorIcons
                    type={indicatorType}
                    className={styles.icon}
                    fontSize={20}
                />
            )}
            <span className={styles.title} title={data.name || __('规则名称')}>
                {data.name || __('规则名称')}
            </span>
        </div>
    )
}

const IndicatorManage = ({
    isOwner,
    hasAllRead,
    showAll,
    data,
    indicatorType,
    isChange,
    extendsVisitor,
    visitorComponent,
    bottomComponent,
}: any) => {
    const [active, setActive] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [subViews, setSubViews] = useState<ISubView[]>([]) // SUBVIEWS
    const [colFields, setColFields] = useState<IDatasheetField[]>()
    const [subViewChange, setSubViewChange] = useState<boolean>(false)
    const [openProbe, setOpenProbe] = useState<boolean>()
    const [subViewNames, setSubViewNames] = useState<string[]>([])
    // 样例数据
    const [exampleData, setExampleData] = useState<any>({})
    const { setViewChange } = useStatusContext()
    const listRef = useRef<any>()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [scopeOptions, setScopeOptions] = useState<IScopeItem[]>([])

    useEffect(() => {
        const names = subViews?.map((o) => trim(o.name))
        setSubViewNames(names)
    }, [subViews])

    useEffect(() => {
        // 不展示全部视角下 如果当前没有选中，则选中第一个
        if (!showAll && subViews?.length > 0 && !active) {
            setActive(subViews[0])
        }
    }, [showAll, subViews, active])

    // 可选授权范围
    useEffect(() => {
        const indicatorOption = {
            key: data?.object_id,
            label: data?.object_name,
            value: data?.object_id,
            type: indicatorType,
            disabled: !showAll,
        }
        const dimOptions = (subViews || [])
            .filter(
                (o) => !o.id?.startsWith(SubViewPrefix) && o.id !== active?.id, // 非新建和当前
            )
            .map((o) => ({
                key: o.id,
                label: o.name,
                value: o.id,
                type: ScopeType.Rule,
                disabled: !o?.can_auth,
                data: o,
            }))
        // 授权范围显示不受showAll影响
        setScopeOptions([indicatorOption, ...dimOptions])
    }, [subViews, data, active, indicatorType, showAll])

    useEffect(() => {
        setViewChange(subViewChange)
    }, [subViewChange])

    // 加载子库表、列数据
    const loadSubView = async () => {
        try {
            setLoading(true)
            const subviewResult = await getDimRules({
                limit: 1000,
                offset: 1,
                indicator_id: data.object_id,
            })
            const entries = (subviewResult?.entries || []).map((item) => {
                const { metadata, spec } = item
                const obj = {
                    detail: JSON.stringify({
                        fields: spec?.fields || [],
                        row_filters: spec?.row_filters
                            ? {
                                  ...spec?.row_filters,
                                  where: spec?.row_filters?.where || [],
                              }
                            : {},
                    }),
                    id: metadata?.id,
                    name: spec?.name,
                    logic_view_id: spec?.indicator_id,
                }
                return obj
            })
            setSubViews(entries)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    const loadColumns = async () => {
        try {
            const colsResult = await getIndicatorDetail(data.object_id)
            const columnFields = (colsResult?.analysis_dimensions || [])?.map(
                (o) => ({
                    ...o,
                    data_type: getTypeText(o.original_data_type),
                    primary_key: false,
                    business_name: o.business_name,
                    id: o.field_id,
                }),
            )
            setColFields(columnFields)
            if (isEmpty(exampleData)) {
                const [catalog, schema, table] = (
                    colsResult?.view_full_path || ''
                ).split('/')
                const exampleRes = await getVirtualEngineExample({
                    catalog,
                    schema,
                    table,
                    limit: 10,
                })
                const exaData = {}
                const { columns, data: colData } = exampleRes
                columns.forEach((item, index) => {
                    exaData[item.name] = Array.from(
                        new Set(colData.map((it) => it[index])),
                    )
                })
                setExampleData(exaData)
            }
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    useEffect(() => {
        if (data?.object_id) {
            Promise.all([loadSubView(), loadColumns()])
        }
    }, [data?.object_id])

    const handleResetCheck = (item: ISubView, mode: SubviewMode) => {
        if (item?.id?.startsWith(SubViewPrefix)) {
            setSubViews(subViews?.filter((o) => o.id !== item?.id))
        }
        if (mode !== SubviewMode.Edit) {
            setActive(undefined)
        }
        setSubViewChange(false)
    }

    const handleOpt = async (opt: SubViewOptType, info?: any) => {
        if (opt === SubViewOptType.Add) {
            if (!data?.object_id) {
                ;(microWidgetProps?.components?.toast || message).error(
                    __('未找到指标'),
                )
                return
            }

            const localItem = subViews?.find((o) =>
                o.id.startsWith(SubViewPrefix),
            )

            if (localItem) {
                ;(microWidgetProps?.components?.toast || message).info(
                    __('已存在待配置授权规则'),
                )
                setActive(localItem)
                return
            }

            const newItem = {
                id: `${SubViewPrefix}_${Math.random().toString(36).slice(-6)}`,
                logic_view_id: data?.object_id,
                auth_scope_id: data?.object_id, // 默认授权范围
                name: '',
                detail: '',
            }
            setSubViews((prev) => [...prev, newItem])
            setActive(newItem)
            setSubViewChange(true)

            setTimeout(() => {
                listRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                    inline: 'end',
                })
            }, 0)
            return
        }
        if (opt === SubViewOptType.Create) {
            const { tempId, item } = info
            const newItems = subViews.map((o) => (o.id === tempId ? item : o))
            setSubViews(newItems)
            setActive(item)
            setSubViewChange(false)
            return
        }
        if (opt === SubViewOptType.Update) {
            const { id, item, updateType } = info
            if ([UpdateOptType.All, UpdateOptType.Rule].includes(updateType)) {
                const newItems = subViews.map((o) =>
                    o.id === id ? { ...item } : o,
                )
                setSubViews(newItems)
                setActive(item)
            }
            setSubViewChange(false)
            return
        }
        if (opt === SubViewOptType.Delete) {
            const { id } = info
            try {
                ReturnConfirmModal({
                    title: __('确定要删除授权维度规则吗？'),
                    content: __(
                        '删除后该授权规则、及赋予全部访问者的权限将均被删除 ，请确认操作。',
                    ),
                    cancelText: __('取消'),
                    okText: __('确定'),
                    onOK: async () => {
                        await policyRemove({
                            object_id: id,
                            object_type: AssetTypeEnum.Dim,
                        })
                        await deleteIndicatorDimRules(id)
                        setActive(undefined)
                        const newItems = subViews.filter((o) => o.id !== id)
                        setSubViews(newItems)
                        setSubViewChange(false)
                        ;(
                            microWidgetProps?.components?.toast || message
                        ).success(__('删除成功'))
                    },
                    microWidgetProps,
                })
            } catch (error) {
                formatError(error, microWidgetProps?.components?.toast)
            }
            return
        }
        if (opt === SubViewOptType.Cancel) {
            const { item, mode } = info
            handleResetCheck(item, mode)
        }
    }

    const switchActive = async (nextActive) => {
        if (isChange || subViewChange) {
            return
        }
        if (active?.id?.startsWith(SubViewPrefix)) {
            return
        }
        setActive(nextActive)
    }

    const handleDataChange = (change: boolean) => {
        setSubViewChange(change)
    }

    return (
        <div className={styles['dataview-manage']}>
            <div className={styles['dataview-manage-left']}>
                <div className={styles['dataview-manage-left-list']}>
                    <div className={styles['logic-items']} hidden={!showAll}>
                        <div className={styles['logic-items-title']}>
                            {__('指标')}
                        </div>
                        <div className={styles['logic-items-list']}>
                            <SubViewLabel
                                data={{
                                    name: data?.object_name,
                                    logic_view_id: data?.object_id,
                                    id: data?.object_id,
                                }}
                                isSubView={false}
                                disabled={isChange || subViewChange}
                                indicatorType={indicatorType}
                                isActive={active === undefined}
                                onClick={() => switchActive(undefined)}
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    ) : (
                        <div
                            className={styles['logic-items']}
                            style={{
                                visibility: !subViews?.length
                                    ? 'hidden'
                                    : 'visible',
                            }}
                        >
                            <div className={styles['logic-items-title']}>
                                {__('授权维度规则')}
                            </div>
                            <div
                                className={classnames(
                                    styles['logic-items-list'],
                                    styles['sub-views-box'],
                                )}
                            >
                                <div ref={listRef}>
                                    {subViews?.map((o) => (
                                        <SubViewLabel
                                            key={o.id}
                                            data={o}
                                            disabled={isChange || subViewChange}
                                            isActive={active?.id === o?.id}
                                            onClick={() => switchActive(o)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles['dataview-manage-left-btn']}>
                    <Tooltip
                        title={
                            (isChange || subViewChange) &&
                            __('请先保存或取消本次${type}', {
                                type: __('授权'),
                            })
                        }
                    >
                        <Button
                            type="default"
                            disabled={isChange || subViewChange}
                            onClick={() => handleOpt(SubViewOptType.Add)}
                        >
                            {__('添加维度授权')}
                        </Button>
                    </Tooltip>
                </div>
            </div>
            <div className={styles['dataview-manage-right']}>
                {active ? (
                    <DimViewManage
                        isOwner={isOwner}
                        hasAllRead={hasAllRead}
                        data={active}
                        extendsVisitor={extendsVisitor}
                        cols={colFields}
                        onOperation={handleOpt}
                        onDataChange={handleDataChange}
                        names={subViewNames}
                        exampleData={exampleData}
                        openProbe={openProbe}
                        formId={data.object_id}
                        scopeOptions={scopeOptions}
                    />
                ) : showAll ? (
                    <div className={styles['dataview-panel']}>
                        <div className={styles['dataview-panel-content']}>
                            {visitorComponent}
                        </div>
                        <div className={styles['dataview-panel-footer']}>
                            {bottomComponent}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}

export default memo(IndicatorManage)
