import { Spin, Table } from 'antd'
import update from 'immutability-helper'
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Node } from '@antv/x6'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { IFormula, IFormulaFields } from '@/core'
import FieldItem from './FieldItem'
import { FieldsData } from '../FieldsData'
import styles from './styles.module.less'
import __ from '../locale'
import { fieldLabel } from './helper'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import DataOutPreview from './DataOutPreview'
import { FieldErrorType, FormulaType, ModuleType, formulaInfo } from '../const'
import NodeLeftColored from '@/icons/NodeLeftColored'
import NodeRightColored from '@/icons/NodeRightColored'
import { SearchInput } from '@/ui'

interface DraggableBodyRowProps
    extends React.HTMLAttributes<HTMLTableRowElement> {
    index: number
    canDrop: boolean
    canDrag: boolean
    moveRow: (dragIndex: number, hoverIndex: number) => void
}

const type = 'DraggableBodyRow'

export const DraggableBodyRow = ({
    index,
    canDrop = true,
    canDrag = true,
    moveRow,
    className,
    style,
    ...restProps
}: DraggableBodyRowProps) => {
    const ref = useRef<HTMLTableRowElement>(null)
    const [{ isOver, dropClassName }, drop] = useDrop({
        accept: type,
        collect: (monitor) => {
            const { index: dragIndex } = monitor.getItem() || {}
            if (dragIndex === index) {
                return {}
            }
            return {
                isOver: monitor.isOver(),
                dropClassName:
                    dragIndex < index
                        ? ' drop-over-downward'
                        : ' drop-over-upward',
            }
        },
        drop: (item: { index: number }) => {
            moveRow(item.index, index)
        },
        canDrop: (item, monitor) => canDrop,
    })
    const [, drag] = useDrag({
        type,
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag,
    })
    drop(drag(ref))

    return (
        <tr
            ref={ref}
            className={`${className}${isOver ? dropClassName : ''}`}
            style={{ cursor: 'move', ...style }}
            {...restProps}
        />
    )
}

interface IFieldsDragTable {
    ref: any
    items?: IFormulaFields[]
    formulaItem?: IFormula
    fieldsData: FieldsData
    preNodes?: Node[]
    columns: string[]
    viewSize: number
    fetching?: boolean
    canDrag?: boolean
    emptyDesc?: string
    module?: ModuleType
}

