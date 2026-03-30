import { memo, useContext, useEffect, useRef, useState } from 'react'
import { Button, message, Tooltip } from 'antd'
import classnames from 'classnames'

import { isEmpty, trim } from 'lodash'
import styles from './styles.module.less'
import { AppApiColored, ColAndRowColored } from '@/icons'
import {
    AssetTypeEnum,
    IDatasheetField,
    ISubView,
    deleteSubServices,
    formatError,
    getDatasheetViewDetails,
    getSubServices,
    getVirtualEngineExample,
    policyRemove,
    getExploreReport,
    detailServiceOverview,
} from '@/core'
import SubServiceManage, { SubServicePrefix } from './SubServiceManage'

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
import { IScopeItem } from './ColAndRowPanel'

const SubServiceLabel = ({
    data,
    isActive,
    isSubService = true,
    disabled = false,
    onClick,
}: {
    data: Partial<ISubView>
    onClick?: (item: Partial<ISubView>) => void
    isActive?: boolean
    disabled?: boolean
    isSubService?: boolean
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
                // !isActive && disabled && styles.disabled,
            )}
            onClick={() => handleClick()}
        >
            {isSubService ? (
                <ColAndRowColored className={styles.icon} />
            ) : (
                <AppApiColored className={styles.icon} fontSize={20} />
            )}
            <span className={styles.title} title={data.name || __('限定名称')}>
                {data.name || __('限定名称')}
            </span>
        </div>
    )
}

