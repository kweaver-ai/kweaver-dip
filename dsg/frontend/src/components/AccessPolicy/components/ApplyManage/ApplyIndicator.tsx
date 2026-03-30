import { Button, Tooltip, message } from 'antd'
import classnames from 'classnames'
import { isEmpty, trim } from 'lodash'
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MicroWidgetPropsContext } from '@/context'
import {
    IDatasheetField,
    ISubView,
    formatError,
    getDimRules,
    getIndicatorDetail,
    getVirtualEngineExample,
} from '@/core'
import { ColAndRowColored } from '@/icons'
import { Loader } from '@/ui'
import { getTypeText } from '@/utils'
import { ScopeType, SubViewOptType, SubviewMode } from '../../const'
import __ from '../../locale'
import { useStatusContext } from '../AccessManage/StatusProvider'
import TipModal from '../TipModal'
import ApplySubDim, { SubDimPrefix } from './ApplySubDim'
import styles from './styles.module.less'
import IndicatorIcons from '@/components/IndicatorManage/IndicatorIcons'
import { IScopeItem } from '../AccessManage/ColAndRowPanel'

const SubDimLabel = ({
    data,
    isActive,
    indicatorType,
    isSubView = true,
    disabled = false,
    onClick,
}: {
    indicatorType?: string
    data: Partial<ISubView>
    onClick?: (item: Partial<ISubView>) => void
    isActive?: boolean
    disabled?: boolean
    isSubView?: boolean
}) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const handleClick = () => {
        if (!isActive && disabled) {
            TipModal({
                content: __(
                    '${type}还未保存，请先保存或取消本次${type}操作。',
                    {
                        type: __('申请'),
                    },
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
                // !isActive && disabled && styles.disabled,
            )}
            onClick={() => handleClick()}
        >
            {isSubView ? (
                <ColAndRowColored className={styles.icon} />
            ) : (
                <IndicatorIcons
                    type={indicatorType}
                    className={styles.icon}
                    style={{ fontSize: '20px' }}
                />
            )}
            <span className={styles.title} title={data.name || __('规则名称')}>
                {data.name || __('规则名称')}
            </span>
        </div>
    )
}

const ApplyIndicator = ({
    data,
    indicatorType,
    isChange,
    extendsVisitor,
    visitorComponent,
    bottomComponent,
    onClose,
}: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [active, setActive] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [subViews, setSubViews] = useState<ISubView[]>([]) // SUBVIEWS
    const [colFields, setColFields] = useState<IDatasheetField[]>()
    const [subViewChange, setSubViewChange] = useState<boolean>(false)
    const [subViewNames, setSubViewNames] = useState<string[]>([])
    const [scopeOptions, setScopeOptions] = useState<IScopeItem[]>([])
    // 样例数据
    const [exampleData, setExampleData] = useState<any>({})
    const { setViewChange } = useStatusContext()
    const listRef = useRef<any>()

    const toast = useMemo(() => {
        return microWidgetProps?.components?.toast || message
    }, [microWidgetProps])

    useEffect(() => {
        const names = subViews?.map((o) => trim(o.name))
        setSubViewNames(names)
    }, [subViews])

    useEffect(() => {
        setViewChange(subViewChange)
    }, [subViewChange])

    // 可选授权范围
    useEffect(() => {
        const indicatorOption = {
            key: data?.object_id,
            label: data?.object_name,
            value: data?.object_id,
            type: indicatorType,
        }
        const dimOptions = (subViews || [])
            .filter(
                (o) => !o.id?.startsWith(SubDimPrefix) && o.id !== active?.id, // 非新建和当前
            )
            .map((o) => ({
                key: o.id,
                label: o.name,
                value: o.id,
                type: ScopeType.Rule,
                data: o,
            }))
        setScopeOptions([indicatorOption, ...dimOptions])
    }, [subViews, data, active, indicatorType])

    // 加载指标、维度数据
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
                        row_filters: spec?.row_filters || {},
                    }),
                    id: metadata?.id,
                    name: spec?.name,
                    logic_view_id: spec?.indicator_id,
                }
                return obj
            })

            setSubViews(entries)
        } catch (error) {
            formatError(error, toast)
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
            formatError(error, toast)
        }
    }

    useEffect(() => {
        if (data?.object_id) {
            Promise.all([loadSubView(), loadColumns()])
        }
    }, [data])

    const handleResetCheck = (item: ISubView, mode: SubviewMode) => {
        if (item?.id?.startsWith(SubDimPrefix)) {
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
                toast.error(__('未找到指标'))
                return
            }

            const localItem = subViews?.find((o) =>
                o.id.startsWith(SubDimPrefix),
            )

            if (localItem) {
                toast.info(__('已存在待配置授权规则'))
                setActive(localItem)
                return
            }

            const newItem = {
                id: `${SubDimPrefix}_${Math.random().toString(36).slice(-6)}`,
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
            const { tempId } = info
            const newItems = subViews.filter((o) => o.id !== tempId)
            setSubViews(newItems)
            setActive(undefined)
            setSubViewChange(false)
            return
        }
        if (opt === SubViewOptType.Update) {
            setSubViewChange(false)
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
        if (active?.id?.startsWith(SubDimPrefix)) {
            return
        }
        setActive(nextActive)
    }

    const handleDataChange = (change: boolean) => {
        setSubViewChange(change)
    }

    return (
        <div className={styles['apply-dataview']}>
            <div className={styles['apply-dataview-left']}>
                <div className={styles['apply-dataview-left-list']}>
                    <div className={styles['logic-items']}>
                        <div className={styles['logic-items-title']}>
                            {__('指标')}
                        </div>
                        <div className={styles['logic-items-list']}>
                            <SubDimLabel
                                data={{
                                    name: data?.object_name,
                                    logic_view_id: data?.object_id,
                                    id: data?.object_id,
                                }}
                                indicatorType={indicatorType}
                                isSubView={false}
                                disabled={isChange || subViewChange}
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
                                {__('维度规则')}
                            </div>
                            <div
                                className={classnames(
                                    styles['logic-items-list'],
                                    styles['sub-views-box'],
                                )}
                            >
                                <div ref={listRef}>
                                    {subViews?.map((o) => (
                                        <SubDimLabel
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
                <div className={styles['apply-dataview-left-btn']}>
                    <Tooltip
                        title={
                            (isChange || subViewChange) &&
                            __('请先保存或取消本次${type}', {
                                type: __('申请'),
                            })
                        }
                    >
                        <Button
                            type="default"
                            disabled={isChange || subViewChange}
                            onClick={() => handleOpt(SubViewOptType.Add)}
                        >
                            {__('添加维度申请')}
                        </Button>
                    </Tooltip>
                </div>
            </div>
            <div className={styles['apply-dataview-right']}>
                {active ? (
                    <ApplySubDim
                        data={active}
                        dataView={data}
                        extendsVisitor={extendsVisitor}
                        cols={colFields}
                        onOperation={handleOpt}
                        onDataChange={handleDataChange}
                        names={subViewNames}
                        exampleData={exampleData}
                        onClose={onClose}
                        scopeOptions={scopeOptions}
                    />
                ) : (
                    <div className={styles['dataview-panel']}>
                        <div className={styles['dataview-panel-content']}>
                            {visitorComponent}
                        </div>
                        {bottomComponent && (
                            <div className={styles['dataview-panel-footer']}>
                                {bottomComponent}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(ApplyIndicator)
