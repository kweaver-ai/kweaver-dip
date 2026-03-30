import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Modal, Popover, Switch, Table, Tooltip } from 'antd'
import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ColumnsType } from 'antd/es/table'
import __ from './locale'
import {
    ICategoryItem,
    formatError,
    getApplyScope,
    getCategory,
    putCategory,
} from '@/core'
import styles from './styles.module.less'
import { DragOutlined, InfotipOutlined } from '@/icons'

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    'data-row-key': string
}

const Row = ({ children, ...props }: RowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: props['data-row-key'],
    })

    const style: React.CSSProperties = {
        ...props.style,
        transform: CSS.Transform.toString(
            transform && { ...transform, scaleY: 1 },
        ),
        transition,
        ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
    }

    return (
        <tr {...props} ref={setNodeRef} style={style} {...attributes}>
            {React.Children.map(children, (child) => {
                if ((child as React.ReactElement).key === 'sort') {
                    return React.cloneElement(child as React.ReactElement, {
                        children: (
                            <div
                                ref={setActivatorNodeRef}
                                style={{
                                    touchAction: 'none',
                                    cursor: 'move',
                                }}
                                {...listeners}
                            >
                                <DragOutlined
                                    style={{
                                        marginLeft: '20px',
                                        color: 'rgb(0 0 0 / 65%)',
                                        fontSize: '16px',
                                    }}
                                />
                            </div>
                        ),
                    })
                }
                return child
            })}
        </tr>
    )
}

interface IConfigSort {
    // 显示/隐藏
    visible: boolean
    // 类目集
    items: ICategoryItem[]
    onClose: () => void
    onSure: () => void
}

/**
 * 类目排序
 */
const ConfigSort: React.FC<IConfigSort> = ({
    visible,
    items,
    onClose,
    onSure,
}) => {
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [categorys, setCategorys] = useState<ICategoryItem[]>(items)
    const [applyScopeOptions, setApplyScopeOptions] = useState<
        {
            value: string
            label: string
        }[]
    >([
        {
            value: 'b633b90a-b440-4f7b-9b9c-9746b01dd143',
            label: '接口服务',
        },
    ])

    useEffect(() => {
        if (visible) {
            setCategorys(items)
            getApplyScopeData()
        }
    }, [visible])

    const refreshCategorys = async () => {
        try {
            setFetching(true)
            const { entries } = await getCategory({})
            setCategorys(entries || [])
        } catch (err) {
            formatError(err)
        } finally {
            setFetching(false)
        }
    }

    /**
     * 获取应用范围
     */
    const getApplyScopeData = async () => {
        try {
            const res = await getApplyScope()
            setApplyScopeOptions(
                res.map((item) => ({
                    value: item.id,
                    label: item.name,
                })),
            )
        } catch (err) {
            formatError(err)
        }
    }

    const handleModalOk = async () => {
        try {
            setLoading(true)
            await putCategory(
                categorys.map((info, index) => ({
                    id: info.id,
                    index: index + 1,
                    required: info.required,
                    apply_scope_info: info.apply_scope_info,
                })),
            )
            onSure()
            onClose()
        } catch (e) {
            formatError(e)
            refreshCategorys()
        } finally {
            setLoading(false)
        }
    }

    const handleDragStart = (ev: DragStartEvent) => {
        // document.body.style.setProperty('cursor', 'grabbing')
    }

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        // document.body.style.setProperty('cursor', '')
        if (over && active.id !== over.id) {
            setCategorys((previous) => {
                const activeIndex = previous.findIndex(
                    (i) => i.id === active.id,
                )
                const overIndex = previous.findIndex((i) => i.id === over?.id)
                return arrayMove(previous, activeIndex, overIndex)
            })
        }
    }

    const columns: ColumnsType<any> = [
        {
            key: 'sort',
            width: 160,
            title: (
                <div>
                    {__('拖拽排序')}
                    <Popover
                        content={__('排序同时生效于数据资源目录管理及服务超市')}
                        placement="bottom"
                    >
                        <InfotipOutlined
                            style={{
                                cursor: 'pointer',
                                marginLeft: '4px',
                            }}
                        />
                    </Popover>
                </div>
            ),
        },
        {
            title: __('类目名称'),
            ellipsis: true,
            dataIndex: 'name',
        },
        {
            title: (
                <span>
                    {__('是否必选')}
                    <Popover
                        content={__(
                            '将类目设置为必填项后，该类目在后续的应用中将成为必须填写的内容。',
                        )}
                        placement="bottom"
                    >
                        <InfotipOutlined
                            style={{
                                cursor: 'pointer',
                                marginLeft: '4px',
                            }}
                        />
                    </Popover>
                </span>
            ),
            dataIndex: 'required',
            width: 200,
            render: (value, record) => (
                <div>
                    <Switch
                        title={value ? __('是') : __('否')}
                        checked={value}
                        onChange={(checked) => {
                            setCategorys(
                                categorys.map((info) => ({
                                    ...info,
                                    required:
                                        record.id === info.id
                                            ? checked
                                            : info.required,
                                })),
                            )
                        }}
                    />
                </div>
            ),
        },
        {
            title: __('应用范围'),
            dataIndex: 'apply_scope_info',
            width: 350,
            render: (value, record) =>
                record.type === 'system' ? (
                    '--'
                ) : (
                    <div>
                        <Checkbox.Group
                            options={applyScopeOptions}
                            value={
                                record?.apply_scope_info?.map((i) => i.id) || []
                            }
                            onChange={(checkedValues) => {
                                const newApplyScopeInfo = checkedValues.map(
                                    (v) => ({
                                        id: v,
                                        name: applyScopeOptions.find(
                                            (o) => o.value === v,
                                        )?.label,
                                    }),
                                )
                                const newCategorys = categorys.map((info) => ({
                                    ...info,
                                    apply_scope_info:
                                        record.id === info.id
                                            ? newApplyScopeInfo
                                            : info.apply_scope_info,
                                }))
                                setCategorys(newCategorys as ICategoryItem[])
                            }}
                        />
                    </div>
                ),
        },
    ]

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button style={{ marginRight: 12, width: 80 }} onClick={onClose}>
                {__('取消')}
            </Button>
            <Button
                style={{ width: 80 }}
                type="primary"
                loading={loading}
                onClick={handleModalOk}
            >
                {__('确定')}
            </Button>
        </div>
    )

    return (
        <Modal
            title={__('配置')}
            width={960}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            onOk={handleModalOk}
            destroyOnClose
            getContainer={false}
            bodyStyle={{ padding: '16px 24px 24px' }}
            footer={footer}
        >
            <DndContext
                modifiers={[restrictToVerticalAxis]}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={categorys.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <Table
                        components={{
                            body: {
                                row: Row,
                            },
                        }}
                        rowKey="id"
                        columns={columns}
                        dataSource={categorys}
                        pagination={false}
                        loading={fetching}
                    />
                </SortableContext>
            </DndContext>
        </Modal>
    )
}

export default ConfigSort
