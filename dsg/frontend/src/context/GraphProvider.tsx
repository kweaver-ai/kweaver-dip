import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { isEqual } from 'lodash'
import { NodeType } from '@/components/DimensionModel/components/Nodes/config'
import { ViewMode } from '@/components/DimensionModel/const'

type MetaData = any
type IOperation = Record<string, any>

type OptType = 'ADD' | 'DELETE'

interface IGraphContext {
    meta: MetaData
    setMeta: Dispatch<SetStateAction<MetaData>>
    mode: ViewMode
    setMode: Dispatch<SetStateAction<ViewMode>>
    expand: boolean
    setExpand: Dispatch<SetStateAction<boolean>>
    hasErrorSure: boolean
    setHasErrorSure: Dispatch<SetStateAction<boolean>>
    isPanelChanged: boolean
    setIsPanelChanged: Dispatch<SetStateAction<boolean>>
    toggleExpand: () => void
    config: any
    setConfig: Dispatch<SetStateAction<any>>
    errorTypeFields: string[]
    fieldIdTypes: Record<string, any>
    optErrorTypeField: (opt: OptType, id: string, nodeType: NodeType) => void
    setErrorTypeFields: Dispatch<SetStateAction<any>>
    isChanged: boolean
    setLastConfig: Dispatch<SetStateAction<any>>
    removeDimById: (id: string) => void
    operationRef: IOperation
    transformData: any
    checkAndUpdateFields: (
        id: string,
        nodeType: NodeType,
        listColumns: any[],
    ) => void
    tableMap: MetaData
    setTableMap: Dispatch<SetStateAction<MetaData>>
    dimModelId: string
    setDimModelId: Dispatch<SetStateAction<string>>
    submittedAlarms: Set<string>
    addSubmittedAlarm: (alarmKey: string) => void
    hasSubmittedAlarm: (alarmKey: string) => boolean
}

const initContext: IGraphContext = {
    meta: null,
    setMeta: () => {},
    mode: ViewMode.VIEW,
    setMode: () => {},
    expand: false,
    setExpand: () => {},
    hasErrorSure: false,
    setHasErrorSure: () => {},
    isPanelChanged: false,
    setIsPanelChanged: () => {},
    toggleExpand: () => {},
    config: null,
    setConfig: () => {},
    errorTypeFields: [],
    fieldIdTypes: {},
    setErrorTypeFields: () => {},
    optErrorTypeField: () => {},
    isChanged: false,
    setLastConfig: () => {},
    removeDimById: () => {},
    operationRef: { current: {} },
    transformData: {},
    checkAndUpdateFields: () => {},
    tableMap: {},
    setTableMap: () => {},
    dimModelId: '',
    setDimModelId: () => {},
    submittedAlarms: new Set(),
    addSubmittedAlarm: () => {},
    hasSubmittedAlarm: () => false,
}

const GraphContext = createContext<IGraphContext>(initContext)

export const useGraphContext = () => useContext<IGraphContext>(GraphContext)

