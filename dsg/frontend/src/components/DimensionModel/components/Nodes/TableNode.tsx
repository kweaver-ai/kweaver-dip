import { CaretRightOutlined, CloseCircleFilled } from '@ant-design/icons'
import { Node as X6Node } from '@antv/x6'
import { useDebounce } from 'ahooks'
import { Tooltip } from 'antd'
import classnames from 'classnames'
import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Loader, SearchInput, Empty } from '@/ui'
import { useGraphContext } from '@/context'
import { PullDownOutlined } from '@/icons'
import TableSearchOutlined from '@/icons/TableSearchOutlined'
import TableSettingOutlined from '@/icons/TableSettingOutlined'
import { addDimensionModelAlarm } from '@/core/apis/indicatorManagement'
import type { IDimModelAlarmItem } from '@/core/apis/indicatorManagement/index.d'

import { ViewMode } from '../../const'
import {
    calcPortArgs,
    convertColumn,
    reSortFields,
    useCatalogColumn,
} from '../../helper'
import __ from '../../locale'
import BaseNode from './BaseNode'
import {
    DEFAULT_PAGINATION,
    DEFAULT_THEME,
    NodeParams,
    NodeType,
    PortGroupType,
    PortPositionEnum,
    TableTheme,
} from './config'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import { formatError } from '@/core'

type IPagination = {
    current: number
    total: number
    canPrev: boolean
    canNext: boolean
}

interface IPaginationProps {
    /**
     * 分页数据
     */
    data: IPagination
    /**
     * 点击上一页
     */
    onPrev?: () => void
    /**
     * 点击下一页
     */
    onNext?: () => void
}

/**
 * 分页组件
 */
const Pagination = memo(
    ({ data = DEFAULT_PAGINATION, onPrev, onNext }: IPaginationProps) => {
        return (
            <div className={styles['pagination-wrapper']}>
                {onPrev && (
                    <div
                        className={classnames({
                            [styles['pagination-wrapper-prev']]: true,
                            [styles.disabled]: !data.canPrev,
                        })}
                        onClick={onPrev}
                    >
                        <PullDownOutlined />
                    </div>
                )}
                <div className={styles['pagination-wrapper-page']}>
                    {data.current}/{data.total}
                </div>
                {onNext && (
                    <div
                        className={classnames({
                            [styles['pagination-wrapper-next']]: true,
                            [styles.disabled]: !data.canNext,
                        })}
                        onClick={onNext}
                    >
                        <PullDownOutlined />
                    </div>
                )}
            </div>
        )
    },
)

/**
 * 属性渲染校验
 */
const ValidateRender = (
    data: any,
    isLink: boolean,
    isErrorType: boolean,
    RenderFunction: React.FunctionComponent<any>,
) => {
    if (!['string', 'number'].includes(typeof data) && !RenderFunction) {
        throw new Error('You can implement ItemRender')
    }
    return RenderFunction ? (
        <RenderFunction item={data} isLink={isLink} isErrorType={isErrorType} />
    ) : (
        data
    )
}

export type ITableNode = {
    /**
     * 属性唯一key 默认 id
     */
    rowKey?: string
    /**
     * 节点数据
     */
    node: X6Node
    /**
     * 自定义属性渲染方案
     */
    ItemRender: React.FunctionComponent<any>
    /**
     * 每页大小 默认10
     */
    size?: number
}

/**
 * 自定义表单节点组件
 * @param {ITableNode} props
 * @returns
 */
