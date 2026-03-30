import {
    DragEventHandler,
    FC,
    ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useDebounce, useGetState } from 'ahooks'
import classnames from 'classnames'
import moment from 'moment'
import { before, debounce, noop, uniq, uniqBy } from 'lodash'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { DndProvider, useDrop } from 'react-dnd'
import { useSortable } from '@dnd-kit/sortable'

import { useDraggable, DndContext, DragOverlay } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import update from 'immutability-helper'
import {
    Button,
    DatePicker,
    Dropdown,
    Input,
    Popover,
    Radio,
    Row,
    Select,
    Tooltip,
} from 'antd'
import {
    DoubleLeftOutlined,
    DoubleRightOutlined,
    DownOutlined,
    InfoCircleOutlined,
    QuestionCircleOutlined,
    SearchOutlined,
} from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import __ from '../locale'
import { getFieldTypeIcon } from '../helper'
import DragCard from './DragCard'
import {
    DateSelectOptions,
    DragBoxType,
    FieldTypes,
    TimeDateOptions,
    changeFormatToType,
    dateSelectOptionFormat,
    defaultPreviewConfig,
    formatDateForDisplay,
    getOperatorLabel,
    getSameperiodExample,
    limitBoolean,
    sameperiodMethodMap,
    sameperiodNameMap,
    sameperiodTimeGranularityMap,
    timeFilterToChange,
} from '../const'
import DragDropCard from './DragDropCard'
import ContainerDrop from './ContainerDrop'
import DropCard from './DropCard'
import { FontIcon, NumberTypeOutlined } from '@/icons'
import ConfigFilterData from './ConfigFilterData'
import { Empty, Loader } from '@/ui'
import CustomComparisonModal from './CustomComparisonModal'

const { RangePicker } = DatePicker
interface IDragItemBox {
    itemIndex: number
    dataId: string
    children: ReactNode
    needOverLay: boolean
}
const DragItemBox: FC<IDragItemBox> = ({
    itemIndex,
    dataId,
    children,
    needOverLay,
}) => {
    // const {
    //     setNodeRef,
    //     listeners,
    //     isDragging,
    //     isSorting,
    //     over,
    //     overIndex,
    //     transform,
    //     transition,
    // } = useSortable({
    //     id: dataId || '',
    // })
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: dataId,
    })
    const [isDragging, setIsDragging] = useState<boolean>(false)

    return (
        <DndContext
            onDragStart={(ex) => {
                setIsDragging(true)
            }}
            onDragEnd={(ex) => {
                setIsDragging(false)
            }}
        >
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Translate.toString(transform),
                }}
                {...listeners}
                {...attributes}
            >
                {children}
            </div>
            {isDragging ? children : null}
        </DndContext>
    )
}

