import { Checkbox } from 'antd'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { XYCoord, useDragDropManager, useDragLayer } from 'react-dnd'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { IFieldMeta } from '.'
import __ from '../../locale'
import BizSelect, { ISelectType } from '../BizSelect'
import DragableItem from './DragableItem'
import FieldItemContent from './FieldItemContent'
import styles from './styles.module.less'
import { OptDimType, useDimConfContext } from './DimConfProvider'

const getItemStyles = (currentOffset: XYCoord | null) => {
    if (!currentOffset) {
        return {
            display: 'none',
        }
    }
    const { x, y } = currentOffset
    return {
        transform: `translate(${x}px, ${y}px)`,
    }
}

/**
 * 空库表
 * @returns
 */
const EmptyView = ({ isSearch }: { isSearch: boolean }) => {
    return (
        <Empty
            style={{ paddingTop: '30px' }}
            iconHeight={100}
            desc={isSearch ? undefined : __('暂无数据')}
            iconSrc={isSearch ? undefined : dataEmpty}
        />
    )
}

/**
 * 事实表字段列表
 * @returns
 */
function FieldDragableList({
    data,
    bindItems,
    handleBind,
}: {
    data: IFieldMeta[]
    bindItems: IFieldMeta[] | undefined
    handleBind: any
}) {
    const { factConf, setDimConf, setFactConf } = useDimConfContext()
    const [checkAll, setCheckAll] = useState(false)
    const [checkedItems, setCheckedItems] = useState<IFieldMeta[]>([])
    const [indeterminate, setIndeterminate] = useState(false)
    // 当前展现列表数据
    const [list, setList] = useState<IFieldMeta[]>(data)
    const [keyword, setKeyword] = useState<string>('')
    const dragDropManager = useDragDropManager()
    const { currentOffset, isDragging, dragItem, isCheckedItem } = useDragLayer(
        (monitor) => {
            const curDragItem = monitor.getItem()
            return {
                currentOffset: monitor.getSourceClientOffset(),
                isDragging: monitor.isDragging(),
                dragItem: curDragItem?.item,
                isCheckedItem: curDragItem?.isChecked,
            }
        },
    )

    const isCheckedId = useCallback(
        (id: string) => checkedItems?.some((o) => o.id === id),
        [checkedItems],
    )

    const isConnectedId = useCallback(
        (id: string) => bindItems?.some((o) => o.factFieldId === id),
        [bindItems],
    )

    useEffect(() => {
        const checkedLen = checkedItems?.length || 0
        const bindLen = bindItems?.length || 0
        const dataLen = data?.length || 0
        const isIndeterminate =
            dataLen !== checkedLen + bindLen && checkedLen !== 0

        setIndeterminate(isIndeterminate)
        setCheckAll(
            dataLen === checkedLen + bindLen &&
                dataLen !== 0 &&
                dataLen !== bindLen,
        )
    }, [checkedItems, bindItems, data])

    const checkedList = useMemo(
        () => data?.filter((o) => isCheckedId(o.id)),
        [checkedItems, data],
    )
    const isDidDrop = dragDropManager.getMonitor().didDrop()

    useEffect(() => {
        if (isDidDrop) {
            if (!isCheckedItem) {
                // 单项拖拽
                const addItem = {
                    factFieldId: dragItem.id,
                    factFieldCNName: dragItem.business_name,
                    factFieldENName: dragItem.technical_name,
                    factFieldType: dragItem.data_type,
                }
                handleBind?.(OptDimType.ADD, addItem)
            } else {
                // 多选拖拽
                const addItems = checkedItems?.map((o) => ({
                    factFieldId: o.id,
                    factFieldCNName: o.business_name,
                    factFieldENName: o.technical_name,
                    factFieldType: o.data_type,
                }))
                handleBind?.(OptDimType.ADD, addItems)
                setCheckedItems([])
            }
        }
    }, [isDidDrop])

    const handleCheckAll = (e: CheckboxChangeEvent) => {
        const isChecked = e.target.checked
        const detachBinds = (data || []).filter((o) => !isConnectedId(o.id))
        setCheckedItems(isChecked ? detachBinds : [])
        setIndeterminate(false)
        setCheckAll(isChecked)
    }

    const handleItemCheck = (isChecked: boolean, item: IFieldMeta) => {
        if (isChecked) {
            if (!isCheckedId(item.id)) {
                setCheckedItems([...checkedItems, item])
            }
        } else {
            const items = checkedItems.filter((o) => o.id !== item.id)
            setCheckedItems(items)
        }
    }

    useEffect(() => {
        if (keyword) {
            const result = data?.filter((o) =>
                o?.business_name?.includes(keyword),
            )
            setList(result)
        } else {
            setList(data)
        }
    }, [keyword, data])

    const handleSelectTable = (item) => {
        const conf = {
            cnName: item.business_name,
            enName: item.table_name,
            // path: `${item.virtual_catalog_name}.${item.schema_name}.${item.table_name}`,
            id: item.id,
        }

        setFactConf(conf)
        setDimConf([])
        setCheckedItems([])
    }

    return (
        <div className={styles['field-dragable']}>
            <div className={styles['field-dragable-choose']}>
                <span className={styles.name}>{__('事实表')}:</span>
                <div>
                    <BizSelect
                        title={__('选择事实表')}
                        type={ISelectType.Fact}
                        placeholder={__('请选择事实表')}
                        selected={factConf}
                        checkedNode={factConf ? { id: factConf.id } : undefined}
                        onSelected={handleSelectTable}
                    />
                </div>
            </div>

            {data?.length !== 0 && (
                <>
                    <div className={styles['field-dragable-search']}>
                        <SearchInput
                            placeholder={__('搜索字段名称')}
                            onChange={(e) => setKeyword(e.target.value)}
                        />
                    </div>

                    <div className={styles['field-dragable-all']}>
                        <Checkbox
                            indeterminate={indeterminate}
                            onChange={handleCheckAll}
                            checked={checkAll}
                            disabled={
                                !list?.length ||
                                data?.length <= (bindItems?.length || 0)
                            }
                        >
                            {__('事实表字段列表')}
                        </Checkbox>
                    </div>
                </>
            )}
            <div className={styles['field-dragable-fields']}>
                <div className={styles['drag-layer']}>
                    <div style={getItemStyles(currentOffset)}>
                        <div className={styles['drag-layer-preview']}>
                            {isCheckedItem ? (
                                <div>
                                    {checkedList?.map((item) => (
                                        <div key={item.id}>
                                            <FieldItemContent
                                                item={item}
                                                checked
                                                connected={false}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div>
                                    {dragItem && (
                                        <div>
                                            <FieldItemContent
                                                item={dragItem}
                                                checked={false}
                                                connected={false}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles['field-dragable-fields-list']}>
                    {list?.length ? (
                        list?.map((item: IFieldMeta) => (
                            <div
                                key={item.id}
                                style={{
                                    opacity:
                                        isDragging &&
                                        (isCheckedItem
                                            ? isCheckedId(item.id)
                                            : dragItem?.id === item.id)
                                            ? 0.4
                                            : 1,
                                    transition: 'opacity 0.2s ease-in-out',
                                }}
                            >
                                <DragableItem
                                    key={item.id}
                                    item={item}
                                    checked={isCheckedId(item.id)}
                                    handleCheck={handleItemCheck}
                                    connected={!!isConnectedId(item.id)}
                                />
                            </div>
                        ))
                    ) : (
                        <EmptyView isSearch={!!keyword} />
                    )}
                </div>
            </div>
        </div>
    )
}

export default memo(FieldDragableList)
