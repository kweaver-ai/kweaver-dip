import { FC, useCallback, useEffect, useState } from 'react'
import { Node } from '@antv/x6'
import { Drawer, DrawerProps } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { uniqBy } from 'lodash'
import update from 'immutability-helper'
import __ from '../locale'
import SortDropCard from './SortDropCard'
import styles from './styles.module.less'
import { DragOutlined } from '@/icons'

interface SortFieldsProps extends DrawerProps {
    node: Node
    onClose: () => void
}
const SortFields: FC<SortFieldsProps> = ({
    node,
    onClose,
    getContainer = false,
    ...props
}) => {
    const [fields, setFields] = useState<Array<any>>([])
    // 获取节点数据
    const { data } = node
    // 获取表单信息
    const { formInfo, items } = data

    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => {
        setFields(items)
    }, [items])

    /**
     * 移动字段卡片
     */
    const moveFieldCard = useCallback(
        (draggingIndex, hoverIndex) => {
            if (draggingIndex === undefined) {
                const lessIndex = fields.findIndex((item: any) => item.isMoving)
                const movingData = fields.find((item: any) => item.isMoving)

                setFields(
                    update(fields, {
                        $splice: [
                            [lessIndex, 1],
                            [hoverIndex, 0, movingData],
                        ],
                    }).map((it, index) => ({
                        ...it,
                        index: index + 1,
                    })),
                )
            } else {
                const dragCard = fields[draggingIndex]

                setFields(
                    update(fields, {
                        $splice: [
                            [draggingIndex, 1],
                            [hoverIndex, 0, dragCard],
                        ],
                    }).map((it, index) => ({
                        ...it,
                        index: index + 1,
                    })),
                )
            }
        },
        [fields],
    )

    /**
     * 开始拖拽字段卡片
     */
    const handleStartFieldDrag = useCallback(
        (item) => {
            setFields(
                fields.map((currentData) =>
                    currentData.uniqueId === item.uniqueId
                        ? {
                              ...currentData,
                              isMoving: true,
                              isDragged: true,
                          }
                        : currentData,
                ),
            )
            setIsDragging(true)
        },
        [fields],
    )

    /**
     * 放置行
     */
    const handleDropFields = (dropData) => {
        setFields(
            uniqBy(
                fields.map((currentData) => {
                    if (currentData?.isMoving) {
                        const { isMoving, isDragged, ...movedDropData } = {
                            ...dropData,
                            isMoving: false,
                            isDragged: false,
                        }

                        return movedDropData
                    }
                    if (dropData?.uniqueId === currentData?.uniqueId) {
                        return dropData
                    }
                    return currentData
                }),
                'uniqueId',
            ),
        )
    }

    /**
     * 处理行数据拖拽结束的逻辑
     * 当行数据拖拽结束后，需要更新rowData和columnData的状态，以反映拖拽结果
     */
    const handleDragFieldDataEnd = () => {
        // 更新rowData，移除拖拽状态标记
        setFields(
            // 获取当前的行数据
            fields
                .map((currentData) => {
                    // 如果拖拽的当前数据没有被有效放置，就还原当前数据
                    if (currentData?.isDragged) {
                        const { isMoving, isDragged, ...movedDropData } = {
                            ...currentData,
                            isMoving: false,
                            isDragged: false,
                        }

                        return movedDropData
                    }
                    return currentData
                })
                .filter((currentData, currentIndex) => !currentData?.isMoving),
        )

        // 设置listDragging状态为false，表示不再进行拖拽操作
        setIsDragging(false)
    }

    return (
        <Drawer
            open
            title={null}
            destroyOnClose
            maskClosable={false}
            style={{ position: 'absolute' }}
            contentWrapperStyle={{
                width: '100%',
                boxShadow: 'none',
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 1280,
            }}
            getContainer={getContainer}
            {...props}
        >
            <div className={styles.sortContainer}>
                <div className={styles.title}>
                    <div className={styles.text}>{__('拖动字段进行排序')}</div>
                </div>

                <div className={styles.formWrapper}>
                    <div className={styles.formHeader}>
                        <div className={styles['top-border']} />
                        <div className={styles.formTitle}>
                            <div
                                className={styles.formTitleText}
                                title={formInfo?.name || ''}
                            >
                                <span>{formInfo?.name || ''}</span>
                            </div>
                        </div>
                    </div>
                    <DndProvider backend={HTML5Backend}>
                        <div className={styles.fieldList}>
                            {fields.map((item, index) => (
                                <SortDropCard
                                    index={index}
                                    id={item?.uniqueId}
                                    key={index}
                                    moveCard={moveFieldCard}
                                    onStartDrag={() => {
                                        handleStartFieldDrag(item)
                                    }}
                                    onDropData={handleDropFields}
                                    onEnd={handleDragFieldDataEnd}
                                    itemData={item}
                                    previewNode={
                                        <div className={styles.itemDragWrapper}>
                                            {item?.name}
                                        </div>
                                    }
                                >
                                    {item?.isMoving ? (
                                        <div
                                            className={
                                                styles.itemDraggingWrapper
                                            }
                                        >
                                            <div
                                                className={styles.draggingLine}
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.itemWrapper}>
                                            <div className={styles.fieldIcon}>
                                                <DragOutlined />
                                            </div>
                                            <div className={styles.fieldText}>
                                                {item?.name}
                                            </div>
                                        </div>
                                    )}
                                </SortDropCard>
                            ))}
                        </div>
                    </DndProvider>

                    <div
                        className={styles.saveBtn}
                        onClick={() => {
                            node.replaceData({
                                ...node.data,
                                items: fields.map((item, index) => ({
                                    ...item,
                                })),
                            })
                            onClose()
                        }}
                    >
                        <div>
                            <CheckOutlined />
                        </div>
                        <div>{__('完成排序')}</div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default SortFields