const FieldsDragTable: React.FC<IFieldsDragTable> = forwardRef(
    (props: any, ref) => {
        const {
            items,
            formulaItem,
            fieldsData,
            preNodes,
            columns,
            viewSize,
            fetching = false,
            canDrag = true,
            emptyDesc = '暂无数据',
        } = props
        const [dataOutVisible, setDataOutVisible] = useState(false)
        const [data, setData] = useState<IFormulaFields[]>([])
        // 搜索关键字
        const [keyword, setKeyword] = useState('')
        // 搜索字段集合
        const [searchItems, setSearchItems] = useState<IFormulaFields[]>([])
        // 选择项
        const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
        // const rowSelection = {
        //     selectedRowKeys,
        //     onChange: (newSelectedRowKeys: React.Key[]) => {
        //         const res = keyword
        //             ? [
        //                   ...selectedRowKeys.filter(
        //                       (k) =>
        //                           !(keyword ? searchItems : data)
        //                               .map((f) => `${f.id}_${f.sourceId}`)
        //                               .includes(k as string),
        //                   ),
        //                   ...newSelectedRowKeys,
        //               ]
        //             : newSelectedRowKeys
        //         if (res.length > selectedRowKeys.length) {
        //             const newSelected = res.filter(
        //                 (info) => !selectedRowKeys.includes(info),
        //             )
        //             let editErrorItems: React.Key[] = []
        //             newSelected.forEach((a) => {
        //                 const findItem = data?.find(
        //                     (b) => a === `${b.id}_${b.sourceId}`,
        //                 )
        //                 if (
        //                     data?.find(
        //                         (b) =>
        //                             b.alias === findItem?.alias &&
        //                             a !== `${b.id}_${b.sourceId}`,
        //                     )
        //                 ) {
        //                     editErrorItems = [...editErrorItems, a]
        //                 }
        //             })
        //             setData(
        //                 data.map((a) => {
        //                     if (
        //                         editErrorItems.find(
        //                             (b) => b === `${a.id}_${a.sourceId}`,
        //                         )
        //                     ) {
        //                         return {
        //                             ...a,
        //                             editError: FieldErrorType.Repeat,
        //                             beEditing: true,
        //                         }
        //                     }
        //                     return a
        //                 }),
        //             )
        //         }
        //         setSelectedRowKeys(res)
        //     },
        // }

        // 是否显示英文名
        const showEnName = useMemo(() => {
            return columns.includes('enName')
        }, [columns])

        // 预览数据集
        const previewFields = useMemo(
            () =>
                data?.filter((info) =>
                    selectedRowKeys.includes(`${info.id}_${info.sourceId}`),
                ) || [],
            [data, selectedRowKeys],
        )

        useMemo(() => {
            if (keyword) {
                setSearchItems(
                    searchItems.map((info) => {
                        const findItem = data.find(
                            (d) =>
                                `${info.id}_${info.sourceId}` ===
                                `${d.id}_${d.sourceId}`,
                        )
                        if (findItem) {
                            return {
                                ...findItem,
                            }
                        }
                        return info
                    }),
                )
            }
        }, [data])

        useImperativeHandle(ref, () => ({
            getData: () => {
                let resultFields = data?.map((info) => {
                    if (
                        selectedRowKeys.includes(`${info.id}_${info.sourceId}`)
                    ) {
                        return {
                            ...info,
                            checked: true,
                        }
                    }
                    return {
                        ...info,
                        checked: false,
                    }
                })
                const selectedFields = resultFields.filter(
                    (info) => info.checked,
                )
                let errorIndex = -1
                let repeatErrorFields: IFormulaFields[] = []
                selectedFields.forEach((f1) => {
                    if (
                        selectedFields.find(
                            (f2) =>
                                (f2.alias === f1.alias ||
                                    f1.alias.toLowerCase() ===
                                        f2.alias.toLowerCase()) &&
                                `${f1.id}_${f1.sourceId}` !==
                                    `${f2.id}_${f2.sourceId}`,
                        )
                    ) {
                        repeatErrorFields = [...repeatErrorFields, f1]
                    }
                })
                if (repeatErrorFields.length > 0) {
                    resultFields = resultFields.map((info) => {
                        if (
                            repeatErrorFields.find(
                                (f1) =>
                                    `${f1.id}_${f1.sourceId}` ===
                                    `${info.id}_${info.sourceId}`,
                            )
                        ) {
                            return {
                                ...info,
                                editError: FieldErrorType.Repeat,
                                beEditing: true,
                            }
                        }
                        return info
                    })
                    setData(resultFields)
                }
                let overLengthErrorFields: IFormulaFields[] = []
                selectedFields.forEach((info) => {
                    if (info.alias.length > 255) {
                        overLengthErrorFields = [...overLengthErrorFields, info]
                    }
                })
                if (overLengthErrorFields.length > 0) {
                    resultFields = resultFields.map((info) => {
                        if (
                            overLengthErrorFields.find(
                                (f1) =>
                                    `${f1.id}_${f1.sourceId}` ===
                                    `${info.id}_${info.sourceId}`,
                            )
                        ) {
                            return {
                                ...info,
                                editError: FieldErrorType.OverLength,
                                beEditing: true,
                            }
                        }
                        return info
                    })
                    setData(resultFields)
                }
                resultFields.forEach((info, idx) => {
                    if (
                        [...repeatErrorFields, ...overLengthErrorFields].find(
                            (f1) =>
                                `${f1.id}_${f1.sourceId}` ===
                                `${info.id}_${info.sourceId}`,
                        )
                    ) {
                        errorIndex =
                            idx > errorIndex
                                ? errorIndex === -1
                                    ? idx
                                    : errorIndex
                                : idx
                    }
                })
                if (errorIndex >= 0) {
                    document
                        .getElementsByTagName('tr')
                        [errorIndex + 2].scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                            inline: 'start',
                        })
                    return {
                        resultFields: items ? resultFields : undefined,
                        hasError: true,
                    }
                }
                return {
                    resultFields: items
                        ? resultFields.map((info) => {
                              const tempFl = info
                              delete tempFl.editError
                              return { ...tempFl, beEditing: false }
                          })
                        : undefined,
                    hasError: false,
                }
            },
        }))

        const components = {
            body: {
                row: DraggableBodyRow,
            },
        }

        // 移动行
        const moveRow = useCallback(
            (dragIndex: number, hoverIndex: number) => {
                const dragRow = data[dragIndex]
                setData(
                    update(data, {
                        $splice: [
                            [dragIndex, 1],
                            [hoverIndex, 0, dragRow],
                        ],
                    }),
                )
            },
            [data],
        )

        useEffect(() => {
            setKeyword('')
            setSearchItems([])
            setData(items || [])
            setSelectedRowKeys(
                items
                    ?.filter((info) => info?.checked)
                    ?.map((info) => `${info.id}_${info.sourceId}`) || [],
            )
        }, [items])

        // 搜索字段
        const handleSearchField = (kw: string) => {
            if (showEnName) {
                setSearchItems(
                    data?.filter((info) => {
                        const enName =
                            info?.name_en ||
                            fieldsData.data.find((f) => info?.id === f.id)
                                ?.name_en
                        return (
                            info.alias?.includes(kw) ||
                            info.alias?.match(new RegExp(kw, 'ig')) ||
                            enName?.includes(kw) ||
                            enName?.match(new RegExp(kw, 'ig'))
                        )
                    }) || [],
                )
            } else {
                setSearchItems(
                    data?.filter(
                        (info) =>
                            info.alias?.includes(kw) ||
                            info.alias?.match(new RegExp(kw, 'ig')),
                    ) || [],
                )
            }
            setKeyword(kw)
        }

        // 确定修改字段名称
        const handleSureFieldName = (item, value) => {
            let tempData = data.slice()
            if (
                !tempData
                    .filter(
                        (info) =>
                            !(
                                info.id === item.id &&
                                info.sourceId === item.sourceId
                            ),
                    )
                    .every(
                        (info) =>
                            info.alias !== value &&
                            info.alias.toLowerCase() !== value.toLowerCase(),
                    )
            ) {
                tempData = tempData.map((info) => {
                    if (
                        `${info.id}_${info.sourceId}` ===
                        `${item.id}_${item.sourceId}`
                    ) {
                        if (item.alias !== value) {
                            return {
                                ...info,
                                alias: value,
                                editError: FieldErrorType.Repeat,
                                beEditing: true,
                            }
                        }
                        return {
                            ...info,
                            editError: FieldErrorType.Repeat,
                            beEditing: true,
                        }
                    }
                    return info
                })
            } else {
                tempData = tempData.map((info) => {
                    if (
                        `${info.id}_${info.sourceId}` ===
                        `${item.id}_${item.sourceId}`
                    ) {
                        const tempFl = info
                        delete tempFl.editError
                        if (item.alias !== value) {
                            return { ...tempFl, alias: value, beEditing: false }
                        }
                        return { ...tempFl, beEditing: false }
                    }
                    return info
                })
            }
            tempData = tempData.map((a) => {
                const tempFl = a
                const hasRep = !!tempData.find(
                    (b) =>
                        b.alias.toLowerCase() === a.alias.toLowerCase() &&
                        `${a.id}_${a.sourceId}` !== `${b.id}_${b.sourceId}`,
                )
                if (hasRep) {
                    return tempFl
                }
                delete tempFl.editError
                return { ...tempFl, beEditing: false }
            })
            setData(tempData)
        }

        // 字段进入编辑状态
        const handleClickEdit = (item) => {
            setData(
                data.map((info) => {
                    if (
                        `${info.id}_${info.sourceId}` ===
                        `${item.id}_${item.sourceId}`
                    ) {
                        return { ...info, beEditing: true }
                    }
                    return info
                }),
            )
        }

        // 字段改动
        const handleStartChange = (item) => {
            setData(
                data.map((info) => {
                    if (
                        `${info.id}_${info.sourceId}` ===
                        `${item.id}_${item.sourceId}`
                    ) {
                        const tempFl = info
                        delete tempFl.editError
                        return tempFl
                    }
                    return info
                }),
            )
        }

        const totalColumns: ColumnsType<any> = [
            {
                title: __('业务名称'),
                dataIndex: 'alias',
                key: 'alias',
                render: (value, record) => {
                    return (
                        <FieldItem
                            item={record}
                            fieldsData={fieldsData}
                            canDrag={false}
                            hasEdit={false}
                            beEditing={record.beEditing}
                            onChangeFieldName={(val) =>
                                handleSureFieldName(record, val)
                            }
                            onStartEdit={() => handleClickEdit(record)}
                            onStartChange={() => handleStartChange(record)}
                        />
                    )
                },
            },
            {
                title: __('技术名称'),
                dataIndex: 'enName',
                key: 'enName',
                ellipsis: true,
                render: (value, record) =>
                    record?.name_en ||
                    fieldsData.data.find((f) => record?.id === f.id)?.name_en ||
                    '--',
            },
            {
                title: __('来源节点'),
                dataIndex: 'nodeId',
                key: 'nodeId',
                render: (value, record) => (
                    <span
                        className={styles.row_sourceNameWrap}
                        title={
                            preNodes.find((info) => info.id === record.nodeId)
                                ?.data.name
                        }
                    >
                        {preNodes.indexOf(
                            preNodes.find((info) => info.id === record.nodeId),
                        ) === 0 ? (
                            <NodeLeftColored
                                style={{ marginRight: 6, fontSize: 18 }}
                            />
                        ) : (
                            <NodeRightColored
                                style={{ marginRight: 6, fontSize: 18 }}
                            />
                        )}
                        <span className={styles.sourceName}>
                            {
                                preNodes.find(
                                    (info) => info.id === record.nodeId,
                                )?.data.name
                            }
                        </span>
                    </span>
                ),
            },
            {
                title: __('字段原名'),
                dataIndex: 'originName',
                key: 'originName',
                ellipsis: true,
                render: (value, record) =>
                    fieldLabel(
                        fieldsData.dataType.length > 0 &&
                            fieldsData.dataType.find((it) => {
                                return (
                                    it.value_en ===
                                    (record?.data_type ||
                                        fieldsData.data.find(
                                            (a) => a.id === record.id,
                                        )?.data_type)
                                )
                            })?.value,
                        record.originName,
                    ),
            },
            {
                title: __('关联码表'),
                dataIndex: 'dict_id',
                key: 'dict_id',
                ellipsis: true,
                render: (_, record) =>
                    record?.dict_name ||
                    fieldsData.data.find((f) => record?.id === f.id)
                        ?.dict_name ||
                    '--',
            },
        ]

        return (
            <div className={styles.fieldsDragTableWrap}>
                {fetching ? (
                    <Spin className={styles.ldWrap} />
                ) : data && data.length > 0 ? (
                    <DndProvider backend={HTML5Backend}>
                        <Table
                            columns={totalColumns.filter((info) =>
                                columns.includes(info.key),
                            )}
                            dataSource={keyword ? searchItems : data}
                            {...(canDrag
                                ? {
                                      components,
                                      onRow: (record, index) => {
                                          const attr = {
                                              index,
                                              canDrop: !keyword,
                                              canDrag:
                                                  !record.beEditing && !keyword,
                                              moveRow,
                                          }
                                          return attr as React.HTMLAttributes<any>
                                      },
                                  }
                                : {})}
                            rowKey={(record) =>
                                `${record.id}_${record.sourceId}`
                            }
                            // rowSelection={rowSelection}
                            rowClassName={styles.fdt_rowWrap}
                            pagination={false}
                            scroll={{
                                y:
                                    (window.innerHeight - 52) *
                                        (viewSize / 100) -
                                    206,
                            }}
                            locale={{
                                emptyText: <Empty />,
                            }}
                        />
                    </DndProvider>
                ) : (
                    <div
                        style={{
                            textAlign: 'center',
                            marginTop: 56,
                        }}
                    >
                        <Empty desc={__(emptyDesc)} iconSrc={dataEmpty} />
                    </div>
                )}
                <DataOutPreview
                    visible={dataOutVisible}
                    items={previewFields}
                    fieldsData={fieldsData}
                    formulaType={formulaItem?.type}
                    onClose={() => setDataOutVisible(false)}
                />
            </div>
        )
    },
)

export default FieldsDragTable