export const GraphProvider = ({ children }: { children: ReactNode }) => {
    // 当前选中关联项,用以同步关联选中  规定meta =>  [表ID:字段ID]
    const [meta, setMeta] = useState<MetaData>()
    const [mode, setMode] = useState<any>(ViewMode.VIEW)
    const [config, setConfig] = useState<any>()
    const [isPanelChanged, setIsPanelChanged] = useState<boolean>(false)
    const [lastConfig, setLastConfig] = useState<any>()
    const [expand, setExpand] = useState<any>(false)
    const [fieldIdTypes, setFiledIdTypes] = useState<Record<string, any>>({})
    const [errorTypeFields, setErrorTypeFields] = useState<string[]>([])
    const operationRef = useRef<IOperation>({})
    const [tableMap, setTableMap] = useState<any>({})
    const [hasErrorSure, setHasErrorSure] = useState<boolean>(false)
    const [dimModelId, setDimModelId] = useState<string>('')
    const [submittedAlarms, setSubmittedAlarms] = useState<Set<string>>(
        new Set(),
    )
    const isChanged = useMemo(() => {
        return !isEqual(config, lastConfig)
    }, [config, lastConfig])

    // 添加已提交告警记录
    const addSubmittedAlarm = useCallback((alarmKey: string) => {
        setSubmittedAlarms((prev) => new Set(prev).add(alarmKey))
    }, [])

    // 检查告警是否已提交
    const hasSubmittedAlarm = useCallback(
        (alarmKey: string) => {
            return submittedAlarms.has(alarmKey)
        },
        [submittedAlarms],
    )

    // 当模型ID变化时，清空告警记录
    useEffect(() => {
        setSubmittedAlarms(new Set())
    }, [dimModelId])

    const removeDimById = (dimTableId: string) => {
        const { dim_field_config } = config || {}
        if (dim_field_config?.length) {
            const ret = (dim_field_config || [])?.filter(
                (o) => o.dim_table_id !== dimTableId,
            )
            setConfig((prev) => ({ ...prev, dim_field_config: ret }))
        }
    }

    const optErrorTypeField = (
        opt: OptType,
        metaId: string,
        nodeType: NodeType,
    ) => {
        const metaIds = [metaId]
        if (nodeType === NodeType.Fact) {
            const [factId, factFieldId] = metaId.split(':')

            const item = (config?.dim_field_config || []).find(
                (o) =>
                    config.fact_table_id === factId &&
                    o.fact_table_join_field_id === factFieldId,
            )

            // 关联维度表字段
            if (item) {
                metaIds.push(
                    `${item.dim_table_id}:${item.dim_table_join_field_id}`,
                )
            }
        } else {
            const [dimId, dimFieldId] = metaId.split(':')
            const item = (config?.dim_field_config || []).find(
                (o) =>
                    o.dim_table_id === dimId &&
                    o.dim_table_join_field_id === dimFieldId,
            )
            if (item) {
                metaIds.push(
                    `${config.fact_table_id}:${item.fact_table_join_field_id}`,
                )
            }
        }

        switch (opt) {
            case 'ADD':
                setErrorTypeFields((prev) => [
                    ...prev,
                    ...metaIds.filter((id) => !errorTypeFields.includes(id)),
                ])
                break
            case 'DELETE':
                setErrorTypeFields(
                    errorTypeFields.filter(
                        (k: string) => !metaIds?.includes(k),
                    ),
                )
                break
            default:
                break
        }
    }

    // 校验表与字段信息一致性 否则更新config内容 tips: 由于数据目录表加载问题暂不考虑同步问题, 仅考虑表字段信息的同步
    const checkAndUpdateFields = (
        tableId: string,
        nodeType: NodeType,
        linkColumns: any[],
    ) => {
        if (!config || !linkColumns?.length) {
            return
        }
        // setCheckedIds((prev) => [...prev, tableId])
        const { dim_field_config, ...originFact } = config

        const typeKey = nodeType === NodeType.Fact ? 'fact' : 'dim'

        const updatedDimConfig = (dim_field_config || []).reduce(
            (prev, cur) => {
                const item = linkColumns?.find(
                    (o) => o.id === cur?.[`${typeKey}_table_join_field_id`],
                )

                return [
                    ...prev,
                    item
                        ? {
                              ...cur,
                              [`${typeKey}_table_join_field_cn_name`]:
                                  item.business_name,
                              [`${typeKey}_table_join_field_en_name`]:
                                  item.technical_name,
                              [`${typeKey}_table_join_field_id`]: item.id,
                              [`${typeKey}_table_join_field_data_format`]:
                                  item.data_type,
                          }
                        : cur,
                ]
            },
            [],
        )

        if (!isEqual(config.dim_field_config, updatedDimConfig)) {
            setConfig((prev) => ({
                ...prev,
                dim_field_config: updatedDimConfig,
            }))
        }
    }

    const transformData = useMemo(() => {
        if (config) {
            const { dim_field_config, ...originFact } = config

            const targetDimensions = (dim_field_config || []).map(
                (originDim, idx) => ({
                    id: originDim.dim_table_id,
                    parentId: originFact.fact_table_id,
                    nodeType: NodeType.Dimension,
                    side: idx % 2 === 0 ? 'right' : 'left',
                    linkMap: {
                        [`${originDim.dim_table_id}:${originDim.dim_table_join_field_id}`]: `${originFact.fact_table_id}:${originDim.fact_table_join_field_id}`,
                    },
                    dataInfo: {
                        title: originDim.dim_table_cn_name,
                        dimFieldId: originDim.dim_table_join_field_id,
                        dimFieldCNName: originDim.dim_table_join_field_cn_name,
                        dimFieldType:
                            originDim.dim_table_join_field_data_format,
                        factFieldType:
                            originDim.fact_table_join_field_data_format,
                    },
                }),
            )
            const factLinkMap = dim_field_config?.reduce((prev, cur) => {
                return {
                    ...prev,
                    [`${originFact.fact_table_id}:${cur.fact_table_join_field_id}`]: `${cur.dim_table_id}:${cur.dim_table_join_field_id}`,
                }
            }, {})

            const targetFact = {
                id: originFact.fact_table_id,
                nodeType: NodeType.Fact,
                linkMap: factLinkMap,
                dataInfo: {
                    title: originFact.fact_table_cn_name,
                },
                children: targetDimensions,
            }

            // 统计维度字段ID与类型  表现: {'表ID:字段ID': 字段类型}
            const fieldTypeKV = (dim_field_config || []).reduce((prev, cur) => {
                const curItem = {
                    [`${originFact.fact_table_id}:${cur.fact_table_join_field_id}`]:
                        cur.fact_table_join_field_data_format,
                    [`${cur.dim_table_id}:${cur.dim_table_join_field_id}`]:
                        cur.dim_table_join_field_data_format,
                }

                return { ...prev, ...curItem }
            }, {})
            setFiledIdTypes(fieldTypeKV)

            return targetFact
        }
        return undefined
    }, [config])

    const toggleExpand = useCallback(() => {
        setExpand(!expand)
    }, [expand, setExpand])

    const values = useMemo(
        () => ({
            meta,
            setMeta,
            mode,
            setMode,
            operationRef,
            config,
            setConfig,
            isChanged,
            setLastConfig,
            expand,
            setExpand,
            toggleExpand,
            removeDimById,
            transformData,
            errorTypeFields,
            fieldIdTypes,
            setErrorTypeFields,
            optErrorTypeField,
            isPanelChanged,
            setIsPanelChanged,
            checkAndUpdateFields,
            tableMap,
            setTableMap,
            hasErrorSure,
            setHasErrorSure,
            dimModelId,
            setDimModelId,
            submittedAlarms,
            addSubmittedAlarm,
            hasSubmittedAlarm,
        }),
        [
            meta,
            setMeta,
            mode,
            setMode,
            expand,
            setExpand,
            transformData,
            operationRef,
            config,
            setConfig,
            isChanged,
            setLastConfig,
            removeDimById,
            toggleExpand,
            errorTypeFields,
            fieldIdTypes,
            setErrorTypeFields,
            optErrorTypeField,
            isPanelChanged,
            setIsPanelChanged,
            checkAndUpdateFields,
            tableMap,
            setTableMap,
            hasErrorSure,
            setHasErrorSure,
            dimModelId,
            setDimModelId,
            submittedAlarms,
            addSubmittedAlarm,
            hasSubmittedAlarm,
        ],
    )
    return (
        <GraphContext.Provider value={values}>{children}</GraphContext.Provider>
    )
}