interface ITimeSelectedList {
    name: string
    id: string
    dataType: string
    onEndDrag: () => void
    onStartDrag: () => void
    data: any
}
const TimeSelectedList: FC<ITimeSelectedList> = ({
    name,
    id,
    dataType,
    onEndDrag,
    onStartDrag,
    data,
}) => {
    const [expand, setExpand] = useState<boolean>(false)
    return (
        <div>
            <DragCard
                dropCardList={[]}
                updateDragAndDrop={() => {}}
                onStartDrag={onStartDrag}
                data={{
                    ...data,
                    format: 'day',
                }}
                onEndDrag={onEndDrag}
                previewNode={
                    <div className={styles.itemDragging}>
                        <div className={styles.dataTypeIcon}>
                            {getFieldTypeIcon(data.original_data_type)}
                        </div>
                        <div className={styles.name} title={data.business_name}>
                            {`${data.business_name}(${__('日')})`}
                        </div>
                    </div>
                }
            >
                <div className={styles.itemWrapper}>
                    <div
                        onClick={() => setExpand(!expand)}
                        className={classnames(
                            styles.leftIcon,
                            expand ? styles.expanded : styles.unExpand,
                        )}
                    >
                        <DownOutlined />
                    </div>
                    <div className={styles.dataTypeIcon}>
                        {getFieldTypeIcon(dataType)}
                    </div>
                    <div className={styles.name} title={name}>
                        {name}
                    </div>
                </div>
            </DragCard>

            {expand &&
                TimeDateOptions.map((currentData) => (
                    <DragCard
                        dropCardList={[]}
                        updateDragAndDrop={() => {}}
                        onStartDrag={onStartDrag}
                        data={{
                            ...data,
                            format: currentData.dateType,
                        }}
                        onEndDrag={onEndDrag}
                        previewNode={
                            <div className={styles.itemDragging}>
                                <div className={styles.dataTypeIcon}>
                                    {getFieldTypeIcon(data.original_data_type)}
                                </div>
                                <div
                                    className={styles.name}
                                    title={data.business_name}
                                >
                                    {`${data.business_name}(${currentData.label})`}
                                </div>
                            </div>
                        }
                    >
                        <div className={styles.itemWrapper}>
                            <div className={styles.leftIcon} />
                            <div className={styles.dataTypeIcon} />
                            <div className={styles.name}>
                                {currentData.label}
                            </div>
                        </div>
                    </DragCard>
                ))}
        </div>
    )
}
interface IToolSideBar {
    indicatorInfo: any
    onConfigChange?: (data) => void
    defaultValue?: any
    showFilterIcon?: boolean
}
const ToolSideBar: FC<IToolSideBar> = ({
    indicatorInfo,
    onConfigChange = noop,
    defaultValue,
    showFilterIcon = true,
}) => {
    // 配置页面展开状态
    const [configExpand, setConfigExpand] = useState<boolean>(true)
    // 维度页面展开状态
    const [dimensionsExpand, setDimensionsExpand] = useState<boolean>(true)
    // 分析维度数据
    const [analysisDimensions, setAnalysisDimensions] = useState<Array<any>>([])
    // 行数据
    const [rowData, setRowData, getRowData] = useGetState<Array<any>>([])
    // 列数据
    const [columnData, setColumnData, getColumnData] = useGetState<Array<any>>(
        [],
    )
    // 过滤数据
    const [filterData, setFilterData, getFilterData] = useGetState<Array<any>>(
        [],
    )

    // 分析维度加载状态
    const [dimLoading, setDimLoading] = useState<boolean>(true)

    // 分析维度拖拽状态
    const [listDragging, setListDragging] = useState<boolean>(false)

    // 搜索分析维度的关键字
    const [searchKey, setSearchKey] = useState<string>('') // 搜索关键字

    // 当前拖拽的状态
    const [isDragging, setIsDragging] = useState<boolean>(false)

    // 当前打开配置的过滤数据
    const [selectedFilterData, setSelectedFilterData] = useState<any>()

    // 当前日期时间的类型
    const [timeOperator, setTimeOperator, getTimeOperator] =
        useGetState<string>('before')

    // 日期时间值
    const [timeValue, setTimeValue, getTimeValue] = useGetState<Array<string>>([
        '30 day',
    ])

    // 重置按钮 ref
    const btnRef = useRef<any>()

    // 同环比/占比配置
    const [metricsConfig, setMetricsConfig] = useState<any>()

    // 自定义同环比弹窗
    const [customComparisonModalOpen, setCustomComparisonModalOpen] =
        useState<boolean>(false)

    useEffect(() => {
        if (defaultValue) {
            const {
                filters,
                pivot_rows,
                pivot_columns,
                time_constraint,
                metrics,
            } = defaultValue
            setRowData(pivot_rows)
            setColumnData(pivot_columns)
            setFilterData(filters)
            setTimeValue(time_constraint[0].value)
            setTimeOperator(time_constraint[0].operator)
            setMetricsConfig(metrics)
        }
    }, [defaultValue])

    useEffect(() => {
        if (indicatorInfo?.analysis_dimensions) {
            setAnalysisDimensions(
                indicatorInfo.analysis_dimensions?.filter((currentData) =>
                    currentData?.business_name?.includes(searchKey),
                ) || [],
            )
            setDimLoading(false)
        }
    }, [indicatorInfo, searchKey])

    useEffect(() => {
        // console.log(dateSelectOptionFormat(timeValue), timeValue)
    }, [timeValue])

    /**
     * 配置变更事件
     */
    const handleConfigChange = debounce(() => {
        // onConfigChange({
        //     pivot_rows: getRowData(),
        //     pivot_columns: getColumnData(),
        //     filters: getFilterData().filter((currentData) =>
        //         checkBtnStatus(
        //             currentData,
        //             currentData?.operator,
        //             currentData?.value,
        //         ),
        //     ),
        //     time_constraint: [
        //         {
        //             operator: getTimeOperator(),
        //             value: getTimeValue(),
        //         },
        //     ],
        // })
    }, 500)

    // 查询事件
    const handleQuery = () => {
        onConfigChange({
            pivot_rows: getRowData(),
            pivot_columns: getColumnData(),
            filters: getFilterData().filter((currentData) =>
                checkBtnStatus(
                    currentData,
                    currentData?.operator,
                    currentData?.value,
                ),
            ),
            time_constraint: [
                {
                    operator: getTimeOperator(),
                    value: getTimeValue(),
                },
            ],
            metrics: metricsConfig,
        })
    }

    // 重置事件
    const handleReset = () => {
        btnRef?.current?.blur()
        const { filters, pivot_rows, pivot_columns, time_constraint } =
            defaultPreviewConfig
        setRowData(pivot_rows)
        setColumnData(pivot_columns)
        setFilterData(filters)
        setTimeValue(time_constraint[0].value)
        setTimeOperator(time_constraint[0].operator)
        setMetricsConfig(undefined)
    }

    /**
     * 处理拖动开始的事件。
     * 当拖动操作开始时，此函数被调用，用于标记特定id的元素为正在移动状态。
     *
     * @param dragType 拖动操作的类型，用于区分不同的拖动场景。
     * @param id 被拖动元素的唯一标识符，用于在数据结构中定位和标记该元素。
     */
    const handleDragStart = (dragType: DragBoxType, id: string) => {
        if (dragType === DragBoxType.SELECT_LIST) {
            setRowData([
                ...rowData,
                {
                    field_id: id,
                    isMoving: true,
                },
            ])
            setColumnData([
                ...columnData,
                {
                    field_id: id,
                    isMoving: true,
                },
            ])

            setFilterData([
                ...filterData,
                {
                    field_id: id,
                    isMoving: true,
                },
            ])
        }
    }

    const getListContent = (item, index) => {
        if (['2', '3', '4'].includes(item.data_type)) {
            return (
                <TimeSelectedList
                    name={item.business_name}
                    id={item.field_id}
                    dataType={item.original_data_type}
                    onStartDrag={() => {
                        handleDragStart(DragBoxType.SELECT_LIST, item.field_id)
                        setIsDragging(true)
                    }}
                    onEndDrag={() => {
                        setRowData(
                            rowData.filter(
                                (currentData, currentIndex) =>
                                    !currentData.isMoving,
                            ),
                        )
                        setColumnData(
                            columnData.filter(
                                (currentData, currentIndex) =>
                                    !currentData.isMoving,
                            ),
                        )
                        setFilterData(
                            getFilterData().filter(
                                (currentData, currentIndex) =>
                                    !currentData.isMoving,
                            ),
                        )
                        setIsDragging(false)
                    }}
                    data={item}
                />
            )
        }
        return (
            <DragCard
                dropCardList={[]}
                updateDragAndDrop={() => {}}
                onStartDrag={() => {
                    handleDragStart(DragBoxType.SELECT_LIST, item.field_id)
                    setIsDragging(true)
                }}
                data={item}
                onEndDrag={() => {
                    setRowData(
                        rowData.filter(
                            (currentData, currentIndex) =>
                                !currentData.isMoving,
                        ),
                    )
                    setColumnData(
                        columnData.filter(
                            (currentData, currentIndex) =>
                                !currentData.isMoving,
                        ),
                    )
                    setFilterData(
                        getFilterData().filter(
                            (currentData, currentIndex) =>
                                !currentData.isMoving,
                        ),
                    )
                    setIsDragging(false)
                }}
                previewNode={
                    <div className={styles.itemDragging}>
                        <div className={styles.dataTypeIcon}>
                            {getFieldTypeIcon(item.original_data_type)}
                        </div>
                        <div className={styles.name} title={item.business_name}>
                            {item.business_name}
                        </div>
                    </div>
                }
            >
                <div className={styles.itemWrapper}>
                    <div className={styles.leftIcon} />
                    <div className={styles.dataTypeIcon}>
                        {getFieldTypeIcon(item.original_data_type)}
                    </div>
                    <div className={styles.name} title={item.business_name}>
                        {item.business_name}
                    </div>
                </div>
            </DragCard>
        )
    }

    /**
     * 处理行数据拖拽结束的逻辑
     * 当行数据拖拽结束后，需要更新rowData和columnData的状态，以反映拖拽结果
     */
    const handleDragRowDataEnd = () => {
        // 更新rowData，移除拖拽状态标记
        setRowData(
            getRowData() // 获取当前的行数据
                .map((currentData) => {
                    // 如果拖拽的当前数据没有被有效放置，就还原当前数据
                    if (currentData.isDragged) {
                        const { isMoving, isDragged, ...movedDropData } = {
                            ...currentData,
                            isMoving: false,
                            isDragged: false,
                        }

                        return movedDropData
                    }
                    return currentData
                })
                .filter((currentData, currentIndex) => !currentData.isMoving),
        )
        // 更新columnData，移除拖拽状态标记
        setColumnData(
            columnData.filter(
                (currentData, currentIndex) => !currentData.isMoving,
            ),
        )

        // 设置listDragging状态为false，表示不再进行拖拽操作
        setListDragging(false)
    }

    const handleDragColumnDataEnd = () => {
        setColumnData(
            getColumnData()
                .map((currentData) => {
                    // 如果拖拽的当前数据的没有没有被有效放置，就还原当前数据
                    if (currentData.isDragged) {
                        const { isMoving, isDragged, ...movedDropData } = {
                            ...currentData,
                            isMoving: false,
                            isDragged: false,
                        }

                        return movedDropData
                    }
                    return currentData
                })
                .filter((currentData, currentIndex) => !currentData.isMoving),
        )
        setRowData(
            getRowData().filter(
                (currentData, currentIndex) => !currentData.isMoving,
            ),
        )
        setListDragging(false)
    }

    const moveRowCard = useCallback(
        (draggingIndex, hoverIndex) => {
            if (draggingIndex === undefined) {
                const lessIndex = rowData.findIndex(
                    (item: any) => item.isMoving,
                )
                const movingData = rowData.find((item: any) => item.isMoving)
                setRowData(
                    update(rowData, {
                        $splice: [
                            [lessIndex, 1],
                            [hoverIndex, 0, movingData],
                        ],
                    }),
                )
            } else {
                const dragCard = rowData[draggingIndex]
                setRowData(
                    update(rowData, {
                        $splice: [
                            [draggingIndex, 1],
                            [hoverIndex, 0, dragCard],
                        ],
                    }),
                )
            }
        },
        [rowData],
    )

    /**
     * 移动列数据
     */
    const moveColumnCard = useCallback(
        (draggingIndex, hoverIndex) => {
            if (draggingIndex === undefined) {
                const lessIndex = columnData.findIndex(
                    (item: any) => item.isMoving,
                )
                const movingData = columnData.find((item: any) => item.isMoving)
                setColumnData(
                    update(columnData, {
                        $splice: [
                            [lessIndex, 1],
                            [hoverIndex, 0, movingData],
                        ],
                    }),
                )
            } else {
                const dragCard = rowData[draggingIndex]
                setColumnData(
                    update(rowData, {
                        $splice: [
                            [draggingIndex, 1],
                            [hoverIndex, 0, dragCard],
                        ],
                    }),
                )
            }
        },
        [columnData],
    )

    const moveFilterDataCard = useCallback(
        (draggingIndex, hoverIndex) => {
            const lessIndex = filterData.findIndex((item: any) => item.isMoving)
            const movingData = filterData.find((item: any) => item.isMoving)

            // setFilterData(
            //     update(filterData, {
            //         $splice: [
            //             [lessIndex, 1],
            //             [hoverIndex, 0, movingData],
            //         ],
            //     }),
            // )
        },
        [filterData],
    )
    const handleStartRowDrag = useCallback(
        (item) => {
            setTimeout(() => {
                setColumnData([
                    ...columnData,
                    {
                        field_id: item.field_id,
                        isMoving: true,
                    },
                ])
            }, 0)
            setRowData(
                rowData.map((currentData) =>
                    currentData.field_id === item.field_id
                        ? {
                              ...currentData,
                              isMoving: true,
                              isDragged: true,
                          }
                        : currentData,
                ),
            )
            setListDragging(true)
        },
        [columnData],
    )

    const handleStartColumnDrag = useCallback(
        (item) => {
            setTimeout(() => {
                setRowData([
                    ...getRowData(),
                    {
                        ...item,
                        isMoving: true,
                    },
                ])
            }, 0)
            setColumnData(
                columnData.map((currentData) =>
                    currentData.field_id === item.field_id
                        ? {
                              ...currentData,
                              isMoving: true,
                              isDragged: true,
                          }
                        : currentData,
                ),
            )

            setListDragging(true)
        },
        [columnData],
    )

    /**
     * 放置行
     */
    const handleDropDataToRow = (dropData) => {
        setRowData(
            uniqBy(
                rowData.map((currentData) => {
                    if (currentData.isMoving) {
                        const { isMoving, isDragged, ...movedDropData } = {
                            ...dropData,
                            isMoving: false,
                            isDragged: false,
                        }

                        return movedDropData
                    }
                    if (dropData.field_id === currentData.field_id) {
                        return dropData
                    }
                    return currentData
                }),
                'field_id',
            ),
        )
        if (listDragging) {
            // 过滤掉正在被拖拽的元素
            setColumnData(
                columnData.filter((currentData) => !currentData.isDragged),
            )
        } else {
            setColumnData(
                columnData.filter(
                    (currentData) => currentData.field_id !== dropData.field_id,
                ),
            )
        }
        handleConfigChange()
    }

    /**
     * 放置到列
     */
    const handleDropDataToColumn = (dropData) => {
        setColumnData(
            uniqBy(
                columnData.map((currentData) => {
                    if (currentData.isMoving) {
                        const { isMoving, isDragged, ...movedDropData } = {
                            ...dropData,
                            isMoving: false,
                            isDragged: false,
                        }

                        return movedDropData
                    }
                    if (dropData.field_id === currentData.field_id) {
                        return dropData
                    }
                    return currentData
                }),
                'field_id',
            ),
        )
        if (listDragging) {
            // 过滤掉正在被拖拽的元素
            setRowData(rowData.filter((currentData) => !currentData.isDragged))
        } else {
            setRowData(
                rowData.filter(
                    (currentData) => currentData.field_id !== dropData.field_id,
                ),
            )
        }
        handleConfigChange()
    }

    /**
     * 移除指定行数据
     * @param id
     */
    const handleRemoveRowData = (id) => {
        setRowData(rowData.filter((currentData) => currentData.field_id !== id))
    }

    /**
     * 移除指定列数据
     * @param id
     */
    const handleRemoveColumnData = (id) => {
        setColumnData(
            columnData.filter((currentData) => currentData.field_id !== id),
        )
    }

    /**
     * 移除指定过滤数据
     * @param id
     */
    const handleRemoveFilterData = (id, index) => {
        setFilterData(
            filterData.filter(
                (currentData, currentIndex) => currentIndex !== index,
            ),
        )
    }

    /**
     * 过滤按钮的状态
     * @param paramData
     * @param paramOperator
     * @param paramValue
     * @returns
     */
    const checkBtnStatus = (paramData, paramOperator, paramValue) => {
        if (changeFormatToType(paramData?.data_type) === FieldTypes.BOOL) {
            if (paramOperator) {
                return true
            }
            return false
        }
        if (limitBoolean.includes(paramOperator)) {
            return true
        }
        if (paramOperator === 'current') {
            return true
        }
        if (paramValue) {
            return true
        }
        return false
    }

    /**
     * 根据数据类型和操作符获取数据值结果
     * @param value 原始数据值
     * @param operator 操作符，用于改变数据值
     * @param dataType 数据类型，用于决定如何处理数据值
     * @param format 日期格式，用于日期类型的数据
     * @returns 根据不同的数据类型和操作符返回不同的数据值结果
     */
    const getDataValueResult = (value, operator, dataType, format) => {
        // 如果数据类型是日期、日期时间或时间戳
        if ([FieldTypes.DATE, FieldTypes.DATETIME].includes(dataType)) {
            // 使用时间过滤器根据操作符改变数据值
            const newValue = timeFilterToChange(value, operator)
            // 格式化日期并返回显示的字符串
            return `${formatDateForDisplay(
                newValue[0],
                format,
            )} - ${formatDateForDisplay(newValue[1], format)}`
        }
        // 如果操作符是'belong'
        if (operator === 'belong') {
            // 返回一个包含所有数据的div
            return (
                <div className={styles.viewTipBox}>
                    {value.map((currentData) => (
                        <div className={styles.viewTipTag} title={currentData}>
                            {currentData}
                        </div>
                    ))}
                </div>
            )
        }
        // 默认情况下返回第一个数据值
        return value[0]
    }

    const getExample = (method, offset, time_granularity) => {
        const res = getSameperiodExample(
            {
                operator: getTimeOperator(),
                value: getTimeValue(),
            },
            method,
            offset,
            time_granularity,
        )
        return (
            <div className={classnames(styles.comparisonExampleTip)}>
                {res?.growth_value && (
                    <div className={styles.exampleItem}>
                        <div className={styles.exampleItemName}>
                            {sameperiodNameMap[time_granularity]}
                            {__('增长值：')}
                        </div>
                        <div>{res.growth_value}</div>
                    </div>
                )}
                {res?.growth_rate && (
                    <div className={styles.exampleItem}>
                        <div className={styles.exampleItemName}>
                            {sameperiodNameMap[time_granularity]}
                            {__('增长率：')}
                        </div>
                        <div>{res.growth_rate}</div>
                    </div>
                )}
            </div>
        )
    }

    // 同环比菜单
    const metricsItems = useMemo(() => {
        const proportionDisabled =
            rowData.length === 0 && columnData.length === 0
        return [
            {
                key: 'year_comparison',
                label: (
                    <span>
                        {sameperiodNameMap.year}
                        <Tooltip
                            title={
                                <div style={{ marginTop: 8 }}>
                                    {getExample(
                                        ['growth_value', 'growth_rate'],
                                        1,
                                        'year',
                                    )}
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                                minWidth: 270,
                            }}
                            placement="right"
                        >
                            <QuestionCircleOutlined
                                style={{
                                    marginLeft: 4,
                                    color: 'rgba(0,0,0,0.65)',
                                }}
                            />
                        </Tooltip>
                    </span>
                ),
                value: {
                    type: 'sameperiod',
                    sameperiod_config: {
                        custom: false,
                        method: ['growth_value', 'growth_rate'],
                        offset: 1,
                        time_granularity: 'year',
                    },
                },
            },
            {
                key: 'month_comparison',
                label: (
                    <span>
                        {sameperiodNameMap.month}{' '}
                        <Tooltip
                            title={
                                <div style={{ marginTop: 8 }}>
                                    {getExample(
                                        ['growth_value', 'growth_rate'],
                                        1,
                                        'month',
                                    )}
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                                minWidth: 270,
                            }}
                            placement="right"
                        >
                            <QuestionCircleOutlined
                                style={{
                                    marginLeft: 4,
                                    color: 'rgba(0,0,0,0.65)',
                                }}
                            />
                        </Tooltip>
                    </span>
                ),
                value: {
                    type: 'sameperiod',
                    sameperiod_config: {
                        custom: false,
                        method: ['growth_value', 'growth_rate'],
                        offset: 1,
                        time_granularity: 'month',
                    },
                },
            },
            {
                key: 'quarter_comparison',
                label: (
                    <span>
                        {sameperiodNameMap.quarter}{' '}
                        <Tooltip
                            title={
                                <div style={{ marginTop: 8 }}>
                                    {getExample(
                                        ['growth_value', 'growth_rate'],
                                        1,
                                        'quarter',
                                    )}
                                </div>
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                                minWidth: 260,
                            }}
                            placement="right"
                        >
                            <QuestionCircleOutlined
                                style={{
                                    marginLeft: 4,
                                    color: 'rgba(0,0,0,0.65)',
                                }}
                            />
                        </Tooltip>
                    </span>
                ),
                value: {
                    type: 'sameperiod',
                    sameperiod_config: {
                        custom: false,
                        method: ['growth_value', 'growth_rate'],
                        offset: 1,
                        time_granularity: 'quarter',
                    },
                },
            },
            {
                key: 'custom_comparison',
                label: <span>{__('自定义同环比')}</span>,
            },
            {
                key: 'proportion',
                label: (
                    <span>
                        {__('占比')}
                        <Tooltip
                            title={
                                proportionDisabled ? (
                                    __('请先配置行、或列维度字段')
                                ) : (
                                    <>
                                        <div>
                                            {__(
                                                '占比公式=“行维度”列中位于最后的维度字段对应的指标值 / 指标总值',
                                            )}
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            {__(
                                                '其中配置的“日期时间”“过滤条件”均作用在占比公式的分子分母上',
                                            )}
                                        </div>
                                    </>
                                )
                            }
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            placement="right"
                        >
                            <QuestionCircleOutlined
                                style={{
                                    marginLeft: 4,
                                    color: proportionDisabled
                                        ? 'rgba(0,0,0,0.3)'
                                        : 'rgba(0,0,0,0.65)',
                                }}
                            />
                        </Tooltip>
                    </span>
                ),
                disabled: proportionDisabled,
                value: {
                    type: 'proportion',
                },
            },
            {
                key: 'divider',
                type: 'divider',
            },
            {
                key: 'cancel_config',
                label: <span>{__('取消配置')}</span>,
                value: undefined,
            },
        ]
    }, [rowData, columnData, getTimeOperator(), getTimeValue()])

    // 同环比、占比配置的切换
    const handleMetricsItemsClick = ({ key }) => {
        switch (key) {
            case 'year_comparison':
            case 'month_comparison':
            case 'quarter_comparison':
            case 'proportion':
            case 'cancel_config':
                setMetricsConfig(
                    metricsItems.find((item) => item.key === key)?.value,
                )
                break
            case 'custom_comparison':
                setCustomComparisonModalOpen(true)
                break
            default:
                break
        }
    }

    // 同环比、占比配置内容的提示
    const metricsTip = useMemo(() => {
        if (!metricsConfig) {
            return ''
        }
        if (metricsConfig.type === 'proportion') {
            return __('已配置“占比”')
        }
        if (metricsConfig.sameperiod_config?.custom) {
            return (
                <div className={styles.customMetricsTip}>
                    {__('已配置“自定义同环比”')}
                    <div className={styles.customMetricsTipContent}>
                        <div>
                            {__('计算类型：')}
                            {metricsConfig.sameperiod_config.method
                                .map((item) => sameperiodMethodMap[item].label)
                                .join('、')}
                        </div>
                        <div>
                            {__('偏移量：')}
                            {metricsConfig.sameperiod_config.offset}
                        </div>
                        <div>
                            {__('时间粒度：')}
                            {
                                sameperiodTimeGranularityMap[
                                    metricsConfig.sameperiod_config
                                        .time_granularity
                                ].label
                            }
                        </div>
                    </div>
                </div>
            )
        }
        switch (metricsConfig.sameperiod_config.time_granularity) {
            case 'year':
                return __('已配置“同比”')
            case 'month':
                return __('已配置“月环比”')
            case 'quarter':
                return __('已配置“季度环比”')
            default:
                return ''
        }
    }, [metricsConfig])

    return (
        <div className={styles.toolSideBarContainer}>
            <div className={styles.toolSideBarContent}>
                <div
                    className={classnames({
                        [styles.sideBorder]: true,
                        [styles.sideBox]: true,
                        [styles.sideBoxExpand]: configExpand,
                        [styles.sideBoxUnExpand]: !configExpand,
                    })}
                >
                    {configExpand ? (
                        <div className={styles.expandContainer}>
                            <div className={styles.titleContainer}>
                                <div className={styles.text}>
                                    {__('分析配置')}
                                </div>
                                <Tooltip title={__('收起')}>
                                    <div
                                        onClick={() => {
                                            setConfigExpand(false)
                                        }}
                                        className={styles.icon}
                                    >
                                        <DoubleRightOutlined />
                                    </div>
                                </Tooltip>
                            </div>
                            <div className={styles.line} />
                            <div className={styles.analysisConfigWrapper}>
                                <div className={styles.configItemWrapper}>
                                    <div className={styles.itemLabel}>
                                        {__('日期时间')}
                                    </div>
                                    <div>
                                        <Radio.Group
                                            value={timeOperator}
                                            onChange={(e) => {
                                                if (
                                                    e.target.value === 'between'
                                                ) {
                                                    const currentTime = moment()
                                                    setTimeValue([
                                                        currentTime
                                                            .subtract(30, 'day')
                                                            .format(
                                                                'YYYY-MM-DD',
                                                            ),
                                                        moment().format(
                                                            'YYYY-MM-DD',
                                                        ),
                                                    ])
                                                } else {
                                                    setTimeValue(['30 day'])
                                                }
                                                setTimeOperator(e.target.value)
                                                handleConfigChange()
                                            }}
                                        >
                                            <Radio value="before">
                                                {__('内置')}
                                            </Radio>
                                            <Radio value="between">
                                                {__('自定义')}
                                            </Radio>
                                        </Radio.Group>
                                    </div>
                                    <div
                                        className={styles.itemContentWrapper}
                                        title={
                                            timeOperator === 'before'
                                                ? ''
                                                : `${timeValue[0]} 至 ${timeValue[1]}`
                                        }
                                    >
                                        {timeOperator === 'before' ? (
                                            <Select
                                                options={DateSelectOptions}
                                                onChange={(value) => {
                                                    setTimeValue([value])
                                                    handleConfigChange()
                                                }}
                                                value={timeValue[0]}
                                                style={{ width: '100%' }}
                                            />
                                        ) : (
                                            <RangePicker
                                                showTime={false}
                                                placeholder={[
                                                    __('开始日期'),
                                                    __('结束日期'),
                                                ]}
                                                onChange={(val) => {
                                                    if (val && val.length) {
                                                        setTimeValue(
                                                            val.map(
                                                                (currentVal) =>
                                                                    currentVal?.format(
                                                                        'YYYY-MM-DD',
                                                                    ) || '',
                                                            ),
                                                        )
                                                    } else {
                                                        setTimeValue([])
                                                    }
                                                    handleConfigChange()
                                                }}
                                                value={
                                                    (timeValue
                                                        ? timeValue.map(
                                                              (currentData) =>
                                                                  moment(
                                                                      currentData,
                                                                  ),
                                                          )
                                                        : []) as any
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className={styles.configItemWrapper}>
                                    <div className={styles.itemLabel}>
                                        {__('行')}
                                    </div>
                                    <ContainerDrop
                                        isDragging={isDragging || listDragging}
                                    >
                                        {rowData.length ? (
                                            rowData.map((item, index) => {
                                                const text = item?.format
                                                    ? `${
                                                          item.business_name
                                                      } （${
                                                          TimeDateOptions.find(
                                                              (
                                                                  currentDataTimeOptions,
                                                              ) =>
                                                                  currentDataTimeOptions.dateType ===
                                                                  item.format,
                                                          )?.label
                                                      }）`
                                                    : item.business_name
                                                return (
                                                    <DragDropCard
                                                        index={index}
                                                        id={item?.field_id}
                                                        moveCard={moveRowCard}
                                                        onEnd={() => {
                                                            handleDragRowDataEnd()
                                                        }}
                                                        onDropData={
                                                            handleDropDataToRow
                                                        }
                                                        onStartDrag={() => {
                                                            handleStartRowDrag(
                                                                item,
                                                            )
                                                        }}
                                                        itemData={item}
                                                        previewNode={
                                                            <div
                                                                className={
                                                                    styles.itemDragging
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.dataTypeIcon
                                                                    }
                                                                >
                                                                    {getFieldTypeIcon(
                                                                        item.original_data_type,
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.name
                                                                    }
                                                                    title={text}
                                                                >
                                                                    {text}
                                                                </div>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            className={classnames(
                                                                {
                                                                    [styles.selectedItemWrapper]:
                                                                        !item.isMoving,
                                                                    [styles.newData]:
                                                                        item.isMoving,
                                                                    [styles.dropItemWrapper]:
                                                                        item.isMoving,
                                                                },
                                                            )}
                                                        >
                                                            {item.isMoving ? (
                                                                '放置此处'
                                                            ) : (
                                                                <div
                                                                    className={
                                                                        styles.itemContent
                                                                    }
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.leftContainer
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.dataTypeIcon
                                                                            }
                                                                        >
                                                                            {getFieldTypeIcon(
                                                                                item.original_data_type,
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.name
                                                                            }
                                                                            title={
                                                                                text
                                                                            }
                                                                        >
                                                                            {
                                                                                text
                                                                            }
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.deleteIcon
                                                                            }
                                                                            onClick={() => {
                                                                                handleRemoveRowData(
                                                                                    item.field_id,
                                                                                )
                                                                                handleConfigChange()
                                                                            }}
                                                                        >
                                                                            <FontIcon name="icon-lajitong" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DragDropCard>
                                                )
                                            })
                                        ) : (
                                            <div className={styles.empty}>
                                                {__('拖拽右侧的分析维度')}
                                            </div>
                                        )}
                                    </ContainerDrop>
                                </div>
                                <div className={styles.configItemWrapper}>
                                    <div className={styles.itemLabel}>
                                        {__('列')}
                                    </div>
                                    <ContainerDrop
                                        isDragging={isDragging || listDragging}
                                    >
                                        {columnData.length ? (
                                            columnData.map((item, index) => {
                                                const text = item?.format
                                                    ? `${
                                                          item.business_name
                                                      } （${
                                                          TimeDateOptions.find(
                                                              (
                                                                  currentDataTimeOptions,
                                                              ) =>
                                                                  currentDataTimeOptions.dateType ===
                                                                  item.format,
                                                          )?.label
                                                      }）`
                                                    : item.business_name
                                                return (
                                                    <DragDropCard
                                                        index={index}
                                                        id={item?.field_id}
                                                        moveCard={
                                                            moveColumnCard
                                                        }
                                                        onEnd={() => {
                                                            handleDragColumnDataEnd()
                                                        }}
                                                        onDropData={
                                                            handleDropDataToColumn
                                                        }
                                                        onStartDrag={() => {
                                                            handleStartColumnDrag(
                                                                item,
                                                            )
                                                        }}
                                                        itemData={item}
                                                        previewNode={
                                                            <div
                                                                className={
                                                                    styles.itemDragging
                                                                }
                                                            >
                                                                <div
                                                                    className={
                                                                        styles.dataTypeIcon
                                                                    }
                                                                >
                                                                    {getFieldTypeIcon(
                                                                        item.original_data_type,
                                                                    )}
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles.name
                                                                    }
                                                                    title={text}
                                                                >
                                                                    {text}
                                                                </div>
                                                            </div>
                                                        }
                                                    >
                                                        <div
                                                            className={classnames(
                                                                {
                                                                    [styles.selectedItemWrapper]:
                                                                        !item.isMoving,
                                                                    [styles.newData]:
                                                                        item.isMoving,
                                                                    [styles.dropItemWrapper]:
                                                                        item.isMoving,
                                                                },
                                                            )}
                                                        >
                                                            {item.isMoving ? (
                                                                '放置此处'
                                                            ) : (
                                                                <div
                                                                    className={
                                                                        styles.itemContent
                                                                    }
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.leftContainer
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.dataTypeIcon
                                                                            }
                                                                        >
                                                                            {getFieldTypeIcon(
                                                                                item.original_data_type,
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.name
                                                                            }
                                                                            title={
                                                                                text
                                                                            }
                                                                        >
                                                                            {
                                                                                text
                                                                            }
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.deleteIcon
                                                                            }
                                                                            onClick={() => {
                                                                                handleRemoveColumnData(
                                                                                    item.field_id,
                                                                                )
                                                                                handleConfigChange()
                                                                            }}
                                                                        >
                                                                            <FontIcon name="icon-lajitong" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DragDropCard>
                                                )
                                            })
                                        ) : (
                                            <div className={styles.empty}>
                                                {__('拖拽右侧的分析维度')}
                                            </div>
                                        )}
                                    </ContainerDrop>
                                </div>
                                <div className={styles.configItemWrapper}>
                                    <div className={styles.itemLabel}>
                                        {__('值')}
                                    </div>
                                    <div className={styles.itemValueWrapper}>
                                        <NumberTypeOutlined
                                            style={{ fontSize: 18 }}
                                        />
                                        <div
                                            className={styles.itemValue}
                                            title={indicatorInfo?.name}
                                        >
                                            {indicatorInfo?.name}
                                        </div>

                                        {showFilterIcon && (
                                            <Dropdown
                                                menu={{
                                                    items: metricsItems,
                                                    onClick:
                                                        handleMetricsItemsClick,
                                                }}
                                                trigger={['click']}
                                                getPopupContainer={(n) =>
                                                    n.parentElement || n
                                                }
                                                placement="bottomRight"
                                            >
                                                <Tooltip
                                                    title={metricsTip}
                                                    color="#fff"
                                                    placement="right"
                                                    overlayInnerStyle={{
                                                        color: 'rgba(0,0,0,0.85)',
                                                    }}
                                                    overlayClassName={
                                                        styles.metricsTip
                                                    }
                                                >
                                                    <FontIcon
                                                        name="icon-tonghuanbi"
                                                        className={classnames(
                                                            styles.itemIcon,
                                                            metricsConfig &&
                                                                styles.itemIconConfigured,
                                                        )}
                                                    />
                                                </Tooltip>
                                            </Dropdown>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.configItemWrapper}>
                                    <div className={styles.itemLabel}>
                                        {__('过滤')}
                                    </div>
                                    <ContainerDrop
                                        isDragging={isDragging}
                                        onDrop={(dropData) => {
                                            setFilterData(
                                                filterData.map(
                                                    (currentData) => {
                                                        if (
                                                            currentData.isMoving
                                                        ) {
                                                            const {
                                                                isMoving,
                                                                ...movedDropData
                                                            } = {
                                                                ...dropData,
                                                                isMoving: false,
                                                            }

                                                            return movedDropData
                                                        }
                                                        return currentData
                                                    },
                                                ),
                                            )
                                            handleConfigChange()
                                        }}
                                    >
                                        {filterData.length ? (
                                            filterData.map((item, index) => {
                                                const text = item?.format
                                                    ? `${
                                                          item.business_name
                                                      } （${
                                                          TimeDateOptions.find(
                                                              (
                                                                  currentDataTimeOptions,
                                                              ) =>
                                                                  currentDataTimeOptions.dateType ===
                                                                  item.format,
                                                          )?.label
                                                      }）`
                                                    : item.business_name
                                                return (
                                                    <DropCard
                                                        index={index}
                                                        id={item?.field_id}
                                                        isDragging={isDragging}
                                                    >
                                                        <div
                                                            className={classnames(
                                                                {
                                                                    [styles.selectedItemWrapper]:
                                                                        !item.isMoving,
                                                                    [styles.newData]:
                                                                        item.isMoving,
                                                                    [styles.dropItemWrapper]:
                                                                        item.isMoving,
                                                                },
                                                            )}
                                                        >
                                                            {item.isMoving ? (
                                                                '放置此处'
                                                            ) : (
                                                                <div
                                                                    className={
                                                                        styles.itemContent
                                                                    }
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.leftContainer
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={
                                                                                styles.dataTypeIcon
                                                                            }
                                                                        >
                                                                            {getFieldTypeIcon(
                                                                                item.original_data_type,
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.name
                                                                            }
                                                                            title={
                                                                                text
                                                                            }
                                                                        >
                                                                            {
                                                                                text
                                                                            }
                                                                        </div>
                                                                        <div
                                                                            className={
                                                                                styles.btnGroup
                                                                            }
                                                                        >
                                                                            <div
                                                                                className={
                                                                                    styles.deleteIcon
                                                                                }
                                                                                onClick={() => {
                                                                                    handleRemoveFilterData(
                                                                                        item.field_id,
                                                                                        index,
                                                                                    )
                                                                                    handleConfigChange()
                                                                                }}
                                                                            >
                                                                                <FontIcon name="icon-lajitong" />
                                                                            </div>
                                                                            <Tooltip
                                                                                title={
                                                                                    checkBtnStatus(
                                                                                        item,
                                                                                        item.operator,
                                                                                        item.value,
                                                                                    ) ? (
                                                                                        <div>
                                                                                            <div>
                                                                                                <div
                                                                                                    style={{
                                                                                                        color: 'rgba(0,0,0,0.65)',
                                                                                                    }}
                                                                                                >
                                                                                                    {__(
                                                                                                        '过滤条件：',
                                                                                                    )}
                                                                                                </div>
                                                                                                <div>
                                                                                                    {getOperatorLabel(
                                                                                                        item.operator,
                                                                                                        changeFormatToType(
                                                                                                            item.data_type,
                                                                                                        ),
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div>
                                                                                                <div
                                                                                                    style={{
                                                                                                        color: 'rgba(0,0,0,0.65)',
                                                                                                    }}
                                                                                                >
                                                                                                    {__(
                                                                                                        '过滤内容：',
                                                                                                    )}
                                                                                                </div>
                                                                                                <div>
                                                                                                    {getDataValueResult(
                                                                                                        item.value,
                                                                                                        item.operator,
                                                                                                        changeFormatToType(
                                                                                                            item.data_type,
                                                                                                        ),
                                                                                                        item.format,
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        ''
                                                                                    )
                                                                                }
                                                                                overlayInnerStyle={{
                                                                                    color: 'rgba(0,0,0,0.85)',
                                                                                }}
                                                                                color="#fff"
                                                                                placement="right"
                                                                            >
                                                                                <div
                                                                                    className={classnames(
                                                                                        styles.filterIcon,
                                                                                        checkBtnStatus(
                                                                                            item,
                                                                                            item.operator,
                                                                                            item.value,
                                                                                        )
                                                                                            ? styles.filterIconConfigured
                                                                                            : styles.filterIconUnConfig,
                                                                                    )}
                                                                                    onClick={() => {
                                                                                        setSelectedFilterData(
                                                                                            {
                                                                                                ...item,
                                                                                                index,
                                                                                            },
                                                                                        )
                                                                                    }}
                                                                                >
                                                                                    <FontIcon name="icon-shaixuan" />
                                                                                </div>
                                                                            </Tooltip>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </DropCard>
                                                )
                                            })
                                        ) : (
                                            <div className={styles.empty}>
                                                {__('拖拽右侧的分析维度')}
                                            </div>
                                        )}
                                    </ContainerDrop>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.unExpandContainer}>
                            <Tooltip title={__('展开')}>
                                <div
                                    className={styles.icon}
                                    onClick={() => {
                                        setConfigExpand(true)
                                    }}
                                >
                                    <DoubleLeftOutlined />
                                </div>
                            </Tooltip>
                            <div className={styles.text}>{__('分析配置')}</div>
                        </div>
                    )}
                </div>
                <div
                    className={classnames({
                        [styles.sideBox]: true,
                        [styles.sideBoxExpand]: dimensionsExpand,
                        [styles.sideBoxUnExpand]: !dimensionsExpand,
                    })}
                >
                    {dimensionsExpand ? (
                        <div className={styles.expandContainer}>
                            <div className={styles.titleContainer}>
                                <div className={styles.text}>
                                    {__('分析维度')}
                                </div>
                                <Tooltip title={__('收起')}>
                                    <div
                                        onClick={() => {
                                            setDimensionsExpand(false)
                                        }}
                                        className={styles.icon}
                                    >
                                        <DoubleRightOutlined />
                                    </div>
                                </Tooltip>
                            </div>
                            <div className={styles.line} />
                            {dimLoading ? (
                                <div className={styles.dimLoading}>
                                    <Loader />
                                </div>
                            ) : searchKey || analysisDimensions.length ? (
                                <div className={styles.dimensionsWrapper}>
                                    <div className={styles.searchContainer}>
                                        <Input
                                            prefix={<SearchOutlined />}
                                            placeholder={__('搜索分析维度')}
                                            value={searchKey}
                                            onChange={(e) =>
                                                setSearchKey(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className={styles.contentListWrapper}>
                                        {analysisDimensions.map(
                                            (currentData, index) =>
                                                getListContent(
                                                    currentData,
                                                    index,
                                                ),
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.dataEmpty}>
                                    <Empty
                                        desc={__('暂无数据')}
                                        iconSrc={dataEmpty}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.unExpandContainer}>
                            <Tooltip title={__('展开')}>
                                {' '}
                                <div
                                    onClick={() => {
                                        setDimensionsExpand(true)
                                    }}
                                    className={styles.icon}
                                >
                                    <DoubleLeftOutlined />
                                </div>
                            </Tooltip>

                            <div className={styles.text}>{__('分析维度')}</div>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.bottomBar}>
                <Button
                    ref={btnRef}
                    className={styles.operationBtn}
                    onClick={() => handleReset()}
                >
                    {__('重置')}
                </Button>
                <Button
                    type="primary"
                    className={styles.operationBtn}
                    onClick={() => handleQuery()}
                >
                    {__('查询')}
                </Button>
            </div>

            {selectedFilterData && (
                <ConfigFilterData
                    data={selectedFilterData}
                    open={!!selectedFilterData}
                    onClose={() => {
                        setSelectedFilterData(null)
                    }}
                    onOk={(data) => {
                        const { index, ...newData } = data
                        setSelectedFilterData(null)
                        setFilterData(
                            filterData.map((currentData, i) =>
                                i === index ? newData : currentData,
                            ),
                        )
                        handleConfigChange()
                    }}
                />
            )}

            <CustomComparisonModal
                timeValue={{
                    operator: getTimeOperator(),
                    value: getTimeValue(),
                }}
                config={metricsConfig}
                open={customComparisonModalOpen}
                onClose={(data) => {
                    setCustomComparisonModalOpen(false)
                    if (data) {
                        setMetricsConfig(data)
                    }
                }}
            />
        </div>
    )
}

export default ToolSideBar