function TableNode(props: ITableNode) {
    const {
        meta,
        setMeta,
        expand,
        setExpand,
        mode,
        removeDimById,
        config,
        setConfig,
        errorTypeFields,
        fieldIdTypes,
        optErrorTypeField,
        checkAndUpdateFields,
        dimModelId,
        addSubmittedAlarm,
        hasSubmittedAlarm,
    } = useGraphContext()
    const { rowKey = 'id', node, ItemRender, size = 10 } = props
    const { data }: any = node
    const { id, dataInfo, expand: nodeExpand, nodeType, side, linkMap } = data
    const { title, dimFieldType, dimFieldCNName } = dataInfo
    const [curFields, setCurFields] = useState<any[]>()
    const [isSearch, setIsSearch] = useState<boolean>(false)
    const [isExpand, setIsExpand] = useState<boolean>(nodeExpand)
    // 选中字段key
    const [selectedKey, setSelectedKey] = useState<any>()
    const [searchKey, setSearchKey] = useState<string>('')
    const debounceSK = useDebounce(searchKey, { wait: 300 })
    const [pagination, setPagination] =
        useState<IPagination>(DEFAULT_PAGINATION)
    // 暂存上次分页数据,以便搜索结束恢复
    const lastPaginationRef = useRef<any>()
    const { loading, getColumnsById } = useCatalogColumn()
    // 关联ID集合
    const linkIds = useMemo(() => {
        return Object.keys(linkMap ?? {})?.map((k) => k.split(':')[1]) ?? []
    }, [linkMap])

    // 字段重排,关联置前
    const items = useMemo(
        () => reSortFields(curFields, linkIds),
        [curFields, linkIds],
    )

    const validateFieldExistence = useCallback(
        (fields: any[]) => {
            const currentFieldIds = new Set(fields?.map((o) => o.id))
            // 只检查关联字段（事实表和维度表关联绑定的字段）
            linkIds?.forEach((linkedFieldId) => {
                const isFieldMissing = !currentFieldIds.has(linkedFieldId)
                const fullFieldId = `${id}:${linkedFieldId}`
                // 存在字段（表存在）
                if (fields?.length > 0 && isFieldMissing) {
                    // 关联字段被删除，生成字段删除告警
                    submitAlarmForFieldDeletion(
                        nodeType,
                        id,
                        linkedFieldId,
                        fullFieldId,
                    )
                }
            })
        },
        [
            id,
            linkIds,
            config,
            dimModelId,
            mode,
            dataInfo,
            hasSubmittedAlarm,
            addSubmittedAlarm,
        ],
    )

    const validateFieldType = useCallback(
        (fields: any[]) => {
            const ids = Object.keys(fieldIdTypes)
            fields
                ?.filter((o) => ids?.some((it) => it === `${id}:${o.id}`))
                .forEach((it) => {
                    if (it.type !== fieldIdTypes[`${id}:${it.id}`]) {
                        // 添加字段类型错误到状态
                        optErrorTypeField('ADD', `${id}:${it.id}`, nodeType)
                        // 生成字段类型变更告警
                        submitAlarmForFieldTypeChange(
                            nodeType,
                            id,
                            it.title,
                            it.id,
                        )
                    }
                })
        },
        [id, fieldIdTypes, optErrorTypeField],
    )

    const getFields = async (tableId: string) => {
        const result = await getColumnsById(tableId)
        const columns = result.data
        const list = columns.map(convertColumn)
        setCurFields(list)

        // 先验证字段是否存在
        validateFieldExistence(list)
        // 再验证字段类型是否变更
        validateFieldType(list)
        checkAndUpdateFields(tableId, nodeType, columns)

        if (!result.state) {
            // 表不存在，生成告警
            await submitAlarmForTableDeletion(nodeType, title)
            // 事实表下线
            if (nodeType === NodeType.Fact) {
                setConfig(undefined)
            }
            // 维度表下线
            if (nodeType === NodeType.Dimension) {
                removeDimById(id)
            }
        }
    }

    useEffect(() => {
        if (!id) {
            setCurFields([])
        } else if (isExpand) {
            getFields(id)
        } else if (nodeType === NodeType.Dimension && !curFields?.length) {
            setCurFields([
                {
                    id: dataInfo.dimFieldId,
                    title: dimFieldCNName,
                    type: dimFieldType,
                },
            ])
        }
    }, [isExpand, id, nodeType, dataInfo])

    useEffect(() => {
        if (!meta?.length) {
            setSelectedKey(undefined)
            return
        }
        // 判断是否为当前表
        const tableRowId = meta?.find((o) => o.startsWith(`${data.id}:`))
        const key = tableRowId ? tableRowId?.split(':')[1] : undefined
        setSelectedKey(key)
    }, [meta])

    // 处理分页
    useEffect(() => {
        if (items?.length) {
            const total = Math.ceil((items?.length as number) / size)
            setPagination((prev) => ({
                ...prev,
                total,
                canNext: prev.current !== total && items?.length > size,
            }))
        }
    }, [items])

    // 主题设置
    const theme = useMemo(
        () => ({
            primary: TableTheme?.[nodeType] || DEFAULT_THEME,
            secondary: `${TableTheme?.[nodeType] || DEFAULT_THEME}30`,
        }),
        [nodeType],
    )

    // 数据分页计算  list为全部数据
    const calcLineItems = useCallback(
        (list: any[]) => {
            const { current } = pagination
            const totalSize = list?.length ?? 0
            const start = (current - 1) * size
            const count = current * size <= totalSize ? size : totalSize % size
            const end = start + count
            return list?.slice(start, end)
        },
        [pagination, size],
    )

    // 计算展开页面数据
    const renderItems = useMemo(
        () => calcLineItems(items || []),
        [calcLineItems, items],
    )

    useEffect(() => {
        if (debounceSK) {
            setPagination(DEFAULT_PAGINATION)
        }
    }, [debounceSK])

    // 计算搜索结果数据
    const searchItems = useMemo(() => {
        if (debounceSK) {
            const searchReult = items?.filter((o) =>
                o.title.includes(debounceSK),
            )
            return calcLineItems(searchReult || [])
        }
        return renderItems
    }, [items, renderItems, calcLineItems, debounceSK])

    // 计算收缩页面数据
    const relativeItems = useMemo(() => {
        // 事实表不保留关联属性
        if (nodeType === NodeType.Fact) {
            return undefined
        }
        // 维度表保留关联属性
        const linkKey = Object.keys(linkMap ?? {}).map((k) => k.split(':')[1])
        return items?.filter((o) => linkKey?.includes(o.id))
    }, [items, nodeType])

    // 设置表高
    const TableHeight: any = useMemo(() => {
        const HHeader = 45
        const HFooter = 20

        const HBottom = items?.length
            ? searchKey
                ? searchItems?.length
                    ? HFooter +
                      (searchItems?.length ?? 0) * NodeParams.lineHeight
                    : NodeParams.emptyHeight
                : HFooter + (renderItems?.length ?? 0) * NodeParams.lineHeight
            : NodeParams.emptyHeight

        return {
            width: NodeParams.width,
            height: isExpand
                ? HHeader + HBottom
                : nodeType === NodeType.Fact
                ? 45
                : 75,
        }
    }, [
        isExpand,
        items?.length,
        searchKey,
        searchItems?.length,
        renderItems?.length,
    ])

    // 节点参数同步,触发重新布局
    useEffect(() => {
        node.replaceData({
            ...node.data,
            width: TableHeight.width,
            height: TableHeight.height,
            expand: isExpand,
        })
    }, [TableHeight, isExpand])

    // 属性行渲染
    const LineRender = useCallback(
        (list: any[]) =>
            (list || []).map((item: any) => (
                <div
                    key={item?.[rowKey]}
                    className={classnames({
                        [styles['line-selected']]:
                            selectedKey === item?.[rowKey],
                        [styles['line-error']]: errorTypeFields?.includes(
                            `${id}:${item?.[rowKey]}`,
                        ),
                    })}
                    onClick={() => handleSelectField(item)}
                >
                    {ValidateRender(
                        item,
                        linkIds.includes(item?.[rowKey]),
                        errorTypeFields.includes(`${id}:${item?.[rowKey]}`),
                        ItemRender,
                    )}
                </div>
            )),
        [ItemRender, linkIds, selectedKey, rowKey, errorTypeFields, id],
    )

    // 内容数据
    const lineList = useMemo(
        () => (isExpand ? renderItems : relativeItems),
        [isExpand, renderItems, relativeItems],
    )

    const lineItems = useMemo(() => {
        return debounceSK ? searchItems : lineList
    }, [debounceSK, searchItems, lineList])

    useEffect(() => {
        const portsArgs = Object.keys(linkMap ?? {})?.map((rowId, idx) => {
            const [_, attrId] = rowId.split(':')
            const position: PortPositionEnum =
                side === 'left' || (nodeType === NodeType.Fact && idx % 2 === 0)
                    ? PortPositionEnum.Right
                    : PortPositionEnum.Left
            return {
                group: PortGroupType.ModelLink,
                id: rowId,
                args: calcPortArgs(lineItems || [], attrId, position),
            }
        })
        // 更新桩
        const oldPorts = node.getPorts()
        node.removePorts(oldPorts, { silent: true })
        node.addPorts(portsArgs)
    }, [lineItems, linkMap])

    // 选中字段
    const handleSelectField = useCallback(
        (item: any) => {
            // 二次取消
            const key =
                selectedKey === item?.[rowKey] ? undefined : item?.[rowKey]
            setSelectedKey(key)

            const linkKey = `${data.id}:${key}`
            const foreignKey = linkIds.includes(key)
                ? [linkMap[linkKey], linkKey]
                : key
                ? [linkKey]
                : undefined

            setMeta(foreignKey)
        },
        [selectedKey, rowKey],
    )

    // 翻页操作
    const handleOpt = (isNext: boolean) => {
        const { current, canPrev, canNext } = pagination
        if (!(isNext ? canNext : canPrev)) {
            return
        }
        const newCurrent = isNext ? current + 1 : current - 1
        setPagination((prev: any) => ({
            ...prev,
            current: newCurrent,
            canPrev: newCurrent !== 1,
            canNext: newCurrent !== prev.total,
        }))
    }

    // 取消搜素
    const handleCancelSearch = () => {
        setPagination(lastPaginationRef.current)
        setSearchKey('')
        setIsSearch(false)
    }

    /**
     * 提交表删除告警
     */
    const submitAlarmForTableDeletion = async (
        tableType: NodeType,
        tableName: string,
    ) => {
        if (!dimModelId || mode !== ViewMode.VIEW) {
            return
        }

        // 生成告警唯一标识
        const alarmKey = `table_${tableType}_${id}_deleted`

        // 检查是否已提交过相同告警
        if (hasSubmittedAlarm(alarmKey)) {
            return
        }

        try {
            const alarmItem: IDimModelAlarmItem = {
                alarm_type: tableType === NodeType.Fact ? 0 : 1, // 0:事实表 1:维度表
                alarm_table: tableName,
                technical_name: tableName,
                alarm_reason: 0, // 0:被删除
            }

            await addDimensionModelAlarm({
                model_id: dimModelId,
                save: [alarmItem],
            })
            // 记录已提交的告警
            addSubmittedAlarm(alarmKey)
        } catch (error) {
            formatError(error)
        }
    }

    /**
     * 提交字段删除告警（仅针对关联字段）
     */
    const submitAlarmForFieldDeletion = async (
        tableType: NodeType,
        tableId: string,
        fieldId: string,
        fullFieldId: string,
    ) => {
        if (!dimModelId || mode !== ViewMode.VIEW) {
            return
        }

        // 生成告警唯一标识
        const alarmKey = `field_${tableType}_${tableId}_${fieldId}_deleted`

        // 检查是否已提交过相同告警，避免重复告警
        if (hasSubmittedAlarm(alarmKey)) {
            return
        }

        try {
            // 从配置中获取关联字段的业务名称
            let fieldName = fieldId
            if (config?.dim_field_config) {
                if (tableType === NodeType.Fact) {
                    // 事实表关联字段
                    const dimConfig = config.dim_field_config.find(
                        (item) => item.fact_table_join_field_id === fieldId,
                    )
                    if (dimConfig) {
                        fieldName =
                            dimConfig.fact_table_join_field_cn_name || fieldId
                    }
                } else {
                    // 维度表关联字段
                    const dimConfig = config.dim_field_config.find(
                        (item) =>
                            item.dim_table_id === tableId &&
                            item.dim_table_join_field_id === fieldId,
                    )
                    if (dimConfig) {
                        fieldName =
                            dimConfig.dim_table_join_field_cn_name || fieldId
                    }
                }
            }

            const alarmItem: IDimModelAlarmItem = {
                alarm_type: tableType === NodeType.Fact ? 2 : 3, // 2:维度字段（事实表中字段） 3:关联字段（维度表中字段）
                alarm_table: dataInfo.title || '',
                technical_name: fieldName,
                alarm_reason: 0, // 0:被删除
            }

            await addDimensionModelAlarm({
                model_id: dimModelId,
                save: [alarmItem],
            })

            // 记录已提交的告警
            addSubmittedAlarm(alarmKey)
        } catch (error) {
            formatError(error)
        }
    }

    /**
     * 提交字段类型变更告警
     */
    const submitAlarmForFieldTypeChange = async (
        tableType: NodeType,
        tableId: string,
        fieldName: string,
        fieldId: string,
    ) => {
        if (!dimModelId || mode !== ViewMode.VIEW) {
            return
        }

        // 生成告警唯一标识
        const alarmKey = `field_${tableType}_${id}_${fieldId}_type_changed`

        // 检查是否已提交过相同告警
        if (hasSubmittedAlarm(alarmKey)) {
            return
        }

        try {
            const alarmItem: IDimModelAlarmItem = {
                alarm_type: tableType === NodeType.Fact ? 2 : 3, // 2:维度字段 3:关联字段
                alarm_table: dataInfo.title || '',
                technical_name: fieldName || fieldId,
                alarm_reason: 1, // 1:数据类型变更
            }

            await addDimensionModelAlarm({
                model_id: dimModelId,
                save: [alarmItem],
            })

            // 记录已提交的告警
            addSubmittedAlarm(alarmKey)
        } catch (error) {
            formatError(error)
        }
    }

    // 内容渲染
    const ContentRender = useMemo(
        () =>
            ((nodeType === NodeType.Fact || lineList?.length) &&
                searchItems?.length) ||
            curFields === undefined ||
            !isExpand ? (
                LineRender(lineItems || [])
            ) : (
                <div className={styles.empty}>
                    <Empty
                        iconHeight={96}
                        desc={
                            debounceSK && !searchItems?.length
                                ? undefined
                                : __('暂无数据')
                        }
                        iconSrc={
                            debounceSK && !searchItems?.length
                                ? undefined
                                : dataEmpty
                        }
                    />
                </div>
            ),
        [LineRender, isExpand, lineList, lineItems, debounceSK, nodeType],
    )

    return (
        <BaseNode>
            <div
                className={styles['table-wrapper']}
                style={{ borderColor: theme.secondary }}
            >
                <div
                    className={styles['table-wrapper-line']}
                    style={{ background: theme.primary }}
                />
                <div
                    className={styles['table-wrapper-title']}
                    style={{
                        borderBottomColor:
                            !isExpand && nodeType === NodeType.Fact
                                ? 'transparent'
                                : theme.secondary,
                    }}
                >
                    {isSearch ? (
                        <div className={styles['table-wrapper-title-search']}>
                            <TableSearchOutlined
                                style={{
                                    marginRight: '0',
                                    marginLeft: '4px',
                                    cursor: 'default',
                                }}
                            />
                            <SearchInput
                                autoFocus
                                placeholder={__('搜索字段名称')}
                                allowClear={false}
                                showIcon={false}
                                onChange={(e: any) => {
                                    setSearchKey(e.target.value?.trim())
                                }}
                                onBlur={() =>
                                    !searchKey && handleCancelSearch()
                                }
                            />
                            <Tooltip placement="top" title={__('取消搜索')}>
                                <CloseCircleFilled
                                    style={{
                                        color: 'rgba(0,0,0,0.45)',
                                        fontSize: '12px',
                                    }}
                                    onClick={handleCancelSearch}
                                />
                            </Tooltip>
                        </div>
                    ) : (
                        <>
                            <div
                                className={classnames({
                                    [styles['table-wrapper-title-expand']]:
                                        true,
                                    [styles.expand]: isExpand,
                                })}
                                onClick={() => {
                                    setIsExpand(!isExpand)
                                }}
                            >
                                <CaretRightOutlined />
                            </div>
                            <div
                                className={styles['table-wrapper-title-text']}
                                title={title}
                                onClick={() => {
                                    setIsExpand(!isExpand)
                                }}
                            >
                                {title}
                            </div>
                        </>
                    )}

                    <div className={styles['table-wrapper-title-opt']}>
                        {nodeType === NodeType.Fact &&
                            mode !== ViewMode.VIEW &&
                            mode !== ViewMode.ONLY_VIEW &&
                            !isSearch && (
                                <div
                                    className={styles['btn-icon']}
                                    style={{
                                        opacity: expand ? 0.25 : 1,
                                    }}
                                    onClick={() => !expand && setExpand(true)}
                                >
                                    <Tooltip
                                        placement="top"
                                        title={__('配置维度模型')}
                                    >
                                        <TableSettingOutlined
                                            disabled={expand}
                                        />
                                    </Tooltip>
                                </div>
                            )}

                        {isExpand && !isSearch && (
                            <div
                                className={styles['btn-icon']}
                                onClick={() => {
                                    setIsSearch(true)
                                    lastPaginationRef.current = pagination
                                }}
                            >
                                <Tooltip placement="top" title={__('搜索')}>
                                    <TableSearchOutlined />
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles['table-wrapper-fields']}>
                    {loading ? (
                        <div style={{ padding: '24px 0' }}>
                            <Loader />
                        </div>
                    ) : (
                        ContentRender
                    )}
                </div>
                {isExpand &&
                    (searchItems?.length ||
                        (nodeType === NodeType.Fact &&
                            !!lineItems?.length)) && (
                        <Pagination
                            data={pagination}
                            onPrev={() => handleOpt(false)}
                            onNext={() => handleOpt(true)}
                        />
                    )}
            </div>
        </BaseNode>
    )
}

export default memo(TableNode)
