import { FC, useEffect, useRef } from 'react'
import classnames from 'classnames'
import { Input, Select, Space } from 'antd'
import { useGetState } from 'ahooks'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import __ from './locale'
import styles from './styles.module.less'
import { DragOutlined } from '@/icons'
import { FormTableKind } from '../Forms/const'
import { DestRuleOptions } from './const'
import { FieldTypeIcon, getCommonDataType } from '@/core'

interface IDragItemListModel {
    data: Array<any>
    onDragged: (newData: Array<any>) => void
    formType: FormTableKind
    model: string
    onSelect: (item: any) => void
    selectedFieldId: string
}

interface IDragItemModel {
    itemInfo: any
    index: number
    changePosition: (
        dragIndex: string | number,
        hoverIndex: string | number,
    ) => void

    onDrop: () => void
    formType: FormTableKind
    model: string
}

const DragItem: FC<IDragItemModel> = ({
    itemInfo,
    index,
    changePosition,
    onDrop,
    formType,
    model,
}) => {
    const ref = useRef(null)
    const [, drop] = useDrop({
        accept: 'DragDropBox',
        hover: (item: any, monitor) => {
            if (!ref.current) return
            const dragIndex = item.index
            const hoverIndex = index
            if (dragIndex === hoverIndex) return // 如果回到自己的坑，那就什么都不做
            changePosition(dragIndex, hoverIndex) // 调用传入的方法完成交换
        },
        drop: (item, monitor) => {
            onDrop()
        },
    })

    const [{ isDragging }, drag] = useDrag({
        type: 'DragDropBox',
        item: { ...itemInfo, index },
        end: () => {},
        isDragging: (monitor) => {
            return index === monitor.getItem().index
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    })

    return (
        <div
            ref={model === 'view' ? ref : (drag(drop(ref)) as any)} // 这样写可以让它即接收拖拽又实现拖拽
            style={{
                opacity: isDragging ? 0.3 : 1,
            }}
            className={styles.dragItemBox}
        >
            <div className={styles.contextContainer}>
                <Space size={4}>
                    <span className={styles.itemShrink}>
                        <DragOutlined />
                    </span>
                    <span className={styles.itemShrink}>
                        <FieldTypeIcon
                            dataType={getCommonDataType(itemInfo.data_type)}
                            style={{
                                color: 'rgba(0, 0, 0, 0.65)',
                            }}
                        />
                    </span>
                    <span
                        title={itemInfo.business_name}
                        className={styles.text}
                    >
                        {itemInfo.business_name}
                    </span>
                </Space>
            </div>
        </div>
    )
}
const DragItemList: FC<IDragItemListModel> = ({
    data,
    onDragged,
    onSelect,
    formType,
    model,
    selectedFieldId,
}) => {
    const [dataList, setDataList, getDataList] = useGetState<Array<any>>([])

    useEffect(() => {
        setDataList(data)
    }, [data])
    const changePosition = (
        dragIndex: string | number,
        hoverIndex: string | number,
    ) => {
        const newData = dataList.slice()
        const temp = data[dragIndex]
        // 交换位置
        newData[dragIndex] = data[hoverIndex]
        newData[hoverIndex] = temp
        setDataList(newData)
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={styles.dragListContainer}>
                {getDataList().map((item, index) => (
                    <div
                        className={classnames(styles.dragItemContainer, {
                            [styles.selected]:
                                selectedFieldId === item.field_id,
                        })}
                        onClick={() => {
                            onSelect(item)
                        }}
                    >
                        <DragItem
                            itemInfo={item}
                            index={index}
                            changePosition={changePosition}
                            onDrop={() => {
                                onDragged(getDataList())
                            }}
                            formType={formType}
                            model={model}
                        />
                    </div>
                ))}
            </div>
        </DndProvider>
    )
}

export default DragItemList