const ApiManage = ({
    isOwner,
    showAll, // 是否具备整体授权/分配权限
    data,
    isChange,
    extendsVisitor,
    visitorComponent,
    bottomComponent,
}: any) => {
    const [active, setActive] = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [subServices, setSubServices] = useState<ISubView[]>([]) // SUBSERVICES
    const [colFields, setColFields] = useState<IDatasheetField[]>()
    const [subServiceChange, setSubServiceChange] = useState<boolean>(false)
    const [openProbe, setOpenProbe] = useState<boolean>()
    const [subServiceNames, setSubServiceNames] = useState<string[]>([])
    // 样例数据
    const [exampleData, setExampleData] = useState<any>({})
    const { setViewChange } = useStatusContext()
    const listRef = useRef<any>()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [scopeOptions, setScopeOptions] = useState<IScopeItem[]>([])
    const [detailData, setDetailData] = useState<any>({})
    // 是否是注册接口
    const [isRegisterService, setIsRegisterService] = useState<boolean>(false)
    useEffect(() => {
        const names = subServices?.map((o) => trim(o.name))
        setSubServiceNames(names)
    }, [subServices])

    useEffect(() => {
        // 不展示全部视角下 如果当前没有选中，则选中第一个
        if (!showAll && subServices?.length > 0 && !active) {
            setActive(subServices[0])
        }
    }, [showAll, subServices, active])
    // 可选授权范围
    useEffect(() => {
        const viewOption = {
            key: data?.object_id,
            label: data?.object_name,
            value: data?.object_id,
            type: ScopeType.Api,
            disabled: !showAll,
        }
        const subServiceOptions = (subServices || [])
            .filter(
                (o) =>
                    !o.id?.startsWith(SubServicePrefix) && o.id !== active?.id, // 非新建和当前
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
        setScopeOptions([viewOption, ...subServiceOptions])
    }, [subServices, data, active, showAll])

    useEffect(() => {
        setViewChange(subServiceChange)
    }, [subServiceChange])

    // 判断是否有探查报告
    const judgeProbe = async (viewId: string) => {
        try {
            const res = await getExploreReport({ id: viewId })
            setOpenProbe(!!res)
        } catch (err) {
            setOpenProbe(false)
            // formatError(err, microWidgetProps?.components?.toast)
        }
    }

    // useEffect(() => {
    //     if (active && openProbe === undefined) {
    //         judgeProbe()
    //     }
    // }, [active])

    // 加载子视图、列数据
    const loadSubService = async () => {
        try {
            setLoading(true)
            const subServiceResult = await getSubServices({
                limit: 1000,
                offset: 1,
                service_id: data.object_id,
            })
            setSubServices(subServiceResult?.entries || [])
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    const loadColumns = async () => {
        try {
            const apiDetail = await detailServiceOverview(data.object_id)
            setDetailData(apiDetail)
            const isRegService =
                apiDetail?.service_info?.service_type === 'service_register'
            setIsRegisterService(isRegService)
            // 注册接口没有视图关联不查询探查报告等
            if (isRegService) {
                return
            }
            const colsResult = await getDatasheetViewDetails(
                apiDetail?.service_param?.data_view_id,
            )
            const columnFields = (colsResult?.fields || [])?.map((o) => ({
                ...o,
                data_type: getTypeText(o.data_type),
            }))
            judgeProbe(apiDetail?.service_param?.data_view_id)
            setColFields(columnFields)
            const [catalog, schema] =
                colsResult.view_source_catalog_name.split('.')
            if (isEmpty(exampleData)) {
                const exampleRes = await getVirtualEngineExample({
                    catalog,
                    schema,
                    table: colsResult?.technical_name,
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
            Promise.all([loadSubService(), loadColumns()])
        }
    }, [data?.object_id])

    const handleResetCheck = (item: ISubView, mode: SubviewMode) => {
        if (item?.id?.startsWith(SubServicePrefix)) {
            setSubServices(subServices?.filter((o) => o.id !== item?.id))
        }
        if (mode !== SubviewMode.Edit) {
            setActive(undefined)
        }
        setSubServiceChange(false)
    }

    const handleOpt = async (opt: SubViewOptType, info?: any) => {
        if (opt === SubViewOptType.Add) {
            if (!data?.object_id) {
                ;(microWidgetProps?.components?.toast || message).error(
                    __('未找到接口'),
                )
                return
            }

            const localItem = subServices?.find((o) =>
                o.id.startsWith(SubServicePrefix),
            )

            if (localItem) {
                ;(microWidgetProps?.components?.toast || message).info(
                    __('已存在待配置授权规则'),
                )
                setActive(localItem)
                return
            }

            const newItem = {
                id: `${SubServicePrefix}_${Math.random()
                    .toString(36)
                    .slice(-6)}`,
                service_id: data?.object_id,
                auth_scope_id: data?.object_id, // 默认授权范围
                name: '',
                detail: '',
            }
            setSubServices((prev) => [...prev, newItem])
            setActive(newItem)
            setSubServiceChange(true)

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
            const newItems = subServices.map((o) =>
                o.id === tempId ? item : o,
            )
            setSubServices(newItems)
            setActive(item)
            setSubServiceChange(false)
            return
        }
        if (opt === SubViewOptType.Update) {
            const { id, item, updateType } = info
            if ([UpdateOptType.All, UpdateOptType.Rule].includes(updateType)) {
                const newItems = subServices.map((o) =>
                    o.id === id ? { ...item } : o,
                )
                setSubServices(newItems)
                setActive(item)
            }
            setSubServiceChange(false)
            return
        }
        if (opt === SubViewOptType.Delete) {
            const { id } = info
            try {
                ReturnConfirmModal({
                    title: __('确定要删除授权限定规则吗？'),
                    content: __(
                        '删除后该授权规则、及赋予全部访问者的权限将均被删除 ，请确认操作。',
                    ),
                    cancelText: __('取消'),
                    okText: __('确定'),
                    onOK: async () => {
                        await policyRemove({
                            object_id: id,
                            object_type: AssetTypeEnum.SubService,
                        })
                        await deleteSubServices(id)
                        setActive(undefined)
                        const newItems = subServices.filter((o) => o.id !== id)
                        setSubServices(newItems)
                        setSubServiceChange(false)
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
        if (isChange || subServiceChange) {
            return
        }
        if (active?.id?.startsWith(SubServicePrefix)) {
            return
        }
        setActive(nextActive)
    }

    const handleDataChange = (change: boolean) => {
        setSubServiceChange(change)
    }

    return (
        <div className={styles['dataview-manage']}>
            <div className={styles['dataview-manage-left']}>
                <div className={styles['dataview-manage-left-list']}>
                    <div className={styles['logic-items']} hidden={!showAll}>
                        <div className={styles['logic-items-title']}>
                            {__('接口')}
                        </div>
                        <div className={styles['logic-items-list']}>
                            <SubServiceLabel
                                data={{
                                    name: data?.object_name,
                                    service_id: data?.object_id,
                                    id: data?.object_id,
                                }}
                                isSubService={false}
                                disabled={isChange || subServiceChange}
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
                                visibility: !subServices?.length
                                    ? 'hidden'
                                    : 'visible',
                            }}
                        >
                            <div className={styles['logic-items-title']}>
                                {__('授权限定规则')}
                            </div>
                            <div
                                className={classnames(
                                    styles['logic-items-list'],
                                    styles['sub-views-box'],
                                )}
                            >
                                <div ref={listRef}>
                                    {subServices?.map((o) => (
                                        <SubServiceLabel
                                            key={o.id}
                                            data={o}
                                            disabled={
                                                isChange || subServiceChange
                                            }
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
                            isRegisterService
                                ? __('注册接口暂不支持添加限定授权')
                                : (isChange || subServiceChange) &&
                                  __('请先保存或取消本次${type}', {
                                      type: __('授权'),
                                  })
                        }
                    >
                        <Button
                            type="default"
                            disabled={
                                isChange ||
                                subServiceChange ||
                                isRegisterService
                            }
                            onClick={() => handleOpt(SubViewOptType.Add)}
                        >
                            {__('添加限定授权')}
                        </Button>
                    </Tooltip>
                </div>
            </div>
            <div className={styles['dataview-manage-right']}>
                {active ? (
                    <SubServiceManage
                        isOwner={isOwner}
                        data={active}
                        extendsVisitor={extendsVisitor}
                        cols={colFields}
                        onOperation={handleOpt}
                        onDataChange={handleDataChange}
                        names={subServiceNames}
                        exampleData={exampleData}
                        openProbe={openProbe}
                        formId={data.object_id}
                        scopeOptions={scopeOptions}
                        detailData={detailData}
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

export default memo(ApiManage)
