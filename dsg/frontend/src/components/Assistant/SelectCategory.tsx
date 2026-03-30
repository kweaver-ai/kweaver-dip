import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Select, message } from 'antd'
import __ from './locale'
import {
    getWsCategoryList,
    formatError,
    IWsCategoryItem,
    IWsCategoryListData,
    IAgentItem,
    updateAssistantCategory,
    getAssistantCategoryDetail,
} from '@/core'

const MAX_SELECTED = 5

interface ISelectCategoryProps {
    /** 弹窗是否打开 */
    open: boolean
    /** 关闭弹窗 */
    onClose: () => void
    /** 当前助手 */
    agent: IAgentItem
    /** 保存回调（可选） */
    onSave?: (agent: IAgentItem, categoryIds: string[]) => Promise<void> | void
}

const SelectCategory: React.FC<ISelectCategoryProps> = ({
    open,
    onClose,
    agent,
    onSave,
}) => {
    // 分类原始数据
    const [categoryMap, setCategoryMap] = useState<IWsCategoryListData>({})
    // 内部选中值
    const [innerValue, setInnerValue] = useState<string[]>([])
    // 保存 loading
    const [saving, setSaving] = useState(false)
    // 加载状态
    const [loading, setLoading] = useState(false)

    // 获取分类列表和已关联的分类详情
    const fetchCategoryList = async () => {
        try {
            setLoading(true)
            const agentId = (agent as any).af_agent_id || agent.id
            const res = await Promise.all([
                getWsCategoryList(),
                getAssistantCategoryDetail(agentId),
            ])
            setCategoryMap(res[0]?.data || {})
            const detailList = res[1]?.entries || []
            // 从分类详情中提取 config_id 列表，用于初始化选中值
            const categoryIds = detailList.map((item) => item.config_id)
            setInnerValue(categoryIds)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            fetchCategoryList()
        }
    }, [open, agent])

    // 分组下拉选项（组名为中文 key，不可选）
    const groupedOptions = useMemo(
        () =>
            Object.entries(categoryMap).map(([groupLabel, items]) => ({
                label: groupLabel,
                options: (items as IWsCategoryItem[]).map((item) => ({
                    label: item.config_value,
                    value: item.config_id,
                })),
            })),
        [categoryMap],
    )

    // 扁平化选项用于校验
    const flatOptions = useMemo(() => {
        const list: { label: string; value: string }[] = []
        groupedOptions.forEach((group) => {
            group.options.forEach((opt) => list.push(opt))
        })
        return list
    }, [groupedOptions])

    // 根据当前选中ID列表，过滤出有效的选项，避免接口变更后出现脏数据
    const selectValue = useMemo(
        () =>
            innerValue.filter((id) =>
                flatOptions.some((opt) => opt.value === id),
            ),
        [innerValue, flatOptions],
    )

    // 更新选中值（统一出口）
    const updateValue = (next: string[]) => {
        setInnerValue(next)
    }

    // 处理下拉选择变化（支持多选、清空、删除单个）
    const handleSelectChange = (next: string[]) => {
        // 计算是新增还是删除
        if (next.length > innerValue.length) {
            // 新增场景，限制最多选择 MAX_SELECTED 个
            if (innerValue.length >= MAX_SELECTED) {
                message.warning(__(`最多只能选择${MAX_SELECTED}个分类` as any))
                return
            }
            if (next.length > MAX_SELECTED) {
                message.warning(__(`最多只能选择${MAX_SELECTED}个分类` as any))
                return
            }
        }
        updateValue(next)
    }

    // 保存
    const handleSave = async () => {
        try {
            setSaving(true)
            const agentId = (agent as any).af_agent_id || agent.id
            await updateAssistantCategory(agentId, { category_ids: innerValue })
            if (onSave) {
                await onSave(agent, innerValue)
            }
            message.success(__('分类已更新'))
            onClose()
        } catch (error) {
            formatError(error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            title={__('关联分类')}
            open={open}
            onCancel={onClose}
            maskClosable={false}
            onOk={handleSave}
            confirmLoading={saving}
            destroyOnClose
            width={520}
        >
            {/* 顶部多选输入框 */}
            <Select
                mode="multiple"
                allowClear
                showArrow
                showSearch
                optionFilterProp="label"
                placeholder={__('请选择分类')}
                style={{ width: '100%', marginBottom: 8 }}
                value={selectValue}
                options={groupedOptions}
                onChange={handleSelectChange}
                maxTagCount={MAX_SELECTED}
                loading={loading}
            />
        </Modal>
    )
}

export default SelectCategory
