import { Button, Checkbox, message, Modal, Radio, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from 'react-beautiful-dnd'
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'
import { DragOutlined, FontIcon } from '@/icons'
import {
    formatError,
    getApplyScopeConfig,
    saveApplyScopeConfig,
    putCategory,
    ICategoryApplyScopeConfig,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { IconType } from '@/icons/const'

interface IConfigSortNew {
    visible: boolean
    onClose: () => void
    onSure: () => void
}

const SPECIAL_CATEGORY_ID = '00000000-0000-0000-0000-000000000001'
const CATLOG_ID = '00000000-0000-0000-0000-000000000002'

const ConfigSortNew: React.FC<IConfigSortNew> = ({
    visible,
    onClose,
    onSure,
}) => {
    const [loading, setLoading] = useState(false)
    // 左侧类目列表（第一层数据）
    const [categories, setCategories] = useState<ICategoryApplyScopeConfig[]>(
        [],
    )
    // 原始数据备份，用于重置和对比
    const [originalCategories, setOriginalCategories] = useState<
        ICategoryApplyScopeConfig[]
    >([])
    const [fetching, setFetching] = useState(false)
    const [activeCateId, setActiveCateId] = useState<string>()

    // 展开/收起状态（默认全部展开）
    const [expandedKeys, setExpandedKeys] = useState<string[]>([])

    // 当前类目是否有修改（用于控制保存按钮的禁用状态）
    const [hasChanges, setHasChanges] = useState(false)
    const [{ using }, updateUsing] = useGeneralConfig()

    useEffect(() => {
        if (visible) {
            refreshData()
        }
    }, [visible])

    const refreshData = async () => {
        try {
            setFetching(true)
            const res = await getApplyScopeConfig()
            const list = res.categories || []
            // 深拷贝数据
            setCategories(JSON.parse(JSON.stringify(list)))
            setOriginalCategories(JSON.parse(JSON.stringify(list)))

            // 默认选中第一项
            const first = list[0]
            if (first) {
                setActiveCateId(first.id)
                // 默认展开所有模块
                const keys = first.modules?.map((m) => m.apply_scope_id) || []
                setExpandedKeys(keys)
            }
            setHasChanges(false)
        } catch (err) {
            formatError(err)
        } finally {
            setFetching(false)
        }
    }

    // 拖拽完成后，重排左侧类目
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return
        const from = result.source.index
        const to = result.destination.index
        if (from === to) return

        // 保存拖拽前的顺序（用于失败时恢复）
        const previousOrder = categories.slice()

        // 更新前端状态
        const updatedCategories = categories.slice()
        const [moved] = updatedCategories.splice(from, 1)
        updatedCategories.splice(to, 0, moved)
        setCategories(updatedCategories)

        // 立即保存排序
        try {
            const sortParams = updatedCategories.map((category, index) => ({
                id: category.id,
                index: index + 1, // 索引从 1 开始
            }))
            await putCategory(sortParams)
            message.success(__('排序保存成功'))
        } catch (error) {
            formatError(error)
            // 如果保存失败，恢复拖拽前的顺序
            setCategories(previousOrder)
        }
    }

    // 获取当前激活的类目
    const activeCate = categories.find((item) => item.id === activeCateId)

    // 切换激活类目时，展开其所有模块，并重置当前类目的未保存修改
    const handleCateClick = (cateId: string) => {
        // 如果切换到其他类目，重置当前类目的修改
        if (activeCateId && activeCateId !== cateId) {
            const originalCate = originalCategories.find(
                (c) => c.id === activeCateId,
            )
            if (originalCate) {
                setCategories((prev) =>
                    prev.map((c) =>
                        c.id === activeCateId
                            ? JSON.parse(JSON.stringify(originalCate))
                            : c,
                    ),
                )
            }
        }

        setActiveCateId(cateId)
        const cate = categories.find((c) => c.id === cateId)
        if (cate) {
            const keys = cate.modules?.map((m) => m.apply_scope_id) || []
            setExpandedKeys(keys)
        }
        setHasChanges(false)
    }

    const isSpecialCate = activeCateId === SPECIAL_CATEGORY_ID

    // 检查当前类目是否有变化
    const checkHasChanges = (
        updatedCategories: ICategoryApplyScopeConfig[],
    ) => {
        if (!activeCateId) {
            setHasChanges(false)
            return
        }

        const currentCate = updatedCategories.find((c) => c.id === activeCateId)
        const originalCate = originalCategories.find(
            (c) => c.id === activeCateId,
        )

        if (!currentCate || !originalCate) {
            setHasChanges(false)
            return
        }

        // 深度对比两个对象是否相同
        const hasChanged =
            JSON.stringify(currentCate.modules) !==
            JSON.stringify(originalCate.modules)
        setHasChanges(hasChanged)
    }

    // 处理模块（二层）勾选变化
    const handleModuleCheck = (moduleId: string, checked: boolean) => {
        if (isSpecialCate) return
        setCategories((prev) => {
            const updated = prev.map((cate) => {
                if (cate.id !== activeCateId) return cate
                return {
                    ...cate,
                    modules: cate.modules?.map((module) => {
                        if (module.apply_scope_id !== moduleId) return module

                        // 如果是取消勾选父节点，同时取消所有子节点
                        if (!checked) {
                            return {
                                ...module,
                                selected: false,
                                trees: module.trees?.map((tree) => ({
                                    ...tree,
                                    nodes: tree.nodes?.map((node) => ({
                                        ...node,
                                        selected: false,
                                    })),
                                })),
                            }
                        }

                        // 勾选父节点时，只更新父节点状态，不影响子节点
                        return {
                            ...module,
                            selected: checked,
                        }
                    }),
                }
            })
            checkHasChanges(updated)
            return updated
        })
    }

    // 处理模块（二层）必填变化
    const handleModuleRequiredChange = (
        moduleId: string,
        required: boolean,
    ) => {
        if (isSpecialCate) return
        setCategories((prev) => {
            const updated = prev.map((cate) => {
                if (cate.id !== activeCateId) return cate
                return {
                    ...cate,
                    modules: cate.modules?.map((module) =>
                        module.apply_scope_id === moduleId
                            ? { ...module, required }
                            : module,
                    ),
                }
            })
            checkHasChanges(updated)
            return updated
        })
    }

    // 处理树节点（三层）勾选变化
    const handleTreeNodeCheck = (
        moduleId: string,
        treeKey: string,
        nodeId: string,
        checked: boolean,
    ) => {
        if (isSpecialCate) return
        setCategories((prev) => {
            const updated = prev.map((cate) => {
                if (cate.id !== activeCateId) return cate
                return {
                    ...cate,
                    modules: cate.modules?.map((module) => {
                        if (module.apply_scope_id !== moduleId) return module

                        // 更新子节点
                        const updatedTrees = module.trees?.map((tree) => {
                            if (tree.key !== treeKey) return tree
                            return {
                                ...tree,
                                nodes: tree.nodes?.map((node) =>
                                    node.id === nodeId
                                        ? { ...node, selected: checked }
                                        : node,
                                ),
                            }
                        })

                        // 检查是否有任意子节点被勾选
                        const hasSelectedNode = updatedTrees?.some((tree) =>
                            tree.nodes?.some((node) => node.selected),
                        )

                        // 如果有任意子节点被勾选，自动勾选父节点
                        return {
                            ...module,
                            selected: hasSelectedNode || false,
                            trees: updatedTrees,
                        }
                    }),
                }
            })
            checkHasChanges(updated)
            return updated
        })
    }

    // 保存当前类目的应用范围配置
    const handleSave = async () => {
        if (!activeCateId || isSpecialCate) return

        const currentCate = categories.find((c) => c.id === activeCateId)
        if (!currentCate || !currentCate.modules) return

        try {
            setLoading(true)

            // 构造保存数据：将所有 modules 转换为 items 数组
            const items = currentCate.modules.map((module) => ({
                apply_scope_id: module.apply_scope_id,
                selected: module.selected,
                required: module.required,
                trees: module.trees || [],
            }))

            // 调用保存接口，一次性保存所有 modules
            await saveApplyScopeConfig(activeCateId, { items })

            // 保存成功后，更新原始数据
            setOriginalCategories((prev) =>
                prev.map((c) =>
                    c.id === activeCateId
                        ? JSON.parse(JSON.stringify(currentCate))
                        : c,
                ),
            )
            setHasChanges(false)
            message.success(__('保存成功'))
            onClose()
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button style={{ marginRight: 12, width: 80 }} onClick={onClose}>
                {__('取消')}
            </Button>
            {!isSpecialCate && (
                <Button
                    style={{ width: 80 }}
                    type="primary"
                    loading={loading}
                    disabled={!hasChanges}
                    onClick={handleSave}
                >
                    {__('保存')}
                </Button>
            )}
        </div>
    )

    return (
        <Modal
            title={__('配置')}
            width={785}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            onOk={onSure}
            destroyOnClose
            getContainer={false}
            bodyStyle={{ padding: 0 }}
            footer={footer}
        >
            <div className={styles.configSortNew}>
                <div className={styles.leftPane}>
                    <div className={styles.header}>{__('类目管理')}</div>
                    <div className={styles.list}>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="cate-list">
                                {(dropProvided) => (
                                    <div
                                        ref={dropProvided.innerRef}
                                        {...dropProvided.droppableProps}
                                    >
                                        {categories.map((item, index) => (
                                            <Draggable
                                                key={String(item.id)}
                                                draggableId={String(item.id)}
                                                index={index}
                                            >
                                                {(dragProvided) => (
                                                    <div
                                                        ref={
                                                            dragProvided.innerRef
                                                        }
                                                        {...dragProvided.draggableProps}
                                                        className={styles.item}
                                                        onClick={() =>
                                                            handleCateClick(
                                                                item.id,
                                                            )
                                                        }
                                                        style={{
                                                            background:
                                                                activeCateId ===
                                                                item.id
                                                                    ? '#f0f5ff'
                                                                    : undefined,
                                                            ...dragProvided
                                                                .draggableProps
                                                                .style,
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.itemName
                                                            }
                                                            title={item.name}
                                                        >
                                                            {item.name}
                                                        </div>
                                                        <DragOutlined
                                                            className={
                                                                styles.itemIcon
                                                            }
                                                            {...dragProvided.dragHandleProps}
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {dropProvided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
                <div className={styles.rightPane}>
                    <div className={styles.content}>
                        {/* 表头 */}
                        <div className={styles.configHeader}>
                            <div className={styles.colName}>
                                {__('应用范围')}
                            </div>
                        </div>

                        {/* 树形列表：二层为 modules，三层为 trees 的 nodes */}
                        <div className={styles.configBody}>
                            {activeCate?.modules
                                ?.filter((module) =>
                                    using === 2
                                        ? module.apply_scope_id !== CATLOG_ID
                                        : true,
                                )
                                ?.map((module) => {
                                    const isExpanded = expandedKeys.includes(
                                        module.apply_scope_id,
                                    )

                                    return (
                                        <div key={module.apply_scope_id}>
                                            {/* 父节点行（二层：Module） */}
                                            <div className={styles.configRow}>
                                                <div
                                                    className={styles.parentRow}
                                                >
                                                    <div
                                                        className={
                                                            styles.parentLeft
                                                        }
                                                    >
                                                        <span
                                                            className={
                                                                styles.expandIcon
                                                            }
                                                            onClick={() => {
                                                                setExpandedKeys(
                                                                    (prev) =>
                                                                        isExpanded
                                                                            ? prev.filter(
                                                                                  (
                                                                                      k,
                                                                                  ) =>
                                                                                      k !==
                                                                                      module.apply_scope_id,
                                                                              )
                                                                            : [
                                                                                  ...prev,
                                                                                  module.apply_scope_id,
                                                                              ],
                                                                )
                                                            }}
                                                        >
                                                            {isExpanded ? (
                                                                <CaretDownOutlined />
                                                            ) : (
                                                                <CaretRightOutlined />
                                                            )}
                                                        </span>
                                                        <Checkbox
                                                            checked={
                                                                module.selected
                                                            }
                                                            onChange={(e) =>
                                                                handleModuleCheck(
                                                                    module.apply_scope_id,
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            disabled={
                                                                isSpecialCate
                                                            }
                                                        />
                                                        <span
                                                            className={
                                                                styles.parentName
                                                            }
                                                        >
                                                            {module.name}
                                                        </span>
                                                        <Tooltip
                                                            title={__(
                                                                '勾选后，在创建/编辑页面会展示',
                                                            )}
                                                        >
                                                            <FontIcon
                                                                name="icon-bangzhu"
                                                                type={
                                                                    IconType.FONTICON
                                                                }
                                                                className={
                                                                    styles.helpIcon
                                                                }
                                                            />
                                                        </Tooltip>
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.parentRight
                                                        }
                                                    >
                                                        <Radio.Group
                                                            value={
                                                                module.required
                                                                    ? 'req'
                                                                    : 'opt'
                                                            }
                                                            onChange={(e) =>
                                                                handleModuleRequiredChange(
                                                                    module.apply_scope_id,
                                                                    e.target
                                                                        .value ===
                                                                        'req',
                                                                )
                                                            }
                                                            disabled={
                                                                isSpecialCate
                                                            }
                                                        >
                                                            <Radio value="req">
                                                                {__('必填')}
                                                            </Radio>
                                                            <Radio value="opt">
                                                                {__('非必填')}
                                                            </Radio>
                                                        </Radio.Group>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 子节点列表（三层：Trees 的 Nodes） */}
                                            {isExpanded &&
                                                module.trees?.map((tree) =>
                                                    tree.nodes?.map((node) => (
                                                        <div
                                                            className={
                                                                styles.configRowChild
                                                            }
                                                            key={node.id}
                                                        >
                                                            <div
                                                                className={
                                                                    styles.colName
                                                                }
                                                            >
                                                                <span
                                                                    className={
                                                                        styles.childIndent
                                                                    }
                                                                />
                                                                <Checkbox
                                                                    checked={
                                                                        node.selected
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleTreeNodeCheck(
                                                                            module.apply_scope_id,
                                                                            tree.key,
                                                                            node.id,
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSpecialCate
                                                                    }
                                                                />
                                                                <span
                                                                    className={
                                                                        styles.childName
                                                                    }
                                                                >
                                                                    {node.name}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={
                                                                    styles.colCheck
                                                                }
                                                            />
                                                            <div
                                                                className={
                                                                    styles.colRequired
                                                                }
                                                            />
                                                        </div>
                                                    )),
                                                )}
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ConfigSortNew
